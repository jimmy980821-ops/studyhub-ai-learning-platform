import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the StudyHub shell and metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>StudyHub｜AI 高中生學習平台<\/title>/);
  assert.match(html, /studyhub\/index\.html/);
  assert.match(html, /studyhub-og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("bundles the complete StudyHub local-first application", async () => {
  const [html, css, script, manifest] = await Promise.all([
    readFile(new URL("../public/studyhub/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/studyhub/style.css", import.meta.url), "utf8"),
    readFile(new URL("../public/studyhub/script.js", import.meta.url), "utf8"),
    readFile(new URL("../public/site.webmanifest", import.meta.url), "utf8"),
  ]);

  for (const feature of ["AI 錯題本", "AI 閱讀助手", "學習分析", "學習熱力圖", "知識中心", "升學探索", "我的收藏"]) {
    assert.match(html, new RegExp(feature));
  }
  assert.match(script, /class Store/);
  assert.match(script, /localStorage/);
  assert.match(script, /saveMistake/);
  assert.match(script, /renderGlobalSearch/);
  assert.match(script, /toggleTheme/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.equal(JSON.parse(manifest).short_name, "StudyHub");
});
