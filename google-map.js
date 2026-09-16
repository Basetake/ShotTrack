// ShotTrack Google Maps adapter. API key stays in index.html and is never stored here.
(() => {
  let overlays=[];
  const ready=()=>window.google?.maps;
  const point=p=>({lat:Number(p.lat),lng:Number(p.lng)});
  const clear=()=>{overlays.forEach(o=>o.setMap?.(null));overlays=[];};
  const marker=(p,label)=>{const m=new google.maps.Marker({position:point(p),map,label:{text:String(label),color:'#102018',fontWeight:'700'},icon:{path:google.maps.SymbolPath.CIRCLE,scale:13,fillColor:'#d9f99d',fillOpacity:1,strokeColor:'#102018',strokeWeight:2}});overlays.push(m);};
  window.shotTrackGoogle={
    available:ready,
    create(el,center,onTap){if(!ready())return null;const m=new google.maps.Map(el,{center:point(center),zoom:18,mapTypeId:'satellite',mapTypeControl:false,streetViewControl:false,fullscreenControl:false,gestureHandling:'greedy',tilt:0});m.__shotTrackHasView=false;m.addListener('click',e=>onTap({lat:e.latLng.lat(),lng:e.latLng.lng()}));return m;},
    render(m,h,center){if(!m)return;clear();if(h.start)marker(h.start,'S');for(const [i,s] of (h.shots||[]).entries()){if(!s.start||!s.end)continue;marker(s.end,i+1);const l=new google.maps.Polyline({path:[point(s.start),point(s.end)],map:m,strokeColor:'#d9f99d',strokeOpacity:.95,strokeWeight:4});overlays.push(l);}if(h.nextShotStart)marker(h.nextShotStart,'B');const ball=h.nextShotStart||(h.shots?.length?h.shots[h.shots.length-1].end:h.start||h.teeCenter||center);if(!m.__shotTrackHasView&&ball){m.setCenter(point(ball));m.setZoom(19);m.__shotTrackHasView=true;}},
    frame(m,ball,green,force=false){if(!m||!ball)return;if(!force&&m.__shotTrackHasView)return;if(green){const b=new google.maps.LatLngBounds();b.extend(point(ball));b.extend(point(green));m.fitBounds(b,55);}else{m.setCenter(point(ball));m.setZoom(19);}m.__shotTrackHasView=true;},
    focusHole(m,ball,green){if(!m||!ball)return;m.__shotTrackHasView=false;if(green){const b=new google.maps.LatLngBounds();b.extend(point(ball));b.extend(point(green));m.fitBounds(b,55);m.__shotTrackHasView=true;}else{m.setCenter(point(ball));m.setZoom(19);m.__shotTrackHasView=true;}},
    preserveView(m){if(m)m.__shotTrackHasView=true;}
  };
  // Load V3 after the existing round/map code has initialized so it can upgrade the experience safely.
  window.addEventListener('load',()=>{if(document.querySelector('script[data-shottrack-v3]'))return;const s=document.createElement('script');s.src='v3-experience.js?v=20260915-v3-1';s.dataset.shottrackV3='1';document.body.appendChild(s);});
})();