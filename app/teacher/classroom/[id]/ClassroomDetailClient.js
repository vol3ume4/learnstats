"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function ClassroomDetailClient({ classroomId }) {
    const router = useRouter();
    const [classroom, setClassroom] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Assignment Form State
    const [newAssignment, setNewAssignment] = useState({
        title: "",
        description: "",
        dueDate: "",
        selectedPatterns: [] // { topicId, patternId, topicName, patternName, difficulty, count }
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

    function addPattern(topic, pattern) {
        // Check if already added - if so, remove it (toggle behavior)
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
                    patternName: pattern.name,
                    difficulty: 'Medium',
                    count: 5
                }]
            }));
        }
    }

    function removePattern(index) {
        setNewAssignment(prev => ({
            ...prev,
            selectedPatterns: prev.selectedPatterns.filter((_, i) => i !== index)
        }));
    }

    function updatePatternConfig(index, field, value) {
        setNewAssignment(prev => {
            const updated = [...prev.selectedPatterns];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, selectedPatterns: updated };
        });
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

            const response = await fetch('/api/teacher/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classroomId,
                    teacherId: user.id,
                    title: newAssignment.title,
                    description: newAssignment.description,
                    dueDate: newAssignment.dueDate,
                    patterns: newAssignment.selectedPatterns
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

    if (loading) return <div className="card">Loading...</div>;
    if (!classroom) return <div className="card">Classroom not found</div>;

    return (
        <div className="container">
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => router.push('/teacher')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginBottom: '1rem' }}
                >
                    ← Back to Classrooms
                </button>
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

            <h2 className="section-title">Assignments</h2>

            {assignments.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p>No assignments yet. Create one to get started!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {assignments.map(assignment => (
                        <div key={assignment.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>{assignment.title}</h3>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        {assignment.description}
                                    </p>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                                        <span style={{ background: 'var(--surface)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                            📅 Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                                        </span>
                                        <span style={{ background: 'var(--surface)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                            📚 {assignment.patternCount} Patterns
                                        </span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className={`badge ${assignment.is_active ? 'badge-success' : 'badge-warning'}`}>
                                        {assignment.is_active ? 'Active' : 'Draft'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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
                            <h2 style={{ margin: 0 }}>Create New Assignment</h2>
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

                                <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: 'var(--text)' }}>Select Content</h3>
                                <div style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    background: 'var(--background)'
                                }}>
                                    {contentTree.map(topic => (
                                        <div key={topic.id}>
                                            <div
                                                onClick={() => toggleTopic(topic.id)}
                                                style={{
                                                    padding: '0.75rem',
                                                    cursor: 'pointer',
                                                    background: 'var(--surface)',
                                                    borderBottom: '1px solid var(--border)',
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
                                                <span>{topic.name}</span>
                                            </div>
                                            {expandedTopics[topic.id] && (
                                                <div style={{ padding: '0.5rem', background: 'var(--background)' }}>
                                                    {topic.patterns.map(pattern => {
                                                        const isSelected = newAssignment.selectedPatterns.some(p => p.patternId === pattern.id);
                                                        return (
                                                            <div
                                                                key={pattern.id}
                                                                onClick={() => addPattern(topic, pattern)}
                                                                style={{
                                                                    padding: '0.5rem 0.75rem',
                                                                    cursor: 'pointer',
                                                                    borderRadius: '4px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    background: isSelected ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                                                    transition: 'background 0.2s'
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
                                                                    {pattern.name}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column: Selected Items Configuration */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ marginTop: 0 }}>Selected Patterns ({newAssignment.selectedPatterns.length})</h3>
                                {newAssignment.selectedPatterns.length === 0 ? (
                                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                        Select patterns from the left to add them to this assignment.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
                                        {newAssignment.selectedPatterns.map((item, index) => (
                                            <div key={index} className="card" style={{ padding: '1rem', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <strong>{item.topicName} - {item.patternName}</strong>
                                                    <button
                                                        onClick={() => removePattern(index)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <select
                                                        className="input"
                                                        style={{ padding: '0.25rem' }}
                                                        value={item.difficulty}
                                                        onChange={e => updatePatternConfig(index, 'difficulty', e.target.value)}
                                                    >
                                                        <option value="Easy">Easy</option>
                                                        <option value="Medium">Medium</option>
                                                        <option value="Hard">Hard</option>
                                                    </select>
                                                    <input
                                                        className="input"
                                                        type="number"
                                                        min="1" max="20"
                                                        style={{ padding: '0.25rem', width: '60px' }}
                                                        value={item.count}
                                                        onChange={e => updatePatternConfig(index, 'count', parseInt(e.target.value))}
                                                    />
                                                    <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>questions</span>
                                                </div>
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
        </div>
    );
}
