const STORAGE_KEY = "grade-radar-v1";
const colors = ["coral", "green", "gold", "blue", "purple"];
const seedData = {
  subjects: [
    { id: "chinese", name: "國文", credits: 3, color: "coral", assessments: [{ id: "c1", name: "第一次段考", score: 78, weight: 40 }, { id: "c2", name: "閱讀報告", score: 86, weight: 20 }] },
    { id: "english", name: "英文", credits: 3, color: "green", assessments: [{ id: "e1", name: "第一次段考", score: 88, weight: 40 }, { id: "e2", name: "口說測驗", score: 92, weight: 20 }] },
    { id: "math", name: "數學", credits: 4, color: "gold", assessments: [{ id: "m1", name: "第一次段考", score: 72, weight: 40 }, { id: "m2", name: "平時小考", score: 80, weight: 20 }] },
    { id: "physics", name: "物理", credits: 3, color: "blue", assessments: [{ id: "p1", name: "第一次段考", score: 84, weight: 35 }, { id: "p2", name: "實驗報告", score: 78, weight: 25 }] }
  ],
  lastTarget: 80
};

let state = loadState();
const $ = (selector) => document.querySelector(selector);

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return structuredClone(seedData);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function subjectAverage(subject) {
  const totalWeight = subject.assessments.reduce((sum, item) => sum + Number(item.weight), 0);
  if (!totalWeight) return null;
  const points = subject.assessments.reduce((sum, item) => sum + Number(item.score) * Number(item.weight), 0);
  return points / totalWeight;
}

function semesterAverage() {
  const graded = state.subjects.filter((subject) => subjectAverage(subject) !== null);
  const credits = graded.reduce((sum, subject) => sum + Number(subject.credits), 0);
  if (!credits) return null;
  return graded.reduce((sum, subject) => sum + subjectAverage(subject) * Number(subject.credits), 0) / credits;
}

function initials(name) {
  return [...name].slice(0, 2).join("");
}

function render() {
  const average = semesterAverage();
  const credits = state.subjects.reduce((sum, subject) => sum + Number(subject.credits), 0);
  const assessments = state.subjects.reduce((sum, subject) => sum + subject.assessments.length, 0);
  const graded = state.subjects.filter((subject) => subjectAverage(subject) !== null);
  const highest = [...graded].sort((a, b) => subjectAverage(b) - subjectAverage(a))[0];

  $("#semesterAverage").textContent = average === null ? "—" : average.toFixed(1);
  $("#averageBar").style.width = `${Math.min(100, average || 0)}%`;
  $("#subjectCount").textContent = `${state.subjects.length} 個科目`;
  $("#creditCount").textContent = `${credits} 學分`;
  $("#assessmentCount").textContent = `${assessments} 次`;
  $("#highestSubject").textContent = highest ? `${highest.name} · ${subjectAverage(highest).toFixed(1)}` : "—";
  const target = Number(state.lastTarget);
  $("#targetGap").textContent = average === null ? "尚未設定" : average >= target ? `高於 ${target} 分目標` : `還差 ${(target - average).toFixed(1)} 分`;

  renderSubjects();
  renderSubjectOptions();
}

function renderSubjects() {
  const grid = $("#subjectGrid");
  if (!state.subjects.length) {
    grid.innerHTML = '<div class="empty-state">還沒有科目。按下方按鈕建立第一個科目吧。</div>';
    return;
  }
  grid.innerHTML = state.subjects.map((subject) => {
    const average = subjectAverage(subject);
    const weight = subject.assessments.reduce((sum, item) => sum + Number(item.weight), 0);
    const rows = subject.assessments.length ? subject.assessments.map((item) => `
      <div class="assessment">
        <span class="assessment-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
        <span class="assessment-score">${Number(item.score).toFixed(1)}</span>
        <span class="assessment-weight">${item.weight}%</span>
        <button class="remove-score" data-action="remove-score" data-subject="${subject.id}" data-id="${item.id}" aria-label="刪除 ${escapeHtml(item.name)}">×</button>
      </div>`).join("") : '<div class="empty-scores">尚未加入評量成績</div>';
    return `<article class="subject-card">
      <div class="subject-head">
        <span class="subject-badge ${subject.color}">${escapeHtml(initials(subject.name))}</span>
        <div class="subject-title"><h3>${escapeHtml(subject.name)}</h3><p>${subject.credits} 學分 · ${subject.assessments.length} 筆成績</p></div>
        <div class="subject-score"><strong>${average === null ? "—" : average.toFixed(1)}</strong><span>目前平均</span></div>
        <button class="menu-button" data-action="remove-subject" data-id="${subject.id}" title="刪除科目" aria-label="刪除 ${escapeHtml(subject.name)}">×</button>
      </div>
      <div class="score-progress"><i style="width:${Math.min(100, average || 0)}%"></i></div>
      <div class="assessment-list">${rows}</div>
      <div class="subject-foot"><span class="weight-total ${weight > 100 ? "warn" : ""}">已記錄占比 ${weight}%${weight > 100 ? "（超過 100%）" : ""}</span><button class="add-score" data-action="add-score" data-id="${subject.id}">＋ 加入評量</button></div>
    </article>`;
  }).join("");
}

