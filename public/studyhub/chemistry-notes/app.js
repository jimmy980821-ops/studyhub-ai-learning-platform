import {chapters,quiz} from './content.mjs';
import {ProgressSync} from './progress-sync.mjs';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const key = 'studyhub-chemistry-v1';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { saved = {}; }
const complete = new Set();
const answers = new Map();
const sync = new ProgressSync({fields:[...chapters.map(c=>`read:${c.id}`),...quiz.map(q=>`quiz:${q.id}`)],storage:{getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)},legacyComplete:Array.isArray(saved.complete)?saved.complete:[],onChange:renderProgress,onStatus:(message,state)=>{$('#cloudStatus').textContent=message;$('#cloudStatus').dataset.state=state;}});
function store() { try { localStorage.setItem(key,JSON.stringify({complete:[...complete],theme:document.documentElement.dataset.theme})); } catch { $('#storageStatus').textContent='瀏覽器無法儲存，這次操作仍有效，重新開啟後可能不保留。'; } }
function progress() { $('#progress').value=complete.size; $('#progressText').textContent=`${complete.size} / ${chapters.length}`; }
$$('[data-complete]').forEach(input=>{input.addEventListener('change',()=>sync.set(`read:${input.dataset.complete}`,input.checked));});
$('#resetProgress').addEventListener('click',()=>sync.setMany(Object.fromEntries(chapters.map(c=>[`read:${c.id}`,false]))));
function setTheme(dark) { document.documentElement.dataset.theme=dark?'dark':'light';$('#theme').textContent=dark?'淺色模式':'深色模式';$('#theme').setAttribute('aria-label',dark?'切換淺色模式':'切換深色模式'); }
setTheme(saved.theme==='dark'||(saved.theme!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches));
$('#theme').addEventListener('click',()=>{setTheme(document.documentElement.dataset.theme!=='dark');store();});
const lessons=$$('.lesson');
function searchable(text) { return text.normalize('NFKC').toLocaleLowerCase(); }
function search() { const term=searchable($('#search').value.trim());let count=0;$$('.chapter').forEach(article=>{const matched=!term||searchable(article.textContent).includes(term);article.hidden=!matched;if(matched){count++;if(term)article.querySelector('.lesson').open=true;}});$('#empty').hidden=count>0;$('#searchStatus').textContent=term?`找到 ${count} 個相關章節；搜尋範圍為預備課與 2-1～2-6。`:'';updateExpand(); }
$('#search').addEventListener('input',search);
$('#clearSearch').addEventListener('click',()=>{$('#search').value='';search();$('#search').focus();});
function updateExpand() { const visible=lessons.filter(d=>!d.closest('article').hidden);$('#expand').textContent=visible.length&&visible.every(d=>d.open)?'全部收合':'全部展開'; }
$('#expand').addEventListener('click',()=>{const visible=lessons.filter(d=>!d.closest('article').hidden);const open=!visible.every(d=>d.open);visible.forEach(d=>d.open=open);updateExpand();});
lessons.forEach(d=>d.addEventListener('toggle',updateExpand));
function revealHash() { const id=decodeURIComponent(location.hash.slice(1));const target=document.getElementById(id);if(!target)return;if(target.classList.contains('chapter')){if($('#search').value){$('#search').value='';search();}target.querySelector('.lesson').open=true;requestAnimationFrame(()=>target.scrollIntoView());}$$('.sidebar a').forEach(a=>a.classList.toggle('active',a.hash===location.hash)); }
window.addEventListener('hashchange',revealHash);
// Clicking an already-selected hash must still reopen a chapter after it was collapsed.
document.addEventListener('click',event=>{const anchor=event.target.closest('a[href^="#"]');if(anchor&&anchor.hash===location.hash)revealHash();});
let printState;
window.addEventListener('beforeprint',()=>{printState=$$('details').map(d=>[d,d.open]);$$('details').forEach(d=>d.open=true);$$('.chapter').forEach(a=>a.hidden=false);});
window.addEventListener('afterprint',()=>{printState?.forEach(([d,open])=>d.open=open);search();});
$('#print').addEventListener('click',()=>window.print());
function updateScore() { const correct=[...answers].filter(([id,a])=>quiz.find(q=>q.id===id).answer===a).length;$('#score').textContent=`已答 ${answers.size} / ${quiz.length} · 答對 ${correct} 題`;const weak=[...new Set([...answers].filter(([id,a])=>quiz.find(q=>q.id===id).answer!==a).map(([id])=>quiz.find(q=>q.id===id).chapter))];$('#advice').textContent=answers.size===0?'建議讀完各節，再獨立作答。':weak.length?`建議回讀：${weak.map(id=>chapters.find(c=>c.id===id).number).join('、')}。`:answers.size===quiz.length?'全部答對！隔天再遮住答案重做，確認能說出理由。':'目前已答題皆正確，繼續完成其餘題目。';filterWrong(); }
function filterWrong() { let visible=0;$$('.question').forEach(form=>{const id=Number(form.dataset.question);const q=quiz.find(q=>q.id===id);const show=!$('#wrongOnly').checked||(answers.has(id)&&answers.get(id)!==q.answer);form.hidden=!show;if(show)visible++;});$('#noWrong').hidden=!$('#wrongOnly').checked||visible>0; }
function renderProgress(records) {
  complete.clear();answers.clear();
  for(const c of chapters)if(records[`read:${c.id}`]?.value===true)complete.add(c.id);
  for(const q of quiz){const value=records[`quiz:${q.id}`]?.value;if(Number.isInteger(value)&&value>=0&&value<4)answers.set(q.id,value);}
  $$('[data-complete]').forEach(input=>input.checked=complete.has(input.dataset.complete));progress();
  $$('.question').forEach(form=>{const id=Number(form.dataset.question),q=quiz.find(q=>q.id===id),answered=answers.has(id),answer=answers.get(id);
    form.querySelectorAll('input').forEach(i=>{i.disabled=answered;if(answered)i.checked=Number(i.value)===answer;else if(form.dataset.answered==='true')i.checked=false;});
    form.dataset.answered=String(answered);
    const button=form.querySelector('button');button.disabled=answered;button.textContent=answered?'已作答':'確認答案';
    const feedback=form.querySelector('.feedback');feedback.hidden=!answered;form.querySelector('.back-lesson').hidden=!answered;
    if(answered){feedback.classList.toggle('wrong',answer!==q.answer);const title=document.createElement('strong');title.textContent=answer===q.answer?'答對了':`再看一次：正確答案是 ${'ABCD'[q.answer]}`;const body=document.createElement('p');body.textContent=q.explanation;feedback.replaceChildren(title,body);}
  });updateScore();
}
$$('.question').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();const id=Number(form.dataset.question);if(answers.has(id))return;const selected=form.querySelector('input:checked');if(selected)sync.set(`quiz:${id}`,Number(selected.value));}));
$('#wrongOnly').addEventListener('change',filterWrong);
$('#resetQuiz').addEventListener('click',()=>{$('#wrongOnly').checked=false;$$('.question').forEach(form=>form.reset());sync.setMany(Object.fromEntries(quiz.map(q=>[`quiz:${q.id}`,null])));});
let cloud=null;
async function loadCloud(){
  $('#googleLogin').disabled=true;
  try{const {connectFirebase}=await import('./firebase-sync.js');cloud=connectFirebase(sync,user=>{$('#cloudAccount').textContent=user?`已登入：${user.email||user.displayName||'Google 帳號'}`:'使用同一個 Google 帳號即可接續學習';$('#googleLogin').hidden=!!user;$('#googleLogout').hidden=!user;$('#syncNow').hidden=!user;});$('#googleLogin').disabled=false;}
  catch{$('#cloudStatus').textContent='雲端功能未載入；可繼續閱讀，連線後按「重試同步」。';$('#cloudStatus').dataset.state='error';}
}
$('#googleLogin').addEventListener('click',()=>{if(!cloud)return;cloud.login().catch(error=>{$('#cloudStatus').textContent=error?.code==='auth/popup-closed-by-user'?'已取消登入，資料保留在本機。':'登入未完成；請允許彈出視窗，並使用 Safari 或 Chrome 開啟此頁再試。';});});
$('#googleLogout').addEventListener('click',()=>cloud?.logout().catch(()=>$('#cloudStatus').textContent='登出未完成，請稍後再試。'));
$('#syncNow').addEventListener('click',()=>sync.flush());
$('#retrySync').addEventListener('click',()=>cloud?sync.flush():loadCloud());
window.addEventListener('online',()=>cloud?sync.flush():loadCloud());
window.addEventListener('offline',()=>{if(sync.uid)$('#cloudStatus').textContent='目前離線；變更先保留本機，恢復連線後自動同步。';});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync.flush();});
sync.emit();updateExpand();revealHash();loadCloud();
