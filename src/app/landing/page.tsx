/** Placeholder route for a future dedicated marketing landing page. */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Takdi Studio — AI 이커머스 콘텐츠 자동화",
  description:
    "상세페이지, 숏폼 영상, 모델컷, 누끼까지 — 이커머스에 필요한 콘텐츠를 AI와 함께 빠르게 만들어 보세요.",
  openGraph: {
    title: "Takdi Studio — AI 이커머스 콘텐츠 자동화",
    description:
      "상세페이지, 숏폼 영상, 모델컷, 누끼까지 — 이커머스에 필요한 콘텐츠를 AI와 함께 빠르게 만들어 보세요.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Takdi Studio — AI 이커머스 콘텐츠 자동화",
    description:
      "상세페이지, 숏폼 영상, 모델컷, 누끼까지 — AI 기반 이커머스 콘텐츠 자동화 도구",
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--takdi-bg)] px-6 py-12 text-[var(--takdi-text)]">
      <div className="mx-auto max-w-5xl space-y-8 rounded-[32px] border border-[rgb(218_205_192_/_0.8)] bg-[rgb(255_255_255_/_0.7)] p-8 shadow-[0_30px_80px_rgba(61,45,27,0.08)]">
        <div className="space-y-3">
          <p className="takdi-kicker">Landing</p>
          <h1 className="text-[clamp(2rem,3vw,3.4rem)] font-semibold tracking-[-0.05em]">
            이커머스 콘텐츠,<br />AI와 함께 한 곳에서
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-[var(--takdi-text-muted)]">
            상세페이지, 숏폼 영상, 모델컷, 누끼까지 —
            쇼핑몰 운영에 필요한 콘텐츠를 AI가 도와줘요.
            기획부터 내보내기까지, Takdi Studio에서 빠르게 완성하세요.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-[var(--takdi-text)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            지금 시작하기
          </Link>
          <Link
            href="/projects"
            className="rounded-full border border-[rgb(214_199_184_/_0.78)] bg-[rgb(255_255_255_/_0.76)] px-5 py-3 text-sm font-medium text-[var(--takdi-text-muted)] transition hover:border-[rgb(212_184_166_/_0.86)] hover:text-[var(--takdi-text)]"
          >
            프로젝트 둘러보기
          </Link>
        </div>
      </div>
    </main>
  );
}
