"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function ClassroomDetailClient({ classroomId }) {
    const router = useRouter();
    const [classroom, setClassroom] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [students, setStudents] = useState([]);
    const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'students'
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewingAssignment, setViewingAssignment] = useState(null);
    const [assignmentDetails, setAssignmentDetails] = useState(null);
    const [editingAssignment, setEditingAssignment] = useState(null);

    // Assignment Form State
    const [newAssignment, setNewAssignment] = useState({
        title: "",
        description: "",
        dueDate: "",
        selectedPatterns: [] // { topicId, patternId, topicName, patternName }
    });

    // Content Tree State
    const [contentTree, setContentTree] = useState([]);
    const [expandedTopics, setExpandedTopics] = useState({});

    const supabase = getSupabaseBrowserClient();

    useEffect(() => {
        loadData();
    }, [classroomId]);

    async function loadData() {
        try {
            // Load Classroom Info
            const { data: cls } = await supabase
                .from('classrooms')
                .select('*')
                .eq('id', classroomId)
                .single();

            if (cls) setClassroom(cls);

            // Load Assignments
            const res = await fetch(`/api/teacher/assignments?classroomId=${classroomId}`);
            const data = await res.json();
            if (data.assignments) setAssignments(data.assignments);

            // Load Students
            const studentsRes = await fetch(`/api/teacher/classroom-students?classroomId=${classroomId}`);
            const studentsData = await studentsRes.json();
            if (studentsData.students) setStudents(studentsData.students);

            // Load Content Tree for picker
            const treeRes = await fetch('/api/teacher/get-content-tree');
            const treeData = await treeRes.json();
            if (treeData.contentTree) setContentTree(treeData.contentTree);

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    function toggleTopic(topicId) {
        setExpandedTopics(prev => ({
            ...prev,
            [topicId]: !prev[topicId]
        }));
    }

    function togglePattern(topic, pattern) {
        const existingIndex = newAssignment.selectedPatterns.findIndex(p => p.patternId === pattern.id);

        if (existingIndex !== -1) {
            // Remove it
            setNewAssignment(prev => ({
                ...prev,
                selectedPatterns: prev.selectedPatterns.filter((_, i) => i !== existingIndex)
            }));
        } else {
            // Add it
            setNewAssignment(prev => ({
                ...prev,
                selectedPatterns: [...prev.selectedPatterns, {
                    topicId: topic.id,
                    patternId: pattern.id,
                    topicName: topic.name,
                    patternName: pattern.pattern  // Changed from pattern.name
                }]
            }));
        }
    }

    function toggleAllPatternsInTopic(topic) {
        const topicPatternIds = topic.patterns.map(p => p.id);
        const allSelected = topicPatternIds.every(id =>
            newAssignment.selectedPatterns.some(p => p.patternId === id)
        );

        if (allSelected) {
            // Remove all patterns from this topic
            setNewAssignment(prev => ({
                ...prev,
                selectedPatterns: prev.selectedPatterns.filter(p => p.topicId !== topic.id)
            }));
        } else {
            // Add all patterns from this topic
            const newPatterns = topic.patterns
                .filter(pattern => !newAssignment.selectedPatterns.some(p => p.patternId === pattern.id))
                .map(pattern => ({
                    topicId: topic.id,
                    patternId: pattern.id,
                    topicName: topic.name,
                    patternName: pattern.pattern  // Changed from pattern.name
                }));

            setNewAssignment(prev => ({
                ...prev,
                selectedPatterns: [...prev.selectedPatterns, ...newPatterns]
            }));
        }
    }

    function removePattern(index) {
        setNewAssignment(prev => ({
            ...prev,
            selectedPatterns: prev.selectedPatterns.filter((_, i) => i !== index)
        }));
    }

    async function createAssignment() {
        if (!newAssignment.title) {
            alert('Please enter a title');
            return;
        }
        if (newAssignment.selectedPatterns.length === 0) {
            alert('Please select at least one pattern');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Expand each pattern into 3 difficulty levels
            const patternsWithDifficulties = newAssignment.selectedPatterns.flatMap(p => [
                { ...p, difficulty: 'Easy', count: 3 },
                { ...p, difficulty: 'Medium', count: 4 },
                { ...p, difficulty: 'Hard', count: 5 }
            ]);

            const response = await fetch('/api/teacher/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classroomId,
                    teacherId: user.id,
                    title: newAssignment.title,
                    description: newAssignment.description,
                    dueDate: newAssignment.dueDate,
                    patterns: patternsWithDifficulties
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Assignment created successfully!');
                setShowCreateModal(false);
                setNewAssignment({ title: "", description: "", dueDate: "", selectedPatterns: [] });
                loadData(); // Reload list
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to create assignment');
        }
    }

    async function viewAssignmentDetails(assignment) {
        try {
            const { data, error } = await supabase
                .from('assignment_patterns')
                .select(`
                    *,
                    topics(name),
                    patterns(pattern)
                `)
                .eq('assignment_id', assignment.id);

            if (error) throw error;

            // Group by pattern to show unique patterns with their difficulties
            const patternMap = {};
            data.forEach(ap => {
                const key = ap.pattern_id;
                if (!patternMap[key]) {
                    patternMap[key] = {
                        patternId: ap.pattern_id,
                        patternName: ap.patterns.pattern,
                        topicName: ap.topics.name,
                        difficulties: []
                    };
                }
                patternMap[key].difficulties.push({
                    difficulty: ap.difficulty,
                    count: ap.required_questions
                });
            });

            setAssignmentDetails(Object.values(patternMap));
            setViewingAssignment(assignment);
        } catch (error) {
            console.error('Error loading assignment details:', error);
            alert('Failed to load assignment details');
        }
    }

    if (loading) return <div className="card">Loading...</div>;
    if (!classroom) return <div className="card">Classroom not found</div>;

    return (
        <div className="container">
            {/* LEVEL 1: Top Bar (Brand & Mode) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary)' }}>
                    Teacher Mode
                </div>
            </div>

            {/* LEVEL 2: App Bar (Title & Actions) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
                {/* Left: LearnStats Title */}
                <div style={{ textAlign: 'left', flex: '1 1 auto', minWidth: '200px' }}>
                    <a href="https://learnstats.vercel.app" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)', lineHeight: '1.2' }}>LearnStats</div>
                    </a>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Teacher Studio</div>
                </div>

                {/* Right: Navigation Buttons */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '0.5rem',
                    maxWidth: '100%',
                    width: 'auto'
                }}>
                    <button
                        className="btn btn-secondary"
                        onClick={() => router.push("/teacher")}
                    >
                        🏫 My Classrooms
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>{classroom.name}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Invite Code: <strong>{classroom.invite_code}</strong></p>
                    </div>
                    <button className="btn" onClick={() => setShowCreateModal(true)}>
                        ➕ Create Assignment
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--border)' }}>
                <button
                    onClick={() => setActiveTab('assignments')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'assignments' ? '3px solid var(--primary)' : '3px solid transparent',
                        color: activeTab === 'assignments' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: activeTab === 'assignments' ? '600' : '400',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    📚 Assignments ({assignments.length})
                </button>
                <button
                    onClick={() => setActiveTab('students')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: activeTab === 'students' ? '3px solid var(--primary)' : '3px solid transparent',
                        color: activeTab === 'students' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: activeTab === 'students' ? '600' : '400',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    👥 Students ({students.length})
                </button>
            </div>

            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
                <>
                    <h2 className="section-title">Assignments</h2>

                    {assignments.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p>No assignments yet. Create one to get started!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {assignments.map(assignment => (
                                <div key={assignment.id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: 0, color: 'var(--primary)' }}>{assignment.title}</h3>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                                {assignment.description}
                                            </p>
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                                                <span style={{ background: 'var(--surface)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                                    📅 Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                                                </span>
                                                <span style={{ background: 'var(--surface)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                                    📚 {assignment.patternCount} {assignment.patternCount === 1 ? 'Pattern' : 'Patterns'}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                            <span className={`badge ${assignment.is_active ? 'badge-success' : 'badge-warning'}`}>
                                                {assignment.is_active ? 'Active' : 'Draft'}
                                            </span>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => viewAssignmentDetails(assignment)}
                                                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
                <>
                    <h2 className="section-title">Students</h2>
                    {students.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <p>No students enrolled yet. Share the invite code!</p>
                        </div>
                    ) : (
                        <div className="card">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Joined</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => (
                                        <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.75rem' }}>{student.email}</td>
                                            <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                {new Date(student.joinedAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <span className={`badge ${student.isActive ? 'badge-success' : 'badge-warning'}`}>
                                                    {student.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={async () => {
                                                        await fetch('/api/teacher/classroom-students', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                studentId: student.studentId,
                                                                classroomId,
                                                                isActive: !student.isActive
                                                            })
                                                        });
                                                        loadData();
                                                    }}
                                                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                                >
                                                    {student.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Create Assignment Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ margin: 0, color: 'var(--text)' }}>Create New Assignment</h2>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Auto-progression: Easy (3 questions) → Medium (4 questions) → Hard (5 questions)
                            </p>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* Left Column: Details & Selection */}
                            <div>
                                <div className="form-group">
                                    <label className="label">Title</label>
                                    <input
                                        className="input"
                                        value={newAssignment.title}
                                        onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                        placeholder="e.g., Week 1 Practice"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">Description</label>
                                    <textarea
                                        className="input"
                                        rows="2"
                                        value={newAssignment.description}
                                        onChange={e => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">Due Date</label>
                                    <input
                                        className="input"
                                        type="date"
                                        value={newAssignment.dueDate}
                                        onChange={e => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                                    />
                                </div>

                                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: 'var(--text)' }}>Select Patterns</h3>
                                <div style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    background: 'var(--background)'
                                }}>
                                    {contentTree.map(topic => {
                                        const topicPatternIds = topic.patterns.map(p => p.id);
                                        const allTopicPatternsSelected = topicPatternIds.length > 0 && topicPatternIds.every(id =>
                                            newAssignment.selectedPatterns.some(p => p.patternId === id)
                                        );
                                        const someTopicPatternsSelected = topicPatternIds.some(id =>
                                            newAssignment.selectedPatterns.some(p => p.patternId === id)
                                        );

                                        return (
                                            <div key={topic.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <div
                                                    style={{
                                                        padding: '0.75rem',
                                                        background: 'var(--surface)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.75rem'
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={allTopicPatternsSelected}
                                                        onChange={() => toggleAllPatternsInTopic(topic)}
                                                        style={{
                                                            cursor: 'pointer',
                                                            width: '18px',
                                                            height: '18px',
                                                            opacity: someTopicPatternsSelected && !allTopicPatternsSelected ? 0.5 : 1
                                                        }}
                                                    />
                                                    <span
                                                        onClick={() => toggleTopic(topic.id)}
                                                        style={{
                                                            flex: 1,
                                                            cursor: 'pointer',
                                                            fontWeight: '600',
                                                            color: 'var(--text)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            {expandedTopics[topic.id] ? '▼' : '▶'}
                                                        </span>
                                                        {topic.name}
                                                    </span>
                                                </div>
                                                {expandedTopics[topic.id] && (
                                                    <div style={{ padding: '0.5rem 0.5rem 0.5rem 2.5rem', background: 'var(--background)' }}>
                                                        {topic.patterns.map(pattern => {
                                                            const isSelected = newAssignment.selectedPatterns.some(p => p.patternId === pattern.id);
                                                            return (
                                                                <div
                                                                    key={pattern.id}
                                                                    onClick={() => togglePattern(topic, pattern)}
                                                                    style={{
                                                                        padding: '0.5rem 0.75rem',
                                                                        cursor: 'pointer',
                                                                        borderRadius: '4px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.75rem',
                                                                        background: isSelected ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                                                        transition: 'background 0.2s',
                                                                        marginBottom: '0.25rem'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        if (!isSelected) e.currentTarget.style.background = 'var(--surface)';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                                                                    }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        readOnly
                                                                        style={{
                                                                            cursor: 'pointer',
                                                                            width: '16px',
                                                                            height: '16px'
                                                                        }}
                                                                    />
                                                                    <span style={{
                                                                        flex: 1,
                                                                        color: 'var(--text)',
                                                                        fontSize: '0.95rem'
                                                                    }}>
                                                                        {pattern.pattern}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Column: Selected Items */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ marginTop: 0, color: 'var(--text)' }}>Selected Patterns ({newAssignment.selectedPatterns.length})</h3>
                                {newAssignment.selectedPatterns.length === 0 ? (
                                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                        Select patterns from the left. Each pattern will include all three difficulty levels.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                                        {newAssignment.selectedPatterns.map((item, index) => (
                                            <div key={index} className="card" style={{
                                                padding: '0.75rem',
                                                border: '1px solid var(--border)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '0.25rem' }}>
                                                        {item.patternName}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        {item.topicName} • Easy (3) → Medium (4) → Hard (5)
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removePattern(index)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '1.5rem',
                                                        color: 'var(--text-secondary)',
                                                        padding: '0 0.5rem'
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="btn" onClick={createAssignment}>Create Assignment</button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Assignment Details Modal */}
            {viewingAssignment && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '2rem'
                }} onClick={() => { setViewingAssignment(null); setAssignmentDetails(null); }}>
                    <div className="card" style={{
                        width: '100%',
                        maxWidth: '700px',
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: 0
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ margin: 0, color: 'var(--text)' }}>{viewingAssignment.title}</h2>
                            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {viewingAssignment.description}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                                <span style={{ background: 'var(--surface)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                    📅 Due: {viewingAssignment.due_date ? new Date(viewingAssignment.due_date).toLocaleDateString() : 'No due date'}
                                </span>
                                <span style={{ background: 'var(--surface)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                    📚 {assignmentDetails?.length || 0} {assignmentDetails?.length === 1 ? 'Pattern' : 'Patterns'}
                                </span>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text)' }}>Included Patterns</h3>
                            {assignmentDetails ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {assignmentDetails.map((pattern, index) => (
                                        <div key={index} className="card" style={{
                                            padding: '1rem',
                                            border: '1px solid var(--border)',
                                            background: 'var(--background)'
                                        }}>
                                            <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '0.5rem' }}>
                                                {pattern.patternName}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                                {pattern.topicName}
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {pattern.difficulties.sort((a, b) => {
                                                    const order = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
                                                    return order[a.difficulty] - order[b.difficulty];
                                                }).map((diff, i) => (
                                                    <span key={i} style={{
                                                        background: diff.difficulty === 'Easy' ? '#dcfce7' :
                                                            diff.difficulty === 'Medium' ? '#fef3c7' : '#fee2e2',
                                                        color: diff.difficulty === 'Easy' ? '#166534' :
                                                            diff.difficulty === 'Medium' ? '#92400e' : '#991b1b',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '500'
                                                    }}>
                                                        {diff.difficulty}: {diff.count} questions
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => { setViewingAssignment(null); setAssignmentDetails(null); }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
