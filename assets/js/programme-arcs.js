/* THE OFFICE v0.3.26 — programme arcs.
   Every signed programme has a playable chapter at each contracted match. The booker's dates,
   opponents and finishes remain binding; the player's creative direction changes the story the
   crowd follows. Results and promo performance feed the next chapter, not a second booking engine.
   Stored with the programme (and on its completed record); older careers acquire an arc lazily. */
(function installProgrammeArcs(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData,P=root.OfficeProgrammes;
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
 const F=(id)=>G.W(id)||D.findWrestler(id)||{};
 const name=id=>F(id).short||F(id).name||id;
 const STAGES={
  title:[
   {name:'The case for a title shot',ask:'The champion has the belt. What makes your wrestler worth watching on the way there?',
    steady:['Earn the next rung','Win tonight on merit. Keep the claim credible.','You said this chase had to be earned. What can you show us tonight?'],
    needle:['Make the champion watch','Put the champion on notice. A hotter argument, with more to lose.','The champion is not in this match. Why should they be listening?'],
    gamble:['Promise you will take the title','Make a public claim the ring will have to back up. A big night or an embarrassing one.','Are you promising that belt is coming home with you?']},
   {name:'The champion is listening',ask:'You have a date on the card. How do you make tonight more than another result?',
    steady:['Build the evidence','Let another performance make the argument.','You have been climbing the card. What does tonight add to your case?'],
    needle:['Demand the champion answers','Make their silence part of the story.','The champion still has not answered. What are you going to do about it?'],
    gamble:['Put your reputation on the line','Invite the crowd to judge the whole chase by this performance.','If you cannot deliver tonight, what was all this talk for?']},
   {name:'The title match',ask:'The contracted finish is already decided. What story do you tell before the bell?',
    steady:['Let the title match speak','Keep the focus on the wrestling and the belt.','The title match is finally here. How should people remember this?'],
    needle:['Get in the champion’s head','Try to move the room before the bell rings.','The champion has heard you for weeks. What is the last thing you want them to hear?'],
    gamble:['Stake your name on the belt','Make the strongest possible public claim. If the performance falls short, the crowd will remember.','Your whole chase comes down to tonight. What are you putting on the line?']}
  ],
  grudge:[
   {name:'The first score',ask:'People know there is bad blood. What part of it do you put in front of the crowd?',
    steady:['Demand an answer in the ring','Keep the dispute about wrestling.','There is history between you two. What needs answering tonight?'],
    needle:['Put the insult on record','Force your opponent to answer a specific accusation.','What did they do that you have not forgotten?'],
    gamble:['Make the feud personal','Turn a sporting grudge into a matter of pride. It could backfire.','Is this still about winning a wrestling match?']},
   {name:'The grievance grows',ask:'They have met before. People remember the result; how do you move the argument on?',
    steady:['Answer with another match','The result should count more than the insults.','Last time did not settle it. What would tonight prove?'],
    needle:['Throw their words back','Use the first meeting as ammunition.','You both had your say last time. What did they get wrong?'],
    gamble:['Refuse to let it end quietly','Risk losing the crowd by turning the pressure up.','You seem determined to make this bigger. How far will you go?']},
   {name:'The last word',ask:'The promoter has booked a final date. The fight and the argument both need an ending.',
    steady:['Settle it between the ropes','Make the blow-off about the match, not another excuse.','One last meeting. Is that enough to end it?'],
    needle:['Demand they admit it','Go after the one thing the opponent still will not concede.','Even if they win, what do you need to hear them admit?'],
    gamble:['Put the whole feud on the line','Make the last match a referendum on everything said.','You have both spent weeks on this. What if tonight does not go your way?']}
  ],
  rise:[
   {name:'A place on the card',ask:'A wrestler near the bottom of the bill is being pushed. Make the first appearance count.',
    steady:['Show you belong','Start with a strong performance, not a speech.','Why does the booker think you belong higher up the card?'],
    needle:['Ask for tougher opposition','Make the others on the bill take notice.','Who on this card are you ready to make uncomfortable?'],
    gamble:['Promise a breakthrough','Talk like a headliner before you have earned the spot.','You have barely started climbing. Are you calling yourself the future already?']},
   {name:'The bigger rooms',ask:'The position is improving, but every step raises the expectations.',
    steady:['Prove it was no accident','Build on the last performance and keep learning.','Last time put you on people’s radar. Can you do it again?'],
    needle:['Call out the established names','Use your new standing to challenge the people above you.','Who is afraid of losing their place to you?'],
    gamble:['Demand top billing','Tell the town you are ready for a main event.','What happens if the main event is too big for you?']},
   {name:'The main-event test',ask:'The push has led to a match with a big name. What does the night stand for?',
    steady:['Take the opportunity seriously','Win respect through the match, whichever way it goes.','This is the biggest night of your push. What is enough for you?'],
    needle:['Question the old order','Make the established star defend their position.','Does your opponent still deserve that place at the top?'],
    gamble:['Bet your future on this night','Promise that the old order ends now. The crowd will judge hard.','You have been asking for the spotlight. What if it burns?']}
  ]
 };
 const BAND=[{min:70,name:'The town is talking'},{min:55,name:'Gathering steam'},{min:35,name:'Still in the balance'},{min:0,name:'Losing the crowd'}];
 function band(n){return BAND.find(x=>n>=x.min).name;}
 function locate(c){
  if(!c?.programme||!G.S?.territory)return null;
  const st=P.state(G.S.territory);
  const prog=[...st.live,...st.done].find(x=>x.id===c.programme.id);
  const step=c.programme.step;
  return prog&&Number.isInteger(step)&&step>=0&&step<prog.beats.length?{prog,step,st}:null;
 }
 function chapter(prog,step){
  const parts=STAGES[prog.type];if(!parts)return null;
  return parts[step===prog.beats.length-1?2:step===0?0:1];
 }
 function arc(prog){return prog.arc??(prog.arc={v:1,momentum:45,timeline:[]});}
 function record(id){const st=P.state(G.S?.territory);return [...(st?.live||[]),...(st?.done||[])].find(x=>x.id===id)||null;}
 function previous(prog,step){return arc(prog).timeline.filter(x=>x.step<step).sort((a,b)=>b.step-a.step)[0]||null;}
 function options(c){
  const x=locate(c);if(!x)return null;
  const ch=chapter(x.prog,x.step),a=arc(x.prog),last=previous(x.prog,x.step);
  const follow=last?`Last chapter: ${last.recap}`:x.step>0?'The earlier chapters were booked before this feature was added.':null;
  return {id:x.prog.id,step:x.step,total:x.prog.beats.length,title:ch.name,ask:ch.ask,follow,
   mood:band(a.momentum),momentum:a.momentum,
   choices:['steady','needle','gamble'].map(id=>({id,label:ch[id][0],hint:ch[id][1],cue:ch[id][2],risk:id==='steady'?'Low risk':id==='needle'?'Needs a strong promo':'Needs a standout promo and match'}))};
 }
 function intro(c,id){
  const x=options(c);if(!x)return null;
  const pick=x.choices.find(o=>o.id===id)||x.choices[0];
  return {id:pick.id,prompt:pick.cue,read:`Programme, chapter ${x.step+1} of ${x.total}: ${x.title}. ${x.follow||x.ask}`,mood:x.mood};
 }
 // Called at the bell only, so going backstage or reloading cannot award anything early.
 function prepare(c,id,promo){
  if(!locate(c))return null;
  const allowed=options(c).choices;
  const pick=allowed.find(x=>x.id===id)||allowed[0];
  c.arcDecision={id:pick.id,quality:promo&&Number.isFinite(promo.quality)?promo.quality:null,
   meter:Number.isFinite(promo?.duel?.meter)?promo.duel.meter:null};
  return c.arcDecision;
 }
 // A public claim and an entertaining segment are not the same achievement.
 // The booker's finish still stands. A wrestler may entertain the crowd but fail a promise.
 function claimResult(prog,step,id,spoken,won,wonTitle){
  if(id!=='gamble'||!spoken)return null;
  if(prog.type==='title'&&step===0)return 'pending'; // "I will take the title" is settled at the finale.
  if(step===prog.beats.length-1&&['title','grudge','rise'].includes(prog.type))return (prog.type==='title'?wonTitle:won)?'kept':'broken';
  return null; // Other gambles promise a standout performance, measured by stars and promo quality.
 }
 function settle(c,fin){
  const x=locate(c);if(!x)return null;
  const {prog,step}=x,a=arc(prog);
  if(a.timeline.some(y=>y.step===step))return null;
  const id=['steady','needle','gamble'].includes(c.arcDecision?.id)?c.arcDecision.id:'steady';
  const chapterNow=chapter(prog,step);
  const quality=c.arcDecision?.quality??(Number.isFinite(fin?.promo?.quality)?fin.promo.quality:null);
  const stars=Number.isFinite(fin?.stars)?fin.stars:0;
  const outcome=root.OfficeOutcome?.interpret?.(c,fin);
  const endedNormally=outcome?outcome.contractHonoured:(fin?.outcome!=='double'&&fin?.outcome!=='nc'&&fin?.outcome!=='dq');
  const spoken=Number.isFinite(quality); // No microphone performance cannot pass a microphone-dependent gamble.
  const passed=endedNormally&&(id==='steady'?stars>=2.5:id==='needle'?stars>=2.75&&spoken&&quality>=55:stars>=3.5&&spoken&&quality>=65);
  const final=step===prog.beats.length-1,won=outcome?.winner==='w';
  // Winning a match by DQ is not the same as winning the championship.
  const wonTitle=prog.type==='title'&&root.OfficeTerritory?.title?.(prog.pid,prog.div)?.holder===prog.wid;
  let claim=claimResult(prog,step,id,spoken,won,wonTitle);
  // An emphatic public claim of a win must be proved by the result, not by the star rating.
  if(claim==='kept'&&!endedNormally)claim='broken';
  const claimDelta=claim==='kept'?3:claim==='broken'?-6:0;
  const delta=(passed?{steady:5,needle:9,gamble:14}[id]:{steady:-3,needle:-6,gamble:-10}[id])+claimDelta;
  a.momentum=clamp(a.momentum+delta);const w=G.W(prog.wid),p=G.P(prog.pid);
  // These are modest consequences. The contracted match result, title and bonus remain the booker's.
  if(w)w.heat=clamp((w.heat||0)+(passed&&id!=='steady'?2:!passed&&id==='gamble'?-2:0));
  if(p&&id==='gamble'&&!passed)p.trust=clamp(p.trust-1);
  const worked=passed?'landed with the crowd':'did not convince the crowd';
  const claimWords={pending:'The promise is still outstanding',kept:'The public claim was backed up',broken:'The public claim was not delivered'};
  let recap=`${chapterNow[id][0]} ${worked} (${stars.toFixed(2)}★${quality==null?'':`, microphone ${Math.round(quality)}`}).`;
  if(claim)recap+=' '+claimWords[claim]+'.';
  const entry={step,cid:c.id,choice:id,chapter:chapterNow.name,at:c.eventAbs??G.abs(),stars,quality,passed,claim,delta,recap};
  a.timeline.push(entry);a.timeline.sort((u,v)=>u.step-v.step);
  if(final){
   // Resolve an earlier title promise against the actual championship result.
   for(const prev of a.timeline.filter(e=>e.claim==='pending')){
    prev.claim=wonTitle&&endedNormally?'kept':'broken';
    prev.recap=prev.recap.replace('The promise is still outstanding.',claimWords[prev.claim]+'.');
    a.momentum=clamp(a.momentum+(prev.claim==='kept'?3:-6));
   }
   const brokenClaim=a.timeline.some(e=>e.claim==='broken');
   a.conclusion=prog.status==='broken'?'The programme fell apart':a.momentum>=70?'The story caught fire':a.momentum>=50?'The build paid off':a.momentum>=35?'The finish arrived, but the build was uneven':'The programme ran its course without winning the room';
   // Brilliant consistent work can earn recognition without repeatedly taking the highest-risk gamble.
   const excellent=a.timeline.length===prog.beats.length&&a.timeline.every(e=>e.passed&&e.stars>=4);
   const recognition=prog.status==='broken'?0:a.momentum>=70?(brokenClaim?1:2):excellent?1:0;
   if(recognition&&G.S){G.S.rep=clamp((G.S.rep||0)+recognition);a.recognition=recognition;}
  }
  G.save();
  return {text:`${final?'Programme finale':'Programme chapter '+(step+1)}: ${recap} ${band(a.momentum)}${final&&a.recognition?' · reputation +'+a.recognition+'.':'.'}`,tone:passed?1:-1};
 }
 const originalBook=G.book;
 G.book=function(oid,wid){
  const offered=G.S?.offers?.find(o=>o.id===oid)?.programme?.id;
  const out=originalBook.call(this,oid,wid);
  if(out==null&&offered){const pr=record(offered);if(pr)arc(pr);}
  return out;
 };
 const originalApply=G.applyResult;
 G.applyResult=function(c,fin){
  const out=originalApply.call(this,c,fin);
  if(!Array.isArray(out))return out;
  const note=settle(c,fin);if(note)out.push(note);
  return out;
 };
 // The post-bell segment remains a real choice. Its opening line acknowledges the continuing arc.
 const after=root.OfficeAfter;
 if(after?.begin){const originalAfter=after.begin;
  after.begin=function(c,fin,plan){
   const st=originalAfter.call(this,c,fin,plan),x=locate(c);if(!st||!x||st.stage!=='mic')return st;
   const a=arc(x.prog),next=x.prog.beats.findIndex((b,k)=>k>x.step&&!b.done&&!b.missed);
   const text=next>=0?`${name(x.prog.wid)} has another date with ${name(x.prog.beats[next].rid)} on the book. ${band(a.momentum)}.`:
    `That was the last contracted match. ${a.conclusion||'The programme is over'}.`;
   st.log.push({side:'stage',who:null,text});after.recordEvidence?.(st);G.save();return st;
  };
 }
 root.OfficeProgrammeArcs={STAGES,band,chapter,options,intro,prepare,settle,locate,arc,record};
})(typeof window!=='undefined'?window:globalThis);
