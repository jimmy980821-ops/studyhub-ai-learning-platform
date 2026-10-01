// Test-only Firebase SDK substitute: production firebase-sync.js still executes.
// Separate browser contexts share this backend, without touching real accounts.
export function firebaseFixture(){
  const documents=new Map();
  return {documents,async install(page){
    await page.exposeFunction('__readChemDoc',uid=>structuredClone(documents.get(uid)||{}));
    await page.exposeFunction('__writeChemDoc',(uid,data,fields)=>{const current=documents.get(uid)||{};for(const field of fields)current[field]=data[field];documents.set(uid,current);});
    await page.route('https://www.gstatic.com/firebasejs/**/firebase-*.js',async route=>{
      const name=route.request().url().split('/').at(-1);let body;
      if(name==='firebase-app.js')body='export const getApps=()=>[];export const initializeApp=config=>({config});';
      else if(name==='firebase-auth.js')body=`
        const listeners=new Set();
        const user=()=>localStorage.getItem('test-google-uid')?{uid:localStorage.getItem('test-google-uid'),email:'reader@example.test'}:null;
        export const getAuth=()=>({});
        export class GoogleAuthProvider{setCustomParameters(){}}
        export function onAuthStateChanged(auth,cb){listeners.add(cb);queueMicrotask(()=>cb(user()));return()=>listeners.delete(cb);}
        export async function signInWithPopup(){localStorage.setItem('test-google-uid','test-reader');for(const cb of listeners)cb(user());return {user:user()};}
        export async function signOut(){localStorage.removeItem('test-google-uid');for(const cb of listeners)cb(null);}
      `;
      else body=`
        export const getFirestore=()=>({});export const doc=(db,...parts)=>({uid:parts[1]});
        const snap=data=>({data:()=>data,metadata:{fromCache:false}});
        export const getDocFromServer=async ref=>{if(!navigator.onLine)throw Error('offline');return snap(await window.__readChemDoc(ref.uid));};
        export function onSnapshot(ref,options,next,error){let last='';let closed=false;const poll=async()=>{if(closed||!navigator.onLine)return;try{const data=await window.__readChemDoc(ref.uid);if(!closed&&JSON.stringify(data)!==last){last=JSON.stringify(data);next(snap(data));}}catch(e){if(!closed)error(e);}};poll();const timer=setInterval(poll,80);return()=>{closed=true;clearInterval(timer);};}
        export async function runTransaction(db,fn){if(!navigator.onLine)throw Error('offline');let save;const result=await fn({get:async ref=>snap(await window.__readChemDoc(ref.uid)),set:(ref,data,options)=>{save={ref,data,options};}});if(save)await window.__writeChemDoc(save.ref.uid,save.data,save.options.mergeFields);return result;}
      `;
      await route.fulfill({status:200,contentType:'text/javascript',body});
    });
  }};
}
