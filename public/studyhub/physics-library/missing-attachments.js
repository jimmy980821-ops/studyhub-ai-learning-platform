// Original repository does not contain the referenced local exam PDF folders.
(() => {
 function mark(){
  for(const a of document.querySelectorAll('a[href]')){
   let url;try{url=new URL(a.getAttribute('href'),location.href);}catch{continue;}
   if(url.origin!==location.origin||!url.pathname.toLowerCase().endsWith('.pdf'))continue;
   a.removeAttribute('href');a.removeAttribute('target');a.setAttribute('aria-disabled','true');a.style.opacity='.65';a.style.cursor='default';a.title='原專案未附此 PDF';a.append('（尚無附件）');
  }
 }
 mark();new MutationObserver(mark).observe(document.body,{childList:true,subtree:true});
})();
