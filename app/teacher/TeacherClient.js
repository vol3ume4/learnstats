"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";
import TeacherHelp from "./TeacherHelp";

export default function TeacherClient() {
  // ---------- ALL HOOKS AT TOP ----------
  const [userId, setUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [topics, setTopics] = useState([]);
  const [topicId, setTopicId] = useState(null);
  const [topicName, setTopicName] = useState("");
  const [topicApproach, setTopicApproach] = useState("");
  const [expandedGroup, setExpandedGroup] = useState("1. Foundations & Data");

  // Workspace State
  const [activeTab, setActiveTab] = useState("view_patterns"); // 'view_patterns' | 'generate_patterns' | 'add_pattern_manual' | 'generate_questions' | 'add_question_manual'

  const [savedPatterns, setSavedPatterns] = useState([]);
  const [existingPatterns, setExistingPatterns] = useState([]);
  const [generatedPatterns, setGeneratedPatterns] = useState([]);
  const [selectedPatterns, setSelectedPatterns] = useState([]);

  const [patternId, setPatternId] = useState(null);
  const [patternApproach, setPatternApproach] = useState("");

  const [difficulty, setDifficulty] = useState("Easy");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // Question Management State
  const [viewQuestionsList, setViewQuestionsList] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  const [loading, setLoading] = useState("");

  // Manual Entry State
  const [manualMode, setManualMode] = useState("text");
  const [manualText, setManualText] = useState("");
  const [manualImage, setManualImage] = useState(null);
  const [enrichedData, setEnrichedData] = useState(null);
  const [enriching, setEnriching] = useState(false);

  const router = useRouter();
  const authCheckRan = useRef(false);
  const topicsLoaded = useRef(false);

  // ---------- AUTH LOAD ----------
  useEffect(() => {
    if (authCheckRan.current) return;
    authCheckRan.current = true;

    async function loadUser() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_teacher")
        .eq("id", user.id)
        .single();

      if (!profile?.is_teacher) {
        router.push("/unauthorized");
        return;
      }

      setUserId(user.id);
      setLoadingUser(false);
    }

    loadUser();
  }, [router]);

  // ---------- LOAD TOPICS ----------
  useEffect(() => {
    if (topicsLoaded.current) return;
    topicsLoaded.current = true;

    async function loadTopics() {
      try {
        const res = await fetch("/api/student/get-topics");
        if (!res.ok) throw new Error("Failed to fetch topics");
        const data = await res.json();
        setTopics(data);
      } catch (err) {
        console.error("Error loading topics:", err);
      }
    }
    loadTopics();
  }, []);

  // ---------- LOAD SAVED PATTERNS ----------
  async function loadSavedPatterns(id) {
    const res = await fetch("/api/student/get-patterns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId: id }),
    });
    const data = await res.json();
    setSavedPatterns(data);
  }

  // ---------- SAVE TOPIC APPROACH ----------
  async function saveTopicApproach() {
    await fetch("/api/teacher/save-topic-approach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId,
        approach: topicApproach,
      }),
    });

    alert("Topic-level preferred approach saved.");
  }

  // ---------- SAVE PATTERN APPROACH ----------
  async function savePatternApproach() {
    if (!patternId) return alert("Select a question pattern first.");

    await fetch("/api/teacher/save-pattern-approach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patternId,
        approach: patternApproach,
      }),
    });

    await loadSavedPatterns(topicId);

    const updated = savedPatterns.find(p => p.id === Number(patternId));
    if (updated) {
      setPatternApproach(updated.teacher_preferred_approach || "");
    }

    alert("Question Pattern-level preferred approach saved.");
  }

  // ---------- GENERATE PATTERNS ----------
  async function generatePatterns() {
    if (!topicId) return alert("Select a topic first.");

    setLoading("Generating question pattern suggestions...");

    const res = await fetch("/api/teacher/generate-patterns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, topicName }),
    });

    const data = await res.json();

    setExistingPatterns(data.existing || []);
    setGeneratedPatterns(data.additions || []);
    setSelectedPatterns([]);

    setLoading("");
  }

  // ---------- SAVE PATTERNS ----------
  async function savePatterns() {
    if (selectedPatterns.length === 0) {
      alert("Select at least one question pattern.");
      return;
    }

    setLoading("Saving question patterns...");

    await fetch("/api/teacher/save-patterns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId,
        patterns: selectedPatterns,
        userId,
      }),
    });

    await loadSavedPatterns(topicId);
    alert("Question Patterns saved.");

    setLoading("");
  }

  // ---------- GENERATE QUESTIONS ----------
  async function generateQuestions() {
    if (!patternId) return alert("Select a question pattern first.");

    setLoading("Generating questions...");

    const patternObj = savedPatterns.find((p) => p.id === Number(patternId));

    const res = await fetch("/api/teacher/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId,
        patternId,
        patternText: patternObj.pattern,
        difficulty,
        topicApproach,
        patternApproach,
      }),
    });

    const data = await res.json();
    setGeneratedQuestions(data);
    setSelectedQuestions([]);

    setLoading("");
  }

  // ---------- SAVE QUESTIONS ----------
  async function saveQuestions() {
    if (!patternId) return alert("Choose a question pattern before saving.");

    const selected = selectedQuestions.map(i => generatedQuestions[i]);
    if (selected.length === 0) {
      return alert("Select at least one question before saving.");
    }

    setLoading("Saving questions...");

    await fetch("/api/teacher/save-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicId,
        patternId,
        difficulty,
        questions: selected,
      }),
    });

    alert("Selected questions saved.");
    setGeneratedQuestions([]);
    setSelectedQuestions([]);
    setLoading("");
  }

  // ---------- QUESTION MANAGEMENT ----------
  async function fetchQuestions() {
    if (!topicId || !patternId || !difficulty) return;

    setLoading("Fetching questions...");
    setHasFetched(true);
    try {
      const res = await fetch("/api/teacher/get-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, patternId, difficulty }),
      });
      const data = await res.json();
      setViewQuestionsList(data);
    } catch (err) {
      alert("Error fetching questions");
    } finally {
      setLoading("");
    }
  }

  async function updateQuestion() {
    if (!editingQuestion) return;

    setLoading("Updating question...");
    try {
      const res = await fetch("/api/teacher/update-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingQuestion),
      });
      const data = await res.json();
      if (data.success) {
        alert("Question updated!");
        setEditingQuestion(null);
        fetchQuestions();
      } else {
        alert("Update failed: " + data.error);
      }
    } catch (err) {
      alert("Error updating question");
    } finally {
      setLoading("");
    }
  }

  async function deleteQuestion(id) {
    if (!confirm("Are you sure you want to delete this question?")) return;

    setLoading("Deleting question...");
    try {
      const res = await fetch("/api/teacher/delete-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchQuestions();
      } else {
        alert("Delete failed: " + data.error);
      }
    } catch (err) {
      alert("Error deleting question");
    } finally {
      setLoading("");
    }
  }

  // ---------- MANUAL ENTRY HANDLERS ----------
  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setManualImage(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function enrichQuestion() {
    if (!topicId) return alert("Please select a Topic first.");
    // Pattern is optional for manual entry, we can default to General

    if (manualMode === "text" && !manualText) return alert("Please enter question text.");
    if (manualMode === "image" && !manualImage) return alert("Please upload an image.");

    setEnriching(true);
    setEnrichedData(null);

    try {
      const topicObj = topics.find(t => t.id === topicId);
      const patternObj = savedPatterns.find(p => p.id === patternId);

      const res = await fetch("/api/teacher/enrich-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: manualMode === "text" ? manualText : null,
          image: manualMode === "image" ? manualImage : null,
          topicName: topicObj?.name,
          patternName: patternObj?.pattern || "General Statistics Concept",
          difficulty,
          mode: "teacher"
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Check if question was rejected by validation
      if (data.is_valid_question === false) {
        alert(`❌ Question Validation Failed\n\n${data.message}\n\nPlease revise your question and try again.`);
        setEnriching(false);
        return;
      }

      setEnrichedData(data);
    } catch (err) {
      alert("Error processing question: " + err.message);
    } finally {
      setEnriching(false);
    }
  }

  async function saveManualQuestion() {
    if (!enrichedData) return;

    setLoading("Saving question...");
    try {
      await fetch("/api/teacher/save-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          patternId,
          difficulty,
          questions: [enrichedData], // Wrap in array to reuse existing API
          source: manualMode === "image" ? "image_upload" : "manual_entry",
          created_by: userId
        }),
      });

      alert("Question saved successfully!");
      setEnrichedData(null);
      setManualText("");
      setManualImage(null);
    } catch (err) {
      alert("Error saving: " + err.message);
    } finally {
      setLoading("");
    }
  }

  // ---------- UI ----------
  if (loadingUser) {
    return <div style={{ padding: "40px" }}>Loading...</div>;
  }
  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border)' }}>
        {/* Left: playfullySerious Logo */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <img
            src="/logo-horizontal.png"
            alt="playfullySerious"
            style={{ height: '50px', cursor: 'pointer', objectFit: 'contain' }}
            onClick={() => window.open('https://playfullyserious.com', '_blank')}
          />
        </div>

        {/* Center: LearnStats Title */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>LearnStats</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Teacher Studio</div>
        </div>

        {/* Right: Navigation Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, justifyContent: 'flex-end' }}>
          <TeacherHelp />
          <button
            className="btn btn-secondary"
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {loading && (
        <div className="alert alert-info loading-banner">
          <span className="spinner"></span>
          {loading}
        </div>
      )}

      {
        !topicId ? (
          /* --- TOPIC SELECTION (Accordion) --- */
          <div className="card">
            <h3 className="section-title">Select a Topic to Manage</h3>
            <div className="topic-accordion" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { title: "1. Foundations & Data", keywords: ["Scales", "Data", "Descriptive"] },
                { title: "2. Probability Core", keywords: ["Probability Basics", "Conditional", "Bayes"] },
                { title: "3. Probability Distributions", keywords: ["Binomial", "Poisson", "Normal", "Uniform", "t-Distribution", "F-Distribution", "Geometric", "Exponential"] },
                { title: "4. Inference & Hypothesis Testing", keywords: ["Sampling", "Confidence", "z-test", "t-test", "ANOVA", "Chi-Square", "Regression", "Hypothesis"] }
              ].map((group) => {
                const groupTopics = topics.filter(t => group.keywords.some(k => t.name.includes(k)));
                if (groupTopics.length === 0) return null;
                const isExpanded = expandedGroup === group.title;

                return (
                  <div key={group.title} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <button
                      onClick={() => setExpandedGroup(isExpanded ? null : group.title)}
                      style={{
                        width: '100%', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: isExpanded ? 'var(--background)' : 'white', border: 'none', cursor: 'pointer', fontWeight: '600', color: 'var(--foreground)'
                      }}
                    >
                      <span>{group.title}</span>
                      <span>{isExpanded ? '−' : '+'}</span>
                    </button>

                    {isExpanded && (
                      <div style={{ background: 'white', borderTop: '1px solid var(--border)' }}>
                        {groupTopics.map(t => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setTopicId(t.id);
                              setTopicName(t.name);
                              setTopicApproach(t.teacher_preferred_approach || "");
                              loadSavedPatterns(t.id);
                              setGeneratedPatterns([]);
                            }}
                            style={{
                              width: '100%', padding: '0.75rem 1.5rem', textAlign: 'left', background: 'white', color: 'var(--text-secondary)',
                              border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--background)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* --- WORKSPACE MODE --- */
          <div>
            {/* Header Bar */}
            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => setTopicId(null)}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                >
                  ← Back
                </button>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{topicName}</h2>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {savedPatterns.length} Question Patterns Available
              </div>
            </div>

            {/* ACTION SELECTOR - "I want to..." */}
            <div className="card" style={{ background: 'var(--primary)', color: 'white', marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', opacity: 0.9 }}>
                I want to...
              </label>
              <select
                className="select"
                style={{
                  width: '100%',
                  fontSize: '1.1rem',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: 'white',
                  color: '#111827' // Enforce dark text for the select box itself
                }}
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
              >
                <option value="view_patterns" style={{ color: 'black' }}>📂 View & Manage Question Patterns</option>
                <option value="view_questions" style={{ color: 'black' }}>❓ View & Manage Questions</option>
                <option value="generate_patterns" style={{ color: 'black' }}>🤖 Generate New Question Patterns with AI</option>
                <option value="add_pattern_manual" style={{ color: 'black' }}>✍️ Add a Question Pattern Manually</option>
                <option value="generate_questions" style={{ color: 'black' }}>⚡ Generate Questions with AI</option>
                <option value="add_question_manual" style={{ color: 'black' }}>📝 Add a Question Manually</option>
              </select>
            </div>

            {/* --- VIEW 1: VIEW PATTERNS --- */}
            {activeTab === 'view_patterns' && (
              <div className="card">
                <h3 className="section-title">Existing Question Patterns</h3>

                {/* Teaching Approach */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                  <label className="label">Topic Teaching Approach</label>
                  <textarea
                    className="input"
                    value={topicApproach}
                    onChange={(e) => setTopicApproach(e.target.value)}
                    placeholder="Share your preferred teaching approach for this topic..."
                    style={{ minHeight: "60px", resize: "vertical", marginBottom: '0.5rem', background: 'white' }}
                  />
                  <button onClick={saveTopicApproach} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                    💾 Save Approach
                  </button>
                </div>

                {savedPatterns.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    <p>No question patterns found for this topic yet.</p>
                    <button onClick={() => setActiveTab('generate_patterns')} className="btn" style={{ marginTop: '1rem' }}>
                      Generate First Question Patterns
                    </button>
                  </div>
                ) : (
                  <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)' }}>
                    {savedPatterns.map((p) => (
                      <li key={p.id} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '500' }}>{p.pattern}</span>
                          {p.gemini_generated ? (
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0284c7' }}>AI</span>
                          ) : (
                            <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: '#f3f4f6', color: '#4b5563' }}>Manual</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* --- VIEW 1.5: VIEW QUESTIONS --- */}
            {activeTab === 'view_questions' && (
              <div className="card">
                <h3 className="section-title">View & Manage Questions</h3>

                <div className="form-group">
                  <label className="label">1. Select Question Pattern</label>
                  <select
                    className="select"
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setPatternId(id);
                      setViewQuestionsList([]); // Clear previous list
                      setHasFetched(false); // Reset fetch state
                    }}
                    value={patternId || ""}
                  >
                    <option value="">Select a question pattern...</option>
                    {savedPatterns.map((p) => (
                      <option key={p.id} value={p.id}>{p.pattern}</option>
                    ))}
                  </select>
                </div>

                {patternId && (
                  <div className="form-group">
                    <label className="label">2. Select Difficulty</label>
                    <select
                      className="select"
                      value={difficulty}
                      onChange={(e) => {
                        setDifficulty(e.target.value);
                        setViewQuestionsList([]); // Clear previous list
                        setHasFetched(false); // Reset fetch state
                      }}
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>
                )}

                {patternId && (
                  <button onClick={fetchQuestions} className="btn" disabled={!!loading} style={{ marginBottom: '1.5rem' }}>
                    {loading ? "Loading..." : "🔍 Fetch Questions"}
                  </button>
                )}

                {/* LIST OF QUESTIONS */}
                {viewQuestionsList.length > 0 && (
                  <div className="flex-col">
                    {viewQuestionsList.map((q) => (
                      <div key={q.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                        {editingQuestion?.id === q.id ? (
                          <div className="flex-col" style={{ gap: '0.5rem' }}>
                            <label className="label">Question Text</label>
                            <textarea
                              className="input"
                              value={editingQuestion.question_text}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                              style={{ minHeight: '80px' }}
                            />

                            <label className="label">Correct Answer</label>
                            <input
                              className="input"
                              value={editingQuestion.correct_answer}
                              onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })}
                            />

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <button onClick={updateQuestion} className="btn btn-sm">💾 Save</button>
                              <button onClick={() => setEditingQuestion(null)} className="btn btn-secondary btn-sm">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>{q.question_text}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Answer: {q.correct_answer}</div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                              <button onClick={() => setEditingQuestion(q)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>✏️ Edit</button>
                              <button onClick={() => deleteQuestion(q.id)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', color: '#ef4444', borderColor: '#ef4444' }}>🗑️ Delete</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {patternId && hasFetched && viewQuestionsList.length === 0 && !loading && (
                  <p style={{ color: 'var(--text-secondary)' }}>No questions found for this selection. Try generating some!</p>
                )}
              </div>
            )}

            {/* --- VIEW 2: GENERATE PATTERNS --- */}
            {activeTab === 'generate_patterns' && (
              <div className="card">
                <h3 className="section-title">Generate Question Patterns with AI</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  AI will analyze the topic <strong>"{topicName}"</strong> and suggest common question patterns found in textbooks.
                </p>

                <button onClick={generatePatterns} className="btn" disabled={!!loading} style={{ width: '100%', padding: '1rem' }}>
                  {loading ? "Generating..." : "🚀 Generate Suggestions"}
                </button>

                {generatedPatterns.length > 0 && (
                  <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Select Question Patterns to Keep</h4>
                    <div className="flex-col">
                      {generatedPatterns.map((p, i) => (
                        <label key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) setSelectedPatterns([...selectedPatterns, p.pattern]);
                              else setSelectedPatterns(selectedPatterns.filter((x) => x !== p.pattern));
                            }}
                          />
                          <span>{p.pattern}</span>
                        </label>
                      ))}
                    </div>
                    <button onClick={savePatterns} className="btn" style={{ marginTop: '1.5rem', width: '100%' }}>
                      💾 Save Selected Question Patterns
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- VIEW 3: MANUAL PATTERN --- */}
            {activeTab === 'add_pattern_manual' && (
              <div className="card">
                <h3 className="section-title">Add Question Pattern Manually</h3>
                <div className="form-group">
                  <label className="label">Question Pattern Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., Calculate probability of X > k"
                    id="manual-pattern-input"
                  />
                </div>
                <button
                  className="btn"
                  onClick={async () => {
                    const input = document.getElementById('manual-pattern-input');
                    const val = input.value.trim();
                    if (!val) return;
                    setLoading("Adding...");
                    try {
                      await fetch("/api/teacher/add-pattern", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ topicId, pattern: val, userId }),
                      });
                      input.value = "";
                      await loadSavedPatterns(topicId);
                      alert("Question Pattern added successfully.");
                      setActiveTab('view_patterns'); // Go back to list
                    } catch (err) {
                      alert("Error adding question pattern");
                    }
                    setLoading("");
                  }}
                  disabled={!!loading}
                >
                  {loading ? "Adding..." : "Add Question Pattern"}
                </button>
              </div>
            )}

            {/* --- VIEW 4: GENERATE QUESTIONS --- */}
            {activeTab === 'generate_questions' && (
              <div className="card">
                <h3 className="section-title">Generate Questions</h3>

                <div className="form-group">
                  <label className="label">1. Select Question Pattern Context</label>
                  <select
                    className="select"
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setPatternId(id);
                      const pObj = savedPatterns.find((p) => p.id === id);
                      setPatternApproach(pObj?.teacher_preferred_approach || "");
                    }}
                    value={patternId || ""}
                  >
                    <option value="">Select a question pattern...</option>
                    {savedPatterns.map((p) => (
                      <option key={p.id} value={p.id}>{p.pattern}</option>
                    ))}
                  </select>
                </div>

                {patternId && (
                  <>
                    <div className="form-group">
                      <label className="label">2. Difficulty</label>
                      <select
                        className="select"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                      >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>

                    <button onClick={generateQuestions} className="btn" disabled={!!loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                      {loading ? "Generating..." : "⚡ Generate Questions"}
                    </button>
                  </>
                )}

                {generatedQuestions.length > 0 && (
                  <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Review Generated Questions</h4>
                    <div className="flex-col">
                      {generatedQuestions.map((q, i) => {
                        const checked = selectedQuestions.includes(i);
                        return (
                          <div key={i} style={{
                            padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                            background: checked ? '#eff6ff' : 'transparent', borderColor: checked ? 'var(--primary)' : 'var(--border)'
                          }}>
                            <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setSelectedQuestions(checked ? selectedQuestions.filter(x => x !== i) : [...selectedQuestions, i])}
                                style={{ marginTop: '0.25rem' }}
                              />
                              <div>
                                <strong>{q.question_text}</strong>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                  Answer: {q.correct_answer}
                                </div>
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={saveQuestions} className="btn" style={{ marginTop: '1.5rem', width: '100%' }}>
                      💾 Save Selected Questions
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- VIEW 5: MANUAL QUESTION --- */}
            {activeTab === 'add_question_manual' && (
              <div className="card">
                <h3 className="section-title">Add Question Manually</h3>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <button className={`btn ${manualMode === 'text' ? '' : 'btn-secondary'}`} onClick={() => setManualMode('text')} style={{ flex: 1 }}>📝 Text Input</button>
                  <button className={`btn ${manualMode === 'image' ? '' : 'btn-secondary'}`} onClick={() => setManualMode('image')} style={{ flex: 1 }}>📷 Image Upload</button>
                </div>

                {manualMode === 'text' ? (
                  <textarea
                    className="input"
                    placeholder="Type your question here..."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    style={{ minHeight: '120px' }}
                  />
                ) : (
                  <div style={{ border: '2px dashed var(--border)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                    {manualImage && <img src={manualImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '1rem' }} />}
                  </div>
                )}

                <button
                  className="btn"
                  onClick={enrichQuestion}
                  disabled={enriching || (manualMode === 'text' ? !manualText : !manualImage)}
                  style={{ marginTop: '1.5rem', width: '100%' }}
                >
                  {enriching ? "Processing..." : "✨ Process & Enrich with AI"}
                </button>

                {enrichedData && (
                  <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', background: '#f0fdf4' }}>
                    <h4 style={{ color: 'var(--success)', marginBottom: '1rem', marginTop: 0 }}>Review & Save</h4>
                    <div className="form-group">
                      <label className="label">Question</label>
                      <textarea className="input" value={enrichedData.question_text} onChange={(e) => setEnrichedData({ ...enrichedData, question_text: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="label">Answer</label>
                      <input className="input" value={enrichedData.correct_answer} onChange={(e) => setEnrichedData({ ...enrichedData, correct_answer: e.target.value })} />
                    </div>
                    <button className="btn" onClick={saveManualQuestion} disabled={!!loading} style={{ width: '100%' }}>
                      💾 Save Question
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      }
    </div >
  );
}
