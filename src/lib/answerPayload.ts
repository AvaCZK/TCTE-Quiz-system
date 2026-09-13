/**
 * Answer Payload Protocol v1
 *
 * algorithm: "deflate-raw+xor-seed+base64"
 *
 * encode: answerMap -> compact JSON -> UTF-8 -> raw DEFLATE -> repeating-key XOR(seed) -> Base64
 * decode: Base64 -> repeating-key XOR(seed) -> raw INFLATE -> UTF-8 -> JSON.parse
 *
 * 這不是加密，只是避免答案被肉眼直接讀到。
 */

import { deflateSync, inflateSync, strToU8, strFromU8 } from "fflate";

export type Answer = "A" | "B" | "C" | "D";

export type AnswerMap = Record<string, Answer>;

export interface ValidationPayload {
  version: "1";
  algorithm: "deflate-raw+xor-seed+base64";
  seed: string;
  payload: string;
}

export const ANSWER_PROTOCOL_VERSION = "1";
export const ANSWER_PROTOCOL_ALGORITHM = "deflate-raw+xor-seed+base64";

export const ANSWER_DECODE_ERROR_MESSAGE = "題目答案資料損毀或格式不相容";

export class AnswerPayloadError extends Error {
  readonly detail: string;

  constructor(detail: string) {
    super(ANSWER_DECODE_ERROR_MESSAGE);
    this.name = "AnswerPayloadError";
    this.detail = detail;
  }
}

const VALID_ANSWERS: readonly string[] = ["A", "B", "C", "D"];

/* ------------------------------------------------------------------ */
/* Base64（瀏覽器 / Node 皆可用）                                       */
/* ------------------------------------------------------------------ */

const BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK);
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }

  const g = globalThis as unknown as {
    btoa?: (s: string) => string;
    Buffer?: { from(data: Uint8Array): { toString(enc: string): string } };
  };

  if (typeof g.btoa === "function") return g.btoa(binary);
  if (g.Buffer) return g.Buffer.from(bytes).toString("base64");
  throw new AnswerPayloadError("此環境不支援 Base64 編碼");
}

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.trim();
  if (clean.length === 0) throw new AnswerPayloadError("payload 是空字串");
  if (clean.length % 4 !== 0 || !BASE64_RE.test(clean)) {
    throw new AnswerPayloadError("payload 不是合法的 Base64");
  }

  const g = globalThis as unknown as {
    atob?: (s: string) => string;
    Buffer?: {
      from(data: string, enc: string): Uint8Array & { toString(enc: string): string };
    };
  };

  let binary: string;
  if (typeof g.atob === "function") {
    try {
      binary = g.atob(clean);
    } catch {
      throw new AnswerPayloadError("payload 不是合法的 Base64");
    }
  } else if (g.Buffer) {
    const buf = g.Buffer.from(clean, "base64");
    // Node 的 Buffer 對不合法字元會靜默忽略，這裡再驗一次長度
    if (buf.toString("base64").replace(/=+$/, "") !== clean.replace(/=+$/, "")) {
      throw new AnswerPayloadError("payload 不是合法的 Base64");
    }
    return new Uint8Array(buf);
  } else {
    throw new AnswerPayloadError("此環境不支援 Base64 解碼");
  }

  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/* ------------------------------------------------------------------ */
/* repeating-key XOR                                                   */
/* ------------------------------------------------------------------ */

function xorWithSeed(bytes: Uint8Array, seed: string): Uint8Array {
  const key = strToU8(seed);
  if (key.length === 0) {
    throw new AnswerPayloadError("seed 不可為空字串");
  }
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ^ key[i % key.length];
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* encode                                                              */
/* ------------------------------------------------------------------ */

export function encodeAnswerPayload(
  answers: AnswerMap,
  seed: string
): ValidationPayload {
  if (typeof seed !== "string" || seed.length === 0) {
    throw new AnswerPayloadError("seed 不可為空字串");
  }

  const entries = Object.entries(answers);
  if (entries.length === 0) {
    throw new AnswerPayloadError("答案不可為空");
  }
  for (const [key, value] of entries) {
    if (!VALID_ANSWERS.includes(value)) {
      throw new AnswerPayloadError(`題目 ${key} 的答案「${String(value)}」不是 A/B/C/D`);
    }
  }

  const json = JSON.stringify(answers); // compact JSON
  const compressed = deflateSync(strToU8(json), { level: 9 }); // raw DEFLATE
  const xored = xorWithSeed(compressed, seed);

  return {
    version: ANSWER_PROTOCOL_VERSION,
    algorithm: ANSWER_PROTOCOL_ALGORITHM,
    seed,
    payload: bytesToBase64(xored),
  };
}

/* ------------------------------------------------------------------ */
/* decode                                                              */
/* ------------------------------------------------------------------ */

function assertValidationShape(input: unknown): ValidationPayload {
  if (typeof input !== "object" || input === null) {
    throw new AnswerPayloadError("validation 不是物件");
  }
  const v = input as Record<string, unknown>;

  if (v.version !== ANSWER_PROTOCOL_VERSION) {
    throw new AnswerPayloadError(`不支援的 validation.version：${String(v.version)}`);
  }
  if (v.algorithm !== ANSWER_PROTOCOL_ALGORITHM) {
    throw new AnswerPayloadError(`不支援的 validation.algorithm：${String(v.algorithm)}`);
  }
  if (typeof v.seed !== "string" || v.seed.length === 0) {
    throw new AnswerPayloadError("validation.seed 不可為空");
  }
  if (typeof v.payload !== "string" || v.payload.length === 0) {
    throw new AnswerPayloadError("validation.payload 不可為空");
  }

  return {
    version: ANSWER_PROTOCOL_VERSION,
    algorithm: ANSWER_PROTOCOL_ALGORITHM,
    seed: v.seed,
    payload: v.payload,
  };
}

export function decodeAnswerPayload(validation: unknown): AnswerMap {
  const v = assertValidationShape(validation);

  const xored = base64ToBytes(v.payload);
  const compressed = xorWithSeed(xored, v.seed);

  let json: string;
  try {
    json = strFromU8(inflateSync(compressed));
  } catch {
    throw new AnswerPayloadError("raw DEFLATE 解壓縮失敗（payload 或 seed 不正確）");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new AnswerPayloadError("解壓縮後的內容不是合法 JSON");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AnswerPayloadError("答案資料必須是物件");
  }

  const map: AnswerMap = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== "string" || !VALID_ANSWERS.includes(value)) {
      throw new AnswerPayloadError(`題目 ${key} 的答案不是 A/B/C/D`);
    }
    map[key] = value as Answer;
  }

  if (Object.keys(map).length === 0) {
    throw new AnswerPayloadError("答案資料是空的");
  }

  return map;
}

/** 不丟例外的版本，方便 UI 使用 */
export function tryDecodeAnswerPayload(
  validation: unknown
): { ok: true; answers: AnswerMap } | { ok: false; message: string; detail: string } {
  try {
    return { ok: true, answers: decodeAnswerPayload(validation) };
  } catch (e) {
    if (e instanceof AnswerPayloadError) {
      return { ok: false, message: e.message, detail: e.detail };
    }
    return {
      ok: false,
      message: ANSWER_DECODE_ERROR_MESSAGE,
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}