function renderSubjectOptions() {
  const select = $("#simSubject");
  const current = select.value;
  select.innerHTML = state.subjects.map((subject) => `<option value="${subject.id}">${escapeHtml(subject.name)}（${subject.credits} 學分）</option>`).join("");
  if (state.subjects.some((subject) => subject.id === current)) select.value = current;
  $("#simForm button[type=submit]").disabled = !state.subjects.length;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function openSubjectModal() {
  $("#subjectForm").reset();
  $("#subjectCredits").value = 3;
  $("#subjectColor").value = colors[state.subjects.length % colors.length];
  $("#subjectModal").showModal();
  setTimeout(() => $("#subjectName").focus(), 50);
}

function openAssessmentModal(subjectId) {
  const subject = state.subjects.find((item) => item.id === subjectId);
  if (!subject) return;
  $("#assessmentForm").reset();
  $("#assessmentSubjectId").value = subject.id;
  $("#assessmentSubjectLabel").textContent = `正在新增「${subject.name}」的評量成績`;
  $("#assessmentModal").showModal();
  setTimeout(() => $("#assessmentName").focus(), 50);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

$("#subjectForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#subjectName").value.trim();
  const credits = Number($("#subjectCredits").value);
  if (!name || !credits) return;
  state.subjects.push({ id: uid(), name, credits, color: $("#subjectColor").value, assessments: [] });
  saveState(); render(); $("#subjectModal").close(); showToast(`已新增「${name}」`);
});

$("#assessmentForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const subject = state.subjects.find((item) => item.id === $("#assessmentSubjectId").value);
  if (!subject) return;
  subject.assessments.push({ id: uid(), name: $("#assessmentName").value.trim(), score: Number($("#assessmentScore").value), weight: Number($("#assessmentWeight").value) });
  saveState(); render(); $("#assessmentModal").close(); showToast("成績已加入計算");
});

$("#subjectGrid").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "add-score") openAssessmentModal(button.dataset.id);
  if (button.dataset.action === "remove-score") {
    const subject = state.subjects.find((item) => item.id === button.dataset.subject);
    if (subject) subject.assessments = subject.assessments.filter((item) => item.id !== button.dataset.id);
    saveState(); render(); showToast("已刪除這筆成績");
  }
  if (button.dataset.action === "remove-subject") {
    const subject = state.subjects.find((item) => item.id === button.dataset.id);
    if (subject && confirm(`要刪除「${subject.name}」和其中所有成績嗎？`)) {
      state.subjects = state.subjects.filter((item) => item.id !== subject.id);
      saveState(); render(); showToast("科目已刪除");
    }
  }
});

$("#simForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const selected = state.subjects.find((subject) => subject.id === $("#simSubject").value);
  const nextWeight = Number($("#nextWeight").value);
  const target = Number($("#targetAverage").value);
  const result = $("#simResult");
  if (!selected || !nextWeight) return;
  state.lastTarget = target; saveState();

  const graded = state.subjects.filter((subject) => subjectAverage(subject) !== null || subject.id === selected.id);
  const totalCredits = graded.reduce((sum, subject) => sum + Number(subject.credits), 0);
  const otherPoints = graded.filter((subject) => subject.id !== selected.id).reduce((sum, subject) => sum + subjectAverage(subject) * Number(subject.credits), 0);
  const existingWeight = selected.assessments.reduce((sum, item) => sum + Number(item.weight), 0);
  const existingPoints = selected.assessments.reduce((sum, item) => sum + Number(item.score) * Number(item.weight), 0);
  const neededSubjectAverage = (target * totalCredits - otherPoints) / Number(selected.credits);
  const neededScore = (neededSubjectAverage * (existingWeight + nextWeight) - existingPoints) / nextWeight;

  result.className = "sim-result";
  result.querySelector("strong").textContent = Number.isFinite(neededScore) ? neededScore.toFixed(1) : "—";
  if (neededScore > 100) {
    result.classList.add("impossible");
    result.querySelector("p").textContent = `單次滿分仍不足；若考 100 分，學期平均約為 ${projectedAverage(selected, 100, nextWeight).toFixed(1)}。`;
  } else if (neededScore <= 0) {
    result.classList.add("easy");
    result.querySelector("strong").textContent = "已達標";
    result.querySelector("p").textContent = `即使這次是 0 分，預估仍可維持 ${target.toFixed(1)} 的學期平均。`;
  } else {
    result.querySelector("p").textContent = `在「${selected.name}」下次占比 ${nextWeight}% 的評量中，至少需要這個分數。`;
  }
  render();
});

function projectedAverage(selected, nextScore, nextWeight) {
  const graded = state.subjects.filter((subject) => subjectAverage(subject) !== null || subject.id === selected.id);
  const totalCredits = graded.reduce((sum, subject) => sum + Number(subject.credits), 0);
  const points = graded.reduce((sum, subject) => {
    if (subject.id !== selected.id) return sum + subjectAverage(subject) * Number(subject.credits);
    const oldWeight = subject.assessments.reduce((s, item) => s + Number(item.weight), 0);
    const oldPoints = subject.assessments.reduce((s, item) => s + Number(item.score) * Number(item.weight), 0);
    return sum + ((oldPoints + nextScore * nextWeight) / (oldWeight + nextWeight)) * Number(subject.credits);
  }, 0);
  return points / totalCredits;
}

$("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = `grade-radar-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  URL.revokeObjectURL(link.href); showToast("備份已下載");
});

$("#importBtn").addEventListener("click", () => $("#importFile").click());
$("#importFile").addEventListener("change", async (event) => {
  const file = event.target.files[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.subjects)) throw new Error();
    state = data; saveState(); render(); showToast("備份已還原");
  } catch (_) { alert("這個檔案不是有效的成績雷達備份。"); }
  event.target.value = "";
});

$("#openSubjectModal").addEventListener("click", openSubjectModal);
$("#addSubjectCard").addEventListener("click", openSubjectModal);
document.querySelectorAll(".nav-button").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.scroll).scrollIntoView({ behavior: "smooth" })));
document.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }));

render();
