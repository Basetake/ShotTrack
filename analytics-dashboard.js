// ShotTrack saved-round performance dashboard.
(()=>{
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const holesOf=r=>Object.values(r?.holes||{});
  const strokes=h=>(h?.shots?.length||0)+(Number(h?.putts)||0)+(Number(h?.penalties)||0);
  const playedHoles=r=>holesOf(r).filter(h=>strokes(h)>0);
  const total=r=>playedHoles(r).reduce((n,h)=>n+strokes(h),0);
  const playedPar=r=>playedHoles(r).reduce((n,h)=>n+(Number(h.par)||0),0);
  const diff=r=>{const p=playedPar(r);return p?total(r)-p:null};
  const signed=n=>n==null?'—':n===0?'E':`${n>0?'+':''}${n}`;
  const pct=(n,d)=>d?Math.round(n/d*100):null;
  const avg=a=>a.length?a.reduce((n,x)=>n+x,0)/a.length:null;
  function stats(r){
    const holes=playedHoles(r),putts=holes.reduce((n,h)=>n+(Number(h.putts)||0),0),penalties=holes.reduce((n,h)=>n+(Number(h.penalties)||0),0);
    const fairwayOpps=holes.filter(h=>Number(h.par)>=4&&h.shots?.length),fairways=fairwayOpps.filter(h=>h.shots[0]?.lie==='Fairway').length;
    const left=fairwayOpps.filter(h=>h.shots[0]?.lie==='Left Rough').length,right=fairwayOpps.filter(h=>h.shots[0]?.lie==='Right Rough').length;
    const girOpps=holes.filter(h=>Number(h.par)>0&&h.shots?.length),gir=girOpps.filter(h=>{const i=h.shots.findIndex(s=>s.lie==='Green');if(i<0)return false;const ps=(h.penaltyEntries||[]).filter(p=>(Number(p.afterShot)||0)<=i+1).reduce((n,p)=>n+(Number(p.strokes)||1),0);return i+1+ps<=Number(h.par)-2;}).length;
    const threePutts=holes.filter(h=>(Number(h.putts)||0)>=3).length,drives=holes.flatMap(h=>h.shots||[]).filter(s=>s.club==='Dr'&&Number(s.yards)>0);
    return{holes:holes.length,putts,penalties,fairways,fairwayOpps:fairwayOpps.length,gir,girOpps:girOpps.length,left,right,threePutts,avgDrive:avg(drives.map(s=>Number(s.yards)))};
  }
  function aggregate(rounds){
    const ss=rounds.map(stats),d=rounds.map(diff).filter(x=>x!=null),allShots=rounds.flatMap(r=>playedHoles(r).flatMap(h=>h.shots||[]));
    const puttBands={};rounds.forEach(r=>playedHoles(r).forEach(h=>(h.puttEntries||[]).forEach(p=>{const k=p.range||'Unknown';puttBands[k]??={entries:0,putts:0};puttBands[k].entries++;puttBands[k].putts+=Number(p.count)||0;})));
    const clubs={};allShots.filter(s=>s.club&&s.club!=='Putt'&&Number(s.yards)>0).forEach(s=>{clubs[s.club]??=[];clubs[s.club].push(Number(s.yards));});
    return{rounds:rounds.length,avgDiff:avg(d),avgPutts:avg(ss.map(s=>s.putts)),penalties:ss.reduce((n,s)=>n+s.penalties,0),fairways:ss.reduce((n,s)=>n+s.fairways,0),fairwayOpps:ss.reduce((n,s)=>n+s.fairwayOpps,0),gir:ss.reduce((n,s)=>n+s.gir,0),girOpps:ss.reduce((n,s)=>n+s.girOpps,0),left:ss.reduce((n,s)=>n+s.left,0),right:ss.reduce((n,s)=>n+s.right,0),threePutts:ss.reduce((n,s)=>n+s.threePutts,0),avgDrive:avg(ss.map(s=>s.avgDrive).filter(x=>x!=null)),puttBands,clubs};
  }
  const tile=(v,l)=>`<div class="analysis-tile"><strong>${v}</strong><span>${l}</span></div>`;
  function trend(rounds){
    const rows=rounds.slice(0,10).reverse().map(r=>({r,d:diff(r)})).filter(x=>x.d!=null);if(!rows.length)return'<p class="empty">Complete rounds with hole pars to unlock scoring trends.</p>';
    const max=Math.max(1,...rows.map(x=>Math.abs(x.d)));
    return`<div class="trend-chart">${rows.map(x=>{const h=18+Math.round(Math.abs(x.d)/max*72),good=x.d<=0;return`<div class="trend-item" title="${esc(x.r.course)}"><span>${signed(x.d)}</span><div class="trend-bar ${good?'good':''}" style="height:${h}px"></div><small>${new Date(x.r.date).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</small></div>`;}).join('')}</div>`;
  }
  function puttRows(a){const order=['0–5 ft','0-5 ft','5–10 ft','5-10 ft','10–15 ft','10-15 ft','15–30 ft','15-30 ft','30+ ft'];const entries=Object.entries(a.puttBands).sort((x,y)=>order.indexOf(x[0])-order.indexOf(y[0]));return entries.length?entries.map(([k,v])=>`<div class="analysis-row"><span>${esc(k)} <small>${v.entries} hole${v.entries===1?'':'s'}</small></span><strong>${(v.putts/v.entries).toFixed(1)} avg</strong></div>`).join(''):'<p class="empty">Putting-distance trends appear after saved rounds include putting entries.</p>';}
  function clubRows(a){return Object.entries(a.clubs).map(([club,ys])=>({club,ys,av:avg(ys)})).sort((x,y)=>y.av-x.av).map(x=>`<div class="analysis-row"><span><b>${esc(x.club)}</b> <small>${x.ys.length} shot${x.ys.length===1?'':'s'}</small></span><strong>${Math.round(x.av)} yd <small>${Math.min(...x.ys)}–${Math.max(...x.ys)}</small></strong></div>`).join('')||'<p class="empty">Mapped club distances will appear here.</p>';}
  function roundCard(r,i){const s=stats(r),d=diff(r),date=new Date(r.date||r.completedAt||Date.now()).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});return`<details class="round-analysis card"><summary><div><span class="eyebrow">${esc(date)}</span><h3>${esc(r.course||'Saved course')}</h3><small>${s.holes} holes · ${esc(r.tee||'Tee')} tees</small></div><div class="round-result"><strong>${total(r)}</strong><span>${signed(d)}</span></div></summary><div class="round-metrics">${tile(s.putts,'Putts')}${tile(s.penalties,'Penalties')}${tile(s.fairwayOpps?pct(s.fairways,s.fairwayOpps)+'%':'—','FIR')}${tile(s.girOpps?pct(s.gir,s.girOpps)+'%':'—','GIR')}</div><div class="hole-strip">${Object.entries(r.holes||{}).filter(([,h])=>strokes(h)>0).map(([n,h])=>`<div><span>${n}</span><strong>${strokes(h)}</strong><small>${h.par?'P'+h.par:'—'}</small></div>`).join('')}</div></details>`;}
  function renderAnalysis(){
    const rounds=store.getHistory().map(r=>normalizeRound(r));$('analysisEmpty').classList.toggle('hidden',rounds.length>0);$('analysisContent').classList.toggle('hidden',!rounds.length);
    if(!rounds.length){show('analysisView','Performance analysis');return;}
    const a=aggregate(rounds);$('analysisOverview').innerHTML=[tile(a.rounds,'Rounds'),tile(a.avgDiff==null?'—':signed(Math.round(a.avgDiff)),'Avg vs par'),tile(a.avgPutts==null?'—':a.avgPutts.toFixed(1),'Avg putts'),tile(a.penalties,'Penalties'),tile(a.fairwayOpps?pct(a.fairways,a.fairwayOpps)+'%':'—','FIR'),tile(a.girOpps?pct(a.gir,a.girOpps)+'%':'—','GIR')].join('');
    $('scoringTrend').innerHTML=trend(rounds);$('puttingAnalysis').innerHTML=puttRows(a);$('clubAnalysis').innerHTML=clubRows(a);
    $('tendencyAnalysis').innerHTML=`<div class="analysis-row"><span>Tee misses</span><strong>${a.left} left · ${a.right} right</strong></div><div class="analysis-row"><span>Three-putt holes</span><strong>${a.threePutts}</strong></div><div class="analysis-row"><span>Average driver</span><strong>${a.avgDrive==null?'—':Math.round(a.avgDrive)+' yd'}</strong></div><div class="analysis-row"><span>Penalty strokes</span><strong>${a.penalties}</strong></div>`;
    $('analysisRounds').innerHTML=rounds.map(roundCard).join('');show('analysisView','Performance analysis');
  }
  window.shotTrackAnalysis={render:renderAnalysis};
  $('analysisBtn')?.addEventListener('click',renderAnalysis);
})();