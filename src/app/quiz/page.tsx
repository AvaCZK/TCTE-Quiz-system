"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BlockRenderer from "@/components/blocks/BlockRenderer";
import PageBackground from "@/components/PageBackground";
import { BACKGROUNDS } from "@/lib/asset";
import { CHOICES, Question, UserAnswers } from "@/lib/types";
import type { Answer } from "@/lib/answerPayload";
import {
  loadIndex,
  loadQuestionSet,
  loadUserAnswers,
  saveIndex,
  saveUserAnswers,
} from "@/lib/storage";

export default function QuizPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState<string | undefined>();
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const set = loadQuestionSet();
    const qs = set?.questions ?? [];
    setQuestions(qs);
    setTitle(set?.title);
    setAnswers(loadUserAnswers());
    const i = loadIndex();
    setIndex(qs.length > 0 ? Math.min(i, qs.length - 1) : 0);
    setReady(true);
  }, []);

  function goTo(i: number) {
    if (i < 0 || i >= questions.length) return;
    setIndex(i);
    saveIndex(i);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  function choose(key: Answer) {
    const next = { ...answers, [index]: key };
    setAnswers(next);
    saveUserAnswers(next);
  }

  if (!ready) {
    return (
      <>
        <PageBackground src={BACKGROUNDS.quiz} />
        <main className="shell mx-auto max-w-4xl px-5 py-12 text-xl text-slate-300">
          載入中…
        </main>
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        <PageBackground src={BACKGROUNDS.quiz} />
        <main className="shell mx-auto max-w-4xl px-5 py-12">
          <p className="text-2xl text-slate-200">目前沒有題目。</p>
          <button type="button" onClick={() => router.push("/")} className="btn btn-primary mt-6">
            回到匯入題目
          </button>
        </main>
      </>
    );
  }

  const q = questions[index];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <>
      <PageBackground src={BACKGROUNDS.quiz} />

      <main className="shell mx-auto w-full max-w-4xl px-5 pb-40 pt-7">
        <div className="rise rise-1">
          <div className="on-photo flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-100">
              第 <span className="title-glow text-3xl">{index + 1}</span> / {questions.length} 題
            </p>
            <p className="text-lg text-slate-400">
              已作答 {answeredCount} / {questions.length}
            </p>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="progress-glow h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {title && <p className="on-photo mt-3 text-base text-slate-300/80">{title}</p>}
        </div>

        {(q.subject || q.unit) && (
          <p className="rise rise-2 on-photo mt-5 text-lg text-sky-300/85">
            {[q.subject, q.unit].filter(Boolean).join("／")}
          </p>
        )}

        <section key={`stem-${index}`} className="panel rise rise-2 mt-4 p-6">
          <BlockRenderer blocks={q.content} />
        </section>

        <section key={`opts-${index}`} className="mt-6 space-y-4">
          {CHOICES.map((key, i) => {
            const selected = answers[index] === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => choose(key)}
                style={{ animationDelay: `${0.05 + i * 0.06}s` }}
                className={`rise option-card ${selected ? "option-card-selected" : ""}`}
              >
                <span className={`option-key ${selected ? "option-key-selected" : ""}`}>
                  {key}
                </span>
                <span className="pt-1.5">{q.options[key]}</span>
              </button>
            );
          })}
        </section>

        <section className="mt-9">
          <p className="on-photo text-base text-slate-300/80">題號</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {questions.map((_, i) => {
              const done = answers[i] !== undefined;
              const current = i === index;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className={
                    "h-12 w-12 rounded-xl text-lg font-semibold transition-all " +
                    (current
                      ? "bg-gradient-to-br from-sky-400 to-indigo-500 text-slate-950 shadow-[0_0_18px_-2px_var(--glow)]"
                      : done
                        ? "border border-sky-400/50 bg-sky-600/35 text-sky-100 backdrop-blur-sm"
                        : "border border-white/15 bg-slate-950/55 text-slate-300 backdrop-blur-sm")
                  }
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-20 px-5 py-4">
          <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="btn btn-ghost flex-1"
            >
              上一題
            </button>

            {index < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                className="btn btn-primary flex-1"
              >
                下一題
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/result")}
                disabled={!allAnswered}
                className="btn btn-success flex-1"
              >
                {allAnswered ? "送出答案" : `還有 ${questions.length - answeredCount} 題未作答`}
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
