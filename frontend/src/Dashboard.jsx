
import React from "react";
import { Link } from "react-router-dom";
import "./App.css";

function Dashboard({ user, events = [], onLogout, onBook }) {
    const upcomingEvents = events.slice(0, 6);

    const cityCount = new Set(
        events.map((event) => event.city).filter(Boolean)
    ).size;

    function handleBookClick(event) {
        if (typeof onBook === "function") {
            onBook(event);
        } else {
            window.alert(
                "Booking is not connected. Please check App.jsx."
            );
        }
    }

    function scrollToPopularEvents() {
        document.getElementById("popular-events")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    return (
        <div className="dashboard-page">
            {/* Navigation */}
            <nav className="navbar">
                <Link to="/" className="logo">
                    VibePass<span>.</span>
                </Link>

                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/events">Events</Link>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/my-bookings">My Bookings</Link>

                    <button
                        type="button"
                        onClick={onLogout}
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <main className="dashboard-content">
                {/* Welcome */}
                <section className="dashboard-welcome">
                    <h1>
                        Welcome
                        {user?.name ? `, ${user.name}` : ""}! 👋
                    </h1>

                    <p>
                        Discover exciting events and plan your next
                        experience with VibePass.
                    </p>

                    <Link
                        to="/events"
                        className="dashboard-explore"
                    >
                        Explore Events
                    </Link>
                </section>

                {/* Clickable statistics */}
                <section className="dashboard-stats">
                    <Link
                        to="/events"
                        className="dashboard-stat stat-clickable"
                        aria-label={`Browse ${events.length} available events`}
                    >
                        <h3>{events.length}</h3>
                        <p>Available Events</p>
                        <span>Browse all events →</span>
                    </Link>

                    <button
                        type="button"
                        className="dashboard-stat stat-clickable"
                        onClick={scrollToPopularEvents}
                        aria-label={`View ${upcomingEvents.length} popular picks`}
                    >
                        <h3>{upcomingEvents.length}</h3>
                        <p>Popular Picks</p>
                        <span>View featured events ↓</span>
                    </button>

                    <Link
                        to="/events"
                        className="dashboard-stat stat-clickable"
                        aria-label={`Explore events in ${cityCount} cities`}
                    >
                        <h3>{cityCount}</h3>
                        <p>Cities to Explore</p>
                        <span>Explore cities →</span>
                    </Link>
                </section>

                {/* Featured events */}
                <section
                    className="dashboard-events"
                    id="popular-events"
                >
                    <h2>Explore Popular Events 🎉</h2>

                    {upcomingEvents.length > 0 ? (
                        <div className="event-grid">
                            {upcomingEvents.map((event) => (
                                <article
                                    className="event-card"
                                    key={event.id}
                                >
                                    <div className="event-image">
                                        <span>
                                            {event.emoji || "🎉"}
                                        </span>
                                    </div>

                                    <div className="event-details">
                                        <span className="event-category">
                                            {event.category || "Event"}
                                        </span>

                                        <h3>{event.name}</h3>

                                        <p>
                                            📍 {event.venue || "Venue TBA"}
                                            {event.city
                                                ? `, ${event.city}`
                                                : ""}
                                        </p>

                                        <p>
                                            📅 {event.date || "Date TBA"}
                                        </p>

                                        <p>💰 ₹{event.price}</p>

                                        <button
                                            type="button"
                                            className="book-button"
                                            onClick={() =>
                                                handleBookClick(event)
                                            }
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p>No events available right now.</p>
                    )}

                    <div className="dashboard-view-all">
                        <Link to="/events">
                            View All Events →
                        </Link>
                    </div>
                </section>

                {/* Booking shortcut */}
                <section className="dashboard-bookings-link">
                    <h2>Manage Your Bookings 🎟️</h2>

                    <p>
                        View your tickets and cancel a booking if
                        you selected the wrong event.
                    </p>

                    <Link to="/my-bookings">
                        Go to My Bookings →
                    </Link>
                </section>
            </main>
        </div>
    );
}

export default Dashboard;
