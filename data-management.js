// ShotTrack local data backup, restore and round management.
(()=>{
  const $=id=>document.getElementById(id);
  const HISTORY_KEY='shottrack.history',CURRENT_KEY='shottrack.current',RECENTS_KEY='shottrack.recentCourses',SAFETY_KEY='shottrack.preImportBackup';
  const read=(key,fallback=null)=>{try{const v=localStorage.getItem(key);return v==null?fallback:JSON.parse(v)}catch{return fallback}};
  const snapshot=()=>({schema:'shottrack-backup',version:1,exportedAt:new Date().toISOString(),currentRound:read(CURRENT_KEY,null),rounds:read(HISTORY_KEY,[]),recentCourses:read(RECENTS_KEY,[])});
  function validRound(r){return r&&typeof r==='object'&&r.holes&&typeof r.holes==='object'}
  function validate(data){
    if(!data||data.schema!=='shottrack-backup'||Number(data.version)!==1)throw Error('This is not a supported ShotTrack backup.');
    if(!Array.isArray(data.rounds)||!data.rounds.every(validRound))throw Error('The backup contains invalid round data.');
    if(data.currentRound!=null&&!validRound(data.currentRound))throw Error('The current-round data is invalid.');
    if(data.recentCourses!=null&&!Array.isArray(data.recentCourses))throw Error('The recent-course data is invalid.');
    return data;
  }
  function apply(data){
    localStorage.setItem(HISTORY_KEY,JSON.stringify(data.rounds||[]));
    data.currentRound?localStorage.setItem(CURRENT_KEY,JSON.stringify(data.currentRound)):localStorage.removeItem(CURRENT_KEY);
    localStorage.setItem(RECENTS_KEY,JSON.stringify(data.recentCourses||[]));
  }
  function exportData(){
    const data=snapshot(),blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a'),day=new Date().toISOString().slice(0,10);
    a.href=url;a.download=`shottrack-backup-${day}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status(`Backup downloaded · ${data.rounds.length} round${data.rounds.length===1?'':'s'}`);
  }
  async function importFile(file){
    try{
      const data=validate(JSON.parse(await file.text())),count=data.rounds.length,current=data.currentRound?' and an active round':'';
      if(!confirm(`Restore ${count} saved round${count===1?'':'s'}${current}? This replaces the data currently stored on this device.`))return;
      localStorage.setItem(SAFETY_KEY,JSON.stringify(snapshot()));apply(data);alert('ShotTrack data restored successfully.');location.reload();
    }catch(e){alert(e?.message||'ShotTrack could not read that backup file.');}
  }
  function undoRestore(){
    const safety=read(SAFETY_KEY,null);if(!safety)return;
    if(!confirm('Undo the last restore and return to the data that was on this device beforehand?'))return;
    try{apply(validate(safety));localStorage.removeItem(SAFETY_KEY);alert('The previous device data has been restored.');location.reload();}catch{alert('The safety copy could not be restored.');}
  }
  function status(message){const el=$('dataStatus');if(el){el.textContent=message;el.classList.remove('hidden');}}
  function decorateHistory(){
    const rounds=store.getHistory(),cards=[...document.querySelectorAll('#historyList > .card:not(.empty)')];
    cards.slice(0,rounds.length).forEach((card,index)=>{
      if(card.querySelector('[data-delete-round]'))return;
      const r=rounds[index],date=new Date(r.date||r.completedAt||Date.now()).toLocaleDateString();
      card.insertAdjacentHTML('beforeend',`<button class="round-delete" data-delete-round="${index}" aria-label="Delete ${String(r.course||'saved round').replace(/"/g,'')}">Delete round</button>`);
      card.querySelector('[data-delete-round]').onclick=()=>{
        if(!confirm(`Delete the ${r.course||'saved course'} round from ${date}? This cannot be undone unless it exists in an exported backup.`))return;
        const next=store.getHistory();next.splice(index,1);localStorage.setItem(HISTORY_KEY,JSON.stringify(next));renderLastRound();history();status('Round deleted.');
      };
    });
    $('undoRestoreBtn')?.classList.toggle('hidden',!localStorage.getItem(SAFETY_KEY));
  }
  const baseHistory=history;
  history=function(){baseHistory();decorateHistory();};
  $('historyBtn').onclick=history;
  $('exportDataBtn')?.addEventListener('click',exportData);
  $('importDataBtn')?.addEventListener('click',()=>$('importDataInput')?.click());
  $('importDataInput')?.addEventListener('change',e=>{const file=e.target.files?.[0];if(file)importFile(file);e.target.value='';});
  $('undoRestoreBtn')?.addEventListener('click',undoRestore);
  $('undoRestoreBtn')?.classList.toggle('hidden',!localStorage.getItem(SAFETY_KEY));
  window.shotTrackData={snapshot,validate};
})();