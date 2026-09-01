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
  assert.match(html, /studyhub-og-v2\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("bundles the complete StudyHub local-first application", async () => {
  const [html, css, script, formulas, classics, manifest] = await Promise.all([
    readFile(new URL("../public/studyhub/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/studyhub/style.css", import.meta.url), "utf8"),
    readFile(new URL("../public/studyhub/script.js", import.meta.url), "utf8"),
    readFile(new URL("../public/studyhub/formula-data.js", import.meta.url), "utf8"),
    readFile(new URL("../public/studyhub/classics-data.js", import.meta.url), "utf8"),
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
  assert.match(html, /李同學/);
  assert.doesNotMatch(html, /林同學|本週目標的 68%|2h 35m/);
  assert.match(script, /mistakes-v2/);
  assert.match(script, /heat-v2/);
  assert.match(script, /tasks-v1/);
  assert.match(script, /renderTasks/);
  assert.match(html, /id="taskForm"/);
  assert.match(html, /id="todayTaskStat"/);
  assert.match(html, /data-page="pomodoro"/);
  assert.match(html, /id="pomodoroTime"/);
  assert.match(html, /番茄鐘/);
  assert.match(script, /POMODORO_DURATIONS/);
  assert.match(script, /pomodoro-v1/);
  assert.match(script, /focus-minutes-v1/);
  assert.match(script, /completePomodoro/);
  assert.match(script, /getStudyMinutes/);
  assert.match(css, /\.pomodoro-layout/);
  assert.match(script, /尚未評分/);
  assert.match(html, /formulaVolume/);
  assert.match(html, /formulaUnit/);
  for (const unit of ["數與式", "指數", "對數", "多項式函數", "直線與圓", "數列與級數", "數據分析", "排列組合與機率", "三角比"]) {
    assert.match(html, new RegExp(unit));
    assert.ok((formulas.match(new RegExp(`"${unit}"`, "g")) ?? []).length >= 5, `${unit} 應至少有 5 個公式`);
  }
  assert.match(script, /item\.unit === unit/);
  assert.doesNotMatch(html, /公式符號|symbol-guide/);
  assert.match(script, /formulaCatalog/);
  assert.match(script, /analyzeChinese/);
  assert.match(script, /classicFifteen/);
  assert.match(script, /detectClassic/);
  assert.match(html, /古文十五篇/);
  assert.match(html, /classicSelect/);
  assert.equal((classics.match(/classic\("c\d{2}"/g) ?? []).length, 15);
  for (const title of ["燭之武退秦師","大同與小康","諫逐客書","鴻門宴","出師表","桃花源記","師說","虯髯客傳","赤壁賦","項脊軒志","晚遊六橋待月記","勞山道士","勸和論","鹿港乘桴記","畫菊自序"]) {
    assert.match(classics, new RegExp(title));
  }
  assert.match(script, /開張聖聽/);
  assert.match(script, /廣泛地聽取臣下的意見/);
  assert.match(script, /學而時習之/);
  assert.match(script, /這段文字本身已接近現代白話/);
  assert.doesNotMatch(script, /目前本機字詞庫尚未收錄/);
  assert.match(script, /studyhub-ai-api\.jimmy980821\.workers\.dev\/analyze/);
  assert.match(script, /studyhub-ai-api\.jimmy980821\.workers\.dev\/sync/);
  assert.match(script, /crypto\.subtle/);
  assert.match(script, /AES-GCM/);
  assert.match(script, /GoogleAuthProvider/);
  assert.match(script, /firebase-firestore\.js/);
  assert.match(script, /campus-flow-9965c/);
  assert.match(script, /users", this\.currentUser\.uid, "studyhub", "state"/);
  assert.match(html, /id="syncModal"/);
  assert.match(html, /電腦與手機同步/);
  assert.match(html, /使用 Google 登入/);
  assert.match(html, /class="icon-btn mobile-sync"/);
  assert.match(html, /aria-label="開啟裝置同步"/);
  assert.match(css, /\.mobile-sync \{ display: grid;/);
  assert.match(css, /\.add-content-btn \{ display: inline-flex; align-items: center; justify-content: center/);
  assert.match(script, /AI 暫時無法使用，已改用本機分析/);
  assert.match(html, /免費 AI · 本機備援/);
  assert.doesNotMatch(`${html}${formulas}`, /\u20d7/);
  assert.ok((formulas.match(/"數學"/g) ?? []).length >= 40);
  assert.ok((formulas.match(/"物理"/g) ?? []).length >= 25);
  assert.ok((script.match(/subject:"化學"/g) ?? []).length >= 14);
  for (const scope of ["第1冊", "第2冊", "第3A冊", "第4A冊", "物理筆記"]) {
    assert.match(formulas, new RegExp(scope));
  }
  assert.match(formulas, /λₘₐₓT = b/);
  assert.match(formulas, /N = N₀/);
  assert.match(formulas, /hf = W/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(html, /data-studyhub-route="vocabulary"/);
  assert.match(html, /高中英文核心字彙/);
  assert.match(script, /initializeStudyHubRoutes/);
  assert.equal(JSON.parse(manifest).short_name, "StudyHub");
  assert.equal(JSON.parse(manifest).start_url, "./");
  assert.equal(JSON.parse(manifest).icons.length, 2);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(html, /rel="manifest"/);
});

test("includes the complete social studies notes section", async () => {
  const [home, notesPage, notesData, scopeData] = await Promise.all([
    readFile(new URL("../public/studyhub/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/studyhub/social-notes/index.html", import.meta.url), "utf8"),
    import(new URL("../public/studyhub/social-notes/data.js", import.meta.url)),
    import(new URL("../public/studyhub/social-notes/scope-data.js", import.meta.url)),
  ]);

  assert.match(home, /href="social-notes\/"/);
  assert.match(home, /社會科學習筆記/);
  assert.match(notesPage, /返回 StudyHub/);
  const appScript = await readFile(new URL("../public/studyhub/social-notes/app.js", import.meta.url), "utf8");
  const notesStyle = await readFile(new URL("../public/studyhub/social-notes/style.css", import.meta.url), "utf8");
  for (const label of ["第一冊", "第二冊", "社會政治", "法律"]) assert.match(appScript, new RegExp(label));
  assert.match(notesStyle, /\.scope-badge/);
  const allNotes = [...notesData.socialNotes, ...scopeData.scopeNotes];
  assert.equal(allNotes.length, 79);
  assert.equal(notesData.socialQuiz.length + scopeData.scopeQuiz.length, 63);
  assert.equal(Object.keys(notesData.socialDeepDives).length + Object.keys(scopeData.scopeDeepDives).length, 79);
  assert.deepEqual(
    allNotes.reduce((counts, note) => {
      counts[note.subject] = (counts[note.subject] ?? 0) + 1;
      return counts;
    }, {}),
    { history: 26, geography: 24, civics: 29 },
  );
  for (const title of ["如何認識過去（導論）", "中國與東亞", "人口與環境負載力", "世界體系", "犯罪與刑罰", "勞動參與"]) {
    assert.ok(allNotes.some((note) => note.title === title), `missing scope note: ${title}`);
  }
});

test("includes the six-unit earth science notes section", async () => {
  const [home, notesPage, notesModule, appScript] = await Promise.all([
    readFile(new URL("../public/studyhub/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/studyhub/earth-notes/index.html", import.meta.url), "utf8"),
    import(new URL("../public/studyhub/earth-notes/data.js", import.meta.url)),
    readFile(new URL("../public/studyhub/earth-notes/app.js", import.meta.url), "utf8"),
  ]);

  assert.match(home, /href="earth-notes\/"/);
  assert.match(home, /地球科學六大單元/);
  assert.match(notesPage, /返回 StudyHub/);
  assert.equal(notesModule.earthNotes.length, 6);
  assert.equal(notesModule.earthQuiz.length, 12);
  for (const title of ["地球的故事", "從地球看宇宙", "千變萬化的大氣", "深藍的脈動", "體驗大地的撼動", "鑑古知今談永續"]) {
    assert.ok(notesModule.earthNotes.some((note) => note.title === title), `missing earth science unit: ${title}`);
  }
  for (const feature of ["earth-bookmarks-v1", "earth-ratings-v1", "renderQuiz", "searchInput"]) {
    assert.match(appScript, new RegExp(feature));
  }
});

test("publishes all CEEC vocabulary entries with Traditional Chinese meanings", async () => {
  const [html, script, rowsText] = await Promise.all([
    readFile(new URL("../public/vocabulary/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/vocabulary/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/data/ceec-vocabulary.json", import.meta.url), "utf8"),
  ]);
  const rows = JSON.parse(rowsText);

  assert.equal(rows.length, 6012);
  assert.equal(rows.filter((row) => row.translation).length, 6012);
  assert.equal(rows[0].word, "a/an");
  assert.equal(rows.at(-1).word, "zoom");
  assert.match(rows.find((row) => row.word === "achieve(ment)").translation, /完成/);
  assert.match(html, /附繁體中文義/);
  assert.match(html, /ECDICT/);
  assert.match(script, /row\.translation\.toLowerCase\(\)\.includes/);
  assert.match(script, /word-translation/);
  assert.match(html, /id="favoritesFilter"/);
  assert.match(html, /重要單字/);
  assert.match(script, /studyhub-vocabulary-favorites-v1/);
  assert.match(script, /localStorage\.setItem\(favoritesStorageKey/);
  assert.match(script, /data-favorite/);
});
