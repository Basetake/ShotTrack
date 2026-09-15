// ShotTrack V2 hotfix: satellite basemap + safe migration for rounds saved by earlier prototypes.
function normalizeRound(r){
  if(!r)return null;
  r.course=r.course||'Saved course';
  r.tee=r.tee||'Tee';
  r.holesCount=Number(r.holesCount)||18;
  r.currentHole=Number(r.currentHole)||1;
  r.courseCenter=r.courseCenter&&Number.isFinite(Number(r.courseCenter.lat))&&Number.isFinite(Number(r.courseCenter.lng))?{lat:Number(r.courseCenter.lat),lng:Number(r.courseCenter.lng)}:{lat:40.5363,lng:-111.8345};
  r.holes=r.holes||{};
  for(let i=1;i<=r.holesCount;i++){
    const old=r.holes[i]||{};
    r.holes[i]={...old,shots:Array.isArray(old.shots)?old.shots:[],start:old.start||null,par:old.par||null,yards:old.yards||null};
  }
  return r;
}

ensureMap=function(){
  if(map){map.invalidateSize(true);return;}
  const c=round?.courseCenter||{lat:40.5363,lng:-111.8345};
  if(!window.L){$('mapPrompt').textContent='Map library failed to load.';return;}
  map=L.map('map',{zoomControl:true,preferCanvas:true}).setView([c.lat,c.lng],17);
  // Esri World Imagery gives the V2 prototype the satellite-first course view we need.
  baseLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
    maxZoom:19,
    attribution:'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
  }).addTo(map);
  let errors=0;
  baseLayer.on('tileerror',()=>{errors++;if(errors===3){$('mapPrompt').textContent='Satellite imagery failed to load.';$('mapReadout').textContent='Tap tracking is active; imagery source returned errors.';}});
  baseLayer.on('load',()=>{$('mapReadout').textContent='Satellite ready — tap your starting ball position.';});
  map.on('click',e=>mapTap(e.latlng));
  setTimeout(()=>map.invalidateSize(true),250);
};

const originalBegin=begin;
begin=function(){originalBegin();};

resume=function(){
  round=normalizeRound(store.getCurrent());
  if(!round){home();return;}
  store.setCurrent(round);
  show('roundView','Tap. Track. Play.');
  setTimeout(()=>{ensureMap();renderRound();},120);
};
$('resumeBtn').onclick=resume;

// Prevent stale pre-V2 rounds from rendering an empty hole header.
const saved=store.getCurrent();
if(saved){
  const migrated=normalizeRound(saved);
  store.setCurrent(migrated);
  $('resumeBtn').classList.remove('hidden');
}
