(() => {
 const note=document.currentScript?.dataset.note||'';
 const home=new URL('./',document.currentScript.src).href;
 function mount(){
  const host=document.createElement('studyhub-return');
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML='<style>:host{display:block;position:fixed;right:12px;bottom:12px;z-index:100000}a{display:block;padding:10px 16px;border:1px solid #94a9c8;border-radius:24px;background:#fff;color:#203252;box-shadow:0 3px 14px #16365e22;font:600 14px/1.4 system-ui,sans-serif;text-decoration:none}a:focus-visible{outline:3px solid #d17b24;outline-offset:3px}</style><a>返回 StudyHub</a>';
  const link=shadow.querySelector('a');link.href=home;link.title=note;
  document.body.append(host);
 }
 if(document.readyState==='complete')mount();else window.addEventListener('load',mount,{once:true});
})();
