# TCTE QUIZ

統測商管群的刷題網站。深色星空主題，為 iPad 設計。

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

## 快速開始

需要 Node.js 18 以上。

```bash
npm install      # 只需要跑一次
npm run dev
```

打開 http://localhost:3000 。

用 iPad 開（iPad 和電腦要在同一個 Wi-Fi）：

```bash
npm run dev -- -H 0.0.0.0
```

查電腦 IP（Mac `ipconfig getifaddr en0`／Windows `ipconfig` 看 IPv4），
iPad Safari 開 `http://192.168.x.x:3000`。

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

GPT 沒辦法自己算 DEFLATE，所以分兩步：**先讓 GPT 出含答案的草稿，再用工具轉檔。**

### 1. 讓 GPT 產生草稿

```
請幫我出 20 題統測商管群單選題，科目：經濟學，單元：供給與需求。
直接輸出一個 JSON 物件，不要有任何說明文字、不要用 markdown code block。

格式：
{
  "title": "經濟學 - 供給與需求",
  "questions": [
    {
      "id": 1,
      "subject": "經濟學",
      "unit": "供給與需求",
      "content": [ Block ],
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "answer": "A"
    }
  ]
}

Block 只能是以下四種：
{ "type": "text", "text": "..." }
{ "type": "table", "headers": ["..."], "rows": [["...", 數字]] }
{ "type": "latex", "formula": "LaTeX 語法，反斜線要跳脫成 \\\\" }
{ "type": "econ_graph", "title": "...", "xLabel": "...", "yLabel": "...",
  "curves": [{ "name": "D", "points": [{"x":0,"y":10},{"x":10,"y":0}] }],
  "points": [{ "name": "E", "x": 5, "y": 5 }] }
```

### 2. 轉成正式題組

存成 `draft.json`，然後：

```bash
npm run encode -- draft.json --seed=my-seed --out=set.json
```

`set.json` 裡的 `answer` 會被拿掉，正確答案改放到最外層的 `validation`。
把 `set.json` 的內容貼進網站就可以了。

如果你的 GPT 可以執行 Python，也能請它直接算 payload：

```python
import json, zlib, base64
answers = {"1": "C", "2": "A"}
seed = "my-seed"
raw = zlib.compressobj(9, zlib.DEFLATED, -15)          # -15 = raw deflate
comp = raw.compress(json.dumps(answers, separators=(",", ":")).encode()) + raw.flush()
key = seed.encode()
xored = bytes(b ^ key[i % len(key)] for i, b in enumerate(comp))
print(base64.b64encode(xored).decode())
```

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

## 背景圖與外觀

三張背景圖放在 `public/image/`：

| 檔案 | 用在哪 |
| --- | --- |
| `public/image/home.jpg` | 匯入題目頁 |
| `public/image/quiz.jpg` | 作答頁 |
| `public/image/result.jpg` | 結果頁 |

換成自己的圖就直接用同檔名覆蓋。沒有圖也不會破版，只會看到純 CSS 的星空動畫。

太空照常常上半部是一大片黑，看起來像沒鋪滿。`src/app/globals.css` 開頭有一個旋鈕：

```css
--bg-zoom: 1;    /* 1 = 顯示完整照片
                    調大（例如 1.18）= 以底邊為基準放大，把上方的黑天空裁掉 */
```

背景層刻意做得比視窗大一圈，所以不管怎麼縮放都不會露出沒鋪到的邊。
壓暗的程度改 `.page-bg-veil` 裡的 `rgba(4, 6, 15, 0.xx)`，數字越小越亮。

## 部署

`npm run build` 會產生純靜態的 `out/`，丟哪裡都行。

GitHub Pages 的自動部署已經設定好了，詳細步驟看 **[DEPLOY.md](./DEPLOY.md)**。

## 專案結構

```
.github/workflows/deploy.yml   push 到 main 自動部署 GitHub Pages
scripts/encode-answers.mjs     草稿 → 正式題組（產生 validation）
src/app/
  layout.tsx        共用版面（載入 KaTeX CSS）
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
  image/            home.jpg / quiz.jpg / result.jpg
  sample-questions.json
  .nojekyll
```

## 技術

Next.js 14（App Router，靜態匯出）、TypeScript、Tailwind CSS、KaTeX、fflate、Vitest。
