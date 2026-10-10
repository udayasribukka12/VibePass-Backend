
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./App.css";

const BOOKING_API = "http://localhost:8080/api/bookings";

function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function MyBookings({ user }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [qrCodes, setQrCodes] = useState({});
    const [qrLoading, setQrLoading] = useState({});
    const [payingId, setPayingId] = useState(null);

    async function loadBookings() {
        if (!user?.id) {
            setBookings([]);
            setError("Please log in to view your bookings.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("vibepassToken");

            const response = await axios.get(
                `${BOOKING_API}/user/${user.id}`,
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {}
                }
            );

            setBookings(
                Array.isArray(response.data) ? response.data : []
            );
        } catch (err) {
            console.error("Load bookings failed:", err);
            setError(
                err.response
                    ? `Unable to load bookings. Status: ${err.response.status}`
                    : "Cannot connect to the backend. Check that Spring Boot is running."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadBookings();
    }, [user?.id]);

    async function payNow(booking) {
        if (!window.confirm(
            "This is a demo payment only. No real money will be charged. Continue?"
        )) {
            return;
        }

        setPayingId(booking.id);
        setMessage("");

        try {
            const token = localStorage.getItem("vibepassToken");

            const response = await axios.post(
                `${BOOKING_API}/${booking.id}/demo-payment`,
                {},
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {}
                }
            );

            setMessage(
                response.data?.message ||
                "Demo payment completed successfully."
            );

            await loadBookings();
        } catch (err) {
            console.error("Demo payment failed:", err);
            setMessage(
                err.response?.data?.message ||
                err.response?.data?.error ||
                (err.response
                    ? `Demo payment failed. Status: ${err.response.status}`
                    : "Cannot connect to the backend.")
            );
        } finally {
            setPayingId(null);
        }
    }

    async function showQrCode(bookingId) {
        if (qrCodes[bookingId]) {
            setQrCodes(previous => {
                const updated = { ...previous };
                delete updated[bookingId];
                return updated;
            });
            return;
        }

        setQrLoading(previous => ({
            ...previous,
            [bookingId]: true
        }));
        setMessage("");

        try {
            const token = localStorage.getItem("vibepassToken");

            const response = await axios.get(
                `${BOOKING_API}/${bookingId}/qr`,
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {}
                }
            );

            const data = response.data;
            const base64 = data.qrCodeBase64;

            if (!base64) {
                throw new Error("The server did not return QR image data.");
            }

            const mimeType = data.mimeType || "image/png";

            setQrCodes(previous => ({
                ...previous,
                [bookingId]: {
                    image: `data:${mimeType};base64,${base64}`,
                    ticketReference: data.ticketReference || "",
                    bookingStatus: data.bookingStatus || "CONFIRMED"
                }
            }));
        } catch (err) {
            console.error("QR generation failed:", err);
            setMessage(
                err.response
                    ? `Unable to load QR code. Status: ${err.response.status}`
                    : err.message || "Cannot connect to the backend."
            );
        } finally {
            setQrLoading(previous => ({
                ...previous,
                [bookingId]: false
            }));
        }
    }

    async function cancelBooking(id) {
        if (!window.confirm("Are you sure you want to cancel this booking?")) {
            return;
        }

        try {
            const token = localStorage.getItem("vibepassToken");

            await axios.put(
                `${BOOKING_API}/${id}/cancel`,
                {},
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {}
                }
            );

            setMessage("Booking cancelled successfully.");

            setQrCodes(previous => {
                const updated = { ...previous };
                delete updated[id];
                return updated;
            });

            await loadBookings();
        } catch (err) {
            console.error("Cancellation failed:", err);
            setMessage(
                err.response
                    ? `Cancellation failed. Status: ${err.response.status}`
                    : "Cannot connect to the backend."
            );
        }
    }

    function printTicket(booking) {
        const printWindow = window.open(
            "",
            "_blank",
            "width=800,height=700"
        );

        if (!printWindow) {
            setMessage("Please allow pop-ups to print your ticket.");
            return;
        }

        const status = booking.bookingStatus || "CONFIRMED";
        const cancelled = status.toUpperCase() === "CANCELLED";
        const qr = qrCodes[booking.id];

        const qrHtml = !cancelled && qr
            ? `
                <div class="qr-section">
                    <h3>Scan Your Ticket</h3>
                    <img
                        class="qr-image"
                        src="${escapeHtml(qr.image)}"
                        alt="VibePass ticket QR code"
                    />
                    <p>${escapeHtml(qr.ticketReference)}</p>
                </div>
            `
            : "";

        const ticketHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>VibePass Ticket #${escapeHtml(booking.id)}</title>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: #f4f5f9;
                        padding: 24px;
                        color: #222;
                    }
                    .ticket {
                        max-width: 600px;
                        margin: 20px auto;
                        padding: 28px;
                        background: white;
                        border: 2px dashed #6c4cff;
                        border-radius: 18px;
                    }
                    .brand {
                        color: #6c4cff;
                        font-size: 28px;
                        font-weight: bold;
                    }
                    .subtitle {
                        color: #666;
                        letter-spacing: 2px;
                        font-size: 12px;
                    }
                    .status {
                        display: inline-block;
                        padding: 8px 12px;
                        border-radius: 20px;
                        background: ${cancelled ? "#fee2e2" : "#dcfce7"};
                        color: ${cancelled ? "#991b1b" : "#166534"};
                        font-weight: bold;
                    }
                    .detail {
                        border-bottom: 1px solid #eee;
                        padding: 12px 0;
                    }
                    .label {
                        display: block;
                        color: #666;
                        font-size: 12px;
                        margin-bottom: 5px;
                    }
                    .value {
                        font-weight: bold;
                        overflow-wrap: anywhere;
                    }
                    .qr-section {
                        text-align: center;
                        margin-top: 24px;
                        padding: 16px;
                        border-top: 1px solid #eee;
                    }
                    .qr-image {
                        width: 200px;
                        height: 200px;
                        object-fit: contain;
                    }
                    @media print {
                        body { background: white; padding: 0; }
                        .ticket { margin: 0 auto; }
                        .print-button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="ticket">
                    <div class="brand">VibePass.</div>
                    <p class="subtitle">DIGITAL EVENT TICKET</p>
                    <hr>
                    <h1>${escapeHtml(booking.eventName || "Event")}</h1>
                    <p class="status">${escapeHtml(status)}</p>

                    <div class="detail">
                        <span class="label">BOOKING REFERENCE</span>
                        <span class="value">VP-${escapeHtml(booking.id)}</span>
                    </div>
                    <div class="detail">
                        <span class="label">CITY</span>
                        <span class="value">${escapeHtml(booking.eventCity || "Not available")}</span>
                    </div>
                    <div class="detail">
                        <span class="label">VENUE</span>
                        <span class="value">${escapeHtml(booking.eventVenue || "Not available")}</span>
                    </div>
                    <div class="detail">
                        <span class="label">EVENT DATE</span>
                        <span class="value">${escapeHtml(formatDate(booking.eventDate))}</span>
                    </div>
                    <div class="detail">
                        <span class="label">TICKET PRICE</span>
                        <span class="value">₹${escapeHtml(booking.ticketPrice ?? 0)}</span>
                    </div>

                    ${qrHtml}

                    <p>Thank you for choosing VibePass!</p>
                    ${cancelled
            ? "<p>This booking has been cancelled. It is not valid for entry.</p>"
            : ""}
                    <button class="print-button" onclick="window.print()">
                        Print Ticket
                    </button>
                </div>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(ticketHtml);
        printWindow.document.close();

        printWindow.onload = () => {
            const images = Array.from(printWindow.document.images);

            Promise.all(
                images.map(image => {
                    if (image.complete) return Promise.resolve();

                    return new Promise(resolve => {
                        image.onload = resolve;
                        image.onerror = resolve;
                    });
                })
            ).then(() => printWindow.focus());
        };
    }

    return (
        <div className="my-bookings-page">
            <header className="my-bookings-header">
                <div>
                    <p className="section-label">YOUR EXPERIENCES</p>
                    <h1>My Bookings 🎟️</h1>
                    <p>Manage your bookings and digital tickets in one place.</p>
                </div>

                <Link className="my-bookings-back" to="/dashboard">
                    ← Back to Dashboard
                </Link>
            </header>

            {message && (
                <div className="my-bookings-message" role="status">
                    {message}
                    <button
                        type="button"
                        onClick={() => setMessage("")}
                        aria-label="Dismiss message"
                    >
                        ✕
                    </button>
                </div>
            )}

            {loading && (
                <div className="empty-bookings">
                    Loading your bookings...
                </div>
            )}

            {!loading && error && (
                <div className="empty-bookings">
                    <h2>Unable to load bookings</h2>
                    <p>{error}</p>
                    <button type="button" onClick={loadBookings}>
                        Try Again
                    </button>
                </div>
            )}

            {!loading && !error && bookings.length === 0 && (
                <div className="empty-bookings">
                    <div className="empty-bookings-icon">🎫</div>
                    <h2>No bookings yet</h2>
                    <p>Your next memorable experience is waiting for you.</p>
                    <Link className="my-bookings-explore" to="/events">
                        Explore Events
                    </Link>
                </div>
            )}

            {!loading && !error && bookings.length > 0 && (
                <>
                    <div className="booking-summary">
                        <div className="booking-summary-card">
                            <span>Total Bookings</span>
                            <h2>{bookings.length}</h2>
                        </div>

                        <div className="booking-summary-card">
                            <span>Confirmed</span>
                            <h2>
                                {bookings.filter(
                                    booking =>
                                        (booking.bookingStatus || "CONFIRMED")
                                            .toUpperCase() === "CONFIRMED"
                                ).length}
                            </h2>
                        </div>

                        <div className="booking-summary-card">
                            <span>Cancelled</span>
                            <h2>
                                {bookings.filter(
                                    booking =>
                                        (booking.bookingStatus || "")
                                            .toUpperCase() === "CANCELLED"
                                ).length}
                            </h2>
                        </div>
                    </div>

                    <h2 className="booking-section-title">
                        Your Digital Tickets
                    </h2>

                    <div className="booking-list">
                        {bookings.map(booking => {
                            const status = (
                                booking.bookingStatus || "CONFIRMED"
                            ).toUpperCase();

                            const cancelled = status === "CANCELLED";
                            const qr = qrCodes[booking.id];
                            const paid = (
                                booking.paymentStatus || "UNPAID"
                            ).toUpperCase() === "PAID";

                            return (
                                <article
                                    className="booking-card digital-ticket"
                                    key={booking.id}
                                >
                                    <div className="booking-card-top">
                                        <span className="booking-id">
                                            TICKET VP-{booking.id}
                                        </span>

                                        <span
                                            className={
                                                "booking-status " +
                                                (cancelled
                                                    ? "status-cancelled"
                                                    : "status-confirmed")
                                            }
                                        >
                                            {status}
                                        </span>
                                    </div>

                                    <h2>{booking.eventName || "Event"}</h2>

                                    <div className="booking-details">
                                        <p>
                                            <span>📍 City</span>
                                            <strong>
                                                {booking.eventCity || "Not available"}
                                            </strong>
                                        </p>

                                        <p>
                                            <span>🏟️ Venue</span>
                                            <strong>
                                                {booking.eventVenue || "Not available"}
                                            </strong>
                                        </p>

                                        <p>
                                            <span>📅 Event Date</span>
                                            <strong>{formatDate(booking.eventDate)}</strong>
                                        </p>

                                        <p>
                                            <span>💳 Ticket Price</span>
                                            <strong>₹{booking.ticketPrice ?? 0}</strong>
                                        </p>

                                        <p>
                                            <span>Payment Status</span>
                                            <strong>{paid ? "PAID" : "UNPAID"}</strong>
                                        </p>
                                    </div>

                                    {!cancelled && !paid && (
                                        <button
                                            type="button"
                                            className="book-button"
                                            onClick={() => payNow(booking)}
                                            disabled={payingId === booking.id}
                                        >
                                            {payingId === booking.id
                                                ? "Processing..."
                                                : "Pay Now (Demo)"}
                                        </button>
                                    )}

                                    {!cancelled && paid && (
                                        <p className="booking-payment-success">
                                            ✓ Payment completed (demo)
                                        </p>
                                    )}

                                    {!cancelled && qr && (
                                        <div className="booking-qr-section">
                                            <h3>Your Ticket QR Code</h3>
                                            <img
                                                className="booking-qr-image"
                                                src={qr.image}
                                                alt={`QR code for ${booking.eventName || "event ticket"}`}
                                            />

                                            {qr.ticketReference && (
                                                <p className="booking-qr-reference">
                                                    Ticket reference: {qr.ticketReference}
                                                </p>
                                            )}

                                            <p className="booking-qr-note">
                                                Keep this QR code ready for ticket verification.
                                            </p>
                                        </div>
                                    )}

                                    <div className="digital-ticket-actions">
                                        {!cancelled && (
                                            <button
                                                type="button"
                                                className="book-button"
                                                onClick={() => showQrCode(booking.id)}
                                                disabled={Boolean(qrLoading[booking.id])}
                                            >
                                                {qrLoading[booking.id]
                                                    ? "Loading QR..."
                                                    : qr
                                                        ? "Hide QR Code"
                                                        : "Show QR Ticket"}
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className="book-button"
                                            onClick={() => printTicket(booking)}
                                        >
                                            🖨️ Print Ticket
                                        </button>

                                        {!cancelled && (
                                            <button
                                                type="button"
                                                className="cancel-booking-button"
                                                onClick={() => cancelBooking(booking.id)}
                                            >
                                                Cancel Booking
                                            </button>
                                        )}
                                    </div>

                                    {cancelled && (
                                        <p className="cancelled-ticket-note">
                                            This ticket is cancelled and is not valid for entry.
                                        </p>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

export default MyBookings;
