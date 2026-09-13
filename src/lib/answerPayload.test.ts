import { describe, expect, it } from "vitest";
import {
  ANSWER_DECODE_ERROR_MESSAGE,
  AnswerMap,
  AnswerPayloadError,
  decodeAnswerPayload,
  encodeAnswerPayload,
  tryDecodeAnswerPayload,
} from "./answerPayload";
import { validateQuestionSetJson } from "./validate";

const SEED = "starlight-2026";
const LETTERS = ["A", "B", "C", "D"] as const;

function makeAnswers(n: number, idPrefix = ""): AnswerMap {
  const map: AnswerMap = {};
  for (let i = 1; i <= n; i++) {
    map[`${idPrefix}${i}`] = LETTERS[i % 4];
  }
  return map;
}

describe("round-trip", () => {
  it("1 題", () => {
    const answers = makeAnswers(1);
    expect(decodeAnswerPayload(encodeAnswerPayload(answers, SEED))).toEqual(answers);
  });

  it("20 題", () => {
    const answers = makeAnswers(20);
    expect(decodeAnswerPayload(encodeAnswerPayload(answers, SEED))).toEqual(answers);
  });

  it("50 題", () => {
    const answers = makeAnswers(50);
    expect(decodeAnswerPayload(encodeAnswerPayload(answers, SEED))).toEqual(answers);
  });

  it("數字 id（JSON key 轉字串）", () => {
    const answers: AnswerMap = { "1": "C", "2": "A", "3": "D", "4": "B" };
    expect(decodeAnswerPayload(encodeAnswerPayload(answers, SEED))).toEqual(answers);
  });

  it("字串 id", () => {
    const answers: AnswerMap = { "econ-01": "B", "acc-02": "D", "biz_03": "A" };
    expect(decodeAnswerPayload(encodeAnswerPayload(answers, SEED))).toEqual(answers);
  });

  it("中文與特殊字元 seed", () => {
    const answers = makeAnswers(8);
    expect(decodeAnswerPayload(encodeAnswerPayload(answers, "種子🌟seed"))).toEqual(answers);
  });

  it("payload 是 Base64 且看不出原始答案", () => {
    const v = encodeAnswerPayload({ "1": "C" }, SEED);
    expect(v.version).toBe("1");
    expect(v.algorithm).toBe("deflate-raw+xor-seed+base64");
    expect(v.payload).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(v.payload).not.toContain("C");
  });
});

