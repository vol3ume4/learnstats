"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";

export default function AdminPage() {
    const [userId, setUserId] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userProgress, setUserProgress] = useState([]);
    const [expandedUsers, setExpandedUsers] = useState({});
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

            // Load user progress if admin
            loadUserProgress(uid);
        } catch (error) {
            console.error("Error loading admin stats:", error);
            setIsAdmin(false);
        }
        setLoading(false);
    }

    async function loadUserProgress(uid) {
        try {
            const res = await fetch("/api/admin/user-progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: uid })
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setUserProgress(data);
            } else {
                console.error("Invalid user progress data:", data);
                setUserProgress([]);
            }
        } catch (error) {
            console.error("Error loading user progress:", error);
            setUserProgress([]);
        }
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


            {/* Student Help Requests Section */}
            <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <h3 style={{ margin: 0, marginBottom: '1rem' }}>🤔 Student Help Requests</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                            {stats?.helpRequests?.total || 0}
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '0.25rem' }}>
                            Total Help Requests
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                            {stats?.helpRequests?.saved || 0}
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '0.25rem' }}>
                            Saved to Database
                        </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                            {stats?.helpRequests?.contributionRate || 0}%
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '0.25rem' }}>
                            Contribution Rate
                        </div>
                    </div>
                </div>
                {stats?.helpRequests?.byMode && stats.helpRequests.byMode.length > 0 && (
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', fontSize: '0.9rem' }}>
                        {stats.helpRequests.byMode.map((mode) => (
                            <div key={mode.input_mode} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                                <strong>{mode.input_mode === 'text' ? '📝 Text' : '📷 Image'}:</strong> {mode.count}
                            </div>
                        ))}
                    </div>
                )}
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
            {/* User Progress Tracking */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <h3 className="section-title">User Progress Tracking</h3>
                <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>User</th>
                                <th style={{ padding: '0.75rem' }}>Joined</th>
                                <th style={{ padding: '0.75rem', textAlign: 'center' }}>Completed Patterns</th>
                                <th style={{ padding: '0.75rem' }}>Active Topics</th>
                                <th style={{ padding: '0.75rem' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {userProgress?.map((user) => (
                                <>
                                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: '500' }}>{user.email}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ID: {user.id.substring(0, 8)}...</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {new Date(user.joinedAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            <span style={{
                                                background: user.completedPatternsCount > 0 ? 'var(--success)' : 'var(--background)',
                                                color: user.completedPatternsCount > 0 ? 'white' : 'var(--text-secondary)',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontWeight: 'bold'
                                            }}>
                                                {user.completedPatternsCount}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {user.topics.length > 0 ? (
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {user.topics.slice(0, 2).map((t, i) => (
                                                        <span key={i} style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                            {t.name} ({t.completed}/{t.total})
                                                        </span>
                                                    ))}
                                                    {user.topics.length > 2 && (
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>+{user.topics.length - 2} more</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No progress</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => setExpandedUsers(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                            >
                                                {expandedUsers[user.id] ? 'Hide Details' : 'View Details'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedUsers[user.id] && (
                                        <tr style={{ background: '#f9fafb' }}>
                                            <td colSpan={5} style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Detailed Progress:</div>
                                                {user.topics.length > 0 ? (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                                        {user.topics.map((t, i) => (
                                                            <div key={i} style={{ background: 'white', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                                                <div style={{ fontWeight: '500', color: 'var(--primary)' }}>{t.name}</div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                                                                    <span>Progress:</span>
                                                                    <span style={{ fontWeight: 'bold' }}>{t.completed} / {t.total} patterns</span>
                                                                </div>
                                                                <div style={{ width: '100%', height: '4px', background: '#e5e7eb', marginTop: '0.5rem', borderRadius: '2px' }}>
                                                                    <div style={{
                                                                        width: `${(t.completed / t.total) * 100}%`,
                                                                        height: '100%',
                                                                        background: 'var(--success)',
                                                                        borderRadius: '2px'
                                                                    }} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ color: 'var(--text-secondary)' }}>No active topics found for this user.</div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
