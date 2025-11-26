"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";

export default function AdminPage() {
    const [userId, setUserId] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUserId(user.id);
            await checkAdminAndLoadStats(user.id);
        }
        loadUser();
    }, [router]);

    async function checkAdminAndLoadStats(uid) {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/stats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: uid })
            });

            if (res.status === 403) {
                // Not admin
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            const data = await res.json();
            setStats(data);
            setIsAdmin(true);
        } catch (error) {
            console.error("Error loading admin stats:", error);
            setIsAdmin(false);
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="container">
                <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="container">
                <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
                    <h1 style={{ color: "var(--error)", marginBottom: "1rem" }}>Access Denied</h1>
                    <p style={{ color: "var(--text-secondary)" }}>You do not have admin privileges.</p>
                    <button
                        className="btn"
                        onClick={() => router.push("/")}
                        style={{ marginTop: "1.5rem" }}
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Admin Dashboard</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => router.push("/")}
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                        ← Back to Home
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

            {/* Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--primary)' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {stats?.totalUsers || 0}
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Total Users
                    </div>
                </div>

                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--success)' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        {stats?.activeUsers || 0}
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Active Users (30d)
                    </div>
                </div>

                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid var(--warning)' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                        {stats?.totalQuestions || 0}
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Questions Practiced
                    </div>
                </div>

                <div className="card" style={{ textAlign: 'center', borderTop: '4px solid #8b5cf6' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                        {stats?.newUsersLast7Days || 0}
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        New Users (7d)
                    </div>
                </div>
            </div>

            {/* Questions by Difficulty */}
            <div className="card">
                <h3 className="section-title">Questions by Difficulty</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    {stats?.byDifficulty?.map((item) => (
                        <div key={item.difficulty} style={{ padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                {item.count}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                {item.difficulty}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Topics */}
            <div className="card">
                <h3 className="section-title">Top 5 Topics</h3>
                <div style={{ marginTop: '1rem' }}>
                    {stats?.topTopics?.map((topic, index) => (
                        <div
                            key={topic.name}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem',
                                marginBottom: '0.5rem',
                                background: 'var(--background)',
                                borderRadius: 'var(--radius-md)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                }}>
                                    {index + 1}
                                </div>
                                <span style={{ fontWeight: '500' }}>{topic.name}</span>
                            </div>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                {topic.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Patterns */}
            <div className="card">
                <h3 className="section-title">Top 5 Patterns</h3>
                <div style={{ marginTop: '1rem' }}>
                    {stats?.topPatterns?.map((pattern, index) => (
                        <div
                            key={pattern.pattern}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.75rem',
                                marginBottom: '0.5rem',
                                background: 'var(--background)',
                                borderRadius: 'var(--radius-md)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: 'var(--success)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                }}>
                                    {index + 1}
                                </div>
                                <span style={{ fontWeight: '500' }}>{pattern.pattern}</span>
                            </div>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                {pattern.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
