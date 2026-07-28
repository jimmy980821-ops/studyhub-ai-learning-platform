# StudyHub 免費 AI 與同步 Worker

此 Worker 使用 Cloudflare Workers AI 的免費每日額度，為 GitHub Pages 上的閱讀助手提供分析；並使用 D1 儲存瀏覽器端已加密的跨裝置同步資料。

- Worker：`studyhub-ai-api`
- 模型：`@cf/qwen/qwen3-30b-a3b-fp8`
- AI Binding：`AI`
- D1 Binding：`DB`（`studyhub-sync`）
- 閱讀 API：`POST /analyze`
- 同步 API：`GET /sync/:id`、`PUT /sync/:id`
- 前端來源限制：`https://jimmy980821-ops.github.io`

部署：

```powershell
npx wrangler deploy --config cloudflare-worker/wrangler.jsonc
```

不需要 OpenAI API Key。免費額度用完時，API 會失敗，前端會自動改用本機分析。

首次部署同步資料庫：

```powershell
npx wrangler d1 migrations apply studyhub-sync --remote --config cloudflare-worker/wrangler.jsonc
```

同步內容會先在使用者瀏覽器以 AES-GCM 加密，Worker 與 D1 不保存明文學習資料或私人同步碼。
