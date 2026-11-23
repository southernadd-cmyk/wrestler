/* THE OFFICE v2 — match commentary: the lines, Vic Bellamy's colour, and the say/fill helpers.
   Moved out of match-engine.js with no change in behaviour. The engine passes in the helpers the
   commentary shares with it (see install() in match-engine.js); the commentary reads them through $d. */
(function(root){'use strict';
const installCommentary=function($d){
const LINES={
 open:['Lock-up in the centre. Neither gives an inch.','{A} grabs a side headlock. {D} shoots off the ropes.','Clean break in the corner. A few claps from the seats.','{A} takes {D} down with {move}. Early statement.','They trade wristlocks. Feeling each other out.','{D} rolls to the floor to reset. {A} waits in the ring.','Chop from {A}. That one echoed round the building.'],
 shine:['{A} with {move}! {D} is reeling.','{A} is all over {D} early on.','{A} follows up with {move}. Quick cover. One, and out.','Three arm drags in a row from {A}. {D} bails to the corner.','{A} is moving well tonight.','{D} tries to slow it down. {A} won’t let it happen.'],
 heat:['{A} cuts {D} off with {move}.','{A} slows this right down. Rest hold in the middle.','{A} rakes the eyes behind the referee’s back.','{D} is in trouble. {A} is working the {part}.','Choke on the bottom rope from {A}. The referee counts to four.','{A} stands on {D}’s hand and grins at the front row.','{A} with {move}. Cover. Two. {D} gets a shoulder up.'],
 comeback:['{A} is firing up!','{A} ducks a clothesline. {move}!','{A} with {move}! And another!','Hope spot! {A} rolls {D} up. Two, and {D} escapes.','Fists flying from {A}. The crowd count along with every one.','{A} catches a boot and turns it into {move}.'],
 stretch:['{A} goes for {fin}. {D} wriggles free!','Reversal after reversal. Neither can land the big one.','{A} with {move}! Both down. The referee starts a count.','Both on their knees, trading forearms in the middle.','{A} counters into {move}! Cover. Kick out at one.','{A} signals for {fin}. {D} sees it coming.']
};
const HOPE=['{A} fights from underneath with {move}!','Hope spot! {A} rolls {D} up. Two, and {D} escapes.','{A} slips out the back and hits {move}. {D} cuts it off straight away.','{A} tries to fire back. The crowd try to help.'];
const NEUTRAL=['Both back to their feet at the same time.','Stand-off in the middle. The referee checks on both.','Strike exchange. Neither backs down.'];
/* More original commentary, organised by match phase rather than selected blindly. */
LINES.open.push('A low stance from {A}; {D} is keeping a safe distance.','{A} shoots in for the legs. {D} sprawls and circles out.','{A} tests the ropes, then changes direction.','{D} catches the first attempt; nobody is giving anything away.','{A} offers a test of strength. {D} thinks twice.','They go collar and elbow, boots squeaking on the canvas.','{A} rolls through the hold and comes up with the wrist.','The referee asks for a clean break; {A} lets go at four.','A quick exchange of counters. Both wrestlers reset.');
LINES.shine.push('{A} plants {D} with {move}; the crowd appreciate the timing.','{A} ducks low, springs up and takes control.','A rapid exchange ends with {A} on top.','{D} misses the charge; {A} makes the opening count.','{A} has found the rhythm of this contest.','{D} backs towards the corner, trying to stop the momentum.','{A} hits {move}, floats over and hooks the leg.','A lovely transition from {A}; {D} is having to think quickly.');
LINES.heat.push('{A} drives an elbow into the shoulder and holds on.','{A} denies {D} space to recover.','The pace drops to the one {A} wants.','A hard counter sends {D} stumbling into the turnbuckles.','{A} traps the arm and leans on {D}. The referee watches closely.','{D} tries to crawl free, but {A} cuts off the ring.','{A} hears the jeers and slows the contest even further.','{A} delivers {move}. {D} has no time to breathe.','A sharp knee to the midsection: {A} is picking a target.');
LINES.comeback.push('{A} springs off the ropes and connects with {move}!','The crowd surge forward as {A} finds a second wind.','A desperation counter from {A} changes the whole match.','{D} swings wildly. {A} ducks and answers with {move}.','{A} keeps moving; {D} cannot get a hand on them.','One shot, two shots, a third — {A} has changed gears.','{A} catches {D} with {move}, then signals for more.','That opening was tiny, but {A} made the most of it.');
LINES.stretch.push('A tired exchange of counters; neither wants to make the final mistake.','{A} reaches for {fin}, but {D} refuses to give up the position.','{D} crawls to the ropes as {A} closes in.','{A} lands {move}! The referee drops for the cover.','A desperate escape from {D}; the finish feels close now.','They trade strikes on shaking legs.','The whole room rises as {A} points to the corner.','One more clean opening may be all {A} needs.');
HOPE.push('{A} desperately rolls the shoulder and scrambles clear.','{A} lands {move}, but cannot turn the advantage into a cover.','A flash of offence from {A}. {D} stamps it out.','{A} catches the arm, twists through, and finds a moment to breathe.');
NEUTRAL.push('The referee separates them. Neither looks happy about it.','A moment of hesitation — both know what a mistake could cost.','The audience can sense the balance changing.','One exchange too many and both need a moment to reset.');

const rnd=(M,a)=>a[Math.floor(M.r()*a.length)];
// ---- Vic Bellamy, colour commentary ----
const VIC={
 nearfall:[
  'I had that at three from here. Somebody get the referee an eye test.',
  'That is what a near-fall is for. That is why you buy a ticket.',
  'Every kick-out costs you something. I should know, I paid for a few.',
  'Two and nine-tenths, {pbp}. You will not see closer than that.',
  'Watch their faces. That kick-out changed what they think is possible.',
  'If that had been me, I would have stayed down and had a lie-in.'
 ],
 spot:[
  'In my day you did that once a year, and only at Christmas.',
  'That is going on the poster. Somebody find a photographer.',
  'I felt that one in my knees, and I am sitting down.',
  'You do not teach that. You either have the nerve or you do not.',
  'The front row have spilled their drinks. That is the review written.',
  'Somebody will be walking funny tomorrow, {pbp}.'
 ],
 open:[
  'They are feeling each other out. Nobody wants to make the first mistake.',
  'I like this. Old-fashioned. Nobody in a hurry.',
  'Look at the footwork on {W}. That is years of leisure centres and church halls.'
 ],
 shine:[
  '{W} is listening to the crowd. The good ones always do.',
  'Never trust a wrestler who smiles in a headlock, {pbp}.',
  '{W} has that look. I had that look once. Then I had the knee operation.'
 ],
 heat:[
  '{F} is slowing it right down. Smart. Annoying, but smart.',
  'If I had a pound for every chinlock I have sat through, I would own this building.',
  'This is the part the crowd pretends not to enjoy. They are loving it.'
 ],
 comeback:[
  'Here it comes. You can hear the building change.',
  '{W} has been waiting for this. So have I. So have my knees.',
  'Momentum is a funny thing, {pbp}. You cannot buy it, but you can lose it in a second.'
 ],
 stretch:[
  'Nobody is thinking about the drive home now.',
  'One mistake ends it. Both of them know it.',
  'I would not want to be the one who blinks first.'
 ],
 hot:[
  'Listen to this place, {pbp}. {venue} is rocking before anyone has touched the ropes.',
  'They are hanging off the balcony tonight. I have not seen it this full since my farewell tour. The first one.',
  'You can feel the floor going. This crowd came to shout.'
 ],
 warm:[
  'A good honest crowd in tonight. They will tell you exactly what they think.',
  'The people of {venue} have turned out. Somebody give them a reason to stand up.',
  'They have paid their money and found their seats. Now it is up to these two.'
 ],
 cold:[
  'A few empty seats tonight, {pbp}. These two will have to win the rest over.',
  'Quiet one so far. Nothing a bit of violence will not fix. Professionally speaking.',
  'Tough crowd. I have been booed out of better buildings than this, and I enjoyed every minute.'
 ],
 feud:[
  'I have watched this rivalry from the start, {pbp}. It has never once been friendly.',
  '{W} and {F} do not like each other. You can see it in every lock-up.',
  'Every time these two meet, somebody leaves with a grudge and a limp.',
  'There is no handshake coming tonight. I would put money on it.',
  'You could sell tickets to these two arguing in a car park.'
 ],
 blowoff:[
  'They say this settles it. In my experience nothing ever settles it, but I hope they are right.',
  'Last chapter, {pbp}. Whoever wins this one gets to stop looking over their shoulder.',
  'If this really is the end of it, I want to remember every second.'
 ],
 loud:[
  'Listen to them. They have forgotten all about last orders.',
  'The whole building is on its feet, {pbp}. Even the bar staff are watching.',
  'I have not heard a crowd like this since they put the ticket prices up.',
  'You cannot buy noise like this. Believe me, I have tried.'
 ],
 flat:[
  'Somebody wake this lot up. They have paid good money to sit on their hands.',
  'It has gone quiet, {pbp}. I can hear the hot dogs.',
  'These two need to find the crowd again, and fast.',
  'I have heard livelier crowds at a funeral. I have wrestled at one, actually. Long story.'
 ],
 great:['That is one for the scrapbook. I will be telling people I was here.','I am not ashamed to say I stood up for that, {pbp}.'],
 good:['Solid. Honest. The sort of match that pays the rent.','Nobody is going home disappointed. That will do nicely.'],
 poor:['Well. They cannot all be classics.','I have seen better matches in a car park. I have wrestled in a few.']
};
function vicRoll(M,tag){let h=2166136261>>>0;for(const c of String(M.o.seed)+'|'+M.t+'|'+tag)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h/4294967296}
function vic(M,tag,chance=1,opt={},list=null){
 const pool=list||VIC[tag];if(!pool?.length||vicRoll(M,tag)>=chance)return null;
 M.vicSaid??=[];let c=pool.filter(x=>!M.vicSaid.includes(x));if(!c.length)c=pool;
 const x=c[Math.floor(vicRoll(M,tag+'#')*c.length)];M.vicSaid.push(x);M.vicAt=M.t;
 return say(M,fill(M,x,{pbp:$d.D.BOOTH?.pbp.short||'partner'}),'story',{...opt,who:'colour'});
}
// Where the two of them sit on tonight's card and on this promoter's card pyramid.
function vicCard(M){
 const out=[],L=M.o.ladder,promo=M.p.name;
 if(M.o.slot==='main')out.push('Main event at {venue}. This is what they all came for.');
 if(M.o.slot==='opener')out.push('Opening match, {pbp}. Set the tone and get them warmed up.');
 if(!L)return out;
 const w=L.w,f=L.f;
 if(L.belt)out.push('The '+L.belt+' is on the line tonight, {pbp}. Win here and you walk out with the gold.');
 else if(L.champ)out.push('That is the '+(L.champName||'circuit champion')+' in there, {pbp}. Everyone in that division wants what '+(L.champ==='w'?'{W}':'{F}')+' has.');
 if(w&&f){
  if(w.slot==='main'&&f.slot==='main')out.push('The top two on the '+promo+' card, {pbp}. It does not get bigger than this round here.');
  else if(w.rank<f.rank-2)out.push('{W} sits well above {F} on the '+promo+' card. {F} would love to drag {W} down a rung or two.');
  else if(f.rank<w.rank-2)out.push('{F} is further up the '+promo+' card than {W}. Beat {F} tonight and people start asking questions.');
  else out.push('{W} and {F} are neck and neck on the '+promo+' card. Whoever wins this takes the next rung.');
 }
 if(!w)out.push('{W} is not even on the '+promo+' rankings yet. A good night here changes that.');
 else if(w.slot==='opener')out.push('{W} is down among the openers at the moment, {pbp}. Nights like this are how you climb.');
 else if(w.slot==='main')out.push('{W} is main-event material on this card now. You can tell by the walk to the ring.');
 if(f?.stable)out.push('{F} has '+f.stable+' behind them. Somebody from that lot will be watching from the back.');
 return out;
}
// Between exchanges Vic picks something to talk about: the stage of the match, the feud, the crowd or the card.
function vicChat(M){
 const card=vicCard(M),heat=M.o.feudHeat||0,said=M.vicSaid||[];
 // Alternative structures get objective-specific commentary, not legacy American beat labels.
 const topics=[root.OfficeSheets?.DIRECTOR?.active(M)?null:M.phase?.id,M.o.blowoff?'blowoff':heat>=35?'feud':null,M.crowd>=75?'loud':M.crowd<35?'flat':null,'card'].filter(Boolean);
 const open=topics.filter(t=>(t==='card'?card:VIC[t]||[]).some(x=>!said.includes(x)));
 if(!open.length)return null;
 const tag=open[Math.floor(vicRoll(M,'topic')*open.length)];
 return vic(M,tag,1,{},tag==='card'?card:null);
}
function fresh(M,a){M.recent??=[];let c=a.filter(x=>!M.recent.includes(x));if(!c.length)c=a.filter(x=>!M.recent.slice(-2).includes(x));if(!c.length)c=a;const x=c[Math.floor(M.r()*c.length)];M.recent.push(x);if(M.recent.length>8)M.recent.shift();return x}
function pick(M,who){const pool=$d.D.MOVES[who.style]||$d.D.MOVES.Story;return rnd(M,pool)}
function names(M){return {W:M.w.short,F:M.f.short,WF:M.w.name,FF:M.f.name,wfin:M.w.finisher,ffin:M.f.finisher,venue:M.p.venue}}
function fill(M,s,extra={}){const n={...names(M),...extra};return s.replace(/\{(\w+)\}/g,(m,k)=>n[k]??m).replace(/(^|[.!?]\s+)([a-z])/g,(m,a,b)=>a+b.toUpperCase())}
// Who is talking. Gloria calls the action, Vic adds colour, Ravi brings word from backstage.
// A "Colour:" or "Road agent:"/"In your ear:" prefix picks the speaker and is dropped from the text.
const VOICE_PREFIX=[[/^Colour: /,'colour'],[/^(?:Road agent|In your ear): /,'runner']];
const KIND_VOICE={play:'pbp',story:'pbp',crowd:'pbp',agent:'runner'};
function say(M,text,kind='play',opt={}){
 // Final defence against legacy narration from old saved graphs or generic texture lines.
 // Do not turn an unrelated phrase (e.g. "pin drop") into fictional action.
 // Only suppress a typed legacy cover or count in submission-only matches.
 if(M.stage==='live'&&M.o?.stip==='submission'&&
   (kind==='count'||opt.eventType==='pin'))return null;
 if($d.noCountout(M)&&/referee (?:is up to|has reached|reaches|begins the count|starts counting|is still counting)|count(?:-?out| is broken)|before (?:the )?referee reaches ten|beat the referee.?s count/i.test(text)){
  text='They fight on without a count-out. Neither wrestler is forced back inside.';
 }
 let who=opt.who;
 for(const [re,v] of VOICE_PREFIX)if(re.test(text)){text=text.replace(re,'');text=text.charAt(0).toUpperCase()+text.slice(1);if(who===undefined)who=v;break}
 if(who===undefined)who=KIND_VOICE[kind]||null;
 const line={t:$d.fmt(opt.at??M.t),text,kind,big:!!opt.big,pause:opt.pause||0,who};
 // Optional booth-only provenance for repetition auditing, not match events.
 if(opt.actionId)line.actionId=opt.actionId;
 if(opt.textureId)line.textureId=opt.textureId;
 M.queue.push(line);M.log.push(line);return line}


/* Phase 6 is deliberately presentation-only: structure acknowledgements are
   emitted after verified graph events; no RNG draw or star modifier is added. */
const STRUCTURE_WORDS={
 classic_american:{
  opening_advantage:'{actor} has established an early edge. That opening is there on the canvas, not just on the running order.',
  pressure:'{actor} has made the pressure count. Now the fightback has something meaningful to overcome.',
  comeback:'There is the earned fightback from {actor}! The earlier pressure was real.',
  payoff:'A genuine payoff to the earlier control and resistance. The story has built towards this moment.'},
 kings_road:{
  technical_exchange:'Both wrestlers have contributed to the technical exchanges. Those holds and counters really happened.',
  escalation:'The wrestling is escalating through heavier attacks. The earlier groundwork is beginning to matter.',
  callback:'That exchange returns to technique they actually used earlier. A detail from the opening has paid off.',
  finish_build:'The finishing stretch is being built through real exchanges, not just a promised spectacular move.'},
 chickenshit_heel:{
  evasion:'There is the deliberate evasion. The avoidance was actually performed.',
  exposure:'The evasion has caught up with the heel. The opponent has genuinely exposed those tactics.',
  shortcut:'That unfair shortcut really happened. The rule-breaking is part of the match, not merely the plan.',
  escape:'There is an actual escape from the pressure. The heel has found a way out of trouble.'},
 dominant_ace:{
  dominance:'{actor} has established control through performed offence. The ace is making that advantage real.',
  challenge:'A genuine challenge to the ace’s control. The dominant wrestler has something to answer.',
  reassertion:'The ace has responded with actual offence and reasserted control.',
  payoff:'That superiority has a witnessed final statement, rather than merely a talking point.'}
};
const STRUCTURE_LABELS={classic_american:'Classic American',kings_road:"King’s Road",
 chickenshit_heel:'Chickenshit Heel',dominant_ace:'Dominant Ace'};
function structureCommentary(M){
 const director=root.OfficeSheets?.DIRECTOR;
 if(!director?.active(M))return;
 const r=director.report(M),plan=M.sheet?.structurePlan?.objectives||[];
 if(!M.structureSpoken){
  // Older resumed bouts must not replay milestones already completed.
  M.structureSpoken=Object.fromEntries(r.objectives.filter(x=>x.status!=='pending').map(x=>[x.id,x.status]));
  return;
 }
 r.objectives.forEach((state,i)=>{
  if(state.status==='pending'||M.structureSpoken[state.id])return;
  const o=plan[i];if(!o)return;
  const performed=state.evidence.find(e=>e.at===state.at);
  if(state.status!=='missed'&&(!performed||!M.graph?.events?.some(e=>e.id===performed.id&&e.t===performed.at)))
   return;
  M.structureSpoken[state.id]=state.status;
  const side=o.actor==='either'?performed?.actor||r.roles.lead:o.actor,
   actor=side==='f'?M.f.short:M.w.short;
  const wording=state.status==='missed'?
   'The window for '+o.title.toLowerCase()+' has passed without sufficient performed evidence. That part of the plan did not come together.':
   (STRUCTURE_WORDS[r.id]?.[o.intent]||'The planned '+o.title.toLowerCase()+' has been supported by real exchanges.')
    .replaceAll('{actor}',actor);
  say(M,wording,'story',{who:'colour',textureId:'structure-'+r.id+'-'+state.id});
 });
}
function structureAssessment(M){
 const report=root.OfficeSheets?.DIRECTOR?.report(M),plan=M.sheet?.structurePlan?.objectives;
 if(!report||!Array.isArray(plan)||plan.length!==report.objectives.length)return null;
 const states=report.objectives,namedCalls=plan.filter(x=>x.call).length;
 let witnessedCalls=0,adaptedCalls=0;
 plan.forEach((o,i)=>{
  if(!o.call)return;
  // A real agreed move may land after the dramatic objective was already
  // resolved. Count it from the physical tape, not the closed objective ledger.
  // A reversal/block belongs to the defender, not the initiating attacker.
  const n=$d.Graph.A[o.call.action],duration=Math.max(1,M.len);
  const witnessed=!!n&&M.graph?.events?.some(e=>{
   if(e.id!==o.call.action||!Number.isFinite(e.t))return false;
   const performer=n.blockOf?(e.preControl==='w'?'f':e.preControl==='f'?'w':null):
    n.reverse?e.control:e.preControl;
   return performer===o.call.owner&&
    e.t/duration>=o.window[0]-.04&&e.t/duration<=o.window[1]+.08;
  });
  if(witnessed)witnessedCalls++;
  else if(['achieved','adapted'].includes(states[i].status))adaptedCalls++;
 });
 const achieved=states.filter(x=>x.status==='achieved').length,
  adapted=states.filter(x=>x.status==='adapted').length,
  missed=states.filter(x=>x.status==='missed').length,
  construction=$d.constructionOf(M);
 const detail={
  classic_american:'The opening, pressure, comeback and payoff are separately evidenced.',
  kings_road:'A callback requires proof that a previous technical exchange occurred.',
  chickenshit_heel:'Evasion, exposure, a shortcut and escape need genuine in-ring actions.',
  dominant_ace:'Control alone is insufficient: a challenge and an answer must follow.'};
 return {version:1,id:report.id,
  planAdherence:{namedCalls,witnessedCalls,adaptedCalls,
   unfulfilledCalls:namedCalls-witnessedCalls-adaptedCalls,
   openObjectives:plan.length-namedCalls,
   explanation:'Named calls count from actual graph actions by the agreed performer in the signed window, even if the broader objective already resolved.'},
  structuralCoherence:{total:states.length,achieved,adapted,missed,witnessed:achieved+adapted,
   explanation:detail[report.id]||'Objectives require time-ordered graph-event evidence.'},
  executionQuality:{stars:$d.stars(M,true),botches:M.botches,psychologyScore:construction.score,
   linkedPairs:construction.linkedPairs,
   explanation:'Existing star calculation only. Structural completion adds no rating bonus.'}};
}


return {HOPE,LINES,NEUTRAL,STRUCTURE_LABELS,fill,fresh,pick,rnd,say,structureAssessment,structureCommentary,vic,vicChat,vicRoll};
};
root.OfficeMatchCommentary={install:installCommentary};
})(typeof window!=='undefined'?window:globalThis);
