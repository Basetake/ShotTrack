// Local-first Supabase account and cloud backup for ShotTrack.
(()=>{
  const SUPABASE_URL='https://clnqntqhjqdmzsoiajwe.supabase.co';
  const SUPABASE_KEY='sb_publishable_IC1iC5cNsr56cCLCN1a-4g_R0WaDBOB';
  const META_KEY='shottrack.cloudMeta';
  const $=id=>document.getElementById(id);
  const client=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
  let user=null,syncing=false,timer=null,lastSnapshot='';

  const read=(key,fallback=null)=>{try{const value=localStorage.getItem(key);return value==null?fallback:JSON.parse(value)}catch{return fallback}};
  const meta=()=>read(META_KEY,{dirty:false,lastSyncedAt:null});
  const setMeta=value=>localStorage.setItem(META_KEY,JSON.stringify({...meta(),...value}));
  const snapshot=()=>window.shotTrackData?.snapshot?.()||{schema:'shottrack-backup',version:1,exportedAt:new Date().toISOString(),currentRound:read('shottrack.current',null),rounds:read('shottrack.history',[]),recentCourses:read('shottrack.recentCourses',[])};
  const comparable=data=>JSON.stringify({currentRound:data.currentRound||null,rounds:data.rounds||[],recentCourses:data.recentCourses||[]});
  const hasLocalData=data=>!!data.currentRound||data.rounds.length>0||data.recentCourses.length>0;
  const setStatus=(message,error=false)=>{const el=$('cloudStatus');if(el){el.textContent=message;el.classList.toggle('error',error)}};
  const formatTime=value=>value?new Date(value).toLocaleString():'';

  function render(){
    $('cloudSignedOut')?.classList.toggle('hidden',!!user);
    $('cloudSignedIn')?.classList.toggle('hidden',!user);
    if($('cloudAccount'))$('cloudAccount').textContent=user?`Signed in as ${user.email}`:'';
    const badge=$('cloudBadge');
    if(badge){badge.textContent=user?(meta().dirty?'Waiting to sync':'Synced'):'Device only';badge.classList.toggle('active',!!user&&!meta().dirty)}
  }

  function apply(data){
    const clean=window.shotTrackData?.validate?.(data)||data;
    localStorage.setItem('shottrack.history',JSON.stringify(clean.rounds||[]));
    clean.currentRound?localStorage.setItem('shottrack.current',JSON.stringify(clean.currentRound)):localStorage.removeItem('shottrack.current');
    localStorage.setItem('shottrack.recentCourses',JSON.stringify(clean.recentCourses||[]));
  }

  async function fetchCloud(){
    const {data,error}=await client.from('shottrack_backups').select('payload,updated_at').eq('user_id',user.id).maybeSingle();
    if(error)throw error;
    return data;
  }

  async function push(data=snapshot()){
    const payload={...data,exportedAt:new Date().toISOString()};
    const {data:row,error}=await client.from('shottrack_backups').upsert({user_id:user.id,payload},{onConflict:'user_id'}).select('updated_at').single();
    if(error)throw error;
    lastSnapshot=comparable(payload);
    setMeta({dirty:false,lastSyncedAt:row.updated_at});
    render();
    setStatus(`Cloud backup current · ${formatTime(row.updated_at)}`);
  }

  async function sync({manual=false}={}){
    if(!client||!user||syncing||!navigator.onLine)return;
    syncing=true;
    if(manual)setStatus('Syncing…');
    try{
      const local=snapshot(),cloud=await fetchCloud(),state=meta();
      if(!cloud){await push(local);return}
      if(state.dirty||(hasLocalData(local)&&!state.lastSyncedAt)){await push(local);return}
      if(new Date(cloud.updated_at)>new Date(state.lastSyncedAt||0)&&comparable(cloud.payload)!==comparable(local)){
        apply(cloud.payload);
        lastSnapshot=comparable(cloud.payload);
        setMeta({dirty:false,lastSyncedAt:cloud.updated_at});
        setStatus(`Cloud data restored · ${formatTime(cloud.updated_at)}`);
        render();
        location.reload();
        return;
      }
      lastSnapshot=comparable(local);
      setMeta({dirty:false,lastSyncedAt:cloud.updated_at});
      render();
      setStatus(`Cloud backup current · ${formatTime(cloud.updated_at)}`);
    }catch(error){
      setStatus(error?.message||'Cloud sync is temporarily unavailable. Your device copy is safe.',true);
    }finally{syncing=false}
  }

  function markDirty(){
    const now=comparable(snapshot());
    if(now===lastSnapshot)return;
    lastSnapshot=now;
    setMeta({dirty:true,modifiedAt:new Date().toISOString()});
    render();
    clearTimeout(timer);
    timer=setTimeout(()=>sync(),1200);
  }

  async function signIn(){
    const email=$('cloudEmail')?.value.trim();
    if(!email)return setStatus('Enter your email address first.',true);
    $('cloudSignInBtn').disabled=true;
    setStatus('Sending secure sign-in link…');
    const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:`${location.origin}${location.pathname}`}});
    $('cloudSignInBtn').disabled=false;
    setStatus(error?(error.message||'Could not send the sign-in link.'):'Check your email and open the ShotTrack sign-in link.',!!error);
  }

  async function signOut(){
    await client.auth.signOut();
    user=null;
    render();
    setStatus('Signed out. Rounds still remain saved on this device.');
  }

  async function init(){
    if(!client){setStatus('Cloud sync could not load. Your device copy is still working.',true);return}
    lastSnapshot=comparable(snapshot());
    const {data}=await client.auth.getSession();
    user=data.session?.user||null;
    if(user&&meta().userId!==user.id)setMeta({userId:user.id,dirty:true,lastSyncedAt:null});
    render();
    client.auth.onAuthStateChange((_event,session)=>{
      const before=user?.id;
      user=session?.user||null;
      if(user&&meta().userId!==user.id)setMeta({userId:user.id,dirty:true,lastSyncedAt:null});
      render();
      if(user&&user.id!==before)setTimeout(()=>sync(),0);
    });
    if(user)sync();
    setInterval(markDirty,2500);
  }

  $('cloudSignInBtn')?.addEventListener('click',signIn);
  $('cloudSyncBtn')?.addEventListener('click',()=>sync({manual:true}));
  $('cloudSignOutBtn')?.addEventListener('click',signOut);
  $('cloudEmail')?.addEventListener('keydown',event=>{if(event.key==='Enter')signIn()});
  window.addEventListener('online',()=>sync());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});
  init();
})();
