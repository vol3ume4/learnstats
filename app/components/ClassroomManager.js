"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function ClassroomManager() {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClassroom, setNewClassroom] = useState({ name: "", description: "" });
    const [userId, setUserId] = useState(null);

    const supabase = getSupabaseBrowserClient();

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        if (userId) {
            loadClassrooms();
        }
    }, [userId]);

    async function loadUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
        }
    }

    async function loadClassrooms() {
        try {
            const response = await fetch(`/api/teacher/classrooms?teacherId=${userId}`);
            const data = await response.json();

            if (data.classrooms) {
                setClassrooms(data.classrooms);
            }
        } catch (error) {
            console.error('Error loading classrooms:', error);
        } finally {
            setLoading(false);
        }
    }

    async function createClassroom() {
        if (!newClassroom.name.trim()) {
            alert('Please enter a classroom name');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/teacher/classrooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newClassroom.name,
                    description: newClassroom.description,
                    teacherId: userId
                })
            });

            const data = await response.json();

            if (data.classroom) {
                setClassrooms([data.classroom, ...classrooms]);
                setNewClassroom({ name: "", description: "" });
                setShowCreateModal(false);
            } else {
                alert('Error creating classroom: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to create classroom');
        } finally {
            setLoading(false);
        }
    }

    async function deleteClassroom(id) {
        if (!confirm('Are you sure you want to delete this classroom?')) {
            return;
        }

        try {
            const response = await fetch(`/api/teacher/classrooms?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setClassrooms(classrooms.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to delete classroom');
        }
    }

    function copyInviteCode(code) {
        navigator.clipboard.writeText(`${window.location.origin}/student/join/${code}`);
        alert('Invite link copied to clipboard!');
    }

    if (loading && classrooms.length === 0) {
        return <div className="card">Loading classrooms...</div>;
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="section-title" style={{ margin: 0 }}>🏫 My Classrooms</h2>
                <button
                    className="btn"
                    onClick={() => setShowCreateModal(true)}
                >
                    ➕ Create Classroom
                </button>
            </div>

            {classrooms.length === 0 ? (
                <div className="alert alert-info">
                    <strong>No classrooms yet!</strong>
                    <p style={{ marginTop: '0.5rem' }}>Create your first classroom to start inviting students and creating assignments.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {classrooms.map(classroom => (
                        <div
                            key={classroom.id}
                            className="card"
                            style={{
                                background: 'var(--background)',
                                border: '1px solid var(--border)',
                                padding: '1.25rem'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, marginBottom: '0.5rem', color: 'var(--primary)' }}>
                                        {classroom.name}
                                    </h3>
                                    {classroom.description && (
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {classroom.description}
                                        </p>
                                    )}
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => deleteClassroom(classroom.id)}
                                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                                >
                                    🗑️ Delete
                                </button>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '1rem',
                                marginTop: '1rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid var(--border)'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        Invite Code
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <code style={{
                                            background: 'var(--surface)',
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem',
                                            color: 'var(--primary)'
                                        }}>
                                            {classroom.invite_code}
                                        </code>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => copyInviteCode(classroom.invite_code)}
                                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
                                        >
                                            📋 Copy Link
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        Students Enrolled
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                        {classroom.classroom_enrollments?.[0]?.count || 0}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        Created
                                    </div>
                                    <div style={{ fontSize: '0.9rem' }}>
                                        {new Date(classroom.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Classroom Modal */}
            {showCreateModal && (
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
                    onClick={() => setShowCreateModal(false)}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: '500px',
                            width: '100%'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginTop: 0, color: 'var(--primary)' }}>Create New Classroom</h3>

                        <div className="flex-col">
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Classroom Name *
                                </label>
                                <input
                                    className="input"
                                    type="text"
                                    placeholder="e.g., Statistics 101 - Fall 2024"
                                    value={newClassroom.name}
                                    onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Description (Optional)
                                </label>
                                <textarea
                                    className="input"
                                    rows="3"
                                    placeholder="Brief description of the classroom..."
                                    value={newClassroom.description}
                                    onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn"
                                    onClick={createClassroom}
                                    disabled={loading}
                                    style={{ flex: 1 }}
                                >
                                    {loading ? 'Creating...' : 'Create Classroom'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
