import test from 'node:test';
import assert from 'node:assert/strict';
import {ProgressSync,mergeRecords} from '../public/studyhub/chemistry-notes/progress-sync.mjs';
const fields=['read:foundation','read:bonds','quiz:1','quiz:2'];
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};};
function harness(t){
  const db=new Map(),watchers=new Map();let queue=Promise.resolve();
  const adapter={offline:false,subscribe(uid,next){const set=watchers.get(uid)||new Set();watchers.set(uid,set);set.add(next);next(db.get(uid)||{});return()=>set.delete(next);},async transact(uid,merge,write){if(this.offline)throw Error('offline');const op=queue.then(()=>{const result=write?merge(db.get(uid)||{}):db.get(uid)||{};if(write){db.set(uid,result);for(const fn of watchers.get(uid)||[])fn(result);}return result;});queue=op.catch(()=>{});return op;}};
  const create=(options={})=>{const sync=new ProgressSync({fields,storage:storage(),...options});sync.attach(adapter);t.after(()=>sync.close());return sync;};
  return {db,adapter,create};
}
test('merges separate chapter edits from two devices without overwriting either',async t=>{
  const {create}=harness(t),a=create(),b=create();await a.account({uid:'A'});await b.account({uid:'A'});
  a.set('read:foundation',true);b.set('read:bonds',true);await Promise.all([a.flush(),b.flush()]);
  assert.equal(a.records['read:bonds'].value,true);assert.equal(b.records['read:foundation'].value,true);
});
test('quiz answers and resets propagate; tombstones prevent stale resurrection',async t=>{
  const {create}=harness(t),a=create(),b=create();await a.account({uid:'A'});await b.account({uid:'A'});
  a.setMany({'read:foundation':true,'quiz:1':2});await a.flush();assert.equal(b.records['quiz:1'].value,2);
  const stale=structuredClone(a.records);b.setMany({'read:foundation':false,'quiz:1':null});await b.flush();
  assert.equal(a.records['read:foundation'].value,false);assert.equal(a.records['quiz:1'].value,null);
  assert.equal(mergeRecords(a.records,stale,new Set(fields))['quiz:1'].value,null);
});
test('offline edits survive a reload and synchronize after reconnecting',async t=>{
  const {create,adapter}=harness(t),disk=storage();const a=create({storage:disk});await a.account({uid:'A'});
  adapter.offline=true;a.set('read:bonds',true);await a.flush();assert.ok(a.pending['read:bonds']);a.close();
  const reloaded=create({storage:disk});await reloaded.account({uid:'A'});assert.ok(reloaded.pending['read:bonds']);
  adapter.offline=false;await reloaded.flush();assert.equal(Object.keys(reloaded.pending).length,0);
  const b=create();await b.account({uid:'A'});assert.equal(b.records['read:bonds'].value,true);
});
test('legacy checkboxes migrate once and cannot override a cloud reset',async t=>{
  const {create,db}=harness(t);db.set('A',{'read:foundation':{at:50,id:'cloud-reset',value:false}});
  const a=create({legacyComplete:['foundation','not-a-chapter']});assert.equal(a.records['read:foundation'].value,true);
  await a.account({uid:'A'});assert.equal(a.records['read:foundation'].value,false);
});
test('switching accounts isolates progress and claims guest data only once',async t=>{
  const {create,db}=harness(t),a=create();a.set('read:foundation',true);await a.account({uid:'A'});
  a.set('quiz:1',2);await a.flush();await a.account(null);assert.equal(a.records['quiz:1'],undefined);
  await a.account({uid:'B'});assert.equal(a.records['read:foundation'],undefined);assert.equal(a.records['quiz:1'],undefined);
  a.set('read:bonds',true);await a.flush();assert.equal(db.get('A')['read:bonds'],undefined);
  await a.account({uid:'A'});assert.equal(a.records['quiz:1'].value,2);
});
test('edits made during an in-flight write remain pending for the next write',async t=>{
  const {create,adapter}=harness(t),a=create();await a.account({uid:'A'});
  const original=adapter.transact.bind(adapter);let release;
  adapter.transact=async(...args)=>{await new Promise(r=>release=r);return original(...args);};
  a.set('read:foundation',true);const first=a.flush();a.set('read:foundation',false);release();await first;
  assert.equal(a.pending['read:foundation'].value,false);
  adapter.transact=original;await a.flush();assert.equal(a.records['read:foundation'].value,false);assert.deepEqual(a.pending,{});
});
test('guest edits after logout merge back into the original account, not another account',async t=>{
  const {create,db}=harness(t),a=create();await a.account({uid:'A'});await a.account(null);
  a.set('read:bonds',true);a.set('quiz:2',1);await a.account({uid:'B'});
  assert.equal(a.records['read:bonds'],undefined);
  await a.account({uid:'A'});assert.equal(a.records['read:bonds'].value,true);assert.equal(db.get('A')['quiz:2'].value,1);
  a.set('read:bonds',false);await a.flush();await a.account(null);await a.account({uid:'A'});
  assert.equal(a.records['read:bonds'].value,false,'old guest copy must not resurrect a cloud reset');
});
test('deterministic tie breaking and validation reject malformed cloud records',()=>{
  const a={'read:bonds':{value:true,at:8,id:'a'}},b={'read:bonds':{value:false,at:8,id:'b'},'quiz:1':{value:40,at:8,id:'c'},'read:unknown':{value:true,at:8,id:'d'}};
  const ab=mergeRecords(a,b,new Set(fields)),ba=mergeRecords(b,a,new Set(fields));assert.deepEqual(ab,ba);assert.equal(ab['read:bonds'].value,false);assert.equal(ab['quiz:1'],undefined);assert.equal(ab['read:unknown'],undefined);
});
test('late completion after account switch cannot update the new account UI',async t=>{
  const {create,adapter}=harness(t),a=create();await a.account({uid:'A'});
  const original=adapter.transact.bind(adapter);let release;
  adapter.transact=async(uid,...args)=>{if(uid==='A')await new Promise(r=>release=r);return original(uid,...args);};
  a.set('read:foundation',true);const pending=a.flush();await a.account({uid:'B'});release();await pending;
  assert.equal(a.uid,'B');assert.equal(a.records['read:foundation'],undefined);
});
