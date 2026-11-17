/* THE OFFICE v0.3.12 — rivalries that remember.
   Every meeting between two wrestlers leaves facts behind: who won and how, who cheated, who tapped,
   who reversed whom, who was spent at the bell, who got hurt, which public promises were kept. This
   ledger keeps those facts for each pairing, ranks them by how much they still matter, and turns the
   most consequential one into a structured argument for the next promo: a proposition, the evidence
   for it, the other wrestler's counterclaim, a set of answers that each lead somewhere different, and
   a resolution that is remembered. Nothing is asserted that the save cannot support. Everything is a
   pure function of the save and a seed. */
(function installRivalry(root){'use strict';
 const D=root.OfficeData,G=root.OfficeGame,MX=root.OfficeMatch,A=MX.GRAPH.A;
 const hash=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
 const rng=(seed,k)=>hash(seed+'|'+k)/4294967296;
 const voice=w=>root.OfficeRoom?.VOICE?.[w?.id]||'stoic';
 const cap=t=>t?t.charAt(0).toUpperCase()+t.slice(1):t;
 const LIMIT={meetings:10,claims:12,talks:8};

 // ---------------------------------------------------------------------------------------------
 // How each finish route reads as a public fact. The contract says who wins; the route says how.
 const ROUTE={
  finisher:{how:'clean'},reversal_finisher:{how:'clean',stolen:true},top_rope:{how:'clean'},limb_finish:{how:'clean',worked:true},
  strike_knockout:{how:'clean'},outlasted:{how:'clean',outlasted:true},
  tights:{how:'dirty',cheat:'a handful of tights'},feet_on_ropes:{how:'dirty',cheat:'both feet on the ropes'},
  eye_poke:{how:'dirty',cheat:'a thumb in the eye'},referee_bump:{how:'dirty',cheat:'the ropes while the referee was down'},
  rope_rollup:{how:'protected',cheat:'a handful of tights',argued:true},slow_count:{how:'protected',slow:true,argued:true},
  exhausted_cover:{how:'protected',exhausted:true},injury_gives:{how:'protected',worked:true},
  duck_finisher:{how:'clean'},finisher_reversed:{how:'clean',reversedFinisher:true},submission_defeat:{how:'clean',submission:true,worked:true}
 };
 const FAMILY_WORD={submission:'holds',strike:'strikes',aerial:'flying attacks',power:'power moves',suplex:'suplexes',dive:'dives',running:'running attacks',
  corner:'corner attacks',ground:'mat work',chain:'chain wrestling',neck:'neck attacks',pin:'pinning combinations',springboard:'springboard attacks',
  superplex:'superplexes',outside:'brawling outside',heel:'cheap tricks',fire:'fightbacks',lucha:'lucha moves',rope:'rope work',rest:'rest holds'};
 const isSub=x=>!!(x?.sub||D.PROFILES?.[x?.id]?.sub);

 // ---------------------------------------------------------------------------------------------
 // The ledger: one per pairing, keyed exactly as the feud is (stable wrestler first).
 const keyOf=(wid,rid)=>wid+':'+rid;
 function store(){const s=G.S;if(!s)return null;if(!s.rivalries||typeof s.rivalries!=='object')s.rivalries={};return s.rivalries;}
 function ledger(wid,rid,skip=null){
  const all=store();if(!all)return null;
  const k=keyOf(wid,rid);
  let L=all[k];
  if(!L){L=all[k]={v:1,w:wid,f:rid,meetings:[],claims:[],talks:[],done:{}};backfill(L,skip);}
  L.meetings??=[];L.claims??=[];L.talks??=[];L.done??={};
  return L;
 }
 // An older career already has matches between these two. Their results are facts too, but older
 // saves never recorded how a match ended, so only what the contract and result say is used.
 function backfill(L,skip){
  const rows=(G.S.history||[]).filter(h=>h.wid===L.w&&h.rid===L.f&&h.cid!==skip).slice().reverse();
  for(const h of rows){
   const cid=h.cid||('legacy:'+h.season+':'+h.week);if(L.done[cid])continue;L.done[cid]=1;
   const winner=h.outcome==='nc'?null:h.outcome==='double'?'w':String(h.finish||'').startsWith('win')?'w':'f';
   const promise=h.promo?.promise?.checked?{type:h.promo.promise.type,kept:!!h.promo.promise.kept,say:sayPromise(h.promo.promise.type,h.promo.tactic,null,G.F(L.f),G.W(L.w))}:null;
   L.meetings.push({cid,n:L.meetings.length+1,abs:(h.season-1)*52+(h.week||0),finish:h.finish||null,outcome:h.outcome||'booked',winner,
    how:h.finish==='win_dirty'?'dirty':h.finish==='lose_protected'?'protected':'clean',cheat:h.finish==='win_dirty'?'w':null,cheatDetail:null,route:null,
    minutes:null,stars:h.stars||0,counters:{w:0,f:0},late:{w:0,f:0},families:{w:[],f:[]},stamina:null,injured:{w:null,f:false},promise,commit:null,legacy:true});
  }
  L.meetings=L.meetings.slice(-LIMIT.meetings);
 }

 // A promise is stored with speaker-neutral tokens ({opp} for the opponent, {opps} for "the opponent's")
 // and voiced by whoever repeats it: "your holds" from the speaker, "my holds" from the opponent.
 function sayPromise(type,tactic,commit,f,w){
  if(commit?.say)return commit.say;
  if(type==='win')return 'beat {opp}';
  if(type==='clean')return 'have a straight fight with {opp}';
  if(type==='nocheat')return 'win without cheating';
  if(type==='finisher')return 'finish it with the '+(w?.finisher||'finisher');
  if(type==='counter'){
   if(tactic?.label&&!/’s attack/.test(tactic.label))return tactic.label.replace(/^reversing/,'reverse').replace(/^countering/,'counter').replace(/^turning/,'turn');
   const fam=(tactic?.families||[])[0];return fam&&FAMILY_WORD[fam]?'counter {opps} '+FAMILY_WORD[fam]:'counter {opp}';
  }
  return null;
 }
 function voiced(t,who,f){
  if(typeof t!=='string')return t;
  const name=f?.short||'them';
  return t.replace(/\{opps\}/g,who==='w'?'your':who==='f'?'my':name+'’s').replace(/\{opp\}/g,who==='w'?'you':who==='f'?'me':name);
 }

 // ---------------------------------------------------------------------------------------------
 // One meeting, as facts. Built from the contract, the match result and the structured evidence the
 // engine records. Nothing here reads commentary text.
 function meetingFrom(c,fin,w,f,n){
  const route=fin.finishRoute||null,R=ROUTE[route]||{},ev=fin.evidence||null;
  const winner=fin.outcome==='nc'?null:fin.outcome==='double'?'w':String(c.finish).startsWith('win')?'w':'f';
  const booked=fin.outcome!=='nc'&&fin.outcome!=='double';
  const cheat=booked&&R.cheat?winner:null;
  const submission=booked&&winner&&(R.submission||(['finisher','duck_finisher','finisher_reversed','limb_finish'].includes(route)&&isSub(winner==='w'?w:f)))?winner:null;
  const tired=ev?.stamina?{w:ev.stamina.w<30,f:ev.stamina.f<30}:{w:false,f:false};
  return {cid:c.id,n,abs:c.eventAbs??G.abs(),finish:c.finish,outcome:fin.outcome||'booked',winner,how:fin.outcome==='double'?'upset':R.how||(String(c.finish).includes('dirty')?'dirty':'clean'),
   route,cheat,cheatDetail:booked&&R.cheat?R.cheat:null,cheapShots:ev?{...ev.dirty}:{w:false,f:false},argued:!!R.argued,slow:booked&&!!R.slow,exhausted:booked&&!!R.exhausted,
   submission,reversedFinisher:booked&&R.reversedFinisher?winner:null,stolen:booked&&R.stolen?winner:null,worked:booked&&!!R.worked?winner:null,
   outlasted:booked&&(R.outlasted||R.exhausted)?winner:null,minutes:fin.minutes||null,stars:fin.stars||0,
   counters:ev?{...ev.counters}:{w:0,f:0},late:ev?{...ev.late}:{w:0,f:0},families:ev?{w:ev.families.w.slice(),f:ev.families.f.slice()}:{w:[],f:[]},
   stamina:ev?{...ev.stamina}:null,tired,injured:{w:fin.injury?(fin.injuryPart||ev?.injured?.w||'shoulder'):null,f:!!fin.foeHurt},
   damage:ev?{...ev.damage}:null,promise:null,commit:null,legacy:false};
 }

 // ---------------------------------------------------------------------------------------------
 // THE EVIDENCE PROFILE. The facts that still matter, strongest first. Each fact says whose argument
 // it helps (owner), how much it weighs now, and how it can be said out loud.
 const BASE={cheat_f:8,cheat_w:7,tapped:7,finisher_reversed:6,stolen:5,slow_count:6,outlasted_w:5,fade_f:5,injury_w:9,injury_f:7,
  clean_win_w:3,clean_win_f:3,promise_kept:7,promise_broken:8,counters_w:4,record_w:5,record_f:6,great_match:5,betrayal:11,bond_friend:4};
 const MAJOR={injury_w:1,betrayal:1,cheat_f:1,cheat_w:1,promise_broken:1};
 function whenWord(ago,n){return ago===0?'last time':ago===1?'the time before':n===1?'the first time we met':'a few matches back';}
 function facts(L,w,f){
  const out=[],ms=L.meetings,N=ms.length;
  const add=(kind,m,owner,d={})=>{
   const ago=N-m.n,rate=MAJOR[kind]?.08:.28,weight=Math.round(BASE[kind]*Math.max(.3,1-rate*ago)*10)/10;
   out.push({id:m.cid+':'+kind,kind,owner,cid:m.cid,n:m.n,ago,weight,major:!!MAJOR[kind],d:{when:whenWord(ago,m.n),minutes:m.minutes,...d}});
  };
  for(const m of ms.slice(-6)){
   if(m.cheat==='f')add('cheat_f',m,'w',{detail:m.cheatDetail,argued:m.argued});
   if(m.cheat==='w')add('cheat_w',m,'f',{detail:m.cheatDetail});
   if(m.submission==='f')add('tapped',m,'f',{part:m.injured?.w||null,worked:m.worked==='f'||(m.damage?.w||0)>=3});
   if(m.reversedFinisher==='f')add('finisher_reversed',m,'f');
   if(m.stolen==='w')add('stolen',m,'w');
   if(m.slow&&m.winner==='f')add('slow_count',m,'w');
   if(m.outlasted==='f'||(m.stamina&&m.stamina.w<25&&m.stamina.f-m.stamina.w>=15))add('outlasted_w',m,'f',{fTired:!!m.stamina&&m.stamina.f<45});
   if(m.stamina&&m.stamina.f<30&&m.stamina.w-m.stamina.f>=15)add('fade_f',m,'w',{fWon:m.winner==='f'});
   if(m.injured?.w)add('injury_w',m,'w',{part:m.injured.w,worked:m.worked==='f'||(m.damage?.w||0)>=3});
   if(m.injured?.f)add('injury_f',m,'f');
   if(m.winner==='w'&&m.how==='clean'&&!m.cheat)add('clean_win_w',m,'w');
   if(m.winner==='f'&&m.how==='clean'&&!m.cheat&&!m.submission)add('clean_win_f',m,'f',{close:m.stars>=3});
   if(m.counters&&m.counters.w>=3&&m.counters.w>=m.counters.f+2)add('counters_w',m,'w',{count:m.counters.w,fWon:m.winner==='f',families:m.families?.w||[]});
   if(m.stars>=3.5)add('great_match',m,'both',{stars:m.stars});
   for(const p of [m.promise,m.commit])if(p&&p.verdict!==undefined?p.verdict!==null:p&&p.kept!==undefined){
    const kept=p.verdict!==undefined?p.verdict==='kept':p.kept;
    add(kept?'promise_kept':'promise_broken',m,kept?'w':'f',{say:p.say,type:p.type||p.kind,families:p.families||null,label:p.label||null,fWon:m.winner==='f',early:m.counters?.w>0&&!(m.late?.w>0),count:m.counters?.w||0,sure:!!p.sure});
   }
  }
  // Across meetings: the head-to-head, once there is enough of it to argue about.
  const rec=record(L);
  if(N>=3&&rec.w-rec.f>=2)out.push({id:'record:w:'+N,kind:'record_w',owner:'w',cid:ms.at(-1).cid,n:N,ago:0,weight:BASE.record_w+(rec.w-rec.f-2),d:{...rec,when:'so far'}});
  if(N>=2&&(rec.f-rec.w>=2||streak(L).side==='f'&&streak(L).n>=2))out.push({id:'record:f:'+N,kind:'record_f',owner:'f',cid:ms.at(-1).cid,n:N,ago:0,weight:BASE.record_f+Math.max(0,rec.f-rec.w-2),d:{...rec,streak:streak(L),when:'so far'}});
  // What the locker room knows: a friendship or a betrayal between these two.
  const B=root.OfficeBonds,pair=B?.get?.(L.w,L.f);
  if(pair?.betrayed)out.push({id:'bond:betrayal',kind:'betrayal',owner:'w',cid:null,n:N,ago:0,weight:BASE.betrayal,major:true,d:{text:(pair.history||[]).find(x=>x.kind==='betrayal')?.text||''}});
  else if(pair&&pair.score>=35)out.push({id:'bond:friend',kind:'bond_friend',owner:'both',cid:null,n:N,ago:0,weight:BASE.bond_friend+(pair.score>=70?2:0),d:{score:pair.score}});
  return out.sort((a,b)=>b.weight-a.weight||b.n-a.n||a.id.localeCompare(b.id));
 }
 function record(L){const r={w:0,f:0,meetings:L.meetings.length};for(const m of L.meetings){if(m.winner==='w')r.w++;else if(m.winner==='f')r.f++;}return r;}
 function streak(L){let side=null,n=0;for(let i=L.meetings.length-1;i>=0;i--){const x=L.meetings[i].winner;if(!x)break;if(side===null)side=x;if(x!==side)break;n++;}return {side,n};}

 // How each wrestler stands towards the other now. Computed from what is already saved (the bond,
 // the wrestler's regard, the ledger) so that no second relationship score has to be kept in step.
 function stance(L,w,f){
  const B=root.OfficeBonds,bond=B?.score?.(L.w,L.f)||0,regard=root.OfficeMemory?.rival?.(L.w,L.f)??50;
  const s={w:bond*.45+(regard-50)*.4,f:bond*.45};
  for(const m of L.meetings.slice(-5)){
   if(m.cheat==='f')s.w-=10;if(m.cheat==='w')s.f-=10;
   if(m.injured?.w)s.w-=6;if(m.injured?.f)s.f-=6;
   if(m.stars>=3.5){s.w+=7;s.f+=7;}
   if(m.winner==='w'&&m.how==='clean')s.f+=((f.ego||50)>=75?-3:3);
   if(m.winner==='f'&&m.how==='clean')s.w+=((w.ego||50)>=75?-3:3);
  }
  for(const c of L.claims.slice(-5)){
   if(c.resolution==='conceded'&&c.raisedBy)s.f+=8;   // the stable wrestler gave ground in public
   if(c.fConceded)s.w+=8;
   if(c.response==='personal')s.f-=5;
  }
  if(L.claims.length&&L.claims.at(-1).commit?.verdict==='broken')s.f-=4;
  const word=x=>x>=35?'cooperative':x>=14?'respectful':x>-14?'competitive':x>-35?'resentful':'hostile';
  return {w:word(s.w),f:word(s.f),score:{w:Math.round(s.w),f:Math.round(s.f)}};
 }

 function profile(wid,rid,skip=null){
  const L=G.S?ledger(wid,rid,skip):null,w=G.W?.(wid)||G.F?.(wid),f=G.F?.(rid);
  if(!L||!w||!f)return {meetings:0,record:{w:0,f:0,meetings:0},stance:{w:'competitive',f:'competitive'},facts:[],open:[],claims:[],talks:[],last:null};
  const F=facts(L,w,f).map(x=>({...x,text:factText(x,w,f)}));
  const open=openIssues(L).map(c=>({issue:c.issue,cid:c.cid,text:c.reminder||c.evidence||''}));
  return {meetings:L.meetings.length,record:record(L),streak:streak(L),stance:stance(L,w,f),facts:F,open,
   claims:L.claims.slice(-4).map(c=>({...c})),talks:L.talks.slice(-3).map(t=>({...t})),last:L.meetings.at(-1)||null};
 }
 // How many meetings ago a contract was (0 = the last one). Robust to the ledger being trimmed.
 function agoOf(L,cid){const i=L.meetings.findIndex(m=>m.cid===cid);return i<0?99:L.meetings.length-1-i;}
 function openIssues(L){
  const seen=new Set(),out=[];
  for(let i=L.claims.length-1;i>=0;i--){const c=L.claims[i];if(seen.has(c.issue))continue;seen.add(c.issue);
   if(c.case&&(c.resolution==='unresolved'||(c.exposed&&c.resolution!=='reframed'&&c.resolution!=='conceded'))&&agoOf(L,c.cid)<=1)out.push(c);}
  return out;
 }
 // A fact, said out loud. Used by the interviewer and as the "on the record" line.
 function factText(x,w,f){
  const W=w.short,F=f.short,d=x.d||{},when=d.when||'last time',When=cap(when);
  switch(x.kind){
   case 'cheat_f':return When+', '+F+' beat '+W+' with '+d.detail+'.';
   case 'cheat_w':return When+', '+W+' beat '+F+' with '+d.detail+'.';
   case 'tapped':return When+', '+W+' tapped to '+F+'’s '+(f.finisher||'submission')+'.';
   case 'finisher_reversed':return When+', '+F+' reversed '+W+'’s '+(w.finisher||'finisher')+' to win.';
   case 'stolen':return When+', '+W+' slipped out of '+F+'’s '+(f.finisher||'finisher')+' and won.';
   case 'slow_count':return When+', '+W+' had '+F+' beaten until a slow count, then lost.';
   case 'outlasted_w':return When+', '+W+' ran out of gas before '+F+' did.';
   case 'fade_f':return When+', '+F+' was out on their feet by the end.';
   case 'injury_w':return When+', '+W+' came out of the match with an injured '+d.part+'.';
   case 'injury_f':return When+', '+F+' was hurt in the ring with '+W+'.';
   case 'clean_win_w':return When+', '+W+' beat '+F+' clean.';
   case 'clean_win_f':return When+', '+F+' beat '+W+' clean.';
   case 'promise_kept':return When+', '+W+' promised to '+voiced(d.say,'x',f)+', and did.';
   case 'promise_broken':return When+', '+W+' promised to '+voiced(d.say,'x',f)+'. It did not happen.';
   case 'counters_w':return When+', '+W+' reversed '+F+' '+d.count+' times.';
   case 'record_w':case 'record_f':return 'The head-to-head stands at '+W+' '+d.w+', '+F+' '+d.f+'.';
   case 'great_match':return When+', the two of them had a match people are still talking about.';
   case 'betrayal':return F+' turned on '+W+'.';
   case 'bond_friend':return W+' and '+F+' get on, and everyone backstage knows it.';
  }
  return '';
 }

 // ---------------------------------------------------------------------------------------------
 // THE ARGUMENT LIBRARY. Each issue is one subject two wrestlers can disagree about, available only
 // when its fact is on the record. It names who it helps, the opening it rides on, what the speaker
 // proposes, what the other wrestler says back in each of four registers, and five ways to answer:
 //   calm      concede the fair part         turn      defend it with the evidence
 //   challenge turn it into a public test    personal  escalate
 //   callback  change the subject
 // Each answer has its own resolution, credibility and consequence, and some make a commitment that
 // the next stage of the promo can make official and the match can test.
 // Delivery (how it is said) is shaped by the speaker's voice: precise and stoic talkers cite the
 // detail, gruff ones cut it short, earnest ones soften it, grand ones elevate it.
 // ---------------------------------------------------------------------------------------------
 const res=(label,hint,line,resolution,rel,fx,reply,extra={})=>({label,hint,line,res:resolution,rel,fx:fx||{},reply,...extra});
 const ISSUES={
  cheat_f:{family:'past_results',owner:'w',angle:'accusation',intent:'a clean result',target:'how {F} won',
   label:'Call out how they won',thesis:'Was {F}’s win {WHEN} a real win?',
   prop:{core:'You only beat me {WHEN} because you grabbed {DETAIL}, {F}.',detail:'{MIN} minutes of wrestling, and it ended with {DETAIL}. I have watched it back.',edge:'{CDETAIL}. That is how you beat me, {F}.',soft:'I am not making excuses, {F}. But you beat me {WHEN} with {DETAIL}, and everybody saw it.'},
   f:{evidence:'You had {MIN} minutes to beat me before that happened, {W}. You did not.',dismiss:'The referee counted three. That is the only part anybody writes down.',
    concede:'It was not pretty. I am not proud of it. It still counts.',deflect:'And who were you arguing with when it happened, {W}? The referee.'},
   again:'I asked you last time and you still have not answered, {F}: what happens when you cannot reach for {DETAIL}?',
   r:{
    calm:res('Own your missed chances, not their finish','Concede the fair point and keep the real one. Credible.','Fair enough: I had {MIN} minutes and I did not finish you. That is on me. {CDETAIL} is on you.','reframed',5,{cred:3,trust:1},
     {evidence:'Fair. I will take that.',dismiss:'Keep telling yourself it was the tights.',concede:'Then we agree on something.',deflect:'Funny how it is always somebody else’s fault.'}),
    turn:res('Argue they cannot win fairly','Press the charge. Strong, unless your own record says otherwise.','That is the point, {F}. When it is fair, you cannot finish me. So you cheated.','defended',3,{heat:2,cred:1},
     {evidence:'We will see who can win fairly.',dismiss:'Fair, unfair. Three is three.',concede:'Maybe. Tonight I will not need to.',deflect:'You say that like you have never cheated.'},{expose:'cheat_w'}),
    challenge:res('Demand a straight fight','Turn the grievance into a public test tonight.','So tonight there is nothing to grab. No tights, no ropes, no excuses. If you beat me clean, I will say so.','reframed',4,{cred:2,heat:1},
     {evidence:'Clean. Fine. You will not like that either.',dismiss:'I will beat you any way you like.',concede:'Agreed. No shortcuts. From either of us.',deflect:'Clean? You first.'},
     {commit:{kind:'clean',node:'clean',say:'have a straight fight with {opp}',label:'Hold {F} to the straight fight',hint:'Follows from what you just demanded. Kept only if nobody cheats and it ends clean.'}}),
    personal:res('Call them a cheat','Make it about character. Heat, not argument.','You are a cheat, {F}. You were one before you met me and you will be one after.','unresolved',0,{heat:4,trust:-2},
     {evidence:'One finish and suddenly I am a cheat? You need a better argument.',dismiss:'Say it again when there is no referee to hide behind.',concede:'Call me what you like. It still counts.',deflect:'Says the one who loses to cheats.'}),
    callback:res('Let the finish go','Drop the charge. It will still be there next time.','Forget the finish. I am more interested in tonight.','withdrawn',-1,{},
     {evidence:'Funny. You were very interested a second ago.',dismiss:'Of course you are.',concede:'Good. So am I.',deflect:'That did not take long.'})
   }},
  cheat_w:{family:'credibility',owner:'f',angle:'swagger',intent:'credibility after a dirty win',target:'how {W} won',
   label:'Own how you won before they bring it up',thesis:'Does {W}’s win {WHEN} count?',
   prop:{core:'Yes, I beat you {WHEN} with {DETAIL}, {F}. Everybody saw it.',detail:'I am not going to pretend it was anything else.',edge:'{CDETAIL}. Still a win.',soft:'I am not proud of how I won {WHEN}, {F}. I would rather say it before you do.'},
   f:{evidence:'You needed {DETAIL} to beat me, {W}. That is not a win. That is a confession.',dismiss:'Without {DETAIL} you would still be looking at the lights.',
    concede:'You won. I know how. So do you.',deflect:'Everybody saw it except the referee. Funny, that.'},
   again:'We have been over the {DETAIL}, {F}. I said what I said, and I meant it.',
   r:{
    calm:res('Admit it, and say you will not need it','Concede the charge and stake your hands on it tonight.','I did. And tonight I will not need it. Watch my hands, all of you.','conceded',5,{cred:4,trust:2,heat:-1},
     {evidence:'I will be watching your hands too, {W}.',dismiss:'Words.',concede:'Good. Then it is a fair fight at last.',deflect:'I will believe it at the bell.'},
     {commit:{kind:'nocheat',node:'clean',say:'win without cheating',label:'Promise to do it without cheating',hint:'Follows from your admission. Kept only if you do not cheat tonight.'}}),
    turn:res('Say a win is a win','Defend the result. The crowd may not love it.','The referee counted three. That is all a win has ever been, {F}.','defended',2,{heat:2},
     {evidence:'And the referee did not see {DETAIL}. Everybody else did.',dismiss:'Enjoy it. It is the last one.',concede:'Technically. Nobody remembers technically.',deflect:'Then you will not mind if the referee watches more closely tonight.'}),
    challenge:res('Say they had their chances','Answer with their own missed opportunity.','You had {MIN} minutes before that, {F}. If you were so much better, why was it still going?','reframed',3,{cred:2,heat:2},
     {evidence:'Because I was wrestling, {W}. You were waiting for the referee to look away.',dismiss:'Because I was enjoying myself.',concede:'Fair question. I have thought about it.',deflect:'Because you kept running.'}),
    personal:res('Tell them to stop moaning','Dismiss them. Heat, and the promoter will notice.','Stop moaning about it, {F}. It is embarrassing for both of us.','unresolved',-1,{heat:4,crowd:-1,trust:-1},
     {evidence:'I am not moaning. I am counting.',dismiss:'I am not moaning. I am counting the days.',concede:'Fine. I will stop talking. You keep your hands where I can see them.',deflect:'I will moan when you stop cheating.'}),
    callback:res('Change the subject','Do not discuss it. They will.','I am not here to talk about last time.','withdrawn',-2,{},
     {evidence:'Of course you are not.',dismiss:'No. You never are.',concede:'Fine. We will talk about it after.',deflect:'Funny, that.'})
   }},
  tapped:{family:'ability',owner:'f',angle:'proof',intent:'a counter to the hold',target:'{F}’s {FF}',
   label:'Talk about the {FF}',thesis:'Has {W} found an answer to the {FF}?',
   prop:{core:'I tapped to the {FF} {WHEN}, {F}. I have thought about very little else since.',detail:'I have watched it back. I know where my arm was, and where it should have been.',edge:'You made me tap. Once.',soft:'I tapped. I am not going to pretend I did not.'},
   f:{evidence:'You tapped, {W}. {MINS}I did not need the ropes and I did not need luck.',dismiss:'You tapped. Everything you say after that is noise.',
    concede:'You lasted longer in it than most people do. You still tapped.',deflect:'Talk all you like, {W}. Your hand remembers.'},
   again:'You keep reminding me about the {FF}, {F}. You do not need to. I remember.',
   r:{
    calm:res('Admit it plainly','Concede it. Credible, and it takes the sting out of their best line.','I tapped. I am not standing here pretending otherwise. I know how it happened, and I know how to stop it.','conceded',4,{cred:4,trust:1,heat:-1},
     {evidence:'Knowing and doing are different things, {W}.',dismiss:'Knowing will not help.',concede:'Good. Then you know what happens if I lock it in again.',deflect:'Everybody knows how to stop it. Nobody does.'}),
    turn:res('Say the damage did it, not the hold','Defend yourself with what actually happened.','{TURN_TAPPED}','{TURN_TAPPED_RES}','{TURN_TAPPED_REL}',{cred:1,heat:2},
     {evidence:'{TURN_TAPPED_REPLY}',dismiss:'Once is all it takes.',concede:'Maybe. I will take the win either way.',deflect:'Excuses are cheaper than counters.'}),
    challenge:res('Promise to reverse the {FF}','Make it a test. Only a real late reversal of a hold counts.','I have spent the time since working on one thing, {F}. Lock on the {FF} tonight and watch what happens.','reframed',4,{crowd:2,heat:2},
     {evidence:'Everybody has a plan for the {FF} until it is on.',dismiss:'Go on, then.',concede:'I would like to see that. I mean it.',deflect:'Then I will just have to beat you some other way.'},
     {commit:{kind:'counter',families:['submission'],node:'question',say:'reverse the {FF}',tacticLabel:'reversing the {FF}',label:'Promise to reverse the {FF}',hint:'Follows from what you just said. Only a real reversal of a hold late in the match counts.'}}),
    personal:res('Say they enjoyed it','Personal and nasty. The opponent gets a free reply.','You enjoyed it, {F}. I saw your face.','unresolved',-1,{heat:4,trust:-1},
     {evidence:'I did. I would enjoy it again.',dismiss:'I did. I will again.',concede:'I enjoyed winning. That is the job.',deflect:'You were in no position to see my face.'}),
    callback:res('Change the subject','Duck it. The hold will still be there.','I am not here to relive last time.','withdrawn',-2,{},
     {evidence:'You will relive it tonight.',dismiss:'No. You are here to tap again.',concede:'Fair enough. Tonight, then.',deflect:'Your hand is.'})
   }},
  promise_kept:{family:'credibility',owner:'w',angle:'proof',intent:'credibility',target:'{W}’s own word',
   label:'Remind them you kept your word',thesis:'Does {W}’s word mean something now?',
   prop:{core:'I stood here {WHEN} and said I would {SAY}, {F}. Then I went out and did it.',detail:'Said it, did it, in that order.',edge:'Said I would {SAY}. Did it.',soft:'I said I would {SAY}, and I did. I was as surprised as anyone.'},
   f:{evidence:'{KEPT_EVIDENCE}',dismiss:'One good night. Frame it.',concede:'You did. Fair play. I have been working on that too.',deflect:'And you have been telling everybody ever since.'},
   again:'I keep telling you, {F}: when I say something out here, it happens.',
   r:{
    calm:res('Admit it was one night','Do not oversell it. It makes the rest more believable.','It was one night, {F}. I am not pretending it makes me better than you. It makes me harder to beat.','reframed',4,{cred:3,trust:1},
     {evidence:'That is the first sensible thing you have said.',dismiss:'It makes you lucky.',concede:'It does. I noticed.',deflect:'Harder to beat, easier to annoy.'}),
    turn:res('Say it proves your point','Lean on the record.','It proves the only thing I came here to prove: when I tell you what I am going to do, it happens.','defended',4,{cred:2,heat:2},
     {evidence:'Then tell me what you are going to do tonight.',dismiss:'It proves you can do it once.',concede:'All right. I am listening.',deflect:'Then predict the result. Go on.'}),
    challenge:res('Say you will do it again','Repeat the promise. Kept twice is a reputation; broken is a story for them.','So I will say it again, {F}: I will {SAY} tonight as well.','reframed',3,{crowd:2,heat:2},
     {evidence:'Twice is harder than once.',dismiss:'Try it.',concede:'You might. That is what worries me.',deflect:'Same promise, same speech. Same result? We will see.'},{commit:'repeat'}),
    personal:res('Rub it in','Make them relive it. Heat.','You have been watching that back every night, have you not, {F}?','unresolved',0,{heat:3},
     {evidence:'I do not need to watch it. I was there.',dismiss:'I watched it once. Then I watched the result.',concede:'Twice. Happy?',deflect:'I have better things to watch.'}),
    callback:res('Leave it in the past','Let it go. Modest; a little forgettable.','Last time is last time. Tonight is tonight.','withdrawn',-1,{},
     {evidence:'For once we agree.',dismiss:'Good. Stop bringing it up.',concede:'Fine by me.',deflect:'Says the one who brought it up.'})
   }},
  promise_broken:{family:'broken_promises',owner:'f',angle:'proof',intent:'repair credibility',target:'{W}’s broken promise',
   label:'Face up to the broken promise',thesis:'Why should anybody believe {W} now?',
   prop:{core:'I said I would {SAY} {WHEN}, {F}. I did not.',detail:'I can tell you exactly where it went wrong.',edge:'Said I would {SAY}. Did not happen. Moving on.',soft:'I promised these people I would {SAY}, and I let them down.'},
   f:{evidence:'You stood exactly there and promised to {SAY}, {W}. It never happened. Why would anybody believe you tonight?',dismiss:'Your promises are worth less than the raffle tickets.',
    concede:'You aimed high. I will give you that. You missed.',deflect:'Shall I hold the microphone while you make another one?'},
   again:'I know, {F}. I know what I said. You are going to keep telling me, so let me say it first.',
   r:{
    calm:res('Admit it, and promise nothing','Concede. No promises tonight; if you then make one at the end, it will look hollow.','You are right. I said it and I did not do it. So no promises tonight. Just watch.','conceded',5,{cred:4,trust:2,heat:-1},
     {evidence:'That is the most honest thing you have said.',dismiss:'No promises. Very brave.',concede:'Good. I respect that more than the speech.',deflect:'No promises? That is a promise.'},{noPromise:true}),
    turn:res('Explain what actually happened','Defend it with what the match shows, if it shows anything.','{TURN_BROKEN}','{TURN_BROKEN_RES}','{TURN_BROKEN_REL}',{cred:1},
     {evidence:'{TURN_BROKEN_REPLY}',dismiss:'Close does not count.',concede:'I felt that one. It still did not count.',deflect:'Timing. Is that what we are calling it?'}),
    challenge:res('Make the same promise again','Double down. If it happens, the story turns; if not, it gets worse.','So I am making it again: I will {SAY} tonight.','reframed',2,{heat:3,crowd:1},
     {evidence:'Twice the promise. Twice the fall.',dismiss:'Same promise. Same result.',concede:'Brave. I mean that.',deflect:'Do you want me to write it down this time?'},{commit:'repeat'}),
    personal:res('Say they got lucky','Blame them. Unconvincing with this on the record.','You got lucky, {F}, and you know it.','unresolved',-2,{heat:3,cred:-1},
     {evidence:'Lucky is what you call it when you cannot explain it.',dismiss:'Lucky twice would be a skill.',concede:'Maybe. It still went my way.',deflect:'Then get lucky yourself.'}),
    callback:res('Say it is in the past','Brush it off. They will not let you.','That is in the past.','withdrawn',-3,{},
     {evidence:'It is not that far in the past, {W}.',dismiss:'Your past. My present.',concede:'Fine. Do not make another.',deflect:'Like your promises.'})
   }},
  injury_w:{family:'personal_grievance',owner:'w',angle:'accusation',intent:'acknowledgement',target:'what happened to {W}’s {PART}',
   label:'Bring up the injured {PART}',thesis:'Who is responsible for {W}’s {PART}?',
   prop:{core:'I left our match {WHEN} with a damaged {PART}, {F}. I have not forgotten who I was in the ring with.',detail:'I know which exchange did it.',edge:'You hurt my {PART}. I remember.',soft:'I am not saying you meant it, {F}. I am saying I am still feeling it.'},
   f:{evidence:'It is a contact sport, {W}. Nobody walks out of a match with me unmarked.',dismiss:'If you cannot take it, do not get in the ring.',
    concede:'I did not mean to hurt you. I am sorry it happened. I am not going any softer tonight.',deflect:'Funny how the injury only comes up when you need a reason.'},
   again:'You never did answer me about my {PART}, {F}.',
   r:{
    calm:res('Accept it was an accident','Concede intent. Professional, and it lowers the temperature.','Accidents happen. I have had worse and given worse. I will be watching, that is all.','conceded',4,{cred:3,trust:2,heat:-1},
     {evidence:'Watch all you like.',dismiss:'Watch carefully, then.',concede:'Thank you. I mean that.',deflect:'Very gracious. Suspiciously gracious.'}),
    turn:res('Say they went after it','Defend the charge with how the match went.','{TURN_INJURY}','{TURN_INJURY_RES}','{TURN_INJURY_REL}',{heat:3},
     {evidence:'Working a body part is wrestling, {W}. You do it too.',dismiss:'I went after you. That is the job.',concede:'I went after it. I did not mean to break it.',deflect:'You left it there for me.'}),
    challenge:res('Say it will not stop you','Turn the injury into resolve. The crowd likes it.','I am not asking you to go easy on it, {F}. I am telling you it will not stop me.','reframed',3,{crowd:2,cred:2},
     {evidence:'We will find out.',dismiss:'It will.',concede:'Good. I would hate to beat you hurt.',deflect:'Brave words for a bandage.'}),
    personal:res('Swear revenge','A threat. Big heat; the promoter will hate it.','Whatever you did to my {PART}, {F}, I am doing back.','unresolved',0,{heat:5,trust:-3},
     {evidence:'Try it.',dismiss:'Try it.',concede:'I will see you there, then.',deflect:'Get in the queue.'}),
    callback:res('Say you are fit','Close the subject.','I am fit. That is all you need to know.','withdrawn',-1,{},
     {evidence:'We will see how fit.',dismiss:'For now.',concede:'Glad to hear it.',deflect:'Says the strapping.'})
   }},
  injury_f:{family:'professional_respect',owner:'f',angle:'proof',intent:'trust in the ring',target:'what happened to {F}',
   label:'Address what happened to {F}',thesis:'Can {F} trust {W} in the ring?',
   prop:{core:'I know what you think about the last time we met, {F}. It was not deliberate.',detail:'I have gone over it. It was a bad exchange, not a plan.',edge:'You got hurt. It happens.',soft:'I am sorry you got hurt last time, {F}. I mean that.'},
   f:{evidence:'You were careless with me, {W}. I have the marks to prove it.',dismiss:'I am not hurt. I am annoyed.',concede:'I know it was not deliberate. I am still going to make you pay for it.',deflect:'Sorry does not heal anything.'},
   again:'I have said it already, {F}. It was not deliberate.',
   r:{
    calm:res('Apologise properly','Concede it. Trust and credibility; less heat.','You are right to be angry. I should have been more careful with you, and I will be.','conceded',5,{cred:3,trust:2,heat:-2},
     {evidence:'I will hold you to that.',dismiss:'Careful does not suit you.',concede:'Thank you. Now let us have a match.',deflect:'We will see.'}),
    turn:res('Say it is part of the job','Defend it. Unsympathetic.','It is a hard business, {F}. You knew that when you started.','defended',1,{heat:2},
     {evidence:'Hard is fine. Careless is not.',dismiss:'Then it will be hard for you tonight.',concede:'I knew. I still expected better.',deflect:'Says the one who did it.'}),
    challenge:res('Promise a hard, safe match','Reframe it as professionalism.','Tonight you get the hardest match of your life and you walk out in one piece. That is my promise to you.','reframed',3,{cred:2,trust:1},
     {evidence:'Hard and safe. I will believe it at the bell.',dismiss:'I can look after myself.',concede:'That is all I wanted to hear.',deflect:'Write it down.'}),
    personal:res('Tell them to toughen up','Dismissive. Heat; the promoter will not like it.','Toughen up, {F}.','unresolved',-2,{heat:4,trust:-2},
     {evidence:'Remember you said that.',dismiss:'Remember you said that.',concede:'Fine. Then do not hold back either.',deflect:'Says the one who needs a referee.'}),
    callback:res('Move on','Do not dwell on it.','We are both here. Let us leave it there.','withdrawn',-1,{},
     {evidence:'You would like that.',dismiss:'You would like that.',concede:'Fine.',deflect:'Convenient.'})
   }},
  slow_count:{family:'past_results',owner:'w',angle:'accusation',intent:'a fair count',target:'how {W} lost',
   label:'Bring up the slow count',thesis:'Did {W} lose, or was {W} robbed?',
   prop:{core:'I had you beaten {WHEN}, {F}. One more second of an honest count and we would not be standing here.',detail:'The count was slow. I am not saying it to be dramatic. It was slow.',edge:'Slow count. You know it.',soft:'I really thought I had you, {F}. I still do.'},
   f:{evidence:'Slow or not, you got up to argue with the referee instead of covering me again. That is on you.',dismiss:'I kicked out. That is what happened.',
    concede:'It was slow. It does not matter. You turned your back.',deflect:'Blame the referee. Everybody does.'},
   again:'I am still waiting for that last second, {F}.',
   r:{
    calm:res('Admit you lost your head','Concede the real mistake. Credible.','I got up to argue. Stupid. I will not make that mistake again.','conceded',5,{cred:4,trust:1},
     {evidence:'You will make a different one.',dismiss:'You will.',concede:'Good. Neither will I.',deflect:'Tell that to the referee.'}),
    turn:res('Say you were robbed','Defend the grievance.','I was robbed, {F}, and every person in this building saw it.','defended',2,{heat:2,crowd:1},
     {evidence:'They saw you turn your back.',dismiss:'They saw me win.',concede:'Some of them. Not all.',deflect:'They saw a sore loser.'}),
    challenge:res('Demand a straight count tonight','Make it a test: a straight fight, no help.','So tonight, a straight fight and a straight count. If you are better, prove it.','reframed',3,{cred:2},
     {evidence:'Straight count, straight result.',dismiss:'Fine.',concede:'Agreed.',deflect:'Bring your own referee.'},
     {commit:{kind:'clean',node:'clean',say:'have a straight fight with {opp}',label:'Hold them to a straight fight',hint:'Follows from what you just demanded. Kept only if nobody cheats and it ends clean.'}}),
    personal:res('Say they needed the referee','Personal. Heat.','You needed the referee to beat me, {F}. You will need him again.','unresolved',0,{heat:3},
     {evidence:'I needed you to turn round. You obliged.',dismiss:'I needed nothing.',concede:'I needed a bit of luck. You gave me the rest.',deflect:'Bring him a cup of tea, then.'}),
    callback:res('Let it go','Drop it.','Forget the count.','withdrawn',-1,{},
     {evidence:'You will not.',dismiss:'You will not.',concede:'Fine by me.',deflect:'You brought it up.'})
   }},
  outlasted_w:{family:'ability',owner:'f',angle:'proof',intent:'answer the stamina question',target:'{W}’s stamina',
   label:'Talk about running out of gas',thesis:'Can {W} last as long as {F}?',
   prop:{core:'I ran out of gas {WHEN}, {F}. I am not hiding from it.',detail:'I know when it went and why.',edge:'I ran out of gas. Once.',soft:'I was exhausted, {F}. You were better at the end. That is fair.'},
   f:{evidence:'You were done by the end, {W}. {MINS}I still had something left.',dismiss:'Some people have an engine. You have a kettle.',concede:'{OUTLAST_CONCEDE}',deflect:'Bring a flask this time.'},
   again:'You keep asking about my lungs, {F}. Ask me again at the end.',
   r:{
    calm:res('Say they were fitter that night','Concede it. Then the late minutes become the story.','You were fitter that night. Tonight we will see if you still are.','conceded',4,{cred:3,trust:1},
     {evidence:'I still am.',dismiss:'I still am.',concede:'We will see. I have been running too.',deflect:'Bring two flasks.'}),
    turn:res('Say it took them long enough','Defend it with the clock.','If I was so tired, {F}, why did it take you {MIN} minutes to finish me?','defended',3,{cred:2,heat:1},
     {evidence:'Because I was saving something. You were not.',dismiss:'I was enjoying myself.',concede:'Fair point. You made me work.',deflect:'I was being polite.'}),
    challenge:res('Promise to be the one standing at the end','A public test the match can answer: who is spent at the bell.','Tonight I will still be standing when you are not, {F}. Watch the last few minutes.','reframed',3,{crowd:2,heat:1},
     {evidence:'Watch them closely.',dismiss:'Watch me finish you.',concede:'I hope so. That is a match.',deflect:'Ambitious.'},
     {commit:{kind:'outlast',say:'outlast {opp}',label:null,hint:null}}),
    personal:res('Say they stall to rest','Personal and petty.','You only last because you lie around in rest holds, {F}.','unresolved',-1,{heat:3},
     {evidence:'Pacing is a skill. Try it.',dismiss:'And it worked.',concede:'Some of us pace ourselves.',deflect:'Jealous?'}),
    callback:res('Change the subject','Duck it.','My fitness is my business.','withdrawn',-2,{},
     {evidence:'It is mine at the eleven-minute mark.',dismiss:'Not in the ring it is not.',concede:'Fair.',deflect:'And mine, by the end.'})
   }},
  fade_f:{family:'ability',owner:'w',angle:'proof',intent:'expose a weakness',target:'{F}’s stamina',
   label:'Say they fade late',thesis:'Does {F} fade late?',
   prop:{core:'You were out on your feet by the end {WHEN}, {F}. I watched it happen.',detail:'Your pace dropped and it did not come back.',edge:'You were gone at the end, {F}.',soft:'You were so tired by the end, {F}. I felt for you. A bit.'},
   f:{evidence:'{FADE_EVIDENCE}',dismiss:'I was pacing myself.',concede:'I was spent. I have worked on it.',deflect:'I was tired of listening to you.'},
   again:'I said it last time, {F}: watch what happens to you in the last few minutes.',
   r:{
    calm:res('Credit them for lasting','Grant the effort. Credible.','You still lasted. I will give you that. Tonight I make the last minutes longer.','reframed',3,{cred:3},
     {evidence:'Make them as long as you like.',dismiss:'Make them longer. I will finish you sooner.',concede:'Fair. I will be ready.',deflect:'Longer speeches, too?'}),
    turn:res('Say it will happen again','Press the weakness.','It will happen again, {F}. It happens every time somebody makes you work.','defended',3,{cred:2,heat:2},
     {evidence:'You have seen it once.',dismiss:'Make me work, then.',concede:'Maybe. I have prepared.',deflect:'You have to make me work first.'}),
    challenge:res('Promise to drag it into the late minutes','A test the match can answer: who is spent at the bell.','I am going to keep you out there until there is nothing left, {F}. Watch the last few minutes.','reframed',3,{crowd:2,heat:1},
     {evidence:'Then you had better last as well.',dismiss:'You will not get that far.',concede:'That is the match I want.',deflect:'Bring sandwiches.'},
     {commit:{kind:'outlast',say:'outlast {opp}',label:null,hint:null}}),
    personal:res('Mock them','Cheap, and it might land.','You were wheezing like the urn, {F}.','unresolved',0,{heat:3,crowd:1},
     {evidence:'The urn wins more than you do.',dismiss:'And still standing.',concede:'Fine. It was a long night.',deflect:'And you were the steam.'}),
    callback:res('Drop it','Move on.','Never mind the end. Mind the start.','withdrawn',-1,{},
     {evidence:'Gladly.',dismiss:'Gladly.',concede:'Fine.',deflect:'Make your mind up.'})
   }},
  finisher_reversed:{family:'ability',owner:'f',angle:'proof',intent:'a new approach',target:'{W}’s {WF}',
   label:'Admit they read the {WF}',thesis:'Can {W} still hit the {WF} on {F}?',
   prop:{core:'You read the {WF} {WHEN}, {F}. I will give you that.',detail:'You had seen me set it up enough times to know the moment it was coming.',edge:'You got lucky on the {WF}.',soft:'You read my {WF}. I did not sleep that night.'},
   f:{evidence:'I have seen the {WF} coming since the first bell, {W}. Everybody has. You telegraph it.',dismiss:'Your {WF} is a postcard. I saw it coming from the car park.',
    concede:'I had studied it. It is a good move. It is just not a secret.',deflect:'Maybe try a different move. You do know other moves?'},
   again:'Yes, {F}, I know. You read the {WF}. You have told everybody.',
   r:{
    calm:res('Admit you were predictable','Concede it. The next match becomes about surprise.','You are right. I was predictable. Tonight you will not know what is coming.','conceded',4,{cred:3,trust:1},
     {evidence:'Everything you do is coming. I have tapes.',dismiss:'I always know.',concede:'Good. Surprise me.',deflect:'That is what you said last time.'}),
    turn:res('Say it is still the best move here','Defend the move.','It is still the best move in this building, {F}. Reading it once does not change that.','defended',1,{heat:2},
     {evidence:'Once is a pattern if it is the right once.',dismiss:'Second best, behind mine.',concede:'It is a good move. I said so.',deflect:'Then hit it.'}),
    challenge:res('Say you will hit it anyway','Name the finisher: they will be watching for it.','Read it all you like, {F}. I am hitting the {WF} tonight and it is ending the match.','reframed',3,{crowd:3,heat:2},
     {evidence:'I will be watching for it.',dismiss:'You will not.',concede:'Then I will have to be quicker.',deflect:'Send me a postcard.'},
     {commit:{kind:'finisher',node:'finisher',say:'finish it with the {WF}',label:'Promise to finish it with the {WF}',hint:'Follows from what you just said. They will be watching for it.'}}),
    personal:res('Say they got lucky','Unconvincing with the replay on record.','You guessed, {F}, and you guessed right. That is all.','unresolved',-1,{heat:2},
     {evidence:'Guess again, then.',dismiss:'Guess again.',concede:'Maybe. Guess what I do tonight.',deflect:'Lucky twice is a skill.'}),
    callback:res('Change the subject','Duck it.','I am not here to talk about one move.','withdrawn',-1,{},
     {evidence:'You will be thinking about it.',dismiss:'You will be.',concede:'Fine.',deflect:'I am.'})
   }},
  stolen:{family:'ability',owner:'w',angle:'proof',intent:'prove it was no accident',target:'{F}’s {FF}',
   label:'Remind them you slipped the {FF}',thesis:'Has {W} worked out the {FF}?',
   prop:{core:'You went for the {FF} {WHEN}, {F}, and I was waiting for it.',detail:'I had watched you set it up all night.',edge:'Your {FF}. My win.',soft:'I saw the {FF} coming and I just got out of it. I still cannot quite believe it.'},
   f:{evidence:'You slipped it once, {W}. Once is the number you will be stuck on.',dismiss:'Lucky.',concede:'You read it. I hated that. I have changed it.',deflect:'Enjoy the replay. It is all you have.'},
   again:'I told you, {F}. I know when the {FF} is coming.',
   r:{
    calm:res('Say it was one escape','Do not oversell it.','It was one escape. I am not pretending the {FF} cannot hurt me.','reframed',3,{cred:3},
     {evidence:'It can. It will.',dismiss:'It will.',concede:'At least you are honest.',deflect:'Remember that when it is on.'}),
    turn:res('Say you can do it again','Press it.','I read it once, {F}. I can read it again.','defended',3,{cred:2,heat:2},
     {evidence:'I have changed the set-up.',dismiss:'You cannot.',concede:'You might. That is why I changed it.',deflect:'Read this, then.'}),
    challenge:res('Promise to turn it round again','Make it a test: a real late counter.','Go for it again tonight, {F}. I will be waiting again.','reframed',3,{crowd:2,heat:2},
     {evidence:'I will pick my moment better.',dismiss:'Wait all you like.',concede:'I will go for it. We will both find out.',deflect:'Waiting is what you do best.'},
     {commit:{kind:'counter',families:null,node:'question',say:'turn {opps} attack round again',tacticLabel:'turning {F}’s attack round again',label:'Promise to turn them round again',hint:'Follows from what you just said. Only a real reversal late in the match counts.'}}),
    personal:res('Mock the move','Insult the finisher. Heat.','The {FF} is a lovely move, {F}. For somebody else.','unresolved',0,{heat:3,crowd:1},
     {evidence:'Ask the people who tapped to it.',dismiss:'It is perfect.',concede:'It is mine. That is enough.',deflect:'You will be sleeping in it.'}),
    callback:res('Move on','Drop it.','Last time was last time.','withdrawn',-1,{},
     {evidence:'It certainly was.',dismiss:'Good.',concede:'Fair.',deflect:'Sore subject?'})
   }},
  clean_win_w:{family:'past_results',owner:'w',angle:'proof',intent:'confirm the result',target:'the last result',
   label:'Point to your clean win',thesis:'Was {W}’s win a fluke?',
   prop:{core:'I beat you clean {WHEN}, {F}. No tights, no ropes, nobody else.',detail:'{MINS2}one, two, three.',edge:'Beat you clean. Again tonight.',soft:'I beat you fair and square, {F}. I am still a bit giddy about it.'},
   f:{evidence:'{CLEAN_W_EVIDENCE}',dismiss:'One night.',concede:'You did. It was the better match for you. Not tonight.',deflect:'Everybody gets one.'},
   again:'I beat you clean, {F}. I keep saying it because it keeps being true.',
   r:{
    calm:res('Say one win proves nothing on its own','Modest. Credible.','One win proves nothing on its own, {F}. Two would start a conversation.','reframed',3,{cred:3},
     {evidence:'Then you had better start talking.',dismiss:'You will not get two.',concede:'Agreed.',deflect:'One is plenty for you.'}),
    turn:res('Say clean is clean','Defend the result.','Clean is clean, {F}. You can argue with me. You cannot argue with that.','defended',3,{cred:2,heat:1},
     {evidence:'I am not arguing. I am preparing.',dismiss:'Watch me.',concede:'I am not arguing.',deflect:'I can argue with anything.'}),
    challenge:res('Say same again: clean','A straight fight, publicly demanded.','Same again tonight, {F}. Clean. Let them see it twice.','reframed',3,{crowd:2},
     {evidence:'Clean suits me.',dismiss:'Any way you like.',concede:'Clean. Agreed.',deflect:'Clean? You?'},
     {commit:{kind:'clean',node:'clean',say:'have a straight fight with {opp}',label:'Hold them to a straight fight',hint:'Follows from what you just said. Kept only if nobody cheats and it ends clean.'}}),
    personal:res('Say they have not been the same since','Personal. Heat.','You have not been the same since I beat you, {F}.','unresolved',-1,{heat:3},
     {evidence:'I have been better.',dismiss:'I have been better.',concede:'Maybe not. I have been thinking.',deflect:'Neither has your hairline.'}),
    callback:res('Move on','Do not dwell on it.','Never mind last time.','withdrawn',-1,{},
     {evidence:'You will mind tonight.',dismiss:'Good.',concede:'Fine.',deflect:'Losing your nerve?'})
   }},
  clean_win_f:{family:'past_results',owner:'f',angle:'proof',intent:'answer the defeat',target:'the last result',
   label:'Answer the clean defeat',thesis:'Can {W} beat {F}?',
   prop:{core:'You beat me clean {WHEN}, {F}. I am not going to argue with it.',detail:'I have watched it. You were better on the night.',edge:'You beat me clean. Fine. Once.',soft:'You beat me fair, {F}. I have thought about it a lot.'},
   f:{evidence:'I beat you clean, {W}. {MINS}In front of all of these people.',dismiss:'I beat you. I will beat you again.',concede:'I beat you. It was close enough to keep me awake.',deflect:'Do you want me to sign something?'},
   again:'Yes, {F}, you beat me. I said so. I am still here.',
   r:{
    calm:res('Admit they were better that night','Concede it plainly. Credible.','You were better that night. I do not think you are better than me.','conceded',4,{cred:3,trust:1},
     {evidence:'Then show me.',dismiss:'I am.',concede:'Fair enough.',deflect:'Same thing, really.'}),
    turn:res('Say it was closer than they say','Defend yourself with how the match went.','{TURN_CLOSE}','{TURN_CLOSE_RES}','{TURN_CLOSE_REL}',{cred:1},
     {evidence:'Close only counts in horseshoes.',dismiss:'It was not close.',concede:'It was close. It still went my way.',deflect:'Close? I barely noticed.'}),
    challenge:res('Say: do it again, the same way','A straight fight, publicly demanded.','Then do it again tonight, {F}. The same way: clean.','reframed',3,{crowd:2,heat:1},
     {evidence:'Gladly.',dismiss:'Gladly.',concede:'Agreed.',deflect:'If you insist.'},
     {commit:{kind:'clean',node:'clean',say:'have a straight fight with {opp}',label:'Hold them to a straight fight',hint:'Follows from what you just said. Kept only if nobody cheats and it ends clean.'}}),
    personal:res('Say they got lucky','Unconvincing.','You got lucky, {F}.','unresolved',-2,{heat:2,cred:-1},
     {evidence:'Get lucky yourself.',dismiss:'Get lucky yourself.',concede:'A little.',deflect:'And you got beaten.'}),
    callback:res('Move on','Duck it.','That was then.','withdrawn',-1,{},
     {evidence:'And this is now. Same result.',dismiss:'Same result.',concede:'Fair.',deflect:'Nervous?'})
   }},
  counters_w:{family:'ability',owner:'w',angle:'proof',intent:'show they are scouted',target:'{F}’s timing',
   label:'Say you have their timing',thesis:'Has {W} worked {F} out?',
   prop:{core:'I reversed you {COUNT} times {WHEN}, {F}. I know your timing better than you do.',detail:'I could tell you which ones.',edge:'{COUNT} times I turned you over.',soft:'I kept reading you last time, {F}. I think I have watched too many tapes.'},
   f:{evidence:'{COUNTERS_EVIDENCE}',dismiss:'You reversed me because I let you.',concede:'You read me well. I have been thinking about it.',deflect:'Counting again? Do you count sheep as well?'},
   again:'I still have your timing, {F}.',
   r:{
    calm:res('Say they will have changed it, and so have you','Grant them the adjustment.','You will have changed it. So have I.','reframed',3,{cred:3},
     {evidence:'We will see whose change works.',dismiss:'Mine works.',concede:'Fair.',deflect:'Changed your shirt, too?'}),
    turn:res('Say they cannot change their timing in a fortnight','Press the scouting.','Nobody changes their timing in a fortnight, {F}. Not you.','defended',3,{cred:2,heat:2},
     {evidence:'Watch me.',dismiss:'Watch me.',concede:'Maybe not all of it.',deflect:'You did. You got slower.'}),
    challenge:res('Promise to turn every attack round','Make it a test: a real late counter.','Every attack you try tonight, {F}, I will turn round. Watch the end of the match.','reframed',3,{crowd:2,heat:2},
     {evidence:'Every one? Ambitious.',dismiss:'Try.',concede:'Some of them, maybe.',deflect:'Every one?'},
     {commit:{kind:'counter',families:'{FAMILIES}',node:'question',say:'turn {opps} attack round late on',tacticLabel:'turning {F}’s attack round',label:'Promise to turn them round',hint:'Follows from what you just said. Only a real reversal late in the match counts.'}}),
    personal:res('Say they are predictable','Personal.','You are the most predictable wrestler on this circuit, {F}.','unresolved',-1,{heat:3},
     {evidence:'Predict the result, then.',dismiss:'Predict this.',concede:'Maybe. It still works.',deflect:'And you are the most boring.'}),
    callback:res('Move on','Let it go.','Never mind last time.','withdrawn',-1,{},
     {evidence:'You will mind.',dismiss:'Good.',concede:'Fine.',deflect:'Losing count?'})
   }},
  record_w:{family:'status',owner:'w',angle:'swagger',intent:'status',target:'the head-to-head',
   label:'Quote the head-to-head',thesis:'Who is the better wrestler, over all of it?',
   prop:{core:'The record says {W} {RW}, {F} {RF}. I did not write it. I just keep adding to it.',detail:'{RW} out of {RN}.',edge:'{RW} to {RF}. Count it.',soft:'{RW} to {RF}. I honestly did not expect that.'},
   f:{evidence:'{RECORD_EVIDENCE}',dismiss:'Numbers.',concede:'You are ahead. I am not pretending otherwise.',deflect:'Keep counting. You will lose your place.'},
   again:'Still {RW} to {RF}, {F}.',
   r:{
    calm:res('Say the next one is the only one that matters','Modest. Credible.','The record does not matter tonight, {F}. The next one is the only one that does.','reframed',3,{cred:3},
     {evidence:'Then let us have it.',dismiss:'For once.',concede:'Agreed.',deflect:'Says the leader.'}),
    turn:res('Say the record is the argument','Lean on the numbers.','The record is the argument, {F}. You keep losing it.','defended',4,{cred:2,heat:2},
     {evidence:'Records change.',dismiss:'Records change.',concede:'For now.',deflect:'You keep repeating it.'}),
    challenge:res('Promise to extend it','A public prediction. Check the booking.','Make it {RW1} tonight, {F}.','reframed',2,{crowd:2,heat:2},
     {evidence:'Or {RF1}.',dismiss:'Or not.',concede:'We will see.',deflect:'Count to three first.'},{commit:{kind:'win',node:'vow',say:'beat {opp} again',label:'Promise to extend the record',hint:'Follows from what you just said. A public prediction of victory.'}}),
    personal:res('Say they have never been good enough','Personal.','You have never been good enough, {F}.','unresolved',-1,{heat:3},
     {evidence:'I have been good enough {RF} times.',dismiss:'Watch.',concede:'Not yet.',deflect:'Neither have you, all the time.'}),
    callback:res('Leave the numbers','Move on.','Forget the numbers.','withdrawn',-1,{},
     {evidence:'You will not.',dismiss:'Gladly.',concede:'Fine.',deflect:'Easier for you to say.'})
   }},
  record_f:{family:'status',owner:'f',angle:'proof',intent:'end the losing run',target:'the head-to-head',
   label:'Admit the head-to-head',thesis:'Does {F} have {W}’s number?',
   prop:{core:'You lead us {RF} to {RW}, {F}. I can count.',detail:'I can tell you how every one of them ended.',edge:'{RF} to {RW}. For now.',soft:'You have beaten me {RF} times, {F}. I know.'},
   f:{evidence:'{RF} to {RW}, {W}. At some point it stops being bad luck.',dismiss:'Count higher.',concede:'You have made every one of them hard.',deflect:'Shall I write it on your hand?'},
   again:'Yes, {F}. {RF} to {RW}. You will not need to remind me again after tonight.',
   r:{
    calm:res('Admit they have had your number','Concede it. Credible, and it raises the stakes.','You have had my number, {F}. I am here to change it.','conceded',4,{cred:3,trust:1},
     {evidence:'Change it, then.',dismiss:'Good luck.',concede:'I hope you try.',deflect:'It is a long number.'}),
    turn:res('Say every one was close','Defend yourself with how the matches went.','{TURN_RECORD}','{TURN_RECORD_RES}','{TURN_RECORD_REL}',{cred:1},
     {evidence:'Close every time and still behind.',dismiss:'Close is losing.',concede:'Close. Yes.',deflect:'Close? Is that your new word?'}),
    challenge:res('Say the run ends tonight','A public prediction. Check the booking.','The run ends tonight, {F}.','reframed',2,{crowd:2,heat:3},
     {evidence:'Runs end when somebody ends them.',dismiss:'It does not.',concede:'Maybe. Try.',deflect:'Which run?'},{commit:{kind:'win',node:'vow',say:'end {opps} run',label:'Promise to end the run',hint:'Follows from what you just said. A public prediction of victory.'}}),
    personal:res('Say they only beat you with help','Unsupported unless they cheated.','{PERSONAL_RECORD}','unresolved','{PERSONAL_RECORD_REL}',{heat:3},
     {evidence:'Look it up.',dismiss:'Look it up.',concede:'Some help. Not much.',deflect:'Help from you, mostly.'}),
    callback:res('Leave the numbers','Move on.','Forget the numbers.','withdrawn',-2,{},
     {evidence:'You cannot.',dismiss:'You cannot.',concede:'Fine.',deflect:'Easy for you.'})
   }},
  great_match:{family:'mutual_recognition',owner:'both',angle:'people',intent:'build on what worked',target:'their last match together',
   label:'Credit the match you had together',thesis:'Can they top it?',
   prop:{core:'That match {WHEN} was as good as anything on this circuit, {F}. I am not going to pretend otherwise.',detail:'People are still talking about it. I did not need them to tell me.',edge:'Good match last time. That is all.',soft:'I loved that match, {F}. Honestly.'},
   f:{evidence:'It was good because I made it good, {W}.',dismiss:'You were along for the ride, {W}.',concede:'It was. It does not mean I will let you win this one.',deflect:'Compliments? You must be worried.'},
   again:'We did it once, {F}. Let us do it again.',
   r:{
    calm:res('Agree to do it again, properly','Low-conflict and professional. Trust and crowd.','Then let us do it again. Properly. These people deserve it.','reframed',4,{crowd:2,trust:2,cred:2,heat:-2},
     {evidence:'Properly. Agreed.',dismiss:'I will do it properly. You keep up.',concede:'Agreed. Let us give them something.',deflect:'Fine. Do not get soppy about it.'}),
    turn:res('Say it was your match','Claim the credit. Some heat.','It was good because I was in it, {F}.','defended',1,{heat:2},
     {evidence:'You were in it. That was all.',dismiss:'Funny. I was going to say that.',concede:'We were both in it.',deflect:'Say that to the tape.'}),
    challenge:res('Promise an even better one','Raise the bar together.','Tonight, {F}, we top it. Both of us.','reframed',3,{crowd:3,cred:1},
     {evidence:'That is a big promise.',dismiss:'I will top it. You watch.',concede:'Let us try.',deflect:'Are we doing this together now?'}),
    personal:res('Say they were carried','Refuse the respect. Heat, and they will not forget it.','I carried you through that, {F}.','unresolved',-1,{heat:4,trust:-1},
     {evidence:'Look at the tape.',dismiss:'Look at the tape.',concede:'That is not how I remember it.',deflect:'You could not carry a tray.'}),
    callback:res('Keep it about tonight','Do not get sentimental.','Last time was last time.','withdrawn',0,{},
     {evidence:'Fair.',dismiss:'Fair.',concede:'Fair enough.',deflect:'Sentimental, are we?'})
   }},
  betrayal:{family:'personal_grievance',owner:'w',angle:'accusation',intent:'an answer for the betrayal',target:'{F}’s betrayal',
   label:'Bring up the betrayal',thesis:'Why did {F} turn?',
   prop:{core:'We were friends, {F}. Then you turned on me.',detail:'I know exactly when it happened.',edge:'You turned on me.',soft:'I trusted you, {F}. I really did.'},
   f:{evidence:'You beat me and walked off like it was nothing. Something had to give.',dismiss:'Friends? We got on. It was not a marriage.',concede:'I am not proud of it.',deflect:'Turned? I just stopped pretending.'},
   again:'You still have not told me why, {F}.',
   r:{
    calm:res('Say you just want to know why','Quiet. Credible.','I do not want an apology, {F}. I want to know why.','reframed',3,{cred:3,trust:1},
     {evidence:'You know why.',dismiss:'You know why.',concede:'Maybe one day.',deflect:'Ask yourself.'}),
    turn:res('Say everybody saw what they are','Press it.','Everybody in this building saw who you really are, {F}.','defended',3,{heat:2,crowd:1},
     {evidence:'They saw me stop being your friend.',dismiss:'Good. Now they know.',concede:'They did. I am not hiding it.',deflect:'They saw you cry.'}),
    challenge:res('Promise to make them regret it','A threat with a reason. Heat.','You will regret it, {F}. Tonight.','reframed',2,{heat:4},
     {evidence:'I doubt it.',dismiss:'I doubt it.',concede:'I already do, a bit.',deflect:'Get in the queue.'}),
    personal:res('Go for the jugular','Pure heat.','You were never a friend. You were waiting for your chance.','unresolved',0,{heat:5,trust:-2},
     {evidence:'Maybe I was.',dismiss:'Maybe I was.',concede:'That is not true and you know it.',deflect:'And I took it.'}),
    callback:res('Say it is just business now','Cold. Reduces heat.','It is just business now, {F}.','withdrawn',1,{heat:-1},
     {evidence:'Good.',dismiss:'Good.',concede:'If that is what you want.',deflect:'It always was.'})
   }},
  bond_friend:{family:'loyalty',owner:'both',angle:'people',intent:'keep it fair between friends',target:'their friendship',
   label:'Talk about the friendship',thesis:'Can two friends have a real fight?',
   prop:{core:'We get on, {F}. Everybody in the back knows it. Tonight that does not help either of us.',detail:'I have thought about whether that makes this easier. It does not.',edge:'Friend. Does not matter tonight.',soft:'{F} is one of my favourite people in this business. Which is why I am going to try my hardest to beat them.'},
   f:{evidence:'Friendship is for the van, {W}. This is the ring.',dismiss:'Friends, yes. Equals, no.',concede:'Same. I will buy the chips afterwards. I am still going to beat you.',deflect:'Do not make it soppy, {W}.'},
   again:'Still friends, {F}. Still trying to beat you.',
   r:{
    calm:res('Promise a fair fight between friends','Low-conflict. Trust and crowd.','Then a fair fight between friends. No shortcuts. Handshake at the end, whoever wins.','reframed',4,{trust:2,crowd:2,heat:-2},
     {evidence:'Handshake at the end.',dismiss:'Fine. I will shake your hand while you are lying down.',concede:'Deal.',deflect:'Do not hug me.'},
     {commit:{kind:'clean',node:'clean',say:'have a straight fight with {opp}',label:'Shake on a straight fight',hint:'Follows from what you just said. Kept only if nobody cheats and it ends clean.'}}),
    turn:res('Say friendship ends at the bell','Some heat, still honest.','Friendship ends when that bell rings, {F}.','defended',2,{heat:2},
     {evidence:'Good. So does mercy.',dismiss:'Then I hope you are ready.',concede:'Until the next bell.',deflect:'Dramatic.'}),
    challenge:res('Say whoever loses buys the chips','Light and likeable.','Whoever loses buys the chips, {F}. Large ones.','reframed',3,{crowd:3,trust:1},
     {evidence:'Large ones. Noted.',dismiss:'Bring your wallet.',concede:'Deal.',deflect:'Mushy peas as well.'}),
    personal:res('Say the friendship was never real','Burn it down. Big heat; it will be remembered.','We were never friends, {F}. I was being polite.','unresolved',-2,{heat:5,trust:-2},
     {evidence:'Remember you said that.',dismiss:'Remember you said that.',concede:'That hurt. It was meant to.',deflect:'You were never polite.'}),
    callback:res('Keep it about the match','Neutral.','Let us just wrestle.','withdrawn',0,{},
     {evidence:'Let us.',dismiss:'Let us.',concede:'Gladly.',deflect:'Finally.'})
   }}
 };
 // Each opponent register says something different, not just in different words:
 //   evidence  cites what happened   dismiss  refuses to engage with it
 //   concede   grants a point, keeps the conclusion   deflect  changes the angle
 const MODE_BY_VOICE={precise:'evidence',stoic:'evidence',gruff:'dismiss',grand:'dismiss',earnest:'concede',sermon:'concede',slippery:'deflect',eager:'deflect'};
 function modeOf(f,st){
  let m=MODE_BY_VOICE[voice(f)]||'evidence';
  if(st==='cooperative'||st==='respectful')m=(f.ego||50)>=82?'dismiss':m==='dismiss'?'evidence':'concede';
  if((st==='hostile'||st==='resentful')&&m==='concede')m='evidence';
  return m;
 }
 // How the speaker delivers a proposition. The facts are the same; the approach is not.
 function deliver(v,p){
  if(['precise','stoic'].includes(v))return p.detail?p.core+' '+p.detail:p.core;
  if(v==='gruff')return p.edge||p.core;
  if(['earnest','eager'].includes(v))return p.soft||p.core;
  if(v==='grand')return p.core+' '+(p.detail&&p.detail.length<70?p.detail:'Remember that.');
  if(v==='sermon')return p.core+' Let it be written down.';
  if(v==='slippery')return p.core+' Not that I am one to bring things up.';
  return p.core;
 }
 const LEAD={precise:'Let us stick to the facts.',stoic:'Never mind that.',gruff:'Never mind all that.',grand:'Enough.',earnest:'Can I just say something?',sermon:'Hear me.',slippery:'Lovely speech. Anyway.',eager:'Oh, oh, can I say something?'};
 const AGAIN={evidence:'You raised this last time, {W}. My answer has not changed.',dismiss:'This again?',concede:'We have been here before, {W}.',deflect:'Same speech as last time, {W}. Did you write it on the bus?'};
 const REPEAT_F={evidence:'That is twice now.',dismiss:'Again.',concede:'Not for the first time.',deflect:'Here we go again.'};
 const REPEAT_W={cheat_f:'Not for the first time, {F}.',cheat_w:'I know, {F}. It happened again.',tapped:'Twice now, {F}. I know.',promise_kept:'I did it again, {F}.',promise_broken:'Twice now, {F}. I know.',
  injury_w:'Hurt again, {F}.',slow_count:'Another slow count, {F}.',outlasted_w:'I ran out of gas again, {F}.',fade_f:'You faded again, {F}.',finisher_reversed:'You read it again, {F}.',
  stolen:'I slipped it again, {F}.',clean_win_w:'Clean again, {F}.',clean_win_f:'You beat me clean again, {F}.',counters_w:'I had your timing again, {F}.',
  great_match:'Twice in a row now, {F}. People will start to expect it.',bond_friend:'Still friends, {F}. Still on opposite sides.',betrayal:'I keep coming back to it, {F}, because you never answer.',
  record_w:'Still counting, {F}.',record_f:'Still counting, {F}. I know.',injury_f:'It happened again, {F}. I know.'};

 // Variables an issue's text can use, all filled from the fact and the two wrestlers.
 function vars(x,fact,w,f,rec){
  const d=fact.d||{},W=w.short,F=f.short,min=d.minutes||null;
  const fam=Array.isArray(d.families)&&d.families.length?d.families:null;
  const v={W,F,WF:w.finisher||'my finisher',FF:f.finisher||'that hold',WHEN:d.when||'last time',DETAIL:d.detail||'a cheap shot',CDETAIL:cap(d.detail||'a cheap shot'),
   MIN:min?String(min):'all those',MINS:min?min+' minutes in. ':'',MINS2:min?min+' minutes, ':'',
   PART:d.part||'shoulder',COUNT:String(d.count||0),SAY:d.say||'keep my word',STARS:String(d.stars||''),
   RW:String(rec.w),RF:String(rec.f),RN:String(rec.meetings),RW1:String(rec.w+1),RF1:String(rec.f+1)};
  v.KEPT_EVIDENCE=d.fWon?'You did. And I still won, '+W+'. Put that on your list.':'You did. Once. I have had time to think about it since.';
  v.FADE_EVIDENCE=d.fWon?'Tired, and I still beat you, '+W+'. Imagine me fresh.':'I was tired because I was carrying the match, '+W+'.';
  v.OUTLAST_CONCEDE=d.fTired?'You were tired. I was not far behind.':'You were tired. I was not.';
  v.CLEAN_W_EVIDENCE=rec.f>rec.w?'You beat me once, '+W+'. Check the rest of the record.':rec.f===rec.w&&rec.meetings>1?'You beat me once. I have beaten you once. That is not a lead.':'You beat me once, '+W+'. Once.';
  v.COUNTERS_EVIDENCE=d.fWon?'And I still won, '+W+'. Counters are nice. Results are better.':'You read me. I have changed the timing since.';
  v.RECORD_EVIDENCE=rec.lastF?'And the last one? I won that, '+W+'.':'Records are history, '+W+'. I am here tonight.';
  // Answers whose strength depends on what the record actually shows.
  const worked=!!d.worked;
  v.TURN_TAPPED=worked?'That hold only worked because you had spent the whole match on my '+(d.part||'arm')+', '+F+'. Take that away and you have nothing.':'That hold caught me once, '+F+'. Once is a mistake, not a pattern.';
  v.TURN_TAPPED_RES=worked?'defended':'unresolved';v.TURN_TAPPED_REL=worked?3:1;
  v.TURN_TAPPED_REPLY=worked?'Working the '+(d.part||'arm')+' is the plan, '+W+'. That is what wrestling is.':'Once is all it takes.';
  const early=d.type==='counter'&&d.early&&d.count>0;
  v.TURN_BROKEN=early?'I reversed you '+d.count+' times, '+F+'. The one I promised came too early to count. That is not a lie. That is timing.':'I missed it by a second, '+F+'. You noticed because it frightened you.';
  v.TURN_BROKEN_RES=early?'defended':'unresolved';v.TURN_BROKEN_REL=early?3:0;
  v.TURN_BROKEN_REPLY=early?'Too early is the same as never, '+W+'.':'Frightened? I was laughing.';
  v.TURN_INJURY=worked?'You went after my '+(d.part||'arm')+' on purpose, '+F+', and you kept going after it.':'You were careless, '+F+'. That is worse than doing it on purpose.';
  v.TURN_INJURY_RES=worked?'defended':'unresolved';v.TURN_INJURY_REL=worked?3:1;
  v.TURN_CLOSE=d.close?'It was closer than you are making it sound, '+F+'. Everybody who watched it knows that.':'It was one night, '+F+'. It does not settle anything.';
  v.TURN_CLOSE_RES=d.close?'defended':'unresolved';v.TURN_CLOSE_REL=d.close?2:0;
  v.TURN_RECORD=rec.closeAll?'Every one of those went to the wire, '+F+'. You know it.':'I lost them. I am not going to rewrite them.';
  v.TURN_RECORD_RES=rec.closeAll?'defended':'conceded';v.TURN_RECORD_REL=rec.closeAll?2:3;
  v.PERSONAL_RECORD=rec.fCheated?'You only beat me with help, '+F+'. Everybody saw at least one of them.':'You have never beaten me without something going your way, '+F+'.';
  v.PERSONAL_RECORD_REL=rec.fCheated?1:-3;
  v.FAMILIES=fam;
  return v;
 }
 const fill=(t,v)=>typeof t==='string'?t.replace(/\{([A-Z_0-9]+)\}/g,(m,k)=>v[k]!==undefined&&v[k]!==null&&typeof v[k]!=='object'?String(v[k]):m):t;

 // ---------------------------------------------------------------------------------------------
 // CHOOSING THE ARGUMENT. The facts are scored by weight, then by what has already been said about
 // them: an argument that was settled is not reopened unless something new happened; one left
 // unresolved comes back as a continuation; a point a wrestler conceded is not pressed by them again.
 // Issues that are really one subject, for the purpose of not arguing about it every single week.
 const TOPIC={promise_kept:'promise',promise_broken:'promise',record_w:'record',record_f:'record',clean_win_w:'result',clean_win_f:'result',cheat_f:'cheating',cheat_w:'cheating',outlasted_w:'stamina',fade_f:'stamina'};
 function candidates(L,P,w,f){
  const out=[],claims=L.claims;
  for(const fact of P.facts){
   const I=ISSUES[fact.kind];if(!I)continue;
   const past=claims.filter(c=>c.issue===fact.kind);
   const sameFact=past.filter(c=>c.factId===fact.id);
   const last=past.at(-1);
   let score=fact.weight,continuation=false,repeat=false;
   if(sameFact.length){
    const lastSame=sameFact.at(-1);
    if(lastSame.resolution==='unresolved'&&sameFact.length<3){score+=2;continuation=true;}
    else if(lastSame.resolution==='conceded'||lastSame.fConceded)score-=12;
    else score-=6*sameFact.length;
   }else if(last){repeat=true;if(last.resolution==='unresolved'&&agoOf(L,last.cid)<=1){score+=1.5;continuation=true;}}
   // An argument had at the last meeting (and the one before) gives way to something else, unless it
   // was left open: a rivalry moves on rather than replaying the same subject every week.
   if(!continuation){const topic=TOPIC[fact.kind]||fact.kind;let run=0;for(const m of L.meetings.slice().reverse()){if(claims.some(c=>c.case&&(TOPIC[c.issue]||c.issue)===topic&&c.cid===m.cid))run++;else break;}score-=3*run;}
   // Friends and professionals who respect each other reach first for what they have in common.
   if(fact.owner==='both'&&(P.stance.w==='respectful'||P.stance.w==='cooperative'||P.stance.f==='respectful'||P.stance.f==='cooperative'))score+=3;
   if(fact.owner==='both'&&(P.stance.w==='hostile'||P.stance.f==='hostile'))score-=3;
   out.push({fact,issue:fact.kind,score,continuation,repeat,lastClaim:last||null});
  }
  // One argument per issue: the strongest fact for it.
  const best=new Map();for(const c of out)if(!best.has(c.issue)||best.get(c.issue).score<c.score)best.set(c.issue,c);
  return [...best.values()].sort((a,b)=>b.score-a.score||a.issue.localeCompare(b.issue));
 }
 function build(cand,P,w,f,L,seed){
  const I=ISSUES[cand.issue],fact=cand.fact,rec={...P.record};
  rec.lastF=P.last?.winner==='f';
  rec.closeAll=L.meetings.filter(m=>m.winner==='f').every(m=>(m.stars||0)>=3);
  rec.fCheated=L.meetings.some(m=>m.cheat==='f');
  const v=vars(null,fact,w,f,rec),mode=modeOf(f,P.stance.f),vw=voice(w);
  const W_=t=>cap(voiced(fill(t,v),'w',f)),F_=t=>cap(voiced(fill(t,v),'f',f)),X_=t=>cap(voiced(fill(t,v),'x',f));
  const prop={};for(const k of Object.keys(I.prop))prop[k]=W_(I.prop[k]);
  let propLine=deliver(vw,prop),counter=F_(I.f[mode]);
  if(cand.continuation){propLine=W_(I.again)+' '+propLine;counter=F_(AGAIN[mode])+' '+counter;}
  else if(cand.repeat){propLine=W_(REPEAT_W[cand.issue]||'Not for the first time, {F}.')+' '+propLine;counter=F_(REPEAT_F[mode])+' '+counter;}
  const evidence=fact.text||factText(fact,w,f);
  const responses={};
  for(const [id,r] of Object.entries(I.r)){
   const reply=typeof r.reply==='string'?r.reply:(r.reply[mode]||r.reply.evidence);
   let commit=null;
   if(r.commit==='repeat'){
    const t=fact.d?.type;
    commit=t==='counter'?{kind:'counter',families:fact.d.families||null,node:'question',say:fact.d.say,tacticLabel:fact.d.label||null,label:'Promise it again',hint:'Follows from what you just said. Only a real reversal late in the match counts.'}:
     t==='clean'?{kind:'clean',node:'clean',say:fact.d.say,label:'Promise it again',hint:'Follows from what you just said. Kept only if nobody cheats and it ends clean.'}:
     t==='nocheat'?{kind:'nocheat',node:'clean',say:fact.d.say,label:'Promise it again',hint:'Follows from what you just said. Kept only if you do not cheat.'}:
     t==='finisher'?{kind:'finisher',node:'finisher',say:fact.d.say,label:'Promise it again',hint:'Follows from what you just said. They will be watching for it.'}:
     t==='outlast'?{kind:'outlast',say:fact.d.say,label:null,hint:null}:
     {kind:'win',node:'vow',say:fact.d.say||('beat '+f.short),label:'Promise it again',hint:'Follows from what you just said. A public prediction of victory.'};
   }else if(r.commit)commit={...r.commit};
   if(commit){for(const k of ['label','hint','tacticLabel'])if(commit[k])commit[k]=X_(commit[k]);
    if(commit.say){commit.say=fill(commit.say,v);commit.sayW=voiced(commit.say,'w',f);commit.sayX=voiced(commit.say,'x',f);}
    if(commit.families==='{FAMILIES}')commit.families=v.FAMILIES||null;}
   const fx={...r.fx};if(id==='callback'){fx.crowd=(fx.crowd||0)-3;fx.heat=(fx.heat||0)-2;fx.cred=(fx.cred||0)-2;}
   const out={label:X_(r.label),hint:X_(r.hint),line:W_(r.line),res:fill(r.res,v),rel:Number(fill(String(r.rel),v)),fx,reply:F_(reply),commit,noPromise:!!r.noPromise};
   // An answer that relies on a charge the speaker is guilty of too can be thrown back at them.
   if(r.expose){const ex=P.facts.find(x=>x.kind===r.expose);if(ex){out.expose={kind:r.expose,line:exposeLine(r.expose,ex,w,f)};}}
   responses[id]=out;
  }
  return {v:1,id:cand.issue+':'+fact.id,issue:cand.issue,factId:fact.id,factCid:fact.cid,family:I.family,owner:I.owner,angle:I.angle,
   label:X_(I.label),hint:'On the record: '+evidence,thesis:X_(I.thesis),evidence,intent:X_(I.intent),target:X_(I.target),
   continuation:cand.continuation,repeat:!!cand.repeat,mode,prop:propLine,counter,lead:fill(LEAD[voice(f)]||'',v),responses,
   push:pushLines(cand.issue,w,f,v),reminder:cand.continuation&&cand.lastClaim?('Unresolved from last time: '+(cand.lastClaim.thesis||cand.lastClaim.evidence)):null,
   used:false,raisedBy:null,response:null,resolution:null,commit:null,exposed:false,fConceded:false,followup:null};
 }
 function exposeLine(kind,fact,w,f){
  if(kind==='cheat_w')return 'Cannot win fairly? '+(fact.d.when==='last time'?'Last time':cap(fact.d.when))+' you beat me with '+fact.d.detail+', '+w.short+'. Do not lecture me.';
  return 'Look at your own record before you lecture me, '+w.short+'.';
 }
 // When the other wrestler throws the charge back, the speaker can stand firm or revise.
 function pushLines(issue,w,f,v){
  return {firm:{label:'Stand firm',hint:'Hold the line despite your own record. Needs presence; it can backfire.',
    line:'I know what I did, '+f.short+'. It does not change what you did.',ok:'Fair enough. We both know.',fail:'Listen to them. They do not believe you either.'},
   revise:{label:'Revise your position',hint:'Admit you are no better, and change what you are asking for. Credible.',
    line:'Fine. We have both cut corners. Tonight neither of us does.',reply:'Neither of us. I will hold you to that.'}};
 }

 // Up to two arguments for tonight: the strongest, and one that belongs to the other side or uses a
 // different opening, so the player has a real choice about which conversation to have.
 function casesFor(st,c,w,f){
  if(!G.S)return [];
  const L=ledger(w.id,f.id);if(!L||(!L.meetings.length&&!root.OfficeBonds?.get?.(w.id,f.id)))return [];
  const P=profile(w.id,f.id);if(!P.facts.length)return [];
  const list=candidates(L,P,w,f).filter(x=>x.score>0);if(!list.length)return [];
  const first=build(list[0],P,w,f,L,st.seed);
  const second=list.slice(1).find(x=>ISSUES[x.issue].angle!==first.angle&&(ISSUES[x.issue].owner!==first.owner||x.score>=list[0].score-2));
  return second?[first,build(second,P,w,f,L,st.seed)]:[first];
 }

 // The interviewer's opening question, in public words only.
 function introFor(core){
  const cs=core?.cases;if(!cs?.length||!G.S)return null;
  const L=ledger(core.w.id,core.f.id),n=L?.meetings.length||0,rec=L?record(L):{w:0,f:0};
  const top=cs[0];
  const count=n===1?'They have met once before.':n>1?'This is meeting number '+(n+1)+'.'+(/^record/.test(top.issue)?'':' '+core.w.short+' '+rec.w+', '+core.f.short+' '+rec.f+'.'):'';
  if(top.continuation)return count+' '+top.evidence+' That argument has not been settled. Where does it stand tonight?';
  return (count+' '+top.evidence+' '+core.w.short+', what do you say to that?').trim();
 }

 // ---------------------------------------------------------------------------------------------
 // RECORDING. After the bell the meeting, the argument, any commitment and any negotiation are written
 // to the ledger once per contract. This layer awards nothing of its own: promises are already paid
 // for by the promo layer and moods by memory and the locker room; this is the shared history.
 function verdict(kind,m,ev,families){
  if(kind==='clean')return m.how==='clean'&&!m.cheat&&!(ev?.dirty?.w||ev?.dirty?.f)?'kept':'broken';
  if(kind==='nocheat')return m.cheat==='w'||ev?.dirty?.w?'broken':'kept';
  if(kind==='finisher')return null;
  if(kind==='outlast'){if(!m.stamina)return null;return m.outlasted==='w'||(m.stamina.w-m.stamina.f>=10&&m.stamina.f<45)?'kept':'broken';}
  if(kind==='win')return m.winner==='w'?'kept':'broken';
  if(kind==='counter'){if(!ev)return null;return ev.late.w>0&&(!families||families.some(x=>ev.families.w.includes(x)))?'kept':'broken';}
  return null;
 }
 const GENERIC_RES={turn:'defended',calm:'reframed',challenge:'reframed',personal:'unresolved',callback:'withdrawn',confession:'unresolved',fakeout:'withdrawn'};
 const ANGLE_FAMILY={people:'mutual_recognition',proof:'ability',imagery:'psychological',accusation:'personal_grievance',swagger:'status',hometown:'psychological',numbers:'past_results'};
 function recordMatch(c,fin,out){
  const w=G.W(c.wid),f=G.F(c.rid);if(!w||!f)return;
  const L=ledger(w.id,f.id,c.id);if(L.done[c.id])return;L.done[c.id]=1;
  const m=meetingFrom(c,fin,w,f,L.meetings.length+1);
  const h=G.S.history.find(x=>x.cid===c.id);
  const pr=fin.promo||null;
  if(pr?.promise&&pr.promise.type&&pr.promise.type!=='none'&&h?.promo?.promise?.checked){
   m.promise={type:pr.promise.type,kept:!!h.promo.promise.kept,say:sayPromise(pr.promise.type,pr.tactic,pr.case?.commit,f,w),families:pr.tactic?.families||null,label:pr.tactic?.label||null,
    sure:(pr.promise.type==='win'&&String(c.finish).startsWith('win'))||(pr.promise.type==='clean'&&['win_clean','lose_clean'].includes(c.finish))};
  }
  const cs=pr?.case||null;
  if(cs?.commit&&!(m.promise&&cs.commit.node&&cs.commit.official)){
   const vd=verdict(cs.commit.kind,m,fin.evidence,cs.commit.families);
   if(vd)m.commit={kind:cs.commit.kind,say:cs.commit.say,families:cs.commit.families||null,verdict:vd};
  }
  L.meetings.push(m);L.meetings=L.meetings.slice(-LIMIT.meetings);L.meetings.forEach((x,i)=>{x.n=i+1;});
  const notes=[];
  if(cs&&cs.used){
   L.claims.push({cid:c.id,n:m.n,issue:cs.issue,factId:cs.factId,family:cs.family,owner:cs.owner,raisedBy:cs.raisedBy,case:true,thesis:cs.thesis,evidence:cs.evidence,
    prop:cs.prop,counter:cs.counter,mode:cs.mode,response:cs.response,resolution:cs.resolution||'unresolved',exposed:!!cs.exposed,fConceded:!!cs.fConceded,
    commit:cs.commit?{kind:cs.commit.kind,say:cs.commit.say,verdict:m.promise&&cs.commit.official?(m.promise.kept?'kept':'broken'):m.commit?.verdict||null}:null});
   const c0=L.claims.at(-1);
   notes.push('The argument: '+cs.thesis+' '+({conceded:w.short+' conceded the point.',defended:w.short+' stood by it.',reframed:w.short+' turned it into something else.',withdrawn:w.short+' dropped it.',unresolved:'Nobody gave an inch. It is not settled.'}[c0.resolution]||'')+
    (c0.commit?.verdict?' '+cap(voiced(c0.commit.say,'x',f))+': '+(c0.commit.verdict==='kept'?'done.':'not done.'):''));
  }else if(pr&&pr.path?.length){
   const open=pr.path[0]?.id,ans=pr.path[1]?.id;
   L.claims.push({cid:c.id,n:m.n,issue:'angle:'+open,factId:null,family:ANGLE_FAMILY[open]||'psychological',owner:'w',raisedBy:'w',case:false,thesis:pr.claim?.thesis||null,evidence:null,
    prop:(pr.dialogue||[]).find(d=>d.speaker===w.name)?.line||null,counter:null,mode:null,response:ans||null,resolution:GENERIC_RES[ans]||'unresolved',exposed:false,fConceded:false,commit:null});
  }
  L.claims=L.claims.slice(-LIMIT.claims);
  const neg=fin.roomNegotiation||null;
  if(neg){
   const beat=(fin.evidence?.beats||[]).find(b=>b.id===neg.slot);
   L.talks.push({cid:c.id,n:m.n,issue:neg.issue,by:neg.by,slot:neg.slot,original:neg.original?.label||null,final:neg.final?.label||null,reply:neg.reply?.kind||'agreed',delivered:beat?.status||null});
   L.talks=L.talks.slice(-LIMIT.talks);
   if(beat)notes.push('Backstage change ('+neg.summary+'): '+(beat.status==='achieved'?'it came off.':beat.status==='adapted'?'it was adapted in the ring.':'it never happened.'));
  }
  // One plain line about where the rivalry stands now.
  const rec=record(L),st=stance(L,w,f);
  if(L.meetings.length>=2)notes.push('Rivalry record: '+w.short+' '+rec.w+', '+f.short+' '+rec.f+'. '+w.short+' is '+st.w+'; '+f.short+' is '+st.f+'.');
  for(const t of notes){out?.push?.({text:t,tone:0});h?.notes?.push(t);}
 }
 const applied=G.applyResult;
 G.applyResult=function(c,fin){
  const seen=!!(c&&G.S?.rivalries?.[keyOf(c.wid,c.rid)]?.done?.[c.id]);
  const out=applied(c,fin);
  if(!seen&&c&&fin&&G.S){try{recordMatch(c,fin,out);}catch(e){if(root.OFFICE_STRICT)throw e;}G.save?.();}
  return out;
 };

 // ---------------------------------------------------------------------------------------------
 // BACKSTAGE. A real reason for one wrestler to propose a change to the running order, from the
 // rivalry's history or the wrestlers' condition. Never invented: no reason, no negotiation.
 function scoutedFamilies(wid,rid){
  const L=G.S?ledger(wid,rid):null;if(!L)return {byF:[],byW:[],reversedFinisher:false,injuredW:false,lostRun:0,lastTalk:null};
  const recent=L.meetings.slice(-2),byF=new Set(),byW=new Set();
  for(const m of recent){for(const x of m.families?.f||[])byF.add(x);for(const x of m.families?.w||[])byW.add(x);}
  return {byF:[...byF],byW:[...byW],reversedFinisher:recent.some(m=>m.reversedFinisher==='f'),injuredW:recent.some(m=>m.injured?.w),
   lostRun:streak(L).side==='f'?streak(L).n:0,lastTalk:L.talks.at(-1)||null,meetings:L.meetings.length};
 }

 root.OfficeRivalry={ledger,profile,facts:(w,f)=>profile(w,f).facts,casesFor,introFor,stance:(wid,rid)=>profile(wid,rid).stance,record:(wid,rid)=>G.S?record(ledger(wid,rid)):{w:0,f:0},
  scoutedFamilies,ISSUES,ROUTE,FAMILY_WORD,modeOf,deliver,verdict,meetingFrom,keyOf,sayPromise,voiced};
})(typeof window!=='undefined'?window:globalThis);
