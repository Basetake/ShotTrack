// ShotTrack hole-first UX: Google satellite map, tee-to-green framing, and human-readable shot lies.
(() => {
  const centerOf=e=>({lat:Number(e.lat??e.center?.lat),lng:Number(e.lon??e.center?.lon)});
  const googleReady=()=>!!window.shotTrackGoogle?.available?.();

  async function findHoleGeometry(center,hole){if(!center)return null;const q=`[out:json][timeout:12];(node["golf"="tee"](around:1800,${center.lat},${center.lng});way["golf"="tee"](around:1800,${center.lat},${center.lng});node["golf"="green"](around:1800,${center.lat},${center.lng});way["golf"="green"](around:1800,${center.lat},${center.lng});way["golf"="hole"](around:1800,${center.lat},${center.lng}););out center tags;`;try{const res=await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);if(!res.ok)return null;const data=await res.json(),els=data.elements||[],hn=String(hole),valid=e=>{const p=centerOf(e);return Number.isFinite(p.lat)&&Number.isFinite(p.lng)},ref=e=>String(e.tags?.ref||e.tags?.hole||e.tags?.name||'').toLowerCase(),exact=e=>ref(e)===hn||ref(e).includes(`hole ${hn}`)||ref(e).includes(`#${hn}`),holes=els.filter(e=>e.tags?.golf==='hole'&&valid(e)),holeEl=holes.find(exact);let tee=els.filter(e=>e.tags?.golf==='tee'&&valid(e)).find(exact)||null,green=els.filter(e=>e.tags?.golf==='green'&&valid(e)).find(exact)||null;if(holeEl){const hp=centerOf(holeEl),nearest=kind=>els.filter(e=>e.tags?.golf===kind&&valid(e)).sort((a,b)=>distanceMeters(hp,centerOf(a))-distanceMeters(hp,centerOf(b)))[0];tee=tee||nearest('tee');green=green||nearest('green');}return{tee:tee?centerOf(tee):null,green:green?centerOf(green):null};}catch{return null;}}

  function sideOfHole(p,h){const a=h.teeCenter||h.start,b=h.greenCenter;if(!a||!b)return'';const x=(b.lng-a.lng)*(p.lat-a.lat)-(b.lat-a.lat)*(p.lng-a.lng);return x>0?'left ':x<0?'right ':'';}
  async function classifyLie(p,h){if(h.greenCenter&&distanceMeters(p,h.greenCenter)<32)return'green';const q=`[out:json][timeout:7];(way["golf"="green"](around:10,${p.lat},${p.lng});way["golf"="fairway"](around:10,${p.lat},${p.lng});way["golf"="bunker"](around:10,${p.lat},${p.lng});way["golf"="water_hazard"](around:10,${p.lat},${p.lng}););out center tags;`;try{const r=await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);if(r.ok){const d=await r.json(),types=(d.elements||[]).map(e=>e.tags?.golf);if(types.includes('green'))return'green';if(types.includes('bunker'))return'bunker';if(types.includes('water_hazard'))return'water';if(types.includes('fairway'))return'fairway';}}catch{}return`${sideOfHole(p,h)}rough`.trim();}

  ensureMap=function(){
    const c=currentMapCenter(),el=$('map');
    if(!googleReady()){$('mapPrompt').textContent='Google satellite map is still loading — refresh if this remains.';return;}
    if(!map||!map.__shotTrackGoogle){try{if(map?.remove)map.remove();}catch{}el.innerHTML='';map=window.shotTrackGoogle.create(el,c,p=>mapTap(p));if(map)map.__shotTrackGoogle=true;}
    renderMap();
  };

  renderMap=function(){if(!map||!round||!map.__shotTrackGoogle)return;const h=round.holes[round.currentHole];window.shotTrackGoogle.render(map,h,currentMapCenter());$('mapReadout').textContent=h.greenCenter?'Google satellite · ball to green':'Google satellite · drag and zoom anytime';};

  function frameHole(force=false){if(!map||!round||!map.__shotTrackGoogle)return;const h=round.holes[round.currentHole],ball=h.shots.length?h.shots[h.shots.length-1].end:h.start||h.teeCenter;if(ball)window.shotTrackGoogle.frame(map,ball,h.greenCenter,force);}

  const baseRenderRound=renderRound;
  renderRound=function(){baseRenderRound();const h=round?.holes?.[round.currentHole];if(!h)return;document.querySelectorAll('#shotList .shot').forEach((el,i)=>{const s=h.shots[i],right=el.querySelector(':scope > small');if(right)right.textContent=s?.lie||'checking lie…';});};

  const oldBegin=begin;
  begin=async function(){await oldBegin();if(!round)return;const h=round.holes[round.currentHole],geo=await findHoleGeometry(round.courseCenter,round.currentHole);if(geo?.tee)h.teeCenter=geo.tee;if(geo?.green)h.greenCenter=geo.green;if(!h.start&&h.teeCenter)h.start={...h.teeCenter,estimated:true};store.setCurrent(round);ensureMap();renderRound();if(h.start||h.teeCenter)window.shotTrackGoogle.focusHole(map,h.start||h.teeCenter,h.greenCenter);$('mapPrompt').textContent=h.start?'Choose a club, then tap where the shot finished.':'Tap the tee/ball position, then choose a club.';};
  $('beginBtn').onclick=begin;

  const oldMove=moveHole;
  moveHole=async function(dir){const oldHole=round?.currentHole;await oldMove(dir);if(!round||round.currentHole===oldHole)return;const h=round.holes[round.currentHole];let geo=null;if(!h.greenCenter||!h.teeCenter)geo=await findHoleGeometry(round.courseCenter,round.currentHole);if(geo?.tee)h.teeCenter=geo.tee;if(geo?.green)h.greenCenter=geo.green;if(!h.start&&h.teeCenter)h.start={...h.teeCenter,estimated:true};store.setCurrent(round);renderRound();const anchor=h.start||h.teeCenter;if(anchor)window.shotTrackGoogle.focusHole(map,anchor,h.greenCenter);else{$('mapReadout').textContent='Next tee is not mapped — keeping your current map position. Pan to the tee and tap to set it.';window.shotTrackGoogle.preserveView(map);}$('mapPrompt').textContent=h.start?'Choose a club, then tap where the shot finished.':'Tap the next tee position to start this hole.';};
  $('prevHoleBtn').onclick=()=>moveHole(-1);$('nextHoleBtn').onclick=()=>moveHole(1);

  const oldMapTap=mapTap;
  mapTap=function(p){const h=round?.holes?.[round.currentHole],before=h?.shots?.length||0;oldMapTap(p);const after=h?.shots?.length||0;if(after>before){const shot=h.shots[after-1];shot.lie='checking lie…';store.setCurrent(round);window.shotTrackGoogle.preserveView(map);renderRound();classifyLie(shot.end,h).then(lie=>{shot.lie=lie;store.setCurrent(round);renderRound();});}};
})();