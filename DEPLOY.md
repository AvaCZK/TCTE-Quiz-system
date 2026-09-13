# 部署到 GitHub Pages

整包已經設定好了，照著做就會上線。全程免費、不需要伺服器。

---

## 0. 先在本機確認建得起來（強烈建議）

```bash
npm run build
```

跑完後資料夾裡應該出現 `out/`，裡面有 `index.html`、`quiz/`、`result/`、`_next/`、`image/`。
有出現就代表沒問題，可以往下走。如果這步失敗，先修好再推上去，
不然 GitHub 上會跑一樣的錯。

建完的 `out/` 不用管，`.gitignore` 已經排除它。

---

## 1. 建立 Git 倉庫並推上 GitHub

先到 GitHub 開一個新的空倉庫（**不要**勾 Add README / .gitignore / license），
名字例如 `tcte-quiz`。

然後在專案資料夾裡：

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<你的帳號>/tcte-quiz.git
git push -u origin main
```

---

## 2. 把 Pages 的來源設成 GitHub Actions

倉庫頁面 → **Settings** → 左邊 **Pages** →
**Build and deployment** → **Source** 選 **GitHub Actions**（不是選分支）。

---

## 3. 等它跑完

倉庫上方的 **Actions** 分頁會看到「Deploy to GitHub Pages」在跑，
大約 1～2 分鐘，出現綠色勾勾就完成了。

網址是：

```
https://<你的帳號>.github.io/tcte-quiz/
```

用 iPad Safari 打開，按分享 →「加入主畫面」，就能像 App 一樣全螢幕使用。

---

## 之後要更新

改完檔案後：

```bash
git add .
git commit -m "更新"
git push
```

推上去就會自動重新部署，不用做別的事。

---

## 常見問題

**網址打開是 404**
Pages 的 Source 沒設成 GitHub Actions，或第一次部署還沒跑完。

**畫面跑出來但沒有樣式、圖片破圖**
表示 `basePath` 不對。workflow 會自動帶入倉庫名，正常不會發生；
若你把倉庫改名了，重新 push 一次讓它重跑即可。
倉庫名如果就叫 `<你的帳號>.github.io`，basePath 會自動是空字串，也不用改。

**Actions 失敗，訊息是 Get Pages site failed**
Pages 還沒啟用。照步驟 2 設定一次，再到 Actions 點 **Re-run jobs**。

**題目資料會不會被別人看到**
會。Pages 是公開網站，原始碼和 `public/` 裡的檔案都看得到。
但正確答案是編碼過的（Answer Payload Protocol v1），肉眼讀不出來。
`public/sample-questions.json` 是範例題組，不想公開可以刪掉。

**背景圖太大載入慢**
`public/image/` 三張圖合計約 5.7 MB，第一次開會等一下。
想加速的話把圖縮到寬度 2560 以內、重新壓成 JPG，通常可以降到十分之一。
