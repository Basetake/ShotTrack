// ShotTrack V3 course picker: recent courses, nearby ranking, live search, and all-course fallback.
(() => {
  const $=id=>document.getElementById(id), RECENT_KEY='shottrack.recentCourses';
  let userPos=null, allMode=false, timer=null, latest=[];
  const css=document.createElement('style');css.textContent=`
    #courseSearch{cursor:text}.course-picker-head{display:flex;justify-content:space-between;align-items:center;margin:10px 0 6px}.course-picker-head strong{font-size:14px}.course-picker-head button{border:0;background:none;text-decoration:underline;color:#466158;cursor:pointer}.course-card{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;width:100%;box-sizing:border-box;padding:11px 0;border-bottom:1px solid #e7ece8}.course-card:last-child{border-bottom:0}.course-main{border:0;background:none;text-align:left;padding:0;cursor:pointer}.course-main strong,.course-main small{display:block}.course-main small{color:#718078;margin-top:3px}.course-remove{border:0;background:#f1f4f2;border-radius:8px;padding:7px 9px;cursor:pointer}.course-picker-msg{color:#718078;font-size:13px;padding:8px 0}.course-picker-all{width:100%;margin-top:10px}
  `;document.head.appendChild(css);
  const recent=()=>{try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')}catch{return[]}};
  const saveRecent=c=>{const key=String(c.id||c.course_name),arr=[c,...recent().filter(x=>String(x.id||x.course_name)!==key)].slice(0,8);localStorage.setItem(RECENT_KEY,JSON.stringify(arr));};
  const removeRecent=key=>{localStorage.setItem(RECENT_KEY,JSON.stringify(recent().filter(x=>String(x.id||x.course_name)!==String(key))));showRecent();};
  const miles=(a,b)=>{if(!a||!b)return null;const R=3958.7613,r=x=>x*Math.PI/180,d1=r(b.lat-a.lat),d2=r(b.lng-a.lng),x=Math.sin(d1/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(d2/2)**2;return 2*R*Math.asin(Math.sqrt(x));};
  const posOf=c=>{const lat=Number(c.lat??c.latitude??c.location?.lat),lng=Number(c.lng??c.lon??c.longitude??c.location?.lng);return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng}:null;};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function distanceText(c){const d=miles(userPos,posOf(c));return d==null?'':`${d<10?d.toFixed(1):Math.round(d)} mi away`;}
  function render(courses,{recentMode=false,title='Courses'}={}){latest=courses;const box=$('courseResults');if(!box)return;box.innerHTML=`<div class="course-picker-head"><strong>${esc(title)}</strong>${!recentMode?'<button id="courseAllToggle">View all courses</button>':''}</div>`+(courses.length?courses.map((c,i)=>`<div class="course-card"><button class="course-main" data-pick="${i}"><strong>${esc(c.course_name||c.name)}</strong><small>${esc([c.city,c.state].filter(Boolean).join(', '))}${distanceText(c)?` · ${distanceText(c)}`:''}</small></button>${recentMode?`<button class="course-remove" data-remove="${esc(c.id||c.course_name)}" aria-label="Remove from recent">Remove</button>`:''}</div>`).join(''):'<div class="course-picker-msg">No matching courses found.</div>');
    box.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const c=latest[+b.dataset.pick];selectCourse(c);saveRecent(c);});
    box.querySelectorAll('[data-remove]').forEach(b=>b.onclick=e=>{e.stopPropagation();removeRecent(b.dataset.remove);});
    const all=$('courseAllToggle');if(all)all.onclick=()=>{allMode=true;search($('courseSearch').value.trim(),true);};
  }
  function showRecent(){const r=recent();if(r.length)render(r,{recentMode:true,title:'Recently viewed'});else search('',false);}
  function locate(){if(!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(p=>{userPos={lat:p.coords.latitude,lng:p.coords.longitude};if(document.activeElement===$('courseSearch')&&!$('courseSearch').value.trim())search('',false);},()=>{}, {enableHighAccuracy:false,timeout:5000,maximumAge:300000});}
  async function search(q,showAll=false){const box=$('courseResults');if(!box)return;box.innerHTML='<div class="course-picker-msg">Finding courses…</div>';try{
      let url=q?`https://api.opengolfapi.org/v1/courses/search?q=${encodeURIComponent(q)}`:'https://api.opengolfapi.org/v1/courses/search?q=golf';
      const r=await fetch(url);if(!r.ok)throw Error();const d=await r.json();let courses=(d.courses||[]);
      // Preserve API name relevance, but location breaks ties and dominates blank nearby browsing.
      courses=courses.map((c,i)=>({c,i,d:miles(userPos,posOf(c))})).sort((a,b)=>{if(!q&&a.d!=null&&b.d!=null)return a.d-b.d;if(q){const qa=q.toLowerCase(),as=String(a.c.course_name||'').toLowerCase(),bs=String(b.c.course_name||'').toLowerCase(),ae=as===qa?0:as.startsWith(qa)?1:as.includes(qa)?2:3,be=bs===qa?0:bs.startsWith(qa)?1:bs.includes(qa)?2:3;if(ae!==be)return ae-be;}if(a.d!=null&&b.d!=null)return a.d-b.d;if(a.d!=null)return-1;if(b.d!=null)return 1;return a.i-b.i;}).map(x=>x.c);
      if(!showAll)courses=courses.slice(0,8);render(courses,{title:q?'Best matches':'Courses near you'});
    }catch{box.innerHTML='<div class="course-picker-msg">Course search could not load. Try typing the course name.</div>';}
  }
  function init(){const input=$('courseSearch'),button=$('searchCourseBtn');if(!input)return;input.placeholder='Select your course';input.addEventListener('focus',()=>{allMode=false;if(!input.value.trim())showRecent();});input.addEventListener('input',()=>{allMode=false;clearTimeout(timer);timer=setTimeout(()=>{const q=input.value.trim();q?search(q,false):showRecent();},220);});if(button){button.textContent='View all courses';button.onclick=()=>{allMode=true;search(input.value.trim(),true);};}locate();}
  // Capture every successful course selection, including selections made by legacy search UI.
  const oldSelect=window.selectCourse;window.selectCourse=async function(c){saveRecent(c);return oldSelect(c);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();