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
  const [activeTab, setActiveTab] = useState("view_patterns"); // 'view_patterns' | 'generate_patterns' | ...

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
  if (loadingUser) {
    return <div style={{ padding: "40px" }}>Loading...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0, textAlign: 'left' }}>Teacher Studio</h1>
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

      {!topicId ? (
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
}
