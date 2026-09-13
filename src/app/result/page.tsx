"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import PageBackground from "@/components/PageBackground";
import { BACKGROUNDS } from "@/lib/asset";
import { CHOICES, Question, UserAnswers } from "@/lib/types";
import type { AnswerMap } from "@/lib/answerPayload";
import { ANSWER_DECODE_ERROR_MESSAGE } from "@/lib/answerPayload";
import { clearUserAnswers, loadQuestionSet, loadUserAnswers } from "@/lib/storage";
import { resolveAnswerKey } from "@/lib/answerStore";
import { buildReport, calcScore, correctAnswerOf } from "@/lib/report";

export default function ResultPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [answerKey, setAnswerKey] = useState<AnswerMap | null>(null);
  const [showWrong, setShowWrong] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const set = loadQuestionSet();
    setQuestions(set?.questions ?? []);
    setAnswers(loadUserAnswers());
    setAnswerKey(resolveAnswerKey());
    setReady(true);
  }, []);

  const score = useMemo(
    () => calcScore(questions, answers, answerKey ?? {}),
    [questions, answers, answerKey]
  );
  const report = useMemo(
    () => (answerKey ? buildReport(questions, answers, answerKey) : ""),
    [questions, answers, answerKey]
  );

  // 正確率跑分動畫
  const [shownRate, setShownRate] = useState(0);
  useEffect(() => {
    if (!ready || !answerKey) return;
    const target = score.rate;
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setShownRate(Math.round(target * eased * 10) / 10);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, answerKey, score.rate]);

  async function handleCopy() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShowReport(true);
    }
  }

  if (!ready) {
    return (
      <>
        <PageBackground src={BACKGROUNDS.result} />
        <main className="shell mx-auto max-w-4xl px-5 py-12 text-xl text-slate-300">
          載入中…
        </main>
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        <PageBackground src={BACKGROUNDS.result} />
        <main className="shell mx-auto max-w-4xl px-5 py-12">
          <p className="text-2xl text-slate-200">目前沒有題目。</p>
          <button type="button" onClick={() => router.push("/")} className="btn btn-primary mt-6">
            回到匯入題目
          </button>
        </main>
      </>
    );
  }

  if (!answerKey) {
    return (
      <>
        <PageBackground src={BACKGROUNDS.result} />
        <main className="shell mx-auto max-w-4xl px-5 py-12">
          <div className="panel pop border-red-400/40 bg-red-950/40 p-7">
            <p className="text-2xl font-bold text-red-300">{ANSWER_DECODE_ERROR_MESSAGE}</p>
            <p className="mt-3 text-lg text-red-100/80">請重新匯入一份完整的題組 JSON。</p>
            <button type="button" onClick={() => router.push("/")} className="btn btn-primary mt-6">
              回到匯入題目
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <PageBackground src={BACKGROUNDS.result} />

      <main className="shell mx-auto w-full max-w-4xl px-5 py-10">
        <header className="rise rise-1 text-center">
          <p className="on-photo text-lg tracking-[0.4em] text-sky-300/80">RESULT</p>
          <h1 className="title-glow mt-2 text-5xl font-black">作答結果</h1>
        </header>

        <section className="panel rise rise-2 mt-8 p-8 text-center">
          <p className="text-lg text-slate-400">正確率</p>
          <p className="title-glow mt-1 text-7xl font-black tabular-nums">{shownRate}%</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="總題數" value={score.total} tone="text-slate-100" />
            <Stat label="答對" value={score.correct} tone="text-emerald-300" />
            <Stat label="答錯" value={score.wrong} tone="text-rose-300" />
          </div>
        </section>

        <section className="panel rise rise-3 mt-6 p-6">
          <p className="text-xl font-bold text-slate-100">錯誤題號</p>
          {score.wrongIndexes.length === 0 ? (
            <p className="mt-3 text-xl text-emerald-300">全部答對 ✨</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {score.wrongIndexes.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setShowWrong(true)}
                  className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-4 py-2 text-xl font-semibold text-rose-200"
                >
                  第 {i + 1} 題
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rise rise-4 mt-6 space-y-3">
          <button type="button" onClick={handleCopy} className="btn btn-primary w-full !min-h-[76px] !text-2xl">
            {copied ? "已複製 ✓" : "複製分析資料"}
          </button>
          <p className="text-center text-base text-slate-400">
            複製後直接貼回 GPT，產生錯題詳解與弱點分析。
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={() => setShowReport((v) => !v)} className="btn btn-ghost">
              {showReport ? "隱藏複製內容" : "顯示複製內容"}
            </button>
            <button type="button" onClick={() => setShowWrong((v) => !v)} className="btn btn-ghost">
              {showWrong ? "收起錯題" : "查看錯題"}
            </button>
            <button
              type="button"
              onClick={() => {
                clearUserAnswers();
                router.push("/quiz");
              }}
              className="btn btn-ghost"
            >
              重新作答
            </button>
            <button type="button" onClick={() => router.push("/")} className="btn btn-ghost">
              匯入新題目
            </button>
          </div>
        </section>

        {showReport && (
          <textarea
            readOnly
            value={report}
            onFocus={(e) => e.currentTarget.select()}
            className="field pop mt-5 h-96 font-mono text-sm"
          />
        )}

        {showWrong && (
          <section className="mt-8 space-y-6">
            {score.wrongIndexes.length === 0 && (
              <p className="text-xl text-slate-400">沒有錯題。</p>
            )}
            {score.wrongIndexes.map((i) => {
              const q = questions[i];
              const right = correctAnswerOf(q, answerKey);
              return (
                <article key={i} className="panel pop p-6">
                  <p className="text-xl font-bold text-slate-100">第 {i + 1} 題</p>
                  {(q.subject || q.unit) && (
                    <p className="mt-1 text-base text-sky-300/70">
                      {[q.subject, q.unit].filter(Boolean).join("／")}
                    </p>
                  )}

                  <div className="mt-4">
                    <BlockRenderer blocks={q.content} />
                  </div>

                  <ul className="mt-5 space-y-2">
                    {CHOICES.map((key) => {
                      const isAnswer = right === key;
                      const isMine = answers[i] === key;
                      return (
                        <li
                          key={key}
                          className={
                            "rounded-xl border p-4 text-xl " +
                            (isAnswer
                              ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100"
                              : isMine
                                ? "border-rose-400/60 bg-rose-500/15 text-rose-100"
                                : "border-white/10 bg-white/5 text-slate-300")
                          }
                        >
                          <span className="font-bold">{key}.</span> {q.options[key]}
                        </li>
                      );
                    })}
                  </ul>

                  <p className="mt-4 text-xl">
                    <span className="text-rose-300">我的答案：{answers[i] ?? "未作答"}</span>
                    <span className="ml-6 text-emerald-300">正確答案：{right ?? "—"}</span>
                  </p>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-base text-slate-400">{label}</p>
      <p className={`mt-1 text-4xl font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
