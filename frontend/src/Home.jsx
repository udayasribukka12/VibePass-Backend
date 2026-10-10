import { Link } from "react-router-dom";
import "./App.css";

function Home() {
    return (
        <div className="home-page">
            {/* Navigation Bar */}
            <nav className="navbar">
                <Link to="/" className="logo">
                    VibePass<span>.</span>
                </Link>

                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/events">Events</Link>
                    <a href="#about">About</a>
                    <Link to="/dashboard">Dashboard</Link>
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

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <span className="hero-badge">YOUR CITY. YOUR VIBE.</span>

                    <h1>
                        Discover experiences.
                        <br />
                        Create memories.
                    </h1>

                    <p>
                        Find exciting events, meet amazing people and make every moment
                        count.
                    </p>

                    <Link to="/events" className="hero-link">
                        Explore Events →
                    </Link>
                </div>
            </section>

            {/* Why VibePass Section */}
            <section className="home-highlights" id="about">
                <p className="section-label">WHY VIBEPASS?</p>

                <h2>Your next experience starts here.</h2>

                <p className="highlights-description">
                    Discover events that match your interests.
                </p>

                <div className="highlight-grid">
                    <div className="highlight-card">
                        <div className="highlight-icon">🎵</div>
                        <h3>Live Experiences</h3>
                        <p>
                            Discover live music, concerts and entertainment events
                            happening around you.
                        </p>
                    </div>

                    <div className="highlight-card">
                        <div className="highlight-icon">🎭</div>
                        <h3>Explore Interests</h3>
                        <p>
                            Find cultural festivals, workshops, comedy shows and
                            experiences you love.
                        </p>
                    </div>

                    <div className="highlight-card">
                        <div className="highlight-icon">📍</div>
                        <h3>Multiple Cities</h3>
                        <p>
                            Explore events across different cities and plan your next
                            outing.
                        </p>
                    </div>
                </div>

                <Link to="/events" className="explore-button">
                    Explore All Events
                </Link>
            </section>

            {/* Call to Action */}
            <section className="home-featured">
                <h2>Ready for your next adventure?</h2>
                <p>
                    Find your vibe, explore new experiences and make memories.
                </p>

                <div className="cta-buttons">
                    <Link to="/events" className="register-btn">
                        Discover Events
                    </Link>

                    <Link to="/register" className="login-btn">
                        Join VibePass
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <Link to="/" className="logo">
                    VibePass<span>.</span>
                </Link>

                <p>Discover experiences. Create memories.</p>

                <div className="footer-links">
                    <Link to="/">Home</Link>
                    <Link to="/events">Events</Link>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/login">Login</Link>
                </div>

                <p className="copyright">
                    © {new Date().getFullYear()} VibePass. All rights reserved.
                </p>
            </footer>
        </div>
    );
}

export default Home;