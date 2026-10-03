const table=(heads,rows)=>`<div class="table-wrap"><table><thead><tr>${heads.map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const block=(title,body)=>`<section class="content-block"><h3>${title}</h3>${body}</section>`;
const eq=s=>`<div class="equation">${s}</div>`;
const example=s=>`<div class="example"><b>跟著算一次</b><p>${s}</p></div>`;
const warning=s=>`<div class="warning"><strong>容易搞混</strong>　${s}</div>`;
const lessons=[
{title:'波的傳播',lead:'繩子沒有跑到另一端，為什麼波可以？先分清楚「波形的移動」與「介質的振動」。',key:'波傳遞擾動與能量，介質質點通常只在平衡位置附近振動。',body:
block('01　波是擾動的傳播',`<p>甩動繩子的一端，凸起的波形向另一端移動，但繩上的每一小段只在原處附近上下運動。</p>${table(['名詞','意思'],[['波源','產生振動或擾動的來源'],['介質','傳遞力學波的物質，如繩子、水、空氣'],['脈衝波','短暫擾動形成的波'],['週期波','波源週期性振動形成的波']])}`)+
block('02　橫波與縱波',`<p>比較<strong>介質振動方向</strong>與<strong>波的傳播方向</strong>。</p>${table(['類型','方向關係','例子'],[['橫波','互相垂直','繩波、電磁波'],['縱波','互相平行','空氣中的聲波、彈簧疏密波']])}<p>波往右傳、質點上下動 → 橫波；波往右傳、質點左右動 → 縱波。</p>${warning('橫、縱不是指水平或垂直傳播。水面粒子運動較複雜，不能認為所有水粒子都只上下振動。')}`)+
block('03　是否需要介質？',table(['種類','介質','真空中傳播'],[['力學波：聲波、繩波','需要','不可以'],['電磁波：光、無線電波','不需要','可以']]))},
{title:'振動與週期波',lead:'讀懂波形圖，從振幅、週期與波長，連結到最重要的關係式 v = fλ。',key:'看位置找波長，看時間找週期；波速與質點振動速率是不同的量。',body:
block('01　五個基本物理量',table(['物理量','定義','單位'],[['振幅 A','偏離平衡位置的最大距離','m'],['週期 T','完成一次振動所需時間','s'],['頻率 f','每秒振動次數','Hz'],['波長 λ','沿傳播方向，相鄰同相位點的距離','m'],['波速 v','波形傳播的速率','m/s']])+eq('f = 1 / T　　v = fλ = λ / T')+'<p>一個週期內，波形前進一個波長。波峰到相鄰波谷的水平距離是 λ/2，垂直距離則是 2A。</p>'+example('頻率 5 Hz、波長 0.8 m：<br>T = 1/5 = <strong>0.2 s</strong>；v = 5 × 0.8 = <strong>4 m/s</strong>。'))+
block('02　兩種圖形，兩種讀法',table(['圖形','固定什麼','讀出什麼'],[['位移—位置圖 y–x','同一時間','一次完整重複的水平距離是 λ'],['位移—時間圖 y–t','同一質點','一次完整重複的時間是 T']])+'<p>判斷質點下一刻往哪裡動：將整個波形沿傳播方向平移一小段，再看固定位置的新高度。</p>'+table(['波向右傳時','質點瞬間運動'],[['波形由左往右是上坡','向下'],['波形由左往右是下坡','向上'],['波峰或波谷','瞬間速度為零']])+warning('向左傳時，上、下坡判斷相反。正弦波的質點通過平衡位置時速率最大；到波峰、波谷時速率為零，但波形仍持續傳播。'))+
block('03　繩波的波速',eq('v = √(F / μ)　　μ = m / L')+'<p>F 是張力；μ 是線密度（每單位長度的質量）。</p><ul><li>張力越大，波速越大；張力增為 4 倍，波速增為 2 倍。</li><li>線密度越大，波速越小。</li><li>同一條理想繩、張力固定：提高頻率不改變波速，只會縮短波長。</li></ul>')},
{title:'繩波的反射與透射',lead:'波到達端點或交界處，可能折返，也可能繼續進入另一段繩。',key:'固定端反相，自由端同相；換介質時頻率不變，波速與波長可能改變。',body:
block('01　先看端點能不能動',table(['端點','反射波','向上脈衝反射後'],[['固定端','反相，上下顛倒','變成向下'],['自由端','同相，不顛倒','仍然向上']])+'<p>固定端不能動，所以端點處入射波與反射波的位移必須互相抵消。</p>'+warning('反射後「傳播方向改變」與「上下顛倒」是兩件事，不能混為一談。'))+
'<div id="reflection-demo"></div>'+
block('02　輕繩與重繩的交界',`<p>下表假設兩段繩<strong>張力相同、理想接合</strong>；輕重指線密度。</p>${table(['入射方向','反射波','透射波','透射波速'],[['輕 → 重','反相','不反相','變慢'],['重 → 輕','不反相','不反相','變快']])}<p>反射波回到原介質；透射波進入另一介質。</p>`)+
block('03　頻率由波源決定',eq('f₁ = f₂　　λ₂ / λ₁ = v₂ / v₁')+'<p>波速減小，波長縮短；波速增加，波長變長。</p>'+example('原本 v₁ = 6 m/s、λ₁ = 2 m，透射後 v₂ = 3 m/s：<br>f = 6/2 = 3 Hz；λ₂ = 3/3 = <strong>1 m</strong>。'))},
{title:'波的疊加原理',lead:'兩個波相遇時，把同一位置、同一時間的位移加起來，就能得到合成波形。',key:'位移相加要保留正負號；完全抵消是暫時的，不代表波或能量永久消失。',body:
block('01　疊加的是位移',eq('y = y₁ + y₂')+'<p>以下在線性波動近似下成立：</p>'+table(['第一個波','第二個波','合位移'],[['+3 cm','+2 cm','+5 cm'],['+3 cm','−2 cm','+1 cm'],['+3 cm','−3 cm','0']])+'<p>兩個脈衝通過彼此後，仍各自繼續傳播。</p>')+
block('02　建設性與破壞性干涉',table(['相位關係','結果','合振幅'],[['同相','建設性干涉，振幅最大','A₁ + A₂'],['反相','破壞性干涉，振幅最小','|A₁ − A₂|']])+warning('只有兩波振幅相等且反相，才會完全抵消。若振幅為 3 cm 與 2 cm，最小合振幅仍是 1 cm。'))+
block('03　平直不等於沒有能量','<p>兩個相反脈衝重疊時，某瞬間繩子可能完全平直，但質點仍可能有速度。</p><p><strong>位移為零 ≠ 速度為零 ≠ 能量為零。</strong></p>')},
{title:'駐波',lead:'兩列等振幅、等頻率、等波長的正弦波反向傳播，疊加後形成位置固定的波節與波腹。',key:'波節一直不動；波腹振幅最大。相鄰波節相距半個波長。',body:
block('01　認識波節與波腹',table(['位置','特徵'],[['波節','振幅為零，一直不動'],['波腹','振幅最大；兩組成波各為 A 時，波腹振幅為 2A']])+eq('相鄰波節：λ / 2<br>相鄰波腹：λ / 2<br>相鄰波節與波腹：λ / 4')+warning('整條繩某瞬間都通過平衡位置，不表示整條繩都是波節。波節是「一直」位移為零的位置。'))+
block('02　兩端固定的弦',eq('L = nλₙ / 2<br>λₙ = 2L / n　　fₙ = nv / (2L) = nf₁')+'<p>n = 1, 2, 3, …；兩端都是波節。</p>'+table(['模式','波腹數','波節數（含端點）','波長'],[['基頻／第 1 諧波','1','2','2L'],['第 2 諧波','2','3','L'],['第 3 諧波','3','4','2L/3']])+example('弦長 1.2 m，有 3 個波腹，波速 24 m/s：<br>λ = 2 × 1.2/3 = 0.8 m；f = 24/0.8 = <strong>30 Hz</strong>。'))+
block('03　振動的相位與能量','<ul><li>同一對相鄰波節之間，各點同相振動。</li><li>波節兩側相鄰的兩段，反相振動。</li><li>非波節質點的頻率相同，但振幅隨位置不同。</li><li>理想駐波仍有能量，但沿繩的平均淨能量傳輸為零。</li></ul>')+
block('04　一端固定、一端自由',eq('L = (2n − 1)λₙ / 4<br>fₙ = (2n − 1)v / (4L)')+'<p>固定端是波節，自由端是波腹。只出現基頻的奇數倍頻率。</p>')},
{title:'惠更斯原理',lead:'把波前上的每一點想成小波源，就能理解下一刻的波前如何形成。',key:'波前是同相位點連成的線或面；反射與折射的角度都從法線量起。',body:
block('01　從舊波前找到新波前','<p>原波前上的每一點，皆可視為發出次波的小波源。經過一小段時間，次波的共同包絡面構成新波前。</p><p>在均勻、各向同性介質中，波的傳播方向垂直於波前。點波源產生的圓形水波，一圈圈波峰可作為波前。</p>')+
block('02　反射與折射',eq('反射：θᵢ = θᵣ<br>折射：sin θ₁ / sin θ₂ = v₁ / v₂ = λ₁ / λ₂')+table(['進入新區域後','波長','斜入射時的方向'],[['波速變慢','變短','偏向法線'],['波速變快','變長','偏離法線']])+'<p>一般高中水波槽條件下，深水進入淺水，波速變慢、波長縮短；淺水進入深水則相反。<strong>頻率不變。</strong></p>'+warning('垂直入射時方向不變，但波速、波長仍可能改變。入射角、反射角、折射角均相對於法線，不是界面。'))+
block('03　繞射：波會向陰影區擴展','<p>波通過狹縫或障礙物邊緣後，會擴展進入幾何陰影區。</p><ul><li>波長固定：狹縫越窄，繞射越明顯。</li><li>狹縫固定：波長越長，繞射越明顯。</li></ul>'+warning('不是只有狹縫小於波長才會繞射，而是波長相對於狹縫越大，繞射通常越容易觀察。'))},
{title:'水波的干涉',lead:'同頻且相位差固定的兩個波源，能形成穩定干涉圖樣。用路徑差判斷加強或抵消。',key:'同相雙波源：路徑差為整數倍波長時加強，半整數倍波長時相消。',body:
block('01　路徑差決定相位差',eq('Δr = |r₁ − r₂|')+'<p>r₁、r₂ 是觀察點到兩波源的距離。多走一個波長，相當於多經過一次完整振動。</p><p>下列公式適用於<strong>同頻、同相位雙波源</strong>。</p>'+table(['干涉','路徑差','例子'],[['建設性','Δr = mλ','0、λ、2λ、…'],['破壞性','Δr = (m + ½)λ','λ/2、3λ/2、5λ/2、…']])+'<p>m = 0, 1, 2, …。要完全抵消，兩波在觀察點的振幅還需相等。</p>'+warning('若波源原本反相，加強、相消的路徑差條件互換。其他固定相位差則需連同波源相位差一起判斷。'))+
block('02　用數字判斷干涉',`<p>兩個同相波源，波長 λ = 4 cm。</p>${table(['到波源的距離','路徑差','結果'],[['10 cm、18 cm','8 cm = 2λ','建設性'],['10 cm、16 cm','6 cm = 3λ/2','破壞性'],['10 cm、10 cm','0','建設性']])}`)+
block('03　波腹線不是一直隆起的線','<p><strong>波腹線</strong>是建設性干涉位置連成的線，水面仍會上下振動。<strong>波節線</strong>是理想完全抵消的位置連成的線，水面維持零位移。</p>'+warning('波峰描述某瞬間的最高位移；波腹描述振幅最大的位置，兩者不同。'))}
];
completeCurriculum(lessons);
let current=0;
const nav=document.querySelector('#nav');
lessons.forEach((l,i)=>{const b=document.createElement('button');b.innerHTML=`<span>${l.id}</span>${l.title}`;b.addEventListener('click',()=>select(i,true));nav.append(b)});
function select(i,scroll=false){
 if(i<0||i>=lessons.length)return;
 current=i;const l=lessons[i];
 document.querySelector('#chapter-crumb').textContent=l.chapter===1?'第一章 波動':'第二章 聲波';
 document.querySelector('#crumb').textContent=l.title;
 document.querySelector('#lesson').innerHTML=`<div class="chapter-kicker">${l.id} / 學習筆記</div><h2 class="lesson-title" tabindex="-1">${l.title}</h2><p class="lead">${l.lead}</p><div class="takeaway"><strong>這一節先記住</strong>${l.key}</div>${l.body}`;
 [...nav.children].forEach((b,n)=>{if(n===i)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 document.querySelector('#prev').disabled=i===0;
 document.querySelector('#next').disabled=i===lessons.length-1;
 document.querySelector('#page-count').textContent=`${i+1} / ${lessons.length} 節`;
 Study.mount(l);window.mountSimulations();
 document.querySelector('.lab').hidden=i>1;
 if(scroll){history.replaceState(null,'','#'+l.id);document.querySelector('.lesson-title').focus({preventScroll:true});document.querySelector('#lesson').scrollIntoView({behavior:'auto',block:'start'});}
}
document.querySelector('#prev').onclick=()=>select(current-1,true);
document.querySelector('#next').onclick=()=>select(current+1,true);
const formulas=[['週期與頻率','f = 1/T'],['波速','v = fλ = λ/T'],['繩波（張力 F、線密度 μ）','v = √(F/μ)'],['位移疊加','y = y₁ + y₂'],['相鄰波節／相鄰波腹','距離 = λ/2'],['相鄰波節與波腹','距離 = λ/4'],['兩端固定弦（n = 1, 2, …）','fₙ = nv/(2L)'],['一端固定、一端自由','fₙ = (2n−1)v/(4L)'],['折射（角度相對於法線）','sin θ₁ / sin θ₂ = v₁ / v₂'],['同相波源：建設性','Δr = mλ'],['同相波源：破壞性','Δr = (m+½)λ']];
formulas.push(['空氣聲速（常溫附近，θ 為 °C）','v ≈ 331 + 0.6θ'],['回聲往返測距','d = vΔt/2'],['聲強級','β = 10 log₁₀(I/I₀)'],['開管（n = 1,2,3,…）','fₙ = nv/(2L)'],['單端閉管（第 n 個模式）','fₙ = (2n−1)v/(4L)'],['相鄰共鳴長度差','λ = 2(L₂−L₁)'],['拍頻','f拍 = |f₁−f₂|']);
document.querySelector('#formula-list').innerHTML=formulas.map(r=>`<div class="formula-row"><span>${r[0]}</span><strong>${r[1]}</strong></div>`).join('');
const dialog=document.querySelector('#formula-dialog');document.querySelector('#formulas').onclick=()=>dialog.showModal();document.querySelector('#close-dialog').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
const canvas=document.querySelector('#wave'),ctx=canvas.getContext('2d'),freq=document.querySelector('#freq'),amp=document.querySelector('#amp');let time=0,last=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
function update(){const f=Number(freq.value),a=Number(amp.value);document.querySelector('#freq-val').textContent=f.toFixed(1)+' Hz';document.querySelector('#amp-val').textContent=a.toFixed(1)+' m';document.querySelector('#lambda').textContent='λ = '+(2/f).toFixed(2)+' m';document.querySelector('#period').textContent='T = '+(1/f).toFixed(2)+' s'}
freq.oninput=amp.oninput=update;
function syncPause(){document.querySelector('#pause').textContent=paused?'播放動畫':'暫停動畫';document.querySelector('#pause').setAttribute('aria-pressed',String(paused))}document.querySelector('#pause').onclick=()=>{paused=!paused;syncPause()};syncPause();
function draw(now){if(last&&!paused)time+=Math.min((now-last)/1000,.05);last=now;const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const left=40,right=w-18,top=25,mid=(h-22)/2,scale=(h-65)/2,f=Number(freq.value),a=Number(amp.value),lambda=2/f;ctx.lineWidth=1;ctx.strokeStyle='#294751';ctx.fillStyle='#9fbcc4';ctx.font='11px system-ui';for(let x=0;x<=6;x++){const px=left+(right-left)*x/6;ctx.beginPath();ctx.moveTo(px,top);ctx.lineTo(px,h-28);ctx.stroke();ctx.fillText(String(x),px-3,h-10)}ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(left,mid);ctx.lineTo(right,mid);ctx.stroke();ctx.setLineDash([]);ctx.fillText('y (m)',9,15);ctx.fillText('x (m)',right-28,h-10);ctx.fillText('0',20,mid+4);ctx.fillStyle='#79b3bf';ctx.fillText('向右傳播 →',right-95,18);ctx.beginPath();ctx.strokeStyle='#5ce0c0';ctx.lineWidth=2.5;for(let px=left;px<=right;px++){const x=(px-left)/(right-left)*6,y=mid-a*scale*Math.sin(2*Math.PI*(x/lambda-f*time));if(px===left)ctx.moveTo(px,y);else ctx.lineTo(px,y)}ctx.stroke();const xp=2.5,px=left+xp/6*(right-left),py=mid-a*scale*Math.sin(2*Math.PI*(xp/lambda-f*time));ctx.strokeStyle='#bd824b';ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(px,top);ctx.lineTo(px,h-28);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.fillStyle='#ffb265';ctx.arc(px,py,6,0,Math.PI*2);ctx.fill();requestAnimationFrame(draw)}
select(Math.max(0,lessons.findIndex(l=>'#'+l.id===location.hash)));update();requestAnimationFrame(draw);
