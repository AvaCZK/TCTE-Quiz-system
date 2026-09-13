// 題目與 Block 的型別定義

import type { Answer, AnswerMap, ValidationPayload } from "./answerPayload";

export type { Answer, AnswerMap, ValidationPayload };

/** 相容舊命名 */
export type Choice = Answer;

export const CHOICES: Answer[] = ["A", "B", "C", "D"];

export interface TextBlock {
  type: "text";
  text: string;
}

export interface TableBlock {
  type: "table";
  headers: string[];
  rows: (string | number)[][];
}

export interface LatexBlock {
  type: "latex";
  formula: string;
}

export interface EconCurve {
  /** 曲線名稱，例如 D、S、D1、D2 */
  name: string;
  points: { x: number; y: number }[];
  /** 可省略，省略時自動配色 */
  color?: string;
}

export interface EconPoint {
  /** 點的名稱，例如 E、E1 */
  name?: string;
  x: number;
  y: number;
}

export interface EconGraphBlock {
  type: "econ_graph";
  title?: string;
  xLabel: string;
  yLabel: string;
  curves: EconCurve[];
  points?: EconPoint[];
}

export type Block = TextBlock | TableBlock | LatexBlock | EconGraphBlock;

/**
 * 題目本身不包含任何答案欄位。
 * 正確答案統一放在題組最外層的 validation（Answer Payload Protocol v1）。
 */
export interface Question {
  id: number | string;
  subject?: string;
  unit?: string;
  content: Block[];
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
}

export interface QuestionSet {
  version?: string;
  title?: string;
  questions: Question[];
  validation: ValidationPayload;
}

/** 使用者的作答：key = 題目在陣列中的索引（未作答則沒有該 key） */
export type UserAnswers = Partial<Record<number, Answer>>;

/** questions 內不允許出現的欄位 */
export const FORBIDDEN_QUESTION_FIELDS = [
  "answer",
  "correctAnswer",
  "correct_answer",
  "solution",
  "ans",
] as const;
