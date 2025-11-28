"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function JoinClassroomClient({ inviteCode }) {
    const router = useRouter();
    const [status, setStatus] = useState('checking'); // checking, joining, success, error
    const [message, setMessage] = useState('Verifying invite code...');
    const [classroomName, setClassroomName] = useState('');

    const supabase = getSupabaseBrowserClient();

    useEffect(() => {
        joinClassroom();
    }, [inviteCode]);

    async function joinClassroom() {
        try {
            // 1. Check authentication
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Redirect to login with return URL
                const returnUrl = encodeURIComponent(`/student/join/${inviteCode}`);
                router.push(`/login?returnUrl=${returnUrl}`);
                return;
            }

            setStatus('joining');
            setMessage('Joining classroom...');

            // 2. Call API to join
            const response = await fetch('/api/student/join-classroom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inviteCode,
                    studentId: user.id
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setClassroomName(data.classroom.name);
                setMessage(`Successfully joined ${data.classroom.name}!`);

                // Redirect to dashboard after a brief delay
                setTimeout(() => {
                    router.push('/student/dashboard');
                }, 2000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to join classroom');
            }

        } catch (error) {
            console.error('Error:', error);
            setStatus('error');
            setMessage('An unexpected error occurred');
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--background)'
        }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {status === 'checking' && '🔍'}
                    {status === 'joining' && '⏳'}
                    {status === 'success' && '🎉'}
                    {status === 'error' && '❌'}
                </div>

                <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
                    {status === 'success' ? 'Welcome!' : 'Join Classroom'}
                </h2>

                <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    {message}
                </p>

                {status === 'error' && (
                    <button
                        className="btn"
                        onClick={() => router.push('/student/dashboard')}
                    >
                        Go to Dashboard
                    </button>
                )}
            </div>
        </div>
    );
}
