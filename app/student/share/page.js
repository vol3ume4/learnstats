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

    async function processAndShare() {
        if (manualMode === "text" && !manualText) return alert("Please enter question text.");
        if (manualMode === "image" && !manualImage) return alert("Please upload an image.");

        setProcessing(true);

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

            await fetch("/api/teacher/save-questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topicId: matchedTopic.id,
                    patternId: matchedPattern?.id || null,
                    difficulty: "Medium",
                    questions: [{
                        question_text: data.question_text,
                        correct_answer: data.correct_answer,
                        hint_stats: data.hint_stats,
                        hint_python: data.hint_python,
                        solution_stats: data.solution_stats,
                        solution_python: data.solution_python
                    }],
                    source: "student_contribution",
                    created_by: userId,
                    is_verified: true
                }),
            });

            alert(`✅ Question shared successfully!\nTopic: ${data.detected_topic}\nPattern: ${data.detected_pattern || 'General'}`);

            setManualText("");
            setManualImage(null);
            router.push("/student");

        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Share a Question</h1>
                <button className="btn btn-secondary" onClick={() => router.push("/student")}>
                    ← Back
                </button>
            </div>

            <div className="card">
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Found an interesting statistics problem? Share it with the community!
                    Our AI will automatically classify and solve it for you.
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                    📝 Share one question at a time. Bulk upload coming soon!
                </p>

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
                            style={{ minHeight: '120px' }}
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
                    onClick={processAndShare}
                    disabled={processing || (manualMode === 'text' ? !manualText : !manualImage)}
                    style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}
                >
                    {processing ? "🤖 Processing & Sharing..." : "🚀 Share with Community"}
                </button>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', textAlign: 'center' }}>
                    AI will validate, classify, and solve your question automatically.
                </p>
            </div>
        </div>
    );
}
