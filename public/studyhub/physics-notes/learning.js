const studyIds = ['1-1','1-2','1-3','1-4','1-5','1-6','1-7','2-1','2-2','2-3'];
const Study = (()=>{
 let records={},ready=false,controller=null,connection=null;
 function announce(message){document.querySelector('#sync-status').textContent=message;}
 function set(key,value){controller?.set(key,value);}
 function display(){
   const done=studyIds.filter(id=>records['read:'+id]?.value===true).length;
   document.querySelector('#progress-text').textContent=`已完成 ${done} / 10 節`;
   document.querySelector('#progress-meter').value=done;
   document.querySelectorAll('#nav button').forEach((b,i)=>{b.classList.toggle('finished',records['read:'+studyIds[i]]?.value===true);});
   const cb=document.querySelector('#lesson-done');if(cb){cb.checked=records['read:'+cb.dataset.id]?.value===true;cb.disabled=!ready;}
   document.querySelectorAll('[data-question]').forEach(el=>{
     const choice=records['quiz:'+el.dataset.question]?.value;
     const [lessonId,qi]=el.dataset.question.split(':');const q=physicsQuestions[studyIds.indexOf(lessonId)][Number(qi)];
     el.querySelectorAll('button').forEach((b,i)=>{b.disabled=!ready;b.setAttribute('aria-pressed',String(choice===i));b.classList.toggle('chosen',choice===i);});
     const feedback=el.querySelector('.feedback');feedback.textContent=Number.isInteger(choice)?`${choice===q[2]?'答對了。':'再想一下。'}${q[3]}`:'';
     feedback.classList.toggle('incorrect',Number.isInteger(choice)&&choice!==q[2]);
   });
 }
 function mount(l){
   document.querySelector('#lesson').insertAdjacentHTML('beforeend',`<section class="practice"><div class="eyebrow">CHECK YOUR UNDERSTANDING</div><h3>先自己想，再看解析</h3>${l.quiz.map((q,i)=>`<div class="question" data-question="${l.id}:${i}"><h4>${i+1}. ${q[0]}</h4><div class="answers">${q[1].map((v,n)=>`<button type="button" data-choice="${n}" aria-pressed="false">${v}</button>`).join('')}</div><p class="feedback" aria-live="polite"></p></div>`).join('')}<label class="complete"><input id="lesson-done" type="checkbox" data-id="${l.id}"> 我能解釋本節重點，並完成練習</label><p class="muted">完成狀態與練習答案會儲存到目前登入的帳號；答錯可以重新選擇。</p></section>`);
   document.querySelector('#lesson-done').onchange=e=>set('read:'+l.id,e.target.checked);
   document.querySelectorAll('[data-question] button').forEach(b=>b.onclick=()=>set('quiz:'+b.closest('[data-question]').dataset.question,Number(b.dataset.choice)));
   display();
 }

 async function connect(){
  try{
   connection=(await import('./firebase-sync.js')).connectFirebase(controller,user=>{
    document.querySelector('#sync-account').textContent=user?.email||'尚未登入 Google';
    document.querySelector('#sign-in').hidden=!!user;
    document.querySelector('#sign-out').hidden=!user;
   });
   document.querySelector('#sign-in').disabled=false;
  }catch{announce('進度保存在此瀏覽器；Google 同步暫時無法連線，請按立即同步重試。');}
 }
 window.addEventListener('DOMContentLoaded',async()=>{
  const {ProgressSync}=await import('./progress-sync.mjs');
  let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw Error('unavailable')}};}
  controller=new ProgressSync({fields:studyIds.flatMap(id=>['read:'+id,...[0,1,2].map(q=>'quiz:'+id+':'+q)]),storage,onChange:r=>{records=r;display();},onStatus:announce});
  records=controller.records;ready=true;display();
  document.querySelector('#sign-in').onclick=async()=>{try{await connection?.login();}catch(e){announce(e?.code==='auth/popup-closed-by-user'?'登入已取消，進度仍保存在此瀏覽器。':'登入未完成，請允許登入視窗後重試。');}};
  document.querySelector('#sign-out').onclick=async()=>{try{await connection?.logout();}catch{announce('登出未完成，請稍後重試。');}};
  document.querySelector('#sync-now').onclick=async()=>{if(!connection)await connect();else if(controller.uid)await controller.flush();else announce('請登入 Google，才能同步手機與電腦的進度。');};
  window.addEventListener('online',()=>controller.flush());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)controller.flush();});
  await connect();
 });
 return {mount};
})();
