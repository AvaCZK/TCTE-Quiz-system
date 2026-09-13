// 計分 + 產生「複製分析資料」的文字，只包含答錯的題目

import { AnswerMap, Answer } from "./answerPayload";
import { Block, Question, UserAnswers } from "./types";

/** 把 block 轉成純文字，方便貼回 GPT */
export function blockToText(block: Block): string {
  switch (block.type) {
    case "text":
      return block.text;

    case "table": {
      const head = `| ${block.headers.join(" | ")} |`;
      const sep = `| ${block.headers.map(() => "---").join(" | ")} |`;
      const body = block.rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
      return [head, sep, body].join("\n");
    }

    case "latex":
      return `$$${block.formula}$$`;

    case "econ_graph": {
      const lines: string[] = [];
      lines.push(`[經濟學圖形]${block.title ? ` ${block.title}` : ""}`);
      lines.push(`X 軸：${block.xLabel}，Y 軸：${block.yLabel}`);
      block.curves.forEach((c) => {
        const pts = c.points.map((p) => `(${p.x}, ${p.y})`).join(" → ");
        lines.push(`曲線 ${c.name}：${pts}`);
      });
      if (block.points && block.points.length > 0) {
        block.points.forEach((p) => {
          lines.push(`標記點 ${p.name ?? ""}：(${p.x}, ${p.y})`);
        });
      }
      return lines.join("\n");
    }

    default:
      return "";
  }
}

export function blocksToText(blocks: Block[]): string {
  return blocks.map(blockToText).join("\n");
}

export function correctAnswerOf(q: Question, key: AnswerMap): Answer | undefined {
  return key[String(q.id)];
}

export interface ScoreSummary {
  total: number;
  correct: number;
  wrong: number;
  rate: number; // 0 - 100
  wrongIndexes: number[]; // 0-based
}

export function calcScore(
  questions: Question[],
  userAnswers: UserAnswers,
  key: AnswerMap
): ScoreSummary {
  const total = questions.length;
  const wrongIndexes: number[] = [];
  let correct = 0;

  questions.forEach((q, i) => {
    const right = correctAnswerOf(q, key);
    if (right !== undefined && userAnswers[i] === right) {
      correct += 1;
    } else {
      wrongIndexes.push(i);
    }
  });

  return {
    total,
    correct,
    wrong: total - correct,
    rate: total === 0 ? 0 : Math.round((correct / total) * 1000) / 10,
    wrongIndexes,
  };
}

export function buildReport(
  questions: Question[],
  userAnswers: UserAnswers,
  key: AnswerMap
): string {
  const s = calcScore(questions, userAnswers, key);
  const lines: string[] = [];

  lines.push("以下是我的本次刷題結果，請針對錯題進行詳解與弱點分析。");
  lines.push("");
  lines.push(`總題數：${s.total}`);
  lines.push(`答對：${s.correct}`);
  lines.push(`答錯：${s.wrong}`);
  lines.push(`正確率：${s.rate}%`);
  lines.push("");
  lines.push("錯題：");
  lines.push("");

  if (s.wrongIndexes.length === 0) {
    lines.push("（本次全部答對，沒有錯題）");
    lines.push("");
  } else {
    s.wrongIndexes.forEach((i) => {
      const q = questions[i];
      lines.push(`【第${i + 1}題】`);
      lines.push(`科目：${q.subject ?? ""}`);
      lines.push(`單元：${q.unit ?? ""}`);
      lines.push("題目：");
      lines.push(blocksToText(q.content));
      lines.push("選項：");
      lines.push(`A. ${q.options.A}`);
      lines.push(`B. ${q.options.B}`);
      lines.push(`C. ${q.options.C}`);
      lines.push(`D. ${q.options.D}`);
      lines.push(`我的答案：${userAnswers[i] ?? "未作答"}`);
      lines.push(`正確答案：${correctAnswerOf(q, key) ?? ""}`);
      lines.push("");
    });
  }

  lines.push("請：");
  lines.push("1. 逐題解釋錯誤原因");
  lines.push("2. 說明正確觀念");
  lines.push("3. 分析我的知識弱點");
  lines.push("4. 告訴我哪些單元需要加強");

  return lines.join("\n");
}
