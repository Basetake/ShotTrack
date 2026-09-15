// ShotTrack hole-first UX: Google satellite map, tee-to-green framing, tee navigation, and human-readable shot lies.
(() => {
  const centerOf=e=>({lat:Number(e.lat??e.center?.lat),lng:Number(e.lon??e.center?.lon)});
  const googleReady=()=>!!window.shotTrackGoogle?.available?.();
  const validPoint=p=>p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng));

  async function findHoleGeometry(center,hole){
    if(!center)return null;
    // Pull hole paths with full geometry. Even when tees have no hole number, the path lets us
    // associate a tee cluster with the beginning of the correct hole instead of the clubhouse.
    const q=`[out:json][timeout:15];(node["golf"="tee"](around:2200,${center.lat},${center.lng});way["golf"="tee"](around:2200,${center.lat},${center.lng});node["golf"="green"](around:2200,${center.lat},${center.lng});way["golf"="green"](around:2200,${center.lat},${center.lng});way["golf"="hole"](around:2200,${center.lat},${center.lng}););out center geom tags;`;
    try{
      const res=await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);if(!res.ok)return null;
      const data=await res.json(),els=data.elements||[],hn=String(hole),valid=e=>validPoint(centerOf(e)),ref=e=>String(e.tags?.ref||e.tags?.hole||e.tags?.name||'').toLowerCase(),exact=e=>ref(e)===hn||ref(e).includes(`hole ${hn}`)||ref(e).includes(`#${hn}`);
      const tees=els.filter(e=>e.tags?.golf==='tee'&&valid(e)),greens=els.filter(e=>e.tags?.golf==='green'&&valid(e)),holes=els.filter(e=>e.tags?.golf==='hole'&&valid(e));
      const holeEl=holes.find(exact)||null;
      let tee=tees.find(exact)||null,green=greens.find(exact)||null,teeConfidence=tee?'exact':null;

      if(holeEl){
        const geom=(holeEl.geometry||[]).map(p=>({lat:Number(p.lat),lng:Number(p.lon)})).filter(validPoint);
        const hp=centerOf(holeEl);
        // OSM golf hole ways normally run tee -> green. If direction is reversed, orient it using a
        // labelled/mapped green or the nearest green to either endpoint.
        let pathStart=geom[0]||hp,pathEnd=geom[geom.length-1]||hp;
        if(!green&&greens.length){green=[...greens].sort((a,b)=>distanceMeters(pathEnd,centerOf(a))-distanceMeters(pathEnd,centerOf(b)))[0]||null;}
        if(green&&geom.length>1){const gp=centerOf(green);if(distanceMeters(pathStart,gp)<distanceMeters(pathEnd,gp)){const t=pathStart;pathStart=pathEnd;pathEnd=t;}}
        if(!green&&greens.length){green=[...greens].sort((a,b)=>distanceMeters(hp,centerOf(a))-distanceMeters(hp,centerOf(b)))[0]||null;}
        if(!tee&&tees.length){
          // Primary fallback: tee closest to the beginning of the numbered hole path.
          const ranked=[...tees].map(e=>({e,d:distanceMeters(pathStart,centerOf(e))})).sort((a,b)=>a.d-b.d);
          if(ranked[0]&&ranked[0].d<180){tee=ranked[0].e;teeConfidence='near-hole-start';}
        }
        if(!tee&&tees.length&&green){
          // Last geometric fallback: choose a tee that is plausibly on this hole and farthest from
          // its green, rather than choosing a random course-center tee.
          const gp=centerOf(green),candidates=tees.map(e=>({e,toPath:distanceMeters(hp,centerOf(e)),toGreen:distanceMeters(gp,centerOf(e))})).filter(x=>x.toPath<350).sort((a,b)=>b.toGreen-a.toGreen);
          if(candidates[0]){tee=candidates[0].e;teeConfidence='approximate';}
        }
      }
      return{tee:tee?centerOf(tee):null,green:green?centerOf(green):null,teeConfidence};
    }catch{return null;}
  }

  function sideOfHole(p,h){const a=h.teeCenter||h.start,b=h.greenCenter;if(!a||!b)return'';const x=(b.lng-a.lng)*(p.lat-a.lat)-(b.lat-a.lat)*(p.lng-a.lng);return x>0?'left ':x<0?'right ':'';}
  async function classifyLie(p,h){if(h.greenCenter&&distanceMeters(p,h.greenCenter)<32)return'green';const q=`[out:json][timeout:7];(way["golf"="green"](around:10,${p.lat},${p.lng});way["golf"="fairway"](around:10,${p.lat},${p.lng});way["golf"="bunker"](around:10,${p.lat},${p.lng});way["golf"="water_hazard"](around:10,${p.lat},${p.lng}););out center tags;`;try{const r=await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);if(r.ok){const d=await r.json(),types=(d.elements||[]).map(e=>e.tags?.golf);if(types.includes('green'))return'green';if(types.includes('bunker'))return'bunker';if(types.includes('water_hazard'))return'water';if(types.includes('fairway'))return'fairway';}}catch{}return`${sideOfHole(p,h)}rough`.trim();}

  ensureMap=function(){const c=currentMapCenter(),el=$('map');if(!googleReady()){$('mapPrompt').textContent='Google satellite map is still loading — refresh if this remains.';return;}if(!map||!map.__shotTrackGoogle){try{if(map?.remove)map.remove();}catch{}el.innerHTML='';map=window.shotTrackGoogle.create(el,c,p=>mapTap(p));if(map)map.__shotTrackGoogle=true;}renderMap();};
  renderMap=function(){if(!map||!round||!map.__shotTrackGoogle)return;const h=round.holes[round.currentHole];window.shotTrackGoogle.render(map,h,currentMapCenter());$('mapReadout').textContent=h.greenCenter?'Google satellite · ball to green':'Google satellite · drag and zoom anytime';};

  const baseRenderRound=renderRound;
  renderRound=function(){baseRenderRound();const h=round?.holes?.[round.currentHole];if(!h)return;document.querySelectorAll('#shotList .shot').forEach((el,i)=>{const s=h.shots[i],right=el.querySelector(':scope > small');if(right)right.textContent=s?.lie||'checking lie…';});};

  function applyGeometry(h,geo){if(!geo)return;if(geo.tee){h.teeCenter=geo.tee;h.teeConfidence=geo.teeConfidence||'approximate';}if(geo.green)h.greenCenter=geo.green;}
  function teePrompt(h){if(!h.teeCenter)return'Tap the tee/ball position, then choose a club.';if(h.teeConfidence&&h.teeConfidence!=='exact')return'We found this hole’s tee area. Pan to your exact tee if needed, then tap your starting position.';return'Choose a club, then tap where the shot finished.';}

  const oldBegin=begin;
  begin=async function(){await oldBegin();if(!round)return;const h=round.holes[round.currentHole],geo=await findHoleGeometry(round.courseCenter,round.currentHole);applyGeometry(h,geo);if(!h.start&&h.teeCenter&&h.teeConfidence==='exact')h.start={...h.teeCenter,estimated:true};store.setCurrent(round);ensureMap();renderRound();if(h.start||h.teeCenter)window.shotTrackGoogle.focusHole(map,h.start||h.teeCenter,h.greenCenter);$('mapPrompt').textContent=teePrompt(h);};
  $('beginBtn').onclick=begin;

  const oldMove=moveHole;
  moveHole=async function(dir){
    const oldHole=round?.currentHole,savedCenter=map?.__shotTrackGoogle&&map.getCenter?{lat:map.getCenter().lat(),lng:map.getCenter().lng()}:null,savedZoom=map?.__shotTrackGoogle&&map.getZoom?map.getZoom():null;
    await oldMove(dir);if(!round||round.currentHole===oldHole)return;
    const h=round.holes[round.currentHole];
    const geo=await findHoleGeometry(round.courseCenter,round.currentHole);applyGeometry(h,geo);
    // Only an explicitly numbered tee is trusted as the automatic shot origin. Geometric tees are
    // navigation anchors: get the golfer to the right place, then let them tap their actual tee.
    if(!h.start&&h.teeCenter&&h.teeConfidence==='exact')h.start={...h.teeCenter,estimated:true};
    store.setCurrent(round);renderRound();const anchor=h.start||h.teeCenter;
    if(anchor){window.shotTrackGoogle.focusHole(map,anchor,h.greenCenter);$('mapReadout').textContent=h.teeConfidence==='exact'?'Tee found · Google satellite':'Tee area found · adjust to your tee if needed';}
    else{if(savedCenter){map.setCenter(savedCenter);if(Number.isFinite(savedZoom))map.setZoom(savedZoom);}window.shotTrackGoogle.preserveView(map);$('mapReadout').textContent='No tee geometry found — map position preserved.';}
    $('mapPrompt').textContent=teePrompt(h);
  };
  $('prevHoleBtn').onclick=()=>moveHole(-1);$('nextHoleBtn').onclick=()=>moveHole(1);

  const oldMapTap=mapTap;
  mapTap=function(p){const h=round?.holes?.[round.currentHole],before=h?.shots?.length||0,savedCenter=map?.getCenter?{lat:map.getCenter().lat(),lng:map.getCenter().lng()}:null,savedZoom=map?.getZoom?map.getZoom():null;oldMapTap(p);const after=h?.shots?.length||0;if(savedCenter&&map?.__shotTrackGoogle){map.setCenter(savedCenter);if(Number.isFinite(savedZoom))map.setZoom(savedZoom);window.shotTrackGoogle.preserveView(map);}if(after>before){const shot=h.shots[after-1];shot.lie='checking lie…';store.setCurrent(round);renderRound();classifyLie(shot.end,h).then(lie=>{shot.lie=lie;store.setCurrent(round);renderRound();});}};
})();