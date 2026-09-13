// 最小型別宣告，避免不同 katex 版本的型別差異造成編譯失敗
declare module "katex" {
  interface KatexOptions {
    displayMode?: boolean;
    throwOnError?: boolean;
    errorColor?: string;
    output?: "html" | "mathml" | "htmlAndMathml";
    macros?: Record<string, string>;
    strict?: boolean | string;
    trust?: boolean;
  }

  const katex: {
    renderToString(expression: string, options?: KatexOptions): string;
    render(expression: string, element: HTMLElement, options?: KatexOptions): void;
  };

  export default katex;
}

declare module "katex/dist/katex.min.css";
