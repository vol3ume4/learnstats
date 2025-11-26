"use client";

import { useState } from "react";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup() {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Check if we have a session (auto-login successful)
    if (data?.session) {
      // Email confirmation is disabled, user is logged in
      router.push("/student");
    } else {
      // Email confirmation is required
      alert("Signup successful! Please check your email to confirm your account.");
      setLoading(false);
    }
  }
  );
}
