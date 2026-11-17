'use strict';
// The Office v3.4: headless career soak. Plays whole seasons through the same engine calls the
// interface makes (sign, book, meeting, promo, match, result, inbox decisions, end of week) and
// checks that nothing crashes, leaks a placeholder or corrupts the save.
// Run: node tests/season-soak.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');

function career(seed,style){
 // A private engine with a seeded clock and Math.random, so every run of this file is identical.
 let r=seed>>>0;const random=()=>{r=(Math.imul(r,1664525)+1013904223)>>>0;return r/4294967296;};
 const math=Object.create(Math);math.random=random;
 const FixedDate=class extends Date{static now(){return 1700000000000+seed*977;}};
 const store=new Map(),root={addEventListener(){}};
 const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 vm.runInNewContext(script.slice(0,cut),{window:root,localStorage,Date:FixedDate,Math:math,JSON,console});
 const D=root.OfficeData,G=root.OfficeGame,M=root.OfficeMatch,P=root.OfficeSheets,Promo=root.OfficeStory.Graph,Mem=root.OfficeMemory;
 G.fresh();
 const stats={weeks:0,matches:0,routes:new Set(),variants:new Set(),moves:new Set(),signatureCalls:0,decisions:0,injuries:0,stars:0,texts:[]};
 const plans=['story','technical','brawl','spots','safe'],methods=['detailed','landmarks','live'],votes=['compromise','worker','opponent'];
 const pick=n=>Math.floor(random()*n);
 const check=()=>{
  const S=G.S;
  assert.ok(Number.isFinite(S.cash),'cash is a number');
  assert.ok(S.rep>=0&&S.rep<=100,'reputation in range: '+S.rep);
  for(const w of S.roster)for(const k of ['ring','mic','psych','safe','heat','morale','fatigue','ego','pro','loyal'])
   assert.ok(Number.isFinite(w[k])&&w[k]>=0&&w[k]<=100,w.id+'.'+k+' in range: '+w[k]);
  for(const p of S.promoters)assert.ok(p.trust>=0&&p.trust<=100,'promoter trust in range');
  for(const fd of Object.values(S.feuds))assert.ok(fd.heat>=0&&fd.heat<=100,'feud heat in range');
  const raw=JSON.stringify(S);
  assert.doesNotMatch(raw,/\bNaN\b|undefined|\[object Object\]|\{(?:W|F|A|D|name|part|PROP|THEME|FINISHER|EVIDENCE|STRENGTH)\}/,'no corrupted text in the save');
 };
 for(let week=0;week<32&&!G.S.over;week++){
  const S=G.S;
  // Sign talent while the stable is small and there is a cushion in the bank.
  const free=S.free.slice().sort((a,b)=>a.fee-b.fee);
  for(const t of style==='spender'?free.reverse():free){
   if(S.roster.length>=(style==='lean'?2:4))break;
   if(S.cash-t.fee>=(style==='spender'?150:650)){const err=G.sign(t.id);assert.ok(!err||typeof err==='string');}
  }
  // Answer every inbox decision.
  for(let guard=0;guard<20;guard++){
   const m=G.pending()[0];if(!m)break;
   const order=m.options.slice().sort(()=>random()-.5);
   let done=false;
   for(const o of order){const out=G.answer(m.id,o.id);if(m.answer){done=true;break;}assert.equal(typeof out,'string','a refused answer explains why');}
   assert.ok(done,'every decision can be answered: '+m.dtype);stats.decisions++;
  }
  // Book whatever the roster can work.
  for(const o of S.offers.slice()){
   const w=S.roster.find(x=>D.divisionOf(x)===D.divisionOf(o.rid)&&G.availableAt(x,o.eventAbs)&&(!o.wid||o.wid===x.id)&&(!o.talk||o.talk.wid===x.id)&&!G.bookedAt?.(x,o.eventAbs));
   if(w&&(style!=='lean'||o.finish!=='lose_clean')){const err=G.book(o.id,w.id);assert.ok(err===null||typeof err==='string');}
  }
  // Match night, in the order the interface uses.
  for(const c of S.card.slice().sort((a,b)=>D.SLOTS[a.slot].rank-D.SLOTS[b.slot].rank)){
   const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid);assert.ok(w&&f&&p,'card entry resolves');
   const game=plans[pick(5)],method=methods[pick(3)];
   let sheet=P.build(c,w,f,game,method,null,'authentic');
   const focus=P.focusOptions(c,w,f,game);sheet=P.build(c,w,f,game,method,sheet.disputed?votes[pick(3)]:null,focus[pick(focus.length)].id);
   if(sheet.disputed&&!sheet.signed)sheet=P.build(c,w,f,game,method,'compromise',sheet.focus||'authentic');
   const st=Promo.begin(c,w,f,G.feud(w.id,f.id),sheet);
   while(st.stage!=='done'){
    const shown=Promo.choices(st.stage,st);assert.ok(shown.length>=5&&shown.length<=7);
    const o=shown[pick(shown.length)];Promo.choose(st,o.id);if(o.variant)stats.variants.add(o.variant);
   }
   const x=M.create({w:{...w,fatigue:G.clamp(w.fatigue)},f,p,slot:c.slot,minutes:c.minutes,finish:c.finish,
    feudHeat:Math.max(c.feudHeat||0,G.feud(w.id,f.id)?.heat||0),blowoff:c.blowoff,promo:Promo.result(st),
    plan:{game,leash:pick(2)?'script':'loose',talk:['none','calm','fire','money'][pick(4)]},preparation:{...w.prep},flags:{...w.flags},
    memory:Mem.context(w.id,f.id),sheet:sheet.signed?sheet:null,seed:Math.floor(random()*2**31)});
   // Half-way through, save and restore the live match as a browser refresh would.
   let live=x;
   for(let i=0;i<9000&&!live.done;i++){
    if(live.decision&&!live.queue.length)M.resolve(live,live.decision.options[pick(live.decision.options.length)].id);
    M.next(live);
    if(i===40)live=M.restore(JSON.parse(JSON.stringify({...live,rState:live.r.getState()})));
   }
   assert.ok(live.done&&live.final,'match finishes');
   const text=live.log.map(l=>l.text).join(' ');
   assert.doesNotMatch(text,/undefined|NaN|\{(?:W|F|A|D|name|part|move|fin)\}/,'commentary is clean');
   if(live.final.finishRoute)stats.routes.add(c.finish+'.'+live.final.finishRoute);
   if(/nobody on this circuit does it quite like/.test(text))stats.signatureCalls++;
   for(const e of live.graph.events)stats.moves.add(e.id);
   if(live.final.injury)stats.injuries++;
   const fin={...live.final,log:live.log.map(({t,text,kind,big})=>({t,text,kind,big}))};
   const cons=G.applyResult(c,fin);
   assert.ok(Array.isArray(cons)&&cons.length,'the result has consequences');
   for(const line of cons)assert.doesNotMatch(String(line.text),/undefined|NaN|\{\w+\}/);
   assert.ok(!G.S.card.some(k=>k.id===c.id),'the contract leaves the card');
   stats.matches++;stats.stars+=live.final.stars;
  }
  check();
  // A save made between weeks must load back to the same career.
  if(week%5===2){const snap=JSON.stringify(G.S);G.S=JSON.parse(snap);assert.equal(JSON.stringify(G.S),snap,'save and load round-trips');}
  G.endWeek();stats.weeks++;
  check();
 }
 for(const m of G.S.inbox)stats.texts.push(m.subject+' '+(m.body||[]).join(' '));
 stats.over=G.S.over?.reason||null;stats.season=G.S.season;stats.cash=G.S.cash;stats.rep=G.S.rep;stats.history=G.S.history.length;
 return stats;
}