describe("錯誤處理", () => {
  it("seed 為空字串（encode）", () => {
    expect(() => encodeAnswerPayload({ "1": "A" }, "")).toThrow(AnswerPayloadError);
  });

  it("seed 為空字串（decode）", () => {
    const v = encodeAnswerPayload({ "1": "A" }, SEED);
    expect(() => decodeAnswerPayload({ ...v, seed: "" })).toThrow(ANSWER_DECODE_ERROR_MESSAGE);
  });

  it("seed 不正確", () => {
    const v = encodeAnswerPayload(makeAnswers(10), SEED);
    const r = tryDecodeAnswerPayload({ ...v, seed: "wrong-seed" });
    expect(r.ok).toBe(false);
  });

  it("無效 Base64", () => {
    const v = encodeAnswerPayload({ "1": "A" }, SEED);
    expect(() => decodeAnswerPayload({ ...v, payload: "!!!not-base64!!!" })).toThrow(
      ANSWER_DECODE_ERROR_MESSAGE
    );
  });

  it("payload 損毀（合法 Base64 但內容壞掉）", () => {
    const v = encodeAnswerPayload(makeAnswers(12), SEED);
    const bytes = v.payload.split("");
    bytes[4] = bytes[4] === "A" ? "B" : "A";
    bytes[9] = bytes[9] === "Z" ? "Y" : "Z";
    const r = tryDecodeAnswerPayload({ ...v, payload: bytes.join("") });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe(ANSWER_DECODE_ERROR_MESSAGE);
  });

  it("payload 為空", () => {
    const v = encodeAnswerPayload({ "1": "A" }, SEED);
    expect(() => decodeAnswerPayload({ ...v, payload: "" })).toThrow(ANSWER_DECODE_ERROR_MESSAGE);
  });

  it("version / algorithm 不相容", () => {
    const v = encodeAnswerPayload({ "1": "A" }, SEED);
    expect(() => decodeAnswerPayload({ ...v, version: "2" })).toThrow(ANSWER_DECODE_ERROR_MESSAGE);
    expect(() => decodeAnswerPayload({ ...v, algorithm: "gzip+base64" })).toThrow(
      ANSWER_DECODE_ERROR_MESSAGE
    );
  });

  it("答案值不是 A/B/C/D", () => {
    expect(() =>
      encodeAnswerPayload({ "1": "E" } as unknown as AnswerMap, SEED)
    ).toThrow(AnswerPayloadError);
  });

  it("validation 缺欄位", () => {
    expect(tryDecodeAnswerPayload(null).ok).toBe(false);
    expect(tryDecodeAnswerPayload({}).ok).toBe(false);
    expect(tryDecodeAnswerPayload({ version: "1" }).ok).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* 與匯入流程整合                                                      */
/* ------------------------------------------------------------------ */

function buildSet(ids: (number | string)[], answers: AnswerMap, seed = SEED) {
  return JSON.stringify({
    version: "1.0",
    title: "測試題組",
    questions: ids.map((id) => ({
      id,
      subject: "經濟學",
      unit: "供需",
      content: [{ type: "text", text: `題目 ${id}` }],
      options: { A: "甲", B: "乙", C: "丙", D: "丁" },
    })),
    validation: encodeAnswerPayload(answers, seed),
  });
}

describe("validateQuestionSetJson", () => {
  it("正常題組可以匯入，且答案不在 questions 裡", () => {
    const answers: AnswerMap = { "1": "A", "2": "B", "3": "C" };
    const r = validateQuestionSetJson(buildSet([1, 2, 3], answers));
    expect(r.ok).toBe(true);
    expect(r.set?.questions).toHaveLength(3);
    expect(r.answers).toEqual(answers);
    expect(JSON.stringify(r.set?.questions)).not.toContain("answer");
  });

  it("字串 id 也可以", () => {
    const answers: AnswerMap = { "econ-1": "D", "econ-2": "A" };
    const r = validateQuestionSetJson(buildSet(["econ-1", "econ-2"], answers));
    expect(r.ok).toBe(true);
    expect(r.answers).toEqual(answers);
  });

  it("缺少某題答案要擋下來", () => {
    const answers: AnswerMap = { "1": "A", "2": "B" }; // 少了 3
    const r = validateQuestionSetJson(buildSet([1, 2, 3], answers));
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toContain(ANSWER_DECODE_ERROR_MESSAGE);
    expect(r.errors[0]).toContain("3");
  });

  it("題目裡出現 answer 欄位要擋下來", () => {
    const raw = JSON.parse(buildSet([1], { "1": "A" }));
    raw.questions[0].answer = "A";
    const r = validateQuestionSetJson(JSON.stringify(raw));
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toContain("answer");
  });

  it("缺少 validation 要擋下來", () => {
    const raw = JSON.parse(buildSet([1], { "1": "A" }));
    delete raw.validation;
    const r = validateQuestionSetJson(JSON.stringify(raw));
    expect(r.ok).toBe(false);
  });

  it("id 重複要擋下來", () => {
    const raw = JSON.parse(buildSet([1, 2], { "1": "A", "2": "B" }));
    raw.questions[1].id = 1;
    const r = validateQuestionSetJson(JSON.stringify(raw));
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toContain("重複");
  });

  it("payload 損毀時回報固定訊息", () => {
    const raw = JSON.parse(buildSet([1], { "1": "A" }));
    raw.validation.payload = "AAAAAAAA";
    const r = validateQuestionSetJson(JSON.stringify(raw));
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toContain(ANSWER_DECODE_ERROR_MESSAGE);
  });
});
