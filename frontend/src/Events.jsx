
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./App.css";

const API_URL = "https://vibepass-backend-ggb9.onrender.com/api/events";

// Keep sample events for existing imports in other pages.
const baseEvents = [
    {
        id: 1,
        name: "Hyderabad Music Festival",
        city: "Hyderabad",
        category: "Music",
        venue: "Gachibowli Stadium",
        date: "2026-11-14",
        price: 799,
        emoji: "🎵",
        description: "Enjoy live music performances and amazing artists."
    },
    {
        id: 2,
        name: "Live Band Night",
        city: "Hyderabad",
        category: "Music",
        venue: "Madhapur",
        date: "2026-11-21",
        price: 499,
        emoji: "🎸",
        description: "An energetic night of live bands and music."
    },
    {
        id: 3,
        name: "DJ Night",
        city: "Bengaluru",
        category: "Music",
        venue: "Whitefield",
        date: "2026-11-28",
        price: 599,
        emoji: "🎧",
        description: "Dance to great music with an exciting DJ lineup."
    },
    {
        id: 4,
        name: "Comedy Night",
        city: "Hyderabad",
        category: "Comedy",
        venue: "Jubilee Hills",
        date: "2026-12-05",
        price: 399,
        emoji: "😂",
        description: "Enjoy an evening filled with laughter."
    },
    {
        id: 5,
        name: "Startup Networking Meetup",
        city: "Bengaluru",
        category: "Business",
        venue: "Koramangala",
        date: "2026-12-12",
        price: 299,
        emoji: "💼",
        description: "Meet founders and aspiring entrepreneurs."
    },
    {
        id: 6,
        name: "Food Carnival",
        city: "Chennai",
        category: "Food",
        venue: "Nungambakkam",
        date: "2026-12-19",
        price: 199,
        emoji: "🍔",
        description: "Explore delicious food and local specialties."
    },
    {
        id: 7,
        name: "Photography Workshop",
        city: "Pune",
        category: "Workshop",
        venue: "Koregaon Park",
        date: "2027-01-09",
        price: 499,
        emoji: "📸",
        description: "Learn photography techniques from professionals."
    },
    {
        id: 8,
        name: "Art and Craft Fair",
        city: "Mumbai",
        category: "Art",
        venue: "Bandra",
        date: "2027-01-16",
        price: 149,
        emoji: "🎨",
        description: "Discover handmade art and crafts."
    },
    {
        id: 9,
        name: "Marathon Weekend",
        city: "Delhi",
        category: "Sports",
        venue: "India Gate",
        date: "2027-01-23",
        price: 599,
        emoji: "🏃",
        description: "Join a community running event."
    },
    {
        id: 10,
        name: "Classical Dance Show",
        city: "Warangal",
        category: "Culture",
        venue: "Town Hall",
        date: "2027-01-30",
        price: 299,
        emoji: "💃",
        description: "Experience traditional dance performances."
    },
    {
        id: 11,
        name: "Tech Innovation Summit",
        city: "Hyderabad",
        category: "Technology",
        venue: "HITEC City",
        date: "2027-02-06",
        price: 999,
        emoji: "💻",
        description: "Explore emerging technologies and innovation."
    },
    {
        id: 12,
        name: "Weekend Yoga Retreat",
        city: "Pune",
        category: "Wellness",
        venue: "Baner",
        date: "2027-02-13",
        price: 399,
        emoji: "🧘",
        description: "Relax with guided yoga sessions."
    }
];

// Preserve the named export used by existing pages.
export const events = Array.from({ length: 60 }, (_, index) => {
    const event = baseEvents[index % baseEvents.length];

    return {
        ...event,
        id: index + 1,
        name:
            index < baseEvents.length
                ? event.name
                : `${event.name} - Edition ${Math.floor(index / baseEvents.length) + 1}`
    };
});

