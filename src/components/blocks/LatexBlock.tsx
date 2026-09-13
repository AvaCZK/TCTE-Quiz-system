"use client";

import katex from "katex";
import { useMemo } from "react";
import { LatexBlock as LatexBlockType } from "@/lib/types";

export default function LatexBlock({ block }: { block: LatexBlockType }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(block.formula, {
        displayMode: true,
        throwOnError: false,
        output: "html",
      });
    } catch {
      return `<code>${block.formula}</code>`;
    }
  }, [block.formula]);

  return (
    <div
      className="overflow-x-auto py-2 text-2xl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
