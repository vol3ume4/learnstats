"use client";

import { useState } from "react";

export default function StudentHelp() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn btn-secondary"
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
                            <h3 style={{ color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>🎯 Getting Started</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                LearnStats offers two ways to learn: <strong>Classroom Mode</strong> (guided by a teacher) and <strong>Practice Mode</strong> (self-paced).
                            </p>

                            <h3 style={{ color: 'var(--primary)', marginTop: '1.5rem', marginBottom: '0.75rem' }}>🏫 Classroom Mode</h3>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>1. Join a Classroom</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Go to "My Classrooms" and enter the <strong>Invite Code</strong> provided by your teacher (e.g., 2HEYKJ6W).
                                </p>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>2. View Assignments</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Once joined, you'll see assignments from your teacher. Each assignment has a due date and a set of required patterns.
                                </p>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>3. Track Progress</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Click "View Details" on an assignment to see exactly what you need to complete.
                                    <br />
                                    Your progress bar updates as you complete the required patterns.
                                </p>
                            </div>

                            <h3 style={{ color: 'var(--primary)', marginTop: '2rem', marginBottom: '0.75rem' }}>🧩 Practice Mode</h3>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>1. Select a Topic</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Choose any topic from the library (e.g., "Binomial Distribution") to practice at your own pace.
                                </p>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>2. Master Patterns</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Select a pattern and start solving questions.
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

                            <h3 style={{ color: 'var(--primary)', marginTop: '2rem', marginBottom: '0.75rem' }}>🏆 Earning Certificates</h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>Certificate Bundles</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Complete all patterns in a topic bundle to earn certificates:
                                </p>
                                <ul style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                                    <li><strong>Pattern Completion:</strong> Achieve 3-4-5 streaks (Easy, Medium, Hard) for each pattern</li>
                                    <li><strong>Bundle Progress:</strong> Track your completion percentage in the Dashboard</li>
                                    <li><strong>Final Certificate:</strong> Complete all bundles to earn the Complete Certificate in Statistics</li>
                                </ul>
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
                            </div>

                            <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)' }}>
                                <strong style={{ color: '#1e40af' }}>💪 Pro Tip:</strong>
                                <p style={{ marginTop: '0.5rem', color: '#1e40af', marginBottom: 0 }}>
                                    Start with Easy to build confidence, then unlock harder levels. Avoid using hints to maintain your streak and unlock the next difficulty. Complete all three difficulties to mark a pattern as done!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
