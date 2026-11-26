'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const {core}=require('./_source.cjs');
const root={addEventListener(){}},store=new Map();
const ctx=vm.createContext({window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
vm.runInContext(core,ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','assets','js','planning-fuzzy.js'),'utf8'),ctx);
const P=root.OfficePlanningFuzzy,M=P.behaviourModel;
const plain=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>assert.deepEqual(plain(a),plain(b));
eq(M.outputs,['cooperation','assertiveness','caution','ambition','protectiveness','flexibility','mentorship','improvisation']);
assert.equal(M.rules.length,79);
assert.ok(Object.isFrozen(M.rules)&&M.rules.every(Object.isFrozen));
eq(M.evaluate({}).scores,{cooperation:null,assertiveness:null,caution:null,ambition:null,protectiveness:null,flexibility:null,mentorship:null,improvisation:null});
const base={ego:50,professionalism:60,ringPsychology:50,ringAbility:65,consent:60,fatigue:45,safetyAbility:70,morale:55};
const score=(v={},c={})=>M.evaluate({...base,...v},c).scores;
assert.ok(score({consent:90}).cooperation>score({consent:20}).cooperation);
assert.ok(score({professionalism:90}).cooperation>score({professionalism:20}).cooperation);
assert.ok(score({ego:90}).assertiveness>score({ego:20}).assertiveness);
assert.ok(score({fatigue:90}).caution>score({fatigue:0}).caution);
assert.ok(score({},{'condition.injured':1}).caution>score().caution);
assert.ok(score({},{'history.ownInjury':1}).caution>score().caution);
eq(score({ego:90}).cooperation,score({ego:20}).cooperation);
eq(score({fatigue:90}).cooperation,score({fatigue:0}).cooperation);
eq(score({fatigue:90}).assertiveness,score({fatigue:0}).assertiveness);
const balanced=score({ego:90,professionalism:90,consent:90,ringPsychology:90,ringAbility:90,morale:90});
assert.ok(balanced.cooperation>70&&balanced.assertiveness>70,'assertive and cooperative can coexist');
eq(score({professionalTrust:0,proposalRisk:100,microphone:0}),score({professionalTrust:100,proposalRisk:0,microphone:100}));
const unknown=M.evaluate({}, {'consent.high':1});assert.equal(unknown.scores.cooperation,null);
let samples=0;
for(const [axis,out] of [['consent','cooperation'],['ego','assertiveness'],['fatigue','caution'],['ego','ambition'],['ego','protectiveness'],['ringPsychology','flexibility'],['professionalism','mentorship'],['ringPsychology','improvisation']]){
 let prev=-Infinity;
 for(let i=0;i<=100;i++){
  const res=score({[axis]:i})[out];
  assert.ok(Number.isFinite(res)&&res>=0&&res<=100);
  assert.ok(res>=prev-1e-10,'nonmonotonic '+axis+' at '+i);
  prev=res;samples++;
 }
}
// Do not use private or public rivalry as a substitute for actual condition.
const w={id:'a',style:'Story',...{ego:50,pro:60,psych:50,ring:65,safe:70,fatigue:0,morale:55,injury:0}};
const f={id:'b',style:'Technical',...w,id:'b'};
const room={cid:'now',w:{id:'a'},f:{id:'b'},stage:'plan',heat:100,contract:{eventAbs:20},consent:{w:70,f:70},mood:{w:0,f:0}};
const career={officeMemory:{rivals:{'a:b':0}},bonds:{pairs:{'a|b':{score:-100,betrayed:true}}}};
const initial=P.capture(room,w,f,career),first=P.behaviour(initial,room,'w');
eq(first.cues,{});
eq(first.scores,P.behaviour(P.capture({...room,heat:0},w,f,{}),{...room,heat:0},'w').scores);
const hurt=P.capture(room,{...w,injury:1},f,career);
const current=P.behaviour(hurt,room,'w');
assert.equal(current.cues['condition.injured'],1);
assert.ok(current.scores.caution>first.scores.caution);
assert.equal(current.scores.cooperation,first.scores.cooperation);
const past=P.capture(room,w,f,{officeMemory:{entries:{a:[{id:'old',against:'b',week:10,kind:'hurt'}]}}});
assert.equal(P.behaviour(past,room,'w').cues['history.ownInjury'],1);
assert.equal(P.behaviour(past,room,'f').cues['history.ownInjury'],undefined);
eq(current,P.behaviour(plain(hurt),plain(room),'w'));
assert.ok(current.fired.caution.some(r=>r.id==='caution_current_injury'));
assert.throws(()=>P.behaviour(initial,room,'x'));
// MP2B: keep old inference exactly unchanged by adding outputs.
const earlier=P.createModel({outputs:['cooperation','assertiveness','caution'],rules:M.rules.slice(0,33)});
for(let i=0;i<=100;i++){
 const values={...base,ego:i,professionalism:100-i,ringPsychology:i,consent:i,fatigue:100-i};
 const cues={'condition.injured':1,'goal.advancement':1,'booking.actorLoses':1};
 const old=earlier.evaluate(values,cues),next=M.evaluate(values,cues);
 for(const out of earlier.outputs){assert.equal(old.scores[out],next.scores[out]);eq(old.fired[out],next.fired[out]);}
}
assert.ok(score({ego:90}).ambition>score({ego:20}).ambition);
assert.ok(score({professionalism:90}).flexibility>score({professionalism:20}).flexibility);
assert.ok(score({ego:90,professionalism:90,ringPsychology:90,ringAbility:90}).flexibility>70);
assert.equal(score({ego:90}).flexibility,score({ego:20}).flexibility);
assert.equal(score({fatigue:90}).protectiveness,score({fatigue:0}).protectiveness);
assert.equal(score({},{'goal.advancement':1}).cooperation,score().cooperation);
assert.ok(score({},{'goal.advancement':1}).ambition>score().ambition);
assert.ok(score({},{'goal.respect':1}).ambition>score().ambition);
assert.ok(score({},{'booking.actorLoses':1}).protectiveness>score().protectiveness);
assert.ok(score({},{'history.ownHumiliation':1}).protectiveness>score().protectiveness);
// Career goal evidence is copied rather than generated or treated as a stat.
const goalCareer={ambitions:{w:{a:{kind:'title',since:12,sat:0},b:{kind:'body',since:12,sat:70}}}};
const beforeGoal=JSON.stringify(goalCareer);
const goalSnap=P.capture(room,w,f,goalCareer);
eq(goalSnap.participants.w.careerGoal,{kind:'title',since:12,satisfaction:0});
assert.equal(P.behaviour(goalSnap,room,'w').cues['goal.advancement'],1);
assert.equal(P.behaviour(goalSnap,room,'f').cues['goal.advancement'],undefined);
assert.equal(JSON.stringify(goalCareer),beforeGoal);
goalCareer.ambitions.w.a.kind='money';
assert.equal(goalSnap.participants.w.careerGoal.kind,'title');
assert.equal(P.capture(room,w,f,{ambitions:{w:{a:{kind:'title',since:25}}}}).participants.w.careerGoal,null);
assert.equal(initial.participants.w.careerGoal,null);
const winRoom={...room,finish:'win_clean'},loseRoom={...room,finish:'lose_protected'};
assert.equal(P.behaviour(initial,winRoom,'f').cues['booking.actorLoses'],1);
assert.equal(P.behaviour(initial,winRoom,'w').cues['booking.actorLoses'],undefined);
assert.equal(P.behaviour(initial,loseRoom,'w').cues['booking.actorLoses'],1);
assert.equal(P.behaviour(initial,loseRoom,'f').cues['booking.actorLoses'],undefined);
assert.equal(P.behaviour(initial,{...room,finish:'nc'},'w').cues['booking.actorLoses'],undefined);
const hum=P.capture(room,w,f,{officeMemory:{entries:{a:[{id:'old',against:'b',week:10,kind:'humiliation'}]}}});
assert.equal(P.behaviour(hum,room,'w').cues['history.ownHumiliation'],1);
assert.equal(P.behaviour(hum,room,'f').cues['history.ownHumiliation'],undefined);
assert.ok(P.behaviour(hum,room,'w').scores.protectiveness>first.scores.protectiveness);
assert.equal(P.behaviour(hum,room,'w').scores.caution,first.scores.caution);
eq(P.behaviour(goalSnap,winRoom,'w'),P.behaviour(plain(goalSnap),plain(winRoom),'w'));
// MP2C: preserve the six previous outputs and traces exactly.
const six=P.createModel({outputs:M.outputs.slice(0,6),rules:M.rules.slice(0,58)});
for(let i=0;i<=100;i++){
 const values={...base,ego:i,professionalism:100-i,ringPsychology:i,consent:i,fatigue:100-i};
 const cues={'condition.injured':1,'goal.advancement':1,'booking.actorLoses':1,'goal.mentor':1,'pair.veteranDeveloping':1,'history.requestedAdaptation':1};
 const old=six.evaluate(values,cues),next=M.evaluate(values,cues);
 for(const out of six.outputs){assert.equal(old.scores[out],next.scores[out]);eq(old.fired[out],next.fired[out]);}
}
assert.ok(score({ringPsychology:90}).improvisation>score({ringPsychology:20}).improvisation);
assert.ok(score({fatigue:0}).improvisation>score({fatigue:90}).improvisation);
assert.equal(score({ego:100}).mentorship,score({ego:0}).mentorship);
assert.equal(score({ego:100}).improvisation,score({ego:0}).improvisation);
assert.ok(score({},{'goal.mentor':1}).mentorship>score().mentorship);
assert.ok(score({},{'history.requestedAdaptation':1}).improvisation>score().improvisation);
assert.equal(score({},{'goal.mentor':1}).ambition,score().ambition);
assert.equal(score({professionalism:20},{'pair.veteranDeveloping':1}).mentorship,score({professionalism:20}).mentorship);
assert.ok(score({professionalism:90},{'pair.veteranDeveloping':1}).mentorship>score({professionalism:90}).mentorship);
const vet={...w,tier:'Veteran',pro:90},rook={...f,tier:'Rookie'};
const mentorCareer={ambitions:{w:{a:{kind:'mentor',since:10,sat:70}}}};
const paired=P.capture(room,vet,rook,mentorCareer);
assert.equal(paired.participants.w.tier,'Veteran');assert.equal(paired.participants.f.tier,'Rookie');
const mentor=P.behaviour(paired,room,'w'),learner=P.behaviour(paired,room,'f');
assert.equal(mentor.cues['goal.mentor'],1);assert.equal(mentor.cues['pair.veteranDeveloping'],1);
assert.equal(learner.cues['goal.mentor'],undefined);assert.equal(learner.cues['pair.veteranDeveloping'],undefined);
assert.ok(mentor.scores.mentorship>P.behaviour(P.capture(room,vet,rook),room,'w').scores.mentorship);
assert.equal(P.behaviour(P.capture(room,{...vet,tier:'Star'},rook),room,'w').cues['pair.veteranDeveloping'],undefined);
assert.equal(P.behaviour(P.capture(room,vet,{...rook,tier:'Veteran'}),room,'w').cues['pair.veteranDeveloping'],undefined);
const ledgers={rivalries:{'b:a':{w:'b',f:'a',meetings:[{cid:'previous',abs:10},{cid:'future',abs:30}],talks:[{cid:'previous',by:'f',delivered:'adapted'},{cid:'future',by:'w',delivered:'adapted'}]}}};
const adapted=P.capture(room,w,f,ledgers);
assert.equal(P.behaviour(adapted,room,'w').cues['history.requestedAdaptation'],1);
assert.equal(P.behaviour(adapted,room,'f').cues['history.requestedAdaptation'],undefined);
assert.ok(P.behaviour(adapted,room,'w').scores.improvisation>first.scores.improvisation);
assert.equal(P.behaviour(adapted,room,'w').scores.caution,first.scores.caution);
const missed=plain(ledgers);missed.rivalries['b:a'].talks[0].delivered='missed';
assert.equal(P.behaviour(P.capture(room,w,f,missed),room,'w').cues['history.requestedAdaptation'],undefined);
const legacy=plain(paired);delete legacy.participants.w.tier;delete legacy.participants.f.tier;
assert.equal(P.behaviour(legacy,room,'w').cues['pair.veteranDeveloping'],undefined);
eq(mentor,P.behaviour(plain(paired),plain(room),'w'));
console.log('PASS MP2A/B/C: '+M.rules.length+' rules, '+samples+' monotonic samples, 202 previous-output parity cases, mentorship pairing, prior adaptation and replay parity.');

// MP3C: exact pre-calibration model, test-only reconstruction from the
// frozen MP2C rule values. No second live policy or alternative kernel.
const priorFamilies={protectiveness_ego:2,protectiveness_ringPsychology:1,
 mentorship_professionalism:2,mentorship_ringPsychology:2,mentorship_safetyAbility:1,
 improvisation_fatigue:1};
const priorSpecial={protectiveness_booked_loss:[80,1],protectiveness_prior_humiliation:[90,2],
 mentorship_career_goal:[95,3],mentorship_veteran_developing_partner:[85,1.5],
 improvisation_prior_adaptation:[85,1]};
const oldModel=P.createModel({outputs:M.outputs,rules:M.rules.map(r=>{
 const special=priorSpecial[r.id];
 if(special)return {...r,value:special[0],weight:special[1]};
 const family=r.id.replace(/_(low|medium|high)$/,'');
 return Object.hasOwn(priorFamilies,family)?{...r,weight:priorFamilies[family]}:r;
})});
const unchanged=['cooperation','assertiveness','caution','ambition','flexibility'];
const allCues={'booking.actorLoses':1,'history.ownHumiliation':1,'goal.mentor':1,
 'pair.veteranDeveloping':1,'history.requestedAdaptation':1,'condition.injured':1};
for(let i=0;i<=100;i++){
 const v={...base,ego:i,professionalism:i,ringPsychology:100-i,ringAbility:i,safetyAbility:100-i,fatigue:i};
 for(const cues of [{},allCues]){
  const old=oldModel.evaluate(v,cues),next=M.evaluate(v,cues);
  for(const out of unchanged){assert.equal(old.scores[out],next.scores[out]);eq(old.fired[out],next.fired[out]);}
 }
 const fresh={...v,fatigue:0},tired={...v,fatigue:90};
 const delta=M.evaluate(fresh).scores.improvisation-M.evaluate(tired).scores.improvisation;
 assert.ok(delta>=15,'fatigue response too weak');
 assert.ok(delta>oldModel.evaluate(fresh).scores.improvisation-oldModel.evaluate(tired).scores.improvisation);
 const ordinary=M.evaluate(v).scores;
 for(const [cue,out] of [['booking.actorLoses','protectiveness'],['history.ownHumiliation','protectiveness'],['goal.mentor','mentorship'],['history.requestedAdaptation','improvisation']]){
  const s=M.evaluate(v,{[cue]:1}).scores;
  assert.ok(s[out]>ordinary[out],cue+' should never lower its intended tendency');
  for(const o of M.outputs.filter(o=>o!==out))assert.equal(s[o],ordinary[o],cue+' changed unrelated output '+o);
 }
}
const expert={...base,ego:100,professionalism:100,ringPsychology:100,ringAbility:100,safetyAbility:100,fatigue:0};
assert.ok(M.evaluate(expert,{'history.requestedAdaptation':1}).scores.improvisation>M.evaluate(expert).scores.improvisation);
assert.ok(M.evaluate(expert,{'booking.actorLoses':1}).scores.protectiveness>M.evaluate(expert).scores.protectiveness);
const sensitive={...base,ego:20,professionalism:90,ringPsychology:50,safetyAbility:85};
const boost=(model,cue,out)=>model.evaluate(sensitive,{[cue]:1}).scores[out]-model.evaluate(sensitive).scores[out];
assert.ok(boost(M,'booking.actorLoses','protectiveness')>boost(oldModel,'booking.actorLoses','protectiveness'));
assert.ok(boost(M,'goal.mentor','mentorship')>boost(oldModel,'goal.mentor','mentorship'));
assert.ok(boost(M,'pair.veteranDeveloping','mentorship')>boost(oldModel,'pair.veteranDeveloping','mentorship'));
console.log('PASS MP3C: 202 exact unchanged-output comparisons; 101 fatigue and contextual direction fixtures; expert ceiling regression.');
