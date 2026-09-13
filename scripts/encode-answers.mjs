#!/usr/bin/env node
/**
 * 把「含答案的草稿 JSON」轉成 Answer Payload Protocol v1 題組。
 *
 *   node scripts/encode-answers.mjs draft.json --seed=my-seed --out=set.json
 *
 * 草稿格式（每題直接寫 answer，方便你或 GPT 產生）：
 *   { "title": "...", "questions": [ { "id": 1, ..., "answer": "C" } ] }
 *   或直接是題目陣列。
 *
 * 輸出：questions 內的 answer 會被拿掉，正確答案編碼進最外層 validation。
 *
 * 這裡用 Node 內建的 zlib.deflateRawSync，與網站端的 fflate raw DEFLATE 完全相容。
 */

import { readFileSync, writeFileSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import { randomBytes } from "node:crypto";

const ALGORITHM = "deflate-raw+xor-seed+base64";
const VALID = ["A", "B", "C", "D"];

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("用法：node scripts/encode-answers.mjs <draft.json> [--seed=xxx] [--out=out.json]");
  process.exit(1);
}

const seed = arg("seed", randomBytes(8).toString("hex"));
const outPath = arg("out", null);

const raw = JSON.parse(readFileSync(inputPath, "utf8"));
const questions = Array.isArray(raw) ? raw : raw.questions;

if (!Array.isArray(questions) || questions.length === 0) {
  console.error("找不到 questions 陣列");
  process.exit(1);
}

const answers = {};
const cleaned = questions.map((q, i) => {
  const id = q.id ?? i + 1;
  const answer = q.answer ?? q.correctAnswer ?? q.solution;
  if (!VALID.includes(answer)) {
    console.error(`題目 ${id} 的答案「${answer}」不是 A/B/C/D`);
    process.exit(1);
  }
  if (answers[String(id)] !== undefined) {
    console.error(`題目 id 重複：${id}`);
    process.exit(1);
  }
  answers[String(id)] = answer;

  const rest = { ...q };
  delete rest.answer;
  delete rest.correctAnswer;
  delete rest.correct_answer;
  delete rest.solution;
  delete rest.ans;
  rest.id = id;
  return rest;
});

const json = JSON.stringify(answers);
const compressed = deflateRawSync(Buffer.from(json, "utf8"), { level: 9 });
const key = Buffer.from(seed, "utf8");
if (key.length === 0) {
  console.error("seed 不可為空");
  process.exit(1);
}
const xored = Buffer.alloc(compressed.length);
for (let i = 0; i < compressed.length; i++) {
  xored[i] = compressed[i] ^ key[i % key.length];
}

const out = {
  version: typeof raw.version === "string" ? raw.version : "1.0",
  title: typeof raw.title === "string" ? raw.title : undefined,
  questions: cleaned,
  validation: {
    version: "1",
    algorithm: ALGORITHM,
    seed,
    payload: xored.toString("base64"),
  },
};

const text = JSON.stringify(out, null, 2);
if (outPath) {
  writeFileSync(outPath, text + "\n");
  console.error(`已寫入 ${outPath}（${cleaned.length} 題，seed=${seed}）`);
} else {
  process.stdout.write(text + "\n");
}
