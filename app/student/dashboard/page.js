"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";
import { CERTIFICATE_BUNDLES } from "@/lib/certificate-bundles";

export default function DashboardPage() {
    const [userId, setUserId] = useState(null);
    const [certificateProgress, setCertificateProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedBundles, setExpandedBundles] = useState({});
    const router = useRouter();

    useEffect(() => {
        async function loadUser() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }
                setUserId(user.id);
                await loadCertificateProgress(user.id);
            } catch (err) {
                console.error("Error loading user:", err);
                setError("Failed to load user data");
                setLoading(false);
            }
        }
        loadUser();
    }, [router]);

    async function loadCertificateProgress(uid) {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch("/api/student/certificate-progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: uid })
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setCertificateProgress(data);
        } catch (err) {
            console.error("Error loading certificate progress:", err);
            setError(err.message || "Failed to load progress data");
            // Set empty data so UI doesn't break
            setCertificateProgress({ topics: [] });
        } finally {
            setLoading(false);
        }
    }

    function toggleBundle(bundleId) {
        setExpandedBundles(prev => ({
            ...prev,
            [bundleId]: !prev[bundleId]
        }));
    }

    function calculateBundleProgress(bundle) {
        if (!certificateProgress?.topics) return { completed: 0, total: 0, percentage: 0 };

        const bundleTopics = certificateProgress.topics.filter(t =>
            bundle.topics.includes(t.name)
        );

        let totalPatterns = 0;
        let completedPatterns = 0;

        bundleTopics.forEach(topic => {
            topic.patterns.forEach(pattern => {
                totalPatterns++;
                if (pattern.completed) completedPatterns++;
            });
        });

        const percentage = totalPatterns > 0 ? Math.round((completedPatterns / totalPatterns) * 100) : 0;

        return { completed: completedPatterns, total: totalPatterns, percentage };
    }

    if (loading) {
        return (
            <div className="container">
                <div style={{ padding: "40px", textAlign: "center" }}>Loading dashboard...</div>
            </div>

                            {/* Bundle Details (Expanded) */ }
        {
            isExpanded && (
                <div style={{ padding: '1.5rem', background: 'var(--background)' }}>
                    {bundleTopics.map(topic => (
                        <div key={topic.id} style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: 'var(--text-main)' }}>
                                {topic.name}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {topic.patterns.map(pattern => (
                                    <div
                                        key={pattern.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem',
                                            background: 'white',
                                            borderRadius: 'var(--radius-sm)'
                                        }}
                                    >
                                        <span style={{ fontSize: '1.2rem' }}>
                                            {pattern.completed ? '✓' : '○'}
                                        </span>
                                        <span style={{
                                            flex: 1,
                                            color: pattern.completed ? 'var(--success)' : 'var(--text-main)',
                                            fontWeight: pattern.completed ? '500' : '400'
                                        }}>
                                            {pattern.name}
                                        </span>
                                        {pattern.hasProgress && !pattern.completed && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                E:{pattern.streaks.easy}/3 M:{pattern.streaks.medium}/4 H:{pattern.streaks.hard}/5
                                            </span>
                                        )}
                                        {pattern.completed && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>
                                                Completed
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )
        }
                        </div >
                    );
    })
}

{/* Show message if no progress yet */ }
{
    certificateProgress?.topics?.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Start Your Learning Journey!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Begin practicing to track your progress toward certificates.
            </p>
            <button
                className="btn"
                onClick={() => router.push("/student")}
            >
                Start Practicing
            </button>
        </div>
    )
}
            </div >

    {/* HIDDEN: Practice Log - keeping backend intact */ }
{
    false && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
                className="btn"
                onClick={() => router.push("/student/practice-log")}
                style={{ fontSize: '1rem' }}
            >
                📝 View Practice Log
            </button>
        </div>
    )
}
        </div >
    );
}
