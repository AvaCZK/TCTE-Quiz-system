# TCTE QUIZ

> 此網站使用 Claude Code Opus 5 輔助開發。

單選題刷題網站。深色星空主題，為 iPad 設計。

科目和單元都寫在題目 JSON 裡，網站本身不綁任何科目 — 只要照格式給題目，任何科目都能用。

沒有登入、沒有帳號、沒有後端、沒有資料庫。整個站是一包靜態檔案，
作答紀錄只存在你自己的瀏覽器裡。

## 這個站在幹嘛

```
GPT 出題  →  貼上 JSON  →  在網站作答  →  送出
                                            ↓
        GPT 詳解與弱點分析  ←  複製分析資料（只含錯題）
```

重點是最後那一步：結果頁的「複製分析資料」會把錯題整理成一段文字，
直接貼回 GPT 就能拿到逐題詳解和弱點分析。網站本身不產生解析。

**題目 JSON 裡不會出現答案。** 正確答案經過編碼放在最外層的 `validation` 欄位，
所以你把題目貼來貼去的時候，不會不小心瞄到答案。

## 支援環境

| 環境 | 狀態 |
| --- | --- |
| Chromium 系瀏覽器（Chrome、Edge 等），1K／2K 解析度 | 支援 |
| iPad Pro 11 吋，Safari | 支援 |
| 其他解析度或瀏覽器 | 不保證提供技術支援 |

## 快速開始

### 方法一：直接開網站（推薦）

```
https://avaczk.github.io/TCTE-Quiz-system/
```

什麼都不用裝。iPad Safari 開啟後，按分享 →「加入主畫面」，
就會在主畫面出現 App 圖示，點開是全螢幕，用起來跟原生 App 一樣。

### 方法二：本地部署

需要 Node.js 18 以上。

```bash
npm install      # 只需要跑一次
npm run dev
```

打開 http://localhost:3000 。

想用 iPad 連本機的話（iPad 和電腦要在同一個 Wi-Fi）：

```bash
npm run dev -- -H 0.0.0.0
```

查電腦 IP（Mac `ipconfig getifaddr en0`／Windows `ipconfig` 看 IPv4），
iPad Safari 開 `http://192.168.x.x:3000`。

---

第一次試用：把 `public/sample-questions.json` 的內容整份複製貼進首頁的框框，
按「驗證題目格式」→「開始作答」。那份範例有 5 題，四種 block 都用到了。

## 三個頁面

| 路徑 | 做什麼 |
| --- | --- |
| `/` | 匯入題目。貼上 JSON 或選 `.json` 檔 → 驗證格式與答案 → 顯示成功匯入幾題 |
| `/quiz` | 作答。一次一題、A/B/C/D、上下題、進度條、題號快速跳轉，全部答完才能送出 |
| `/result` | 結果。正確率／答對／答錯／錯誤題號、查看錯題、**複製分析資料** |

作答過程中不會顯示答案，送出後才判分。

## 題組 JSON 格式

```jsonc
{
  "version": "1.0",
  "title": "第一單元綜合練習",
  "questions": [
    {
      "id": 1,                 // 必填，答案靠 id 對應；數字或字串都可以，不能重複
      "subject": "經濟學",      // 可省略
      "unit": "1-4 經濟資源的配置", // 可省略
      "content": [ /* Block[] */ ],
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." }
      // 這裡不能出現 answer / correctAnswer / solution，會被擋下來
    }
  ],
  "validation": {
    "version": "1",
    "algorithm": "deflate-raw+xor-seed+base64",
    "seed": "任意字串，不可為空",
    "payload": "Base64..."
  }
}
```

### Block 種類

題目內容由 block 組成，支援四種：

