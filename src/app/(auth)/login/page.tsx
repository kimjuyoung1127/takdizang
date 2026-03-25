/** Login page — email/password + Google OAuth. */
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "/";
  // Prevent open redirect: only allow relative paths starting with single /
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleGoogleLogin() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d97c67,#b96f46)] text-lg font-bold text-white shadow-lg">
          T
        </div>
        <h1 className="text-xl font-bold text-[var(--takdi-text,#2c2420)]">
          다시 오셨군요!
        </h1>
        <p className="mt-1 text-sm text-[var(--takdi-text-muted,#8c7e6e)]">
          이메일 또는 Google로 로그인해주세요
        </p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-3">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-[rgb(212_196_181_/_0.6)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--takdi-accent)] focus:ring-1 focus:ring-[var(--takdi-accent)]"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-[rgb(212_196_181_/_0.6)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--takdi-accent)] focus:ring-1 focus:ring-[var(--takdi-accent)]"
        />

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[linear-gradient(135deg,#d97c67,#b96f46)] px-4 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "로그인하는 중..." : "로그인"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[rgb(212_196_181_/_0.4)]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[rgb(244_238_230)] px-3 text-[var(--takdi-text-muted,#8c7e6e)]">
            또는
          </span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        type="button"
        className="w-full rounded-xl border border-[rgb(212_196_181_/_0.6)] bg-white px-4 py-3 text-sm font-medium text-[var(--takdi-text,#2c2420)] shadow-sm transition-colors hover:bg-gray-50"
      >
        Google로 계속하기
      </button>

      <p className="text-center text-sm text-[var(--takdi-text-muted,#8c7e6e)]">
        아직 계정이 없으신가요?{" "}
        <Link
          href="/signup"
          className="font-medium text-[var(--takdi-accent)] hover:underline"
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}
