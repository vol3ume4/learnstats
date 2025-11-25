"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/student");
  }, [router]);

  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h1 className="page-title">LearnStats</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Redirecting to Student Mode...</p>
    </div>
  );
}
