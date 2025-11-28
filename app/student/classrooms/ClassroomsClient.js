"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function ClassroomsClient() {
    const router = useRouter();
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = getSupabaseBrowserClient();

    useEffect(() => {
        loadClassrooms();
    }, []);

    async function loadClassrooms() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const response = await fetch(`/api/student/my-classrooms?studentId=${user.id}`);
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

    if (loading) {
        return <div className="card">Loading your classrooms...</div>;
    }

    return (
        <div className="container">
            <div style={{ marginBottom: '2rem' }}>
                <h1 className="page-title">🏫 My Classrooms</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    View your enrolled classrooms and assignments
                </p>
            </div>

            {classrooms.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>No Classrooms Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Join a classroom using an invite code from your teacher
                    </p>
                    <button
                        className="btn"
                        onClick={() => router.push('/student')}
                    >
                        Go to Practice
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {classrooms.map(classroom => (
                        <div key={classroom.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.3rem' }}>
                                        {classroom.name}
                                    </h2>
                                    {classroom.description && (
                                        <p style={{
                                            color: 'var(--text-secondary)',
                                            marginTop: '0.5rem',
                                            fontSize: '0.95rem'
                                        }}>
                                            {classroom.description}
                                        </p>
                                    )}
                                    <div style={{
                                        display: 'flex',
                                        gap: '1.5rem',
                                        marginTop: '1rem',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <span>
                                            👨‍🏫 {classroom.teacher?.email || 'Unknown Teacher'}
                                        </span>
                                        <span>
                                            👥 {classroom.studentCount} {classroom.studentCount === 1 ? 'student' : 'students'}
                                        </span>
                                        <span>
                                            📚 {classroom.assignmentCount} {classroom.assignmentCount === 1 ? 'assignment' : 'assignments'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    className="btn"
                                    onClick={() => router.push(`/student/classroom/${classroom.id}`)}
                                    style={{ marginLeft: '1rem' }}
                                >
                                    View Assignments →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
