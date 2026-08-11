const pageSize = 60;
const state = { rows: [], query: "", level: null, letter: null, partOfSpeech: "all", page: 1 };
const elements = {
  search: document.querySelector("#vocabSearch"),
  searchClear: document.querySelector("#searchClear"),
  levels: document.querySelector("#levelFilters"),
  pos: document.querySelector("#posFilter"),
  alphabet: document.querySelector("#alphabetFilters"),
  results: document.querySelector("#resultsSection"),
  title: document.querySelector("#resultsTitle"),
  count: document.querySelector("#resultCount"),
  loading: document.querySelector("#loadingState"),
  error: document.querySelector("#errorState"),
  empty: document.querySelector("#emptyState"),
  grid: document.querySelector("#wordGrid"),
  pagination: document.querySelector("#pagination"),
  summary: document.querySelector("#pageSummary"),
  indicator: document.querySelector("#pageIndicator"),
  previous: document.querySelector("#previousPage"),
  next: document.querySelector("#nextPage"),
  reset: document.querySelector("#resetFilters"),
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function filteredRows() {
  const query = state.query.trim().toLowerCase();
  return state.rows.filter((row) => {
    const matchesQuery = !query || row.word.toLowerCase().includes(query) || row.part_of_speech.toLowerCase().includes(query);
    const matchesLevel = state.level === null || row.level === state.level;
    const matchesLetter = state.letter === null || row.letter === state.letter;
    const matchesPart = state.partOfSpeech === "all" || row.part_of_speech.split("/").some((item) => item.includes(state.partOfSpeech));
    return matchesQuery && matchesLevel && matchesLetter && matchesPart;
  });
}

function speak(word) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word.replace(/\([^)]*\)/g, ""));
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
}

function render() {
  const matches = filteredRows();
  const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
  state.page = Math.min(state.page, pageCount);
  const startIndex = (state.page - 1) * pageSize;
  const visible = matches.slice(startIndex, startIndex + pageSize);

  elements.title.textContent = state.letter ? `${state.letter} 開頭的字彙` : state.level ? `Level ${state.level} 字彙` : "全部核心字彙";
  elements.count.textContent = matches.length.toLocaleString("zh-TW");
  elements.searchClear.hidden = !state.query;
  elements.empty.hidden = visible.length > 0;
  elements.grid.hidden = visible.length === 0;
  elements.pagination.hidden = visible.length === 0;

  elements.grid.innerHTML = visible.map((row, index) => `
    <article class="word-card">
      <span class="word-index">${String(startIndex + index + 1).padStart(4, "0")}</span>
      <div class="word-main"><h3>${escapeHtml(row.word)}</h3><p>${escapeHtml(row.part_of_speech)}</p></div>
      <div class="level-badge level-${row.level}">L${row.level}</div>
      <button class="speak-button" type="button" data-speak="${escapeHtml(row.word)}" aria-label="朗讀 ${escapeHtml(row.word)}" title="朗讀單字"><span aria-hidden="true">◖</span></button>
    </article>`).join("");

  const start = matches.length ? startIndex + 1 : 0;
  const end = Math.min(startIndex + pageSize, matches.length);
  elements.summary.textContent = `顯示 ${start.toLocaleString("zh-TW")}–${end.toLocaleString("zh-TW")}，共 ${matches.length.toLocaleString("zh-TW")} 筆`;
  elements.indicator.textContent = `${state.page} / ${pageCount}`;
  elements.previous.disabled = state.page === 1;
  elements.next.disabled = state.page === pageCount;
}

function selectFilter(container, selector, target) {
  container.querySelectorAll(selector).forEach((button) => button.classList.toggle("active", button === target));
}

function reset() {
  Object.assign(state, { query: "", level: null, letter: null, partOfSpeech: "all", page: 1 });
  elements.search.value = "";
  elements.pos.value = "all";
  selectFilter(elements.levels, "button", elements.levels.querySelector('[data-level="all"]'));
  selectFilter(elements.alphabet, "button", elements.alphabet.querySelector('[data-letter="all"]'));
  render();
}

elements.alphabet.innerHTML = ["ALL", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((letter, index) =>
  `<button type="button" class="${index === 0 ? "active" : ""}" data-letter="${letter === "ALL" ? "all" : letter}">${letter}</button>`
).join("");

elements.search.addEventListener("input", (event) => { state.query = event.target.value; state.page = 1; render(); });
elements.searchClear.addEventListener("click", () => { state.query = ""; state.page = 1; elements.search.value = ""; render(); elements.search.focus(); });
elements.pos.addEventListener("change", (event) => { state.partOfSpeech = event.target.value; state.page = 1; render(); });
elements.reset.addEventListener("click", reset);
elements.levels.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-level]");
  if (!button) return;
  state.level = button.dataset.level === "all" ? null : Number(button.dataset.level);
  state.page = 1;
  selectFilter(elements.levels, "button", button);
  render();
});
elements.alphabet.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-letter]");
  if (!button) return;
  state.letter = button.dataset.letter === "all" ? null : button.dataset.letter;
  state.page = 1;
  selectFilter(elements.alphabet, "button", button);
  render();
});
elements.grid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-speak]");
  if (button) speak(button.dataset.speak);
});
elements.previous.addEventListener("click", () => { state.page -= 1; render(); elements.results.scrollIntoView({ behavior: "smooth" }); });
elements.next.addEventListener("click", () => { state.page += 1; render(); elements.results.scrollIntoView({ behavior: "smooth" }); });

fetch("../data/ceec-vocabulary.json")
  .then((response) => {
    if (!response.ok) throw new Error("Unable to load vocabulary");
    return response.json();
  })
  .then((rows) => {
    state.rows = rows;
    elements.loading.hidden = true;
    render();
  })
  .catch(() => {
    elements.loading.hidden = true;
    elements.error.hidden = false;
  });
