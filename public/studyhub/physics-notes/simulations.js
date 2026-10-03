(() => {
 const TAU=2*Math.PI, green='#5ce0c0',orange='#ffb265',blue='#9fc9ff',muted='#a8c3cc';
 const configs={
  superposition:{title:'疊加：逐點把位移加起來',intro:'綠色與橘色代表兩個同頻波，藍色是合成結果。把相位差拉到 180°，觀察等振幅時完全抵消。',controls:[['phase','相位差（°）',0,360,1,0],['ratio','第二波振幅 / 第一波',0,1,0.1,1]],note:'橫軸為位置（以波長 λ 為單位）；縱軸為位移 / 第一波振幅。兩波以相同方向、相同頻率行進。'},
  standing:{title:'駐波：找到一直不動的位置',intro:'切換諧波次數，數一數波腹和波節。橘點是波節；虛線是各位置的最大位移包絡。',controls:[['mode','諧波次數 n',1,5,1,1]],note:'兩端固定的理想弦，橫軸為 x/L。動畫以慢速展示一個振動週期；振幅為相對值。'},
  sound:{title:'空氣分子不會跟著聲音跑',intro:'綠點左右振動，疏密擾動向右傳。橘點標記同一個分子，觀察它始終留在原位置附近。',controls:[['strength','相對位移振幅',0.1,1,0.1,0.6]],note:'粒子間距與位移已放大，時間刻意放慢。這是縱波示意，並未模擬分子的隨機熱運動。'},
  pipe:{title:'開管與閉管：位移和壓力對照',intro:'綠色曲線顯示空氣縱向位移的數值，橘色曲線顯示壓力變化。曲線上下不是空氣的運動方向。',controls:[['kind','管端條件',[['open','兩端開口'],['closed','左閉右開']]],['mode','第幾個允許模式',1,4,1,1],['length','管長 L（m）',0.2,1.6,0.05,0.85]],note:'取聲速 340 m/s、忽略端部修正。兩種縱軸各自正規化，不能用曲線高度比較其單位；動畫放慢播放。'},
  resonance:{title:'調整驅動頻率，看共振峰',intro:'把驅動頻率調近固有頻率，再比較不同阻尼。下面標記代表驅動下的穩態振幅。',controls:[['ratio','驅動頻率 / 固有頻率',0.1,2,0.01,1],['damping','阻尼比 ζ',0.08,0.6,0.02,0.2]],note:'線性受迫振子模型，曲線為振幅放大倍率。阻尼較小時峰值接近固有頻率；有阻尼時位移振幅最大值略低於固有頻率。'},
  huygens:{title:'惠更斯原理：次波拼出新波前',intro:'青色直線是原波前；各點發出的圓形次波隨時間變大。橘色線顯示沿原傳播方向形成的新波前。',controls:[['speed','示意波速',0.5,2,0.1,1]],note:'均勻介質中的平面波示意。圓表示次波，前進方向的包絡是新波前；不代表原來的波同時向後傳。'},
  interference:{title:'雙源干涉：用路徑差找強弱',intro:'移動觀察點 P，看看距離差是幾個波長。背景明暗表示合振幅大小，並非瞬間水面高低。',controls:[['x','P 的水平位置（λ）',-3,3,0.1,0],['y','P 的垂直位置（λ）',0.5,4,0.1,2],['phase','兩源初相位差（°）',0,180,180,0]],note:'兩源相距 3λ、同頻；理想化為觀察區內兩波振幅相等且不隨距離衰減。亮處振幅大，暗處接近波節。'}
 };
 let cleanup=()=>{};
 window.mountSimulations=()=>{
  cleanup();const stops=[];document.querySelectorAll('[data-lab]').forEach(root=>{
   const type=root.dataset.lab,cfg=configs[type];if(!cfg)return;
   root.innerHTML=`<section class="sim-card"><h3>${cfg.title}</h3><p>${cfg.intro}</p><canvas role="img" aria-label="${cfg.title}；觀察結果也顯示在下方文字"></canvas><div class="sim-controls">${cfg.controls.map(([key,label,min,max,step,value])=>Array.isArray(min)?`<label>${label}<select data-key="${key}">${min.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>`:`<label>${label}<output data-for="${key}">${value}</output><input aria-label="${label}" data-key="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`).join('')}</div><p class="sim-readout" aria-live="polite"></p>${type==='interference'?'':`<button class="outline" data-play>播放動畫</button> <button class="outline" data-step>前進一小步</button>`}<p class="muted">${cfg.note}</p></section>`;
   const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),readout=root.querySelector('.sim-readout');let t=0,last=0,frame=0,playing=false,dirty=true;
   const values=()=>Object.fromEntries([...root.querySelectorAll('[data-key]')].map(e=>[e.dataset.key,e.tagName==='SELECT'?e.value:Number(e.value)]));
   const update=()=>{dirty=true;root.querySelectorAll('output').forEach(e=>e.textContent=root.querySelector(`[data-key="${e.dataset.for}"]`).value);};
   root.querySelectorAll('[data-key]').forEach(e=>e.addEventListener('input',update));
   const button=root.querySelector('[data-play]');if(button){button.onclick=()=>{playing=!playing;button.textContent=playing?'暫停動畫':'播放動畫';button.setAttribute('aria-pressed',String(playing));};root.querySelector('[data-step]').onclick=()=>{playing=false;button.textContent='播放動畫';button.setAttribute('aria-pressed','false');t+=0.08;dirty=true;};button.setAttribute('aria-pressed','false');}
   function render(){const r=values(),w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#102e38';ctx.fillRect(0,0,w,h);ctx.font='13px system-ui';const left=32,right=w-22,width=right-left,mid=h/2;
    const line=(x1,y1,x2,y2,color=muted)=>{ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
    const text=(s,x,y,color=muted)=>{ctx.fillStyle=color;ctx.fillText(s,x,y);};
    const dot=(x,y,color=orange,size=5)=>{ctx.beginPath();ctx.fillStyle=color;ctx.arc(x,y,size,0,TAU);ctx.fill();};
    const curve=(fn,color,y0=mid,scale=55)=>{ctx.strokeStyle=color;ctx.lineWidth=2.3;ctx.beginPath();for(let p=0;p<=width;p++){let y=y0-scale*fn(p/width);if(!p)ctx.moveTo(left+p,y);else ctx.lineTo(left+p,y);}ctx.stroke();};
    if(type==='superposition'){
     const phase=r.phase*Math.PI/180;line(left,mid,right,mid);curve(x=>Math.sin(TAU*(2*x-t*.4)),green);curve(x=>r.ratio*Math.sin(TAU*(2*x-t*.4)+phase),orange);curve(x=>Math.sin(TAU*(2*x-t*.4))+r.ratio*Math.sin(TAU*(2*x-t*.4)+phase),blue);
     text('0',left,h-12);text('x / λ = 2',right-65,h-12);text('綠：波 1　橘：波 2　藍：合成',left,22);
     readout.textContent=`合振幅 / A₁ = ${Math.sqrt(1+r.ratio**2+2*r.ratio*Math.cos(phase)).toFixed(2)}；相位差 ${r.phase}°。`;
    }else if(type==='standing'){
     line(left,mid,right,mid);ctx.setLineDash([4,5]);curve(x=>Math.abs(Math.sin(Math.PI*r.mode*x)),muted);curve(x=>-Math.abs(Math.sin(Math.PI*r.mode*x)),muted);ctx.setLineDash([]);curve(x=>Math.sin(Math.PI*r.mode*x)*Math.cos(TAU*t*.4),green);
     for(let i=0;i<=r.mode;i++)dot(left+width*i/r.mode,mid);text('固定端',left,25);text('固定端',right-45,25);text('x/L = 0',left,h-15);text('1',right-6,h-15);readout.textContent=`${r.mode} 個波腹、${r.mode+1} 個波節；λ = ${(2/r.mode).toFixed(2)}L，f = ${r.mode}f₁。`;
    }else if(type==='sound'){
     for(let row=0;row<5;row++)for(let i=0;i<43;i++){const base=i/42;const x=left+width*(base+.013*r.strength*Math.sin(TAU*(3*base-t*.4)));dot(x,70+row*24,i===21?orange:green,i===21?4:2.5);}text('聲波傳播方向：向右',left,25);text('橘色質點：只在原處附近左右振動',left,h-18);readout.textContent=`改變振幅不改變本示意中的波速與頻率；相對振幅 ${r.strength.toFixed(1)}。`;
    }else if(type==='pipe'){
     const closed=r.kind==='closed',k=closed?(2*r.mode-1)*Math.PI/2:r.mode*Math.PI;const fy=x=>closed?Math.sin(k*x):Math.cos(k*x);const fp=x=>closed?Math.cos(k*x):-Math.sin(k*x);
     line(left,85,right,85);line(left,185,right,185);if(closed){line(left,40,left,115,orange);line(left,140,left,215,orange);}curve(x=>fy(x)*Math.cos(TAU*t*.35),green,85,30);curve(x=>fp(x)*Math.sin(TAU*t*.35),orange,185,30);
     ctx.setLineDash([4,4]);curve(x=>Math.abs(fy(x)),muted,85,30);curve(x=>-Math.abs(fy(x)),muted,85,30);curve(x=>Math.abs(fp(x)),muted,185,30);curve(x=>-Math.abs(fp(x)),muted,185,30);ctx.setLineDash([]);
     text('位移（綠）',left,24,green);text('壓力變化（橘）',left,137,orange);text(closed?'閉端':'開端',left,h-12);text('開端',right-30,h-12);const n=closed?2*r.mode-1:r.mode,lambda=(closed?4:2)*r.length/n;readout.textContent=`第 ${n} 諧波：λ = ${lambda.toFixed(3)} m，f = ${(340/lambda).toFixed(1)} Hz。開端位移腹／壓力節；閉端相反。`;
    }else if(type==='resonance'){
     const gain=x=>1/Math.sqrt((1-x*x)**2+(2*r.damping*x)**2),bottom=h-52,scale=20;line(left,bottom,right,bottom);curve(x=>gain(2*x),green,bottom,scale);const x=left+width*r.ratio/2,y=bottom-scale*gain(r.ratio);dot(x,y);line(x,y,x,bottom,orange);text('振幅放大倍率',left,22);text('0',left,h-26);text('f / f₀ = 2',right-75,h-26);dot(left+width*.5+25*Math.cos(TAU*t*.4*r.ratio),h-12,blue,5);readout.textContent=`目前倍率 ${gain(r.ratio).toFixed(2)}；阻尼比 ${r.damping.toFixed(2)}。這是穩態響應，未呈現剛開始振動的過渡過程。`;
    }else if(type==='huygens'){
     const x0=left+width*.2,radius=10+((t*r.speed*.18)%1)*width*.55;line(x0,25,x0,h-25,green);for(let y=-100;y<h+100;y+=28){ctx.beginPath();ctx.strokeStyle='#48787f';ctx.arc(x0,y,radius,0,TAU);ctx.stroke();dot(x0,y,green,2);}line(x0+radius,25,x0+radius,h-25,orange);text('原波前',left,18,green);text('新波前',Math.min(x0+radius,right-48),18,orange);readout.textContent='經過 Δt，每個次波半徑為 vΔt；新波前也前進 vΔt。';
    }else if(type==='interference'){
     const phi=r.phase*Math.PI/180,px=x=>left+(x+3)/6*width,py=y=>h-30-y/4.5*(h-55);
     for(let ix=0;ix<width;ix+=5)for(let iy=0;iy<h-55;iy+=5){const x=ix/width*6-3,y=iy/(h-55)*4.5;const dr=Math.hypot(x+1.5,y)-Math.hypot(x-1.5,y);const a=Math.abs(Math.cos(Math.PI*dr+phi/2));ctx.fillStyle=`rgb(${15+25*a},${45+115*a},${55+75*a})`;ctx.fillRect(left+ix,py(y)-5,5,5);}
     const pX=px(r.x),pY=py(r.y);line(px(-1.5),py(0),pX,pY,orange);line(px(1.5),py(0),pX,pY,blue);dot(px(-1.5),py(0));dot(px(1.5),py(0),blue);dot(pX,pY,'#fff');text('S₁',px(-1.5)-10,h-8);text('S₂',px(1.5)-10,h-8);text('P',Math.min(pX+8,right-10),pY-8,'#fff');const d1=Math.hypot(r.x+1.5,r.y),d2=Math.hypot(r.x-1.5,r.y),a=2*Math.abs(Math.cos(Math.PI*(d1-d2)+phi/2));readout.textContent=`r₁=${d1.toFixed(2)}λ，r₂=${d2.toFixed(2)}λ，Δr=${Math.abs(d1-d2).toFixed(2)}λ；合振幅約 ${a.toFixed(2)}A。`;
    }
   }
   const observer=new ResizeObserver(()=>dirty=true);observer.observe(canvas);
   function tick(now){if(last&&playing&&!document.hidden){t+=Math.min((now-last)/1000,.05);dirty=true;}last=now;if(dirty){render();dirty=false;}frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);stops.push(()=>{cancelAnimationFrame(frame);observer.disconnect();});
  });cleanup=()=>stops.forEach(stop=>stop());
 };
})();
