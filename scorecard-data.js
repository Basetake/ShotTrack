// Free, cacheable scorecard fallback derived from OpenGolfAPI (ODbL 1.0).
(()=>{
  const URL='https://raw.githubusercontent.com/StakeMarker-LLC/stakemarker-courses/main/courses.json';
  let loading=null;
  const norm=s=>String(s||'').toLowerCase().replace(/\b(golf course|golf club|country club|golf links|links|golf)\b/g,'').replace(/[^a-z0-9]/g,'');
  const validPars=p=>Array.isArray(p)&&p.length===18&&p.every(x=>Number(x)>=3&&Number(x)<=6);
  async function load(){
    if(loading)return loading;
    loading=fetch(URL,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('scorecard dataset unavailable');return r.json();}).catch(()=>[]);
    return loading;
  }
  function matchScore(source,row){
    const wanted=norm(source.course_name||source.name),name=norm(row.name),address=String(source.address||'').toLowerCase(),city=String(source.city||'').toLowerCase(),state=String(source.state||'').toLowerCase();
    let score=0;
    if(name===wanted)score+=100;
    else if(name&&wanted&&(name.includes(wanted)||wanted.includes(name)))score+=55;
    if(row.city&&(city===String(row.city).toLowerCase()||address.includes(String(row.city).toLowerCase())))score+=20;
    if(row.state&&(state===String(row.state).toLowerCase()||address.includes(String(row.state).toLowerCase())))score+=20;
    return score;
  }
  async function find(source){
    const rows=await load(),best=rows.filter(x=>validPars(x.pars)).map(x=>({x,score:matchScore(source,x)})).sort((a,b)=>b.score-a.score)[0];
    if(!best||best.score<55)return null;
    return{courseId:best.x.id,name:best.x.name,city:best.x.city,state:best.x.state,source:best.x.source||'OpenGolfAPI',scorecard:best.x.pars.map((par,i)=>({hole_number:i+1,par:Number(par),handicap_index:Number(best.x.hcps?.[i])||null}))};
  }
  window.shotTrackScorecards={find,source:'OpenGolfAPI / StakeMarker Courses',license:'ODbL-1.0'};
  const addAttribution=()=>{const shell=document.querySelector('.app-shell');if(shell&&!document.getElementById('scorecardAttribution'))shell.insertAdjacentHTML('beforeend','<p id="scorecardAttribution" style="margin:18px 4px 0;text-align:center;color:#718078;font-size:9px">Scorecard data: OpenGolfAPI / StakeMarker Courses · ODbL 1.0</p>');};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',addAttribution):addAttribution();
})();