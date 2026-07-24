import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the physics notebook shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>學測物理學習筆記<\/title>/);
  assert.match(html, /gsat_physics_review\.html/);
  assert.match(html, /physics-icon\.png/);
  assert.match(html, /apple-touch-icon/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("bundles the complete study system and iOS metadata", async () => {
  const [physics, theme, manifest] = await Promise.all([
    readFile(new URL("../public/gsat_physics_review.html", import.meta.url), "utf8"),
    readFile(new URL("../public/physics-theme.css", import.meta.url), "utf8"),
    readFile(new URL("../public/site.webmanifest", import.meta.url), "utf8"),
  ]);

  for (const feature of [
    "物理核心總整理",
    "互動物理實驗室",
    "知識節點分級題庫",
    "歷屆試題練習",
    "錯題本",
  ]) {
    assert.match(physics, new RegExp(feature));
  }

  assert.match(physics, /rel="apple-touch-icon"/);
  assert.match(physics, /physics-theme\.css/);
  assert.match(physics, /function showExamsForNode\(nodeId\)/);
  assert.match(physics, /onclick="showExamsForNode\('\$\{nodeId\}'\)"/);
  assert.match(physics, /interaction-compat\.js\?v=5/);
  const compatibilityScript = await readFile(new URL("../public/interaction-compat.js", import.meta.url), "utf8");
  assert.match(compatibilityScript, /a\[onclick\]:not\(\[href\]\)/);
  assert.match(theme, /--paper:\s*#fbfaf5/);
  assert.equal(JSON.parse(manifest).short_name, "物理筆記");
});
