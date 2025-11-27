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
  const [expandedGroup, setExpandedGroup] = useState("1. Foundations & Data"); // Default open first group

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
  const [userReaction, setUserReaction] = useState(null); // 'like' or 'flag'
  const [loading, setLoading] = useState("");
  const [savedDrafts, setSavedDrafts] = useState([]);

  // Streak tracking
  const [streak, setStreak] = useState(0);
  const [unlockedDifficulties, setUnlockedDifficulties] = useState(['Easy']); // Default: Easy always unlocked


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

  // ---------- LOAD PROGRESS ON SELECTION ----------
  useEffect(() => {
    if (userId && topicId && patternId) {
      loadUnlockedDifficulties();
      if (difficulty) {
        loadStreak();
      }
    }
  }, [userId, topicId, patternId, difficulty]);

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
    setUserReaction(null);
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

    // Update streak in database
    const streakRes = await fetch("/api/student/update-streak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        topicId,
        patternId,
        difficulty,
        isCorrect: data.correct,
        usedHints: usedHintStats || usedHintPython
      })
    });
    const streakData = await streakRes.json();
    setStreak(streakData.streak);

    // Check if new difficulty was unlocked
    if (streakData.unlockedDifficulty) {
      setUnlockedDifficulties([...unlockedDifficulties, streakData.unlockedDifficulty]);
      alert(`🎉 Congratulations! You've unlocked ${streakData.unlockedDifficulty} difficulty!`);
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

  // ---------- HANDLE REACTION ----------
  async function handleReaction(reactionType) {
    if (!currentQuestion || !userId) return;

    setUserReaction(reactionType);

    try {
      await fetch("/api/student/add-reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          questionId: currentQuestion.id,
          reactionType
        })
      });
    } catch (err) {
      console.error("Error adding reaction:", err);
    }
  }

  // ---------- LOAD STREAK ----------
  async function loadStreak() {
    if (!userId || !topicId || !patternId || !difficulty) return;

    try {
      const res = await fetch("/api/student/get-streak", {
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
      setStreak(data.streak || 0);
    } catch (err) {
      console.error("Error loading streak:", err);
      setStreak(0);
    }
  }

  // ---------- LOAD UNLOCKED DIFFICULTIES ----------
  async function loadUnlockedDifficulties() {
    if (!userId || !topicId || !patternId) return;

    try {
      const res = await fetch("/api/student/get-unlocked-difficulties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          topicId,
          patternId
        })
      });
      const data = await res.json();
      setUnlockedDifficulties(data.unlocked || ['Easy']);
    } catch (err) {
      console.error("Error loading unlocked difficulties:", err);
      setUnlockedDifficulties(['Easy']);
    }
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
      {/* LEVEL 1: Top Bar (Brand & Mode) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
        {/* Right: Mode Indicator */}
        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary)' }}>
          Student Mode
        </div>
      </div>

      {/* LEVEL 2: App Bar (Title & Actions) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border)' }}>

        {/* Left: LearnStats Title */}
        <div style={{ textAlign: 'left' }}>
          <a href="https://learnstats.vercel.app" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)', lineHeight: '1.2' }}>LearnStats</div>
          </a>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Interactive Statistics Practice</div>
        </div>

        {/* Right: Navigation Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <StudentHelp />
          <button
            className="btn btn-secondary"
            onClick={() => router.push("/student/share")}
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
          >
            ➕ Share Question
          </button>
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
      )
      }

      {
        savedDrafts.length > 0 && (
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
        )
      }

      {/* CONDITIONAL RENDER: Discovery Mode vs. Practice Mode */}
      {
        !topicId ? (
          /* --- DISCOVERY MODE: Topic Accordion --- */
          <div className="card">
            <h3 className="section-title">Select a Topic to Start</h3>

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
                            onClick={async () => {
                              setTopicId(t.id);
                              setPatternId(null);
                              setCurrentQuestion(null);
                              setEvaluation("");
                              setStreak(0);
                              await loadPatterns(t.id);
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
          /* --- PRACTICE MODE: The Cockpit --- */
          <div className="card" style={{
            position: 'sticky',
            top: '1rem',
            zIndex: 100,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--primary)',
            background: '#fff'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>

              {/* Left: Topic & Back */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => setTopicId(null)}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                  title="Change Topic"
                >
                  ← Back
                </button>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>
                  {topics.find(t => t.id === topicId)?.name}
                </div>
              </div>

              {/* Right: Controls */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                <select
                  className="select"
                  style={{ width: 'auto', minWidth: '200px', margin: 0 }}
                  value={patternId || ""}
                  onChange={(e) => {
                    setPatternId(Number(e.target.value));
                    setCurrentQuestion(null);
                    setEvaluation("");
                  }}
                >
                  <option value="">Select Question Pattern...</option>
                  {patterns.map((p) => (
                    <option key={p.id} value={p.id}>{p.pattern}</option>
                  ))}
                </select>

                <select
                  className="select"
                  style={{ width: 'auto', margin: 0 }}
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value);
                    setCurrentQuestion(null);
                    setEvaluation("");
                  }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium" disabled={!unlockedDifficulties.includes('Medium')}>
                    Medium {!unlockedDifficulties.includes('Medium') ? '🔒 (Get 3-streak on Easy)' : ''}
                  </option>
                  <option value="Hard" disabled={!unlockedDifficulties.includes('Hard')}>
                    Hard {!unlockedDifficulties.includes('Hard') ? '🔒 (Get 4-streak on Medium)' : ''}
                  </option>
                </select>

                <button
                  onClick={getNextQuestion}
                  className="btn"
                  disabled={!patternId || !!loading}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {loading ? "Loading..." : "Get Question"}
                </button>
              </div>
            </div>

            {/* Streak Mini-Bar */}
            {patternId && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Streak:</span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {Array.from({ length: streakGoal }).map((_, i) => (
                    <div key={i} style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: i < streak ? 'var(--success)' : '#e2e8f0',
                      transition: 'all 0.3s'
                    }} />
                  ))}
                </div>
                {streak >= streakGoal && <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>🔥 On Fire!</span>}
              </div>
            )}
          </div>
        )
      }

      {
        currentQuestion && (
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
              {currentQuestion.source === 'student_contribution' && (
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  background: '#dbeafe',
                  color: '#1e40af',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  👤 Community Question
                </div>
              )}
              {currentQuestion.source === 'image_upload' && (
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  background: '#f3e8ff',
                  color: '#6b21a8',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  📷 From Image
                </div>
              )}
              {currentQuestion.source === 'manual_entry' && (
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  background: '#fef3c7',
                  color: '#92400e',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem'
                }}>
                  ✍️ Teacher Added
                </div>
              )}
              <div>{currentQuestion.question_text}</div>
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

                {/* Reaction Buttons */}
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ marginBottom: '0.75rem', fontWeight: '500' }}>Rate this question:</div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <button
                      onClick={() => handleReaction('like')}
                      className="btn btn-secondary"
                      style={{
                        background: userReaction === 'like' ? 'var(--primary)' : 'white',
                        color: userReaction === 'like' ? 'white' : 'var(--foreground)',
                        borderColor: userReaction === 'like' ? 'var(--primary)' : 'var(--border)'
                      }}
                    >
                      👍 Helpful
                    </button>
                    <button
                      onClick={() => handleReaction('flag')}
                      className="btn btn-secondary"
                      style={{
                        background: userReaction === 'flag' ? '#ef4444' : 'white',
                        color: userReaction === 'flag' ? 'white' : 'var(--foreground)',
                        borderColor: userReaction === 'flag' ? '#ef4444' : 'var(--border)'
                      }}
                    >
                      🚩 Flag for Review
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    💡 Your feedback helps improve the question pool! Liked questions appear more often.
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="label">Add a personal remark (optional):</label>
                  <textarea
                    className="input"
                    placeholder="Add your feedback or notes here..."
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
        )
      }
    </div >
  );
}
