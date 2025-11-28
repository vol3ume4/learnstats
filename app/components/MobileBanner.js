"use client";

import { useState, useEffect } from "react";

export default function MobileBanner() {
    const [isMobile, setIsMobile] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        // Check on mount
        checkMobile();

        // Check on resize
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // Check if user has dismissed the banner before
        const wasDismissed = localStorage.getItem('mobile_banner_dismissed');
        if (wasDismissed) {
            setDismissed(true);
        }
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('mobile_banner_dismissed', 'true');
    };

    if (!isMobile || dismissed) return null;

    return (
        <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 999,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            animation: 'slideDown 0.3s ease-out'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <span style={{ fontSize: '1.25rem' }}>💡</span>
                    <div style={{ lineHeight: '1.4' }}>
                        <strong>Best on Desktop</strong>
                        <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '2px' }}>
                            For the full experience with math rendering and better navigation
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                    }}
                >
                    Got it
                </button>
            </div>
        </div>
    );
}
