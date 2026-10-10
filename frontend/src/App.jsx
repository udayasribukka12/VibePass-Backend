
import React, { useState, useEffect } from "react";
import {
    BrowserRouter,
    Link,
    Routes,
    Route,
    Navigate,
    useNavigate
} from "react-router-dom";
import axios from "axios";

import Home from "./Home";
import Events, { events as sampleEvents } from "./Events";
import Dashboard from "./Dashboard";
import MyBookings from "./MyBookings.jsx";
import AdminTicketVerification from "./pages/AdminTicketVerification.jsx";
import Profile from "./Profile.jsx";
import "./App.css";

const API = "http://localhost:8080/api/auth";
const BOOKING_API = "http://localhost:8080/api/bookings";
const EVENT_API = "http://localhost:8080/api/events";

// Attach the saved JWT to Axios requests.
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("vibepassToken");

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

function getSavedUser() {
    try {
        const savedUser = localStorage.getItem("vibepassUser");
        const token = localStorage.getItem("vibepassToken");

        if (!savedUser || !token) {
            localStorage.removeItem("vibepassUser");
            localStorage.removeItem("vibepassToken");
            return null;
        }

        return JSON.parse(savedUser);
    } catch {
        localStorage.removeItem("vibepassUser");
        localStorage.removeItem("vibepassToken");
        return null;
    }
}

