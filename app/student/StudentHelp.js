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
                                <strong style={{ color: 'var(--primary)' }}>1. Select a Topic</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Choose the statistical concept you want to practice (e.g., "Binomial Distribution", "Hypothesis Testing").
                                </p>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>2. Choose a Pattern</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Each topic has specific problem patterns. Pick one to focus on (e.g., "Calculate Exact Probability", "One-Sample t-Test").
                                </p>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>3. Set Difficulty</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Choose Easy, Medium, or Hard based on your comfort level.
                                </p>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>4. Get a Question</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Click "Get Question" to receive a practice problem tailored to your selections.
                                </p>
                            </div>

                            <h3 style={{ color: 'var(--primary)', marginTop: '2rem', marginBottom: '0.75rem' }}>💡 Solving Questions</h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>Try it yourself first!</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    Type your answer in the input box and click "Submit Answer" to get instant feedback.
                                </p>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>Need help?</strong>
                                <ul style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                                    <li><strong>Hint (Stats):</strong> Get a conceptual hint about the statistical approach</li>
                                    <li><strong>Hint (Python):</strong> See Python code hints for implementation</li>
                                    <li><strong>Show Full Solution:</strong> View the complete solution with both statistical reasoning and Python code</li>
                                </ul>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>Track your learning</strong>
                                <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                    After submitting, add personal remarks to note what you learned or struggled with. This helps reinforce your understanding!
                                </p>
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
