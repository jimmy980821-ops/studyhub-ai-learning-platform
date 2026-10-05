# 酸鹼反應筆記

入口：`public/studyhub/acid-base-notes/`，StudyHub 首頁與側欄均有連結。

## 教學範圍

兩堂預備課（濃度與反應量、平衡與對數），六個酸鹼主題（命名、學說、解離、鹽類、緩衝、滴定）。解離單元分為四節，共 11 節、70 題自編練習。

2026-10-05 依使用者提供的《書籍 2026年10月5日.pdf》15 頁掃描更新。逐頁閱讀對照：PDF 1～4 為講義 p.82～85、5～7 為 p.87～89、8～10 為 p.93～95、11～12 為 p.97～98、13～15 為 p.100～102。以此版 2-1～2-3 為準；未提供頁與 2-4～2-6 延伸內容在網站明列。沒有公開上傳掃描圖片。

`content.mjs` 維護原正文與題庫；`textbook-supplement.mjs` 增補講義對照、詳細推導、題型及 30 題。執行 `node public/studyhub/acid-base-notes/build.mjs` 產生完整靜態 HTML。無 JavaScript 仍能閱讀與查答案。修改正文後須重新產生 HTML。

## 演示

`labs.mjs` 提供 pH 對數尺、緩衝計量、強／弱酸滴定、解離率與稀釋共四個演示。假設 25°C 理想溶液，滴定以物料守恆與電荷平衡在 log[H⁺] 空間二分求解，涵蓋水自解離。播放由使用者啟動，可暫停，離開頁籤自動停止。解離率演示在 C=10⁻⁵～1 M、Ka=1.8×10⁻⁵ 範圍用二次式，另提示平方根近似是否符合 5% 判準。

## 進度

沿用既有 Google Firebase 同步控制器與公開專案設定。文件 `users/{uid}/studyhub/state` 中只寫入 `chemistryAcidBaseV1` 欄位；保留主站 `data`、化學鍵 `chemistryV1` 與物理 `physicsWavesV1`。本機快取使用 `acid-base-sync:*`。章節勾選、測驗答案及重設皆同步；演示滑桿與佈景不納入雲端。

原 8 個章節 ID 與 1～40 題保持不變；新增章節 ID 為 `ionization`、`common-ion`、`polyprotic`，新題號為 41～70。不要重新編排題號，否則既有答案會指向不同題。`tests/fixtures/acid-base-original-questions.json` 是 b1d9f6a 版原題快照，用於防止舊答案錯位。

## 驗證

- `node --test tests/acid-base-models.test.mjs tests/acid-base-sync.test.mjs`
- `node tests/acid-base-browser.mjs`（Playwright；可用 `PLAYWRIGHT_MODULE` 指定模組、`BROWSER_CHANNEL` 指定瀏覽器）

瀏覽器測試涵蓋 70 題、搜尋、列印、深色模式、320/390px、無 JS、演示、圖示與兩個獨立瀏覽器的新舊記錄同步／離線重設。測試使用模擬 Firebase SDK 執行真實 adapter，不操作使用者 Google 帳戶，也不代表已自動驗證真實帳戶授權流程。
