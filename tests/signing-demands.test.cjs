'use strict';
// v0.3.24 the contract signing before the big matches, and demands made on the post-match microphone.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeMatch:MX,OfficeSigning:Sg,OfficeAfter:A,OfficeTerritory:T}=root;
assert.ok(Sg&&Sg.begin&&A.demandsFor,'signing and demands are installed');
const clean=/undefined|NaN|\{\w+\}|\[object/;
const fin=(o={})=>({stars:3.5,crowd:66,crowdPeak:72,outcome:'booked',botches:0,script:.9,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:15,plan:'brawl',stamina:45,injury:0,ignored:0,callsUsed:[],log:[],...o});
let n=0;
function career(){G.fresh();const s=G.S;s.cash=99999;s.rep=60;G.sign('rex');s.inbox=[];s.offers=[];return s;}
const contract=(o={})=>({id:'sd-'+(n++),pid:'crown',rid:'silas',wid:'rex',slot:'main',minutes:15,finish:'win_clean',purse:300,feudHeat:40,eventAbs:G.abs(),...o});

// 1. Which matches get a signing.
{
 career();
 assert.ok(Sg.eligible(contract({title:{pid:'crown',div:'men'}})),'a title match');
 assert.ok(Sg.eligible(contract({blowoff:true})),'a blow-off');
 assert.ok(!Sg.eligible(contract()),'not an ordinary match');
 G.S.territory.programmes={live:[{id:'pg1',beats:[{},{},{}]}],done:[],offered:[]};
 assert.ok(Sg.eligible(contract({programme:{id:'pg1',step:2}})),'a programme’s payoff');
 assert.ok(!Sg.eligible(contract({programme:{id:'pg1',step:0}})),'not its first match');
 console.log('PASS signings are for title matches, blow-offs and programme payoffs');
}

// 2. Every path through the signing reads cleanly and ends in a result the match can use.
{
 let paths=0,brawls=0,calm=0;
 for(const a of Sg.ROUNDS[0].options)for(const b of Sg.ROUNDS[1].options)for(const c of Sg.ROUNDS[2].options){
  const s=career();const k=contract({blowoff:true,rid:b.id==='face'?'rev':'silas'});s.feuds['rex:silas']={wid:'rex',rid:'silas',heat:40,matches:3,closed:false,since:1};
  const st=Sg.begin(k,G.W('rex'),G.F('silas'),G.P('crown'));
  for(const id of [a.id,b.id,c.id])assert.ok(Sg.choose(st,id),id);
  assert.equal(st.stage,'done');assert.equal(Sg.choose(st,'flip'),false,'nothing after the signature');
  const r=Sg.result(st);paths++;
  assert.ok(r&&r.hook&&Number.isFinite(r.crowdShift)&&r.quality>=15&&r.quality<=95);
  assert.doesNotMatch(st.log.map(e=>e.text).join('\n')+r.hook+r.reaction,clean);
  for(const t of [...st.log.map(e=>e.text),r.hook])assert.ok(!/^[“\"]?[a-z]/.test(t)&&!/[.!?]\s+[a-z]/.test(t),'starts like a sentence: '+t);
  if(c.id==='flip')assert.ok(r.brawl,'flipping the table is always a brawl');
  if(r.brawl){brawls++;assert.ok(G.W('rex').flags.pushThrough,'a brawl leaves them sore');}
  if(a.id==='sign'&&b.id==='ignore'&&c.id==='walk'){assert.ok(!r.brawl,'keeping it calm keeps it calm');calm++;}
 }
 const total=Sg.ROUNDS.reduce((n,R)=>n*R.options.length,1);assert.equal(paths,total);assert.ok(brawls>total/4&&brawls<total*5/6,'brawls: '+brawls+'/'+total);
 console.log('PASS all '+paths+' signings read cleanly; '+brawls+' end in a brawl');
}

// 3. Settled once; the feud and the body pay for a brawl.
{
 const s=career();const k=contract({title:{pid:'crown',div:'men'}});s.feuds['rex:silas']={wid:'rex',rid:'silas',heat:30,matches:1,closed:false,since:1};
 const fat=G.W('rex').fatigue,st=Sg.begin(k,G.W('rex'),G.F('silas'),G.P('crown'));
 Sg.choose(st,'late');Sg.choose(st,'face');Sg.choose(st,'flip');
 assert.equal(G.W('rex').fatigue,fat+6);assert.ok(s.feuds['rex:silas'].heat>30+6);
 const h=s.feuds['rex:silas'].heat;st.settled=true;Sg.choose(st,'flip');assert.equal(s.feuds['rex:silas'].heat,h,'once');
 console.log('PASS a brawl costs fatigue and heats the feud, once');
}

// 4. The signing goes into the match and into the history, as a promo does.
{
 const s=career();const k=contract({title:{pid:'crown',div:'men'}});s.card.push(k);
 const st=Sg.begin(k,G.W('rex'),G.F('silas'),G.P('crown'));for(const id of ['sign','ignore','shake'])Sg.choose(st,id);
 const promo=Sg.result(st),w=G.W('rex');
 const M=MX.create({w:{...w},f:G.F('silas'),p:G.P('crown'),slot:'main',minutes:15,finish:'win_clean',feudHeat:40,promo,plan:{game:'story',leash:'script',talk:'none'},seed:5});
 for(let i=0;i<12000&&!M.done;i++){if(M.decision&&!M.queue.length)MX.resolve(M,M.decision.options[0].id);MX.next(M);}
 assert.ok(M.log.some(l=>l.text===promo.hook),'the hook is read before the bell');
 G.applyResult(k,{...M.final,log:[]});
 assert.equal(s.history[0].promo.style,'Contract signing');
 console.log('PASS the signing reaches the match and the history');
}

// 5. Demands: a title shot when there is a champion to ask for; more likely with a showman than a cold booker.
{
 const setup=(pid,mic=55,heat=45)=>{const s=career();const w=G.W('rex');w.mic=mic;w.heat=heat;
  // No programme offers this time (a promoter may otherwise answer with a whole title chase instead).
  root.OfficeProgrammes.state(s.territory).lastOffer=G.abs()+50;
  // Pushing in from below the main event: the middle of the card, with a big win tonight.
  const div=D.divisionOf('rex'),rank=T.promotionRank(pid,div).filter(r=>r.id!=='rex');s.territory.cards[pid].rex={score:rank[7].score,matches:4,wins:3};
  const holder=T.title(pid,div)?.holder;
  const c=contract({pid,finish:'win_clean',slot:'feature'});s.card.push(c);const f=fin({stars:3.75});G.applyResult(c,f);
  s.territory.cards[pid].rex.score=rank[6].score; // still in the middle of the card after it
  return {s,c,f,holder,st:A.begin(c,f,'none')};};
 let x=setup('pulse');
 assert.ok(x.holder&&!G.W(x.holder),'Pulse has a champion');
 assert.ok(A.micOptions(x.st).some(o=>o.id==='demand:title'),'a contender can demand a title shot');
 const show=A.demandChance(x.st,'title');
 const y=setup('union');const cold=A.demandChance(y.st,'title');
 assert.ok(show>cold+.15,'a showman is easier to put on the spot: '+show.toFixed(2)+' v '+cold.toFixed(2));
 // Land one, and the title match is on the desk next week.
 let landed=null;
 for(let i=0;i<40&&!landed;i++){n=500+i;const z=setup('pulse',90,90);A.speak(z.st,'demand:title');if(z.st.demand.ok)landed=z;}
 assert.ok(landed,'a strong talker lands it');
 landed.s.card=[];G.endWeek();
 const o=landed.s.offers.find(q=>q.tag==='Title match'&&q.wid==='rex');
 assert.ok(o&&o.title&&o.title.pid==='pulse','the title match is offered');
 assert.ok(o.callout,'because of the demand: a contender from below would not otherwise be offered it');
 assert.equal(o.rid,T.title('pulse',D.divisionOf('rex')).holder,'against the champion');
 // The promoter may have offered it already this week; otherwise the demand's own letter explains it.
 if(o.callout)assert.ok(landed.s.inbox.some(m=>/gets the title match/.test(m.subject)),'the booker rings');
 // Fail one in front of a cold booker: it costs trust.
 let flop=null;
 for(let i=0;i<40&&!flop;i++){n=700+i;const z=setup('union',30,20);const t0=G.P('union').trust;A.speak(z.st,'demand:title');if(!z.st.demand.ok){flop=true;assert.equal(G.P('union').trust,t0-6,'Vivian Croft does not like it');}}
 assert.ok(flop);
 console.log('PASS title demands: showman '+Math.round(show*100)+'% v cold '+Math.round(cold*100)+'%; a landed demand books the champion');
}

// 6. Demanding a bigger spot moves them up the card, or costs a little.
{
 let up=0,down=0;
 for(let i=0;i<30;i++){
  const s=career();n=900+i;const w=G.W('rex');w.mic=40+i*2;
  s.territory.cards.dock.rex={score:30,matches:2,wins:1};
  const c=contract({pid:'dock',slot:'mid'});s.card.push(c);const f=fin({stars:3.75});G.applyResult(c,f);
  const st=A.begin(c,f,'none');if(!A.micOptions(st).some(o=>o.id==='demand:slot'))continue;
  const slotHint=A.micOptions(st).find(o=>o.id==='demand:slot').hint;
  assert.match(slotHint,/card ladder\. Current standing:/,'explain that the demand concerns ladder standing');
  assert.doesNotMatch(slotHint,/higher up the card than opener/,'do not describe a mid-card bout as an opener');
  const before=s.territory.cards.dock.rex.score;A.speak(st,'demand:slot');
  if(st.demand.ok){up++;assert.equal(s.territory.cards.dock.rex.score,before+8);}else down++;
  assert.ok(st.cons.every(x=>!clean.test(x.text)));
 }
 assert.ok(up>=3&&down>=3,'both ways: '+up+' up, '+down+' not');
 console.log('PASS bigger-spot demands: '+up+' landed, '+down+' did not');
}
