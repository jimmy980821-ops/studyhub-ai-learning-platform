# StudyHub｜AI 高中生學習平台

專為高中生與學測生設計的學習工作台，聚焦於錯題整理、閱讀理解、弱點分析、知識複習與升學探索。

## 主要功能

- 今日學習摘要與 Dashboard
- 可新增、編輯、刪除、搜尋及收藏的 AI 錯題本
- 國文與英文閱讀助手示範介面
- 科目熟悉程度分析與 GitHub 風格學習熱力圖
- 59 個高中數學、物理、化學公式，支援搜尋與收藏
- 大學科系搜尋與升學探索
- 全站搜尋、我的收藏及深色模式
- 桌機、平板與手機響應式設計
- 鍵盤操作、焦點樣式與 ARIA 無障礙支援

## 核心檔案

```text
public/studyhub/
├── index.html   # 頁面結構
├── style.css    # 視覺、動畫、深色模式與響應式設計
└── script.js    # 資料、互動、搜尋、分析與 localStorage
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

公式、科系、知識卡與示範資料集中在
`public/studyhub/script.js` 的 `this.seed`。日後可將 `Store` 類別替換成
OpenAI API、Firebase 或 Supabase 的資料存取層，不需重寫畫面結構。

## 線上版本

[開啟 GitHub Pages 版 StudyHub](https://jimmy980821-ops.github.io/studyhub-ai-learning-platform/)
