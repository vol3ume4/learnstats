"use client";

import { useState } from "react";

export default function StudentHelp() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
                ❓ How to Use
            </button>

            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '2rem'
                    }}
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: '600px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, color: 'var(--primary)' }}>📚 How to Use Student Mode</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ lineHeight: '1.8' }}>
                            <h3 style={{ color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>🎯 Learning Workflow</h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>1. Select a Topic & Question Pattern</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Choose a topic (e.g., "Binomial Distribution") and a specific question pattern to practice.
                                </p>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>2. Practice Loop</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Click "Get Question" to fetch a random, unattempted question.
                                    <br />
                                    The question remains active until you <strong>Submit Answer</strong>.
                                    <br />
                                    If you click "Next Question" without submitting, it is treated as a skip and may appear again later.
                                </p>
                            </div>

                            <h3 style={{ color: 'var(--primary)', marginTop: '2rem', marginBottom: '0.75rem' }}>🔥 Mastering a Pattern</h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>Streak System</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Build a streak by answering correctly in a row without using hints.
                                </p>
                                <ul style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                                    <li><strong>Easy:</strong> 3 correct in a row</li>
                                    <li><strong>Medium:</strong> 4 correct in a row</li>
                                    <li><strong>Hard:</strong> 5 correct in a row</li>
                                </ul>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Hitting these targets marks the pattern as "Practiced" (⭐) on your dashboard.
                                </p>
                            </div>

                            <h3 style={{ color: 'var(--primary)', marginTop: '2rem', marginBottom: '0.75rem' }}>📊 Dashboard & Sharing</h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>Your Stats</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Check "My Dashboard" to see:
                                </p>
                                <ul style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                                    <li><strong>Topics Explored:</strong> Breadth of your study.</li>
                                    <li><strong>Questions Practiced:</strong> Total distinct questions attempted.</li>
                                    <li><strong>Questions Shared:</strong> Count of questions you contributed to the community.</li>
                                </ul>
                            </div>

                            <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)' }}>
                                <strong style={{ color: '#1e40af' }}>💪 Pro Tip:</strong>
                                <p style={{ marginTop: '0.5rem', color: '#1e40af', marginBottom: 0 }}>
                                    Try to solve without hints first. Use hints strategically when you're stuck. Always review the full solution to understand the complete approach!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
