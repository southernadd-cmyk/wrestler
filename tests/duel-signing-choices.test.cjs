'use strict';
// The face-to-face promo shows how well each line suits tonight (the score that already moves its odds), and the
// contract signing's options say what they really do: tension, mic odds, brawl risk and the promoter's view.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {script}=require('./_source.cjs');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,script.indexOf('/* THE OFFICE — interface v3')),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeData:D,OfficeGame:G,OfficeMic:Mic,OfficeSigning:Sg}=root;
const leftovers=/undefined|NaN|\{\w+\}|\[object/;
const fitTag=o=>o.tags.find(t=>/^(Suits|Wrong for) tonight/.test(t));
const sign=t=>!t?0:/^Suits/.test(t)?1:-1;

// 1. Duel: the fit tag is the engine's own fit score, at every stage where it applies.
{
 let shown=0,checked=0,i=0;
 for(const worker of D.TALENT)for(const opponent of D.FOES){
  if(i++%3)continue;
  const promoter=D.PROMOS[i%4];
  const booking={id:'fit-'+i,wid:worker.id,rid:opponent.id,pid:promoter.id,finish:'win_clean',slot:['opener','mid','feature','main'][i%4],minutes:12,eventAbs:i,feudHeat:(i%6)*14};
  const st=Mic.begin(booking,worker,opponent,null,null,promoter);
  for(let guard=0;st.stage!=='done'&&guard<8;guard++){
   const round=Mic.ROUNDS[st.round].id,opts=Mic.choices(st);
   for(const o of opts){
    assert.doesNotMatch(o.label+o.hint+o.tags.join(),leftovers);
    const want=round==='open'?Mic.openFit(st,o.id):round==='answer'?Mic.answerFit(st,o.id):round==='push'&&Mic.PUSH[o.id]&&!st.director&&!st.core.case?.exposed?Mic.pushFit(st,o.id):null;
    if(want===null){assert.equal(fitTag(o),undefined,'no fit tag where no fit applies: '+round+' '+o.id);continue;}
    assert.equal(sign(fitTag(o)),Math.sign(want),round+' '+o.id+' fit '+want+' tag '+fitTag(o));
    if(Math.abs(want)>=2)assert.match(fitTag(o),/▲▲|▼▼/);
    if(want)assert.match(o.hint,/tonight|right answer|plays into/,'the hint says why');
    checked++;if(want)shown++;
   }
   Mic.choose(st,opts[0].id);
  }
 }
 assert.ok(shown>checked/4,'fit is visible on plenty of lines: '+shown+'/'+checked);
 console.log('PASS the duel’s fit tag matches the engine’s fit score on '+checked+' options ('+shown+' carry one)');
}

// 2. Signing: tags are the effect.
function career(){G.fresh();const s=G.S;s.cash=99999;s.rep=60;G.sign('rex');s.inbox=[];s.offers=[];return s;}
let n=0;
const contract=(o={})=>({id:'sig-'+(n++),pid:'crown',rid:'silas',wid:'rex',slot:'main',minutes:15,finish:'win_clean',title:{pid:'crown',div:'heavy'},feudHeat:30,eventAbs:G.abs(),...o});
function signing(o={}){career();if(o.trust!==undefined)G.P(o.pid||'crown').trust=o.trust;return Sg.begin(contract({id:o.id||'fixed',pid:o.pid||'crown',feudHeat:o.feudHeat??30}),o.w||G.W('rex'),G.F('silas'),G.P(o.pid||'crown'));}
{
 let checked=0,risky=0;
 for(const pid of ['crown','dock','pulse','union'])for(const heat of [0,60])
  for(const a of Sg.ROUNDS[0].options)for(const b of Sg.ROUNDS[1].options)for(const c of Sg.ROUNDS[2].options){
   const st=signing({pid,feudHeat:heat,id:'tags-'+pid+heat+a.id+b.id,trust:50});
   let promoter;
   for(const id of [a.id,b.id,c.id]){
    const shown=Sg.options(st).find(o=>o.id===id),t0=st.tension,trust0=st.trust||0;
    assert.doesNotMatch(shown.label+shown.hint+shown.tags.join(),leftovers);
    const mic=shown.tags.find(t=>t.startsWith('Gamble: '));
    Sg.choose(st,id);
    const dt=st.tension-t0,tensionTag=shown.tags.find(t=>t.startsWith('Tension'));
    const base=Sg.ROUNDS.flatMap(R=>R.options).find(o=>o.id===id).t;
    if(base)assert.match(tensionTag,base>0?/▲/:/▼/,id+' tension tag');else if(!mic)assert.equal(tensionTag,undefined,id);
    if(id!=='shake'&&!(id==='words'&&dt===base+1))assert.equal(dt,base,id+' applied tension');
    const own=(st.trust||0)-trust0;
    // The plain promoter tag is this option's own effect; the conditional ones only count if it happens.
    const tagSign=re=>{const t=shown.tags.find(x=>re.test(x));return t?(t.includes('▲')?1:-1):0;};
    const cond=(st.stage==='done'&&st.brawl?tagSign(/if it kicks off/):0)+(id==='shake'&&st.shake==='shook'?tagSign(/if they shake/):0);
    assert.equal(own-cond,tagSign(/^Promoter [▲▼]$/),id+' promoter tags '+shown.tags+' moved '+own);
    if(st.stage==='done'){
     const certain=shown.tags.some(t=>t.startsWith('Brawl:')),risk=shown.tags.some(t=>t.startsWith('Risk: brawl'));
     if(certain)assert.ok(st.brawl,'a flipped table is a brawl');
     if(!certain&&!risk)assert.ok(!st.brawl,'no brawl without a stated risk: '+[a.id,b.id,c.id]+' '+shown.tags);
     if(risk)risky++;
    }
   }
   promoter=G.P(pid).trust-50;
   const r=Sg.result(st);assert.equal(r.trustDelta,promoter,'the promoter’s change is applied once and reported');
   checked++;
  }
 assert.ok(risky>0);
 console.log('PASS signing tags match tension, brawls and the promoter on '+checked+' signings');
}

// 3. Signing: the fixture changes what an option does.
{
 const play=(picks,o)=>{const st=signing(o);for(const id of picks)assert.ok(Sg.choose(st,id),id);return {st,r:Sg.result(st),trust:G.P(o?.pid||'crown').trust};};
 const funny=play(['lawyer','ignore','walk'],{w:{...G.W('rex'),id:'malik'}}),flat=play(['lawyer','ignore','walk'],{w:{...G.W('rex'),id:'brick'}});
 assert.ok(funny.r.quality>flat.r.quality,'a lawyer bit needs the right talker: '+funny.r.quality+' v '+flat.r.quality);
 const crown=play(['sign','ignore','flip'],{pid:'crown',trust:50}),dock=play(['sign','ignore','flip'],{pid:'dock',trust:50});
 assert.equal(crown.r.trustDelta,-1,'a traditional promoter does not want the table flipped');
 assert.equal(dock.r.trustDelta,1,'an aggressive one does');
 assert.equal(crown.trust,49);assert.equal(dock.trust,51);
 const hot=signing({feudHeat:50}),calm=signing({feudHeat:0});
 Sg.choose(hot,'late');Sg.choose(hot,'face');Sg.choose(calm,'sign');Sg.choose(calm,'ignore');
 const shake=st=>Sg.options(st).find(o=>o.id==='shake').tags;
 assert.ok(shake(hot).some(t=>/Risk: brawl \(likely\)/.test(t)),'a handshake in a boiling room: '+shake(hot));
 assert.ok(!shake(calm).some(t=>/brawl|Brawl/.test(t)),'a handshake in a calm room is safe: '+shake(calm));
 const low=signing({w:{...G.W('rex'),mic:20}}),high=signing({w:{...G.W('rex'),mic:95}});
 const micTag=st=>Sg.options(st).find(o=>o.id==='read').tags[0];
 assert.notEqual(micTag(low),micTag(high),'mic odds follow the talker: '+micTag(low)+' / '+micTag(high));
 console.log('PASS signings read the talker, the promoter and how hot the room is');
}
