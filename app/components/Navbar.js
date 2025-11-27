"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const pathname = usePathname();

    // Don't show navbar on login, signup, student, or teacher pages
    if (pathname === "/login" || pathname === "/signup" || pathname.startsWith("/student") || pathname.startsWith("/teacher")) {
        return null;
    }

    return (
        <nav style={{
            background: 'white',
            borderBottom: '1px solid var(--border)',
            padding: '1rem 0',
            marginBottom: '2rem'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'none' }}>
                    LearnStats
                </Link>

                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <Link
                        href="/student"
                        style={{
                            color: pathname === '/student' ? 'var(--primary)' : 'var(--text-main)',
                            fontWeight: pathname === '/student' ? '600' : '400',
                            textDecoration: 'none'
                        }}
                    >
                        Student Mode
                    </Link>
                    <Link
                        href="/teacher"
                        style={{
                            color: pathname === '/teacher' ? 'var(--primary)' : 'var(--text-main)',
                            fontWeight: pathname === '/teacher' ? '600' : '400',
                            textDecoration: 'none'
                        }}
                    >
                        Teacher Mode
                    </Link>
                </div>
            </div>
        </nav>
    );
}
