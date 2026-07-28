(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);

  // 封裝 localStorage，若瀏覽器禁用儲存仍可安全運作。
  class Store {
    constructor(prefix) { this.prefix = prefix; }
    get(key, fallback) {
      try {
        const value = localStorage.getItem(`${this.prefix}:${key}`);
        return value === null ? fallback : JSON.parse(value);
      } catch (error) {
        console.warn("無法讀取本機資料：", error);
        return fallback;
      }
    }
    set(key, value) {
      try {
        localStorage.setItem(`${this.prefix}:${key}`, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn("無法儲存本機資料：", error);
        return false;
      }
    }
  }

  class StudyHubApp {
    constructor() {
      this.store = new Store("studyhub");
      this.readerMode = "chinese";
      this.readerTab = 0;
      this.flashIndex = 0;
      this.heatView = "month";
      this.favoriteFilter = "all";
      this.imageDraft = "";

      this.seed = {
        mistakes: [
          { id: "m1", subject: "數學", unit: "排列組合", difficulty: "困難", question: "從 6 位同學中選出 3 位，至少包含甲的選法共有幾種？", tags: ["排列組合", "常考"], reason: "忽略了「至少」的限制條件。", mySolution: "直接計算 C(6,3)。", correctSolution: "固定選入甲，再從其餘 5 人選 2 人：C(5,2)=10。", note: "先把必選條件固定。", date: "2026-07-28", favorite: true, image: "" },
          { id: "m2", subject: "英文", unit: "關係子句", difficulty: "中等", question: "The book _____ I borrowed yesterday is worth reading.", tags: ["文法", "關係代名詞"], reason: "混淆 which 與 what 的用法。", mySolution: "填入 what。", correctSolution: "先行詞為 the book，關係子句缺受詞，應使用 which 或 that。", note: "what 前面不能有先行詞。", date: "2026-07-27", favorite: false, image: "" },
          { id: "m3", subject: "自然", unit: "牛頓運動定律", difficulty: "中等", question: "物體在粗糙斜面上等速下滑，請判斷合力與摩擦力方向。", tags: ["力學", "受力分析"], reason: "把運動方向誤認為合力方向。", mySolution: "合力沿斜面向下。", correctSolution: "等速代表加速度為零，因此合力為零；摩擦力沿斜面向上。", note: "先由運動狀態判斷加速度。", date: "2026-07-25", favorite: true, image: "" }
        ],
        formulas: [
          { id:"f1", subject:"數學", name:"等差級數總和", formula:"Sₙ = n(a₁ + aₙ) / 2", description:"首項與末項平均後乘以項數。", point:"常與通項 aₙ = a₁ + (n−1)d 搭配。", example:"1+4+7+…+28 = 10×(1+28)/2 = 145" },
          { id:"f2", subject:"物理", name:"牛頓第二運動定律", formula:"ΣF = ma", description:"物體所受合力等於質量乘以加速度。", point:"向量式，列式前先決定正方向。", example:"2 kg 物體受 10 N 合力，加速度為 5 m/s²。" },
          { id:"f3", subject:"化學", name:"理想氣體方程式", formula:"PV = nRT", description:"描述理想氣體壓力、體積、莫耳數與溫度關係。", point:"溫度必須換算為絕對溫標 K。", example:"定溫下壓力加倍，體積變為一半。" },
          { id:"f4", subject:"數學", name:"二次方程式公式解", formula:"x = (−b ± √(b²−4ac)) / 2a", description:"用於求解 ax²+bx+c=0 的根。", point:"判別式 Δ 決定實根數量。", example:"x²−5x+6=0，得 x=2 或 3。" },
          { id:"f5", subject:"物理", name:"等加速度位移公式", formula:"x = v₀t + ½at²", description:"加速度固定時，計算時間 t 內的位移。", point:"各物理量正負號需符合座標正方向。", example:"自由落下 2 秒，位移約 19.6 m。" },
          { id:"f6", subject:"化學", name:"稀釋公式", formula:"M₁V₁ = M₂V₂", description:"稀釋前後溶質莫耳數不變。", point:"兩側體積單位需一致。", example:"1 M 溶液 20 mL 稀釋至 0.2 M，終體積 100 mL。" }
        ],
        majors: [
          { id:"u1", icon:"心", name:"心理學系", intro:"研究人類行為、認知與情緒，結合科學方法理解人的內在世界。", skills:"觀察力、統計分析、溝通與同理", personality:"喜歡理解人、耐心傾聽、重視證據", future:"臨床、工商、教育與認知科學", jobs:"心理師、人資、使用者研究員、研究人員" },
          { id:"u2", icon:"碼", name:"資訊工程學系", intro:"以程式、演算法與系統設計解決真實世界問題。", skills:"邏輯推理、數學、拆解問題、自主學習", personality:"喜歡創造、願意反覆除錯、好奇新科技", future:"AI、軟體工程、資安、雲端與晶片", jobs:"軟體工程師、資料科學家、資安工程師" },
          { id:"u3", icon:"醫", name:"醫學系", intro:"學習人體科學、疾病診斷與臨床照護，守護個人與社群健康。", skills:"自然科學、記憶整合、溝通、抗壓", personality:"細心負責、樂於助人、能長期投入", future:"臨床專科、研究、公衛與醫療管理", jobs:"醫師、醫學研究員、公衛專家" },
          { id:"u4", icon:"法", name:"法律學系", intro:"理解法律制度、權利義務與社會爭議，訓練精準論證。", skills:"閱讀理解、邏輯論證、寫作與表達", personality:"關心公共議題、重視公平、善於辯證", future:"司法、企業法務、公共政策與國際事務", jobs:"律師、司法官、法務、政策研究員" },
          { id:"u5", icon:"商", name:"財務金融學系", intro:"研究資金配置、投資風險與金融市場的運作方式。", skills:"數學、資料判讀、風險意識與表達", personality:"對市場敏銳、理性決策、樂於分析", future:"金融科技、投資、銀行、風險管理", jobs:"分析師、理財顧問、風控人員、銀行專員" },
          { id:"u6", icon:"設", name:"工業設計學系", intro:"串聯使用者需求、美感與製造技術，設計更好的產品體驗。", skills:"視覺表達、空間感、同理心、實作", personality:"喜歡觀察生活、重視細節、勇於嘗試", future:"產品、互動、服務設計與設計策略", jobs:"產品設計師、UX 設計師、設計研究員" }
        ],
        flashcards: [
          { id:"c1", subject:"物理 · 力學", question:"牛頓第二運動定律的內容是什麼？", answer:"物體的加速度與所受合力成正比，與質量成反比。公式：F = ma" },
          { id:"c2", subject:"英文 · 文法", question:"關係代名詞 what 和 which 最大的差異？", answer:"what 本身包含先行詞，前面不可再有名詞；which 前面通常有明確先行詞。" },
          { id:"c3", subject:"國文 · 修辭", question:"「感時花濺淚，恨別鳥驚心」使用什麼修辭？", answer:"移情。將人的悲傷情感投射到花與鳥，使景物帶有人的感受。" },
          { id:"c4", subject:"數學 · 數列", question:"等比數列前 n 項和公式為何？", answer:"當 r ≠ 1 時，Sₙ = a₁(1−rⁿ)/(1−r)。" },
          { id:"c5", subject:"化學 · 氣體", question:"理想氣體方程式中的溫度單位是什麼？", answer:"必須使用絕對溫標 Kelvin（K），換算方式為 K = ℃ + 273.15。" }
        ],
        scores: { "國文": 82, "英文": 68, "數學": 48, "自然": 61, "社會": 75 }
      };

      this.mistakes = this.store.get("mistakes", this.seed.mistakes);
      this.favorites = this.store.get("favorites", [
        { type: "mistake", id: "m1" }, { type: "mistake", id: "m3" },
        { type: "formula", id: "f2" }, { type: "major", id: "u2" }, { type: "card", id: "c3" }
      ]);
      this.scores = this.store.get("scores", this.seed.scores);
      this.heat = this.store.get("heat", this.makeHeatSeed());
    }

    init() {
      this.applyTheme();
      this.setToday();
      this.bindEvents();
      this.renderAll();
      this.navigate(location.hash.slice(1) || "home", false);
    }

    applyTheme() {
      const saved = this.store.get("theme", "");
      const prefersDark = matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.theme = saved || (prefersDark ? "dark" : "light");
    }

    setToday() {
      const text = new Intl.DateTimeFormat("zh-TW", { month:"long", day:"numeric", weekday:"long" }).format(new Date());
      $("#todayDate").textContent = text.replace("星期", "・星期");
    }

    makeHeatSeed() {
      const result = {};
      for (let i = 0; i < 365; i += 1) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().slice(0, 10);
        const pattern = (i * 7 + date.getDate() * 3) % 11;
        result[key] = pattern < 3 ? 0 : pattern < 6 ? 1 : pattern < 8 ? 2 : pattern < 10 ? 3 : 4;
      }
      return result;
    }

    bindEvents() {
      document.addEventListener("click", (event) => this.handleClick(event));
      window.addEventListener("hashchange", () => this.navigate(location.hash.slice(1) || "home", false));
      $("#mobileBackdrop").addEventListener("click", () => this.toggleMenu(false));
      $("#globalSearch").addEventListener("input", (event) => this.renderGlobalSearch(event.target.value));
      $("#globalSearch").addEventListener("keydown", (event) => {
        if (event.key === "Escape") { event.target.value = ""; $("#searchResults").classList.remove("show"); }
      });
      document.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
          event.preventDefault(); $("#globalSearch").focus();
        }
        if (event.key === "Escape") { this.closeModals(); this.toggleMenu(false); }
      });
      $("#mistakeSearch").addEventListener("input", () => this.renderMistakes());
      $("#mistakeSubject").addEventListener("change", () => this.renderMistakes());
      $("#mistakeTag").addEventListener("change", () => this.renderMistakes());
      $("#formulaSearch").addEventListener("input", () => this.renderFormulas());
      $("#formulaSubject").addEventListener("change", () => this.renderFormulas());
      $("#majorSearch").addEventListener("input", () => this.renderMajors());
      $("#readerText").addEventListener("input", (event) => {
        if (event.target.value.length > 3000) event.target.value = event.target.value.slice(0, 3000);
        $("#readerCount").textContent = `${event.target.value.length} / 3000 字`;
      });
      $("#mistakeForm").addEventListener("submit", (event) => this.saveMistake(event));
      $("#mistakeForm [name='image']").addEventListener("change", (event) => this.readImage(event));
    }

    handleClick(event) {
      const pageLink = event.target.closest("[data-page-link]");
      if (pageLink) {
        event.preventDefault();
        this.navigate(pageLink.dataset.pageLink);
        if (pageLink.dataset.action === "close-quick") this.closeModals();
        return;
      }
      const action = event.target.closest("[data-action]");
      if (action) {
        this.runAction(action.dataset.action, action, event);
        return;
      }
      const readerTab = event.target.closest("[data-reader-tab]");
      if (readerTab) { this.readerMode = readerTab.dataset.readerTab; this.readerTab = 0; this.renderReader(); return; }
      const analysisTab = event.target.closest("[data-analysis-tab]");
      if (analysisTab) { this.readerTab = Number(analysisTab.dataset.analysisTab); this.renderReaderOutput(); return; }
      const knowledgeTab = event.target.closest("[data-knowledge-tab]");
      if (knowledgeTab) this.switchKnowledge(knowledgeTab.dataset.knowledgeTab);
      const heatView = event.target.closest("[data-heat-view]");
      if (heatView) { this.heatView = heatView.dataset.heatView; this.renderHeatmap(); this.syncActiveButtons("[data-heat-view]", heatView); }
      const heatCell = event.target.closest(".heat-cell");
      if (heatCell) this.updateHeat(heatCell.dataset.date);
      const mapButton = event.target.closest(".map-node button");
      if (mapButton) mapButton.parentElement.classList.toggle("expanded");
      const favoriteFilter = event.target.closest("[data-favorite-filter]");
      if (favoriteFilter) { this.favoriteFilter = favoriteFilter.dataset.favoriteFilter; this.renderFavorites(); this.syncActiveButtons("[data-favorite-filter]", favoriteFilter); }
      const searchResult = event.target.closest(".search-result");
      if (searchResult) {
        this.navigate(searchResult.dataset.page);
        $("#globalSearch").value = "";
        $("#searchResults").classList.remove("show");
      }
      if (!event.target.closest(".global-search")) $("#searchResults").classList.remove("show");
      const ripple = event.target.closest(".ripple");
      if (ripple) this.addRipple(ripple, event);
    }

    runAction(action, element) {
      const actions = {
        theme: () => this.toggleTheme(),
        "quick-add": () => this.openModal("quickModal"),
        "add-mistake": () => this.openMistake(),
        "quick-mistake": () => { this.closeModals(); this.openMistake(); },
        "close-modal": () => this.closeModals(),
        "close-quick": () => this.closeModals(),
        "edit-mistake": () => this.openMistake(element.dataset.id),
        "delete-mistake": () => this.deleteMistake(element.dataset.id),
        "favorite-mistake": () => this.toggleFavorite("mistake", element.dataset.id),
        "favorite-formula": () => this.toggleFavorite("formula", element.dataset.id),
        "favorite-major": () => this.toggleFavorite("major", element.dataset.id),
        "favorite-card": () => this.toggleFavorite("card", this.seed.flashcards[this.flashIndex].id),
        "remove-favorite": () => this.toggleFavorite(element.dataset.type, element.dataset.id),
        "reader-example": () => this.fillReaderExample(),
        "analyze-reader": () => this.analyzeReader(),
        "prev-card": () => this.changeCard(-1),
        "next-card": () => this.changeCard(1)
      };
      actions[action]?.();
    }

    navigate(page, updateHash = true) {
      const allowed = ["home", "mistakes", "reader", "analytics", "knowledge", "explore", "favorites"];
      const target = allowed.includes(page) ? page : "home";
      $$(".page").forEach((section) => section.classList.toggle("active", section.dataset.page === target));
      $$(".nav-item").forEach((link) => link.classList.toggle("active", link.dataset.pageLink === target));
      if (updateHash && location.hash !== `#${target}`) history.pushState(null, "", `#${target}`);
      this.toggleMenu(false);
      $("#mainContent").focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (target === "favorites") this.renderFavorites();
      if (target === "analytics") this.renderHeatmap();
    }

    toggleMenu(force) {
      const open = force ?? !$("#sidebar").classList.contains("open");
      $("#sidebar").classList.toggle("open", open);
      $("#mobileBackdrop").classList.toggle("show", open);
      $("#menuButton").setAttribute("aria-expanded", String(open));
    }

    toggleTheme() {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      this.store.set("theme", next);
      this.toast(next === "dark" ? "已切換為深色模式" : "已切換為淺色模式");
    }

    renderAll() {
      this.renderMistakes();
      this.renderRecent();
      this.renderReader();
      this.renderScores();
      this.renderHeatmap();
      this.renderFormulas();
      this.renderKnowledgeMap();
      this.renderFlashcard();
      this.renderMajors();
      this.renderFavorites();
      this.updateCounts();
    }

    renderRecent() {
      const items = [...this.mistakes].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 3);
      $("#recentList").innerHTML = items.map((item) => `
        <a class="recent-item" href="#mistakes" data-page-link="mistakes">
          <span>${escapeHTML(item.subject.slice(0,1))}</span>
          <span><strong>${escapeHTML(item.question)}</strong><small>${escapeHTML(item.subject)} · ${escapeHTML(item.unit)}</small></span>
          <time>${escapeHTML(item.date.slice(5).replace("-", "/"))}</time>
        </a>`).join("");
    }

    renderMistakes() {
      const keyword = $("#mistakeSearch")?.value.trim().toLowerCase() || "";
      const subject = $("#mistakeSubject")?.value || "";
      const tag = $("#mistakeTag")?.value || "";
      const tags = [...new Set(this.mistakes.flatMap((item) => item.tags))].sort();
      const tagSelect = $("#mistakeTag");
      if (tagSelect && tagSelect.options.length !== tags.length + 1) {
        const selected = tagSelect.value;
        tagSelect.innerHTML = `<option value="">所有標籤</option>${tags.map((item) => `<option>${escapeHTML(item)}</option>`).join("")}`;
        tagSelect.value = selected;
      }
      const filtered = this.mistakes.filter((item) => {
        const haystack = [item.question, item.unit, item.reason, item.correctSolution, ...item.tags].join(" ").toLowerCase();
        return (!keyword || haystack.includes(keyword)) && (!subject || item.subject === subject) && (!tag || item.tags.includes(tag));
      });
      $("#mistakeResultCount").textContent = `共 ${filtered.length} 題`;
      $("#mistakeGrid").innerHTML = filtered.map((item) => `
        <article class="mistake-card">
          <div class="card-top">
            <span class="subject-chip">${escapeHTML(item.subject)} · ${escapeHTML(item.unit)}</span>
            <span class="difficulty ${item.difficulty === "困難" ? "hard" : ""}">${escapeHTML(item.difficulty)}</span>
            <button class="favorite-btn ${this.isFavorite("mistake", item.id) ? "active" : ""}" data-action="favorite-mistake" data-id="${item.id}" aria-label="${this.isFavorite("mistake", item.id) ? "取消收藏" : "收藏"}">♥</button>
          </div>
          <h3>${escapeHTML(item.question)}</h3>
          <p>錯誤原因：${escapeHTML(item.reason || "尚未填寫")}</p>
          ${item.image ? `<img src="${item.image}" alt="題目圖片" style="width:100%;max-height:150px;object-fit:cover;border-radius:10px;margin-top:12px">` : ""}
          <div class="tag-list">${item.tags.map((value) => `<span class="tag"># ${escapeHTML(value)}</span>`).join("")}</div>
          <details class="card-details"><summary>查看正確解法</summary><p>${escapeHTML(item.correctSolution)}</p>${item.note ? `<p>提醒：${escapeHTML(item.note)}</p>` : ""}</details>
          <div class="card-actions"><time>${escapeHTML(item.date)}</time><button data-action="edit-mistake" data-id="${item.id}">編輯</button><button data-action="delete-mistake" data-id="${item.id}">刪除</button></div>
        </article>`).join("");
      $("#mistakeEmpty").classList.toggle("hidden", filtered.length > 0);
    }

    openMistake(id = "") {
      const form = $("#mistakeForm");
      form.reset();
      this.imageDraft = "";
      form.elements.id.value = id;
      form.elements.date.value = new Date().toISOString().slice(0,10);
      $("#mistakeModalTitle").textContent = id ? "編輯錯題" : "新增錯題";
      if (id) {
        const item = this.mistakes.find((entry) => entry.id === id);
        if (!item) return;
        ["question","subject","unit","difficulty","date","reason","mySolution","correctSolution","note"].forEach((key) => {
          form.elements[key].value = item[key] || "";
        });
        form.elements.tags.value = item.tags.join(", ");
        this.imageDraft = item.image || "";
      }
      this.openModal("mistakeModal");
      setTimeout(() => form.elements.question.focus(), 30);
    }

    readImage(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 1_500_000) { this.toast("圖片需小於 1.5 MB"); event.target.value = ""; return; }
      const reader = new FileReader();
      reader.onload = () => { this.imageDraft = String(reader.result); };
      reader.onerror = () => this.toast("圖片讀取失敗，請再試一次");
      reader.readAsDataURL(file);
    }

    saveMistake(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const id = data.get("id") || `m${Date.now()}`;
      const existing = this.mistakes.find((item) => item.id === id);
      const item = {
        id, question: data.get("question").trim(), subject: data.get("subject"), unit: data.get("unit").trim(),
        difficulty: data.get("difficulty"), date: data.get("date"),
        tags: data.get("tags").split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
        reason: data.get("reason").trim(), mySolution: data.get("mySolution").trim(),
        correctSolution: data.get("correctSolution").trim(), note: data.get("note").trim(),
        image: this.imageDraft, favorite: existing?.favorite || false
      };
      const index = this.mistakes.findIndex((entry) => entry.id === id);
      if (index >= 0) this.mistakes[index] = item; else this.mistakes.unshift(item);
      if (!this.store.set("mistakes", this.mistakes)) { this.toast("儲存空間不足，請移除較大的圖片"); return; }
      this.closeModals();
      this.renderMistakes(); this.renderRecent(); this.updateCounts();
      this.toast(index >= 0 ? "錯題已更新" : "錯題已加入");
    }

    deleteMistake(id) {
      const item = this.mistakes.find((entry) => entry.id === id);
      if (!item || !confirm(`確定刪除「${item.question.slice(0, 18)}…」？`)) return;
      this.mistakes = this.mistakes.filter((entry) => entry.id !== id);
      this.favorites = this.favorites.filter((entry) => !(entry.type === "mistake" && entry.id === id));
      this.store.set("mistakes", this.mistakes);
      this.store.set("favorites", this.favorites);
      this.renderMistakes(); this.renderRecent(); this.renderFavorites(); this.updateCounts();
      this.toast("錯題已刪除");
    }

    getReaderData() {
      return this.readerMode === "chinese" ? {
        tabs: ["白話翻譯","字詞整理","修辭整理","重點整理","常考觀念"],
        content: [
          ["白話翻譯","山不在於高，只要有仙人居住就會出名；水不在於深，只要有龍棲息就顯得靈驗。這是一間簡陋的屋子，只因居住者品德高尚，便不覺得簡陋。"],
          ["字詞整理","<ul><li><mark>名</mark>：出名、聞名，名詞作動詞。</li><li><mark>靈</mark>：顯得靈異、神奇。</li><li><mark>斯</mark>：這。</li><li><mark>馨</mark>：能散布到遠方的香氣，此指品德高尚。</li></ul>"],
          ["修辭整理","<ul><li><mark>類比</mark>：以「山有仙、水有龍」類比「陋室有德者」。</li><li><mark>對偶</mark>：「山不在高，有仙則名；水不在深，有龍則靈。」句式整齊。</li></ul>"],
          ["重點整理","文章核心不是描寫房屋，而是藉陋室表明作者安貧樂道、重視精神修養的價值觀。"],
          ["常考觀念","<ul><li>判斷「惟吾德馨」在文中的承接作用。</li><li>比較物質環境與精神境界。</li><li>辨識類比、對偶與借物抒情。</li></ul>"]
        ]
      } : {
        tabs: ["單字整理","文法分析","長難句拆解","重點摘要","生字收藏"],
        content: [
          ["Vocabulary","<ul><li><mark>resilience</mark> n. 韌性；復原力</li><li><mark>setback</mark> n. 挫折；阻礙</li><li><mark>adapt</mark> v. 適應；調整</li><li><mark>perspective</mark> n. 觀點；視角</li></ul>"],
          ["Grammar","主要句型為 <mark>It is not A that matters, but B</mark>，屬於強調與對比結構。that 引導的關係子句補充說明前方名詞，閱讀時可先圈出先行詞。"],
          ["Sentence Breakdown","<p><mark>Although failure can feel discouraging</mark>（讓步子句），<mark>it often provides the feedback</mark>（主要子句），<mark>that helps us adapt and grow</mark>（關係子句修飾 feedback）。</p>"],
          ["Key Summary","The passage argues that failure is valuable when we treat it as feedback. Resilience grows through reflection, adjustment, and repeated action."],
          ["Saved Words","點選單字旁的收藏按鈕後，未來可將生字同步到知識卡。目前示範詞彙：<mark>resilience</mark>、<mark>setback</mark>、<mark>adapt</mark>。"]
        ]
      };
    }

    renderReader() {
      $$("[data-reader-tab]").forEach((button) => {
        const active = button.dataset.readerTab === this.readerMode;
        button.classList.toggle("active", active); button.setAttribute("aria-selected", String(active));
      });
      $("#readerInputTitle").textContent = this.readerMode === "chinese" ? "貼上古文或文章" : "Paste an English passage";
      $("#readerText").placeholder = this.readerMode === "chinese" ? "在這裡貼上想分析的文章…" : "Paste the passage you want to analyze…";
      const data = this.getReaderData();
      $("#analysisTabs").innerHTML = data.tabs.map((tab,index) => `<button class="${index === this.readerTab ? "active" : ""}" data-analysis-tab="${index}">${tab}</button>`).join("");
      this.renderReaderOutput();
    }

    renderReaderOutput() {
      const data = this.getReaderData();
      const [title, body] = data.content[this.readerTab];
      $("#readerOutput").innerHTML = `<h3>${title}</h3><div>${body}</div>`;
      $$("[data-analysis-tab]").forEach((button,index) => button.classList.toggle("active", index === this.readerTab));
    }

    fillReaderExample() {
      $("#readerText").value = this.readerMode === "chinese"
        ? "山不在高，有仙則名。水不在深，有龍則靈。斯是陋室，惟吾德馨。"
        : "Although failure can feel discouraging, it often provides the feedback that helps us adapt and grow.";
      $("#readerText").dispatchEvent(new Event("input"));
      this.toast("已載入示範文章");
    }

    analyzeReader() {
      if (!$("#readerText").value.trim()) { this.toast("請先貼上想分析的文章"); $("#readerText").focus(); return; }
      this.readerTab = 0; this.renderReader();
      $("#readerOutput").classList.remove("page");
      this.toast("示範分析已完成");
    }

    renderScores() {
      $("#subjectScoreList").innerHTML = Object.entries(this.scores).map(([subject,score]) => `
        <div class="score-row">
          <label for="score-${subject}">${subject}</label>
          <input id="score-${subject}" type="range" min="0" max="100" value="${score}" style="--value:${score}%" data-subject="${subject}" aria-label="${subject}熟悉程度">
          <output for="score-${subject}">${score}</output>
        </div>`).join("");
      $$("[data-subject]").forEach((input) => input.addEventListener("input", (event) => {
        const value = Number(event.target.value);
        this.scores[event.target.dataset.subject] = value;
        event.target.style.setProperty("--value", `${value}%`);
        event.target.nextElementSibling.value = value;
        this.store.set("scores", this.scores);
        this.updateInsights();
      }));
      this.updateInsights();
    }

    updateInsights() {
      const sorted = Object.entries(this.scores).sort((a,b) => a[1] - b[1]);
      const weak = sorted[0], strong = sorted.at(-1);
      $("#weakSubject").textContent = `${weak[0]} · ${weak[1]}分`;
      $("#strongSubject").textContent = `${strong[0]} · ${strong[1]}分`;
      $("#priorityOrder").textContent = sorted.slice(0,3).map(([name]) => name).join(" → ");
    }

    renderHeatmap() {
      const count = this.heatView === "year" ? 364 : 35;
      const cells = [];
      for (let i = count - 1; i >= 0; i -= 1) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().slice(0,10);
        const level = this.heat[key] || 0;
        cells.push(`<button class="heat-cell" data-date="${key}" data-level="${level}" title="${key}・${level ? `${level * .5} 小時` : "尚未記錄"}" aria-label="${key}，${level ? `學習 ${level * .5} 小時` : "尚未學習"}"></button>`);
      }
      $("#heatmap").innerHTML = cells.join("");
      $("#heatmap").style.minWidth = this.heatView === "year" ? "830px" : "110px";
    }

    updateHeat(date) {
      this.heat[date] = ((this.heat[date] || 0) + 1) % 5;
      this.store.set("heat", this.heat);
      this.renderHeatmap();
      this.toast(this.heat[date] ? `已記錄 ${this.heat[date] * .5} 小時` : "已清除該日紀錄");
    }

    renderFormulas() {
      const keyword = $("#formulaSearch")?.value.trim().toLowerCase() || "";
      const subject = $("#formulaSubject")?.value || "";
      const items = this.seed.formulas.filter((item) => {
        const text = [item.name,item.formula,item.description,item.point,item.example].join(" ").toLowerCase();
        return (!keyword || text.includes(keyword)) && (!subject || item.subject === subject);
      });
      $("#formulaGrid").innerHTML = items.map((item) => `
        <article class="formula-card">
          <div class="card-top"><span class="subject-chip">${item.subject}</span><button class="favorite-btn ${this.isFavorite("formula",item.id) ? "active" : ""}" data-action="favorite-formula" data-id="${item.id}" aria-label="收藏${item.name}">♥</button></div>
          <h3>${item.name}</h3><p>${item.description}</p>
          <div class="formula">${item.formula}</div>
          <p class="exam-point"><strong>常考重點</strong><br>${item.point}</p>
          <details class="card-details"><summary>查看範例</summary><p>${item.example}</p></details>
        </article>`).join("");
    }

    renderKnowledgeMap() {
      const nodes = [
        ["物理","理解自然世界的基本規律與量化關係。"],["力學","研究物體運動與受力的關係。"],
        ["牛頓運動定律","連結力、質量與運動狀態。"],["受力分析","畫出自由體圖並拆解每一個力。"],
        ["摩擦力","方向阻礙相對運動或相對運動趨勢。"],["圓周運動","向心加速度永遠指向圓心。"]
      ];
      $("#knowledgeMap").innerHTML = nodes.map(([title,desc],index) => `
        <div class="map-node ${index === 0 ? "expanded" : ""}">
          <button aria-expanded="${index === 0}">${index + 1}. ${title}<span>＋</span></button><p>${desc}</p>
        </div>`).join("");
    }

    switchKnowledge(view) {
      $$("[data-knowledge-tab]").forEach((button) => button.classList.toggle("active", button.dataset.knowledgeTab === view));
      $$("[data-knowledge-view]").forEach((panel) => panel.classList.toggle("active", panel.dataset.knowledgeView === view));
    }

    renderFlashcard() {
      const item = this.seed.flashcards[this.flashIndex];
      $("#flashcard").classList.remove("flipped");
      $("#flashcard").setAttribute("aria-pressed", "false");
      $("#flashSubject").textContent = item.subject; $("#flashQuestion").textContent = item.question; $("#flashAnswer").textContent = item.answer;
      $("#flashProgress").textContent = `${this.flashIndex + 1} / ${this.seed.flashcards.length}`;
      $("#flashProgressBar").style.width = `${(this.flashIndex + 1) / this.seed.flashcards.length * 100}%`;
      const button = $("[data-action='favorite-card']");
      button.textContent = this.isFavorite("card", item.id) ? "♥ 已收藏" : "♡ 收藏";
    }

    changeCard(direction) {
      this.flashIndex = (this.flashIndex + direction + this.seed.flashcards.length) % this.seed.flashcards.length;
      this.renderFlashcard();
    }

    renderMajors() {
      const keyword = $("#majorSearch")?.value.trim().toLowerCase() || "";
      const items = this.seed.majors.filter((item) => Object.values(item).join(" ").toLowerCase().includes(keyword));
      $("#majorGrid").innerHTML = items.map((item) => `
        <article class="major-card">
          <div class="card-top"><span class="major-icon">${item.icon}</span><button class="favorite-btn ${this.isFavorite("major",item.id) ? "active" : ""}" data-action="favorite-major" data-id="${item.id}" aria-label="收藏${item.name}">♥</button></div>
          <h3>${item.name}</h3><p>${item.intro}</p>
          <div class="major-section"><strong>必修能力</strong><p>${item.skills}</p></div>
          <div class="major-section"><strong>適合人格</strong><p>${item.personality}</p></div>
          <details class="card-details"><summary>未來發展與常見工作</summary><p>${item.future}</p><p>${item.jobs}</p></details>
        </article>`).join("");
    }

    isFavorite(type,id) {
      if (type === "mistake") return this.favorites.some((item) => item.type === type && item.id === id) || this.mistakes.find((item) => item.id === id)?.favorite;
      return this.favorites.some((item) => item.type === type && item.id === id);
    }

    toggleFavorite(type,id) {
      const index = this.favorites.findIndex((item) => item.type === type && item.id === id);
      if (index >= 0) this.favorites.splice(index,1); else this.favorites.push({ type,id });
      if (type === "mistake") {
        const mistake = this.mistakes.find((item) => item.id === id);
        if (mistake) mistake.favorite = index < 0;
        this.store.set("mistakes", this.mistakes);
      }
      this.store.set("favorites", this.favorites);
      this.renderMistakes(); this.renderFormulas(); this.renderMajors(); this.renderFlashcard(); this.renderFavorites(); this.updateCounts();
      this.toast(index >= 0 ? "已取消收藏" : "已加入收藏");
    }

    getFavoriteItem(entry) {
      const maps = {
        mistake: [this.mistakes, "錯題", "question", "correctSolution", "mistakes"],
        formula: [this.seed.formulas, "公式", "name", "formula", "knowledge"],
        card: [this.seed.flashcards, "知識卡", "question", "answer", "knowledge"],
        major: [this.seed.majors, "科系", "name", "intro", "explore"]
      };
      const [list,label,titleKey,descKey,page] = maps[entry.type];
      const item = list.find((value) => value.id === entry.id);
      return item ? { ...item, type:entry.type, label, title:item[titleKey], desc:item[descKey], page } : null;
    }

    renderFavorites() {
      const items = this.favorites.map((entry) => this.getFavoriteItem(entry)).filter(Boolean)
        .filter((item) => this.favoriteFilter === "all" || item.type === this.favoriteFilter);
      $("#favoriteGrid").innerHTML = items.map((item) => `
        <article class="favorite-card">
          <small>${item.label}</small><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.desc)}</p>
          <button class="favorite-btn active" data-action="remove-favorite" data-type="${item.type}" data-id="${item.id}" aria-label="取消收藏">♥</button>
        </article>`).join("");
      $("#favoriteEmpty").classList.toggle("hidden", items.length > 0);
    }

    updateCounts() {
      const count = this.favorites.length;
      $("#mistakeNavCount").textContent = this.mistakes.length;
      $("#mistakeStat").innerHTML = `${this.mistakes.length} <small>題</small>`;
      $("#favoriteNavCount").textContent = count;
      $("#favoriteStat").innerHTML = `${count} <small>項</small>`;
    }

    renderGlobalSearch(query) {
      const box = $("#searchResults");
      const keyword = query.trim().toLowerCase();
      if (!keyword) { box.classList.remove("show"); return; }
      const pool = [
        ...this.mistakes.map((item) => ({ title:item.question, meta:`錯題 · ${item.subject}`, page:"mistakes", icon:"✎" })),
        ...this.seed.formulas.map((item) => ({ title:item.name, meta:`公式 · ${item.subject}`, page:"knowledge", icon:"ƒ" })),
        ...this.seed.flashcards.map((item) => ({ title:item.question, meta:`知識卡 · ${item.subject}`, page:"knowledge", icon:"◇" })),
        ...this.seed.majors.map((item) => ({ title:item.name, meta:`科系 · ${item.jobs}`, page:"explore", icon:"◎" }))
      ];
      const matches = pool.filter((item) => `${item.title} ${item.meta}`.toLowerCase().includes(keyword)).slice(0,7);
      box.innerHTML = matches.length ? matches.map((item) => `
        <button class="search-result" role="option" data-page="${item.page}"><i>${item.icon}</i><span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.meta)}</small></span><b>→</b></button>`).join("")
        : `<div class="empty-state" style="padding:25px"><p>找不到「${escapeHTML(query)}」</p></div>`;
      box.classList.add("show");
    }

    openModal(id) {
      const modal = $(`#${id}`);
      modal.hidden = false;
      document.body.style.overflow = "hidden";
    }

    closeModals() {
      $$(".modal").forEach((modal) => { modal.hidden = true; });
      document.body.style.overflow = "";
    }

    syncActiveButtons(selector, activeButton) {
      $$(selector).forEach((button) => button.classList.toggle("active", button === activeButton));
    }

    addRipple(button,event) {
      const wave = document.createElement("span");
      const rect = button.getBoundingClientRect();
      wave.className = "ripple-wave";
      wave.style.left = `${event.clientX - rect.left}px`;
      wave.style.top = `${event.clientY - rect.top}px`;
      button.append(wave);
      setTimeout(() => wave.remove(), 600);
    }

    toast(message) {
      const node = document.createElement("div");
      node.className = "toast";
      node.textContent = message;
      $("#toastRegion").append(node);
      setTimeout(() => node.remove(), 2800);
    }

    openModalAndFocus() { /* 預留：未來串接 AI API 時可集中管理焦點。 */ }
  }

  document.addEventListener("DOMContentLoaded", () => {
    try {
      const app = new StudyHubApp();
      app.init();
      $("#menuButton").addEventListener("click", () => app.toggleMenu());
      $("#flashcard").addEventListener("click", (event) => {
        event.currentTarget.classList.toggle("flipped");
        event.currentTarget.setAttribute("aria-pressed", String(event.currentTarget.classList.contains("flipped")));
      });
    } catch (error) {
      console.error("StudyHub 初始化失敗：", error);
      document.body.insertAdjacentHTML("beforeend", '<p style="position:fixed;bottom:16px;left:16px;padding:12px;background:#fff;border:1px solid #ddd;border-radius:10px">載入時發生問題，請重新整理頁面。</p>');
    }
  });
})();
