// login/page.js

"use client";

import { useState } from "react";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      // Check if teacher
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_teacher")
          .eq("id", user.id)
          .single();

        if (profile?.is_teacher) {
          window.location.href = "/teacher";
        } else {
          window.location.href = "/student";
        }
      }
    }
  }

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Welcome Back</h1>

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
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
            <a href="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none' }}>
              Forgot Password?
            </a>
          </div>
        </div>

        <button
          className="btn"
          onClick={handleLogin}
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <a href="/signup" style={{ color: 'var(--primary)', fontWeight: '500' }}>Sign up</a>
        </p>
      </div>
    </div>
  );
}
