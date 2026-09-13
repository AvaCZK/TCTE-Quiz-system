import type { Metadata, Viewport } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "TCTE QUIZ",
  description: "貼上 JSON 題目，在 iPad 上作答，錯題帶回 GPT 分析",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#04060f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
