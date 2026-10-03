import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,onAuthStateChanged,signInWithPopup,signOut} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {getFirestore,doc,onSnapshot,runTransaction,getDocFromServer} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

// Same public Firebase project identifiers as the StudyHub home page.
const config={apiKey:'AIzaSyBU4gvnt7fVHwkRbqbJ-hBBlmZrP0MgKY4',authDomain:'campus-flow-9965c.firebaseapp.com',projectId:'campus-flow-9965c',storageBucket:'campus-flow-9965c.firebasestorage.app',messagingSenderId:'706339405367',appId:'1:706339405367:web:6368418b712f0c613109b2'};
export function connectFirebase(controller,onUser) {
  const app=getApps().find(a=>a.name==='[DEFAULT]')||initializeApp(config);
  const auth=getAuth(app),database=getFirestore(app),provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  // Use the already-authorized user document; physics owns only this sibling field.
  const reference=uid=>doc(database,'users',uid,'studyhub','state');
  controller.attach({
    subscribe(uid,next,error){return onSnapshot(reference(uid),{includeMetadataChanges:true},snapshot=>next(snapshot.data()?.physicsWavesV1?.records||{},snapshot.metadata.fromCache),error);},
    async transact(uid,merge,write){
      const ref=reference(uid);
      if(!write){const snapshot=await getDocFromServer(ref);return snapshot.data()?.physicsWavesV1?.records||{};}
      return runTransaction(database,async transaction=>{
        const snapshot=await transaction.get(ref);
        const records=merge(snapshot.data()?.physicsWavesV1?.records||{});
        transaction.set(ref,{physicsWavesV1:{schemaVersion:1,records}},{mergeFields:['physicsWavesV1']});
        return records;
      });
    }
  });
  onAuthStateChanged(auth,user=>{onUser(user);controller.account(user);});
  return {login:()=>signInWithPopup(auth,provider),logout:()=>signOut(auth)};
}
