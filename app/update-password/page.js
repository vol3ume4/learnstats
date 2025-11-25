"use client";

import { useState } from "react";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleUpdate() {
        if (!password) {
            alert("Please enter a new password.");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            alert(error.message);
            setLoading(false);
        } else {
            alert("Password updated successfully!");
            router.push("/student"); // Or determine if teacher
        }
    }

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 className="page-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Set New Password</h1>

                <div className="form-group">
                    <label className="label">New Password</label>
                    <input
                        className="input"
                        type="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    className="btn"
                    onClick={handleUpdate}
                    style={{ width: '100%' }}
                    disabled={loading}
                >
                    {loading ? "Updating..." : "Update Password"}
                </button>
            </div>
        </div>
    );
}
