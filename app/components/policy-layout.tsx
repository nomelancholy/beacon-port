import type { ReactNode } from "react";
import { Link } from "react-router";

export const policyDate = "2026년 11월 7일";
export const policyContact = "takeknowledge@naver.com";

export function PolicyLayout({ title, description, current, children }: {
  title: string; description: string; current: "privacy" | "terms"; children: ReactNode;
}) {
  return (
    <main className="min-h-page bg-gray-900 px-4 py-8 text-gray-200 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="text-lg font-semibold text-white hover:text-sky-300">Beacon Port</Link>
          <nav aria-label="정책 페이지" className="flex gap-4 text-sm">
            <Link to="/privacy" aria-current={current === "privacy" ? "page" : undefined}
              className={current === "privacy" ? "font-semibold text-sky-300 underline underline-offset-4" : "text-gray-300 hover:text-white"}>개인정보처리방침</Link>
            <Link to="/terms" aria-current={current === "terms" ? "page" : undefined}
              className={current === "terms" ? "font-semibold text-sky-300 underline underline-offset-4" : "text-gray-300 hover:text-white"}>서비스 이용약관</Link>
          </nav>
        </header>
        <article className="rounded-2xl border border-gray-700 bg-gray-800/70 p-5 sm:p-10">
          <p className="mb-3 text-sm text-sky-300">인재의 신호가 모이는 곳</p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-gray-300">{description}</p>
          <p className="mt-4 border-b border-gray-700 pb-6 text-sm text-gray-400">시행일: {policyDate} · 운영자: TakeKnowledge</p>
          <div className="mt-8 space-y-8 text-sm leading-7 sm:text-base sm:leading-8">{children}</div>
        </article>
        <p className="mt-6 text-sm text-gray-400">문의: <a className="break-all text-sky-300 underline" href={`mailto:${policyContact}`}>{policyContact}</a></p>
      </div>
    </main>
  );
}

export function PolicySection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section aria-labelledby={id} className="space-y-3">
    <h2 id={id} className="scroll-mt-6 text-lg font-semibold text-white sm:text-xl">{title}</h2>
    {children}
  </section>;
}
