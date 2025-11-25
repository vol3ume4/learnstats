//student/StudentClient.js

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";
import StudentHelp from "./StudentHelp";

export default function StudentClient() {
  // ---------- ALL HOOKS AT TOP ----------
  const [userId, setUserId] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [topics, setTopics] = useState([]);
  const [topicId, setTopicId] = useState(null);

  const [patterns, setPatterns] = useState([]);
  const [patternId, setPatternId] = useState(null);

  const [difficulty, setDifficulty] = useState("Easy");

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState("");

  const [attemptId, setAttemptId] = useState(null);

  const [showSolution, setShowSolution] = useState(false);
  const [showHintStats, setShowHintStats] = useState(false);
  const [showHintPython, setShowHintPython] = useState(false);
  const [usedHintStats, setUsedHintStats] = useState(false);
  const [usedHintPython, setUsedHintPython] = useState(false);
  const [studentRemark, setStudentRemark] = useState("");
  const [loading, setLoading] = useState("");
  const [savedDrafts, setSavedDrafts] = useState([]);

  // Streak tracking
  const [streak, setStreak] = useState(0);

  const router = useRouter();
  const authCheckRan = useRef(false);

  // Streak goals by difficulty
  const STREAK_GOALS = {
    "Easy": 3,
    "Medium": 4,
    "Hard": 5
  };

  const streakGoal = STREAK_GOALS[difficulty] || 3;

  // ---------- AUTH LOAD ----------
  useEffect(() => {
    if (authCheckRan.current) return;
    authCheckRan.current = true;

    console.log("StudentClient mounted - Auth Check");

    if (!supabase) {
      console.error("Supabase client is not initialized. Check environment variables.");
      setLoadingUser(false);
      return;
    }

    async function loadUser() {
      console.log("loadUser started");
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log("getUser result:", { user, error });

      if (error) {
        console.error("Auth Error:", error);
      }

      if (!user) {
        console.log("No user found, redirecting to login...");
        router.push("/login");
        return;
      }

      console.log("User found, setting state");
      setUserId(user.id);
      setLoadingUser(false);
    }
    loadUser();
  }, [router]);

  // ---------- LOAD TOPICS ----------
  useEffect(() => {
    loadTopics();
  }, []);

  // ---------- LOAD DRAFTS ----------
  useEffect(() => {
    if (userId) {
      loadDrafts();
    }
  }, [userId]);

  async function loadTopics() {
    try {
      const res = await fetch("/api/student/get-topics");
      if (!res.ok) throw new Error(`Failed to load topics: ${res.status}`);
      const data = await res.json();
      setTopics(data);
    } catch (err) {
      console.error("Error loading topics:", err);
    }
  }

  // ---------- SAFE EARLY RETURN AFTER HOOKS ----------
  if (!supabase) {
    return (
      <div style={{ padding: "40px", fontFamily: "sans-serif", color: "red" }}>
        <h1>Configuration Error</h1>
        <p>Supabase client could not be initialized.</p>
        <p>Please check that <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set in your environment variables.</p>
      </div>
    );
  }

  if (loadingUser) {
    return (
      <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
        Loading... (Checking Auth)
      </div>
    );
  }

  // ---------- LOAD PATTERNS ----------
  async function loadPatterns(topicId) {
    const res = await fetch("/api/student/get-patterns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId })
    });
    setPatterns(await res.json());
  }

  // ---------- RESET ----------
  function resetStateForNewQuestion() {
    setEvaluation("");
    setAnswer("");
    setShowSolution(false);
    setShowHintStats(false);
    setShowHintPython(false);
    setUsedHintStats(false);
    setUsedHintPython(false);
    setStudentRemark("");
    setAttemptId(null);
  }

  // ---------- GET NEXT ----------
  async function getNextQuestion() {
    if (!patternId || !difficulty) {
      alert("Select topic, pattern, and difficulty.");
      return;
    }

    setLoading("Fetching question...");

    const res = await fetch("/api/student/get-next-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        topicId,
        patternId,
        difficulty
      })
    });

    const data = await res.json();
    if (data.error) {
      alert(data.error);
      setLoading("");
      return;
    }

    setCurrentQuestion(data);
    resetStateForNewQuestion();
    setLoading("");
  }

  // ---------- SUBMIT ----------
  async function submitAnswer() {
    if (!currentQuestion) return;

    setLoading("Checking answer...");

    const res = await fetch("/api/student/save-attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        topicId,
        patternId,
        difficulty,
        questionId: currentQuestion.id,
        userAnswer: answer,
        studentRemark,
        usedHintStats,
        usedHintPython
      })
    });

    const data = await res.json();
    setEvaluation(data);
    setAttemptId(data.attemptId);

    // Update streak
    if (data.correct) {
      setStreak(streak + 1);
    } else {
      setStreak(0);
    }

    setLoading("");
  }

  // ---------- SAVE REMARK ----------
  async function saveRemark() {
    if (!attemptId) {
      alert("Submit your answer first.");
      return;
    }

    const res = await fetch("/api/student/update-remark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        studentRemark
      })
    });

    const data = await res.json();
    if (data.success) alert("Remark saved.");
  }

  // ---------- DRAFT FUNCTIONS ----------
  async function loadDrafts() {
    const res = await fetch("/api/student/get-drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    setSavedDrafts(data);
  }

  async function saveDraft() {
    if (!currentQuestion) {
      alert("No question to save.");
      return;
    }

    const res = await fetch("/api/student/save-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        topicId,
        patternId,
        difficulty,
        questionData: {
          question: currentQuestion,
          answer,
          showHintStats,
          showHintPython,
          usedHintStats,
          usedHintPython
        }
      })
    });

    const data = await res.json();
    if (data.success) {
      alert("Question saved for later!");
      loadDrafts();
    }
  }

  async function resumeDraft(draft) {
    setTopicId(draft.topic_id);
    setPatternId(draft.pattern_id);
    setDifficulty(draft.difficulty);
    setCurrentQuestion(draft.question_data.question);
    setAnswer(draft.question_data.answer || "");
    setShowHintStats(draft.question_data.showHintStats || false);
    setShowHintPython(draft.question_data.showHintPython || false);
    setUsedHintStats(draft.question_data.usedHintStats || false);
    setUsedHintPython(draft.question_data.usedHintPython || false);

    // Load patterns for the topic
    await loadPatterns(draft.topic_id);

    // Delete the draft after resuming
    await deleteDraft(draft.id);
  }

  async function deleteDraft(draftId) {
    const res = await fetch("/api/student/delete-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId })
    });

    const data = await res.json();
    if (data.success) {
      loadDrafts();
    }
  }

  // ---------- UI ----------
  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0, textAlign: 'left' }}>Student Mode</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <StudentHelp />
          <button
            className="btn btn-secondary"
            onClick={() => router.push("/student/dashboard")}
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            📊 My Dashboard
          </button>
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

      {savedDrafts.length > 0 && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <strong>📌 You have {savedDrafts.length} saved question{savedDrafts.length > 1 ? 's' : ''}!</strong>
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {savedDrafts.map((draft) => (
              <div key={draft.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'white', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.9rem' }}>
                  {draft.topic_name} → {draft.pattern_name} ({draft.difficulty})
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => resumeDraft(draft)} className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                    Resume
                  </button>
                  <button onClick={() => deleteDraft(draft.id)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="section-title">1. Select Topic</h3>
        <div className="form-group">
          <select
            className="select"
            onChange={async (e) => {
              const id = Number(e.target.value);
              setTopicId(id);
              setPatternId(null);
              setCurrentQuestion(null);
              setEvaluation("");
              setStreak(0);
              await loadPatterns(id);
            }}
          >
            <option>Select a topic...</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {topicId && (
          <>
            <h3 className="section-title" style={{ marginTop: '1.5rem' }}>2. Select Pattern</h3>
            <div className="form-group">
              <select
                className="select"
                onChange={(e) => {
                  setPatternId(Number(e.target.value));
                  setCurrentQuestion(null);
                  setEvaluation("");
                  setStreak(0);
                }}
              >
                <option>Select a pattern...</option>
                {patterns.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.pattern}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {patternId && (
          <>
            <h3 className="section-title" style={{ marginTop: '1.5rem' }}>3. Select Difficulty</h3>
            <div className="flex-row">
              <select
                className="select"
                style={{ maxWidth: '200px' }}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setStreak(0);
                }}
                value={difficulty}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>

              <button onClick={getNextQuestion} className="btn" disabled={!!loading}>
                Get Question
              </button>
            </div>

            {/* Streak Progress */}
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Goal: {streakGoal} in a row to show consistency!
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {Array.from({ length: streakGoal }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: '2px solid var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: i < streak ? 'var(--primary)' : 'transparent',
                      color: i < streak ? 'white' : 'var(--primary)',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {i < streak ? '✓' : ''}
                  </div>
                ))}
              </div>
              {streak > 0 && streak < streakGoal && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '500' }}>
                  {streak === 1 && '✓ Good start! Keep going!'}
                  {streak === 2 && '✓ ✓ You\'re on a roll!'}
                  {streak === streakGoal - 1 && `✓ ${Array(streak).fill('✓').join(' ')} Almost there! One more!`}
                </div>
              )}
              {streak === streakGoal && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--success)', fontWeight: '600' }}>
                  🎉 You're consistent at this level! {difficulty !== 'Hard' && 'Ready to try the next level?'}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {currentQuestion && (
        <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
          <h3 className="section-title">Question</h3>

          <div style={{
            background: "var(--background)",
            padding: "1.5rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            whiteSpace: "pre-wrap",
            fontSize: "1.1rem",
            lineHeight: "1.6"
          }}>
            {currentQuestion.question_text}
          </div>

          {!evaluation && (
            <div className="flex-col">
              <input
                className="input"
                type="text"
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />

              <div className="flex-row" style={{ marginTop: '0.5rem', gap: '0.5rem' }}>
                <button onClick={saveDraft} className="btn btn-secondary" disabled={!!loading}>
                  💾 Save for Later
                </button>
                <button onClick={submitAnswer} className="btn" disabled={!!loading}>
                  Submit Answer
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div className="flex-row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                className={`btn ${showHintStats ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => {
                  setShowHintStats(!showHintStats);
                  setUsedHintStats(true);
                }}
                style={{ fontSize: '0.9rem' }}
              >
                {showHintStats ? "Hide Hint (Stats)" : "Show Hint (Stats)"}
              </button>

              <button
                className={`btn ${showHintPython ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => {
                  setShowHintPython(!showHintPython);
                  setUsedHintPython(true);
                }}
                style={{ fontSize: '0.9rem' }}
              >
                {showHintPython ? "Hide Hint (Python)" : "Show Hint (Python)"}
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShowSolution(true)}
                style={{ fontSize: '0.9rem', marginLeft: 'auto' }}
              >
                Show Full Solution
              </button>

              <button
                className="btn"
                onClick={getNextQuestion}
                style={{ fontSize: '0.9rem' }}
              >
                Next Question →
              </button>
            </div>
          </div>

          {showHintStats && currentQuestion.hint_stats && (
            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              <strong>Hint (Stats):</strong>
              <br />
              {currentQuestion.hint_stats}
            </div>
          )}

          {showHintPython && currentQuestion.hint_python && (
            <div className="alert alert-success" style={{ marginTop: '1rem', background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
              <strong>Hint (Python):</strong>
              <br />
              {currentQuestion.hint_python}
            </div>
          )}

          {evaluation && (
            <div style={{ marginTop: "2rem" }}>
              {evaluation.correct !== undefined && (
                <div className={evaluation.correct ? "alert alert-success" : "alert alert-error"}>
                  <strong>Correct: </strong>
                  {evaluation.correct ? "Yes" : "No"}
                  <br />
                  <strong>Remark: </strong>
                  {evaluation.remark}
                </div>
              )}

              <div className="form-group">
                <label className="label">Add a personal remark (optional):</label>
                <textarea
                  className="input"
                  placeholder="Note down what you learned..."
                  value={studentRemark}
                  onChange={(e) => setStudentRemark(e.target.value)}
                  style={{ minHeight: "80px", resize: "vertical" }}
                />
                <div style={{ marginTop: '0.5rem' }}>
                  <button onClick={saveRemark} className="btn btn-secondary">
                    Save Remark
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSolution && (
            <div style={{
              marginTop: "2rem",
              background: "#f8fafc",
              padding: "1.5rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)"
            }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Full Solution</h4>

              <div style={{ marginBottom: '1.5rem' }}>
                <strong>Statistical Approach:</strong>
                <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                  {currentQuestion.solution_stats || "Not provided."}
                </div>
              </div>

              <div>
                <strong>Python Implementation:</strong>
                <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: '#1e293b', color: '#e2e8f0', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  {currentQuestion.solution_python || "Not provided."}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
