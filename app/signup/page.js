"use client";

import { useState } from "react";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup() {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Check if we have a session (auto-login successful)
    if (data?.session) {
      // Email confirmation is disabled, user is logged in
      router.push("/student");
    } else {
      // Email confirmation is required
      alert("Signup successful! Please check your email to confirm your account.");
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Create Account</h1>

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

        <div className="form-group">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="Choose a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          className="btn"
          onClick={handleSignup}
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account? <a href="/login" style={{ color: 'var(--primary)', fontWeight: '500' }}>Login</a>
        </p>
      </div>
    </div>
  );
}
