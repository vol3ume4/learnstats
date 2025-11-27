"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user is admin
      try {
        const res = await fetch("/api/admin/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id })
        });

        if (res.status !== 403) {
          setIsAdmin(true);
        }
      } catch (error) {
        // Not admin, that's fine
      }

      setLoading(false);
    }
    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <h1 className="page-title">LearnStats</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '600px', paddingTop: '2rem' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <img
          src="/logo-vertical.png"
          alt="playfullySerious LearnStats"
          style={{ maxWidth: '350px', width: '100%', cursor: 'pointer' }}
          onClick={() => window.open('https://playfullyserious.com', '_blank')}
        />
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1.1rem' }}>
          Interactive Statistics Practice
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button
          className="btn"
          onClick={() => router.push("/student")}
          style={{ padding: '1.5rem', fontSize: '1.1rem' }}
        >
          📚 Student Mode
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => router.push("/teacher")}
          style={{ padding: '1.5rem', fontSize: '1.1rem' }}
        >
          👨‍🏫 Teacher Mode
        </button>

        {isAdmin && (
          <button
            className="btn"
            onClick={() => router.push("/admin")}
            style={{ padding: '1.5rem', fontSize: '1.1rem', background: '#8b5cf6' }}
          >
            🔐 Admin Dashboard
          </button>
        )}

        <button
          className="btn btn-secondary"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          style={{ marginTop: '2rem', fontSize: '0.9rem' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
