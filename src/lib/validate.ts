// 題組 JSON 驗證（除了 fflate 之外不依賴外部套件）

import {
  ANSWER_DECODE_ERROR_MESSAGE,
  AnswerMap,
  tryDecodeAnswerPayload,
} from "./answerPayload";
import {
  Block,
  FORBIDDEN_QUESTION_FIELDS,
  Question,
  QuestionSet,
} from "./types";

export interface ValidateResult {
  ok: boolean;
  /** 題目本身，不含答案 */
  set: QuestionSet | null;
  /** 解碼後的答案；只在記憶體中傳遞，不要寫進 localStorage */
  answers: AnswerMap | null;
  errors: string[];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validateBlock(raw: unknown, path: string, errors: string[]): Block | null {
  if (!isObject(raw)) {
    errors.push(`${path}：block 必須是物件`);
    return null;
  }
  const type = raw.type;

  if (type === "text") {
    if (typeof raw.text !== "string") {
      errors.push(`${path}：text block 缺少 text 字串`);
      return null;
    }
    return { type: "text", text: raw.text };
  }

  if (type === "table") {
    const headers = raw.headers;
    const rows = raw.rows;
    if (!Array.isArray(headers) || headers.some((h) => typeof h !== "string")) {
      errors.push(`${path}：table block 的 headers 必須是字串陣列`);
      return null;
    }
    if (!Array.isArray(rows) || rows.some((r) => !Array.isArray(r))) {
      errors.push(`${path}：table block 的 rows 必須是二維陣列`);
      return null;
    }
    const cleanRows = (rows as unknown[][]).map((r) =>
      r.map((c) => (typeof c === "number" ? c : String(c ?? "")))
    );
    return { type: "table", headers: headers as string[], rows: cleanRows };
  }

  if (type === "latex") {
    if (typeof raw.formula !== "string") {
      errors.push(`${path}：latex block 缺少 formula 字串`);
      return null;
    }
    return { type: "latex", formula: raw.formula };
  }

  if (type === "econ_graph") {
    if (typeof raw.xLabel !== "string" || typeof raw.yLabel !== "string") {
      errors.push(`${path}：econ_graph block 需要 xLabel 與 yLabel 字串`);
      return null;
    }
    if (!Array.isArray(raw.curves) || raw.curves.length === 0) {
      errors.push(`${path}：econ_graph block 需要至少一條 curves`);
      return null;
    }
    const curves = [];
    for (let i = 0; i < raw.curves.length; i++) {
      const c = raw.curves[i];
      if (!isObject(c) || typeof c.name !== "string" || !Array.isArray(c.points)) {
        errors.push(`${path}.curves[${i}]：需要 name 字串與 points 陣列`);
        return null;
      }
      const pts = [];
      for (let j = 0; j < c.points.length; j++) {
        const p = c.points[j];
        if (!isObject(p) || typeof p.x !== "number" || typeof p.y !== "number") {
          errors.push(`${path}.curves[${i}].points[${j}]：需要數字 x 與 y`);
          return null;
        }
        pts.push({ x: p.x, y: p.y });
      }
      if (pts.length < 2) {
        errors.push(`${path}.curves[${i}]：至少需要 2 個點才能畫線`);
        return null;
      }
      curves.push({
        name: c.name,
        points: pts,
        color: typeof c.color === "string" ? c.color : undefined,
      });
    }

    const points = [];
    if (raw.points !== undefined) {
      if (!Array.isArray(raw.points)) {
        errors.push(`${path}.points：必須是陣列`);
        return null;
      }
      for (let i = 0; i < raw.points.length; i++) {
        const p = raw.points[i];
        if (!isObject(p) || typeof p.x !== "number" || typeof p.y !== "number") {
          errors.push(`${path}.points[${i}]：需要數字 x 與 y`);
          return null;
        }
        points.push({
          x: p.x,
          y: p.y,
          name: typeof p.name === "string" ? p.name : undefined,
        });
      }
    }

    return {
      type: "econ_graph",
      title: typeof raw.title === "string" ? raw.title : undefined,
      xLabel: raw.xLabel,
      yLabel: raw.yLabel,
      curves,
      points: points.length > 0 ? points : undefined,
    };
  }

  errors.push(
    `${path}：不支援的 block type「${String(type)}」（支援 text / table / latex / econ_graph）`
  );
  return null;
}

function validateQuestion(raw: unknown, index: number, errors: string[]): Question | null {
  const label = `第 ${index + 1} 題`;
  if (!isObject(raw)) {
    errors.push(`${label}：必須是物件`);
    return null;
  }

  // 題目中不得出現任何洩漏答案的欄位
  for (const field of FORBIDDEN_QUESTION_FIELDS) {
    if (field in raw) {
      errors.push(
        `${label}：題目中不得包含「${field}」欄位，正確答案請放在最外層的 validation`
      );
      return null;
    }
  }

  if (typeof raw.id !== "number" && typeof raw.id !== "string") {
    errors.push(`${label}：必須有 id（數字或字串），答案是以 id 對應的`);
    return null;
  }
  const id = raw.id;
  if (typeof id === "string" && id.trim() === "") {
    errors.push(`${label}：id 不可為空字串`);
    return null;
  }

  if (!Array.isArray(raw.content) || raw.content.length === 0) {
    errors.push(`${label}：content 必須是至少一個 block 的陣列`);
    return null;
  }
  const content: Block[] = [];
  for (let i = 0; i < raw.content.length; i++) {
    const b = validateBlock(raw.content[i], `${label} content[${i}]`, errors);
    if (!b) return null;
    content.push(b);
  }

  const opts = raw.options;
  if (!isObject(opts)) {
    errors.push(`${label}：缺少 options`);
    return null;
  }
  for (const k of ["A", "B", "C", "D"] as const) {
    if (typeof opts[k] !== "string" || (opts[k] as string).trim() === "") {
      errors.push(`${label}：options.${k} 必須是非空字串`);
      return null;
    }
  }

  return {
    id,
    subject: typeof raw.subject === "string" ? raw.subject : undefined,
    unit: typeof raw.unit === "string" ? raw.unit : undefined,
    content,
    options: {
      A: opts.A as string,
      B: opts.B as string,
      C: opts.C as string,
      D: opts.D as string,
    },
  };
}

const EMPTY: ValidateResult = { ok: false, set: null, answers: null, errors: [] };

export function validateQuestionSetJson(text: string): ValidateResult {
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return {
      ...EMPTY,
      errors: [`JSON 格式錯誤：${e instanceof Error ? e.message : String(e)}`],
    };
  }

