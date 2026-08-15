"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type VocabularyRow = {
  word: string;
  part_of_speech: string;
  level: number;
  letter: string;
  translation: string;
};

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const pageSize = 60;
const favoritesStorageKey = "studyhub-vocabulary-favorites-v1";
const sourceUrl =
  "https://www.ceec.edu.tw/files/file_pool/1/0K213612821879129835/%E9%AB%98%E4%B8%AD%E8%8B%B1%E6%96%87%E5%8F%83%E8%80%83%E8%A9%9E%E5%BD%99%E8%A1%A8%28111%E5%AD%B8%E5%B9%B4%E5%BA%A6%E8%B5%B7%E9%81%A9%E7%94%A8%29.pdf";

function speak(word: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word.replace(/\([^)]*\)/g, ""));
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
}

function favoriteKey(row: VocabularyRow) {
  return `${row.word}::${row.level}`;
}

export default function VocabularyApp() {
  const [rows, setRows] = useState<VocabularyRow[]>([]);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<number | null>(null);
  const [letter, setLetter] = useState<string | null>(null);
  const [partOfSpeech, setPartOfSpeech] = useState("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch("/data/ceec-vocabulary.json")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load vocabulary");
        return response.json();
      })
      .then((data: VocabularyRow[]) => setRows(data))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(favoritesStorageKey) ?? "[]");
      if (Array.isArray(saved)) setFavorites(new Set(saved.filter((item): item is string => typeof item === "string")));
    } catch {
      localStorage.removeItem(favoritesStorageKey);
    }
  }, []);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        !normalizedQuery ||
        row.word.toLowerCase().includes(normalizedQuery) ||
        row.part_of_speech.toLowerCase().includes(normalizedQuery) ||
        row.translation.toLowerCase().includes(normalizedQuery);
      const matchesLevel = level === null || row.level === level;
      const matchesLetter = letter === null || row.letter === letter;
      const matchesPartOfSpeech =
        partOfSpeech === "all" || row.part_of_speech.split("/").some((item) => item.includes(partOfSpeech));
      const matchesFavorites = !favoritesOnly || favorites.has(favoriteKey(row));
      return matchesQuery && matchesLevel && matchesLetter && matchesPartOfSpeech && matchesFavorites;
    });
  }, [favorites, favoritesOnly, letter, level, partOfSpeech, query, rows]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  function updateFilter(action: () => void) {
    action();
    setPage(1);
  }

  function changePage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetFilters() {
    setQuery("");
    setLevel(null);
    setLetter(null);
    setPartOfSpeech("all");
    setFavoritesOnly(false);
    setPage(1);
  }

  function toggleFavorite(row: VocabularyRow) {
    const key = favoriteKey(row);
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem(favoritesStorageKey, JSON.stringify([...next]));
      return next;
    });
  }

  const start = filteredRows.length ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, filteredRows.length);

  return (
    <main className="vocab-page">
      <header className="vocab-hero">
        <nav className="vocab-nav" aria-label="主要導覽">
          <a className="vocab-brand" href="/">
            <span className="brand-mark" aria-hidden="true">S</span>
            <span>StudyHub</span>
          </a>
          <a className="back-link" href="/">回到學習中心 <span aria-hidden="true">↗</span></a>
        </nav>

        <div className="hero-grid">
          <section>
            <div className="eyebrow"><span>CEEC 111</span> 高中英文參考詞彙表</div>
            <h1>六千個核心字彙，<br /><em>一次查清楚。</em></h1>
            <p className="hero-copy">
              Level 1–6 全收錄，附繁體中文義並依 A–Z 整理。輸入英文或中文，快速找到今天要記住的那一個詞。
            </p>
          </section>

          <aside className="hero-stats" aria-label="字彙統計">
            <div><strong>6,012</strong><span>官方詞條</span></div>
            <div><strong>6</strong><span>學習級別</span></div>
            <div><strong>A–Z</strong><span>完整排序</span></div>
          </aside>
        </div>

        <label className="search-box">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <span className="sr-only">搜尋單字或詞性</span>
          <input
            type="search"
            value={query}
            onChange={(event) => updateFilter(() => setQuery(event.target.value))}
            placeholder="搜尋英文、中文或詞性，例如：achieve、完成、adj."
            autoComplete="off"
          />
          {query && <button type="button" onClick={() => updateFilter(() => setQuery(""))}>清除</button>}
        </label>
      </header>

      <section className="filter-panel" aria-label="字彙篩選器">
        <div className="filter-row">
          <span className="filter-label">級別</span>
          <div className="chip-list">
            <button className={level === null ? "active" : ""} onClick={() => updateFilter(() => setLevel(null))}>全部</button>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <button key={item} className={level === item ? "active" : ""} onClick={() => updateFilter(() => setLevel(item))}>
                Level {item}
              </button>
            ))}
          </div>
          <label className="pos-select">
            <span>詞性</span>
            <select value={partOfSpeech} onChange={(event) => updateFilter(() => setPartOfSpeech(event.target.value))}>
              <option value="all">全部詞性</option>
              <option value="n.">名詞 n.</option>
              <option value="v.">動詞 v.</option>
              <option value="adj.">形容詞 adj.</option>
              <option value="adv.">副詞 adv.</option>
              <option value="prep.">介系詞 prep.</option>
              <option value="conj.">連接詞 conj.</option>
              <option value="pron.">代名詞 pron.</option>
            </select>
          </label>
          <button
            className={`favorites-filter ${favoritesOnly ? "active" : ""}`}
            type="button"
            aria-pressed={favoritesOnly}
            onClick={() => updateFilter(() => setFavoritesOnly((current) => !current))}
          >
            <span aria-hidden="true">★</span> 重要單字 <strong>{favorites.size}</strong>
          </button>
        </div>

        <div className="alphabet" aria-label="依字首篩選">
          <button className={letter === null ? "active" : ""} onClick={() => updateFilter(() => setLetter(null))}>ALL</button>
          {letters.map((item) => (
            <button key={item} className={letter === item ? "active" : ""} onClick={() => updateFilter(() => setLetter(item))}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="results-section" ref={resultsRef}>
        <div className="results-heading">
          <div>
            <p className="section-kicker">VOCABULARY INDEX</p>
            <h2>{favoritesOnly ? "我的重要單字" : letter ? `${letter} 開頭的字彙` : level ? `Level ${level} 字彙` : "全部核心字彙"}</h2>
          </div>
          <div className="result-count" aria-live="polite">
            <strong>{filteredRows.length.toLocaleString("zh-TW")}</strong>
            <span>個結果</span>
          </div>
        </div>

        {error ? (
          <div className="state-card"><strong>字彙資料暫時無法載入</strong><p>請重新整理頁面再試一次。</p></div>
        ) : !rows.length ? (
          <div className="state-card loading"><span />正在載入 6,012 個詞條…</div>
        ) : visibleRows.length ? (
          <>
            <div className="word-grid">
              {visibleRows.map((row, index) => (
                <article className="word-card" key={`${row.word}-${row.level}`}>
                  <span className="word-index">{String((page - 1) * pageSize + index + 1).padStart(4, "0")}</span>
                  <div className="word-main">
                    <h3>{row.word}</h3>
                    <p className="word-translation">{row.translation}</p>
                    <p className="word-pos">{row.part_of_speech}</p>
                  </div>
                  <div className={`level-badge level-${row.level}`}>L{row.level}</div>
                  <button
                    className={`favorite-button ${favorites.has(favoriteKey(row)) ? "active" : ""}`}
                    type="button"
                    onClick={() => toggleFavorite(row)}
                    aria-label={`${favorites.has(favoriteKey(row)) ? "取消" : "加入"}重要單字：${row.word}`}
                    aria-pressed={favorites.has(favoriteKey(row))}
                    title={favorites.has(favoriteKey(row)) ? "取消重要單字" : "儲存為重要單字"}
                  >
                    <span aria-hidden="true">{favorites.has(favoriteKey(row)) ? "★" : "☆"}</span>
                  </button>
                  <button className="speak-button" type="button" onClick={() => speak(row.word)} aria-label={`朗讀 ${row.word}`} title="朗讀單字">
                    <span aria-hidden="true">◖</span>
                  </button>
                </article>
              ))}
            </div>

            <div className="pagination" aria-label="結果分頁">
              <p>顯示 {start.toLocaleString("zh-TW")}–{end.toLocaleString("zh-TW")}，共 {filteredRows.length.toLocaleString("zh-TW")} 筆</p>
              <div>
                <button disabled={page === 1} onClick={() => changePage(page - 1)}>← 上一頁</button>
                <span>{page} / {pageCount}</span>
                <button disabled={page === pageCount} onClick={() => changePage(page + 1)}>下一頁 →</button>
              </div>
            </div>
          </>
        ) : (
          <div className="state-card empty-state">
            <span aria-hidden="true">Aa</span>
            <strong>{favoritesOnly ? favorites.size ? "目前篩選找不到重要單字" : "還沒有重要單字" : "找不到符合條件的字彙"}</strong>
            <p>{favoritesOnly ? favorites.size ? "調整級別、字母或詞性，查看其他已儲存單字。" : "點一下單字卡上的星號，就能把它收藏到這裡。" : "試試其他拼法，或清除目前的篩選條件。"}</p>
            <button type="button" onClick={resetFilters}>{favoritesOnly ? "查看全部單字" : "清除全部篩選"}</button>
          </div>
        )}
      </section>

      <footer className="vocab-footer">
        <div><strong>StudyHub</strong><span>讓複習更有方向。</span></div>
        <p>詞條來源：<a href={sourceUrl} target="_blank" rel="noreferrer">大學入學考試中心</a>；中文義採用 <a href="https://github.com/skywind3000/ECDICT" target="_blank" rel="noreferrer">ECDICT</a> 開源英漢字典（MIT）。</p>
      </footer>
    </main>
  );
}
