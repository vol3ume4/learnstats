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
                                Teacher Mode lets you create and manage learning content for students. You can define topics,
                                create practice patterns, and generate questions using AI to build a comprehensive statistics curriculum.
                            </p>

                            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                                📋 Content Creation Workflow
                            </h3>

                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>1. Select a Topic</strong>
                                <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Choose from existing topics or create new ones. Topics are organized into certificate bundles.
                                </p>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>2. Define Teaching Approach (Optional)</strong>
                                <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Set the pedagogical approach for the topic. This guides how students learn the material.
                                </p>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>3. Create Question Patterns</strong>
                                <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Add patterns manually or use AI generation. Each pattern represents a type of problem students will practice.
                                </p>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>4. Generate Questions</strong>
                                <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    For each pattern, generate questions at Easy, Medium, and Hard difficulty levels.
                                </p>
                            </div>

                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef3c7', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #f59e0b' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}>
                                    <strong>AI Badge:</strong> Content marked with <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0284c7' }}>AI</span> was generated automatically. Review and edit as needed.
                                </p>
                            </div>

                            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                                🎓 Student Learning Path
                            </h3>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Students complete patterns by achieving streaks:
                            </p>
                            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <li><strong>Easy:</strong> 3 correct answers → Unlocks Medium</li>
                                <li><strong>Medium:</strong> 4 correct answers → Unlocks Hard</li>
                                <li><strong>Hard:</strong> 5 correct answers → Pattern Completed ✓</li>
                            </ul>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                When all patterns in a topic bundle are completed, students earn a certificate!
                            </p>

                            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                                ✅ Best Practices
                            </h3>
                            <ul style={{ color: 'var(--text-secondary)' }}>
                                <li>Review existing patterns before adding new ones to avoid duplicates</li>
                                <li>Use AI generation for quick content creation, then refine manually</li>
                                <li>Create 3-5 patterns per topic for comprehensive coverage</li>
                                <li>Generate 5-10 questions per pattern per difficulty level</li>
                                <li>Ensure questions are clear, accurate, and progressively challenging</li>
                                <li>Test patterns yourself in Student Mode to verify quality</li>
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
