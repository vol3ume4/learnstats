"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";

export default function PracticeLogPage() {
    const [userId, setUserId] = useState(null);
    const [topics, setTopics] = useState([]);
    const [patterns, setPatterns] = useState([]);

    const [selectedTopic, setSelectedTopic] = useState("");
    const [selectedPattern, setSelectedPattern] = useState("");
    const [selectedDifficulty, setSelectedDifficulty] = useState("All");

    const [history, setHistory] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUserId(user.id);
            loadTopics();
        }
        loadUser();
    }, [router]);

    async function loadTopics() {
        const res = await fetch("/api/student/get-topics");
        const data = await res.json();
        setTopics(data);
    }

    async function loadPatterns(topicId) {
        if (!topicId) {
            setPatterns([]);
            return;
        }
        const res = await fetch("/api/student/get-patterns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topicId })
        });
        const data = await res.json();
        setPatterns(data);
    }

    async function fetchHistory() {
        if (!userId) return;

        setLoading(true);
        const res = await fetch("/api/student/practice-history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                topicId: selectedTopic || null,
                patternId: selectedPattern || null,
                difficulty: selectedDifficulty
            })
        });
        const data = await res.json();
        setHistory(data);
        setLoading(false);
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>📝 My Practice Log</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => router.push("/student/dashboard")}
                        style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                        ← Back to Dashboard
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
                <h3 className="section-title">Filter Questions</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="label">Topic</label>
                        <select
                            className="select"
                            value={selectedTopic}
                            onChange={(e) => {
                                setSelectedTopic(e.target.value);
                                setSelectedPattern("");
                                loadPatterns(e.target.value);
                            }}
                        >
                            <option value="">All Topics</option>
                            {topics.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="label">Pattern</label>
                        <select
                            className="select"
                            value={selectedPattern}
                            onChange={(e) => setSelectedPattern(e.target.value)}
                            disabled={!selectedTopic}
                        >
                            <option value="">All Patterns</option>
                            {patterns.map((p) => (
                                <option key={p.id} value={p.id}>{p.pattern}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="label">Difficulty</label>
                        <select
                            className="select"
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                        >
                            <option value="All">All Levels</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                    </div>
                </div>

                <button
                    className="btn"
                    onClick={fetchHistory}
                    disabled={loading}
                    style={{ width: '100%' }}
                >
                    {loading ? "Loading..." : "Show Questions"}
                </button>
            </div>

            {history.length > 0 && (
                <div className="card">
                    <h3 className="section-title">Found {history.length} question{history.length > 1 ? 's' : ''}</h3>

                    <div style={{ marginTop: '1rem' }}>
                        {history.map((item, index) => (
                            <div key={item.id} style={{ marginBottom: '0.75rem' }}>
                                <div
                                    style={{
                                        padding: '1rem',
                                        background: 'var(--background)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                >
                                    <div>
                                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                                            Question {index + 1}: {item.topic_name} → {item.pattern_name}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {item.difficulty} • {item.correct ? '✓ Correct' : '✗ Incorrect'}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>
                                        {expandedId === item.id ? '▲' : '▼'}
                                    </div>
                                </div>

                                {expandedId === item.id && (
                                    <div style={{
                                        padding: '1.5rem',
                                        background: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderTop: 'none',
                                        borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                                        marginTop: '-0.5rem'
                                    }}>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <strong>Question:</strong>
                                            <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                                                {item.question_text}
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <strong>Your Answer:</strong>
                                            <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                                {item.user_answer || '(No answer provided)'}
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <strong>Result:</strong>
                                            <div className={item.correct ? "alert alert-success" : "alert alert-error"} style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
                                                {item.correct ? '✓ Correct' : '✗ Incorrect'}
                                            </div>
                                        </div>

                                        {item.used_hint_stats && (
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                💡 Used Stats hint
                                            </div>
                                        )}

                                        {item.used_hint_python && (
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                💡 Used Python hint
                                            </div>
                                        )}

                                        {item.student_remark && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <strong>Your Remark:</strong>
                                                <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                                                    "{item.student_remark}"
                                                </div>
                                            </div>
                                        )}

                                        <details style={{ marginTop: '1rem' }}>
                                            <summary style={{ cursor: 'pointer', fontWeight: '500', color: 'var(--primary)' }}>
                                                View Full Solution
                                            </summary>
                                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                                                <div style={{ marginBottom: '1rem' }}>
                                                    <strong>Statistical Approach:</strong>
                                                    <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                                                        {item.solution_stats || 'Not provided'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <strong>Python Implementation:</strong>
                                                    <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: '#1e293b', color: '#e2e8f0', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                                                        {item.solution_python || 'Not provided'}
                                                    </div>
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {history.length === 0 && !loading && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Select filters and click "Show Questions" to view your practice history
                </div>
            )}
        </div>
    );
}
