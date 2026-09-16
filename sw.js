const CACHE='shottrack-shell-20260916-1';
const SHELL=['./','./index.html','./styles.css?v=20260916-data-tools-1','./app.js?v=20260916-back-nav-1','./google-map.js?v=20260916-penalty-1','./scorecard-data.js?v=20260916-open-scorecards-1','./course-picker.js?v=20260916-open-scorecards-1','./hole-experience.js?v=20260916-hole-par-1','./v3-experience.js?v=20260916-hole-par-1','./analytics-dashboard.js?v=20260916-analysis-1','./data-management.js?v=20260916-cloud-1','./cloud-sync.js?v=20260916-cloud-1','./pwa.js?v=20260916-pwa-1','./manifest.webmanifest?v=20260916-pwa-1','./icons/shottrack-192.png','./icons/shottrack-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{
    if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));
    return response;
  })));
});