```jsonc
// 純文字
{ "type": "text", "text": "題目敘述..." }

// 表格
{ "type": "table",
  "headers": ["項目", "金額"],
  "rows": [["資產", 850000], ["負債", 320000]] }

// 數學公式（KaTeX）
{ "type": "latex", "formula": "E_d = \\left| \\frac{\\Delta Q / Q}{\\Delta P / P} \\right|" }

// 經濟學圖形（SVG 繪製，支援多曲線與均衡點）
{ "type": "econ_graph",
  "title": "需求增加對均衡的影響",
  "xLabel": "數量 Q",
  "yLabel": "價格 P",
  "curves": [
    { "name": "S",  "points": [{ "x": 0, "y": 1 }, { "x": 10, "y": 9 }] },
    { "name": "D1", "points": [{ "x": 0, "y": 9 }, { "x": 9,  "y": 1 }] },
    { "name": "D2", "points": [{ "x": 2, "y": 10 }, { "x": 11, "y": 2 }] }
  ],
  "points": [{ "name": "E1", "x": 4.5, "y": 4.6 }] }
```

## 怎麼出題

兩種做法。**如果你的 GPT 可以執行 Python（ChatGPT 的資料分析／Code Interpreter），
用方法一就好** — 它會自己把答案編碼完成，輸出可以直接貼進網站的完整 JSON。

### 方法一：請 GPT 直接產生完整題組（推薦）

把下面這段整個貼給 GPT，科目、單元、題數自己換：

```
請幫我出 20 題單選題，科目：經濟學，單元：供給與需求。

輸出一個 JSON 物件，直接給我 JSON 本體，不要任何說明文字、不要用 markdown code block。

結構：
{
  "version": "1.0.0",
  "title": "題組名稱",
  "questions": [
    {
      "id": 1,
      "subject": "科目名稱",
      "unit": "單元名稱",
      "content": [ Block ],
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." }
    }
  ],
  "validation": { ... 見第 4 點 ... }
}

規則：

1. questions 裡絕對不能出現 answer、correctAnswer、solution 等任何會洩漏答案的欄位。
2. id 必填，不可重複。
3. content 的 Block 只能是以下四種：
   { "type": "text", "text": "..." }
   { "type": "table", "headers": ["..."], "rows": [["...", 數字]] }
   { "type": "latex", "formula": "LaTeX 語法，反斜線要跳脫成 \\\\" }
   { "type": "econ_graph", "title": "...", "xLabel": "...", "yLabel": "...",
     "curves": [{ "name": "D", "points": [{"x":0,"y":10},{"x":10,"y":0}] }],
     "points": [{ "name": "E", "x": 5, "y": 5 }] }
4. 正確答案放在最外層的 validation。請「實際執行」下面這段 Python 算出結果，
   不要自己推測輸出：

   import json, zlib, base64, secrets
   answers = {"1": "C", "2": "A"}     # 換成你出的題目的答案，key 是 id 轉成字串
   seed = secrets.token_urlsafe(9)
   co = zlib.compressobj(9, zlib.DEFLATED, -15)   # -15 = raw deflate，不是 gzip
   comp = co.compress(json.dumps(answers, separators=(",", ":")).encode()) + co.flush()
   key = seed.encode()
   xored = bytes(b ^ key[i % len(key)] for i, b in enumerate(comp))
   print(seed, base64.b64encode(xored).decode())

   然後填進去：
   "validation": {
     "version": "1",
     "algorithm": "deflate-raw+xor-seed+base64",
     "seed": "<印出來的 seed>",
     "payload": "<印出來的 base64>"
   }
```

拿到 JSON 之後直接貼進網站首頁，按「驗證題目格式」。
如果 payload 算錯了，網站會擋下來並顯示「題目答案資料損毀或格式不相容」，
不會讓你帶著壞掉的答案開始作答。

### 方法二：GPT 只出草稿，本機轉檔

GPT 不能執行程式碼的話，就讓它照方法一的格式出題，但**每題直接寫 `answer`、
不要 validation**，存成 `draft.json`，然後：

