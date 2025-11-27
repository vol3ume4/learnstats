"use client";
import { useState, useEffect } from "react";

export default function FeatureAnnouncement() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if user has seen this specific announcement version
        const seen = localStorage.getItem("feature_announcement_certificates_v1");
        if (!seen) {
            setShow(true);
        }
    }, []);

    function close() {
        localStorage.setItem("feature_announcement_certificates_v1", "true");
        setShow(false);
    }

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                        New: Earn Certificates!
                    </h2>
                    <p style={{ color: '#6B7280', fontSize: '1rem', lineHeight: '1.5' }}>
                        We've upgraded your learning experience. Now you can track your progress and earn certificates.
                    </p>
                </div>

                <div style={{ background: '#F3F4F6', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li><strong>Complete Patterns:</strong> Finish Easy (3), Medium (4), and Hard (5) streaks.</li>
                        <li><strong>Track Progress:</strong> See your journey in the new Dashboard.</li>
                        <li><strong>Unlock Bundles:</strong> Complete all topics to earn Certificate Bundles.</li>
                    </ul>
                </div>

                <button
                    onClick={close}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#2563EB',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#1D4ED8'}
                    onMouseOut={(e) => e.target.style.background = '#2563EB'}
                >
                    Start Learning
                </button>
            </div>
        </div>
    );
}