const runs=[];
for(const [seed,style] of [[11,'steady'],[23,'spender'],[37,'lean'],[58,'steady'],[71,'spender'],[94,'steady']])runs.push({seed,style,...career(seed,style)});
// The same seed replays the same career.
const again=career(11,'steady');
assert.equal(JSON.stringify({...again,routes:[...again.routes],variants:[...again.variants],moves:[...again.moves]}),
 JSON.stringify({...runs[0],seed:undefined,style:undefined,routes:[...runs[0].routes],variants:[...runs[0].variants],moves:[...runs[0].moves]}),'careers are deterministic');
const total=k=>runs.reduce((n,r)=>n+r[k],0),union=k=>new Set(runs.flatMap(r=>[...r[k]]));
assert.ok(total('matches')>=120,'plenty of matches were worked: '+total('matches'));
assert.ok(runs.some(r=>r.season>=3),'a career reaches a third season');
assert.ok(union('routes').size>=14,'most finish routes appear across careers: '+union('routes').size);
assert.ok(union('variants').size>=100,'most promo variants appear across careers: '+union('variants').size);
assert.ok(union('moves').size>=700,'a wide range of moves appears across careers: '+union('moves').size);
assert.ok(total('signatureCalls')>total('matches')*.4,'signature moves are recognised in many matches');
for(const r of runs)for(const t of r.texts)assert.doesNotMatch(t,/undefined|NaN|\{\w+\}/,'inbox text is clean');
console.log('PASS season soak v3.4: '+runs.length+' careers, '+total('weeks')+' weeks, '+total('matches')+' matches ('+(total('stars')/total('matches')).toFixed(2)+'★ average), '+
 total('decisions')+' inbox decisions, '+union('moves').size+' distinct moves, '+union('variants').size+' promo variants, '+union('routes').size+' finish routes; '+
 'outcomes: '+runs.map(r=>r.style+' s'+r.season+(r.over?' ('+r.over+')':'')+' £'+Math.round(r.cash)).join(', ')+'; saves round-trip; deterministic');
