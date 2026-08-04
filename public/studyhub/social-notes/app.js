import { socialNotes, socialQuiz, socialDeepDives } from "./data.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const subjectNames = { history:"歷史", geography:"地理", civics:"公民" };
const viewCopy = {
  all:["第一冊全範圍","歷史、地理、公民一次掌握"],
  history:["歷史第一冊","從多元族群到現代國家的形塑"],
  geography:["地理第一冊","用空間觀點理解氣候、地形與人地關係"],
  civics:["公民第一冊","從人權、民主到全球化與媒體識讀"]
};

const safeParse = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const state = {
  view:"all",
  search:"",
  expanded:new Set([socialNotes[0].id]),
  bookmarks:new Set(safeParse("social-notes-bookmarks-v1", [])),
  ratings:safeParse("social-notes-ratings-v1", {}),
  quizIndex:0,
  quizAnswers:Array(socialQuiz.length).fill(null)
};

function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[char]);
}

function matchingNotes() {
  const keyword = state.search.trim().toLowerCase();
  return socialNotes.filter(note => {
    const inSubject = state.view === "all" || note.subject === state.view;
    const deepDive = socialDeepDives[note.id];
    const deepText = deepDive
      ? [...deepDive.sections.flatMap(section => [section.title, section.text]), deepDive.examTip, deepDive.scenario]
      : [];
    const text = [note.title,note.summary,...note.bullets,note.compare,note.trap,note.keywords,...deepText].join(" ").toLowerCase();
    return inSubject && (!keyword || text.includes(keyword));
  });
}

function renderSummary() {
  const subjects = ["history","geography","civics"];
  $("#subjectSummary").innerHTML = subjects.map(subject => {
    const total = socialNotes.filter(note => note.subject === subject).length;
    const done = socialNotes.filter(note => note.subject === subject && Number(state.ratings[note.id]) >= 4).length;
    return `<button class="summary-card ${subject}" data-view="${subject}"><i>${subjectNames[subject].slice(0,1)}</i><span><strong>${subjectNames[subject]} · ${total} 主題</strong><small>${done} 個已熟悉，點擊查看本科</small></span></button>`;
  }).join("");
}

function noteCard(note) {
  const rating = Number(state.ratings[note.id]) || 0;
  const open = state.expanded.has(note.id);
  const bookmarked = state.bookmarks.has(note.id);
  const deepDive = socialDeepDives[note.id];
  const deepDiveHTML = deepDive ? `<section class="deep-dive">
        <h4><span>深入整理</span><small>把核心概念連成完整脈絡</small></h4>
        <div class="deep-grid">${deepDive.sections.map(section => `<article class="deep-topic"><strong>${escapeHTML(section.title)}</strong><p>${escapeHTML(section.text)}</p></article>`).join("")}</div>
      </section>
      <div class="exam-lab">
        <article><strong>題型判讀</strong><p>${escapeHTML(deepDive.examTip)}</p></article>
        <article><strong>情境應用</strong><p>${escapeHTML(deepDive.scenario)}</p></article>
      </div>` : "";
  return `<article class="note-card ${note.subject} ${open ? "open" : ""}" data-note-id="${note.id}">
    <div class="note-head">
      <span class="note-code">${note.number}</span>
      <button class="note-title" data-action="toggle-note" data-id="${note.id}" aria-expanded="${open}"><strong>${escapeHTML(note.title)}</strong><small>${escapeHTML(note.summary)}</small></button>
      <div class="note-tools">
        <button class="bookmark ${bookmarked ? "active" : ""}" data-action="bookmark" data-id="${note.id}" aria-label="${bookmarked ? "取消待複習" : "加入待複習"}：${escapeHTML(note.title)}">${bookmarked ? "◆" : "◇"}</button>
        <button class="chevron" data-action="toggle-note" data-id="${note.id}" aria-label="展開${escapeHTML(note.title)}">›</button>
      </div>
    </div>
    <div class="note-body">
      <p class="lead">${escapeHTML(note.summary)}</p>
      <ul class="point-list">${note.bullets.map(point => `<li>${escapeHTML(point)}</li>`).join("")}</ul>
      ${deepDiveHTML}
      <div class="compare-grid"><p><strong>快速比較</strong>${escapeHTML(note.compare)}</p><p class="trap"><strong>易錯提醒</strong>${escapeHTML(note.trap)}</p></div>
      <div class="mastery"><span>我的熟悉程度</span><div class="stars" aria-label="${escapeHTML(note.title)}熟悉程度">${[1,2,3,4,5].map(value => `<button class="star ${value <= rating ? "active" : ""}" data-action="rate" data-id="${note.id}" data-value="${value}" aria-label="${value} 星">★</button>`).join("")}</div><span class="rating-label">${rating ? `${rating} 星 · ${rating >= 4 ? "已熟悉" : "待加強"}` : "尚未評分"}</span></div>
    </div>
  </article>`;
}

