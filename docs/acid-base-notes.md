# 酸鹼反應筆記

入口：`public/studyhub/acid-base-notes/`，StudyHub 首頁與側欄均有連結。

## 教學範圍

兩堂預備課（濃度與反應量、平衡與對數），六個酸鹼主題（命名、學說、解離、鹽類、緩衝、滴定），共 40 題自編練習。各年度翰林節次不同，以主題名稱對照。原創內容，未重製課本頁面；來源列於網頁底部。

`content.mjs` 維護正文與題庫；執行 `node public/studyhub/acid-base-notes/build.mjs` 產生完整靜態 HTML。無 JavaScript 仍能閱讀與查答案。修改正文後須重新產生 HTML。

## 演示

`labs.mjs` 提供 pH 對數尺、緩衝計量、強／弱酸滴定。假設 25°C 理想溶液，滴定以物料守恆與電荷平衡在 log[H⁺] 空間二分求解，涵蓋水自解離。播放由使用者啟動，可暫停，離開頁籤自動停止。

## 進度

沿用既有 Google Firebase 同步控制器與公開專案設定。文件 `users/{uid}/studyhub/state` 中只寫入 `chemistryAcidBaseV1` 欄位；保留主站 `data`、化學鍵 `chemistryV1` 與物理 `physicsWavesV1`。本機快取使用 `acid-base-sync:*`。章節勾選、測驗答案及重設皆同步；演示滑桿與佈景不納入雲端。

## 驗證

- `node --test tests/acid-base-models.test.mjs tests/acid-base-sync.test.mjs`
- `node tests/acid-base-browser.mjs`（Playwright；可用 `PLAYWRIGHT_MODULE` 指定模組、`BROWSER_CHANNEL` 指定瀏覽器）

瀏覽器測試涵蓋 40 題、搜尋、列印、深色模式、320/390px、無 JS、演示、圖示與兩個獨立瀏覽器的同步／離線重設。測試使用模擬 Firebase SDK 執行真實 adapter，不操作使用者 Google 帳戶，也不代表已自動驗證真實帳戶授權流程。
