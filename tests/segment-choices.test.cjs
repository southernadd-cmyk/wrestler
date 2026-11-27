'use strict';
// Solo promo, backstage ambush and interview grilling: every option is weighed against the fixture, its tags are
// built from the numbers it applies, gambles name their real odds, and the desk filters the long step.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {script}=require('./_source.cjs');
const cut=script.indexOf('/* THE OFFICE — interface v3');
const store=new Map(),root={addEventListener(){}};
vm.runInNewContext(script.slice(0,cut),{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
const {OfficeGame:G,OfficeMatch:MX,OfficeSegments:SG}=root;
let n=0;
function career(){G.fresh();const s=G.S;s.cash=99999;s.rep=60;G.sign('rex');s.inbox=[];s.offers=[];return s;}
const contract=(o={})=>({id:'sc-'+(n++),pid:'crown',rid:'silas',wid:'rex',slot:'main',minutes:15,finish:'win_clean',purse:300,feudHeat:20,eventAbs:G.abs(),...o});
const as=(o={})=>({...G.W('rex'),...o});
const opt=(st,id)=>SG.options(st).find(o=>o.id===id);
function begin(type,o={}){career();return SG.begin(type,contract({id:o.id||'fixed',feudHeat:o.feudHeat??20,finish:o.finish||'win_clean'}),o.w||G.W('rex'),G.F('silas'),G.P(o.pid||'crown'));}
function play(type,picks,o={}){const st=begin(type,o);for(const id of picks)assert.ok(SG.choose(st,id),type+' '+id);return {st,r:SG.result(st)};}

// 1. Tags are the effect: for every option at every step, in several fixtures, the applied change matches its tags.
{
 career();
 const fixtures=[{},{pid:'dock',feudHeat:60},{pid:'pulse',feudHeat:45,w:as({id:'mara',style:'Story',heat:30,ego:40})},
  {pid:'union',feudHeat:10,w:as({id:'lyra',style:'Technical',heat:65,ego:80})},{pid:'crown',feudHeat:50,finish:'lose_clean',w:as({id:'rev',style:'Spectacle',heat:55})}];
 const sides=(tags,name)=>{const t=tags.find(x=>x.startsWith(name+' '));if(!t)return [0];return t.slice(name.length+1).split(' or ').map(a=>a.includes('▼')?-1:1);};
 let checked=0;
 for(const type of ['solo','ambush','grilling'])for(const fx of fixtures){
  const R=SG.ENGINES[type].rounds;
  for(let step=0;step<R.length;step++)for(const o of R[step].options){
   const st=begin(type,{...fx,id:'tags-'+type});
   for(let i=0;i<step;i++)SG.choose(st,R[i].options[0].id);
   if(st.stage!=='live')continue;
   const shown=opt(st,o.id),b=JSON.parse(JSON.stringify(st));
   assert.doesNotMatch(shown.label+shown.hint+shown.tags.join(),/undefined|null|NaN|\{\w+\}/,type+' '+o.id);
   SG.choose(st,o.id);
   const d=k=>st[k]-b[k],sign=v=>Math.sign(v);
   for(const [k,name] of [['room','Crowd'],['heat','Feud heat'],['trust','Promoter'],['morale','Morale']]){
    if(k==='room'&&o.id==='town')continue;// cheap heat says the crowd turns
    if(k==='room'&&type==='ambush'&&step===0){assert.ok(shown.tags.includes('Crowd '+'▲'.repeat(st.flags.vis)),'visibility is the crowd');continue;}
    assert.ok(sides(shown.tags,name).includes(sign(d(k))),`${type} ${o.id} ${name}: ${d(k)} v ${shown.tags}`);
   }
   if(!st.flags.fought)assert.equal(d('hurt')>0,shown.tags.some(t=>t.startsWith('Opponent hurt')),type+' '+o.id+' hurt');
   if(shown.tags.some(t=>t.startsWith('Gamble: ')))assert.match(shown.tags[0]+shown.tags.join(),/Gamble: (likely|even chance|long shot)/);
   checked++;
  }
 }
 console.log('PASS tags match what '+checked+' solo, ambush and grilling choices actually do');
}

// 2. Solo promo: the fixture changes what each line does.
{
 const win=begin('solo',{finish:'win_clean'}),lose=begin('solo',{finish:'lose_clean'});
 for(const st of [win,lose]){SG.choose(st,'crowd');SG.choose(st,'story');}
 assert.ok(opt(win,'vow').tags.includes('Booked finish keeps it'));
 assert.ok(opt(lose,'vow').tags.includes('Risk: booked finish breaks it'),'a win promise against a booked loss is flagged');
 assert.ok(opt(lose,'clean').tags.includes('Booked finish keeps it'),'a clean loss keeps a clean promise');
 const cold=play('solo',['rival','history','walk'],{feudHeat:10}).r,hot=play('solo',['rival','history','walk'],{feudHeat:55}).r;
 assert.ok(hot.heatDelta>=cold.heatDelta+5,'history needs a history: '+hot.heatDelta+' v '+cold.heatDelta);
 assert.equal(hot.style,'challenge');
 const tech=play('solo',['mentor','stats','walk'],{w:as({style:'Technical'})}).r,brawl=play('solo',['mentor','stats','walk'],{w:as({style:'Brawl'})}).r;
 assert.ok(tech.quality>brawl.quality+5,'a technical wrestler sells the numbers: '+tech.quality+' v '+brawl.quality);
 const known=begin('solo',{w:as({heat:80})}),unknown=begin('solo',{w:as({heat:30})});
 for(const st of [known,unknown])SG.choose(st,'crowd');
 const odds=st=>opt(st,'chant').tags.find(t=>t.startsWith('Gamble'));
 assert.notEqual(odds(known),odds(unknown),'a chant depends on who knows the name: '+odds(known)+' / '+odds(unknown));
 const t0=(career(),G.P('crown').trust);
 const thank=play('solo',['thank','story','walk']);assert.equal(G.P('crown').trust,t0+2,'a traditional promoter likes being thanked');
 const top=play('solo',['top','story','walk']);assert.equal(G.P('crown').trust,t0-1,'and dislikes ambition, applied once');
 console.log('PASS solo lines read the booked finish, the rivalry, the wrestler and the promoter');
}

// 3. Ambush: style, promoter and place matter, and the risks are stated.
{
 const brawl=play('ambush',['car','quick','leave'],{w:as({style:'Brawl'})}).r,tech=play('ambush',['car','quick','leave'],{w:as({style:'Technical'})}).r;
 assert.equal(brawl.opponentHurt,tech.opponentHurt+2,'brawlers hit harder');
 const hold=play('ambush',['car','hold','leave'],{w:as({style:'Technical'})}).r;assert.ok(hold.opponentHurt>=11,'a technician knows where it hurts');
 const crown=begin('ambush'),dock=begin('ambush',{pid:'dock'});
 SG.choose(crown,'car');SG.choose(dock,'car');
 assert.ok(opt(crown,'chair').tags.includes('Promoter ▼▼'),'a traditional promoter hates the chair');
 assert.ok(!opt(dock,'chair').tags.some(t=>t.startsWith('Promoter')),'an aggressive one does not mind');
 const f0=(career(),G.W('rex').fatigue);play('ambush',['car','dive','leave'],{w:as({style:'Spectacle'})});
 assert.equal(G.W('rex').fatigue,f0+4,'a dive costs the wrestler');
 const locker=play('ambush',['locker','quick','leave'],{w:as({style:'Technical'})}).r,car=play('ambush',['car','quick','leave'],{w:as({style:'Technical'})}).r;
 assert.equal(locker.opponentHurt,car.opponentHurt+2,'a shut door means more damage');assert.equal(locker.trustDelta,-1);
 const after=begin('ambush');SG.choose(after,'catering');SG.choose(after,'ground');
 assert.ok(opt(after,'more').tags.some(t=>/may hit back \(likely\)/.test(t)),'going back for more after a long beating is likely to bring a reply');
 const stare=begin('ambush');SG.choose(stare,'car');SG.choose(stare,'stare');
 assert.ok(!opt(stare,'leave').tags.some(t=>/hit back/.test(t)),'a stare never starts a fight');
 console.log('PASS ambushes read the wrestler’s style, the promoter and the place, and state the fight-back risk');
}

// 4. Grilling: the answer is weighed against the question.
{
 const hurt=as({injury:{part:'knee',weeks:2},fatigue:50});
 const sore=begin('grilling',{w:hurt,id:'g-hurt'});const qi=sore.questions.indexOf('hurt');assert.ok(qi>=0);
 for(let i=0;i<qi;i++)SG.choose(sore,'straight');
 assert.ok(opt(sore,'straight').tags.some(t=>t.startsWith('Crowd ▲')),'honesty about an injury wins sympathy');
 assert.match(opt(sore,'joke').tags[0],/Gamble/);
 assert.ok(opt(sore,'turn').tags.some(t=>t==='Crowd ▼'),'dodging an injury question costs the room');
 const vow=play('grilling',['vow','straight','straight'],{finish:'lose_clean'}),r=vow.r;
 assert.equal(r.promise.type,'win');assert.match(r.hook,/promised a win/);
 const cr=play('grilling',['credit','straight','straight']).r;assert.equal(cr.style,'respect');assert.equal(cr.trustDelta,1,'a traditional promoter likes manners');
 const again=begin('grilling');SG.choose(again,'vow');assert.ok(opt(again,'vow').tags.includes('Already promised'));
 // A promise made in an interview is held to account after the match.
 const s=career();const k=contract({id:'g-vow',finish:'win_clean'});s.card.push(k);
 s.feuds['rex:silas']={wid:'rex',rid:'silas',heat:30,matches:1,closed:false,since:1};
 const st=SG.begin('grilling',k,G.W('rex'),G.F('silas'),G.P('crown'));for(const id of ['vow','straight','straight'])SG.choose(st,id);
 const promo=SG.result(st),M=MX.create({w:{...G.W('rex')},f:G.F('silas'),p:G.P('crown'),slot:'main',minutes:15,finish:'win_clean',feudHeat:30,promo,plan:{game:'story',leash:'script',talk:'none'},seed:9});
 for(let i=0;i<12000&&!M.done;i++){if(M.decision&&!M.queue.length)MX.resolve(M,M.decision.options[0].id);MX.next(M);}
 G.applyResult(k,{...M.final,log:[]});assert.equal(s.history[0].promo.promise.checked,true,'the interview promise is checked');
 console.log('PASS grilling answers depend on the question, and an interview promise is checked after the match');
}

// 5. The desk filters the solo hook (nine lines in four categories), and leaves short steps alone.
{
 const src=fs.readFileSync(path.join(__dirname,'..','assets/js/ui.js'),'utf8').replace(/\r\n/g,'\n');
 const grab=(name,end)=>{const a=src.indexOf('function '+name+'('),b=src.indexOf(end,a);assert.ok(a>=0&&b>a,name);return src.slice(a,b);};
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ui=vm.runInNewContext([grab('tagChips','\nfunction '),grab('pickCards','\nfunction '),grab('segmentChoices','\n\n')].join('\n')+'\n({segmentChoices,setView:v=>{night.segView=v}})',{esc,night:{}});
 const ids=h=>[...h.matchAll(/data-seg="([^"]+)"/g)].map(m=>m[1]);
 const st=begin('solo');
 assert.doesNotMatch(ui.segmentChoices(SG.view(st)),/seg-filters/,'seven openings need no filter');
 SG.choose(st,'crowd');const v=SG.view(st);
 assert.ok(v.options.length>=8);
 let html=ui.segmentChoices(v);
 assert.match(html,/seg-filters/);assert.equal(ids(html).length,v.options.length);
 for(const name of ['Crowd','Rivalry','Ego','Story'])assert.match(html,new RegExp('aria-pressed="false">'+name+' <span class="filter-count">'));
 ui.setView({cat:'rivalry',sort:'category'});html=ui.segmentChoices(v);
 assert.deepEqual(ids(html),['threat','history']);
 ui.setView({cat:'all',sort:'fit'});const order=ids(ui.segmentChoices(v)),score=Object.fromEntries(v.options.map(o=>[o.id,o.score]));
 for(let i=1;i<order.length;i++)assert.ok(score[order[i-1]]>=score[order[i]]);
 const amb=begin('ambush');assert.doesNotMatch(ui.segmentChoices(SG.view(amb)),/seg-filters/);
 console.log('PASS the solo hook gets the category filter; short steps stay plain cards');
}
