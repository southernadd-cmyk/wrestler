/* The Office — optional first-week guidance. No game rules or save-version changes. */
(function(root){
 'use strict';
 const tasks=[
  {key:'signed',title:'Sign your first wrestler',detail:'A signing fee comes out now; wages come out every week.',go:'scouting'},
  {key:'booked',title:'Book your first match',detail:'Check the promoter, opponent, purse and planned finish.',go:'offers'},
  {key:'read',title:'Read the Office inbox',detail:'Some letters need an answer before the week can continue.',go:'inbox'},
  {key:'trained',title:'Set a training focus',detail:'Choose a focus or a session with Dennis for your wrestler.',go:'training'},
  {key:'match',title:'Work your first match',detail:'Press Match night, agree the plan, speak on the mic and work the bout.',go:'fixtures'}
 ];
 function ensure(s){if(!s)return null; if(!s.firstWeek||typeof s.firstWeek!=='object')s.firstWeek={};return s.firstWeek;}
 function progress(s){
  if(!s)return {done:0,total:tasks.length,steps:[],finished:false};
  const m=ensure(s),sign=!!(m.signed||s.roster?.length),book=!!(m.booked||s.card?.length||s.futureBookings?.length),read=!!(m.read||s.inbox?.some(x=>x.read)),train=!!m.trained,match=!!(m.match||s.history?.length);
  const checks={signed:sign,booked:book,read,trained:train,match};
  const steps=tasks.map(x=>({...x,done:!!checks[x.key]})),done=steps.filter(x=>x.done).length;
  return {done,total:tasks.length,steps,finished:done===tasks.length,firstWeek:s.season===1&&s.week===1};
 }
 function note(s){const p=progress(s),next=p.steps.find(x=>!x.done);
  if(!next)return 'That is your first week done. The territory is yours now.';
  if(next.key==='signed')return 'Welcome to the territory. You have £2,250 and an empty locker room. Pick one wrestler you can afford, but remember: wages arrive every week, whether you get booked or not.';
  if(next.key==='booked')return 'You have someone under contract. Now get them working. The booker picks the result; you negotiate the terms and work out how to get there.';
  if(next.key==='read')return 'Before you hit Continue, check the office post. Promoters and wrestlers send requests, and some need your answer.';
  if(next.key==='trained')return 'Don’t send someone out cold. Set their training focus, or give them one of my two weekly sessions.';
  return 'Card signed, paperwork done. Press Match night. I’ll go through the running order with you backstage before the microphone opens.';
 }
 root.OfficeOnboarding={tasks,ensure,progress,note};
 if(typeof document==='undefined')return;
 const $=sel=>document.querySelector(sel);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const current=()=>root.OfficeGame?.S;
 let gameView=null;
 function dock(){let el=$('#firstWeekDock');if(el)return el;
  el=document.createElement('aside');el.id='firstWeekDock';el.className='first-week-dock';el.setAttribute('aria-label','First-week guide');document.body.append(el);return el;
 }
 function guide(){const s=current(),el=dock();if(!s||$('#app')?.hidden||!$('#tv')?.hidden){el.hidden=true;return}
  const m=ensure(s),p=progress(s),visible=p.firstWeek||(m.open===true&&$('#view')?.textContent.includes('How a week works'));
  el.hidden=!visible;if(!visible)return;
  el.innerHTML=`<button class="first-week-tab" type="button" data-firstweek="toggle" aria-expanded="${!!m.open}" aria-controls="firstWeekDetails">FIRST WEEK <b>${p.done}/${p.total}</b> <span aria-hidden="true">${m.open?'▾':'▴'}</span></button>`+
   (m.open?`<section id="firstWeekDetails" class="first-week-panel"><div class="first-week-title"><b>Dennis’s checklist</b><button type="button" data-firstweek="toggle" aria-label="Close first-week checklist">×</button></div><p class="first-week-note">${esc(note(s))}</p><ol>${p.steps.map(t=>`<li class="${t.done?'checked':''}"><span aria-hidden="true">${t.done?'✓':'○'}</span><div><b>${esc(t.title)}</b><small>${esc(t.detail)}</small></div><button type="button" data-go="${esc(t.go)}">Go</button></li>`).join('')}</ol></section>`:'');
 }
 function welcome(){const s=current(),v=$('#view');if(!s||!v||s.season!==1||s.week!==1||progress(s).steps[0].done)return;
  const screen=v.querySelector('.screen.s-split'),body=screen?.querySelector('.win .wbody');
  if(!body||body.querySelector('.first-week-welcome'))return;
  const el=document.createElement('div');el.className='first-week-welcome';
  el.innerHTML=`<div><b>Dennis · Road agent</b><p>${esc(note(s))}</p></div><button type="button" data-firstweek="open">First-week checklist</button>`;
  body.prepend(el);
 }
 function gameLink(){const s=current(),screen=$('#view .screen'),heading=screen?.textContent||'';
  if(!s||!screen||!heading.includes('How a week works')||screen.querySelector('.first-week-reopen'))return;
  const button=document.createElement('button');button.type='button';button.className='btn sm first-week-reopen';button.dataset.firstweek='open';button.textContent='Open first-week guide';screen.querySelector('.win:last-child .wbody')?.append(button);
 }
 function refresh(){guide();welcome();gameLink()}
 function saveFlag(key){const s=current();if(!s)return;const m=ensure(s);if(!m[key]){m[key]=true;root.OfficeGame?.save?.()}refresh();}
 function afterClick(e){const t=e.target.closest('button,[data-sign],[data-book],[data-talkbook]');if(!t)return;
  const s=current(),d=t.dataset;
  if(d.firstweek){if(!s)return;const m=ensure(s);m.open=d.firstweek==='open'?true:!m.open;root.OfficeGame?.save?.();refresh();return}
  if(!s)return;
  if(d.sign&&s.roster?.some(w=>w.id===d.sign))saveFlag('signed');
  else if((d.book||d.talkbook)&&(s.card?.length||s.futureBookings?.length))saveFlag('booked');
  else queueMicrotask(refresh);
 }
 document.addEventListener('DOMContentLoaded',()=>{
  const view=$('#view');if(!view)return;
  new MutationObserver(()=>refresh()).observe(view,{childList:true});
  document.addEventListener('click',afterClick);
  document.addEventListener('change',e=>{
   const t=e.target;if((t.matches('[data-train]')||t.matches('[data-intensity]')||t.matches('[data-session]'))&&current()?.roster?.length)saveFlag('trained');
   else queueMicrotask(refresh);
  });
  refresh();
 });
})(window);
