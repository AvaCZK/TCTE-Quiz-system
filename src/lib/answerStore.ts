/**
 * 解碼後的正確答案只放在記憶體（module scope），不寫進 localStorage。
 *
 * 頁面之間用 Next 的 client-side navigation 切換，module state 會保留；
 * 若使用者重新整理導致記憶體清空，再從存下來的 validation payload 重新解碼一次。
 */

import { AnswerMap, tryDecodeAnswerPayload } from "./answerPayload";
import { loadQuestionSet } from "./storage";

let memoryAnswerKey: AnswerMap | null = null;

export function setAnswerKey(answers: AnswerMap) {
  memoryAnswerKey = answers;
}

export function clearAnswerKey() {
  memoryAnswerKey = null;
}

/** 取得答案；沒有就嘗試從 validation 重新解碼。失敗回傳 null。 */
export function resolveAnswerKey(): AnswerMap | null {
  if (memoryAnswerKey) return memoryAnswerKey;

  const set = loadQuestionSet();
  if (!set) return null;

  const decoded = tryDecodeAnswerPayload(set.validation);
  if (!decoded.ok) return null;

  memoryAnswerKey = decoded.answers;
  return memoryAnswerKey;
}
