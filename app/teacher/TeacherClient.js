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

  const [savedPatterns, setSavedPatterns] = useState([]);
  const [existingPatterns, setExistingPatterns] = useState([]);
  const [generatedPatterns, setGeneratedPatterns] = useState([]);
  const [selectedPatterns, setSelectedPatterns] = useState([]);

  const [patternId, setPatternId] = useState(null);
  const [patternApproach, setPatternApproach] = useState("");

  const [difficulty, setDifficulty] = useState("Easy");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

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
      console.log("TeacherClient: Starting auth check...");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("TeacherClient: getUser result:", user, authError);

      if (!user) {
        console.log("TeacherClient: No user found, redirecting to /login");
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_teacher")
        .eq("id", user.id)
        .single();

      console.log("TeacherClient: Profile result:", profile, profileError);

      if (!profile?.is_teacher) {
        console.log("TeacherClient: Not a teacher, redirecting to /unauthorized");
        router.push("/unauthorized");
        return;
      }

      console.log("TeacherClient: Auth success, setting user");
      setUserId(user.id);
      setLoadingUser(false);
    }

    loadUser();
  }, []);

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

  // ---------- SAFE EARLY RETURN ----------
  if (loadingUser) {
    return (
      <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
        Loading...
      </div>
    );
  }

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
    if (!patternId) return alert("Select a pattern first.");

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

    alert("Pattern-level preferred approach saved.");
  }

  // ---------- GENERATE PATTERNS ----------
  async function generatePatterns() {
    if (!topicId) return alert("Select a topic first.");

    setLoading("Generating pattern suggestions...");

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
      alert("Select at least one pattern.");
      return;
    }

    setLoading("Saving patterns...");

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
    alert("Patterns saved.");

    setLoading("");
  }

  // ---------- GENERATE QUESTIONS ----------
  async function generateQuestions() {
    if (!patternId) return alert("Select a pattern first.");

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
    if (!patternId) return alert("Choose a pattern before saving.");

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
  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0, textAlign: 'left' }}>Teacher Mode</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
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

      <div className="card">
        <h3 className="section-title">1. Select Topic</h3>
        <div className="form-group">
          <select
            className="select"
            onChange={(e) => {
              const id = Number(e.target.value);
              setTopicId(id);

              const obj = topics.find((t) => t.id === id);
              setTopicName(obj?.name || "");
              setTopicApproach(obj?.teacher_preferred_approach || "");

              loadSavedPatterns(id);
              setGeneratedPatterns([]);
            }}
          >
            <option value="">Select topic…</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {topicId && (
          <>
            <h3 className="section-title" style={{ marginTop: "1.5rem" }}>2. Recommended Teaching Method (Optional)</h3>
            <div style={{ padding: '0.75rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              💡 Share your preferred teaching approach for this topic. What you enter here will be used for all questions on this topic—it's not teacher-specific.
            </div>
            <div className="form-group">
              <textarea
                className="input"
                value={topicApproach}
                onChange={(e) => setTopicApproach(e.target.value)}
                placeholder="e.g., 'Start with real-world examples like coin flips, then introduce the formula. Emphasize the difference between theoretical and experimental probability.'"
                style={{ minHeight: "100px", resize: "vertical" }}
              />
            </div>
            <button onClick={saveTopicApproach} className="btn btn-secondary">
              💾 Save Teaching Method
            </button>
          </>
        )}
      </div>

      {topicId && (
        <div className="card">
          <h3 className="section-title">Current Patterns for Topic</h3>
          {savedPatterns.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No patterns found for this topic.</p>
          ) : (
            <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)' }}>
              {savedPatterns.map((p) => (
                <li key={p.id} style={{ marginBottom: '0.5rem' }}>
                  <span style={{ marginRight: '0.5rem' }}>{p.pattern}</span>
                  {p.gemini_generated ? (
                    <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0284c7' }}>AI</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: '#f3f4f6', color: '#4b5563' }}>Manual</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="card">
        <h3 className="section-title">3. Generate Pattern Suggestions</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          💡 <strong>If you want AI to suggest practice patterns</strong> for this topic, click below.
          Review existing patterns first to avoid duplicates!
        </p>
        <div className="form-group">
          <button onClick={generatePatterns} className="btn" disabled={!!loading}>🤖 Generate Patterns with AI</button>
        </div>

      </div>

      <div className="card">
        <h3 className="section-title">Manual Pattern Entry</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          ✍️ <strong>If you want to add a custom pattern</strong>, enter it below.
          Check existing patterns above to avoid duplicates!
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="input"
            placeholder="Enter custom pattern..."
            id="manual-pattern-input"
          />
          <button
            className="btn btn-secondary"
            onClick={async () => {
              const input = document.getElementById('manual-pattern-input');
              const val = input.value.trim();
              if (!val) return;
              if (!topicId) return alert("Select a topic first.");

              setLoading("Adding pattern...");
              try {
                const res = await fetch("/api/teacher/add-pattern", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ topicId, pattern: val, userId }),
                });
                if (!res.ok) throw new Error("Failed to add pattern");

                input.value = "";
                await loadSavedPatterns(topicId);
                alert("Pattern added manually.");
              } catch (err) {
                console.error(err);
                alert("Error adding pattern");
              }
              setLoading("");
            }}
          >
            Add Pattern
          </button>
        </div>



        {generatedPatterns.length > 0 && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>New Suggestions</h4>
            <div className="flex-col">
              {generatedPatterns.map((p, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    style={{ marginTop: '0.25rem' }}
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedPatterns([...selectedPatterns, p.pattern]);
                      else
                        setSelectedPatterns(
                          selectedPatterns.filter((x) => x !== p.pattern)
                        );
                    }}
                  />
                  <span>{p.pattern}</span>
                </label>
              ))}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button onClick={savePatterns} className="btn">
                Save Selected Patterns
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">4. Generate Questions for a Pattern</h3>

        <div className="form-group">
          <label className="label">Select Pattern</label>
          <select
            className="select"
            onChange={(e) => {
              const id = Number(e.target.value);
              setPatternId(id);

              const pObj = savedPatterns.find((p) => p.id === id);
              setPatternApproach(pObj?.teacher_preferred_approach || "");
            }}
          >
            <option value="">Select pattern…</option>
            {savedPatterns.map((p) => (
              <option key={p.id} value={p.id}>
                {p.pattern}
              </option>
            ))}
          </select>
        </div>

        {patternId && (
          <div className="form-group">
            <label className="label">Recommended Approach for This Pattern (Optional)</label>
            <div style={{ padding: '0.75rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              💡 Share your preferred approach to solving this problem pattern. What you enter here will be used for all questions of this pattern—it's not teacher-specific.
            </div>
            <textarea
              className="input"
              value={patternApproach}
              onChange={(e) => setPatternApproach(e.target.value)}
              placeholder="e.g., 'For this pattern, remind students to check if n*p > 5 before using normal approximation. Common mistake: forgetting to apply continuity correction.'"
              style={{ minHeight: "100px", resize: "vertical" }}
            />
            <div style={{ marginTop: '0.5rem' }}>
              <button onClick={savePatternApproach} className="btn btn-secondary">
                💾 Save Pattern Approach
              </button>
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="label">Difficulty</label>
          <div className="flex-row">
            <select
              className="select"
              style={{ maxWidth: '200px' }}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>

            <button onClick={generateQuestions} className="btn" disabled={!!loading}>
              Generate Questions
            </button>
          </div>
        </div>

        {generatedQuestions.length > 0 && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <h3 className="section-title">Generated Questions</h3>

            <div className="flex-col">
              {generatedQuestions.map((q, i) => {
                const checked = selectedQuestions.includes(i);

                return (
                  <div key={i} style={{
                    padding: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: checked ? '#eff6ff' : 'transparent',
                    borderColor: checked ? 'var(--primary)' : 'var(--border)'
                  }}>
                    <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          if (checked) {
                            setSelectedQuestions(selectedQuestions.filter(x => x !== i));
                          } else {
                            setSelectedQuestions([...selectedQuestions, i]);
                          }
                        }}
                        style={{ marginTop: '0.25rem' }}
                      />
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>{q.question_text}</strong>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <p><strong>Answer:</strong> {q.correct_answer}</p>
                          <p><strong>Hint (Stats):</strong> {q.hint_stats}</p>
                          <p><strong>Hint (Python):</strong> {q.hint_python}</p>
                        </div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button onClick={saveQuestions} className="btn">Save Selected Questions</button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3 className="section-title">5. Manual Question Entry</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Add a question manually or upload an image. AI will help fill in the details!
        </p>

        {!topicId && (
          <div className="form-group" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fff7ed', borderRadius: 'var(--radius-sm)', border: '1px solid #ffedd5' }}>
            <label className="label" style={{ color: '#9a3412' }}>⚠️ Select a Topic to proceed</label>
            <select
              className="select"
              onChange={(e) => {
                const id = Number(e.target.value);
                setTopicId(id);
                const obj = topics.find((t) => t.id === id);
                setTopicName(obj?.name || "");
                loadSavedPatterns(id);
              }}
            >
              <option value="">Select topic…</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Toggles */}
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
            📷 Image Upload
          </button>
        </div>

        {/* Inputs */}
        {manualMode === 'text' ? (
          <div className="form-group">
            <textarea
              className="input"
              placeholder="Type or paste your question here..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              style={{ minHeight: '120px' }}
            />
          </div>
        ) : (
          <div className="form-group">
            <div style={{ border: '2px dashed var(--border)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
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
          onClick={enrichQuestion}
          disabled={enriching || (manualMode === 'text' ? !manualText : !manualImage)}
        >
          {enriching ? "✨ Processing..." : "✨ Process & Enrich"}
        </button>

        {/* Review Section */}
        {enrichedData && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Review & Save</h4>

            <div className="form-group">
              <label className="label">Question Text</label>
              <textarea
                className="input"
                value={enrichedData.question_text}
                onChange={(e) => setEnrichedData({ ...enrichedData, question_text: e.target.value })}
                style={{ minHeight: '100px' }}
              />
            </div>

            <div className="form-group">
              <label className="label">Correct Answer</label>
              <input
                className="input"
                value={enrichedData.correct_answer}
                onChange={(e) => setEnrichedData({ ...enrichedData, correct_answer: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="label">Hint (Stats)</label>
                <textarea
                  className="input"
                  value={enrichedData.hint_stats}
                  onChange={(e) => setEnrichedData({ ...enrichedData, hint_stats: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">Hint (Python)</label>
                <textarea
                  className="input"
                  value={enrichedData.hint_python}
                  onChange={(e) => setEnrichedData({ ...enrichedData, hint_python: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="label">Solution (Stats)</label>
                <textarea
                  className="input"
                  value={enrichedData.solution_stats}
                  onChange={(e) => setEnrichedData({ ...enrichedData, solution_stats: e.target.value })}
                  style={{ minHeight: '150px' }}
                />
              </div>
              <div className="form-group">
                <label className="label">Solution (Python)</label>
                <textarea
                  className="input"
                  value={enrichedData.solution_python}
                  onChange={(e) => setEnrichedData({ ...enrichedData, solution_python: e.target.value })}
                  style={{ minHeight: '150px', fontFamily: 'monospace' }}
                />
              </div>
            </div>

            <button className="btn" onClick={saveManualQuestion} disabled={!!loading}>
              {loading ? "Saving..." : "💾 Save Question"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
