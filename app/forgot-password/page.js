"use client";

import { useState } from "react";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function handleReset() {
        if (!email) {
            alert("Please enter your email.");
            return;
        }

        setLoading(true);
        setMessage("");

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });

        if (error) {
            alert(error.message);
        } else {
            setMessage("Check your email for the password reset link.");
        }
        setLoading(false);
    }

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Reset Password</h1>

                <div className="form-group">
                    <label className="label">Email</label>
                    <input
                        className="input"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <button
                    className="btn"
                    onClick={handleReset}
                    style={{ width: '100%' }}
                    disabled={loading}
                >
                    {loading ? "Sending..." : "Send Reset Link"}
                </button>

                {message && (
                    <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                        {message}
                    </div>
                )}

                <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Remembered it? <a href="/login" style={{ color: 'var(--primary)', fontWeight: '500' }}>Login</a>
                </p>
            </div>
        </div>
    );
}