function renderNotes() {
  const [title,subtitle] = viewCopy[state.view] || viewCopy.all;
  $("#viewTitle").textContent = title;
  $("#viewSubtitle").textContent = subtitle;
  const notes = matchingNotes();
  $("#noteList").innerHTML = notes.map(noteCard).join("");
  $("#emptyState").hidden = notes.length > 0;
  renderSummary();
  updateProgress();
}

function reviewNotes() {
  return socialNotes.filter(note => state.bookmarks.has(note.id) || (state.ratings[note.id] && Number(state.ratings[note.id]) < 4));
}

function renderReview() {
  const notes = reviewNotes();
  $("#reviewList").innerHTML = notes.map(noteCard).join("");
  $("#reviewEmpty").hidden = notes.length > 0;
  $("#bookmarkStat").textContent = state.bookmarks.size;
  $("#weakStat").textContent = socialNotes.filter(note => state.ratings[note.id] && Number(state.ratings[note.id]) < 4).length;
  $("#doneStat").textContent = socialNotes.filter(note => Number(state.ratings[note.id]) >= 4).length;
  updateProgress();
}

function updateProgress() {
  const mastered = socialNotes.filter(note => Number(state.ratings[note.id]) >= 4).length;
  const reviewCount = reviewNotes().length;
  $("#masteredStat").textContent = mastered;
  $("#progressText").textContent = `${mastered} / ${socialNotes.length}`;
  $("#progressBar").style.width = `${mastered / socialNotes.length * 100}%`;
  $("#reviewCount").textContent = reviewCount;
}

function showView(view) {
  if (["all","history","geography","civics"].includes(view)) {
    state.view = view;
    $$(".view").forEach(panel => panel.classList.toggle("active", panel.dataset.page === "notes"));
    renderNotes();
  } else {
    $$(".view").forEach(panel => panel.classList.toggle("active", panel.dataset.page === view));
    if (view === "review") renderReview();
    if (view === "quiz") renderQuiz();
  }
  $$(".topbar [data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  document.title = view === "quiz" ? "自我測驗｜社會科學習筆記" : view === "review" ? "待複習｜社會科學習筆記" : "社會科學習筆記｜歷史・地理・公民";
  window.scrollTo({top: view === "all" ? 0 : $(".progress-strip").offsetTop - 80,behavior:"smooth"});
}

function toggleBookmark(id) {
  if (state.bookmarks.has(id)) state.bookmarks.delete(id); else state.bookmarks.add(id);
  save("social-notes-bookmarks-v1", [...state.bookmarks]);
  renderNotes();
  renderReview();
  toast(state.bookmarks.has(id) ? "已加入待複習清單" : "已移出待複習清單");
}

function rate(id, value) {
  state.ratings[id] = value;
  save("social-notes-ratings-v1", state.ratings);
  renderNotes();
  renderReview();
  toast(value >= 4 ? "已標記為熟悉" : "已加入待加強項目");
}

function renderQuiz() {
  const total = socialQuiz.length;
  const finished = state.quizIndex >= total;
  const score = state.quizAnswers.reduce((sum, answer, index) => sum + (answer === socialQuiz[index].answer ? 1 : 0), 0);
  $("#scoreValue").textContent = score;
  $("#scoreRing").style.setProperty("--score", `${score / total * 100}%`);
  $("#quizPosition").textContent = finished ? "測驗完成" : `第 ${state.quizIndex + 1} / ${total} 題`;
  $("#quizDots").innerHTML = socialQuiz.map((_, index) => {
    const answer = state.quizAnswers[index];
    const status = answer === null ? "" : answer === socialQuiz[index].answer ? "correct" : "wrong";
    return `<i class="${index === state.quizIndex ? "current" : ""} ${status}"></i>`;
  }).join("");
  $("#previousQuestion").disabled = state.quizIndex === 0;

  if (finished) {
    const percent = Math.round(score / total * 100);
    $("#quizSubject").textContent = "完成";
    $("#quizQuestion").textContent = "本次測驗結果";
    $("#quizOptions").innerHTML = `<div class="quiz-finish"><strong>${score} / ${total}</strong><p>${percent >= 80 ? "觀念掌握得很好！再快速掃過易錯提醒即可。" : "先回到待複習清單補強，再重新挑戰一次。"}</p></div>`;
    $("#quizFeedback").textContent = `正確率 ${percent}%`;
    $("#nextQuestion").disabled = true;
    return;
  }

  const item = socialQuiz[state.quizIndex];
  const answered = state.quizAnswers[state.quizIndex];
  $("#quizSubject").textContent = item.subject;
  $("#quizQuestion").textContent = item.question;
  $("#quizOptions").innerHTML = item.options.map((option,index) => {
    const correct = answered !== null && index === item.answer;
    const wrong = answered === index && index !== item.answer;
    return `<button data-answer="${index}" ${answered !== null ? "disabled" : ""} class="${correct ? "correct" : wrong ? "wrong" : ""}"><span>${String.fromCharCode(65+index)}</span>${escapeHTML(option)}</button>`;
  }).join("");
  $("#quizFeedback").className = "quiz-feedback";
  if (answered === null) $("#quizFeedback").textContent = "選擇一個答案，看看是否掌握這個觀念。";
  else {
    const correct = answered === item.answer;
    $("#quizFeedback").classList.add(correct ? "correct" : "wrong");
    $("#quizFeedback").innerHTML = `<strong>${correct ? "答對了" : "答案是 " + String.fromCharCode(65+item.answer)}</strong>${escapeHTML(item.explain)}`;
  }
  $("#nextQuestion").disabled = answered === null;
  $("#nextQuestion").textContent = state.quizIndex === total - 1 ? "查看結果" : "下一題";
}

function answerQuiz(index) {
  if (state.quizAnswers[state.quizIndex] !== null) return;
  state.quizAnswers[state.quizIndex] = index;
  renderQuiz();
}

function resetQuiz() {
  state.quizIndex = 0;
  state.quizAnswers = Array(socialQuiz.length).fill(null);
  renderQuiz();
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 1900);
}

