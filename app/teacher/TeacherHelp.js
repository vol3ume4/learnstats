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
                                Teacher Mode is your command center for creating content and managing classrooms. You can build a curriculum,
                                assign work to students, and track their progress.
                            </p>

                            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                                🏫 Classroom Management
                            </h3>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>1. Create Classrooms</strong>
                                <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Create a classroom to group your students. Each classroom gets a unique <strong>Invite Code</strong> (e.g., 2HEYKJ6W).
                                </p>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>2. Invite Students</strong>
                                <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Share the Invite Code or Link with students. They can join instantly from their dashboard.
                                </p>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>3. Manage Students</strong>
                                <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    View enrolled students in the "Students" tab. You can activate or deactivate students to control access.
                                </p>
                            </div>

                            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                                📚 Assignments
                            </h3>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>1. Create Assignments</strong>
                                <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Select specific topics and patterns for students to practice. Set a due date to keep them on track.
                                </p>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong style={{ color: 'var(--primary)' }}>2. View Details</strong>
                                <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Click "View Details" on any assignment to see exactly what patterns and difficulty levels are included.
                                </p>
                            </div>

                            <h3 style={{ fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                                🛠️ Content Creation
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Use the "Content Studio" to build your curriculum:
                            </p>
                            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                <li><strong>Topics:</strong> Organize learning material into logical units.</li>
                                <li><strong>Patterns:</strong> Define specific problem types for students to master.</li>
                                <li><strong>AI Generation:</strong> Automatically generate questions for each pattern at Easy, Medium, and Hard levels.</li>
                            </ul>

                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef3c7', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #f59e0b' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}>
                                    <strong>Pro Tip:</strong> Always review AI-generated questions to ensure accuracy before assigning them to students.
                                </p>
                            </div>

                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <strong>Need help?</strong> Your feedback helps us improve LearnStats. Thank you for teaching with us! 🙏
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
