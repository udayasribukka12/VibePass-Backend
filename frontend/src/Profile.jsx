
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

const PROFILE_API = "http://localhost:8080/api/users/me";

export default function Profile({ user, onProfileUpdated }) {
    const navigate = useNavigate();

    const [profile, setProfile] = useState({
        id: user?.id ?? "",
        name: user?.name ?? "",
        email: user?.email ?? "",
        role: user?.role ?? "USER"
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function loadProfile() {
            const token = localStorage.getItem("vibepassToken");

            if (!token) {
                navigate("/login", { replace: true });
                return;
            }

            try {
                const response = await axios.get(PROFILE_API, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setProfile(response.data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load your profile."
                );
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [navigate]);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        const cleanName = profile.name.trim();

        if (cleanName.length < 2 || cleanName.length > 80) {
            setError("Name must contain 2 to 80 characters.");
            return;
        }

        setSaving(true);

        try {
            const token = localStorage.getItem("vibepassToken");

            const response = await axios.put(
                PROFILE_API,
                { name: cleanName },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const updatedProfile = response.data;
            setProfile(updatedProfile);

            const savedUser = JSON.parse(
                localStorage.getItem("vibepassUser") || "{}"
            );

            const updatedUser = {
                ...savedUser,
                ...updatedProfile
            };

            localStorage.setItem(
                "vibepassUser",
                JSON.stringify(updatedUser)
            );

            if (onProfileUpdated) {
                onProfileUpdated(updatedUser);
            }

            setMessage("Profile updated successfully!");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to save your profile."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="profile-page">Loading your profile...</div>;
    }

    return (
        <main className="profile-page">
            <header className="profile-header">
                <div>
                    <p className="section-label">YOUR ACCOUNT</p>
                    <h1>My Profile</h1>
                    <p>View and update your VibePass account details.</p>
                </div>

                <Link className="my-bookings-back" to="/dashboard">
                    ← Back to Dashboard
                </Link>
            </header>

            <section className="profile-card">
                <div className="profile-avatar">
                    {(profile.name || "U").charAt(0).toUpperCase()}
                </div>

                <h2>{profile.name || "VibePass User"}</h2>
                <p>{profile.email}</p>

                <span className="profile-role">
                    {profile.role || "USER"}
                </span>

                {error && (
                    <p className="error-message" role="alert">
                        {error}
                    </p>
                )}

                {message && (
                    <p className="profile-success" role="status">
                        {message}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="profile-form">
                    <label htmlFor="profile-id">Account ID</label>
                    <input
                        id="profile-id"
                        value={profile.id ?? ""}
                        readOnly
                    />

                    <label htmlFor="profile-name">Full Name</label>
                    <input
                        id="profile-name"
                        type="text"
                        value={profile.name ?? ""}
                        onChange={event =>
                            setProfile(previous => ({
                                ...previous,
                                name: event.target.value
                            }))
                        }
                        minLength={2}
                        maxLength={80}
                        required
                    />

                    <label htmlFor="profile-email">Email Address</label>
                    <input
                        id="profile-email"
                        type="email"
                        value={profile.email ?? ""}
                        readOnly
                    />

                    <label htmlFor="profile-role">Account Role</label>
                    <input
                        id="profile-role"
                        value={profile.role ?? "USER"}
                        readOnly
                    />

                    <button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </form>

                <button
                    type="button"
                    className="profile-back-button"
                    onClick={() => navigate("/my-bookings")}
                >
                    View My Bookings
                </button>
            </section>
        </main>
    );
}
