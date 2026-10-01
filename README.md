# StudyHub｜AI 高中生學習平台

專為高中生與學測生設計的學習工作台，聚焦於錯題整理、閱讀理解、弱點分析、知識複習與升學探索。

## 主要功能

- 今日學習摘要與可新增、完成、編輯、刪除的每日任務
- 可新增、編輯、刪除、搜尋及收藏的 AI 錯題本
- 國文與英文閱讀助手，國文涵蓋 108 課綱核心古文十五篇辨識與考點整理
- 科目熟悉程度分析與 GitHub 風格學習熱力圖
- 87 個學測公式：數學第 1、2、3A、4A 冊、既有物理筆記與學測化學，支援冊別篩選、搜尋與收藏
- 大學科系搜尋與升學探索
- 全站搜尋、我的收藏及深色模式
- 桌機、平板與手機響應式設計
- 鍵盤操作、焦點樣式與 ARIA 無障礙支援

## 核心檔案

### 化學鍵與分子結構筆記

`public/studyhub/chemistry-notes/` 提供零基礎預備課、2-1～2-6 詳解、逐步例題與 32 題解析測驗，支援搜尋、閱讀進度、Google 跨裝置同步、深色模式與列印。原始掃描教材不隨網站發布。

修改 `content.mjs` 後，執行 `node public/studyhub/chemistry-notes/build.mjs` 重新產生靜態 HTML；`app.js` 提供互動。GitHub Pages 會隨主站一起部署此目錄。

```text
public/studyhub/
├── index.html       # 頁面結構
├── style.css        # 視覺、動畫、深色模式與響應式設計
├── formula-data.js  # 數學與物理公式資料
├── classics-data.js # 核心古文十五篇資料
└── script.js        # 互動、搜尋、分析與 localStorage
```

`app/page.tsx` 提供部署環境的入口，並載入 StudyHub 前端介面。

## 本機執行

需求：Node.js 22.13 或更新版本。

```bash
pnpm install
pnpm dev
```

正式建置與測試：

```bash
pnpm build
pnpm test
```

## 資料儲存與修改

目前使用瀏覽器 `localStorage` 儲存：

- 錯題與上傳圖片
- 收藏內容
- 科目自評分數
- 學習熱力圖紀錄
- 深色模式偏好

個人進度預設為空白。學習天數、今日時數、熱力圖、自評與錯題數量，
都只會依李同學實際輸入的資料計算，不使用示範數值推估。

數學與物理公式集中在 `public/studyhub/formula-data.js`；化學、科系、知識卡與示範資料集中在
`public/studyhub/script.js` 的 `this.seed`。日後可將 `Store` 類別替換成
OpenAI API、Firebase 或 Supabase 的資料存取層，不需重寫畫面結構。

## 線上版本

[開啟 GitHub Pages 版 StudyHub](https://jimmy980821-ops.github.io/studyhub-ai-learning-platform/)

化學筆記同步沿用主站 Firebase Google 登入與 `users/{uid}/studyhub/state` 文件的獨立 `chemistryV1` 欄位。章節與題目各自保留版本及清除記錄，離線變更存於帳號分隔的本機佇列，恢復連線後重試；主站寫入僅更新自己的欄位，避免蓋掉筆記進度。
