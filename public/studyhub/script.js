import { formulaCatalog } from "./formula-data.js";
import { classicFifteen } from "./classics-data.js";

(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const READER_AI_API = "https://studyhub-ai-api.jimmy980821.workers.dev/analyze";
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
      this.readerAnalysis = null;
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
          { id:"m01", subject:"數學", name:"二次方程式公式解", formula:"x = (−b ± √(b²−4ac)) / 2a", description:"求 ax²+bx+c=0 的根。", point:"先確認 a ≠ 0，並留意 ± 會產生兩個可能解。", example:"x²−5x+6=0，得 x=2 或 3。" },
          { id:"m02", subject:"數學", name:"判別式", formula:"Δ = b² − 4ac", description:"判斷二次方程式實根的個數。", point:"Δ>0 兩相異實根；Δ=0 重根；Δ<0 無實根。", example:"x²+2x+5=0 的 Δ=−16，無實根。" },
          { id:"m03", subject:"數學", name:"根與係數關係", formula:"α+β = −b/a；αβ = c/a", description:"連結二次方程式兩根與係數。", point:"不必真正解出兩根，也能求對稱式。", example:"2x²−5x+3=0，兩根和為 5/2、積為 3/2。" },
          { id:"m04", subject:"數學", name:"等差數列通項", formula:"aₙ = a₁ + (n−1)d", description:"由首項與公差求第 n 項。", point:"項數從 1 開始，因此是 n−1 個公差。", example:"3,7,11,… 的第 10 項為 39。" },
          { id:"m05", subject:"數學", name:"等差級數總和", formula:"Sₙ = n(a₁+aₙ)/2", description:"首末項平均後乘以項數。", point:"也可寫成 Sₙ=n[2a₁+(n−1)d]/2。", example:"1+4+…+28 = 10×29/2 = 145。" },
          { id:"m06", subject:"數學", name:"等比數列通項", formula:"aₙ = a₁rⁿ⁻¹", description:"由首項與公比求第 n 項。", point:"公比 r 可為負數，需注意正負交錯。", example:"2,6,18,… 的第 5 項為 162。" },
          { id:"m07", subject:"數學", name:"等比級數總和", formula:"Sₙ = a₁(1−rⁿ)/(1−r)", description:"計算有限等比級數，條件為 r≠1。", point:"若 r=1，則 Sₙ=na₁。", example:"1+2+4+8=15。" },
          { id:"m08", subject:"數學", name:"排列數", formula:"P(n,r) = n!/(n−r)!", description:"從 n 個相異物中取 r 個並排列。", point:"排列重視順序。", example:"5 人選正副班長：P(5,2)=20。" },
          { id:"m09", subject:"數學", name:"組合數", formula:"C(n,r) = n!/[r!(n−r)!]", description:"從 n 個相異物中選 r 個，不計順序。", point:"C(n,r)=C(n,n−r)。", example:"5 人選 2 人代表：C(5,2)=10。" },
          { id:"m10", subject:"數學", name:"二項式定理", formula:"(a+b)ⁿ = Σ C(n,k)aⁿ⁻ᵏbᵏ", description:"展開二項式的 n 次方。", point:"第 k+1 項係數為 C(n,k)。", example:"(a+b)³=a³+3a²b+3ab²+b³。" },
          { id:"m11", subject:"數學", name:"條件機率", formula:"P(A|B) = P(A∩B)/P(B)", description:"已知 B 發生時 A 發生的機率。", point:"分母是已知條件 B 的機率。", example:"由撲克牌已知為紅牌，抽到紅心的機率為 1/2。" },
          { id:"m12", subject:"數學", name:"貝氏定理", formula:"P(A|B)=P(B|A)P(A)/P(B)", description:"由結果反推原因的條件機率。", point:"常搭配全機率公式求 P(B)。", example:"利用檢驗陽性率與盛行率估計真正患病機率。" },
          { id:"m13", subject:"數學", name:"三角基本關係", formula:"sin²θ + cos²θ = 1", description:"正弦與餘弦最重要的基本恆等式。", point:"可推得 1+tan²θ=sec²θ。", example:"若 sinθ=3/5 且 θ 為銳角，則 cosθ=4/5。" },
          { id:"m14", subject:"數學", name:"正弦定理", formula:"a/sinA = b/sinB = c/sinC = 2R", description:"連結三角形邊長、對角與外接圓半徑。", point:"已知兩角一邊或兩邊一對角時常用。", example:"a=6、A=30°，則外接圓半徑 R=6。" },
          { id:"m15", subject:"數學", name:"餘弦定理", formula:"c² = a²+b²−2ab cosC", description:"非直角三角形的畢氏定理推廣。", point:"已知兩邊夾角或三邊求角時使用。", example:"a=b=5、C=60°，則 c=5。" },
          { id:"m16", subject:"數學", name:"兩點距離", formula:"d = √[(x₂−x₁)²+(y₂−y₁)²]", description:"求平面座標中兩點的直線距離。", point:"本質為畢氏定理。", example:"(1,2) 與 (4,6) 距離為 5。" },
          { id:"m17", subject:"數學", name:"直線斜率", formula:"m = (y₂−y₁)/(x₂−x₁)", description:"表示直線的傾斜程度。", point:"鉛直線 x₂=x₁，斜率不存在。", example:"(1,2)、(3,6) 所在直線斜率為 2。" },
          { id:"m18", subject:"數學", name:"圓的標準式", formula:"(x−h)²+(y−k)² = r²", description:"圓心為 (h,k)、半徑為 r 的圓。", point:"一般式可用配方法化為標準式。", example:"(x−2)²+(y+1)²=9，圓心 (2,−1)、半徑 3。" },
          { id:"m19", subject:"數學", name:"對數運算律", formula:"log(ab)=log a+log b", description:"將乘除與次方轉換成加減與倍數。", point:"另有 log(a/b)=log a−log b、log(aʳ)=r log a。", example:"log₂8=3。" },
          { id:"m20", subject:"數學", name:"算術平均數", formula:"x̄ = Σxᵢ/n", description:"資料總和除以資料個數。", point:"易受極端值影響。", example:"2,4,9 的平均數為 5。" },
          { id:"m21", subject:"數學", name:"標準差", formula:"σ = √[Σ(xᵢ−x̄)²/n]", description:"衡量資料離散程度。", point:"標準差越大，資料越分散。", example:"所有數值相同時標準差為 0。" },
          { id:"m22", subject:"數學", name:"導數定義", formula:"f′(x)=limₕ→₀ [f(x+h)−f(x)]/h", description:"函數在某點的瞬時變化率與切線斜率。", point:"冪次法則：(xⁿ)′=nxⁿ⁻¹。", example:"f(x)=x²，則 f′(x)=2x。" },
          { id:"m23", subject:"數學", name:"定積分與面積", formula:"∫ₐᵇ f(x)dx = F(b)−F(a)", description:"由反導函數計算帶符號面積。", point:"圖形在 x 軸下方時積分值為負。", example:"∫₀² x dx = 2。" },

          { id:"p01", subject:"物理", name:"平均速度", formula:"v̄ = Δx/Δt", description:"位移變化量除以時間。", point:"速度含方向，與速率不同。", example:"向東 100 m 用時 20 s，平均速度為向東 5 m/s。" },
          { id:"p02", subject:"物理", name:"等加速度速度公式", formula:"v = v₀ + at", description:"加速度固定時的末速度。", point:"正負號必須符合選定的正方向。", example:"由靜止以 2 m/s² 加速 3 s，末速 6 m/s。" },
          { id:"p03", subject:"物理", name:"等加速度位移公式", formula:"Δx = v₀t + ½at²", description:"加速度固定時的位移。", point:"自由落體可令 a=g，方向決定正負。", example:"靜止落下 2 s，位移約 19.6 m。" },
          { id:"p04", subject:"物理", name:"無時間等加速度公式", formula:"v² = v₀² + 2aΔx", description:"題目未給時間時連結速度與位移。", point:"只適用等加速度運動。", example:"由靜止加速 10 m、a=2 m/s²，末速 √40 m/s。" },
          { id:"p05", subject:"物理", name:"牛頓第二運動定律", formula:"ΣF = ma", description:"合力等於質量乘以加速度。", point:"先畫自由體圖，再依方向分量列式。", example:"2 kg 物體受 10 N 合力，加速度 5 m/s²。" },
          { id:"p06", subject:"物理", name:"摩擦力", formula:"fₛ ≤ μₛN；fₖ = μₖN", description:"靜摩擦力會隨外力調整；動摩擦力為定值模型。", point:"靜摩擦力不一定等於 μₛN。", example:"最大靜摩擦力為 μₛN。" },
          { id:"p07", subject:"物理", name:"功", formula:"W = Fs cosθ", description:"恆力對物體位移所做的功。", point:"力與位移垂直時不做功。", example:"10 N 力同向推 3 m，做功 30 J。" },
          { id:"p08", subject:"物理", name:"動能", formula:"K = ½mv²", description:"物體因運動具有的能量。", point:"功—能定理：W合=ΔK。", example:"2 kg 物體速率 3 m/s，動能 9 J。" },
          { id:"p09", subject:"物理", name:"重力位能", formula:"U = mgh", description:"近地表重力場中的位能差。", point:"零位能面可自行選擇，只看位能差。", example:"2 kg 物體升高 5 m，位能增加約 98 J。" },
          { id:"p10", subject:"物理", name:"動量與衝量", formula:"p = mv；J = FΔt = Δp", description:"衝量等於動量變化量。", point:"動量是向量，碰撞前後方向要帶正負。", example:"平均力 20 N 作用 0.5 s，衝量 10 N·s。" },
          { id:"p11", subject:"物理", name:"向心加速度", formula:"a꜀ = v²/r = ω²r", description:"圓周運動加速度指向圓心。", point:"向心力不是新種類的力，而是指向圓心的合力。", example:"v=4 m/s、r=2 m，a꜀=8 m/s²。" },
          { id:"p12", subject:"物理", name:"萬有引力", formula:"F = Gm₁m₂/r²", description:"兩質點間引力與質量乘積成正比、距離平方成反比。", point:"r 是兩物體質心距離。", example:"距離加倍，引力變為 1/4。" },
          { id:"p13", subject:"物理", name:"庫侖定律", formula:"F = k|q₁q₂|/r²", description:"兩點電荷間靜電力。", point:"同號相斥、異號相吸，方向沿兩電荷連線。", example:"距離變 3 倍，電力變為 1/9。" },
          { id:"p14", subject:"物理", name:"電場與電位", formula:"E = F/q；V = U/q", description:"單位正電荷受到的力與具有的位能。", point:"E 是向量；V 是純量。", example:"2 C 電荷在 10 V 處的電位能為 20 J。" },
          { id:"p15", subject:"物理", name:"歐姆定律", formula:"V = IR", description:"歐姆元件兩端電壓與電流成正比。", point:"斜率依圖軸可能代表 R 或 1/R。", example:"12 V 加在 4 Ω 電阻，電流 3 A。" },
          { id:"p16", subject:"物理", name:"電功率", formula:"P = IV = I²R = V²/R", description:"電能轉換的速率。", point:"依已知量選最方便的形式。", example:"110 V、2 A 電器功率 220 W。" },
          { id:"p17", subject:"物理", name:"電阻串並聯", formula:"R串=ΣR；1/R並=Σ(1/R)", description:"串聯電流相同；並聯電壓相同。", point:"並聯等效電阻小於任一支路電阻。", example:"兩個 6 Ω 並聯，等效 3 Ω。" },
          { id:"p18", subject:"物理", name:"波速", formula:"v = fλ", description:"波速等於頻率乘以波長。", point:"跨介質時頻率不變，波速與波長改變。", example:"f=500 Hz、λ=0.68 m，v=340 m/s。" },
          { id:"p19", subject:"物理", name:"薄透鏡公式", formula:"1/f = 1/p + 1/q", description:"連結焦距、物距與像距。", point:"正負號依課本採用的符號規則判定。", example:"f=10 cm、p=30 cm，像距 q=15 cm。" },
          { id:"p20", subject:"物理", name:"光子能量", formula:"E = hf = hc/λ", description:"單一光子的能量。", point:"頻率越高、波長越短，光子能量越大。", example:"紫光光子能量高於紅光。" },

          { id:"c01", subject:"化學", name:"莫耳數", formula:"n = m/M", description:"質量除以莫耳質量。", point:"m 與 M 的質量單位要一致。", example:"18 g 水為 1 mol。" },
          { id:"c02", subject:"化學", name:"粒子數", formula:"N = nNₐ", description:"莫耳數乘以亞佛加厥常數。", point:"Nₐ≈6.02×10²³ mol⁻¹。", example:"1 mol 氧分子含 6.02×10²³ 個 O₂。" },
          { id:"c03", subject:"化學", name:"體積莫耳濃度", formula:"M = n/V", description:"每公升溶液所含溶質莫耳數。", point:"V 必須以 L 代入。", example:"0.5 mol 溶質配成 2 L，濃度 0.25 M。" },
          { id:"c04", subject:"化學", name:"稀釋公式", formula:"M₁V₁ = M₂V₂", description:"稀釋前後溶質莫耳數不變。", point:"兩側體積單位需一致。", example:"1 M、20 mL 稀釋成 0.2 M，終體積 100 mL。" },
          { id:"c05", subject:"化學", name:"理想氣體方程式", formula:"PV = nRT", description:"連結理想氣體壓力、體積、莫耳數與溫度。", point:"溫度必須使用 K，R 的數值需配合單位。", example:"定溫下壓力加倍，體積變為一半。" },
          { id:"c06", subject:"化學", name:"道耳頓分壓定律", formula:"P總 = ΣPᵢ；Pᵢ = XᵢP總", description:"混合氣體總壓等於各成分分壓總和。", point:"莫耳分率 Xᵢ=nᵢ/n總。", example:"等莫耳兩氣體混合，各分壓為總壓一半。" },
          { id:"c07", subject:"化學", name:"反應速率", formula:"rate = −Δ[反應物]/Δt", description:"單位時間內濃度變化量。", point:"依化學計量係數換算各物種速率。", example:"反應物 10 s 內減少 0.2 M，平均速率 0.02 M/s。" },
          { id:"c08", subject:"化學", name:"平衡常數", formula:"Kc = [C]ᶜ[D]ᵈ / [A]ᵃ[B]ᵇ", description:"aA+bB⇌cC+dD 的濃度平衡常數。", point:"純固體與純液體不列入 Kc。", example:"Kc 很大代表平衡偏向生成物。" },
          { id:"c09", subject:"化學", name:"水的離子積", formula:"Kw = [H⁺][OH⁻] = 1.0×10⁻¹⁴", description:"25°C 水溶液中氫離子與氫氧根濃度乘積。", point:"pH+pOH=14 僅適用 25°C。", example:"[H⁺]=10⁻³ M，則 [OH⁻]=10⁻¹¹ M。" },
          { id:"c10", subject:"化學", name:"酸鹼值", formula:"pH = −log[H⁺]", description:"以對數表示氫離子濃度。", point:"強酸完全解離時仍要先依係數求 [H⁺]。", example:"[H⁺]=10⁻⁴ M，pH=4。" },
          { id:"c11", subject:"化學", name:"弱酸解離常數", formula:"Ka = [H⁺][A⁻]/[HA]", description:"衡量弱酸在水中的解離程度。", point:"Ka 越大，酸性越強。", example:"同濃度下 Ka 較大的酸通常 pH 較低。" },
          { id:"c12", subject:"化學", name:"氧化數總和", formula:"Σ(氧化數×原子數) = 粒子電荷", description:"判定元素氧化數並配平氧化還原反應。", point:"氧化數上升為氧化，下降為還原。", example:"SO₄²⁻ 中 S 的氧化數為 +6。" },
          { id:"c13", subject:"化學", name:"電解法拉第定律", formula:"Q = It；n(e⁻)=Q/F", description:"電量與通過的電子莫耳數關係。", point:"F≈96500 C/mol e⁻。", example:"通過 96500 C 約等於 1 mol 電子。" },
          { id:"c14", subject:"化學", name:"熱量計算", formula:"q = mcΔT", description:"物質因溫度改變吸收或放出的熱量。", point:"系統吸熱 q>0；放熱 q<0，注意題目定義。", example:"100 g 水升溫 10°C，吸熱約 4180 J。" },
          { id:"c15", subject:"化學", name:"反應焓與生成焓", formula:"ΔH°rxn = ΣnΔH°f(生成物) − ΣnΔH°f(反應物)", description:"由標準生成焓計算反應焓。", point:"各物質前係數要乘進去。", example:"燃燒反應通常 ΔH<0。" },
          { id:"c16", subject:"化學", name:"溶度積", formula:"Ksp = [Mᵐ⁺]ᵃ[Xⁿ⁻]ᵇ", description:"難溶鹽溶解平衡的平衡常數。", point:"離子積 Qsp>Ksp 時會產生沉澱。", example:"AgCl 的 Ksp=[Ag⁺][Cl⁻]。" }
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
        scores: { "國文": 0, "英文": 0, "數學": 0, "自然": 0, "社會": 0 }
      };

      // 化學暫沿用原學測整理；數學與物理改讀獨立資料模組，方便持續擴充。
      const chemistryFormulas = this.seed.formulas
        .filter((item) => item.subject === "化學")
        .map((item) => ({
          ...item,
          volume: "學測化學",
          symbols: "各代號依題目所給物理量與單位判讀。"
        }));
      this.seed.formulas = [...formulaCatalog, ...chemistryFormulas];

      // 個人資料一律從空白開始，避免把示範內容誤當成李同學的紀錄。
      this.mistakes = this.store.get("mistakes-v2", []);
      this.favorites = this.store.get("favorites-v2", []);
      this.scores = this.store.get("scores-v2", this.seed.scores);
      this.heat = this.store.get("heat-v2", {});
      this.tasks = this.store.get("tasks-v1", []);
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
      $("#formulaVolume").addEventListener("change", () => this.renderFormulas());
      $("#majorSearch").addEventListener("input", () => this.renderMajors());
      $("#readerText").addEventListener("input", (event) => {
        if (event.target.value.length > 3000) event.target.value = event.target.value.slice(0, 3000);
        $("#readerCount").textContent = `${event.target.value.length} / 3000 字`;
      });
      $("#mistakeForm").addEventListener("submit", (event) => this.saveMistake(event));
      $("#mistakeForm [name='image']").addEventListener("change", (event) => this.readImage(event));
      $("#taskForm").addEventListener("submit", (event) => this.addTask(event));
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
      if (readerTab) { this.readerMode = readerTab.dataset.readerTab; this.readerTab = 0; this.readerAnalysis = null; this.renderReader(); return; }
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
        "record-today": () => this.recordToday(),
        "focus-task": () => this.focusTaskForm(),
        "toggle-task": () => this.toggleTask(element.dataset.id, element.checked),
        "edit-task": () => this.editTask(element.dataset.id),
        "delete-task": () => this.deleteTask(element.dataset.id),
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
        "load-classic": () => this.loadClassic(),
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
      this.renderTasks();
      this.updateCounts();
      this.updateDashboard();
    }

    renderRecent() {
      const items = [...this.mistakes].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 3);
      $("#recentList").innerHTML = items.length ? items.map((item) => `
        <a class="recent-item" href="#mistakes" data-page-link="mistakes">
          <span>${escapeHTML(item.subject.slice(0,1))}</span>
          <span><strong>${escapeHTML(item.question)}</strong><small>${escapeHTML(item.subject)} · ${escapeHTML(item.unit)}</small></span>
          <time>${escapeHTML(item.date.slice(5).replace("-", "/"))}</time>
        </a>`).join("") : `
        <div class="record-empty">
          <span class="stat-icon violet">✎</span>
          <h3>還沒有新增內容</h3>
          <p>你新增的錯題會顯示在這裡。</p>
          <button class="secondary-btn" data-action="add-mistake">＋ 新增第一題</button>
        </div>`;
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
      if (!this.store.set("mistakes-v2", this.mistakes)) { this.toast("儲存空間不足，請移除較大的圖片"); return; }
      this.closeModals();
      this.renderMistakes(); this.renderRecent(); this.updateCounts();
      this.toast(index >= 0 ? "錯題已更新" : "錯題已加入");
    }

    deleteMistake(id) {
      const item = this.mistakes.find((entry) => entry.id === id);
      if (!item || !confirm(`確定刪除「${item.question.slice(0, 18)}…」？`)) return;
      this.mistakes = this.mistakes.filter((entry) => entry.id !== id);
      this.favorites = this.favorites.filter((entry) => !(entry.type === "mistake" && entry.id === id));
      this.store.set("mistakes-v2", this.mistakes);
      this.store.set("favorites-v2", this.favorites);
      this.renderMistakes(); this.renderRecent(); this.renderFavorites(); this.updateCounts();
      this.toast("錯題已刪除");
    }

    getReaderData() {
      if (this.readerAnalysis?.mode === this.readerMode) return this.readerAnalysis;
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

    detectClassic(text) {
      const ranked = classicFifteen.map((item) => {
        const markerScore = item.markers.reduce((score, marker) => score + (text.includes(marker) ? Math.max(2, marker.length) : 0), 0);
        const titleScore = text.includes(item.title) ? 20 : 0;
        const authorScore = text.includes(item.author.replace(/[《》]/g, "")) ? 4 : 0;
        return { item, score: markerScore + titleScore + authorScore };
      }).sort((a, b) => b.score - a.score);
      return ranked[0]?.score > 0 ? ranked[0].item : null;
    }

    analyzeChinese(text) {
      const original = text.replace(/\s+/g, " ").trim();
      const detectedClassic = this.detectClassic(original);
      const entries = [
        ["學而時習之","學習後按時溫習所學","「時」是按時；「習」是溫習、實踐。"],
        ["不亦說乎","不也是很喜悅的事嗎","「說」通「悅」；「不亦……乎」表反問。"],
        ["有朋自遠方來","有志同道合的朋友從遠方來","「朋」在此指志同道合的人。"],
        ["人不知而不慍","別人不了解我，我卻不生氣","「慍」是生氣、怨恨。"],
        ["溫故而知新","溫習舊知識，進而領悟新知識","「故」指舊知識；「新」指新體會。"],
        ["三人行必有我師焉","多人同行，其中一定有可以做我老師的人","「三」可泛指多數；「焉」相當於「於此」。"],
        ["擇其善者而從之","選擇他們的優點來學習","「善者」指優點；「從」是學習、跟從。"],
        ["其不善者而改之","看見他們的缺點，就反省並改正自己","末句省略了反省自身的意思。"],
        ["知之為知之","知道就是知道","「之」代指所學的事。"],
        ["不知為不知","不知道就是不知道","強調誠實面對自己的認知。"],
        ["誠宜","實在應當","副詞「誠」表確實；「宜」是應當。"],
        ["開張聖聽","廣泛聽取意見","「開張」是擴大、廣開；「聖聽」敬稱皇帝的聽聞。"],
        ["開張","擴大、廣開","古今異義；此處不是開店營業。"],
        ["聖聽","皇帝的聽聞，指皇帝聽取意見","「聖」是對皇帝的尊稱。"],
        ["以光先帝遺德","來發揚先帝遺留下來的美德","「以」表目的；「光」作動詞，意為發揚光大。"],
        ["恢弘志士之氣","振奮並擴大忠志之士的士氣","「恢弘」在此作動詞。"],
        ["妄自菲薄","過分看輕自己","「菲薄」在此是輕視、鄙薄。"],
        ["引喻失義","說話譬喻不合道理","「義」指合宜的道理。"],
        ["塞忠諫之路","堵塞忠臣進諫的道路","「塞」讀作阻塞之意。"],
        ["芳草鮮美","花草鮮嫩美麗","「鮮美」古義是鮮豔美麗。"],
        ["阡陌交通","田間小路交錯相通","「交通」古義是交錯相通。"],
        ["率妻子邑人","帶領妻子、兒女和同鄉","「妻子」古義包含妻子和兒女。"],
        ["無論魏晉","更不必說魏、晉兩朝","「無論」古義是不要說、更不必說。"],
        ["先帝不以臣卑鄙","先帝不因為我身分低微、見識淺陋","「卑鄙」古義指社會地位低微、見識淺陋。"],
        ["臨表涕零","面對這篇表文流下眼淚","「涕」是眼淚；「零」是落下。"],
        ["何陋之有","有什麼簡陋的呢","賓語前置，正常語序是「有何陋」。"],
        ["但少閑人如吾兩人者耳","只是缺少像我們兩人這樣清閒的人罷了","「但」是只是；「耳」是罷了。"],
        ["肉食者鄙","居高位、享厚祿的人見識淺陋","「肉食者」借指有權位的人。"],
        ["小大之獄","大大小小的訴訟案件","「獄」古義是案件。"],
        ["一鼓作氣","第一次擊鼓能振作士氣","「作」是振作。"],
        ["吾","我","第一人稱代詞。"],["汝","你","第二人稱代詞。"],["爾","你、你的","第二人稱代詞。"],
        ["曰","說","常用來引出人物說話。"],["皆","都","表示全部。"],["遂","於是、就","承接前文結果。"],
        ["故","所以、緣故","依語境可作連詞或名詞。"],["欲","想要","表示意願。"],["弗","不","否定副詞。"],
        ["莫","沒有人、不要","依語境表示無人或禁止。"],["嘗","曾經","表示過去經驗。"],["既","已經、……之後","表示完成或承接。"],
        ["善","好、擅長","可作名詞、形容詞或動詞。"],["走","跑","古義常指奔跑。"],["去","離開","古義常指離開。"],
        ["亡","逃亡、失去","依上下文判斷。"],["食","吃、食物","讀音與詞性依語境判斷。"],["聞","聽見、聽說","也可指名聲。"]
      ];
      if (detectedClassic) entries.unshift(...detectedClassic.phrases);
      const matched = entries.filter(([term]) => original.includes(term)).slice(0, 14);
      const isOpenListening = original.includes("開張聖聽");
      const modernMarkers = (original.match(/的|了|我們|你們|因為|所以|但是|覺得|已經|正在/g) || []).length;
      const classicalMarkers = (original.match(/[吾汝爾曰矣焉兮遂乃蓋豈]|不亦|何以|何故|者也/g) || []).length;
      const looksClassical = matched.length > 0 || classicalMarkers > modernMarkers;
      let translation = original;
      if (original.replace(/[，。！？；、\s]/g, "") === "開張聖聽") {
        translation = "廣泛地聽取臣下的意見，也就是勸皇帝廣開言路、接納忠言。";
      } else if (original.includes("誠宜開張聖聽，以光先帝遺德，恢弘志士之氣")) {
        translation = "實在應當廣泛聽取臣下的意見，來發揚先帝遺留下來的美德，振奮忠志之士的士氣。";
      } else {
        [...matched]
          .sort((a, b) => b[0].length - a[0].length)
          .forEach(([term, meaning]) => { translation = translation.split(term).join(meaning); });
        if (translation === original) {
          translation = detectedClassic
            ? `這段文字出自〈${detectedClassic.title}〉。結合篇章脈絡，語意重點是：${detectedClassic.summary}`
            : looksClassical
            ? `依字面可理解為：${original}。閱讀時需補出古文省略的主語，並依前後文確認人名與代詞所指。`
            : `這段文字本身已接近現代白話。換句話說，它主要表達的是：「${original}」`;
        }
      }

      const visibleWords = matched.length ? matched : (detectedClassic?.phrases || []);
      const wordList = visibleWords.length
        ? visibleWords.map(([term, meaning, note]) => `<li><mark>${escapeHTML(term)}</mark>：${escapeHTML(meaning)}。${escapeHTML(note)}</li>`).join("")
        : `<li><mark>句意判讀</mark>：本文共 ${[...original].length} 字，先從重複詞、轉折詞與因果詞確認句間關係。</li>`;
      const rhetoricItems = [];
      if (detectedClassic) {
        rhetoricItems.push(...detectedClassic.techniques.map((technique) => `<li><mark>${escapeHTML(technique)}</mark>：〈${escapeHTML(detectedClassic.title)}〉的重要表現手法。</li>`));
      }
      if (isOpenListening) rhetoricItems.push("<li><mark>借代／敬稱</mark>：「聖聽」以皇帝的聽聞代指皇帝接納臣下意見。</li>");
      if (/不亦.+乎|豈|何.+[乎哉]|安得/.test(original)) rhetoricItems.push("<li><mark>反問</mark>：以問句加強肯定或否定語氣。</li>");
      if (/如|若|猶|譬/.test(original)) rhetoricItems.push("<li><mark>譬喻線索</mark>：出現「如、若、猶、譬」等比況詞，需比較本體與喻體。</li>");
      if (/曰|云/.test(original)) rhetoricItems.push("<li><mark>引用</mark>：引出人物言語，使觀點或情節更直接。</li>");
      if (/但是|然而|卻|而/.test(original)) rhetoricItems.push("<li><mark>轉折／承接</mark>：留意前後語意是相反、遞進或並列。</li>");
      const rhetoric = `<ul>${rhetoricItems.length ? rhetoricItems.join("") : "<li><mark>句式</mark>：依停頓分層，先找主語、動作與受詞，再判斷語氣。</li>"}</ul>`;
      const themes = [
        [/學|習|師|知|教/,"學習方法、知識與自我反省"],
        [/君|臣|帝|國|民|政|諫/,"政治責任、治國與君臣關係"],
        [/山|水|月|花|鳥|風|景/,"景物描寫及其寄託的情感"],
        [/父|母|親|友|朋|兄|弟/,"人際關係、親情或友情"],
        [/兵|軍|戰|將|卒/,"戰爭、決策與士氣"],
        [/志|德|仁|義|善/,"品德修養、志向與價值選擇"]
      ];
      const detectedTheme = themes.find(([pattern]) => pattern.test(original))?.[1] || "人物的行動、觀點與前後句關係";
      const focus = isOpenListening
        ? "語意核心是「廣開言路」。諸葛亮勸後主劉禪廣泛接納臣下意見，不要堵塞忠臣進諫的管道。"
        : detectedClassic
        ? `篇目辨識：〈${detectedClassic.title}〉，${detectedClassic.era}，${detectedClassic.author}，文體為${detectedClassic.genre}。${detectedClassic.summary}`
        : `本段共 ${[...original].length} 字、${original.split(/[。！？；]+/).filter(Boolean).length} 個主要語意單位，內容可先從「${detectedTheme}」方向整理。`;
      const exam = isOpenListening
        ? "<ul><li><mark>出處</mark>：諸葛亮〈出師表〉。</li><li><mark>古今異義</mark>：「開張」古義是擴大、廣開；今義常指商店開業。</li><li><mark>語境</mark>：「聖聽」不是聽力特別好，而是敬稱皇帝聽取意見。</li><li><mark>主旨</mark>：廣開言路、親賢納諫。</li></ul>"
        : detectedClassic
          ? `<ul><li><mark>篇目</mark>：${escapeHTML(detectedClassic.author)}〈${escapeHTML(detectedClassic.title)}〉，${escapeHTML(detectedClassic.genre)}。</li>${detectedClassic.points.map((point) => `<li>${escapeHTML(point)}</li>`).join("")}</ul>`
        : looksClassical
          ? "<ul><li>辨認古今異義、通假字與詞類活用。</li><li>確認「之、其、而、以、於」等虛詞在句中的作用。</li><li>翻譯時補出省略成分，但不可增加原文沒有的意思。</li></ul>"
          : "<ul><li>找出中心句、關鍵詞與段落主旨。</li><li>辨認因果、轉折、舉例與比較關係。</li><li>區分作者主張、事實說明與情感態度。</li></ul>";

      return {
        mode: "chinese",
        tabs: ["白話翻譯","字詞整理","修辭整理","重點整理","常考觀念"],
        content: [
          ["白話翻譯", `<p>${escapeHTML(translation)}</p><p class="reader-source">分析原文：${escapeHTML(original)}</p>`],
          ["字詞整理", `<ul>${wordList}</ul>`],
          ["修辭整理", rhetoric],
          ["重點整理", `<p>${escapeHTML(focus)}</p>`],
          ["常考觀念", exam]
        ]
      };
    }

    analyzeEnglish(text) {
      const original = text.replace(/\s+/g, " ").trim();
      const words = original.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
      const unique = [...new Set(words.filter((word) => word.length >= 7).map((word) => word.toLowerCase()))].slice(0, 8);
      const grammar = [];
      if (/\balthough\b/i.test(original)) grammar.push("Although 引導讓步副詞子句。");
      if (/\bbecause\b/i.test(original)) grammar.push("Because 引導原因副詞子句。");
      if (/\b(that|which|who)\b/i.test(original)) grammar.push("that／which／who 可能引導關係子句，需確認其先行詞。");
      if (/\bif\b/i.test(original)) grammar.push("If 引導條件子句。");
      const firstSentence = original.split(/(?<=[.!?])\s+/)[0];
      return {
        mode: "english",
        tabs: ["單字整理","文法分析","長難句拆解","重點摘要","生字收藏"],
        content: [
          ["Vocabulary", unique.length ? `<ul>${unique.map((word) => `<li><mark>${escapeHTML(word)}</mark>：建議依句中語境查核詞性與意思。</li>`).join("")}</ul>` : "<p>沒有找到適合抽出的長單字。</p>"],
          ["Grammar", `<ul>${(grammar.length ? grammar : ["目前未偵測到內建規則中的明顯連接詞句型。"]).map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`],
          ["Sentence Breakdown", `<p>${escapeHTML(firstSentence)}</p><p class="reader-source">先找主要動詞，再把連接詞引導的子句分開。</p>`],
          ["Key Summary", `<p>本機模式先取首句作為閱讀起點：${escapeHTML(firstSentence)}</p>`],
          ["Saved Words", unique.length ? `<p>建議收藏：${unique.map(escapeHTML).join("、")}。</p>` : "<p>目前沒有建議收藏的生字。</p>"]
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
      $("#classicPicker").hidden = this.readerMode !== "chinese";
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

    loadClassic() {
      const item = classicFifteen.find((entry) => entry.id === $("#classicSelect").value);
      if (!item) return;
      $("#readerText").value = item.excerpt;
      $("#readerText").dispatchEvent(new Event("input"));
      this.readerAnalysis = this.analyzeChinese(item.excerpt);
      this.readerTab = 0;
      this.renderReader();
      this.toast(`已載入〈${item.title}〉代表句`);
    }

    formatAIReaderAnalysis(analysis, mode, original) {
      const safeList = (items, emptyText) => {
        const values = Array.isArray(items) ? items.filter(Boolean) : [];
        return values.length
          ? `<ul>${values.map((item) => `<li>${escapeHTML(String(item))}</li>`).join("")}</ul>`
          : `<p>${escapeHTML(emptyText)}</p>`;
      };
      const vocabulary = Array.isArray(analysis.vocabulary) ? analysis.vocabulary : [];
      const vocabularyHTML = vocabulary.length
        ? `<ul>${vocabulary.map((item) => {
            const term = typeof item === "string" ? item : item?.term;
            const meaning = typeof item === "string" ? "" : item?.meaning;
            return `<li><mark>${escapeHTML(String(term || ""))}</mark>${meaning ? `：${escapeHTML(String(meaning))}` : ""}</li>`;
          }).join("")}</ul>`
        : "<p>這段內容沒有需要另外整理的生字詞。</p>";
      const translation = escapeHTML(String(analysis.translation || "AI 未提供完整翻譯，請參考其他分析分頁。"));
      const summaryHTML = safeList(analysis.summary, "AI 未提供摘要。");
      const examHTML = safeList(analysis.examPoints, "AI 未標示額外考點。");

      if (mode === "chinese") {
        return {
          mode,
          tabs: ["白話翻譯","字詞整理","修辭整理","重點整理","常考觀念"],
          content: [
            ["白話翻譯", `<p>${translation}</p><p class="reader-source">AI 分析原文：${escapeHTML(original)}</p>`],
            ["字詞整理", vocabularyHTML],
            ["修辭整理", safeList(analysis.rhetoric, "AI 未偵測到明顯修辭。")],
            ["重點整理", summaryHTML],
            ["常考觀念", examHTML]
          ]
        };
      }

      const savedWords = vocabulary.map((item) => typeof item === "string" ? item : item?.term).filter(Boolean);
      return {
        mode,
        tabs: ["單字整理","文法分析","長難句拆解","重點摘要","生字收藏"],
        content: [
          ["單字整理", vocabularyHTML],
          ["文法分析", safeList(analysis.grammar, "AI 未標示需要特別拆解的文法。")],
          ["長難句拆解", safeList(analysis.sentenceBreakdown, "AI 未偵測到長難句。")],
          ["重點摘要", summaryHTML],
          ["生字收藏", savedWords.length ? `<p>建議收藏：${savedWords.map(escapeHTML).join("、")}。</p>` : "<p>目前沒有建議收藏的生字。</p>"]
        ]
      };
    }

    async analyzeReader() {
      const text = $("#readerText").value.trim();
      if (!text) { this.toast("請先貼上想分析的文章"); $("#readerText").focus(); return; }
      const button = $('[data-action="analyze-reader"]');
      const originalLabel = button.textContent;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.textContent = "分析中…";
      $("#readerOutput").innerHTML = '<div class="reader-loading" role="status">AI 正在整理翻譯與考點</div>';

      try {
        const response = await fetch(READER_AI_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language: this.readerMode })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.analysis) throw new Error(result.error || `HTTP ${response.status}`);
        this.readerAnalysis = this.formatAIReaderAnalysis(result.analysis, this.readerMode, text);
        this.toast("免費 AI 分析已完成");
      } catch (error) {
        console.warn("StudyHub AI fallback:", error);
        this.readerAnalysis = this.readerMode === "chinese"
          ? this.analyzeChinese(text)
          : this.analyzeEnglish(text);
        this.toast("AI 暫時無法使用，已改用本機分析");
      } finally {
        button.disabled = false;
        button.removeAttribute("aria-busy");
        button.textContent = originalLabel;
      }

      this.readerTab = 0; this.renderReader();
      $("#readerOutput").classList.remove("page");
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
        this.store.set("scores-v2", this.scores);
        this.updateInsights();
      }));
      this.updateInsights();
    }

    updateInsights() {
      const sorted = Object.entries(this.scores).sort((a,b) => a[1] - b[1]);
      const hasRatings = sorted.some(([, score]) => score > 0);
      if (!hasRatings) {
        $("#weakSubject").textContent = "尚未評分";
        $("#strongSubject").textContent = "尚未評分";
        $("#priorityOrder").textContent = "等待你的輸入";
        $("#weakNote").textContent = "拖曳下方滑桿後才會分析";
        $("#strongNote").textContent = "不會使用預設分數猜測";
        return;
      }
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
      this.store.set("heat-v2", this.heat);
      this.renderHeatmap();
      this.updateDashboard();
      this.toast(this.heat[date] ? `已記錄 ${this.heat[date] * .5} 小時` : "已清除該日紀錄");
    }

    recordToday() {
      const today = new Date().toISOString().slice(0, 10);
      this.heat[today] = Math.min((this.heat[today] || 0) + 1, 4);
      this.store.set("heat-v2", this.heat);
      this.closeModals();
      this.renderHeatmap();
      this.updateDashboard();
      this.toast(`今天已記錄 ${this.heat[today] * 30} 分鐘`);
    }

    updateDashboard() {
      const today = new Date();
      const todayKey = today.toISOString().slice(0, 10);
      const todayLevel = this.heat[todayKey] || 0;
      const todayMinutes = todayLevel * 30;
      const mondayOffset = (today.getDay() + 6) % 7;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - mondayOffset);
      weekStart.setHours(0, 0, 0, 0);

      let weekMinutes = 0;
      let weekDays = 0;
      for (let i = 0; i < 7; i += 1) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const level = this.heat[date.toISOString().slice(0, 10)] || 0;
        if (level > 0) weekDays += 1;
        weekMinutes += level * 30;
      }

      let streak = 0;
      const cursor = new Date(today);
      while (this.heat[cursor.toISOString().slice(0, 10)] > 0) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }

      const formatTime = (minutes) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
      $("#todayFocus").innerHTML = `${Math.floor(todayMinutes / 60)}<small>h</small> ${String(todayMinutes % 60).padStart(2, "0")}<small>m</small>`;
      $("#focusRing").setAttribute("aria-label", todayMinutes ? `今日專注 ${formatTime(todayMinutes)}` : "今日尚未記錄學習時間");
      $("#todayStudyTime").textContent = formatTime(todayMinutes);
      $("#todayStudyNote").textContent = todayMinutes ? "依今日紀錄計算" : "尚未記錄";
      $("#streakTop").textContent = streak;
      $("#streakCard").innerHTML = `${streak} <small>天</small>`;
      $("#streakNote").textContent = streak ? "依連續紀錄計算" : "尚未開始記錄";
      $("#weekRecordDays").textContent = `本週 ${weekDays} 天有紀錄`;
      $("#weekStudyTotal").textContent = `目前共 ${formatTime(weekMinutes)}`;
      $("#heroStatus").textContent = weekMinutes ? "已有真實學習紀錄" : "尚未開始記錄";
      $("#heroMessage").textContent = weekMinutes
        ? `本週已記錄 ${formatTime(weekMinutes)}，尚未設定目標，因此不顯示虛構完成率。`
        : "目前沒有本週學習資料。記錄後，這裡才會顯示真實進度。";
      $("#weekRecordEmpty h3").textContent = weekMinutes ? `本週已記錄 ${formatTime(weekMinutes)}` : "還沒有本週資料";
      $("#weekRecordEmpty p").textContent = weekMinutes ? "每次點擊可再增加 30 分鐘，也可到熱力圖逐日調整。" : "點擊下方按鈕，每次記錄 30 分鐘；也可到熱力圖調整。";
    }

    renderFormulas() {
      const keyword = $("#formulaSearch")?.value.trim().toLowerCase() || "";
      const subject = $("#formulaSubject")?.value || "";
      const volume = $("#formulaVolume")?.value || "";
      const items = this.seed.formulas.filter((item) => {
        const text = [item.name,item.formula,item.symbols,item.description,item.point,item.example,item.volume].join(" ").toLowerCase();
        return (!keyword || text.includes(keyword))
          && (!subject || item.subject === subject)
          && (!volume || item.volume === volume);
      });
      $("#formulaResultCount").textContent = `共 ${items.length} 個公式`;
      $("#formulaGrid").innerHTML = items.map((item) => `
        <article class="formula-card">
          <div class="card-top"><span class="subject-chip">${item.subject} · ${item.volume}</span><button class="favorite-btn ${this.isFavorite("formula",item.id) ? "active" : ""}" data-action="favorite-formula" data-id="${item.id}" aria-label="收藏${item.name}">♥</button></div>
          <h3>${item.name}</h3><p>${item.description}</p>
          <div class="formula">${item.formula}</div>
          <p class="symbol-legend"><strong>代號</strong>${escapeHTML(item.symbols)}</p>
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
        this.store.set("mistakes-v2", this.mistakes);
      }
      this.store.set("favorites-v2", this.favorites);
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

    getLocalDateKey(date = new Date()) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    focusTaskForm() {
      $("#todayTasks").scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => $("#taskTitle").focus(), 350);
    }

    addTask(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const title = form.elements.title.value.trim();
      if (!title) { form.elements.title.focus(); return; }
      this.tasks.unshift({
        id: crypto.randomUUID?.() || `task-${Date.now()}`,
        title,
        subject: form.elements.subject.value,
        date: this.getLocalDateKey(),
        done: false,
        createdAt: Date.now()
      });
      if (!this.store.set("tasks-v1", this.tasks)) {
        this.tasks.shift();
        this.toast("任務儲存失敗，請確認瀏覽器儲存空間");
        return;
      }
      form.elements.title.value = "";
      this.renderTasks();
      form.elements.title.focus();
      this.toast("今日任務已新增");
    }

    toggleTask(id, done) {
      const task = this.tasks.find((item) => item.id === id);
      if (!task) return;
      task.done = Boolean(done);
      if (!this.store.set("tasks-v1", this.tasks)) {
        task.done = !task.done;
        this.toast("任務狀態儲存失敗");
      }
      this.renderTasks();
    }

    editTask(id) {
      const task = this.tasks.find((item) => item.id === id);
      if (!task) return;
      const nextTitle = prompt("編輯任務內容", task.title);
      if (nextTitle === null) return;
      const title = nextTitle.trim();
      if (!title) { this.toast("任務內容不可空白"); return; }
      const previous = task.title;
      task.title = title.slice(0, 80);
      if (!this.store.set("tasks-v1", this.tasks)) {
        task.title = previous;
        this.toast("任務更新失敗");
        return;
      }
      this.renderTasks();
      this.toast("任務已更新");
    }

    deleteTask(id) {
      const task = this.tasks.find((item) => item.id === id);
      if (!task || !confirm(`確定刪除「${task.title}」？`)) return;
      const previous = this.tasks;
      this.tasks = this.tasks.filter((item) => item.id !== id);
      if (!this.store.set("tasks-v1", this.tasks)) {
        this.tasks = previous;
        this.toast("任務刪除失敗");
        return;
      }
      this.renderTasks();
      this.toast("任務已刪除");
    }

    renderTasks() {
      const today = this.getLocalDateKey();
      const items = this.tasks
        .filter((item) => item.date === today)
        .sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt);
      const completed = items.filter((item) => item.done).length;
      $("#todayTaskStat").innerHTML = `${completed} <small>項</small>`;
      $("#todayTaskNote").textContent = items.length ? `今日 ${completed} / ${items.length} 完成` : "新增今日任務";
      $("#taskProgress").textContent = `${completed} / ${items.length} 完成`;
      $("#taskEmpty").classList.toggle("hidden", items.length > 0);
      $("#todayTaskList").innerHTML = items.map((item) => `
        <div class="task-item ${item.done ? "done" : ""}">
          <input type="checkbox" ${item.done ? "checked" : ""} data-action="toggle-task" data-id="${item.id}" aria-label="${item.done ? "取消完成" : "標記完成"}：${escapeHTML(item.title)}">
          <div class="task-copy"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.subject)} · 今天</small></div>
          <div class="task-actions">
            <button data-action="edit-task" data-id="${item.id}" aria-label="編輯${escapeHTML(item.title)}">編輯</button>
            <button class="delete-task" data-action="delete-task" data-id="${item.id}" aria-label="刪除${escapeHTML(item.title)}">刪除</button>
          </div>
        </div>`).join("");
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
