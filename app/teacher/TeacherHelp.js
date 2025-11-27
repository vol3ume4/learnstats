"use client";

import { useState } from "react";

export default function TeacherHelp() {
    const [showHelp, setShowHelp] = useState(false);

    return (
        <>
            <button
                className="btn btn-secondary"
                onClick={() => setShowHelp(true)}
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
                ❓ How to Use
            </button>

            {showHelp && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}
                    onClick={() => setShowHelp(false)}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: '700px',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            position: 'relative'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>👨‍🏫 Teacher Mode Guide</h2>
                            <button
                                onClick={() => setShowHelp(false)}
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

                        <div style={{ lineHeight: '1.6' }}>
                            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                                🎯 What is Teacher Mode?
                            </h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Teacher Mode lets you create learning content for students. You can define teaching approaches,
                                create practice patterns, and generate questions using AI.
                            </p>

                            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                                📋 The 4-Step Workflow
                            </h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                AI-generated patterns and questions are marked with an <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0284c7' }}>AI</span> badge.
                                <br />
                                You can review, edit, or regenerate them as needed.
                            </p>

                            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                                ✅ Best Practices
                            </h3>
                            <ul style={{ color: 'var(--text-secondary)' }}>
                                <li>Review existing patterns before adding new ones</li>
                                <li>Use AI generation for quick content creation</li>
                                <li>Add manual patterns for specific scenarios AI might miss</li>
                                <li>Only update "Teaching Method" if you're improving shared guidance</li>
                                <li>Generate a mix of Easy, Medium, and Hard questions</li>
                            </ul>

                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <strong>Need help?</strong> Your content helps students learn statistics in a practical, hands-on way.
                                    Thank you for contributing! 🙏
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
