"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";

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
    setLoading("");
  }

  // ---------- UI ----------
  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0, textAlign: 'left' }}>Teacher Mode</h1>
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

      {loading && (
        <div className="alert alert-info">
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
            <h3 className="section-title" style={{ marginTop: "1.5rem" }}>2. Topic Preferred Approach</h3>
            <div className="form-group">
              <textarea
                className="input"
                value={topicApproach}
                onChange={(e) => setTopicApproach(e.target.value)}
                placeholder="Describe preferred method for this topic"
                style={{ minHeight: "80px", resize: "vertical" }}
              />
            </div>
            <button onClick={saveTopicApproach} className="btn btn-secondary">
              Save Topic Approach
            </button>
          </>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">3. Generate Pattern Suggestions</h3>
        <div className="form-group">
          <button onClick={generatePatterns} className="btn">Generate Patterns</button>
        </div>

      </div>

      <div className="card">
        <h3 className="section-title">Manual Pattern Entry</h3>
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

        {existingPatterns.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Existing Patterns</h4>
            <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)' }}>
              {existingPatterns.map((p, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>{typeof p === "string" ? p : p.pattern}</li>
              ))}
            </ul>
          </div>
        )}

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
            <label className="label">Pattern Preferred Approach</label>
            <textarea
              className="input"
              value={patternApproach}
              onChange={(e) => setPatternApproach(e.target.value)}
              style={{ minHeight: "80px", resize: "vertical" }}
            />
            <div style={{ marginTop: '0.5rem' }}>
              <button onClick={savePatternApproach} className="btn btn-secondary">
                Save Pattern Approach
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

            <button onClick={generateQuestions} className="btn">
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
    </div>
  );
}
