// ShotTrack hole-first map UX: frame tee-to-green, auto-place ball at tee, and recenter after shots.
(() => {
  const centerOf = e => ({lat:Number(e.lat ?? e.center?.lat), lng:Number(e.lon ?? e.center?.lon)});
  async function findHoleGeometry(center,hole){
    if(!center)return null;
    const q=`[out:json][timeout:12];(node["golf"="tee"](around:1800,${center.lat},${center.lng});way["golf"="tee"](around:1800,${center.lat},${center.lng});node["golf"="green"](around:1800,${center.lat},${center.lng});way["golf"="green"](around:1800,${center.lat},${center.lng});way["golf"="hole"](around:1800,${center.lat},${center.lng}););out center tags;`;
    try{
      const res=await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);if(!res.ok)return null;
      const data=await res.json(), els=data.elements||[], hn=String(hole);
      const valid=e=>{const p=centerOf(e);return Number.isFinite(p.lat)&&Number.isFinite(p.lng)};
      const ref=e=>String(e.tags?.ref||e.tags?.hole||e.tags?.name||'').toLowerCase();
      const exact=e=>ref(e)===hn||ref(e).includes(`hole ${hn}`)||ref(e).includes(`#${hn}`);
      const holes=els.filter(e=>e.tags?.golf==='hole'&&valid(e));
      const holeEl=holes.find(exact);
      let tee=els.filter(e=>e.tags?.golf==='tee'&&valid(e)).find(exact)||null;
      let green=els.filter(e=>e.tags?.golf==='green'&&valid(e)).find(exact)||null;
      if(holeEl){const hp=centerOf(holeEl);const nearest=(kind)=>els.filter(e=>e.tags?.golf===kind&&valid(e)).sort((a,b)=>distanceMeters(hp,centerOf(a))-distanceMeters(hp,centerOf(b)))[0];tee=tee||nearest('tee');green=green||nearest('green');}
      return {tee:tee?centerOf(tee):null,green:green?centerOf(green):null};
    }catch{return null;}
  }
  function frameHole(){
    if(!map||!round)return;const h=round.holes[round.currentHole],ball=h.shots.length?h.shots[h.shots.length-1].end:h.start||h.teeCenter;
    if(ball&&h.greenCenter){map.fitBounds([[ball.lat,ball.lng],[h.greenCenter.lat,h.greenCenter.lng]],{padding:[55,55],maxZoom:18});}
    else if(ball)map.setView([ball.lat,ball.lng],18);
  }
  const oldBegin=begin;
  begin=async function(){await oldBegin();if(!round)return;const h=round.holes[round.currentHole];const geo=await findHoleGeometry(round.courseCenter,round.currentHole);if(geo?.tee)h.teeCenter=geo.tee;if(geo?.green)h.greenCenter=geo.green;if(!h.start&&h.teeCenter)h.start={...h.teeCenter,estimated:true};store.setCurrent(round);renderRound();frameHole();$('mapPrompt').textContent=h.start?'Choose a club, then tap where the shot finished.':'Tap the tee/ball position, then choose a club.';$('mapReadout').textContent=h.greenCenter?'Hole framed from ball to green. Drag or zoom the map anytime.':'Ball placed near the tee. Drag or zoom the map anytime.';};
  $('beginBtn').onclick=begin;
  const oldMove=moveHole;
  moveHole=async function(dir){await oldMove(dir);if(!round)return;const h=round.holes[round.currentHole];if(!h.greenCenter){const geo=await findHoleGeometry(round.courseCenter,round.currentHole);if(geo?.tee)h.teeCenter=geo.tee;if(geo?.green)h.greenCenter=geo.green;if(!h.start&&h.teeCenter)h.start={...h.teeCenter,estimated:true};store.setCurrent(round);renderRound();}frameHole();};
  $('prevHoleBtn').onclick=()=>moveHole(-1);$('nextHoleBtn').onclick=()=>moveHole(1);
  const oldMapTap=mapTap;
  mapTap=function(p){const h=round?.holes?.[round.currentHole];const before=h?.shots?.length||0;oldMapTap(p);const after=h?.shots?.length||0;if(after>before)setTimeout(frameHole,60);};
  if(map)map.off('click');
  // ensureMap may create the map later, so wrap it to bind the current mapTap implementation exactly once.
  const oldEnsure=ensureMap;
  ensureMap=function(){const existed=!!map;oldEnsure();if(map&&!map._shotTrackHoleUX){map.off('click');map.on('click',e=>mapTap(e.latlng));map._shotTrackHoleUX=true;}if(existed)frameHole();};
})();