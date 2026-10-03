// Per-item last-write-wins records retain false/null tombstones for undo/reset.
export function validRecord(key, record, fields) {
  return fields.has(key) && record && Number.isSafeInteger(record.at) && record.at >= 0 &&
    typeof record.id === 'string' && record.id.length <= 100 &&
    (key.startsWith('read:') ? typeof record.value === 'boolean' : record.value === null || Number.isInteger(record.value) && record.value >= 0 && record.value < 3);
}
export function mergeRecords(left, right, fields) {
  const result = {};
  for (const source of [left, right]) for (const [key, value] of Object.entries(source || {})) {
    if (!validRecord(key, value, fields)) continue;
    const old = result[key];
    if (!old || value.at > old.at || value.at === old.at && value.id > old.id) result[key] = {...value};
  }
  return result;
}

export class ProgressSync {
  constructor({fields, storage, legacyComplete = [], onChange = () => {}, onStatus = () => {}}) {
    this.fields = new Set(fields); this.storage = storage; this.onChange = onChange; this.onStatus = onStatus;
    this.uid = null; this.session = 0; this.adapter = null; this.unsubscribe = null; this.timer = null; this.running = false;
    this.records = this.load('guest'); this.pending = {};
    // Only migrate the old v1 checkboxes once. Timestamp zero never beats newer cloud edits.
    if (!this.read('wave-sync-migrated')) {
      for (const id of legacyComplete) if (this.fields.has(`read:${id}`) && !this.records[`read:${id}`]) this.records[`read:${id}`] = {value:true, at:0, id:'legacy'};
      this.persist(); this.write('wave-sync-migrated', true);
    }
  }
  read(key) { try { return JSON.parse(this.storage.getItem(key) || 'null'); } catch { return null; } }
  write(key, value) { try { this.storage.setItem(key, JSON.stringify(value)); } catch { this.onStatus('瀏覽器無法保留資料，請保持頁面開啟並完成同步。', 'error'); } }
  load(scope) { return mergeRecords({}, this.read(`wave-sync:${scope}`)?.records, this.fields); }
  persist() { this.write(`wave-sync:${this.uid || 'guest'}`, {records:this.records,pending:this.pending || {}}); }
  emit() { this.onChange(this.records); }
  set(key, value) { this.setMany({[key]:value}); }
  setMany(values) {
    const at = Math.max(Date.now(), ...Object.values(this.records).map(r=>r.at + 1));
    for (const [key,value] of Object.entries(values)) {
      const record = {value, at, id:crypto.randomUUID()};
      if (!validRecord(key,record,this.fields)) continue;
      this.records[key] = record;
      if (this.uid) this.pending[key] = record;
    }
    this.persist(); this.emit();
    if (this.uid) { this.onStatus('已存本機，等待雲端同步…','pending'); this.schedule(500); }
  }
  attach(adapter) { this.adapter = adapter; }
  async account(user) {
    this.session++; this.unsubscribe?.(); this.unsubscribe=null; clearTimeout(this.timer); this.running=false;
    this.uid=user?.uid || null;
    this.records=this.load(this.uid || 'guest');
    this.pending=this.uid?mergeRecords({},this.read(`wave-sync:${this.uid}`)?.pending,this.fields):{};
    // Later guest edits can return to their original account, never a second account.
    const claimed=this.read('wave-sync-claimed');
    if (this.uid && (!claimed || claimed===this.uid)) {
      const guest=this.load('guest');
      this.records=mergeRecords(this.records,guest,this.fields);
      this.pending=mergeRecords(this.pending,guest,this.fields);
      this.write('wave-sync-claimed',this.uid);
    }
    this.persist(); this.emit();
    if (!this.uid) { this.onStatus('尚未登入；閱讀進度與測驗答案保存在這個瀏覽器。','local');return; }
    this.onStatus('正在讀取 Google 雲端進度…','pending');
    this.watch();
    await this.flush();
  }
  watch() {
    this.unsubscribe?.();this.watchFailed=false;
    const session=this.session;
    this.unsubscribe=this.adapter.subscribe(this.uid,(remote,fromCache=false)=>{
      if(session!==this.session)return;
      this.records=mergeRecords(this.records,remote,this.fields);this.persist();this.emit();
      if(!Object.keys(this.pending).length && !fromCache)this.onStatus('已同步；手機與電腦請使用同一個 Google 帳號。','synced');
    },error=>{if(session===this.session){this.watchFailed=true;this.failure(error);}});
  }
  schedule(delay=1000) { clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush(),delay); }
  failure(error) {
    this.onStatus(String(error?.code||'').includes('permission-denied')?'雲端權限不足，資料仍在本機；請確認帳號，或稍後再試。':'暫時無法連上雲端，資料已保留；恢復連線後會重試。','error');
    if(this.uid)this.schedule(30000);
  }
  async flush() {
    if(!this.uid||!this.adapter||this.running)return;
    if(this.watchFailed)this.watch();
    this.running=true;const session=this.session,uid=this.uid;
    const sent={...this.pending};
    this.onStatus('正在同步…','pending');
    try {
      const remote=await this.adapter.transact(uid,cloud=>mergeRecords(cloud,sent,this.fields),Object.keys(sent).length>0);
      if(session!==this.session)return;
      this.records=mergeRecords(this.records,remote,this.fields);
      for(const [key,record] of Object.entries(sent))if(this.pending[key]?.id===record.id)delete this.pending[key];
      this.persist();this.emit();
      if(Object.keys(this.pending).length){this.onStatus('已存本機，等待剩餘變更同步…','pending');this.schedule(500);}
      else this.onStatus('已同步；手機與電腦請使用同一個 Google 帳號。','synced');
    } catch(error) { if(session===this.session)this.failure(error); }
    finally { if(session===this.session)this.running=false; }
  }
  close(){clearTimeout(this.timer);this.unsubscribe?.();this.session++;}
}
