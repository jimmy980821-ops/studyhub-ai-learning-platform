(() => {
  const pulse = z => Math.abs(z) >= .09 ? 0 : (1 + Math.cos(Math.PI * z / .09)) / 2;
  const displacement = (x, time, fixed) => {
    const center = .15 + .2 * time;
    return pulse(x - center) + (fixed ? -1 : 1) * pulse(x - (2 - center));
  };
  let stop = () => {};
  function mount() {
    const root = document.querySelector('#reflection-demo');
    if (root?.dataset.ready) return;
    stop();
    if (!root) return;
    root.dataset.ready = 'true';
    root.innerHTML = `<section class="reflection-card" aria-labelledby="reflection-title">
      <div class="eyebrow">REFLECTION LAB</div><h3 id="reflection-title">同樣往回走，波形卻不同</h3>
      <p>兩個向上的脈衝同時向右傳播。看它們碰到右端後，如何向左折返。</p>
      <div class="reflection-panels">
        <div class="reflection-panel"><h4>固定端 <span>反相・上下顛倒</span></h4><canvas data-end="fixed" role="img" aria-label="固定端反射：向上的入射脈衝反射後變成向下，端點始終不動"></canvas><p>端點不能動，反射後<strong>變成向下</strong>。</p></div>
        <div class="reflection-panel"><h4>自由端 <span>同相・不顛倒</span></h4><canvas data-end="free" role="img" aria-label="自由端反射：向上的入射脈衝反射後仍向上，端點可上下滑動"></canvas><p>端點可上下動，反射後<strong>仍然向上</strong>。</p></div>
      </div>
      <div class="reflection-status" aria-live="polite"></div>
      <div class="reflection-buttons"><button type="button" class="solid" data-action="play">暫停</button><button type="button" class="outline" data-action="reset">重新播放</button><label>速度 <select aria-label="反射動畫速度"><option value="0.5">慢速 0.5×</option><option value="1" selected>正常 1×</option></select></label></div>
      <label class="reflection-timeline">拖曳觀察反射過程 <input aria-label="反射動畫進度" type="range" min="0" max="8.5" step="0.01" value="0"></label>
      <div class="reflection-stages"><button type="button" data-time="1">① 入射</button><button type="button" data-time="4.25">② 碰到端點</button><button type="button" data-time="6.5">③ 反射後</button></div>
      <div class="warning"><strong>分成兩件事看：</strong>兩者的傳播方向都由「向右」變成「向左」；但只有固定端的波形由「向上凸」變成「向下凹」。</div>
      <p class="muted">理想無損反射示意；曲線顯示入射波與反射波疊加後的繩形。碰到端點時，固定端位移始終為零，自由端位移可達入射脈衝振幅的兩倍。</p>
    </section>`;
    let time = 0, speed = 1, running = !matchMedia('(prefers-reduced-motion: reduce)').matches, last = 0, frame = 0, lastStage = '';
    const slider = root.querySelector('input'), play = root.querySelector('[data-action="play"]');
    const status = root.querySelector('.reflection-status');
    const sync = () => {play.textContent = running ? '暫停' : time >= 8.5 ? '重播' : '播放';play.setAttribute('aria-pressed',String(running));};
    play.onclick = () => {if(time >= 8.5)time=0;running=!running;sync();};
    root.querySelector('[data-action="reset"]').onclick = () => {time=0;running=true;sync();};
    slider.oninput = () => {time=Number(slider.value);running=false;sync();};
    root.querySelector('select').onchange = e => {speed=Number(e.target.value);};
    root.querySelectorAll('[data-time]').forEach(button => {button.onclick = () => {time=Number(button.dataset.time);running=false;sync();};});
    function render(canvas,fixed) {
      const width=canvas.clientWidth,height=200,dpr=Math.min(devicePixelRatio||1,2);
      if(canvas.width!==Math.round(width*dpr)||canvas.height!==height*dpr){canvas.width=Math.round(width*dpr);canvas.height=height*dpr;}
      const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,width,height);
      const start=15,end=width-30,mid=107,amp=34;
      c.strokeStyle='#becfd3';c.lineWidth=1;c.setLineDash([4,5]);c.beginPath();c.moveTo(start,mid);c.lineTo(end,mid);c.stroke();c.setLineDash([]);
      c.fillStyle='#60757d';c.font='12px system-ui';c.fillText('平衡位置',start,187);
      if(fixed){c.fillStyle='#becfd3';c.fillRect(end,42,9,130);c.strokeStyle='#82989e';for(let y=42;y<168;y+=12){c.beginPath();c.moveTo(end+9,y);c.lineTo(end+18,y+10);c.stroke();}}
      else{c.strokeStyle='#94aab0';c.lineWidth=3;c.beginPath();c.moveTo(end,28);c.lineTo(end,180);c.stroke();}
      c.beginPath();c.strokeStyle=fixed?'#007d69':'#b96d1b';c.lineWidth=3;
      for(let px=start;px<=end;px++){const x=(px-start)/(end-start),y=mid-amp*displacement(x,time,fixed);if(px===start)c.moveTo(px,y);else c.lineTo(px,y);}c.stroke();
      c.beginPath();c.arc(end,mid-amp*displacement(1,time,fixed),5,0,2*Math.PI);c.fillStyle=fixed?'#007d69':'#fff';c.fill();c.stroke();
      c.fillStyle=fixed?'#007d69':'#9b5a17';c.font='bold 13px system-ui';
      const text=time<3.8?'入射 → 向右':time>4.7?'← 反射 向左':'入射與反射重疊';c.fillText(text,15,21);
    }
    function tick(now){
      if(!root.isConnected)return;
      if(last&&running&&!document.hidden){time=Math.min(8.5,time+Math.min((now-last)/1000,.05)*speed);if(time>=8.5){running=false;sync();}}
      last=now;slider.value=String(time);
      const stage=time<3.8?'入射：兩個脈衝都是向上凸，向右前進。':time<=4.7?'相遇：固定端保持不動；自由端可以上下滑動。':'反射後：兩者都向左；固定端向下凹，自由端仍向上凸。';
      if(stage!==lastStage){status.textContent=stage;lastStage=stage;}
      root.querySelectorAll('canvas').forEach(canvas=>render(canvas,canvas.dataset.end==='fixed'));
      frame=requestAnimationFrame(tick);
    }
    sync();frame=requestAnimationFrame(tick);stop=()=>cancelAnimationFrame(frame);
  }
  new MutationObserver(mount).observe(document.querySelector('#lesson'),{childList:true});
  if(location.hash==='#reflection'){select(2);mount();document.querySelector('#reflection-demo')?.scrollIntoView();}else mount();
})();