function formatDate(dateString) {
    if (!dateString) return "Date not available";

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function Events() {
    const [eventList, setEventList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] =
        useState("All Categories");
    const [selectedCity, setSelectedCity] = useState("All Cities");
    const [bookingMessage, setBookingMessage] = useState("");

    // Fetch actual events from Spring Boot and MySQL.
    useEffect(() => {
        let active = true;

        async function loadEvents() {
            try {
                setLoading(true);
                setError("");

                const response = await axios.get(API_URL);

                if (!Array.isArray(response.data)) {
                    throw new Error("Invalid events response");
                }

                const databaseEvents = response.data.map((event) => ({
                    ...event,
                    date: event.eventDate || event.date,
                    price: Number(event.price),
                    emoji: event.emoji || "🎉",
                    description:
                        event.description || "Discover this exciting event."
                }));

                if (active) {
                    setEventList(databaseEvents);
                }
            } catch (err) {
                if (active) {
                    setError(
                        "Unable to load events. Please make sure the backend is running on port 8080."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadEvents();

        return () => {
            active = false;
        };
    }, []);

    // Create filter options from the database events.
    const categories = useMemo(
        () => [
            "All Categories",
            ...new Set(
                eventList.map((event) => event.category).filter(Boolean)
            )
        ],
        [eventList]
    );

    const cities = useMemo(
        () => [
            "All Cities",
            ...new Set(
                eventList.map((event) => event.city).filter(Boolean)
            )
        ],
        [eventList]
    );

    // Search by name, city, venue, category or description.
    const filteredEvents = useMemo(() => {
        const searchText = search.trim().toLowerCase();

        return eventList.filter((event) => {
            const matchesSearch = [
                event.name,
                event.city,
                event.venue,
                event.category,
                event.description
            ].some((value) =>
                String(value || "").toLowerCase().includes(searchText)
            );

            const matchesCategory =
                selectedCategory === "All Categories" ||
                event.category === selectedCategory;

            const matchesCity =
                selectedCity === "All Cities" ||
                event.city === selectedCity;

            return matchesSearch && matchesCategory && matchesCity;
        });
    }, [eventList, search, selectedCategory, selectedCity]);

    function clearFilters() {
        setSearch("");
        setSelectedCategory("All Categories");
        setSelectedCity("All Cities");
        setBookingMessage("");
    }

    function handleBook(event) {
        setBookingMessage(
            `${event.name} — ₹${event.price}. Please log in to continue.`
        );
    }

    return (
        <div className="events-page">
            <nav className="navbar">
                <Link to="/" className="logo">
                    VibePass<span>.</span>
                </Link>

                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/events">Events</Link>
                    <a href="/#about">About</a>
                </div>

                <div className="nav-buttons">
                    <Link to="/login" className="login-btn">
                        Login
                    </Link>
                    <Link to="/register" className="register-btn">
                        Register
                    </Link>
                </div>
            </nav>

            <main>
                <header className="events-header">
                    <p className="section-label">FIND YOUR NEXT EXPERIENCE</p>
                    <h1>Explore All Events</h1>
                    <p>
                        Discover experiences across cities and categories.
                    </p>
                </header>

                <section className="events-filters" aria-label="Event filters">
                    <input
                        type="search"
                        aria-label="Search events"
                        placeholder="Search events, venues or cities..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        aria-label="Filter by category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <select
                        aria-label="Filter by city"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                    >
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="explore-button"
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </button>
                </section>

                {loading && (
                    <div className="no-events">
                        <h2>Loading events...</h2>
                        <p>Fetching events from the database. Please wait.</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="no-events" role="alert">
                        <h2>Events are temporarily unavailable</h2>
                        <p>{error}</p>
                        <button
                            type="button"
                            className="explore-button"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <p className="events-count">
                            Showing <strong>{filteredEvents.length}</strong> of{" "}
                            <strong>{eventList.length}</strong> events
                        </p>

                        {bookingMessage && (
                            <div
                                className="auth-message booking-message"
                                role="status"
                            >
                                {bookingMessage}
                                <button
                                    type="button"
                                    onClick={() => setBookingMessage("")}
                                    aria-label="Dismiss message"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {filteredEvents.length > 0 ? (
                            <section className="events-grid">
                                {filteredEvents.map((event) => (
                                    <article className="event-card" key={event.id}>
                                        <div className="event-image" aria-hidden="true">
                                            {event.emoji}
                                        </div>

                                        <div className="event-details">
                      <span className="event-category">
                        {event.category || "Event"}
                      </span>

                                            <h3>{event.name}</h3>

                                            <p>
                                                📍 {event.venue || "Venue not available"},{" "}
                                                {event.city || "City not available"}
                                            </p>

                                            <p>📅 {formatDate(event.date)}</p>

                                            <p>
                                                {event.description ||
                                                    "Discover this exciting event."}
                                            </p>

                                            <p>
                                                🎟️ Available tickets:{" "}
                                                {event.availableTickets ?? "—"}
                                            </p>

                                            <div className="event-card-footer">
                                                <strong className="event-price">
                                                    ₹{Number.isFinite(event.price) ? event.price : 0}
                                                </strong>

                                                <button
                                                    type="button"
                                                    className="book-button"
                                                    onClick={() => handleBook(event)}
                                                >
                                                    Book Now
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </section>
                        ) : (
                            <div className="no-events">
                                <h2>No events found</h2>
                                <p>
                                    Try a different search term, city or category.
                                </p>
                                <button
                                    type="button"
                                    className="explore-button"
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <footer className="home-footer">
                <Link to="/" className="logo">
                    VibePass<span>.</span>
                </Link>

                <p>Discover experiences. Create memories.</p>

                <div className="footer-links">
                    <Link to="/">Home</Link>
                    <Link to="/events">Events</Link>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                </div>

                <p className="copyright">
                    © 2026 VibePass. Event listings are provided by the application.
                </p>
            </footer>
        </div>
    );
}

export default Events;
