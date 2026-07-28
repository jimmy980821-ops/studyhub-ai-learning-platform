# StudyHub 免費 AI Worker

此 Worker 使用 Cloudflare Workers AI 的免費每日額度，為 GitHub Pages 上的閱讀助手提供分析。

- Worker：`studyhub-ai-api`
- 模型：`@cf/qwen/qwen3-30b-a3b-fp8`
- AI Binding：`AI`
- API：`POST /analyze`
- 前端來源限制：`https://jimmy980821-ops.github.io`

部署：

```powershell
npx wrangler deploy --config cloudflare-worker/wrangler.jsonc
```

不需要 OpenAI API Key。免費額度用完時，API 會失敗，前端會自動改用本機分析。
