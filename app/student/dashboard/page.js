"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";

export default function DashboardPage() {
    const [userId, setUserId] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUserId(user.id);
            loadStats(user.id);
        }
        loadUser();
    }, [router]);

    async function loadStats(uid) {
        setLoading(true);
        const res = await fetch("/api/student/dashboard-stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: uid })
        });
        const data = await res.json();
        setStats(data);
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="container">
                <div style={{ padding: "40px", textAlign: "center" }}>Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>My Dashboard</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => router.push("/student")}
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                        ← Back to Practice
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push("/login");
                        }}
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="card">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                    👋 Welcome back!
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1.5rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {stats?.topicsExplored || 0}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Topics Explored
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {stats?.totalQuestions || 0}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Questions Practiced
                        </div>
                    </div>
                </div>

                <h3 className="section-title" style={{ marginTop: '2rem' }}>🏆 Your Practice Journey</h3>

                {stats?.topics && stats.topics.length > 0 ? (
                    <div style={{ marginTop: '1rem' }}>
                        {stats.topics.map((topic) => (
                            <div
                                key={topic.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    marginBottom: '0.75rem',
                                    background: 'var(--background)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)'
                                }}
                            >
                                <span style={{ fontWeight: '500' }}>{topic.name}</span>
                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                    {Array.from({ length: parseInt(topic.patterns_practiced) }).map((_, i) => (
                                        <span key={i} style={{ fontSize: '1.2rem' }}>⭐</span>
                                    ))}
                                    <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {topic.patterns_practiced} pattern{topic.patterns_practiced > 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', fontStyle: 'italic' }}>
                            ⭐ = Patterns you've practiced
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Start practicing to see your journey here!
                    </div>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <button
                        className="btn"
                        onClick={() => router.push("/student/practice-log")}
                        style={{ fontSize: '1rem' }}
                    >
                        📝 View Practice Log
                    </button>
                </div>
            </div>
        </div>
    );
}
