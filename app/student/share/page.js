"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";

export default function StudentShare() {
    const [userId, setUserId] = useState(null);
    const [topics, setTopics] = useState([]);
    const [patterns, setPatterns] = useState([]);
    const [manualMode, setManualMode] = useState("text");
    const [manualText, setManualText] = useState("");
    const [manualImage, setManualImage] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [enrichedData, setEnrichedData] = useState(null);
    const [showSolution, setShowSolution] = useState(false);

    const router = useRouter();

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUserId(user.id);
        }
        loadUser();
        loadTopics();
    }, []);

    async function loadTopics() {
        try {
            const res = await fetch("/api/student/get-topics");
            const data = await res.json();
            setTopics(data);
        } catch (err) {
            console.error("Error loading topics:", err);
        }
    }

    async function loadAllPatterns() {
        try {
            const allPatterns = [];
            for (const topic of topics) {
                const res = await fetch("/api/student/get-patterns", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ topicId: topic.id })
                });
                const data = await res.json();
                allPatterns.push(...data);
            }
            setPatterns(allPatterns);
        } catch (err) {
            console.error("Error loading patterns:", err);
        }
    }

    useEffect(() => {
        if (topics.length > 0) {
            loadAllPatterns();
        }
    }, [topics]);

    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setManualImage(reader.result);
                        setManualMode('image');
                    };
                    reader.readAsDataURL(blob);
                    e.preventDefault();
                    break;
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setManualImage(reader.result);
        };
        reader.readAsDataURL(file);
    }

    async function processQuestion() {
        if (manualMode === "text" && !manualText) return alert("Please enter question text.");
        if (manualMode === "image" && !manualImage) return alert("Please upload an image.");

        setProcessing(true);
        setEnrichedData(null);
        setShowSolution(false);

        try {
            const res = await fetch("/api/teacher/enrich-question", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: manualMode === "text" ? manualText : null,
                    image: manualMode === "image" ? manualImage : null,
                    existingTopics: topics.map(t => t.name),
                    existingPatterns: patterns.map(p => p.pattern),
                    mode: "student"
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (!data.is_valid_question) {
                alert(data.message || "This doesn't appear to be a valid statistics question.");
                setProcessing(false);
                return;
            }

            const matchedTopic = topics.find(t => t.name === data.detected_topic);
            const matchedPattern = patterns.find(p => p.pattern === data.detected_pattern);

            if (!matchedTopic) {
                alert(`Topic "${data.detected_topic}" not found in database. Please contact admin.`);
                setProcessing(false);
                return;
            }

            setEnrichedData({
                ...data,
                matchedTopic,
                matchedPattern
            });
            setShowSolution(true);

        } catch (err) {
            console.error("Processing error:", err);
            alert("Error: " + err.message);
        } finally {
            setProcessing(false);
        }
    }

    async function saveToDatabase() {
        if (!enrichedData) return;

        setProcessing(true);

        try {
            const saveRes = await fetch("/api/teacher/save-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topicId: enrichedData.matchedTopic.id,
                    patternId: enrichedData.matchedPattern?.id || null,
                    difficulty: "Medium",
                    questions: [{
                        question_text: enrichedData.question_text,
                        correct_answer: enrichedData.correct_answer,
                        hint_stats: enrichedData.hint_stats,
                        hint_python: enrichedData.hint_python,
                        solution_stats: enrichedData.solution_stats,
                        solution_python: enrichedData.solution_python
                    }],
                    source: "student_contribution",
                    created_by: userId,
                    is_verified: true
                }),
            });

            const saveData = await saveRes.json();
            if (!saveData.success) {
                throw new Error("Failed to save question");
            }

            alert("✅ Question saved to database successfully!");

            // Reset form
            setManualText("");
            setManualImage(null);
            setEnrichedData(null);
            setShowSolution(false);

        } catch (err) {
            console.error("Save error:", err);
            alert("Error saving: " + err.message);
        } finally {
            setProcessing(false);
        }
    }

    function startOver() {
        setManualText("");
        setManualImage(null);
        setEnrichedData(null);
        setShowSolution(false);
    }

    if (showSolution && enrichedData) {
        return (
            <div className="container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 className="page-title" style={{ margin: 0 }}>📖 Solution</h1>
                    <button className="btn btn-secondary" onClick={() => router.push("/student")}>
                        ← Back to Student
                    </button>
                </div>

                <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>✨ AI Analysis Complete</h3>
                    <p style={{ margin: 0, opacity: 0.9 }}>
                        <strong>Topic:</strong> {enrichedData.detected_topic} &nbsp;|&nbsp;
                        <strong>Pattern:</strong> {enrichedData.detected_pattern || 'General'}
                    </p>
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0, color: 'var(--primary)' }}>📝 Question</h3>
                    <p style={{ fontSize: '1.05rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {enrichedData.question_text}
                    </p>
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0, color: 'var(--success)' }}>✅ Answer</h3>
                    <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        {enrichedData.correct_answer}
                    </p>
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0, color: '#f59e0b' }}>💡 Statistics Hint</h3>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {enrichedData.hint_stats}
                    </p>
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0, color: '#10b981' }}>🐍 Python Hint</h3>
                    <pre style={{
                        background: '#1e293b',
                        color: '#e2e8f0',
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'auto',
                        fontSize: '0.9rem'
                    }}>
                        {enrichedData.hint_python}
                    </pre>
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0, color: '#8b5cf6' }}>📊 Statistics Solution</h3>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {enrichedData.solution_stats}
                    </p>
                </div>

                <div className="card">
                    <h3 style={{ marginTop: 0, color: '#06b6d4' }}>💻 Python Solution</h3>
                    <pre style={{
                        background: '#1e293b',
                        color: '#e2e8f0',
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'auto',
                        fontSize: '0.9rem'
                    }}>
                        {enrichedData.solution_python}
                    </pre>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button
                        className="btn"
                        onClick={saveToDatabase}
                        disabled={processing}
                        style={{ flex: 1, fontSize: '1.05rem', padding: '1rem' }}
                    >
                        {processing ? "💾 Saving..." : "💾 Save to Database"}
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={startOver}
                        disabled={processing}
                        style={{ flex: 1, fontSize: '1.05rem', padding: '1rem' }}
                    >
                        🔄 Ask Another Question
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>🤔 Get Help with a Question</h1>
                <button className="btn btn-secondary" onClick={() => router.push("/student")}>
                    ← Back
                </button>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>✨ AI-Powered Help</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>
                    Share your statistics problem and get instant solutions with step-by-step explanations!
                </p>
            </div>

            <div className="card">
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button
                        className={`btn ${manualMode === 'text' ? '' : 'btn-secondary'}`}
                        onClick={() => setManualMode('text')}
                    >
                        📝 Text Input
                    </button>
                    <button
                        className={`btn ${manualMode === 'image' ? '' : 'btn-secondary'}`}
                        onClick={() => setManualMode('image')}
                    >
                        📷 Image / Screenshot
                    </button>
                </div>

                {manualMode === 'text' ? (
                    <div className="form-group">
                        <textarea
                            className="input"
                            placeholder="Type or paste your statistics question here..."
                            value={manualText}
                            onChange={(e) => setManualText(e.target.value)}
                            style={{ minHeight: '150px', fontSize: '1.05rem' }}
                        />
                    </div>
                ) : (
                    <div className="form-group">
                        <div style={{ border: '2px dashed var(--border)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
                            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                📋 <strong>Paste a screenshot</strong> (Ctrl+V / Cmd+V) or upload a file
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ marginBottom: '1rem' }}
                            />
                            {manualImage && (
                                <div style={{ marginTop: '1rem' }}>
                                    <img src={manualImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 'var(--radius-sm)' }} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <button
                    className="btn"
                    onClick={processQuestion}
                    disabled={processing || (manualMode === 'text' ? !manualText : !manualImage)}
                    style={{ width: '100%', fontSize: '1.1rem', padding: '1.2rem', marginTop: '1rem' }}
                >
                    {processing ? "🤖 AI is solving your problem..." : "🚀 Get Solution"}
                </button>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', textAlign: 'center' }}>
                    💡 Your question will be analyzed by AI and optionally saved to help other students
                </p>
            </div>
        </div>
    );
}
