/**
 * 瀏覽器暫存。
 *
 * 存：題目（不含答案）、原始 validation payload、使用者自己的作答、目前題號。
 * 不存：解碼後的正確答案（AnswerMap 只放記憶體，見 answerStore.ts）。
 */

import { QuestionSet, UserAnswers } from "./types";

const SET_KEY = "tcte_quiz_set";
const USER_ANSWERS_KEY = "tcte_quiz_user_answers";
const INDEX_KEY = "tcte_quiz_index";

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 忽略（無痕模式等） */
  }
}

function safeRemove(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function saveQuestionSet(set: QuestionSet) {
  safeSet(SET_KEY, JSON.stringify(set));
  safeSet(USER_ANSWERS_KEY, JSON.stringify({}));
  safeSet(INDEX_KEY, "0");
}

export function loadQuestionSet(): QuestionSet | null {
  const raw = safeGet(SET_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.questions) || !parsed.validation) return null;
    return parsed as QuestionSet;
  } catch {
    return null;
  }
}

export function saveUserAnswers(answers: UserAnswers) {
  safeSet(USER_ANSWERS_KEY, JSON.stringify(answers));
}

export function loadUserAnswers(): UserAnswers {
  const raw = safeGet(USER_ANSWERS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as UserAnswers) : {};
  } catch {
    return {};
  }
}

export function saveIndex(index: number) {
  safeSet(INDEX_KEY, String(index));
}

export function loadIndex(): number {
  const raw = safeGet(INDEX_KEY);
  const n = raw === null ? 0 : Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/** 只清空作答，題目保留 */
export function clearUserAnswers() {
  safeSet(USER_ANSWERS_KEY, JSON.stringify({}));
  safeSet(INDEX_KEY, "0");
}

export function clearAll() {
  safeRemove(SET_KEY);
  safeRemove(USER_ANSWERS_KEY);
  safeRemove(INDEX_KEY);
}
