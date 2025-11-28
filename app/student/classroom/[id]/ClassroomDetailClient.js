"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import StudentHelp from "../../StudentHelp";

export default function ClassroomDetailClient({ classroomId }) {
    const router = useRouter();
    const [classroom, setClassroom] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = getSupabaseBrowserClient();

    useEffect(() => {
        loadData();
    }, [classroomId]);

    async function loadData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Load classroom info
            const { data: cls } = await supabase
                .from('classrooms')
                .select('*')
                .eq('id', classroomId)
                .single();

            if (cls) setClassroom(cls);

            // Load assignments with progress
            const response = await fetch(
                `/api/student/classroom-assignments?classroomId=${classroomId}&studentId=${user.id}`
            );
            const data = await response.json();

            if (data.assignments) {
                setAssignments(data.assignments);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    function getStatusBadge(assignment) {
        const { status, isOverdue } = assignment;

        const badges = {
            'not_started': { text: 'Not Started', class: 'badge-secondary' },
            'in_progress': { text: 'In Progress', class: 'badge-warning' },
            'completed': { text: 'Completed', class: 'badge-success' },
            'completed_late': { text: 'Completed (Late)', class: 'badge-success' },
            'overdue': { text: 'Overdue', class: 'badge-danger' }
        };

        const badge = badges[status] || badges['not_started'];

        return (
            <span className={`badge ${badge.class}`}>
                {badge.text}
            </span>
        );
    }

    function getDaysUntilDue(dueDate) {
        if (!dueDate) return null;

        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `${diffDays} days left`;
    }

    function startPractice(assignmentId) {
        router.push(`/student?assignmentId=${assignmentId}`);
    }

    if (loading) {
        return <div className="card">Loading...</div>;
    }

    if (!classroom) {
        return <div className="card">Classroom not found</div>;
    }

    return (
        <div className="container">
            {/* LEVEL 1: Top Bar (Brand & Mode) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary)' }}>
                    Student Mode
                </div>
            </div>

            {/* LEVEL 2: App Bar (Title & Actions) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Left: LearnStats Title */}
                <div style={{ textAlign: 'left', flex: '1 1 auto', minWidth: '200px' }}>
                    <a href="https://learnstats.vercel.app" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)', lineHeight: '1.2' }}>LearnStats</div>
                    </a>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Interactive Statistics Practice</div>
                </div>

                {/* Right: Navigation Buttons */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '0.5rem',
                    maxWidth: '100%',
                    width: 'auto'
                }}>
                    <StudentHelp />
                    <button
                        className="btn btn-secondary"
                        onClick={() => router.push("/student/classrooms")}
                    >
                        🏫 My Classrooms
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => router.push("/student/dashboard")}
                    >
                        📊 My Dashboard
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={async () => {
                            await supabase.auth.signOut();
                            router.push("/login");
                        }}
                    >
                        🚪 Sign Out
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
                    {classroom.name}
                </h1>
                {classroom.description && (
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {classroom.description}
                    </p>
                )}
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Invite Code: <strong>{classroom.invite_code}</strong>
                </p>
            </div>

            <h2 className="section-title">Assignments</h2>

            {assignments.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>No assignments yet. Check back later!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {assignments.map(assignment => {
                        const daysInfo = getDaysUntilDue(assignment.due_date);
                        const isCompleted = assignment.status === 'completed' || assignment.status === 'completed_late';

                        return (
                            <div key={assignment.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0, color: 'var(--primary)' }}>
                                                {assignment.title}
                                            </h3>
                                            {getStatusBadge(assignment)}
                                        </div>

                                        {assignment.description && (
                                            <p style={{
                                                fontSize: '0.95rem',
                                                color: 'var(--text-secondary)',
                                                marginTop: '0.5rem'
                                            }}>
                                                {assignment.description}
                                            </p>
                                        )}

                                        <div style={{
                                            display: 'flex',
                                            gap: '1.5rem',
                                            marginTop: '1rem',
                                            fontSize: '0.9rem'
                                        }}>
                                            {assignment.due_date && (
                                                <span style={{
                                                    color: assignment.isOverdue && !isCompleted ? 'var(--danger)' : 'var(--text-secondary)'
                                                }}>
                                                    📅 {new Date(assignment.due_date).toLocaleDateString()}
                                                    {daysInfo && ` (${daysInfo})`}
                                                </span>
                                            )}
                                            <span style={{ color: 'var(--text-secondary)' }}>
                                                📚 {assignment.patternCount} {assignment.patternCount === 1 ? 'pattern' : 'patterns'}
                                            </span>
                                        </div>

                                        {isCompleted && assignment.progress?.completed_at && (
                                            <div style={{
                                                marginTop: '0.75rem',
                                                fontSize: '0.85rem',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                ✓ Completed on {new Date(assignment.progress.completed_at).toLocaleDateString()}
                                                {assignment.progress.is_late && ' (Late)'}
                                            </div>
                                        )}
                                    </div>

                                    {!isCompleted && (
                                        <button
                                            className="btn"
                                            onClick={() => startPractice(assignment.id)}
                                            style={{ marginLeft: '1rem' }}
                                        >
                                            {assignment.status === 'in_progress' ? 'Continue Practice' : 'Start Practice'} →
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
