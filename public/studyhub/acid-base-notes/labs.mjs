export const pKa=-Math.log10(1.8e-5);
export function bufferPH(added){return pKa+Math.log10((10+added)/(10-added));}
// Ideal 25°C monoprotic acid model, solved by charge balance in log[H+].
export function titrationPH(ml,weak=true){
  const volume=(25+ml)/1000,ct=.0025/volume,na=.1*ml/1000/volume;
  let low=-16,high=1;
  for(let i=0;i<100;i++){const log=(low+high)/2,h=10**log;
    const anion=weak?ct*1.8e-5/(1.8e-5+h):ct;
    if(h+na-1e-14/h-anion>0)high=log;else low=log;
  }
  return -(low+high)/2;
}
if(typeof document!=='undefined'){
  const ph=document.querySelector('[data-demo="ph"]');
  ph.innerHTML='<h4>動手調整｜pH 每差 1，濃度差多少？</h4><label for="ph-slider">pH（25°C）</label><input id="ph-slider" type="range" min="0" max="14" step="0.1" value="7"><div class="ph-scale" aria-hidden="true"><span></span></div><output for="ph-slider" aria-live="polite"></output><p>左側酸性，中間 pH 7 中性，右側鹼性。這個滑桿示範 0～14，不代表所有水溶液的 pH 都只能在這個範圍。</p>';
  function updatePH(){const v=Number(ph.querySelector('input').value);ph.querySelector('output').textContent=`pH ${v.toFixed(1)}｜[H⁺] = ${(10**-v).toExponential(2)} M｜[OH⁻] = ${(10**(v-14)).toExponential(2)} M；氫離子濃度是 pH 7 的 ${(10**(7-v)).toExponential(1)} 倍。`;ph.querySelector('.ph-scale span').style.left=`${v/14*100}%`;}
  ph.addEventListener('input',updatePH);updatePH();
  const buf=document.querySelector('[data-demo="buffer"]');
  buf.innerHTML='<h4>動手調整｜先反應，再算緩衝 pH</h4><p>初始 CH₃COOH 與 CH₃COO⁻ 各 10 mmol，體積 200 mL。負值表示加入 HCl，正值表示加入 NaOH；忽略加入體積，25°C、Ka = 1.8 × 10⁻⁵。</p><label for="buffer-slider">加入強酸（−）／強鹼（＋），單位 mmol</label><input id="buffer-slider" type="range" min="-8" max="8" step="0.5" value="0"><output for="buffer-slider" aria-live="polite"></output><div class="buffer-bars" aria-hidden="true"><span></span><span></span></div><p>左段為弱酸、右段為共軛鹼。演示保留兩者，使用緩衝近似；任一方耗盡時要改算鹽類或過量強酸鹼，不能再套比例。</p>';
  function updateBuffer(){const n=Number(buf.querySelector('input').value);buf.querySelector('output').textContent=`加入 ${n<0?'HCl':'NaOH'} ${Math.abs(n).toFixed(1)} mmol → HA 剩 ${(10-n).toFixed(1)} mmol、A⁻ 剩 ${(10+n).toFixed(1)} mmol → pH ≈ ${bufferPH(n).toFixed(2)}`;buf.querySelectorAll('.buffer-bars span').forEach((s,i)=>s.style.width=`${(i?10+n:10-n)*5}%`);}
  buf.addEventListener('input',updateBuffer);updateBuffer();
  const tit=document.querySelector('[data-demo="titration"]');
  tit.innerHTML='<h4>動手調整｜沿著滴定曲線走一遍</h4><p>25.0 mL、0.100 M 單質子酸，滴入 0.100 M NaOH；25°C、忽略活性效應。弱酸 Ka = 1.8 × 10⁻⁵。濃度已計入滴定造成的稀釋。</p><label for="acid-kind">酸的種類</label><select id="acid-kind"><option value="weak">弱酸：醋酸</option><option value="strong">強酸：鹽酸</option></select><label for="titration-slider">滴入 NaOH 體積（mL）</label><input id="titration-slider" type="range" min="0" max="50" step="0.1" value="12.5"><div class="lab-actions"><button data-volume="0">起點</button><button data-volume="12.5">半當量點</button><button data-volume="25">當量點</button><button data-volume="30">過量</button><button id="titrate-play" aria-pressed="false">播放滴定</button></div><svg viewBox="0 0 560 290" role="img" aria-label="滴定曲線：橫軸為加入 NaOH 毫升數，縱軸為 pH"><path d="M45 15V250H545" class="axis"/><path class="curve"/><circle r="6" class="cursor"/><text x="4" y="20">pH 14</text><text x="14" y="140">7</text><text x="14" y="250">0</text><text x="40" y="278">0</text><text x="267" y="278">25</text><text x="430" y="278">50 mL NaOH</text></svg><output for="acid-kind titration-slider" aria-live="polite"></output><p class="lab-explain"></p><p>曲線以物料守恆、電荷平衡、Ka 與 Kw 數值求解，含水的解離。筆記例題的近似值可能差約 0.01 pH。播放只展示滴加過程，時間軸不表示真實反應速率。</p>';
  const slider=tit.querySelector('input'),kind=tit.querySelector('select'),play=tit.querySelector('#titrate-play');
  function updateTitration(){const v=Number(slider.value),weak=kind.value==='weak',p=titrationPH(v,weak);tit.querySelector('.curve').setAttribute('d',Array.from({length:501},(_,i)=>`${i?'L':'M'}${45+i},${250-titrationPH(i/10,weak)/14*235}`).join(' '));tit.querySelector('.cursor').setAttribute('cx',45+v*10);tit.querySelector('.cursor').setAttribute('cy',250-p/14*235);tit.querySelector('output').textContent=`NaOH ${v.toFixed(1)} mL｜pH ${p.toFixed(2)}｜已加入 ${(v*.1).toFixed(2)} mmol OH⁻；初始酸 2.50 mmol。`;tit.querySelector('.lab-explain').textContent=v===0?'起點：先判斷是強酸，還是需要列 Ka 的弱酸。':v<25?(weak?'當量點前：先中和，剩下弱酸與共軛鹼形成緩衝；12.5 mL 為半當量點，pH 約等於 pKa。':'當量點前：剩餘強酸決定 pH，記得除以總體積。'):v===25?(weak?'當量點：弱酸已按化學計量中和，醋酸根水解使溶液呈鹼性，pH 約 8.72。':'當量點：強酸強鹼生成中性鹽，25°C 時 pH = 7.00。'):'當量點後：過量 NaOH 決定 pH，不能繼續使用緩衝公式。';}
  let timer=null;function stop(){clearInterval(timer);timer=null;play.textContent='播放滴定';play.setAttribute('aria-pressed','false');}
  tit.addEventListener('input',()=>{stop();updateTitration();});
  tit.querySelectorAll('[data-volume]').forEach(b=>b.addEventListener('click',()=>{stop();slider.value=b.dataset.volume;updateTitration();}));
  play.addEventListener('click',()=>{if(timer){stop();return;}if(Number(slider.value)>=50)slider.value=0;play.textContent='暫停滴定';play.setAttribute('aria-pressed','true');timer=setInterval(()=>{slider.value=Math.min(50,Number(slider.value)+.2);updateTitration();if(Number(slider.value)>=50)stop();},100);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});updateTitration();
}
