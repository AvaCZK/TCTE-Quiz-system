// GitHub Pages 部署說明：
// 若倉庫是 https://<帳號>.github.io/<倉庫名>/，basePath 必須是 "/<倉庫名>"。
// GitHub Actions 會自動帶入 NEXT_PUBLIC_BASE_PATH，本機開發則為空字串。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 輸出純靜態檔案（out/），不需要 backend
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
