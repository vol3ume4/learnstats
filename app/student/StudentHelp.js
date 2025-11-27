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

                            <h3 style={{ color: 'var(--primary)', marginTop: '2rem', marginBottom: '0.75rem' }}>🔥 Completing a Pattern</h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>Streak System & Unlocking</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Build a streak by answering correctly in a row <strong>without using hints</strong>.
                                </p>
                                <ul style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                                    <li><strong>Easy:</strong> Always unlocked. Get 3 correct → Unlock Medium 🎉</li>
                                    <li><strong>Medium:</strong> 🔒 Unlocks after 3-streak on Easy. Get 4 correct → Unlock Hard 🎉</li>
                                    <li><strong>Hard:</strong> 🔒 Unlocks after 4-streak on Medium. Get 5 correct → Pattern Completed ⭐</li>
                                </ul>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    💡 Once unlocked, difficulties stay unlocked forever! Your progress is saved.
                                </p>
                            </div>

                            <h3 style={{ color: 'var(--primary)', marginTop: '2rem', marginBottom: '0.75rem' }}>👍 Rate Questions</h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>Help Improve the Question Pool</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    After submitting an answer, you can rate the question:
                                </p>
                                <ul style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                                    <li><strong>👍 Helpful:</strong> Great question! It will appear more often to help others.</li>
                                    <li><strong>🚩 Flag for Review:</strong> Something's wrong? It will be reviewed and improved.</li>
                                </ul>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Your feedback shapes the learning experience for everyone!
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
                                    Start with Easy to build confidence, then unlock harder levels. Don't use hints if you want to maintain your streak and unlock the next difficulty!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
