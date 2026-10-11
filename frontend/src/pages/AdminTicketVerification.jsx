
import { useState } from "react";
import axios from "axios";

const API_URL = "https://vibepass-backend-ggb9.onrender.com/api/bookings/verify-ticket";

export default function AdminTicketVerification() {
    const [ticketReference, setTicketReference] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const verifyTicket = async (e) => {
        e.preventDefault();
        setResult(null);

        if (!ticketReference.trim()) {
            setResult({
                valid: false,
                message: "Please enter a ticket reference."
            });
            return;
        }

        const token = localStorage.getItem("vibepassToken");

        if (!token) {
            setResult({
                valid: false,
                message: "Please log in as an admin."
            });
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                API_URL,
                { ticketReference: ticketReference.trim() },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            setResult(response.data);
        } catch (error) {
            setResult(
                error.response?.data || {
                    valid: false,
                    message: "Unable to verify ticket. Check the backend."
                }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4">
            <div className="card shadow-sm mx-auto" style={{ maxWidth: "600px" }}>
                <div className="card-body p-4">
                    <h2 className="mb-2">Ticket Verification</h2>
                    <p className="text-muted">
                        Verify VibePass event tickets.
                    </p>

                    <form onSubmit={verifyTicket}>
                        <label className="form-label">
                            Ticket Reference
                        </label>

                        <input
                            type="text"
                            className="form-control mb-3"
                            placeholder="Enter ticket reference"
                            value={ticketReference}
                            onChange={(e) => setTicketReference(e.target.value)}
                        />

                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Verify Ticket"}
                        </button>
                    </form>

                    {result && (
                        <div
                            className={`alert mt-4 ${
                                result.valid ? "alert-success" : "alert-danger"
                            }`}
                            role="status"
                        >
                            <h5>
                                {result.valid ? "✓ Valid Ticket" : "✗ Verification Failed"}
                            </h5>

                            <p>{result.message}</p>

                            {result.bookingId && (
                                <>
                                    <p className="mb-1">
                                        <strong>Booking ID:</strong> {result.bookingId}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Event:</strong> {result.eventName}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Date:</strong> {result.eventDate}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Status:</strong> {result.bookingStatus}
                                    </p>
                                    <p className="mb-0">
                                        <strong>Reference:</strong> {result.ticketReference}
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
