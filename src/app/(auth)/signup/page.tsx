/** Signup page — email/password registration. */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl">
          ✉️
        </div>
        <h1 className="text-xl font-bold text-[var(--takdi-text,#2c2420)]">
          이메일을 확인해주세요
        </h1>
        <p className="text-sm text-[var(--takdi-text-muted,#8c7e6e)]">
          <strong>{email}</strong>로 확인 메일을 보냈어요.
          <br />
          메일의 링크를 클릭하면 가입이 완료돼요.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-[var(--takdi-accent)] hover:underline"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d97c67,#b96f46)] text-lg font-bold text-white shadow-lg">
          T
        </div>
        <h1 className="text-xl font-bold text-[var(--takdi-text,#2c2420)]">
          Takdi Studio 시작하기
        </h1>
        <p className="mt-1 text-sm text-[var(--takdi-text-muted,#8c7e6e)]">
          무료로 가입하고 바로 만들어보세요
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-3">
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-xl border border-[rgb(212_196_181_/_0.6)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--takdi-accent)] focus:ring-1 focus:ring-[var(--takdi-accent)]"
        />
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
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
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
          {loading ? "가입하는 중..." : "무료로 시작하기"}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--takdi-text-muted,#8c7e6e)]">
        이미 가입하셨나요?{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--takdi-accent)] hover:underline"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
