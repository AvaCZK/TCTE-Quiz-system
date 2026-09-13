/** GitHub Pages 會把站台放在 /<倉庫名>/ 底下，靜態資源要自己加上 basePath */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}

/**
 * 三個頁面的背景圖。
 * 檔案放在 public/image/，網址就是 /image/xxx.jpg。
 */
export const BACKGROUNDS = {
  home: asset("/image/home.jpg"),
  quiz: asset("/image/quiz.jpg"),
  result: asset("/image/result.jpg"),
};
