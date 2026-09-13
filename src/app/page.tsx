"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PageBackground from "@/components/PageBackground";
import { BACKGROUNDS } from "@/lib/asset";
import { validateQuestionSetJson } from "@/lib/validate";
import { saveQuestionSet } from "@/lib/storage";
import { setAnswerKey } from "@/lib/answerStore";
import { QuestionSet } from "@/lib/types";
import type { AnswerMap } from "@/lib/answerPayload";

export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [set, setSet] = useState<QuestionSet | null>(null);

  // 解碼後的答案只放在這個 ref（記憶體），不寫進 state 顯示、不寫進 localStorage
  const answerKeyRef = useRef<AnswerMap | null>(null);

  function handleValidate(source?: string) {
    const raw = (source ?? text).trim();
    if (!raw) {
      setErrors(["請先貼上 JSON 或選擇 .json 檔"]);
      setSet(null);
      answerKeyRef.current = null;
      return;
    }

    const result = validateQuestionSetJson(raw);
    if (result.ok && result.set && result.answers) {
      answerKeyRef.current = result.answers;
      setSet(result.set);
      setErrors([]);
    } else {
      answerKeyRef.current = null;
      setSet(null);
      setErrors(result.errors);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
    handleValidate(content);
    e.target.value = "";
  }

  function handleStart() {
    if (!set || !answerKeyRef.current) return;
    saveQuestionSet(set);
    setAnswerKey(answerKeyRef.current);
    router.push("/quiz");
  }

  return (
    <>
      <PageBackground src={BACKGROUNDS.home} />

      <main className="shell mx-auto w-full max-w-4xl px-5 py-10">
        <header className="rise rise-1 pt-4 text-center">
          <h1 className="title-glow text-5xl font-black tracking-tight sm:text-6xl">
            TCTE QUIZ
          </h1>
          <p className="on-photo mt-4 text-xl text-slate-200/95">
            把 GPT 產生的題組 JSON 貼進來，就可以開始作答。
          </p>
        </header>

        <section className="panel rise rise-2 mt-9 p-6">
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost">
              選擇 .json 檔
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => {
                setText("");
                setErrors([]);
                setSet(null);
                answerKeyRef.current = null;
              }}
              className="btn btn-ghost"
            >
              清空
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'{\n  "version": "1.0",\n  "title": "題組名稱",\n  "questions": [ ... ],\n  "validation": {\n    "version": "1",\n    "algorithm": "deflate-raw+xor-seed+base64",\n    "seed": "...",\n    "payload": "..."\n  }\n}'}
            className="field mt-5 h-72 font-mono text-base"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => handleValidate()} className="btn btn-ghost">
              驗證題目格式
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={!set}
              className="btn btn-primary"
            >
              開始作答
            </button>
          </div>
        </section>

        {errors.length > 0 && (
          <section className="panel pop mt-6 border-red-400/40 bg-red-950/40 p-6">
            <p className="text-xl font-bold text-red-300">無法匯入</p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-lg text-red-200/90">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </section>
        )}

        {set && (
          <section className="panel pop mt-6 border-emerald-400/40 bg-emerald-950/30 p-6 text-center">
            <p className="text-3xl font-black text-emerald-300">
              成功匯入 {set.questions.length} 題
            </p>
            {set.title && <p className="mt-2 text-xl text-emerald-100/80">{set.title}</p>}
            <p className="mt-2 text-lg text-emerald-100/60">
              答案已通過驗證，按「開始作答」出發。
            </p>
          </section>
        )}

        <section className="rise rise-3 on-photo mt-10 text-center text-slate-300/85">
          <p className="text-lg">
            題目 JSON 不含答案，正確答案以 Answer Payload Protocol v1 編碼在
            <span className="mx-1 font-mono text-sky-300/90">validation</span>
            欄位。
          </p>
        </section>

        <footer className="rise rise-4 mt-14 border-t border-white/10 pt-6 text-center">
          <p className="on-photo text-base tracking-wide text-slate-300/80">
            本網站由 claude code Opus 5 生成
          </p>
        </footer>
      </main>
    </>
  );
}
