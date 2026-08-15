const pageSize = 60;
const favoritesStorageKey = "studyhub-vocabulary-favorites-v1";
const state = { rows: [], query: "", level: null, letter: null, partOfSpeech: "all", page: 1, favorites: new Set(), favoritesOnly: false };
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
  emptyTitle: document.querySelector("#emptyTitle"),
  emptyDescription: document.querySelector("#emptyDescription"),
  grid: document.querySelector("#wordGrid"),
  pagination: document.querySelector("#pagination"),
  summary: document.querySelector("#pageSummary"),
  indicator: document.querySelector("#pageIndicator"),
  previous: document.querySelector("#previousPage"),
  next: document.querySelector("#nextPage"),
  reset: document.querySelector("#resetFilters"),
  favoritesFilter: document.querySelector("#favoritesFilter"),
  favoritesCount: document.querySelector("#favoritesCount"),
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function filteredRows() {
  const query = state.query.trim().toLowerCase();
  return state.rows.filter((row) => {
    const matchesQuery = !query || row.word.toLowerCase().includes(query) || row.part_of_speech.toLowerCase().includes(query) || row.translation.toLowerCase().includes(query);
    const matchesLevel = state.level === null || row.level === state.level;
    const matchesLetter = state.letter === null || row.letter === state.letter;
    const matchesPart = state.partOfSpeech === "all" || row.part_of_speech.split("/").some((item) => item.includes(state.partOfSpeech));
    const matchesFavorites = !state.favoritesOnly || state.favorites.has(favoriteKey(row));
    return matchesQuery && matchesLevel && matchesLetter && matchesPart && matchesFavorites;
  });
}

function favoriteKey(row) {
  return `${row.word}::${row.level}`;
}

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(favoritesStorageKey) || "[]");
    state.favorites = new Set(Array.isArray(saved) ? saved.filter((item) => typeof item === "string") : []);
  } catch {
    localStorage.removeItem(favoritesStorageKey);
    state.favorites = new Set();
  }
}

function saveFavorites() {
  localStorage.setItem(favoritesStorageKey, JSON.stringify([...state.favorites]));
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

  elements.title.textContent = state.favoritesOnly ? "我的重要單字" : state.letter ? `${state.letter} 開頭的字彙` : state.level ? `Level ${state.level} 字彙` : "全部核心字彙";
  elements.count.textContent = matches.length.toLocaleString("zh-TW");
  elements.favoritesCount.textContent = state.favorites.size.toLocaleString("zh-TW");
  elements.favoritesFilter.classList.toggle("active", state.favoritesOnly);
  elements.favoritesFilter.setAttribute("aria-pressed", String(state.favoritesOnly));
  elements.searchClear.hidden = !state.query;
  elements.empty.hidden = visible.length > 0;
  elements.emptyTitle.textContent = state.favoritesOnly ? (state.favorites.size ? "目前篩選找不到重要單字" : "還沒有重要單字") : "找不到符合條件的字彙";
  elements.emptyDescription.textContent = state.favoritesOnly ? (state.favorites.size ? "調整級別、字母或詞性，查看其他已儲存單字。" : "點一下單字卡上的星號，就能把它收藏到這裡。") : "試試其他拼法，或清除目前的篩選條件。";
  elements.reset.textContent = state.favoritesOnly ? "查看全部單字" : "清除全部篩選";
  elements.grid.hidden = visible.length === 0;
  elements.pagination.hidden = visible.length === 0;

  elements.grid.innerHTML = visible.map((row, index) => `
    <article class="word-card">
      <span class="word-index">${String(startIndex + index + 1).padStart(4, "0")}</span>
      <div class="word-main"><h3>${escapeHtml(row.word)}</h3><p class="word-translation">${escapeHtml(row.translation)}</p><p class="word-pos">${escapeHtml(row.part_of_speech)}</p></div>
      <div class="level-badge level-${row.level}">L${row.level}</div>
      <button class="favorite-button ${state.favorites.has(favoriteKey(row)) ? "active" : ""}" type="button" data-favorite="${escapeHtml(favoriteKey(row))}" aria-label="${state.favorites.has(favoriteKey(row)) ? "取消" : "加入"}重要單字：${escapeHtml(row.word)}" aria-pressed="${state.favorites.has(favoriteKey(row))}" title="${state.favorites.has(favoriteKey(row)) ? "取消重要單字" : "儲存為重要單字"}"><span aria-hidden="true">${state.favorites.has(favoriteKey(row)) ? "★" : "☆"}</span></button>
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
  Object.assign(state, { query: "", level: null, letter: null, partOfSpeech: "all", page: 1, favoritesOnly: false });
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
elements.favoritesFilter.addEventListener("click", () => { state.favoritesOnly = !state.favoritesOnly; state.page = 1; render(); });
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
  const favoriteButton = event.target.closest("button[data-favorite]");
  if (favoriteButton) {
    const key = favoriteButton.dataset.favorite;
    if (state.favorites.has(key)) state.favorites.delete(key);
    else state.favorites.add(key);
    saveFavorites();
    render();
    return;
  }
  const speakButton = event.target.closest("button[data-speak]");
  if (speakButton) speak(speakButton.dataset.speak);
});
elements.previous.addEventListener("click", () => { state.page -= 1; render(); elements.results.scrollIntoView({ behavior: "smooth" }); });
elements.next.addEventListener("click", () => { state.page += 1; render(); elements.results.scrollIntoView({ behavior: "smooth" }); });

loadFavorites();

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