  if (Array.isArray(parsed)) {
    return {
      ...EMPTY,
      errors: [
        "最外層必須是物件（需要包含 questions 與 validation），不能只有題目陣列",
      ],
    };
  }
  if (!isObject(parsed)) {
    return { ...EMPTY, errors: ["最外層必須是 JSON 物件"] };
  }

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    return { ...EMPTY, errors: ["缺少 questions 陣列，或題目數量為 0"] };
  }

  // 1. 題目本身
  const questions: Question[] = [];
  parsed.questions.forEach((raw: unknown, i: number) => {
    const q = validateQuestion(raw, i, errors);
    if (q) questions.push(q);
  });

  if (errors.length > 0 || questions.length === 0) {
    return { ...EMPTY, errors: errors.length > 0 ? errors : ["沒有有效題目"] };
  }

  // id 不可重複
  const seen = new Set<string>();
  for (const q of questions) {
    const key = String(q.id);
    if (seen.has(key)) {
      return { ...EMPTY, errors: [`題目 id 重複：${key}`] };
    }
    seen.add(key);
  }

  // 2. validation
  if (!("validation" in parsed)) {
    return {
      ...EMPTY,
      errors: ["缺少最外層 validation（Answer Payload Protocol v1）"],
    };
  }

  const decoded = tryDecodeAnswerPayload(parsed.validation);
  if (!decoded.ok) {
    return { ...EMPTY, errors: [`${ANSWER_DECODE_ERROR_MESSAGE}（${decoded.detail}）`] };
  }
  const answers = decoded.answers;

  // 3. 每一題都要有答案
  const missing = questions.filter((q) => answers[String(q.id)] === undefined);
  if (missing.length > 0) {
    const ids = missing.map((q) => String(q.id)).join("、");
    return {
      ...EMPTY,
      errors: [`${ANSWER_DECODE_ERROR_MESSAGE}（缺少題目 ${ids} 的答案）`],
    };
  }

  const set: QuestionSet = {
    version: typeof parsed.version === "string" ? parsed.version : undefined,
    title: typeof parsed.title === "string" ? parsed.title : undefined,
    questions,
    validation: {
      version: "1",
      algorithm: "deflate-raw+xor-seed+base64",
      seed: (parsed.validation as Record<string, unknown>).seed as string,
      payload: (parsed.validation as Record<string, unknown>).payload as string,
    },
  };

  return { ok: true, set, answers, errors: [] };
}
