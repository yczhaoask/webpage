const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {calculate,paymentDate,createUsageTracker}=require('../dist/app.js');

test('2026 official and 2027 estimated calculations retain household behavior',()=>{
 assert.equal(calculate({rating:70,year:2026}).monthly,1808.45);
 assert.equal(calculate({rating:70,year:2027}).monthly,1873.55);
 assert.equal(calculate({rating:70,spouse:1,children:2,year:2026}).monthly,2150.45);
 assert.equal(calculate({rating:20,spouse:1,children:2,parents:2,year:2026}).monthly,356.66);
});
test('expected dates account for weekends and observed New Year holidays',()=>{
 for(const [y,m,want] of [[2026,0,'2026-01-30'],[2026,9,'2026-10-30'],[2026,10,'2026-12-01'],[2026,11,'2026-12-31'],[2027,11,'2027-12-30']])
  assert.equal(paymentDate(y,m).toISOString().slice(0,10),want);
});
test('tracker queues early events, sends names only, and deduplicates',()=>{
 let sdk;const calls=[],tracker=createUsageTracker(()=>sdk);
 tracker.track('calculator_used');tracker.track('calculator_used');tracker.track('private_value');
 sdk={sendEvent(...args){calls.push(args);}};tracker.flush();tracker.track('calculator_used');
 tracker.track('payment_calendar_downloaded');tracker.track('payment_calendar_downloaded');
 assert.deepEqual(calls,[['calculator_used'],['payment_calendar_downloaded']]);
});
test('missing or broken analytics never prevents the application running',()=>{
 const tracker=createUsageTracker(()=>({sendEvent(){throw Error('blocked');}}));
 assert.doesNotThrow(()=>{tracker.track('calculator_used');tracker.flush();});
 assert.doesNotThrow(()=>createUsageTracker(()=>undefined).track('calculator_used'));
});

// Exercise the real browser handlers in a minimal DOM: no SDK requests or personal data.
function mount(){
 const elements=new Map(),allButtons=[],calls=[];
 function el(){return {listeners:{},value:'0',checked:false,hidden:false,dataset:{},classList:{add(){},remove(){}},
  click(){},addEventListener(n,f){this.listeners[n]=f;},setAttribute(){},replaceChildren(){},append(){},
  querySelector(){return el();},querySelectorAll(){return [];},reportValidity(){return this.valid!==false;}};}
 const get=id=>{if(!elements.has(id))elements.set(id,el());return elements.get(id);};
 const form=get('pay-form');form.elements={year:{value:'2027'}};
 const rating=get('rating-buttons');rating.append=b=>allButtons.push(b);
 const sdk={sendEvent(...args){calls.push(args);}};
 const document={getElementById:get,querySelector(s){return s==='.rating-buttons'?rating:get(s);},
  querySelectorAll(s){return s==='.rating-buttons button'?allButtons:[];},createElement:el};
 const window={AhrefsAnalytics:sdk,addEventListener(){},matchMedia(){return {matches:true};},clearTimeout(){},setTimeout(){}};
 const context={document,window,Intl,Date,Set,Number,Math,URL,Blob,setTimeout(){},module:{exports:{}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../dist/app.js'),'utf8'),context);
 return {get,form,allButtons,calls};
}
test('initial display and invalid inputs do not count as calculator use; repeated valid edits count once',()=>{
 const {form,allButtons,calls,get}=mount();
 assert.deepEqual(calls,[]);
 form.valid=false;form.listeners.change();assert.deepEqual(calls,[]);
 form.valid=true;form.listeners.change();allButtons[0].listeners.click();
 form.listeners.submit({preventDefault(){}});
 assert.deepEqual(calls,[['calculator_used']]);
 assert.equal(get('monthly').textContent,'$186.92');
});
test('published guide covers both years with canonical metadata and distinct benefit months',()=>{
 const html=fs.readFileSync('dist/va-disability-payment-dates/index.html','utf8');
 assert.match(html,/<title>VA Disability Payment Dates: 2026 &amp; 2027 Calendar/);
 assert.match(html,/<link rel="canonical" href="https:\/\/veteranpayguide.com\/va-disability-payment-dates\/">/);
 assert.match(html,/id="calendar-2026"/);assert.match(html,/id="calendar-2027"/);
 assert.equal((html.match(/<th scope="row">/g)||[]).length,24);
 assert.match(html,/<th scope="row">October 2026<\/th><td><time datetime="2026-10-30">/);
 assert.match(html,/<th scope="row">December 2027<\/th><td><time datetime="2027-12-30">/);
 assert.doesNotMatch(html,/utm_source=/);
});

test('calendar download can be tracked independently without calculator interaction',()=>{
 const {get,calls}=mount();
 get('download-calendar').listeners.click();get('download-calendar').listeners.click();
 assert.deepEqual(calls,[['payment_calendar_downloaded']]);
});