```bash
npm run encode -- draft.json --seed=my-seed --out=set.json
```

`set.json` 裡的 `answer` 會被拿掉，正確答案改放到最外層的 `validation`。
把 `set.json` 的內容貼進網站即可。

`--seed` 可以省略，會自動產生一組隨機的。

## Answer Payload Protocol v1

實作在 `src/lib/answerPayload.ts`，用 [fflate](https://github.com/101arrowz/fflate) 處理 raw DEFLATE。

**編碼**

1. 答案物件 `{ "1": "C", "2": "A" }`（key = `String(question.id)`）→ `JSON.stringify`
2. UTF-8 編碼
3. raw DEFLATE 壓縮（不是 gzip，也不是帶 zlib header 的 deflate）
4. seed 轉 UTF-8 bytes 當 key
5. repeating-key XOR：`result[i] = compressed[i] ^ key[i % key.length]`
6. Base64 → `validation.payload`

**解碼**：完全反過來。

```ts
import { encodeAnswerPayload, decodeAnswerPayload } from "@/lib/answerPayload";

const validation = encodeAnswerPayload({ "1": "C", "2": "A" }, "my-seed");
const answers = decodeAnswerPayload(validation); // { "1": "C", "2": "A" }
```

**這不是加密**，只是避免答案被肉眼直接讀到。有心人打開 devtools 就解得出來。

匯入時會自動跑完整檢查：解碼 → 每個 `question.id` 都要有答案 → 答案只能是 A/B/C/D。
任何一關沒過都顯示「題目答案資料損毀或格式不相容」。

解碼後的答案只放在記憶體（`src/lib/answerStore.ts`），**不會寫進 localStorage**，
也不會出現在畫面或 console。重新整理的話會從存下來的 `validation.payload` 重新解碼一次。

## 測試

```bash
npm test
```

`src/lib/answerPayload.test.ts` 涵蓋：

- round-trip：1／20／50 題、數字 id、字串 id、中文 seed
- 錯誤處理：無效 Base64、空 seed、錯誤 seed、payload 損毀、version／algorithm 不符
- 匯入流程：缺少某題答案、題目含 `answer` 欄位、id 重複、缺少 `validation`

## 部署

`npm run build` 會產生純靜態的 `out/`，丟哪裡都行。

GitHub Pages 的自動部署已經設定好了，詳細步驟看 **[DEPLOY.md](./DEPLOY.md)**。

## 專案結構

```
.github/workflows/deploy.yml   push 到 main 自動部署 GitHub Pages
scripts/encode-answers.mjs     草稿 → 正式題組（產生 validation）
src/app/
  layout.tsx        共用版面、主畫面圖示與全螢幕設定
  globals.css       深色星空主題、星點／流星／星雲動畫
  page.tsx          匯入題目頁
  quiz/page.tsx     作答頁
  result/page.tsx   結果頁
src/components/
  Starfield.tsx     純 CSS 星空特效
  PageBackground.tsx 背景圖 + 遮罩 + 星空
  blocks/           BlockRenderer / Text / Table / Latex / EconGraph
src/lib/
  answerPayload.ts  Answer Payload Protocol v1（encode / decode）
  answerStore.ts    解碼後的答案只放記憶體
  types.ts          Question / Block / QuestionSet 型別
  validate.ts       題組 JSON 驗證
  storage.ts        localStorage（題目、validation、使用者作答）
  report.ts         計分 + 產生貼回 GPT 的分析文字
  asset.ts          basePath 處理
public/
  image/
    icon.png        加入主畫面後顯示的 App 圖示（180×180）
    home.jpg        匯入題目頁背景
    quiz.jpg        作答頁背景
    result.jpg      結果頁背景
  sample-questions.json
  .nojekyll
```

## 技術

Next.js 14（App Router，靜態匯出）、TypeScript、Tailwind CSS、KaTeX、fflate、Vitest。