function applyTheme() {
  const saved = localStorage.getItem("social-notes-theme");
  const dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  $("#themeButton").textContent = dark ? "☀" : "◐";
}

document.addEventListener("click", event => {
  const view = event.target.closest("[data-view]");
  if (view) { showView(view.dataset.view); return; }
  const jump = event.target.closest("[data-jump]");
  if (jump) { $("#notes").scrollIntoView({behavior:"smooth"}); return; }
  const action = event.target.closest("[data-action]");
  if (action?.dataset.action === "toggle-note") {
    const id = action.dataset.id;
    if (state.expanded.has(id)) state.expanded.delete(id); else state.expanded.add(id);
    renderNotes(); renderReview(); return;
  }
  if (action?.dataset.action === "bookmark") { toggleBookmark(action.dataset.id); return; }
  if (action?.dataset.action === "rate") { rate(action.dataset.id, Number(action.dataset.value)); return; }
  const answer = event.target.closest("[data-answer]");
  if (answer) answerQuiz(Number(answer.dataset.answer));
});

$("#searchInput").addEventListener("input", event => { state.search = event.target.value; renderNotes(); });
$("#expandButton").addEventListener("click", () => {
  const notes = matchingNotes();
  const allOpen = notes.every(note => state.expanded.has(note.id));
  notes.forEach(note => allOpen ? state.expanded.delete(note.id) : state.expanded.add(note.id));
  $("#expandButton").textContent = allOpen ? "全部展開" : "全部收合";
  renderNotes();
});
$("#themeButton").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("social-notes-theme", next);
  applyTheme();
});
$("#nextQuestion").addEventListener("click", () => { if (state.quizAnswers[state.quizIndex] !== null) { state.quizIndex += 1; renderQuiz(); } });
$("#previousQuestion").addEventListener("click", () => { if (state.quizIndex > 0) { state.quizIndex -= 1; renderQuiz(); } });
$("#resetQuiz").addEventListener("click", resetQuiz);

$("#topicStat").textContent = socialNotes.length;
$("#quizStat").textContent = socialQuiz.length;
$("#quizHeading").textContent = `${socialQuiz.length} 題觀念測驗`;
applyTheme();
renderNotes();
renderQuiz();
