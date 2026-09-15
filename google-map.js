// ShotTrack Google Maps adapter. API key stays in index.html and is never stored here.
(() => {
  let overlays=[];
  const ready=()=>window.google?.maps;
  const point=p=>({lat:Number(p.lat),lng:Number(p.lng)});
  const clear=()=>{overlays.forEach(o=>o.setMap?.(null));overlays=[];};
  const marker=(p,label)=>{const m=new google.maps.Marker({position:point(p),map,label:{text:String(label),color:'#102018',fontWeight:'700'},icon:{path:google.maps.SymbolPath.CIRCLE,scale:13,fillColor:'#d9f99d',fillOpacity:1,strokeColor:'#102018',strokeWeight:2}});overlays.push(m);};
  window.shotTrackGoogle={
    available:ready,
    create(el,center,onTap){if(!ready())return null;const m=new google.maps.Map(el,{center:point(center),zoom:18,mapTypeId:'satellite',mapTypeControl:false,streetViewControl:false,fullscreenControl:false,gestureHandling:'greedy',tilt:0});m.addListener('click',e=>onTap({lat:e.latLng.lat(),lng:e.latLng.lng()}));return m;},
    render(m,h,center){if(!m)return;clear();const pts=[];if(h.start){pts.push(h.start);marker(h.start,'S');}for(const [i,s] of (h.shots||[]).entries()){if(!s.start||!s.end)continue;pts.push(s.end);marker(s.end,i+1);const l=new google.maps.Polyline({path:[point(s.start),point(s.end)],map:m,strokeColor:'#d9f99d',strokeOpacity:.95,strokeWeight:4});overlays.push(l);}if(pts.length>1){const b=new google.maps.LatLngBounds();pts.forEach(p=>b.extend(point(p)));m.fitBounds(b,45);}else if(pts.length===1){m.setCenter(point(pts[0]));m.setZoom(18);}else{m.setCenter(point(center));m.setZoom(18);}},
    frame(m,ball,green){if(!m||!ball)return;if(green){const b=new google.maps.LatLngBounds();b.extend(point(ball));b.extend(point(green));m.fitBounds(b,55);}else{m.setCenter(point(ball));m.setZoom(19);}}
  };
})();