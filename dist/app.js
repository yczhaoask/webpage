// Official 2026 VA regular compensation, reviewed October 15, 2026.
// https://www.va.gov/disability/compensation-rates/veteran-rates/
const VA={10:{base:180.42},20:{base:356.66},30:{base:552.47,spouse:65,parent:52,child:44,childSpouse:114,extra:32,student:105,aid:61},40:{base:795.84,spouse:87,parent:70,child:58,childSpouse:152,extra:43,student:140,aid:81},50:{base:1132.90,spouse:109,parent:88,child:73,childSpouse:190,extra:54,student:176,aid:101},60:{base:1435.02,spouse:131,parent:105,child:88,childSpouse:228,extra:65,student:211,aid:121},70:{base:1808.45,spouse:153,parent:123,child:102,childSpouse:266,extra:76,student:246,aid:141},80:{base:2102.15,spouse:175,parent:140,child:117,childSpouse:304,extra:87,student:281,aid:161},90:{base:2362.30,spouse:197,parent:158,child:132,childSpouse:342,extra:98,student:317,aid:181},100:{base:3938.58,spouse:219.59,parent:176.24,child:146.85,childSpouse:380.41,extra:109.11,student:352.45,aid:201.41}};
const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
function calculate({rating,spouse=0,parents=0,children=0,students=0,aid=false,year=2027}){const r=VA[rating];if(!r)throw Error('Invalid rating');let base=r.base;if(rating>=30){base+=parents*r.parent+students*r.student;if(children>0)base+=(spouse?r.childSpouse:r.child)+(children-1)*r.extra;else if(spouse)base+=r.spouse;if(spouse&&aid)base+=r.aid;}base=cents(base);const monthly=year===2027?cents(base*1.036):base;return{base,monthly,increase:cents(monthly-base)};}
const key=d=>d.toISOString().slice(0,10),utc=(y,m,d)=>new Date(Date.UTC(y,m,d));
function holidays(y){const dates=new Set();const observed=(m,d)=>{const x=utc(y,m,d);if(x.getUTCDay()===6)x.setUTCDate(x.getUTCDate()-1);if(x.getUTCDay()===0)x.setUTCDate(x.getUTCDate()+1);dates.add(key(x));};const nth=(m,w,n)=>{const x=utc(y,m,1);x.setUTCDate(1+(w-x.getUTCDay()+7)%7+7*(n-1));dates.add(key(x));};[ [0,1],[5,19],[6,4],[10,11],[11,25] ].forEach(([m,d])=>observed(m,d));nth(0,1,3);nth(1,1,3);const mem=utc(y,5,0);while(mem.getUTCDay()!==1)mem.setUTCDate(mem.getUTCDate()-1);dates.add(key(mem));nth(8,1,1);nth(9,1,2);nth(10,4,4);return dates;}
function paymentDate(y,m){const d=utc(y,m+1,1);const set=new Set([...holidays(d.getUTCFullYear()-1),...holidays(d.getUTCFullYear()),...holidays(d.getUTCFullYear()+1)]);while([0,6].includes(d.getUTCDay())||set.has(key(d)))d.setUTCDate(d.getUTCDate()-1);return d;}
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);const fmt=d=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(d);const month=d=>new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(d);
if(typeof document!=='undefined'){
const $=id=>document.getElementById(id),form=$('pay-form');let rating=70;
for(let n=10;n<=100;n+=10){const b=document.createElement('button');b.type='button';b.textContent=n+'%';b.setAttribute('aria-pressed',n===rating?'true':'false');b.addEventListener('click',()=>{rating=n;$('rating').value=n;document.querySelectorAll('.rating-buttons button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));document.querySelector('.dependent-fields').hidden=n<30;$('low-rating').hidden=n>=30;update();});document.querySelector('.rating-buttons').append(b);}
function update(){if(!form.reportValidity())return;const year=Number(form.elements.year.value),spouse=Number($('spouse').value);$('aid').disabled=!spouse;if(!spouse)$('aid').checked=false;const v={rating,year,spouse,parents:Number($('parents').value),children:Number($('children').value),students:Number($('students').value),aid:$('aid').checked};const r=calculate(v);$('result-year').textContent=year+' '+(year===2027?'PAY ESTIMATE':'OFFICIAL RATE');$('estimate-badge').textContent=year===2027?'Estimated':'2026 table';$('monthly').textContent=money(r.monthly);$('increase').textContent=year===2027?'+'+money(r.increase):'—';$('annual').textContent=year===2027?'+'+money(cents(r.increase*12)):'—';$('comparison-caption').textContent=year===2027?'Compared with your 2026 payment':'Select 2027 to compare the projected increase';$('baseline').textContent=money(r.base);$('estimate-note').textContent=year===2027?'Based on official 2026 VA rates × 1.036. Final 2027 VA rates may differ due to rounding or other changes.':'Based on the official VA table effective December 1, 2025. Individual awards may include other adjustments.';let labels=[rating+'% rating'];if(rating>=30){if(spouse)labels.push('With spouse');if(v.parents)labels.push(v.parents+' dependent parent'+(v.parents>1?'s':''));if(v.children)labels.push(v.children+' child'+(v.children>1?'ren':'')+' under 18');if(v.students)labels.push(v.students+' qualifying student'+(v.students>1?'s':''));if(v.aid)labels.push('Spouse A&A');}if(labels.length===1)labels.push('No dependent allowance');$('description').textContent=labels.join(' · ');}
form.addEventListener('submit',e=>{e.preventDefault();update();});form.addEventListener('change',update);update();
// Payment dates use US Eastern calendar dates, independent of the visitor's zone.
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());let next;const currentYear=new Date().getUTCFullYear();for(let y=currentYear-1;y<=currentYear+1&&!next;y++)for(let m=0;m<12;m++){const d=paymentDate(y,m);if(key(d)>=today){next={d,y,m};break;}}if(next){$('next-date').textContent=fmt(next.d);$('next-description').textContent='Covers '+month(utc(next.y,next.m,1))+' · Calculated schedule';}
// Includes December 2026, the expected first month covered by the 2027 annual rate.
const schedule=Array.from({length:13},(_,i)=>{const y=i===0?2026:2027,m=i===0?11:i-1;return{y,m,date:paymentDate(y,m)};});for(const item of schedule){const tr=document.createElement('tr');const nominal=utc(item.y,item.m+1,1);for(const t of [month(utc(item.y,item.m,1)),fmt(item.date),key(nominal)===key(item.date)?'Standard date':'Earlier: weekend or holiday']){const td=document.createElement('td');td.textContent=t;tr.append(td);}$('schedule-body').append(tr);}
$('download-calendar').addEventListener('click',()=>{const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Veteran Pay Guide//Expected Payments//EN','CALSCALE:GREGORIAN'];for(const s of schedule){const end=new Date(s.date);end.setUTCDate(end.getUTCDate()+1);lines.push('BEGIN:VEVENT','UID:va-'+s.y+'-'+s.m+'@veteranpayguide','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+key(s.date).replaceAll('-',''),'DTEND;VALUE=DATE:'+key(end).replaceAll('-',''),'SUMMARY:Expected VA payment — '+month(utc(s.y,s.m,1)),'DESCRIPTION:Calculated schedule. Bank availability may vary. Verify through VA.gov.','END:VEVENT');}lines.push('END:VCALENDAR');const url=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='va-payment-calendar-2027.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
}
if(typeof module!=='undefined')module.exports={calculate,paymentDate,holidays};
// Lightweight, consistent line icons and category filtering.
if(typeof document!=='undefined'){
const icons={calculator:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h1m3 0h1m3 0h.1M8 15h1m3 0h1m3 0h.1M8 18h1m3 0h1m3 0h.1"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',spark:'<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z"/>',briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a24 24 0 0 0 18 0m-9-1v4"/>',document:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8m-8 4h5"/>',car:'<path d="m5 7 2-4h10l2 4m-16 4 2-4h14l2 4v7H3v-7Zm0 7v3m18-3v3M6 13h2m8 0h2"/>',shirt:'<path d="m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0Z"/>',home:'<path d="m3 11 9-8 9 8M5 9v12h14V9M9 21v-8h6v8"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',book:'<path d="M12 5C9 2 5 3 2 4v16c3-1 7-2 10 1 3-3 7-2 10-1V4c-3-1-7-2-10 1Zm0 0v16"/>',wallet:'<path d="M20 8V5H5a2 2 0 0 1 0-4h12v4M3 3v16a2 2 0 0 0 2 2h15V8H5a2 2 0 0 1-2-2m17 7h-5v5h5m-3-2.5h.1"/>',compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>'};
for(const el of document.querySelectorAll('[data-icon]')){const path=icons[el.dataset.icon];if(path)el.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';}
for(const button of document.querySelectorAll('[data-filter]'))button.addEventListener('click',()=>{const category=button.dataset.filter;for(const other of document.querySelectorAll('[data-filter]'))other.setAttribute('aria-pressed',String(other===button));let count=0;for(const card of document.querySelectorAll('.benefit-card')){const show=category==='all'||card.dataset.category===category;card.hidden=!show;if(show)count++;}document.getElementById('benefit-count').textContent='Showing '+count+' benefit'+(count===1?'':'s')+' to explore';});
}
// Inline disclosure: animate the grid so filtering can still resize the content.
if(typeof document!=='undefined'){
 const section=document.getElementById('benefits');
 const panel=document.getElementById('benefits-panel');
 const toggle=document.getElementById('benefits-toggle');
 const navOpeners=document.querySelectorAll('[data-open-support]');
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let expanded=false,hideTimer=null;
 function setExpanded(open,{scrollBack=false}={}){
  window.clearTimeout(hideTimer);hideTimer=null;expanded=open;
  toggle.setAttribute('aria-expanded',String(open));
  navOpeners.forEach(el=>el.setAttribute('aria-expanded',String(open)));
  toggle.querySelector('[data-support-toggle-label]').textContent=open?'Collapse benefits':'Explore more benefits';
  panel.setAttribute('aria-hidden',String(!open));panel.inert=!open;
  if(open){
   section.classList.add('is-open');panel.hidden=false;
   void panel.offsetHeight;
   panel.classList.add('is-expanded');
  }else{
   if(panel.contains(document.activeElement))toggle.focus({preventScroll:true});
   panel.classList.remove('is-expanded');
   const finish=()=>{if(!expanded){panel.hidden=true;section.classList.remove('is-open');}};
   if(reducedMotion.matches)finish();else hideTimer=window.setTimeout(finish,380);
   if(scrollBack)section.scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});
  }
 }
 toggle.addEventListener('click',()=>setExpanded(!expanded));
 document.querySelector('[data-collapse-support]').addEventListener('click',()=>setExpanded(false,{scrollBack:true}));
 navOpeners.forEach(opener=>opener.addEventListener('click',()=>{setExpanded(true);section.scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});}));
}
if(typeof document!=='undefined'){
 const calendar=document.getElementById('schedule');
 const summary=calendar.querySelector('summary');
 calendar.addEventListener('toggle',()=>{calendar.querySelector('.payment-action-label').textContent=calendar.open?'Hide calendar':'View calendar';});
 document.getElementById('collapse-payment-calendar').addEventListener('click',()=>{
  calendar.open=false;summary.focus({preventScroll:true});
  calendar.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
 });
}