// LOGIN AND REGISTRATION
function AuthPage({ type, onLogin }) {
    const navigate = useNavigate();
    const isLogin = type === "login";

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setError("");

        const cleanEmail = email.trim().toLowerCase();

        const cleanName = name.trim();
        if (!isLogin && (cleanName.length < 4 || cleanName.length > 14 || !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(cleanName))) {
            setError("Name must be 4–14 characters and contain only letters and spaces.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            setError("Enter a valid email address.");
            return;
        }

        if (!isLogin && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,}$/.test(password)) {
            setError("Password needs 8+ characters, uppercase, lowercase, number and special character.");
            return;
        }

        if (!isLogin && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (isLogin && !password) {
            setError("Please enter your password.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const response = await axios.post(
                `${API}/${isLogin ? "login" : "register"}`,
                isLogin
                    ? { email: cleanEmail, password }
                    : { name: cleanName, email: cleanEmail, password }
            );

            if (isLogin) {
                const token = response.data.token;

                if (!token) {
                    throw new Error(
                        "Login succeeded but the server did not return a JWT token."
                    );
                }

                const loggedInUser = {
                    id: response.data.id,
                    name: response.data.name || email.split("@")[0],
                    email: response.data.email || email,
                    role: String(response.data.role || "USER").toUpperCase()
                };

                localStorage.setItem("vibepassToken", token);
                localStorage.setItem(
                    "vibepassUser",
                    JSON.stringify(loggedInUser)
                );

                onLogin(loggedInUser);

                navigate(
                    loggedInUser.role === "ADMIN"
                        ? "/admin"
                        : "/dashboard",
                    { replace: true }
                );
            } else {
                alert("Registration successful! Please log in.");
                navigate("/login");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to continue. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>{isLogin ? "Welcome Back!" : "Create Account"}</h1>

                <p>
                    {isLogin
                        ? "Login to continue with VibePass"
                        : "Register to discover exciting events"}
                </p>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            minLength={4}
                            maxLength={14}
                            pattern="[A-Za-z ]{4,14}"
                            title="Enter 4–14 characters using letters only (spaces between names are allowed)."
                            required
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        required
                    />

                    {!isLogin && (
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    )}

                    {isLogin && (
                        <p>
                            <button
                                type="button"
                                className="auth-link"
                                onClick={() => navigate("/forgot-password")}
                            >
                                Forgot Password?
                            </button>
                        </p>
                    )}

                    {error && (
                        <p className="error-message" role="alert">
                            {error}
                        </p>
                    )}

                    <button type="submit" disabled={loading}>
                        {loading
                            ? "Please wait..."
                            : isLogin
                                ? "Login"
                                : "Register"}
                    </button>
                </form>

                <p>
                    {isLogin
                        ? "Don't have an account? "
                        : "Already have an account? "}

                    <button
                        type="button"
                        className="auth-link"
                        onClick={() =>
                            navigate(isLogin ? "/register" : "/login")
                        }
                    >
                        {isLogin ? "Register" : "Login"}
                    </button>
                </p>

                <p>
                    <button
                        type="button"
                        className="auth-link"
                        onClick={() => navigate("/")}
                    >
                        Back to Home
                    </button>
                </p>
            </div>
        </div>
    );
}

// FORGOT PASSWORD AND RESET PASSWORD
function ForgotPasswordPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetRequested, setResetRequested] = useState(false);
    const [resetDone, setResetDone] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleRequestReset(e) {
        e.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        try {
            const response = await axios.post(
                `${API}/forgot-password`,
                { email }
            );

            if (response.data.resetToken) {
                setToken(response.data.resetToken);
                setResetRequested(true);
                setMessage(
                    "Reset token generated. Enter your new password below."
                );
            } else {
                setMessage(
                    response.data.message ||
                    "If the account exists, recovery can proceed."
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not request password reset. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        setMessage("");
        setError("");

        if (newPassword.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${API}/reset-password`,
                {
                    token: token.trim(),
                    newPassword
                }
            );

            setMessage(
                response.data.message ||
                "Password reset successful. Please log in."
            );

            setResetDone(true);
            setNewPassword("");
            setConfirmPassword("");
            setToken("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Password reset failed. Check the token and try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h1>
                    {resetDone
                        ? "Password Updated!"
                        : resetRequested
                            ? "Create New Password"
                            : "Forgot Password?"}
                </h1>

                {!resetDone && !resetRequested && (
                    <>
                        <p>
                            Enter your registered email address to request
                            a password-reset token.
                        </p>

                        <form onSubmit={handleRequestReset}>
                            <input
                                type="email"
                                placeholder="Registered Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            {message && (
                                <p role="status" style={{ color: "green" }}>
                                    {message}
                                </p>
                            )}

                            {error && (
                                <p className="error-message" role="alert">
                                    {error}
                                </p>
                            )}

                            <button type="submit" disabled={loading}>
                                {loading
                                    ? "Please wait..."
                                    : "Generate Reset Token"}
                            </button>
                        </form>
                    </>
                )}

                {!resetDone && resetRequested && (
                    <>
                        <p>
                            Enter the reset token and choose a new password.
                            The token expires after 15 minutes.
                        </p>

                        <form onSubmit={handleResetPassword}>
                            <label htmlFor="reset-token">Reset Token</label>
                            <input
                                id="reset-token"
                                type="text"
                                placeholder="Enter reset token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                required
                            />

                            <label htmlFor="new-password">New Password</label>
                            <input
                                id="new-password"
                                type="password"
                                placeholder="At least 8 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength={8}
                                autoComplete="new-password"
                                required
                            />

                            <label htmlFor="confirm-password">
                                Confirm New Password
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                minLength={8}
                                autoComplete="new-password"
                                required
                            />

                            {message && (
                                <p role="status" style={{ color: "green" }}>
                                    {message}
                                </p>
                            )}

                            {error && (
                                <p className="error-message" role="alert">
                                    {error}
                                </p>
                            )}

                            <button type="submit" disabled={loading}>
                                {loading ? "Updating..." : "Update Password"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setResetRequested(false);
                                    setToken("");
                                    setMessage("");
                                    setError("");
                                }}
                                style={{ marginTop: "10px" }}
                            >
                                Request Another Token
                            </button>
                        </form>
                    </>
                )}

                {resetDone && (
                    <>
                        {message && (
                            <p role="status" style={{ color: "green" }}>
                                {message}
                            </p>
                        )}

                        <button onClick={() => navigate("/login")}>
                            Go to Login
                        </button>
                    </>
                )}

                {!resetDone && (
                    <p>
                        <button
                            type="button"
                            className="auth-link"
                            onClick={() => navigate("/login")}
                        >
                            Back to Login
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}

// USER DASHBOARD
function DashboardPage({ user, onLogout }) {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [bookingLoading, setBookingLoading] = useState(false);
    const [createdBookingId, setCreatedBookingId] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);

    async function handleDemoPayment() {
        if (!createdBookingId) return;

        const confirmed = window.confirm(
            "This is a demo payment only. No real money will be charged. Continue?"
        );
        if (!confirmed) return;

        setPaymentLoading(true);
        setMessage("");

        try {
            const response = await axios.post(
                `${BOOKING_API}/${createdBookingId}/demo-payment`,
                {}
            );
            setMessage(
                response.data?.message ||
                "Demo payment completed. No real money was charged."
            );
        } catch (err) {
            setMessage(
                err.response?.data?.message ||
                err.response?.data?.error ||
                (err.response
                    ? `Demo payment failed. Status: ${err.response.status}`
                    : "Cannot connect to the backend.")
            );
        } finally {
            setPaymentLoading(false);
        }
    }

    async function handleBook(event) {
        if (!user?.id) {
            navigate("/login");
            return;
        }

        if (bookingLoading) return;

        const confirmed = window.confirm(
            `Confirm booking for ${event.name} at ₹${event.price}?`
        );

        if (!confirmed) return;

        setBookingLoading(true);
        setMessage("");

        try {
            const response = await axios.post(BOOKING_API, {
                userId: user.id,
                eventId: event.id,
                eventName: event.name,
                eventCity: event.city,
                eventVenue: event.venue,
                eventDate: event.date,
                ticketPrice: Number(event.price)
            });

            setCreatedBookingId(response.data.id);
            setMessage(
                `Booking confirmed! Booking ID: ${response.data.id}. You can now make a demo payment or open My Bookings.`
            );
        } catch (err) {
            setMessage(
                err.response?.data?.message ||
                "Booking failed. Please try again."
            );
        } finally {
            setBookingLoading(false);
        }
    }

    return (
        <>
            <Dashboard
                user={user}
                events={sampleEvents}
                onLogout={onLogout}
                onBook={handleBook}
            />

            {message && (
                <div className="booking-message" role="status">
                    <p>{message}</p>
                    <button onClick={() => setMessage("")}>Close</button>
                    {createdBookingId && (
                        <button
                            type="button"
                            onClick={handleDemoPayment}
                            disabled={paymentLoading}
                        >
                            {paymentLoading ? "Processing..." : "Pay Now (Demo)"}
                        </button>
                    )}
                    <button onClick={() => navigate("/my-bookings")}>
                        My Bookings
                    </button>
                </div>
            )}
        </>
    );
}




// ADMIN DASHBOARD
function AdminDashboard({ user, onLogout }) {
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    async function loadAdminData() {
        setLoading(true);
        setError("");

        try {
            const [eventResponse, bookingResponse] = await Promise.all([
                axios.get(EVENT_API),
                axios.get(BOOKING_API)
            ]);

            setEvents(eventResponse.data);
            setBookings(bookingResponse.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAdminData();
    }, []);

    async function deleteEvent(eventId) {
        if (!window.confirm("Are you sure you want to delete this event?")) {
            return;
        }

        try {
            await axios.delete(`${EVENT_API}/${eventId}`);
            await loadAdminData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not delete event. The backend endpoint may not exist."
            );
        }
    }

    const confirmedBookings = bookings.filter(
        booking => booking.bookingStatus === "CONFIRMED"
    );

    const cancelledBookings = bookings.filter(
        booking => booking.bookingStatus === "CANCELLED"
    );

    const revenue = confirmedBookings.reduce(
        (total, booking) => total + Number(booking.ticketPrice || 0),
        0
    );

    return (
        <div className="admin-page" style={{ padding: "30px" }}>
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px"
                }}
            >
                <div>
                    <h1>VibePass Admin Dashboard</h1>
                    <p>Welcome, {user.name}</p>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button onClick={() => navigate("/events")}>
                        Browse Events
                    </button>
                    <button onClick={() => navigate("/admin/verify-ticket")}>
                        Verify Tickets
                    </button>
                    <button onClick={loadAdminData}>Refresh</button>
                    <button onClick={onLogout}>Logout</button>
                </div>
            </header>

            {error && (
                <p role="alert" style={{ color: "crimson" }}>
                    {error}
                </p>
            )}

            {loading ? (
                <p>Loading dashboard...</p>
            ) : (
                <>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "16px",
                            margin: "25px 0"
                        }}
                    >
                        <div className="auth-card">
                            <h3>Total Events</h3>
                            <h2>{events.length}</h2>
                        </div>

                        <div className="auth-card">
                            <h3>Total Bookings</h3>
                            <h2>{bookings.length}</h2>
                        </div>

                        <div className="auth-card">
                            <h3>Confirmed Bookings</h3>
                            <h2>{confirmedBookings.length}</h2>
                        </div>

                        <div className="auth-card">
                            <h3>Cancelled Bookings</h3>
                            <h2>{cancelledBookings.length}</h2>
                        </div>

                        <div className="auth-card">
                            <h3>Confirmed Booking Value</h3>
                            <h2>₹{revenue.toLocaleString("en-IN")}</h2>
                            <small>Before fees and refunds</small>
                        </div>
                    </div>

                    <section style={{ marginTop: "30px" }}>
                        <h2>Event Management</h2>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%" }}>
                                <thead>
                                <tr>
                                    <th align="left">Event</th>
                                    <th align="left">City</th>
                                    <th align="left">Price</th>
                                    <th align="left">Available</th>
                                    <th align="left">Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {events.map(event => (
                                    <tr key={event.id}>
                                        <td>{event.name}</td>
                                        <td>{event.city}</td>
                                        <td>
                                            ₹{Number(event.price).toLocaleString("en-IN")}
                                        </td>
                                        <td>{event.availableTickets}</td>
                                        <td>
                                            <button
                                                onClick={() => deleteEvent(event.id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section style={{ marginTop: "35px" }}>
                        <h2>All Bookings</h2>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%" }}>
                                <thead>
                                <tr>
                                    <th align="left">Booking ID</th>
                                    <th align="left">Event</th>
                                    <th align="left">User ID</th>
                                    <th align="left">Price</th>
                                    <th align="left">Status</th>
                                </tr>
                                </thead>
                                <tbody>
                                {bookings.map(booking => (
                                    <tr key={booking.id}>
                                        <td>{booking.id}</td>
                                        <td>{booking.eventName}</td>
                                        <td>{booking.userId}</td>
                                        <td>
                                            ₹{Number(booking.ticketPrice || 0).toLocaleString("en-IN")}
                                        </td>
                                        <td>{booking.bookingStatus}</td>
                                    </tr>
                                ))}

                                {bookings.length === 0 && (
                                    <tr>
                                        <td colSpan="5">No bookings yet.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

// APPLICATION ROUTES
function AppRoutes() {
    const [user, setUser] = useState(getSavedUser);
    const navigate = useNavigate();

    function handleLogin(loggedInUser) {
        setUser(loggedInUser);
    }

    function handleLogout() {
        localStorage.removeItem("vibepassUser");
        localStorage.removeItem("vibepassToken");
        setUser(null);
        navigate("/login", { replace: true });
    }

    const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

    return (
        <>
            {user && !isAdmin && (
                <Link
                    to="/profile"
                    style={{
                        position: "fixed",
                        top: "104px",
                        right: "28px",
                        zIndex: 10000,
                        padding: "7px 10px",
                        borderRadius: "6px",
                        background: "#ffffff",
                        color: "#4930a8",
                        textDecoration: "none",
                        fontWeight: 600,
                        border: "1px solid #e5ddff"
                    }}
                >
                    My Profile
                </Link>
            )}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/events" element={<Events />} />

                <Route
                    path="/login"
                    element={
                        user
                            ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
                            : <AuthPage type="login" onLogin={handleLogin} />
                    }
                />

                <Route
                    path="/register"
                    element={
                        user
                            ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
                            : <AuthPage type="register" onLogin={handleLogin} />
                    }
                />

                <Route
                    path="/forgot-password"
                    element={
                        user
                            ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />
                            : <ForgotPasswordPage />
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        !user
                            ? <Navigate to="/login" replace />
                            : isAdmin
                                ? <Navigate to="/admin" replace />
                                : <DashboardPage user={user} onLogout={handleLogout} />
                    }
                />

                <Route
                    path="/admin"
                    element={
                        !user
                            ? <Navigate to="/login" replace />
                            : isAdmin
                                ? <AdminDashboard user={user} onLogout={handleLogout} />
                                : <Navigate to="/dashboard" replace />
                    }
                />

                <Route
                    path="/admin/verify-ticket"
                    element={
                        !user
                            ? <Navigate to="/login" replace />
                            : isAdmin
                                ? <AdminTicketVerification />
                                : <Navigate to="/dashboard" replace />
                    }
                />

                <Route
                    path="/my-bookings"
                    element={
                        !user
                            ? <Navigate to="/login" replace />
                            : isAdmin
                                ? <Navigate to="/admin" replace />
                                : <MyBookings user={user} />
                    }
                />
                <Route
                    path="/profile"
                    element={
                        !user
                            ? <Navigate to="/login" replace />
                            : isAdmin
                                ? <Navigate to="/admin" replace />
                                : (
                                    <Profile
                                        user={user}
                                        onProfileUpdated={setUser}
                                    />
                                )
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

