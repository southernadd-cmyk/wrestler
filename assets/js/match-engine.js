/* THE OFFICE v2 — live match engine.
   A tick is ten seconds of match time. The engine produces commentary lines one at a time;
   the UI plays them back at a chosen speed and can interrupt with ringside calls.
   The contracted finish is fixed unless the manager deliberately breaks it. */
(function(root){'use strict';
const D=root.OfficeData;
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
function mulberry(seed){let a=seed>>>0;const rng=()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};rng.getState=()=>a;return rng}
const PHASES=[{id:'open',to:.14,name:'Feeling out'},{id:'shine',to:.32,name:'Early advantage'},{id:'heat',to:.56,name:'Sustained control'},{id:'comeback',to:.76,name:'Comeback'},{id:'stretch',to:1.01,name:'Finishing stretch'}];
const CROWD_MUL={open:.45,shine:.8,heat:.6,comeback:1.25,stretch:1.45};
const SPOT_MUL={open:.15,shine:.8,heat:.45,comeback:1.3,stretch:1.6};
const MOM_TARGET={open:0,shine:50,heat:-55,comeback:55,stretch:0};
const PARTS=['lower back','left knee','neck','shoulder','ribs','ankle'];
const the=n=>/’s |'s /.test(n)?n:'the '+n;
const THE=n=>the(n).toUpperCase();
const fmt=s=>{s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};

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


/* THE OFFICE v2.6 — match psychology, ring position and connected sequences */
const Psy=(function installPsychology(){
 const PHASE_ENDS={
  story:[.14,.29,.60,.79,1.01],
  technical:[.20,.36,.61,.77,1.01],
  spots:[.10,.27,.49,.70,1.01],
  brawl:[.09,.24,.60,.78,1.01],
  safe:[.18,.34,.63,.81,1.01]
 };
 function make(M){
  const target=M.o.flags?.pushThrough?'lower back':M.f.style==='Technical'?'left knee':M.f.style==='Brawl'?'ribs':M.f.style==='Spectacle'?'lower back':M.f.sub?'left knee':'shoulder';
  return {position:'standing',control:'neutral',down:null,target,phase:'',heatBeats:0,hopeSpots:0,focusHits:0,changes:0,beats:0,last:'',archetype:M.planId,recentBeats:[],matHolds:0};
 }
 function get(M){return M.story||(M.story=make(M))}
 function sync(M,side){const s=get(M);if(s.control!==side&&s.control!=='neutral')s.changes++;s.control=side;M.mom=side==='w'?Math.max(18,M.mom):side==='f'?Math.min(-18,M.mom):M.mom;}
 function line(M,words,kind='play'){say(M,fill(M,words),kind)}
 function pair(M,words,kind='play'){for(const t of words)line(M,t,kind)}
 function take(M,choices){const s=get(M),pool=choices.filter(x=>!s.recentBeats.includes(x[0]));const choice=rnd(M,pool.length?pool:choices);s.last=choice[0];s.recentBeats.push(choice[0]);if(s.recentBeats.length>4)s.recentBeats.shift();return choice}
 function phase(M){
  const s=get(M),p=M.phase.id;s.phase=p;
  if(s.position==='outside'){pair(M,['The referee is up to six. Both wrestlers scramble back beneath the bottom rope.']);s.position='standing';s.down=null}
  if(p==='open'){
   sync(M,'neutral');s.position='standing';s.down=null;
   line(M,M.planId==='brawl'?'No respectful lock-up here. Both rush forward throwing forearms.':M.planId==='technical'?'They begin with a cautious collar-and-elbow tie-up, testing balance and leverage.':'They circle, keeping their distance. The first lock-up will tell us plenty.');
  }else if(p==='shine'){
   sync(M,'w');s.position='mat';s.down='f';
   pair(M,M.planId==='brawl'?[ '{F} swings a wild right, but {W} ducks and drives {F} back with a shoulder tackle.','{W} stays on top with heavy forearms. {F} has to cover up.' ]:M.planId==='spots'?['{F} rushes in, but {W} leapfrogs and pivots into a dropkick.','{F} lands on the mat. {W} moves quickly to keep the advantage.']:['{F} reaches for control, but {W} slips behind and takes the wrist.','{W} takes {F} over with an arm drag. {F} backs away, reassessing.']);
  }else if(p==='heat'){
   sync(M,'f');s.position='mat';s.down='w';s.focusHits++;
   pair(M,[`{W} presses forward once too often. {F} catches the charge with a hard counter!`,`{F} immediately goes after {W}'s ${s.target}. {W} stays down, trying to protect it.`],'story');
  }else if(p==='comeback'){
   sync(M,'w');s.position='standing';s.down=null;
   pair(M,[`{F} lunges at the damaged ${s.target}. {W} sees it coming and sidesteps!`,`{W} fires back with two forearms. {F} staggers and the crowd comes alive.`],'crowd');
  }else{
   sync(M,'neutral');s.position='standing';s.down=null;
   pair(M,[`Both wrestlers struggle back to their feet. The early advantage means nothing now.`,`{W} and {F} stand opposite one another, breathing hard, each looking for the opening that ends it.`],'story');
  }
 }
 function recover(M){
  const s=get(M),A=s.control==='f'?M.f:M.w,Df=s.control==='f'?M.w:M.f;
  if(s.position==='outside'){
   pair(M,[`The referee has reached six. ${A.short} rolls ${Df.short} back under the bottom rope.`,`The count is broken. They are back inside, and ${A.short} stays close.`]);
   s.position='standing';s.down=null;return true;
  }
  if(s.position==='mat'){
   const fallen=s.down==='w'?M.w:M.f;
   if(fallen){
    if(s.phase==='heat'&&s.down==='w'&&s.matHolds<1&&M.r()<.47){
      line(M,rnd(M,[`${M.f.short} stays on ${M.w.short} and leans into the damaged ${s.target}. ${M.w.short} struggles to turn over.`,`${M.f.short} traps ${M.w.short} on the mat, forcing them to carry weight on the injured ${s.target}.`]));
      s.matHolds++;s.focusHits++;return true;
    }
    s.matHolds=0;
    const phrase=take(M,[
     ['r1',`${fallen.short} rolls to one knee, using the ropes to get upright.`],
     ['r2',`${fallen.short} turns onto a shoulder and slowly pushes up off the canvas.`],
     ['r3',`${fallen.short} crawls away, then uses the middle rope to stand.`],
     ['r4',`${fallen.short} rolls sideways to escape the follow-up and rises cautiously.`],
     ['r5',`${fallen.short} takes a breath on one knee, then gets back to their feet.`],
     ['r6',`${fallen.short} braces against the canvas, staying down until the pressure eases, then rises.`],
     ['r7',`${fallen.short} staggers upright, still feeling the last attack.`]
    ])[1];
    line(M,phrase);s.position='standing';s.down=null;return true;
   }
  }
  if(s.position==='corner'){
   line(M,`${Df.short} braces in the corner. ${A.short} closes in, but ${Df.short} manages to step sideways and get clear.`);
   s.position='standing';return true;
  }
  return false;
 }
 function beat(M){
  const s=get(M),ph=M.phase?.id||'open';s.beats++;
  if(recover(M))return;
  let actions;
  if(ph==='open'){
   if(M.planId==='brawl')actions=[
    ['b1','{W} throws a forearm. {F} answers with one of their own. Neither gives ground.'],
    ['b2','{F} pushes {W} into the ropes. The referee gets between them and orders a break.'],
    ['b3','{W} ducks a swinging arm and takes {F} down with a shoulder tackle. {F} is straight back up.'],
    ['b4','{F} shoves {W} in the face. {W} shoves back. This is going to be physical.']];
   else actions=[
    ['o1','{W} takes a side headlock. {F} pushes towards the ropes and {W} releases cleanly.'],
    ['o2','{F} shoots in for a single leg; {W} sprawls, and they break apart.'],
    ['o3','A test of strength. {W} briefly gets the better leverage before {F} steps around and escapes.'],
    ['o4','{W} reaches for a wristlock. {F} rolls through and counters; both return to their feet.'],
    ['o5','{F} lands a shoulder tackle. {W} springs up, ready to go again.'],
    ['o6','A quick arm drag from {W}; {F} rolls through, and both stand off in the middle.']];
   line(M,take(M,actions)[1]);s.position='standing';return;
  }
  if(ph==='shine'){
   sync(M,'w');const v=take(M,[
    ['s1','{W} catches {F} coming off the ropes with an arm drag. {F} lands on the mat.','mat'],
    ['s2','{W} ducks a lariat and snaps {F} over with a hip toss. {F} rolls out of range.','standing'],
    ['s3','{W} whips {F} towards the corner. {F} takes the turnbuckle hard.','corner'],
    ['s4','{F} attempts a headlock. {W} turns it into a backslide, but {F} kicks free before one.','standing'],
    ['s5','{W} takes the wrist and works a short armbar. {F} makes the ropes and {W} releases on the referee’s call.','standing'],
    ['s6','{W} blocks a strike and lands a snap suplex. {F} is flat on their back.','mat']]);
   line(M,v[1]);s.position=v[2];s.down=v[2]==='mat'?'f':null;return;
  }
  if(ph==='heat'){
   sync(M,'f');s.heatBeats++;
   if(s.heatBeats>=3&&s.heatBeats%4===3){
    s.hopeSpots++;
    const v=take(M,[
     ['h1','{W} fights up with a pair of elbows — the crowd rises — but {F} catches the next shot and wrenches the injured '+s.target+'.'],
     ['h2','{W} finds a backslide! {F} kicks out at one, then drives a knee into the '+s.target+' before {W} can follow up.'],
     ['h3','{W} breaks free and reaches for the ropes. {F} yanks {W} back by the leg and cuts off the escape.'],
     ['h4','A brief surge from {W}: a forearm, a second — then {F} catches the third and sends {W} down again.']]);
    line(M,v[1],'story');s.position='mat';s.down='w';return;
   }
   const grip=s.target==='ribs'?'locks a body scissors around the ribs':s.target==='lower back'?'presses a knee against the lower back':s.target==='left knee'?'torques the left knee': 'twists the shoulder in a hammerlock';
   const v=take(M,[
    ['h5','{F} stamps on {W}’s '+s.target+' and takes a moment to listen to the boos.','mat'],
    ['h6','{W} tries to stand. {F} sweeps the legs and drives an elbow into the '+s.target+'.','mat'],
    ['h7','{F} drags {W} into the centre and '+grip+'. The referee asks whether {W} wants to submit.','mat'],
    ['h8','{F} gives {W} a hard Irish whip, then cuts off the rebound with a knee to the '+s.target+'.','mat'],
    ['h9','{W} reaches for the ropes. {F} releases the hold at four, then pulls {W} back into the ring.','standing'],
    ['h10','{F} traps {W} in the corner and drives in another short strike to the '+s.target+'.','corner']]);
   line(M,v[1]);s.focusHits++;s.position=v[2];s.down=v[2]==='mat'?'w':null;return;
  }
  if(ph==='comeback'){
   sync(M,'w');const v=take(M,[
    ['c1','{W} ducks a clothesline and catches {F} with a jawbreaker. {F} stumbles into the ropes.','standing'],
    ['c2','{F} charges in, but {W} moves aside and connects with a running lariat.','mat'],
    ['c3','{W} fights through the pain in the '+s.target+' and lands a DDT. {F} rolls onto a shoulder.','mat'],
    ['c4','{W} sends {F} across the ring and catches the rebound with a back body drop.','mat'],
    ['c5','{F} tries to grab the '+s.target+' again. {W} counters into a sharp neckbreaker!','mat'],
    ['c6','A quick exchange of forearms, then {W} finally knocks {F} down with a hard clothesline.','mat']]);
   line(M,v[1],M.crowd>=65?'crowd':'play');s.position=v[2];s.down=v[2]==='mat'?'f':null;return;
  }
  // The finishing stretch is a counter battle, not disconnected random moves.
  let attacker=s.control==='w'?M.w:s.control==='f'?M.f:(M.r()<.5?M.w:M.f);
  let defender=attacker===M.w?M.f:M.w;
  if(M.r()<.39){const t=attacker;attacker=defender;defender=t;
   line(M,`${defender.short} reaches for a big move. ${attacker.short} blocks it and turns the tables!`,'story');}
  sync(M,attacker===M.w?'w':'f');
  const v=take(M,[
   ['f1',`${attacker.short} catches ${defender.short} with a short-arm clothesline. ${defender.short} lands heavily.`,'mat'],
   ['f2',`${attacker.short} looks for the waistlock; ${defender.short} fights the grip, but ${attacker.short} manages a snap suplex.`,'mat'],
   ['f3',`${attacker.short} hoists ${defender.short} towards the corner, but ${defender.short} clings to the ropes. Both step back.`,'standing'],
   ['f4',`${attacker.short} attempts a backslide. ${defender.short} rolls a shoulder free before the count begins.`,'standing'],
   ['f5',`${attacker.short} hits a backbreaker. ${defender.short} rolls towards the ropes, buying a few seconds.`,'mat'],
   ['f6',`${attacker.short} drives forward with a forearm. ${defender.short} staggers, but does not go down.`,'standing']]);
  line(M,v[1]);s.position=v[2];s.down=v[2]==='mat'?(defender===M.w?'w':'f'):null;
 }
 function spotSetup(M,A,Df,move){
  const s=get(M),tope=/tope con hilo/.test(move),backdrop=/backdrop over the top rope to the floor/.test(move),
   outside=/floor|ramp|barricade|tope con hilo|over the top rope to the floor|apron/.test(move),
   top=/top rope|450 splash|shooting star|diving elbow/.test(move);
  if(s.position==='outside'&&(!outside||tope||backdrop)){
   line(M,`${A.short} and ${Df.short} climb back into the ring while the referee is counting.`);
   s.position='standing';s.down=null;
  }
  const side=A===M.w?'w':'f';
  if(s.control!=='neutral'&&s.control!==side){
   line(M,`${A.short} blocks ${Df.short}'s next strike and creates just enough space for the big move!`);
  }
  sync(M,side);
  if(tope){
   line(M,`${A.short} sends ${Df.short} over the ropes. ${Df.short} staggers upright on the floor.`);
   line(M,`${A.short} stays inside, rebounds off the opposite ropes and launches through the air!`);
   s.position='outside';s.down=null;
  }else if(backdrop){
   line(M,`${A.short} backs ${Df.short} against the ropes and hooks an arm, preparing a throw over the top.`);
   s.position='outside';s.down=null;
  }else if(outside){
   if(s.position==='outside')line(M,`${A.short} hauls ${Df.short} upright on the floor. The referee is still counting.`);
   else line(M,`${A.short} sends ${Df.short} over the ropes to the floor and follows. The referee begins the count.`);
   if(/apron/.test(move))line(M,`${A.short} pulls ${Df.short} up onto the apron and takes hold of the head.`);
   else line(M,`${A.short} pulls ${Df.short} into position on the floor.`);
   s.position='outside';s.down=null;
  }else if(top){
   line(M,/superplex|top-rope German/.test(move)?`${A.short} hoists ${Df.short} onto the turnbuckle and climbs up after them.`:`${A.short} knocks ${Df.short} down and climbs the ropes, carefully finding a footing.`);
   s.position='top';s.down=Df===M.w?'w':'f';
  }else{
   line(M,`${A.short} pulls ${Df.short} upright and measures the distance for the next move.`);
   s.position='standing';s.down=null;
  }
  return outside;
 }
 function spotAfter(M,A,Df,outside,botch){
  const s=get(M);if(outside){s.position='outside';s.down=null}
  else{s.position='mat';s.down=botch?(A===M.w?'w':'f'):(Df===M.w?'w':'f')}
 }
 function nearfall(M){
  const s=get(M);
  const yoursFirst=!M.o.finish.startsWith('win');
  const yours=M.nearfalls%2===0?!yoursFirst:yoursFirst;
  const A=yours?M.w:M.f,Df=yours?M.f:M.w;
  if(s.position==='outside'){
   line(M,`${A.short} drags ${Df.short} back under the bottom rope. A pin only counts inside the ring.`);
   s.position='standing';s.down=null;
  }
  if(s.position==='mat'&&s.down===(yours?'w':'f')){
   line(M,`${A.short} rolls away from ${Df.short}'s follow-up, then scrambles back to standing.`);
   s.position='standing';s.down=null;
  }
  if(s.control!==(yours?'w':'f')){
   line(M,`${Df.short} swings for a strike, but ${A.short} ducks and turns the opening into a counter!`);
  }
  sync(M,yours?'w':'f');
  const late=M.nearfallAt.length===0&&M.crowd>=67;
  const pop=3+M.crowd*.05*(late?1.4:1);
  if(late&&A.sub){
   line(M,`${A.short} catches the leg and drags ${Df.short} down, trapping them in a submission near the ropes.`,'play');
   line(M,`${Df.short} claws toward the bottom rope, inch by inch.`,'play');
   line(M,`${Df.short} catches the bottom rope! The referee orders a break and ${A.short} releases at four.`,'crowd');
   s.position='mat';s.down=Df===M.w?'w':'f';
  }else{
   const moves=D.MOVES[A.style]||D.MOVES.Story;
   const allowed=moves.filter(x=>!/sleeper|crab|cross armbar|hammerlock|backslide|small package|forearms in the corner|running shooting star|moonsault press/.test(x));
   const strike=rnd(M,allowed.length?allowed:moves);
   line(M,`${A.short} catches ${Df.short} with ${strike}. ${Df.short} lands hard on the canvas!`,'play');
   line(M,`${A.short} immediately hooks the far leg. The referee drops into position.`,'count');
   line(M,'ONE!','count');line(M,'TWO!','count');
   line(M,rnd(M,[`${Df.short} gets the shoulder up just before three!`,`TWO AND A HALF! ${Df.short} escapes at the last moment.`,`NO! ${Df.short} kicks out. The crowd cannot believe it.`]),'crowd');
   s.position='mat';s.down=Df===M.w?'w':'f';
  }
  M.nearfalls++;M.crowd=clamp(M.crowd+pop);M.bonus+=late?8:4;
 }
 return {PHASE_ENDS,make,get,phase,beat,recover,spotSetup,spotAfter,nearfall};
})();


/* THE OFFICE v2.7 — hierarchical causal graph, based on match-psychology research */
const Graph=(function makeGraph(){
 const A={};
 const node=(id,text,opts={})=>{A[id]={id,lines:Array.isArray(text)?text:[text],requires:opts.requires||'standing',next:opts.next||[],zone:opts.zone||'standing',down:opts.down||null,
     reverse:!!opts.reverse,kind:opts.kind||'play',focus:opts.focus||0,crowd:opts.crowd||0,weight:opts.weight||1,styles:opts.styles||null,cost:opts.cost??null,lift:opts.lift??null,
      part:opts.part||null,after:opts.after||0,risk:!!opts.risk,nearfall:!!opts.nearfall,family:opts.family||null,name:opts.name||null,
      counterOf:opts.counterOf||null,blockOf:opts.blockOf||null,blockLift:opts.blockLift??null,agile:!!opts.agile};};
 const e=(id,w=1)=>[id,w];
 // Ring grappling. Transitions are drawn from common observed chain-wrestling sequences.
 node('circle','{A} and {D} circle, each testing the distance before committing.',{next:[e('lockup',5),e('probe_strike',2),e('waistlock',2),e('taunt',1)]});
 node('taunt','{A} spreads their arms, daring {D} to step forward. {D} refuses to rush in.',{next:[e('lockup',4),e('cheap_shot',2),e('probe_strike',3)]});
 node('lockup','Collar-and-elbow. {A} drives forward and {D} fights to stay square.',{next:[e('headlock',4),e('wristlock',4),e('corner_push',2),e('waistlock',2),e('clean_break',1)]});
 node('headlock','{A} takes a side headlock, forcing {D} to carry the weight.',{next:[e('shove_ropes',4),e('headlock_takeover',3),e('headlock_escape',3)]});
 node('shove_ropes','{D} pushes {A} off the ropes to break the headlock. {A} rebounds back.',{next:[e('shoulder_tackle',4),e('duck_rebound',3),e('counter_strike',2)]});
 node('headlock_takeover','{A} uses the headlock to take {D} down onto the mat.',{next:[e('mat_hold',4),e('headlock_escape',3),e('armbar_roll',2),e('mat_scramble',2)],zone:'mat',down:'d'});
 node('headlock_escape','{D} bridges, rolls through the pressure and turns the headlock into a counter!',{requires:'any',reverse:true,next:[e('waistlock',3),e('mat_scramble',2),e('arm_drag',2)]});
 node('wristlock','{A} catches the wrist and turns it over, keeping {D} close.',{next:[e('arm_wringer',4),e('wrist_escape',4),e('hammerlock',2)]});
 node('arm_wringer','{A} twists {D}’s arm and steps across, making the shoulder work.',{focus:1,next:[e('wrist_escape',4),e('arm_drag',3),e('hammerlock',2)]});
 node('wrist_escape','{D} rolls under the trapped arm, reverses the wristlock and takes a new grip.',{reverse:true,next:[e('wristlock',3),e('arm_drag',3),e('hammerlock',2)]});
 node('hammerlock','{A} slides behind into a hammerlock and controls {D}’s arm.',{focus:1,next:[e('elbow_escape',4),e('mat_takedown',3),e('clean_break',1)]});
 node('elbow_escape','{D} throws a back elbow, slips the hammerlock and turns to face {A}.',{reverse:true,next:[e('probe_strike',4),e('waistlock',2),e('snap_suplex',2)]});
 node('waistlock','{A} gets behind with a waistlock. {D} widens their stance to resist.',{next:[e('mat_takedown',4),e('waist_escape',4),e('snap_suplex',2)]});
 node('waist_escape','{D} pries the fingers apart, spins through and takes the back!',{reverse:true,next:[e('mat_takedown',3),e('waistlock',3),e('counter_rollup',2)]});
 node('mat_takedown','{A} trips {D} cleanly and follows to the mat before {D} can regain a base.',{zone:'mat',down:'d',next:[e('mat_hold',4),e('target_hold',3),e('mat_scramble',2)]});
 node('arm_drag','{A} uses the momentum to snap {D} over with an arm drag.',{zone:'mat',down:'d',next:[e('mat_hold',2),e('stand_reset',4),e('early_cover',1)]});
 node('clean_break','The referee calls for a clean break. {A} releases and steps away.',{next:[e('circle',4),e('cheap_shot',2),e('probe_strike',2)]});
 node('corner_push','{A} drives {D} into a corner; the referee orders the break.',{zone:'corner',next:[e('corner_break',3),e('corner_strikes',3),e('corner_knee',2),e('cheap_shot',2)]});
 node('corner_break','{A} backs out of the corner. {D} cautiously steps forward.',{requires:'corner',next:[e('circle',3),e('probe_strike',2)]});
 // Striking, Irish whips, ring positioning.
 node('probe_strike','{A} throws a measuring forearm. {D} stays balanced and watches for the next.',{next:[e('strike_trade',4),e('counter_strike',3),e('cheap_shot',1),e('corner_whip',2)]});
 node('strike_trade','{A} lands a forearm. {D} returns one. Both stay on their feet.',{next:[e('strike_trade',2),e('counter_strike',3),e('clothesline',2),e('corner_whip',2),e('outside_toss',1)]});
 node('counter_strike','{D} ducks the next strike and answers with a sharp elbow!',{reverse:true,next:[e('clothesline',3),e('corner_whip',2),e('snap_suplex',2)]});
 node('cheap_shot','{A} catches {D} with a forearm on the break while the referee is looking away.',{crowd:-1,next:[e('corner_strikes',3),e('target_strike',3),e('clothesline',2)]});
 node('corner_strikes','{A} traps {D} against the turnbuckles and drives in two short forearms.',{requires:'corner',zone:'corner',next:[e('corner_whip',4),e('corner_escape',3),e('corner_charge',2),e('corner_knee',3)]});
 node('corner_whip','{A} whips {D} across the ring towards the opposite turnbuckles.',{zone:'corner',next:[e('corner_charge',4),e('corner_escape',4),e('corner_strikes',2)]});
 node('corner_charge','{A} charges the corner with a running attack. {D} braces for impact.',{requires:'corner',zone:'corner',next:[e('corner_escape',3),e('clothesline',2),e('snap_suplex',1)]});
 node('corner_escape','{D} slips out of the corner as {A} charges in, leaving {A} to hit the turnbuckles!',{requires:'corner',reverse:true,next:[e('clothesline',3),e('strike_trade',2),e('corner_whip',2)]});
 node('rope_run','{A} sends {D} towards the ropes; {D} rebounds into the centre.',{next:[e('shoulder_tackle',2),e('duck_rebound',3),e('clothesline',4)]});
 node('duck_rebound','{D} ducks the attempted lariat, rebounds again and changes direction.',{reverse:true,next:[e('clothesline',3),e('shoulder_tackle',2),e('snap_suplex',1)]});
 node('shoulder_tackle','{A} collides with {D} off the ropes and knocks {D} down.',{zone:'mat',down:'d',next:[e('stand_reset',4),e('early_cover',2),e('mat_hold',2)]});
 node('clothesline','{A} catches {D} with a running clothesline. {D} crashes onto the mat.',{zone:'mat',down:'d',next:[e('cover',3),e('mat_hold',2),e('stand_reset',3)]});
 node('snap_suplex','{A} secures the head and arm, lifts {D} and lands a snap suplex.',{zone:'mat',down:'d',next:[e('cover',3),e('target_hold',3),e('stand_reset',2)]});
 // Mat offence and selling must be resolved before another standing exchange.
 node('mat_hold','{A} stays on top, pressing {D} against the canvas to stop an escape.',{requires:'mat',zone:'mat',down:'d',next:[e('target_hold',3),e('mat_scramble',3),e('rope_crawl',2),e('armbar_roll',2),e('grounded_switch',2),e('early_cover',1),e('submission_set',1),e('dramatic_sell',1)]});
 node('target_hold','{A} isolates {D}’s {part}, applying steady pressure with the referee watching.',{requires:'mat',zone:'mat',down:'d',focus:2,next:[e('rope_crawl',3),e('mat_scramble',2),e('armbar_roll',3),e('handstand_escape',2),e('hope_elbows',3)]});
 node('target_strike','{A} drives a short strike into {D}’s {part}, then drags {D} away from the ropes.',{focus:2,zone:'mat',down:'d',next:[e('target_hold',3),e('hope_elbows',3),e('rope_crawl',2)]});
 node('rope_crawl','{D} drags themselves towards the bottom rope while {A} keeps the pressure on.',{requires:'mat',zone:'mat',down:'d',next:[e('rope_break',4),e('hope_elbows',2)]});
 node('rope_break','{D} catches the bottom rope. The referee orders {A} to break the hold, and {A} releases.',{requires:'mat',zone:'standing',down:null,next:[e('stand_reset',4),e('cheap_shot',1)]});
 node('mat_scramble','{D} twists underneath and uses the leverage to reverse the hold.',{requires:'mat',reverse:true,zone:'mat',down:'d',next:[e('mat_hold',3),e('stand_reset',3),e('counter_rollup',2)]});
 node('hope_elbows','{D} fights towards their knees and throws two elbows, trying to get free.',{requires:'mat',zone:'standing',down:null,next:[e('hope_cutoff',4),e('counter_strike',2),e('strike_trade',2)]});
 node('hope_cutoff','{A} intercepts the escape with a knee to {D}’s {part}; the comeback is stopped.',{focus:1,zone:'mat',down:'d',next:[e('target_hold',3),e('mat_hold',2),e('stand_reset',2)]});
 node('stand_reset','{D} rolls clear and uses the ropes to rise. {A} gives ground to avoid a counter.',{requires:'mat',zone:'standing',down:null,next:[e('lockup',2),e('strike_trade',3),e('corner_whip',2),e('rope_run',2)]});
 // High-risk branches include genuine preparation, payoff or failure.
 node('top_climb','{A} drops {D} with a strike, then climbs the turnbuckles, checking their footing.',{zone:'top',down:'d',next:[e('aerial_attack',5),e('aerial_counter',3),e('missile_dropkick',3),e('high_crossbody',3),e('top_rope_hesitation',1)]});
 node('aerial_attack','{A} launches from the turnbuckle and connects with a diving elbow!',{requires:'top',zone:'mat',down:'d',crowd:5,next:[e('cover',5),e('stand_reset',2)]});
 node('aerial_counter','{D} rolls out of the way! {A} crashes onto the canvas and loses the advantage.',{requires:'top',reverse:true,zone:'mat',down:'d',crowd:3,next:[e('cover',2),e('mat_hold',2),e('stand_reset',3)]});
 // Ringside branches must return inside before a pin or submission.
 node('outside_toss','{A} sends {D} over the ropes onto the floor. The referee starts counting.',{zone:'outside',down:null,next:[e('floor_brawl',4),e('apron_stand',3),e('roll_inside',2)]});
 node('floor_brawl','{A} follows {D} to the floor and throws a forearm near the barricade.',{requires:'outside',zone:'outside',next:[e('floor_counter',3),e('apron_stand',3),e('roll_inside',4)]});
 node('floor_counter','{D} blocks the next shot and drives {A} backwards into the barricade!',{requires:'outside',reverse:true,zone:'outside',next:[e('floor_brawl',3),e('roll_inside',4)]});
 node('apron_stand','{A} pulls {D} towards the apron, where both struggle for position.',{requires:'outside',zone:'outside',next:[e('roll_inside',4),e('floor_counter',3)]});
 node('roll_inside','{A} slides {D} under the bottom rope and follows. The referee breaks the count.',{requires:'outside',zone:'standing',down:null,next:[e('strike_trade',3),e('corner_whip',2),e('snap_suplex',2)]});
 // Pin and submission resolution are events, not random commentary.
 node('early_cover','{A} hooks a leg; {D} kicks free before the referee reaches two.',{requires:'mat',zone:'mat',down:'d',next:[e('stand_reset',4),e('mat_hold',2)]});
 node('cover','{A} hooks the far leg after the impact. The referee drops to count.',{requires:'mat',zone:'mat',down:'d',next:[e('near_kickout',5)]});
 node('near_kickout','ONE! TWO! {D} gets a shoulder up just before three!',{requires:'mat',zone:'mat',down:'d',crowd:6,next:[e('stand_reset',3),e('mat_hold',3),e('counter_rollup',1)]});
 node('counter_rollup','{D} catches an opening and rolls {A} over! One, two — {A} escapes!',{requires:'mat',reverse:true,zone:'standing',down:null,crowd:3,next:[e('strike_trade',3),e('lockup',2)]});
 node('submission_set','{A} traps {D} on the canvas, attacking the damaged {part} in a tight submission.',{requires:'mat',zone:'mat',down:'d',focus:2,next:[e('submission_ropes',4),e('submission_roll',3)]});
 node('submission_ropes','{D} crawls to the bottom rope and grabs it. The referee forces {A} to release.',{requires:'mat',zone:'standing',down:null,crowd:4,next:[e('stand_reset',2),e('strike_trade',2)]});
 node('submission_roll','{D} shifts their weight, rolls through the hold and breaks the grip.',{requires:'mat',reverse:true,zone:'standing',down:null,crowd:3,next:[e('strike_trade',3),e('corner_whip',2)]});
 // Finish tease nodes may fail: only the booked end actually terminates the match.
 node('finish_tease','{A} reaches for the finishing hold, but {D} fights the grip before it is secured.',{zone:'standing',down:null,next:[e('finish_counter',4),e('counter_strike',2),e('snap_suplex',2)]});
 node('finish_counter','{D} slips out of the finisher setup and catches {A} with an elbow!',{reverse:true,zone:'standing',down:null,next:[e('clothesline',3),e('finish_tease',2),e('corner_whip',2)]});
 node('dramatic_sell','{D} rolls towards the ropes, clutching the {part}. {A} watches for the next counter.',{requires:'mat',zone:'standing',down:null,next:[e('finish_tease',3),e('strike_trade',2)]});


 node('grapple_trip','{A} shoots for the leg, catches {D} off balance and drives them onto the mat.',{cost:1.1,zone:'mat',down:'d',next:[e('target_hold',5),e('mat_hold',3),e('mat_scramble',2)]});
 node('power_spinebuster','{A} catches {D} coming forward and plants them with a heavy spinebuster!',{cost:3.5,lift:30,zone:'mat',down:'d',crowd:2,next:[e('cover',3),e('mat_hold',2),e('stand_reset',3)]});
 node('springboard_rise','{A} sends {D} down and steps onto the middle rope, checking their balance.',{cost:1.8,zone:'top',down:'d',next:[e('springboard_strike',5),e('springboard_evaded',3),e('missile_dropkick',2),e('top_rope_hesitation',2)]});
 node('springboard_strike','{A} launches from the ropes and lands a springboard crossbody on {D}!',{cost:3.2,requires:'top',zone:'mat',down:'d',crowd:4,next:[e('cover',4),e('stand_reset',2)]});
 node('springboard_evaded','{D} rolls clear! {A} crashes into the canvas and {D} takes control.',{requires:'top',reverse:true,zone:'mat',down:'d',crowd:2,next:[e('mat_hold',2),e('cover',2),e('stand_reset',3)]});
 node('crowd_pose','{A} stops to play to the crowd. {D} watches, looking for an opening.',{cost:-0.7,next:[e('cheap_shot',2),e('counter_strike',3),e('probe_strike',3),e('lockup',2)]});
 node('catch_breath','{A} steps away and catches a breath while {D} regroups.',{cost:-5.5,next:[e('lockup',3),e('probe_strike',3),e('counter_strike',2)]});

 // v3.1 connected action motifs: setup -> vulnerability -> counter -> payoff.
 // Each original line is conditioned by physical ring position and control.
 // TECHNICAL: a deliberate limb attack has multiple credible counter-routes.
 node('collar_snap','{A} snaps {D} into the clinch, searching for a grip rather than forcing a throw.',{next:[e('wristlock',3),e('ankle_pick',2),e('hip_toss',2)]});
 node('ankle_pick','{A} changes levels and catches {D} by the ankle, dragging them down.',{zone:'mat',down:'d',cost:1.2,next:[e('leg_wrench',4),e('grapevine',2),e('mat_scramble',2)]});
 node('leg_wrench','{A} folds {D}’s leg under pressure, making every attempt to stand more expensive.',{requires:'mat',zone:'mat',down:'d',focus:1,cost:1.5,next:[e('grapevine',3),e('rope_crawl',2),e('handstand_escape',1),e('mat_scramble',2)]});
 node('grapevine','{A} hooks both legs to trap {D} and asks the referee to check for a submission.',{requires:'mat',zone:'mat',down:'d',cost:1.5,next:[e('submission_ropes',3),e('mat_scramble',2),e('leveraged_bridge',2)]});
 node('hip_toss','{A} turns the locked arms into a hip toss that sends {D} to the canvas.',{zone:'mat',down:'d',cost:1.5,next:[e('mat_hold',3),e('early_cover',2),e('leveraged_bridge',2),e('stand_reset',2)]});
 node('leveraged_bridge','{D} arches out of the hold and reverses the leverage, nearly catching {A} flat!',{requires:'mat',reverse:true,zone:'mat',down:'d',cost:1.2,crowd:2,next:[e('early_cover',2),e('mat_scramble',2),e('stand_reset',3)]});
 node('armbar_roll','{D} rolls towards the trapped arm, reversing the pressure before {A} can cinch it in.',{requires:'mat',reverse:true,zone:'mat',down:'d',cost:1,next:[e('target_hold',2),e('rope_break',2),e('stand_reset',3)]});
 node('grounded_switch','{A} shifts their hips to switch the hold without ever letting {D} back to their feet.',{requires:'mat',zone:'mat',down:'d',cost:1.2,next:[e('armbar_roll',2),e('grapevine',2),e('mat_hold',3)]});
 // POWER/BRAWLING: strikes build real consequences, but no free power lift.
 node('stiff_forearm','{A} fires a stiff forearm. {D} takes a step back and answers with a glare.',{cost:1.3,next:[e('rolling_elbow',2),e('body_shot',3),e('heavy_slam',1),e('counter_strike',3)]});
 node('body_shot','{A} drives a short punch into {D}’s ribs, looking to take away the next breath.',{focus:1,cost:1.0,next:[e('rib_knee',2),e('heavy_slam',2),e('gutbuster',2),e('corner_whip',2),e('strike_trade',3)]});
 node('rolling_elbow','{A} spins through and catches {D} with an elbow that stops the exchange cold.',{cost:2.2,crowd:2,next:[e('short_arm_lariat',2),e('counter_strike',3),e('snap_suplex',2)]});
 node('short_arm_lariat','{A} pulls {D} back by the wrist and drops them with a short-arm lariat.',{zone:'mat',down:'d',cost:2.6,crowd:2,next:[e('cover',2),e('dramatic_sell',2),e('stand_reset',3)]});
 node('rib_knee','{A} drops a knee against {D}’s ribs and keeps the pressure on.',{requires:'mat',zone:'mat',down:'d',focus:1,cost:1.5,next:[e('target_hold',3),e('grounded_switch',2),e('mat_scramble',2)]});
 node('gutbuster','{A} lifts {D} across the knee for a gutbuster, targeting the midsection.',{cost:3.0,lift:22,focus:1,zone:'mat',down:'d',next:[e('rib_knee',3),e('cover',2),e('stand_reset',2)]});
 node('heavy_slam','{A} controls the waist and slams {D} down with a heavy body slam.',{cost:3.2,lift:28,zone:'mat',down:'d',crowd:2,next:[e('near_kickout',1),e('mat_hold',2),e('stand_reset',3)]});
 node('corner_knee','{A} pins {D} to the turnbuckles and digs a knee into the body as the referee counts.',{requires:'corner',zone:'corner',focus:1,cost:1.5,next:[e('corner_break',2),e('corner_escape',2),e('corner_whip',2)]});
 // HIGH-FLYING: a spectacular move needs spatial setup and can be countered.
 node('springboard_feint','{A} touches the second rope, drawing {D} towards the expected leap.',{cost:1,next:[e('rope_rebound',3),e('duck_rebound',2),e('springboard_rise',2)]});
 node('rope_rebound','{A} changes direction twice off the ropes. {D} is a step behind.',{cost:1.3,next:[e('running_headscissors',2),e('rebound_counter',3),e('shoulder_tackle',2)]});
 node('running_headscissors','{A} catches the rushing {D} with headscissors and sends them sprawling.',{zone:'mat',down:'d',cost:2.1,crowd:2,next:[e('stand_reset',3),e('early_cover',2),e('mat_scramble',2)]});
 node('rebound_counter','{D} reads the next rope run, sidesteps and sends {A} stumbling into open space!',{reverse:true,cost:1.0,next:[e('clothesline',2),e('rope_run',2),e('strike_trade',2)]});
 node('missile_dropkick','{A} launches from the top rope with a missile dropkick. {D} goes down hard!',{requires:'top',zone:'mat',down:'d',cost:3.8,crowd:4,next:[e('cover',3),e('stand_reset',3)]});
 node('high_crossbody','{A} dives from the top rope with a crossbody, risking everything on the landing.',{requires:'top',zone:'mat',down:'d',cost:3.9,crowd:3,next:[e('cover',3),e('near_kickout',1),e('stand_reset',3)]});
 node('top_rope_hesitation','{A} hesitates on the top rope as {D} rolls out of position. The moment has gone.',{requires:'top',zone:'standing',cost:-.8,next:[e('circle',3),e('counter_strike',2)]});
 node('handstand_escape','{D} kicks up through a handstand and escapes the grip before {A} can trap the arm.',{requires:'mat',reverse:true,zone:'standing',cost:1.7,crowd:2,next:[e('rope_rebound',2),e('circle',3)]});
 // DRAMA: crowd sympathy and expectation change how a tactic lands.
 node('false_handshake','{A} offers a handshake, but keeps one eye on the referee and the next opening.',{next:[e('clean_break',2),e('cheap_shot',3),e('opponent_study',2)]});
 node('opponent_study','{A} waits for {D} to show the next attack. Neither wants to reveal their plan.',{cost:-.5,next:[e('last_second_counter',2),e('baited_charge',3),e('lockup',2),e('probe_strike',2)]});
 node('last_second_counter','{D} recognises the setup at the final instant and turns it into a counter!',{reverse:true,crowd:3,next:[e('counter_strike',3),e('grapple_trip',2),e('rope_rebound',2)]});
 node('dramatic_rally','{A} staggers upright and refuses to stay down. The crowd senses one last rally.',{crowd:2,cost:1.3,next:[e('clothesline',3),e('last_second_counter',2),e('finish_tease',2)]});
 node('baited_charge','{A} invites the charge and deliberately leaves a gap near the turnbuckle.',{next:[e('counter_strike',3),e('corner_whip',3),e('last_second_counter',2)]});
 node('quiet_reversal','{D} calmly steps around the attack and takes control before anyone sees it coming.',{reverse:true,cost:.8,next:[e('wristlock',2),e('counter_strike',2),e('opponent_study',2)]});

 /* v3.3 MOVE CATALOG — ten times the tactical vocabulary, built from authored move families.
    Every move is an original one-line description of a generic, widely used wrestling technique.
    Each family states where the move can start (position), where it leaves both wrestlers,
    which setups lead into it, what can follow, and how it fails. The physical guards in
    isValid() (position, stamina, lift capacity, match timing, body-part logic) stay authoritative.
    Wiring is computed with a fixed string hash: the graph is identical on every load. */
 const CAT=(function buildCatalog(){
  const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
  const STY={T:'Technical',B:'Brawl',S:'Spectacle',Y:'Story'};
  const sty=s=>s?s.split('').map(c=>STY[c]):null;
  // Family: requires/zone/down/cost/lift/crowd/focus/part defaults; from = setups that lead in;
  // next = follow-ups; link = cross-family follow-ups [family,count]; rev/blk = failure modes.
  const F={
   suplex:{requires:'standing',zone:'mat',down:'d',cost:2.6,lift:32,crowd:2,part:'back',styles:'TB',
    from:['lockup','waistlock','collar_snap','strike_trade','counter_strike','front_facelock','body_shot','stiff_forearm','go_behind','knuckle_lock'],
    next:[['cover',2],['mat_hold',2],['stand_reset',3],['target_hold',1]],link:[['ground',2],['submission',1],['pin',0]],
    rev:{lines:['{D} blocks the {name}, slips down the back and catches {A} with a suplex of their own!','{D} floats over on the {name} attempt, lands on both feet and spins {A} into a waistlock takedown!','{D} knees out of the {name} and drops {A} with a quick snapmare!'],zone:'mat',down:'d',cost:1.8,crowd:3,next:[['mat_hold',2],['stand_reset',3],['cover',1]]},
    blk:{lines:['{D} hooks a leg and blocks the {name}. {A} keeps hold and resets the grip.','{D} drops their weight, and {A} cannot lift them for the {name}.','{A} tries for the {name}, but {D} plants their feet and refuses to go up.'],next:[['strike_trade',2],['knee_strike_block',1]]},
    moves:[
     ['sx_vertical','vertical suplex','{A} hooks the head, lifts {D} straight up and drops back with a vertical suplex.',{}],
     ['sx_delayed','delayed vertical suplex','{A} hoists {D} upside down and holds them there… and holds them… before finally dropping back!',{cost:4,lift:22,crowd:5,after:.3,styles:'BY'}],
     ['sx_belly_belly','belly-to-belly suplex','{A} locks the body and launches {D} overhead with a belly-to-belly suplex!',{crowd:3}],
     ['sx_belly_back','belly-to-back suplex','{A} scoops {D} up and falls backwards with a belly-to-back suplex.',{}],
     ['sx_northern','northern lights suplex','{A} turns {D} over with a northern lights suplex and keeps the bridge for a pin attempt.',{after:.35,next:[['near_kickout',2]],styles:'T'}],
     ['sx_fisherman','fisherman suplex','{A} hooks a leg, lifts and bridges with a fisherman suplex.',{after:.4,next:[['near_kickout',2]],styles:'T'}],
     ['sx_exploder','exploder suplex','{A} hooks a leg and throws {D} overhead with an exploder suplex!',{cost:3,crowd:3,lift:26}],
     ['sx_german','German suplex','{A} locks the waist and arches {D} over with a German suplex!',{from:['waistlock','go_behind','waist_escape','standing_switch'],crowd:3,lift:28}],
     ['sx_german_release','release German suplex','{A} lets go at the top of a German suplex and {D} lands high on the shoulders!',{from:['waistlock','go_behind','standing_switch'],cost:3.3,crowd:4,after:.45,risk:1,lift:24}],
     ['sx_rolling_german','rolling German suplexes','{A} rolls through one German suplex, then a second, then a third!',{from:['waistlock','go_behind'],cost:5,crowd:5,after:.5,lift:24,styles:'TB'}],
     ['sx_dragon','dragon suplex','{A} applies a full nelson and bridges {D} over with a dragon suplex!',{from:['go_behind','waistlock'],cost:3.4,crowd:4,after:.55,risk:1,part:'neck',next:[['near_kickout',2]],styles:'TS'}],
     ['sx_tiger','tiger suplex','{A} hooks both arms from behind and bridges {D} with a tiger suplex!',{from:['go_behind','waistlock'],cost:3.6,crowd:5,after:.65,risk:1,part:'neck',next:[['near_kickout',3]]}],
     ['sx_double_underhook','double underhook suplex','{A} hooks both of {D}’s arms and turns them over with a double underhook suplex.',{from:['front_facelock','lockup']}],
     ['sx_side','side suplex','{A} gets underneath {D}’s arm and drops sideways with a side suplex.',{}],
     ['sx_brainbuster','brainbuster','{A} lifts {D} vertically and drops down, bringing {D}’s head into the mat with a brainbuster!',{from:['front_facelock'],cost:3.6,lift:20,crowd:5,after:.6,risk:1,part:'neck'}],
     ['sx_gutwrench','gutwrench suplex','{A} wraps both arms around {D}’s midsection and flips {D} over with a gutwrench suplex.',{part:'ribs',cost:3,lift:22,styles:'B'}],
     ['sx_overhead','overhead belly-to-belly','{A} explodes upwards and throws {D} clean across the ring with an overhead belly-to-belly!',{cost:3.4,crowd:4,lift:24,styles:'B'}],
     ['sx_butterfly','butterfly suplex','{A} hooks {D}’s arms in a butterfly lock and suplexes them.',{from:['front_facelock'],styles:'T'}],
     ['sx_tbone','T-bone suplex','{A} scoops {D} from the side and throws them with a T-bone suplex.',{cost:3,crowd:3,lift:26,styles:'B'}],
     ['sx_snap_ddt','snap suplex into a cover','{A} drops {D} with a quick snap suplex and rolls straight into a cover.',{after:.58,next:[['near_kickout',3]]}],
     ['sx_cradle','cradle suplex','{A} cradles {D}’s leg and head and drops them with a cradle suplex.',{after:.4,styles:'T',next:[['near_kickout',2]]}],
     ['sx_half_nelson','half-nelson suplex','{A} sinks in a half nelson and throws {D} overhead with a half-nelson suplex.',{from:['go_behind','waistlock'],cost:3.4,crowd:4,after:.6,risk:1,part:'neck'}],
     ['sx_saito','back suplex','{A} wraps the waist from behind and drops backwards, landing {D} on the upper back.',{from:['go_behind','waistlock'],cost:3,crowd:3,lift:26}],
     ['sx_falcon_arrow','falcon arrow','{A} lifts {D} for a suplex, flips them over and sits out with a falcon arrow!',{cost:3.6,crowd:5,after:.6,lift:22,risk:1,next:[['near_kickout',3]]}]
    ]},
   power:{requires:'standing',zone:'mat',down:'d',cost:3,lift:28,crowd:2,part:'back',styles:'B',
    from:['lockup','strike_trade','body_shot','rope_run','rope_rebound','stiff_forearm','counter_strike','knuckle_lock','duck_rebound','corner_escape'],
    next:[['cover',2],['mat_hold',2],['stand_reset',3]],link:[['ground',2],['submission',1]],
    rev:{lines:['{D} slips out the back of the {name} and shoves {A} into the ropes!','{D} wriggles free of the {name}, lands behind {A} and chops the legs out!','{D} turns the {name} attempt into a desperation DDT!'],zone:'mat',down:'d',cost:1.6,crowd:3,next:[['mat_hold',2],['stand_reset',3],['strike_trade',1]]},
    blk:{lines:['{A} cannot get {D} up for the {name}. {D} is simply too heavy to lift from there.','{D} fights out of the {name} and backs away into the ropes.','{A} gets {D} halfway up for the {name}, but has to put them down.'],next:[['strike_trade',2],['body_shot',1]]},
    moves:[
     ['pw_body_slam','body slam','{A} scoops {D} up and slams them to the canvas.',{cost:2.2,lift:34}],
     ['pw_scoop_powerslam','scoop powerslam','{A} scoops {D} and falls forward with a powerslam!',{cost:2.8,crowd:3}],
     ['pw_sidewalk','sidewalk slam','{A} catches {D} from the side and drives them down with a sidewalk slam.',{}],
     ['pw_spinebuster_running','running spinebuster','{A} catches {D} off the ropes and spins them into the canvas with a spinebuster!',{from:['rope_run','rope_rebound','duck_rebound'],cost:3.4,crowd:4,lift:30}],
     ['pw_chokeslam','chokeslam','{A} grips {D} by the throat, lifts them high and slams them down!',{cost:3.6,lift:18,crowd:5,after:.45,part:'neck',styles:'BY'}],
     ['pw_powerbomb','powerbomb','{A} doubles {D} over, lifts them onto the shoulders and drives them down with a powerbomb!',{cost:4,lift:16,crowd:5,after:.45,risk:1}],
     ['pw_sitout','sit-out powerbomb','{A} hoists {D} and sits out with a powerbomb, pinning the shoulders!',{cost:4.2,lift:14,crowd:5,after:.58,risk:1,next:[['near_kickout',3]]}],
     ['pw_running_powerbomb','running powerbomb','{A} lifts {D}, charges across the ring and slams them down with a running powerbomb!',{cost:4.6,lift:10,crowd:5,after:.6,risk:1}],
     ['pw_backbreaker','backbreaker','{A} scoops {D} up and drops them across a knee with a backbreaker.',{part:'back',focus:1,cost:2.4,lift:30,next:[['target_hold',2]]}],
     ['pw_argentine','Argentine backbreaker','{A} lifts {D} across the shoulders and bends their spine in an Argentine backbreaker!',{part:'back',focus:2,cost:4,lift:8,crowd:3,after:.4,next:[['target_hold',2]]}],
     ['pw_uranage','uranage','{A} hooks under {D}’s arm and slams them backwards with a uranage.',{cost:3,lift:30}],
     ['pw_samoan_drop','Samoan drop','{A} drapes {D} across the shoulders and falls back with a Samoan drop.',{cost:3,lift:22}],
     ['pw_fallaway','fallaway slam','{A} catches {D} and hurls them backwards with a fallaway slam!',{from:['rope_run','rope_rebound','duck_rebound'],cost:3,lift:24,crowd:3}],
     ['pw_gorilla_press','gorilla press slam','{A} presses {D} overhead at arm’s length… and drops them face-first!',{cost:4.6,lift:2,crowd:5,after:.3}],
     ['pw_military_press','military press drop','{A} hoists {D} overhead and lets them fall to the canvas.',{cost:4.2,lift:6,crowd:4}],
     ['pw_torture_rack','torture rack','{A} drapes {D} across the shoulders and bends their back in a torture rack!',{zone:'standing',down:null,part:'back',focus:2,cost:3.8,lift:6,crowd:3,after:.4,next:[['submission_roll',2],['pw_samoan_drop',1],['counter_strike',2]]}],
     ['pw_bearhug','bearhug','{A} locks {D} in a bearhug and squeezes the air out of their ribs.',{block:false,rv:['{D} claps both hands over {A}’s ears, breaks the bearhug and takes {A} down with a headlock!'],zone:'standing',down:null,part:'ribs',focus:2,cost:1.8,lift:null,next:[['hope_elbows_standing',3],['pw_belly_bump',2],['counter_strike',2]]}],
     ['pw_belly_bump','belly-to-belly throw','{A} lifts {D} out of the bearhug and throws them with a belly-to-belly!',{cost:2.8,lift:26,part:'ribs'}],
     ['pw_pumphandle','pumphandle slam','{A} hooks the arm and leg, lifts {D} and slams them with a pumphandle slam.',{cost:3.3,lift:20,crowd:3}],
     ['pw_side_slam','swinging side slam','{A} swings {D} around and drops them with a side slam.',{cost:3,lift:24}],
     ['pw_tiltawhirl_slam','tilt-a-whirl slam','{A} swings {D} around their body and drives them down with a slam.',{from:['rope_run','rope_rebound'],cost:3,lift:22,crowd:3}],
     ['pw_alabama','Alabama slam','{A} hooks the legs, lifts {D} upside down and slams them backwards!',{cost:3.6,lift:18,crowd:4,after:.55,risk:1}],
     ['pw_lariat_catch','lariat after a whip','{A} whips {D} into the ropes and flattens them with a lariat on the rebound!',{block:false,rv:['{D} ducks the lariat on the rebound and takes {A} down with a dropkick!'],from:['rope_run','rope_rebound'],lift:null,cost:2.6,crowd:3,part:'neck'}],
     ['pw_slam_catch','catch and slam','{A} catches {D} in mid-air and slams them!',{from:['rope_run','rope_rebound','duck_rebound'],cost:3.4,lift:20,crowd:4,after:.4}],
     ['pw_powerslam_corner','powerslam out of the corner','{A} catches {D} coming out of the corner with a powerslam!',{from:['corner_escape','corner_whip'],cost:3,lift:24,crowd:3}],
     ['pw_double_chop_slam','gutbuster drop','{A} lifts {D} and drops them across the knee with a gutbuster.',{part:'ribs',focus:2,lift:22,cost:3,crowd:2}],
     ['pw_shoulder_tackle_power','running shoulder block','{A} lowers the shoulder and runs straight through {D}.',{block:false,rv:['{D} drops flat, {A} runs straight over, and {D} pops up to trip them!'],from:['rope_run','rope_rebound','duck_rebound'],lift:null,cost:2,crowd:2}]
    ]},
   neck:{requires:'standing',zone:'mat',down:'d',cost:2.4,lift:null,crowd:2,part:'neck',styles:'TSY',
    from:['lockup','strike_trade','front_facelock','counter_strike','headlock','rope_rebound','probe_strike','stiff_forearm','quiet_reversal','last_second_counter'],
    next:[['cover',2],['mat_hold',2],['stand_reset',3],['target_hold',1]],link:[['ground',2],['submission',1],['pin',0]],
    rev:{lines:['{D} pushes {A} off before the {name} lands and answers with a back body drop!','{D} straightens up out of the {name} and shoves {A} into the turnbuckles!','{D} spins out of the {name} and catches {A} with a neckbreaker instead!'],zone:'mat',down:'d',cost:1.6,crowd:3,next:[['mat_hold',2],['stand_reset',3]]},
    blk:{lines:['{D} pushes {A} away before the {name} can be applied.','{D} grabs the top rope and blocks the {name}.','{D} powers up and blocks the {name}.'],next:[['strike_trade',2],['front_facelock',1]]},
    moves:[
     ['nk_ddt','DDT','{A} tucks {D}’s head and falls back, spiking them with a DDT!',{crowd:3}],
     ['nk_snap_ddt','snap DDT','{A} snaps {D} down with a quick DDT before they can defend.',{}],
     ['nk_double_arm_ddt','double-arm DDT','{A} hooks both arms and drops {D} face-first with a double-arm DDT.',{from:['front_facelock'],cost:2.8,crowd:3,after:.4,styles:'TB'}],
     ['nk_inverted_ddt','inverted DDT','{A} hooks the head from behind and falls back with an inverted DDT.',{cost:2.6}],
     ['nk_implant','implant DDT','{A} hooks the leg and spikes {D} with an implant DDT!',{cost:3,crowd:3,after:.5,risk:1}],
     ['nk_swinging_neckbreaker','swinging neckbreaker','{A} spins {D} around and drops them with a swinging neckbreaker.',{}],
     ['nk_jumping_neckbreaker','jumping neckbreaker','{A} leaps up and drops {D} with a jumping neckbreaker.',{cost:2.6}],
     ['nk_rolling_neckbreaker','rolling neckbreaker','{A} rolls through and turns {D} over with a neckbreaker.',{styles:'TS'}],
     ['nk_bulldog','running bulldog','{A} grabs {D} by the head and charges forward, driving them face-first into the canvas!',{from:['rope_run','rope_rebound','duck_rebound'],cost:2.4,crowd:3}],
     ['nk_facebuster','facebuster','{A} pulls {D}’s head down and plants them face-first into the mat.',{}],
     ['nk_jawbreaker','jawbreaker','{A} drops to a sitting position, pulling {D}’s jaw into the shoulder with a jawbreaker.',{zone:'standing',down:null,cost:1.6,next:[['strike_trade',2],['clothesline',2],['nk_ddt',1]]}],
     ['nk_cutter','cutter','{A} catches {D} around the neck and drops them out of nowhere with a cutter!',{cost:2.8,crowd:5,after:.5,styles:'SY'}],
     ['nk_russian_sweep','Russian leg sweep','{A} steps beside {D}, hooks the arm and sweeps them back with a Russian leg sweep.',{cost:1.8,part:'back',styles:'T'}],
     ['nk_sto','STO','{A} sweeps {D}’s leg and drives them backwards with a forearm across the chest!',{cost:2.4,part:'back'}],
     ['nk_piledriver','piledriver','{A} turns {D} upside down and drops to a seated piledriver!',{from:['front_facelock'],cost:3.8,lift:16,crowd:5,after:.65,risk:1}],
     ['nk_tombstone','tombstone piledriver','{A} tips {D} upside down, holds them close and drops to the knees with a tombstone piledriver!',{from:['front_facelock'],cost:4,lift:12,crowd:6,after:.72,risk:1,next:[['cover',4]]}],
     ['nk_tornado_ddt','tornado DDT','{A} runs up the turnbuckles, swings around and drops {D} with a tornado DDT!',{agile:1,requires:'corner',from:['corner_whip','corner_strikes','corner_push'],cost:3,crowd:4,after:.35,risk:1,styles:'S'}],
     ['nk_stunner','jaw stunner','{A} puts {D} in a three-quarter facelock and drops, snapping the jaw off the shoulder!',{cost:2.4,crowd:4,after:.45,styles:'BY'}]
    ]},
   strike:{requires:'standing',zone:'standing',down:null,cost:1.3,lift:null,crowd:1,styles:'BY',
    from:['probe_strike','strike_trade','stiff_forearm','circle','lockup','counter_strike','clean_break','crowd_pose','dramatic_rally','hope_elbows','opponent_study','taunt'],
    next:[['strike_trade',3],['counter_strike',2],['clothesline',1],['corner_whip',1]],link:[['strike',2],['neck',1],['power',1],['suplex',1]],
    rev:{lines:['{D} catches the {name}, spins {A} around and fires back with a forearm!','{D} ducks the {name} and answers with a quick jab combination!','{D} blocks the {name} and drives a knee into {A}’s midsection!'],zone:'standing',down:null,cost:1,crowd:2,next:[['strike_trade',3],['clothesline',1],['st_forearm',1]]},
    blk:{lines:['{D} gets an arm up and blocks the {name}.','{D} sways back from the {name}; the strike whistles past.','{D} absorbs the {name} and refuses to give ground.'],next:[['strike_trade',2],['counter_strike',1]]},
    moves:[
     ['st_chop','knife-edge chop','{A} lands a loud knife-edge chop across {D}’s chest. The crowd winces with them.',{crowd:3,part:'ribs'}],
     ['st_uppercut','European uppercut','{A} drives a European uppercut up under {D}’s chin.',{part:'neck',styles:'T'}],
     ['st_headbutt','headbutt','{A} rocks {D} with a headbutt. Both wrestlers stagger.',{cost:1.6}],
     ['st_jab','jab combination','{A} pops {D} with three quick jabs.',{cost:1}],
     ['st_kneelift','knee lift','{A} catches {D} coming in with a knee lift.',{cost:1.4}],
     ['st_enzuigiri','enzuigiri','{A} leaps and swings a kick into the back of {D}’s head!',{agile:1,cost:2.2,crowd:3,after:.35,zone:'mat',down:'d',styles:'S'}],
     ['st_superkick','superkick','{A} snaps up a superkick flush on {D}’s jaw!',{cost:2.2,crowd:4,after:.45,zone:'mat',down:'d',styles:'SY'}],
     ['st_big_boot','big boot','{A} plants a big boot into {D}’s face as they charge in!',{cost:1.8,crowd:3,zone:'mat',down:'d',styles:'B'}],
     ['st_standing_dropkick','standing dropkick','{A} leaps and lands a dropkick square on {D}’s chest.',{cost:2,crowd:2,zone:'mat',down:'d',styles:'ST'}],
     ['st_palm','palm strike','{A} snaps {D}’s head back with an open-hand palm strike.',{cost:1.2,styles:'T'}],
     ['st_leg_kick','kick to the thigh','{A} chops at {D}’s leg with a heavy kick to the thigh.',{part:'leg',focus:1,cost:1.2,styles:'T'}],
     ['st_roundhouse','roundhouse kick','{A} spins and lands a roundhouse kick to {D}’s head!',{cost:2,crowd:3,after:.3,zone:'mat',down:'d'}],
     ['st_spinning_backfist','spinning backfist','{A} spins and catches {D} with a backfist!',{cost:1.8,crowd:2,after:.4}],
     ['st_mongolian','Mongolian chop','{A} chops down on both sides of {D}’s neck at once.',{part:'neck',cost:1.2,styles:'B'}],
     ['st_throat_thrust','throat thrust','{A} jabs {D} in the throat behind the referee’s back.',{part:'neck',crowd:-1,cost:.8,styles:'BY'}],
     ['st_discus','discus clothesline','{A} spins around and flattens {D} with a discus clothesline!',{cost:2.2,crowd:3,part:'neck',zone:'mat',down:'d'}],
     ['st_ripcord','short-range lariat','{A} pulls {D} in by the wrist and blasts them with a lariat!',{cost:2.4,crowd:3,part:'neck',zone:'mat',down:'d',after:.4,styles:'B'}],
     ['st_forearm','forearm smash','{A} throws a heavy forearm smash.',{}],
     ['st_body_kick','kick to the ribs','{A} digs a kick into {D}’s ribs.',{part:'ribs',focus:1,cost:1.3,styles:'T'}],
     ['st_elbow_smash','elbow smash','{A} cracks {D} with a short elbow to the jaw.',{cost:1.1}],
     ['st_gut_punch','punch to the gut','{A} doubles {D} over with a punch to the gut.',{part:'ribs',focus:1,cost:.9,next:[['front_facelock',3]]}],
     ['st_rolling_koppu','rolling chop','{A} spins and catches {D} with a rolling chop!',{cost:1.8,crowd:2,after:.35}],
     ['st_spin_kick','spin kick','{A} spins and catches {D} in the chest with a kick.',{agile:1,cost:1.8,crowd:2,zone:'mat',down:'d',styles:'S'}],
     ['st_knee_strike','running knee strike','{A} charges and drives a knee into {D}’s jaw!',{cost:2.4,crowd:4,after:.5,zone:'mat',down:'d'}],
     ['st_fighting_spirit','strike exchange','{A} and {D} stand in the centre and trade blows. Neither will go down first.',{rev:false,cost:2,crowd:4,after:.5,styles:'BY',block:false}],
     ['st_lariat_standing','standing lariat','{A} flattens {D} with a standing lariat.',{part:'neck',zone:'mat',down:'d',cost:2,crowd:2}],
     ['st_axe_kick','axe kick','{A} brings a heel down onto {D}’s head with an axe kick!',{agile:1,cost:2.2,crowd:3,after:.4,zone:'mat',down:'d',styles:'S'}],
     ['st_open_slap','open-hand slap','{A} slaps {D} across the face. The noise echoes around the room.',{crowd:3,cost:.8,styles:'Y'}],
     ['st_double_chop','double chop','{A} chops down across both of {D}’s shoulders.',{part:'arm',cost:1.2}],
     ['st_side_kick','side kick','{A} drives a side kick into {D}’s midsection.',{part:'ribs',cost:1.4,styles:'T'}],
     ['st_backhand','backhand chop','{A} turns and lands a backhand chop across {D}’s chest.',{part:'ribs',cost:1.1,crowd:2}],
     ['st_eye_rake','eye rake','{A} rakes {D}’s eyes while the referee is out of position.',{crowd:-2,cost:.6,styles:'BY',block:false}]
    ]},
   corner:{requires:'corner',zone:'corner',down:null,cost:1.8,lift:null,crowd:2,styles:'BSY',
    from:['corner_whip','corner_strikes','corner_push','corner_knee','corner_charge'],
    next:[['corner_whip',1],['corner_escape',1],['corner_break',2],['strike_trade',1]],link:[['corner',2],['neck',0]],
    rev:{lines:['{D} gets a boot up! {A} runs straight into it on the {name} attempt!','{D} sidesteps the {name}, and {A} crashes shoulder-first into the ring post!','{D} catches {A} on the {name} attempt and hits a quick counter out of the corner!'],still:['{D} shoves {A} away in the middle of the {name} and fights out of the corner!','{D} blocks the {name} and elbows their way out of the corner!'],requires:'corner',zone:'standing',down:null,cost:1.2,crowd:3,next:[['clothesline',2],['strike_trade',2],['counter_strike',1]]},
    blk:{zone:'standing',lines:['{D} slips out of the corner, and {A} pulls up before the {name}.','The referee steps in to separate them, and the {name} has to wait.'],next:[['strike_trade',2],['corner_break',1]]},
    moves:[
     ['cn_splash','corner splash','{A} charges and crushes {D} in the corner with a splash.',{cost:2.2}],
     ['cn_stinger','running corner splash','{A} hits a running splash into the corner. {D} staggers out.',{cost:2.4,crowd:3,zone:'standing'}],
     ['cn_dropkick','corner dropkick','{A} runs in and lands a dropkick to {D}, slumped in the corner!',{cost:2.4,crowd:3,styles:'S'}],
     ['cn_forearm','running corner forearm','{A} charges into the corner with a running forearm.',{cost:2}],
     ['cn_cannonball','cannonball senton','{A} rolls into the corner with a cannonball senton!',{cost:2.8,crowd:4,after:.4,styles:'S'}],
     ['cn_shoulders','shoulder thrusts','{A} drives shoulder after shoulder into {D}’s midsection.',{still:1,part:'ribs',focus:1,cost:1.6,styles:'B'}],
     ['cn_mounted_punches','mounted punches','{A} climbs onto the second rope and rains down punches. The crowd counts along!',{still:1,cost:1.8,crowd:4,styles:'BY'}],
     ['cn_tree_of_woe','tree of woe stomps','{A} hangs {D} upside down in the turnbuckles and stomps them.',{still:1,cost:1.8,crowd:-1,after:.3,styles:'B'}],
     ['cn_chops','corner chops','{A} traps {D} in the corner and lands chop after chop.',{still:1,part:'ribs',cost:1.6,crowd:3}],
     ['cn_monkey_flip','monkey flip','{A} plants both feet on {D}’s hips and flips them out of the corner!',{still:1,agile:1,zone:'mat',down:'d',cost:2,crowd:3,styles:'TS'}],
     ['cn_clothesline','corner clothesline','{A} follows {D} into the corner with a running clothesline.',{cost:1.8,part:'neck'}],
     ['cn_knee','corner knee strike','{A} charges and drives a knee into {D}, slumped in the corner!',{cost:2.4,crowd:3,after:.4}],
     ['cn_snapmare','snapmare out of the corner','{A} snaps {D} out of the corner and onto the mat with a snapmare.',{still:1,zone:'mat',down:'d',cost:1.2,styles:'T'}],
     ['cn_hip_attack','corner hip attack','{A} rushes in and crashes into {D} with a hip attack.',{cost:2,crowd:2}],
     ['cn_avalanche','avalanche','{A} runs full speed and squashes {D} against the turnbuckles!',{cost:2.8,crowd:3,styles:'B'}],
     ['cn_face_buckle','turnbuckle smash','{A} smashes {D}’s face into the top turnbuckle.',{still:1,cost:1,crowd:1}],
     ['cn_choke','boot choke','{A} chokes {D} with a boot in the corner while the referee counts.',{still:1,cost:.8,crowd:-2,part:'neck',styles:'BY'}],
     ['cn_backflip','corner backflip','{A} runs up the ropes, flips over {D}’s charge and lands on their feet!',{block:false,rv:['{D} catches {A} in mid-air on the backflip and drops them!'],agile:1,zone:'standing',cost:2.2,crowd:4,after:.3,styles:'S'}]
    ]},
   aerial:{requires:'top',zone:'mat',down:'d',cost:3.6,lift:null,crowd:4,risk:1,styles:'S',
    from:['top_climb','springboard_rise'],
    next:[['cover',4],['stand_reset',3]],link:[['pin',0]],
    rev:{lines:['{D} rolls away and {A} crashes onto the canvas on the {name}!','{D} moves at the last moment. The {name} hits nothing but mat!','{D} gets both knees up! {A}’s {name} lands on them!'],requires:'top',zone:'mat',down:'d',cost:2.2,crowd:3,next:[['cover',2],['mat_hold',2],['stand_reset',3]]},
    blk:{zone:'standing',lines:['{D} rolls towards the apron, and {A} has to abandon the {name}.','{A} sets for the {name}, but {D} is too far away. {A} climbs down.','{D} gets up too quickly; {A} has to abandon the {name} and jump down.'],next:[['stand_reset',2],['counter_strike',1],['circle',1]]},
    moves:[
     ['ar_headbutt','diving headbutt','{A} leaps off the top rope and comes down with a diving headbutt!',{after:.5,crowd:5,styles:'BY'}],
     ['ar_frog','frog splash','{A} launches from the corner and comes down with a frog splash!',{agile:1,after:.45,crowd:5}],
     ['ar_moonsault','moonsault','{A} turns backwards off the top rope and lands a moonsault!',{agile:1,after:.45,crowd:6,cost:4}],
     ['ar_senton','senton bomb','{A} flips forward off the top rope and crashes down with a senton!',{agile:1,after:.4,crowd:5}],
     ['ar_knee','diving knee','{A} leaps off the top and drives a knee into {D}!',{crowd:4,after:.5}],
     ['ar_clothesline','diving clothesline','{A} leaps off the top rope and catches {D} with a clothesline as they get up!',{crowd:4,part:'neck'}],
     ['ar_axe','double axe handle','{A} leaps from the top rope and brings both fists down on {D}.',{cost:2.6,crowd:3,risk:0,styles:'BY'}],
     ['ar_fist','flying fist drop','{A} jumps off the top rope and drops a fist on {D}.',{cost:2.6,crowd:3,risk:0}],
     ['ar_legdrop','top-rope leg drop','{A} drops a leg across {D}’s throat from the top rope!',{cost:3.4,crowd:4,part:'neck',after:.4}],
     ['ar_450','450 splash','{A} spins one and a quarter times in mid-air and lands a 450 splash!',{agile:1,cost:4.4,crowd:7,after:.7}],
     ['ar_shooting_star','shooting star press','{A} backflips forward off the top rope into a shooting star press!',{agile:1,cost:4.4,crowd:7,after:.75}],
     ['ar_swanton','swanton bomb','{A} curls forward off the top rope and crashes down across {D} with a swanton!',{agile:1,after:.5,crowd:6}],
     ['ar_corkscrew','corkscrew moonsault','{A} twists into a corkscrew moonsault!',{agile:1,cost:4.4,crowd:7,after:.7}],
     ['ar_stomp','double stomp','{A} leaps from the top rope and stomps down with both feet!',{part:'ribs',focus:1,crowd:4,after:.45,styles:'SB'}],
     ['ar_elbow_point','diving elbow','{A} points to the crowd and drops a diving elbow from the top!',{crowd:5,after:.4,styles:'SY'}],
     ['ar_missile_low','top-rope dropkick','{A} drops off the top rope with a dropkick into {D}’s knee!',{agile:1,part:'leg',focus:1,cost:3,crowd:3}],
     ['ar_splash','big splash','{A} spreads their arms and splashes onto {D} from the top rope!',{cost:3.4,crowd:4}],
     ['ar_cross_arm','flying crossbody','{A} sails off the top and catches {D} standing up with a crossbody!',{agile:1,cost:3.4,crowd:4,next:[['near_kickout',1]]}]
    ]},
   superplex:{requires:'top',zone:'mat',down:'d',cost:4.2,lift:18,crowd:6,risk:1,after:.5,part:'back',styles:'BS',
    from:['top_follow'],
    next:[['cover',4],['stand_reset',2],['dramatic_sell',2]],link:[],
    rev:{lines:['{D} punches free and shoves {A} off the turnbuckle. {A} crashes to the mat!','{D} headbutts {A} away, and {A} tumbles off the top!','{D} blocks the {name}, and {A} falls to the canvas below!'],requires:'top',zone:'mat',down:'d',cost:2,crowd:4,next:[['ar_headbutt',1],['ar_frog',1],['stand_reset',3]]},
    blk:{zone:'standing',lines:['{D} hooks the top rope and refuses to come off for the {name}.','They fight for position on the top rope. Nobody can get the {name}.'],next:[['strike_trade',1]]},
    moves:[
     ['sp_superplex','superplex','{A} hooks {D} on the top rope and hits a superplex! The ring shakes!',{}],
     ['sp_avalanche_german','avalanche German suplex','{A} wraps {D} from behind on the turnbuckle and drops back with a German suplex from the top!',{cost:4.8,crowd:7,after:.7}],
     ['sp_hurricanrana','top-rope hurricanrana','{A} scissors {D}’s head on the top rope and flips them with a hurricanrana!',{agile:1,lift:null,cost:3.8,styles:'S',part:'neck'}],
     ['sp_powerbomb','top-rope powerbomb','{A} powerbombs {D} off the turnbuckles!',{lift:8,cost:5,crowd:7,after:.72}],
     ['sp_spider','spider German suplex','{A} hangs from the ropes and drops {D} with a German suplex from the middle rope!',{agile:1,cost:4.6,crowd:7,after:.68}],
     ['sp_super_ddt','super DDT','{A} spikes {D} with a DDT from the second rope!',{lift:null,cost:3.6,part:'neck'}],
     ['sp_super_arm_drag','top-rope arm drag','{A} flips {D} off the top rope with an arm drag.',{lift:null,cost:3,crowd:4,part:'arm',styles:'T'}]
    ]},
   springboard:{agile:1,requires:'top',zone:'mat',down:'d',cost:3.2,lift:null,crowd:4,risk:1,styles:'S',
    from:['springboard_rise','springboard_feint'],
    next:[['cover',3],['stand_reset',3]],link:[['ground',1]],
    rev:{lines:['{D} catches {A} in mid-air on the {name} and slams them down!','{D} steps out of the way of the {name}, and {A} lands awkwardly!'],requires:'top',zone:'mat',down:'d',cost:2,crowd:3,next:[['mat_hold',2],['cover',1],['stand_reset',3]]},
    blk:{zone:'standing',lines:['{A} slips on the rope and cannot get the {name} off.','{D} moves away, and {A} decides against the {name}.'],next:[['stand_reset',2],['counter_strike',1]]},
    moves:[
     ['sb_dropkick','springboard dropkick','{A} springs off the top rope and lands a dropkick!',{}],
     ['sb_moonsault','springboard moonsault','{A} rebounds off the ropes into a moonsault!',{cost:3.8,crowd:5,after:.45}],
     ['sb_elbow','springboard elbow','{A} springs off the ropes and drops a flying elbow!',{}],
     ['sb_cutter','springboard cutter','{A} leaps off the second rope and drops {D} with a cutter!',{cost:3.8,crowd:6,after:.6,part:'neck'}],
     ['sb_arm_drag','springboard arm drag','{A} runs up the ropes and flips {D} with an arm drag!',{cost:2.6,crowd:3,part:'arm',risk:0}],
     ['sb_clothesline','springboard clothesline','{A} springs off the ropes and catches {D} with a clothesline.',{cost:3,part:'neck'}]
    ]},
   dive:{agile:1,requires:'outside',zone:'outside',down:'d',cost:3.4,lift:null,crowd:5,risk:1,after:.3,styles:'S',
    from:['outside_toss','floor_regroup'],
    next:[['roll_inside',4],['floor_brawl',2]],link:[['outside',2]],
    rev:{lines:['{D} catches {A} on the {name} and rams them into the barricade!','{D} steps aside, and {A}’s {name} crashes into the barricade!','{D} sees the {name} coming and catches {A} with a forearm through the ropes!'],requires:'outside',zone:'outside',down:'d',cost:2,crowd:4,next:[['roll_inside',3],['floor_brawl',2]]},
    blk:{lines:['{D} moves away from the ropes, and {A} stops before the {name}.','The referee gets in the way. {A} cannot go for the {name}.'],next:[['roll_inside',2],['floor_brawl',1]]},
    moves:[
     ['dv_suicide','suicide dive','{A} sprints across the ring and dives through the ropes, crashing into {D} on the floor!',{}],
     ['dv_plancha','plancha','{A} leaps over the top rope and lands a plancha on {D} on the floor!',{}],
     ['dv_tope_con_hilo','tope con hilo','{A} flips over the top rope onto {D} on the floor!',{cost:3.8,crowd:6,after:.45}],
     ['dv_moonsault','moonsault to the floor','{A} leaps from the top rope with a moonsault to the floor!',{cost:4.4,crowd:7,after:.6}],
     ['dv_apron_senton','senton off the apron','{A} flips off the apron with a senton onto {D}.',{agile:0,cost:3,crowd:4}],
     ['dv_cannonball','cannonball off the apron','{A} cannonballs off the apron and crashes into {D} at ringside!',{agile:0,cost:3,crowd:4,styles:'SB'}],
     ['dv_crossbody','crossbody over the top rope','{A} leaps over the top rope with a crossbody onto {D} at ringside!',{}],
     ['dv_asai','springboard moonsault to the floor','{A} springs off the middle rope and moonsaults onto {D} on the floor!',{cost:4,crowd:6,after:.5}],
     ['dv_somersault','somersault plancha','{A} flips over the top rope and lands on {D} with a somersault plancha!',{cost:3.8,crowd:6,after:.5}]
    ]},
   submission:{requires:'mat',zone:'mat',down:'d',cost:1.8,lift:null,crowd:2,focus:2,styles:'T',
    from:['mat_hold','target_hold','mat_takedown','grapple_trip','ankle_pick','leg_wrench','grounded_switch','rib_knee','hope_cutoff','ch_single_leg','ch_double_leg','ch_fireman'],
    next:[['submission_ropes',3],['rope_crawl',3],['submission_roll',2],['mat_scramble',1]],link:[['submission',1],['ground',1]],
    rev:{lines:['{D} rolls through the {name} and breaks the hold!','{D} kicks {A} away and escapes the {name}!','{D} powers out of the {name} and scrambles free!','{D} reaches the bottom rope and the {name} is broken!'],requires:'mat',zone:'standing',down:null,cost:1.4,crowd:3,next:[['stand_reset',2],['strike_trade',2],['counter_strike',1]]},
    blk:{lines:['{D} stretches for the ropes, but {A} drags them back to the centre and keeps the {name} locked in!','{D} nearly gives up but keeps fighting. {A} tightens the {name}.','The referee asks {D} if they want to quit. {D} says no and keeps fighting the {name}.'],next:[['submission_ropes',2],['rope_crawl',2],['mat_scramble',1]]},
    moves:[
     ['sm_armbar','armbar','{A} stretches {D}’s arm across their hips into an armbar.',{part:'arm'}],
     ['sm_cross_armbreaker','cross armbreaker','{A} falls back with a cross armbreaker, pulling {D}’s arm straight!',{part:'arm',crowd:4,after:.45}],
     ['sm_kimura','kimura','{A} locks a kimura and turns {D}’s arm behind their back.',{part:'arm',after:.35}],
     ['sm_keylock','keylock','{A} figure-fours {D}’s arm and cranks the keylock.',{part:'arm'}],
     ['sm_fujiwara','Fujiwara armbar','{A} lies across {D}’s back and twists the arm into a Fujiwara armbar.',{part:'arm',after:.35}],
     ['sm_triangle','triangle choke','{A} wraps both legs around {D}’s head and arm in a triangle choke!',{part:'neck',crowd:4,after:.45}],
     ['sm_rear_naked','rear naked choke','{A} takes {D}’s back and sinks in a rear naked choke!',{part:'neck',crowd:4,after:.45}],
     ['sm_sleeper','sleeper hold','{A} applies a sleeper hold. {D}’s arm drops once… twice…',{part:'neck',crowd:4,styles:'TY'}],
     ['sm_camel','camel clutch','{A} sits on {D}’s back, pulls up on the chin and wrenches back with a camel clutch.',{part:'back',styles:'BY'}],
     ['sm_boston','Boston crab','{A} turns {D} over into a Boston crab and leans back!',{part:'back',crowd:3}],
     ['sm_single_crab','single-leg crab','{A} grabs one leg and turns {D} into a single-leg crab.',{part:'leg'}],
     ['sm_figure_four','figure-four leglock','{A} locks in the figure-four! {D} slaps the mat in agony!',{part:'leg',crowd:5,after:.4}],
     ['sm_ankle_lock','ankle lock','{A} traps {D}’s foot and wrenches the ankle lock!',{part:'leg',crowd:4,after:.4}],
     ['sm_heel_hook','heel hook','{A} twists {D}’s heel into a heel hook, torquing the knee.',{part:'leg',after:.5}],
     ['sm_kneebar','kneebar','{A} wraps {D}’s leg and arches into a kneebar.',{part:'leg',after:.4}],
     ['sm_stf','STF','{A} hooks the leg, falls across {D}’s back and wrenches the face back in an STF!',{part:'neck',crowd:4,after:.45}],
     ['sm_crossface','crossface','{A} traps {D}’s arm and cranks across their face with a crossface!',{part:'neck',crowd:4,after:.45}],
     ['sm_abdominal','abdominal stretch','{A} wraps {D} in an abdominal stretch, using the ropes for leverage behind the referee’s back.',{rv:['{D} hip-tosses {A} over and escapes the {name}!'],requires:'standing',zone:'standing',down:null,part:'ribs',crowd:-1,from:['waistlock','go_behind','body_shot'],styles:'BY'}],
     ['sm_surfboard','surfboard stretch','{A} plants knees in {D}’s back and pulls the arms into a surfboard stretch.',{part:'back'}],
     ['sm_chinlock','rear chinlock','{A} sits behind {D} and grinds a chinlock.',{part:'neck',cost:1,crowd:0,styles:'TY'}],
     ['sm_sharpshooter','sharpshooter','{A} steps through {D}’s legs, turns them over and leans back in a sharpshooter!',{part:'back',crowd:5,after:.5}],
     ['sm_dragon_sleeper','dragon sleeper','{A} hooks {D}’s head and bends the neck back in a dragon sleeper!',{part:'neck',after:.45}],
     ['sm_deathlock','Indian deathlock','{A} weaves {D}’s legs together and falls back in an Indian deathlock.',{part:'leg',after:.35}],
     ['sm_cloverleaf','cloverleaf','{A} folds {D}’s legs into a cloverleaf and turns them over!',{part:'back',crowd:4,after:.5}],
     ['sm_bow_arrow','bow and arrow hold','{A} pulls {D} back across the knees in a bow and arrow hold.',{part:'back',styles:'T'}],
     ['sm_anaconda','arm-trap choke','{A} wraps the arm and neck and squeezes with an arm-trap choke.',{part:'neck',after:.5}],
     ['sm_cobra','cobra clutch','{A} wraps {D}’s arm across the throat and squeezes in a cobra clutch.',{part:'neck'}],
     ['sm_octopus','octopus stretch','{A} climbs onto {D} and wraps every limb into an octopus stretch!',{rv:['{D} powers out, peels {A} off and escapes the {name}!'],requires:'standing',zone:'standing',down:null,part:'back',crowd:4,after:.5,from:['waistlock','go_behind'],styles:'TY'}],
     ['sm_muffler','stretch muffler','{A} stretches {D}’s leg back and drives the knee into the mat.',{part:'leg',after:.4}],
     ['sm_arm_triangle','arm triangle','{A} sinks an arm triangle and squeezes, cutting off the air!',{part:'neck',after:.5}],
     ['sm_wristlock_ground','grounded wristlock','{A} isolates {D}’s wrist on the mat and bends it back.',{part:'arm',cost:1.2,crowd:1}],
     ['sm_short_arm_scissors','short-arm scissors','{A} traps {D}’s arm between their legs and pulls it back.',{part:'arm',after:.3}],
     ['sm_lion_tamer','elevated crab','{A} turns {D} into a crab and drives a knee into the neck!',{part:'back',crowd:5,after:.55}],
     ['sm_rings','leg spreader','{A} traps both of {D}’s legs and pulls them apart.',{part:'leg',after:.3}],
     ['sm_toe_hold','toe hold','{A} twists {D}’s foot in a toe hold.',{part:'leg',cost:1.2,crowd:1}]
    ]},
   ground:{requires:'mat',zone:'mat',down:'d',cost:1.4,lift:null,crowd:1,focus:1,styles:'BY',
    from:['clothesline','snap_suplex','shoulder_tackle','mat_hold','heavy_slam','short_arm_lariat','arm_drag','hip_toss','mat_takedown','hope_cutoff','power_spinebuster','running_headscissors'],
    next:[['stand_reset',3],['mat_hold',2],['early_cover',1],['target_hold',1]],link:[['submission',1],['ground',1]],
    rev:{lines:['{D} rolls clear and the {name} misses!','{D} moves away from the {name} and gets to their feet first!','{D} sees the {name} coming and kicks {A} away!'],still:['{D} kicks {A} away and gets back to their feet!','{D} fights free and gets up before {A} can continue!'],requires:'mat',zone:'standing',down:null,cost:.9,crowd:2,next:[['strike_trade',2],['counter_strike',2],['stand_reset',1]]},
    moves:[
     ['gd_elbow_drop','elbow drop','{A} drops an elbow across {D}’s chest.',{part:'ribs'}],
     ['gd_knee_drop','knee drop','{A} drops a knee across {D}’s head.',{part:'neck'}],
     ['gd_leg_drop','leg drop','{A} drops a leg across {D}’s throat.',{part:'neck',crowd:2}],
     ['gd_stomp','stomp','{A} stomps on {D}’s {part}.',{cost:1}],
     ['gd_senton','senton','{A} drops a back senton onto {D}.',{part:'ribs',cost:1.8}],
     ['gd_splash','standing splash','{A} splashes onto {D}.',{part:'ribs',cost:1.8}],
     ['gd_headbutt','falling headbutt','{A} drops down with a headbutt to {D}’s {part}.',{cost:1.4}],
     ['gd_arm_elbows','elbows to the arm','{A} kneels on {D}’s wrist and drives elbows into the arm.',{still:1,part:'arm',focus:2,styles:'T'}],
     ['gd_knee_stomp','stomp to the knee','{A} stomps down on {D}’s knee.',{part:'leg',focus:2,styles:'TB'}],
     ['gd_ground_pound','ground and pound','{A} mounts {D} and throws punches until the referee pulls them off.',{still:1,cost:1.8,crowd:2,styles:'B'}],
     ['gd_fist_drop','fist drop','{A} drops a fist on {D}.',{cost:.9}],
     ['gd_standing_moonsault','standing moonsault','{A} flips backwards into a standing moonsault!',{agile:1,cost:2.6,crowd:3,after:.45,styles:'S'}],
     ['gd_running_senton','running senton','{A} bounces off the ropes and lands a senton!',{cost:2.4,crowd:3,part:'ribs'}],
     ['gd_choke_ropes','choke on the ropes','{A} drags {D} over to the ropes and chokes them while the referee counts.',{still:1,part:'neck',crowd:-2,cost:.8,styles:'BY'}],
     ['gd_back_rake','back rake','{A} rakes {D}’s back and taunts the crowd.',{still:1,part:'back',crowd:-1,cost:.6,styles:'Y'}],
     ['gd_dragon_screw_ground','leg twist on the mat','{A} spins {D}’s leg against the joint while it is trapped on the canvas.',{still:1,part:'leg',focus:2,styles:'T'}],
     ['gd_arm_stomp','stomp to the arm','{A} stomps on {D}’s arm, keeping the pressure on the limb.',{part:'arm',focus:2}],
     ['gd_rib_stomp','stomp to the ribs','{A} stomps on {D}’s ribs.',{part:'ribs',focus:2}],
     ['gd_elbow_neck','elbow drop to the neck','{A} drops an elbow onto the back of {D}’s neck.',{part:'neck',focus:2}],
     ['gd_lower_back_knee','knee to the lower back','{A} drives a knee into {D}’s lower back and pulls up on the arms.',{still:1,part:'back',focus:2}]
    ]},
   chain:{requires:'standing',zone:'standing',down:null,cost:1.1,lift:null,crowd:1,styles:'T',
    from:['lockup','collar_snap','circle','waistlock','wristlock','headlock','knuckle_lock','clean_break','go_behind','front_facelock'],
    next:[['wristlock',2],['waistlock',2],['lockup',1],['headlock',1]],link:[['chain',2],['suplex',1]],
    rev:{lines:['{D} counters the {name} with a quick arm drag!','{D} reads the {name} and turns it into a front facelock!','{D} blocks the {name} and slips behind {A}!'],zone:'standing',down:null,cost:1,crowd:2,next:[['front_facelock',2],['waistlock',2],['wristlock',1]]},
    moves:[
     ['ch_single_leg','single-leg takedown','{A} shoots in, grabs a leg and takes {D} to the mat.',{rv:['{D} sprawls on the {name} attempt and spins behind {A}!'],zone:'mat',down:'d',part:'leg'}],
     ['ch_double_leg','double-leg takedown','{A} drops levels and drives through {D} with a double-leg takedown.',{rv:['{D} sprawls on the {name} attempt and spins behind {A}!'],zone:'mat',down:'d',cost:1.4}],
     ['ch_fireman','fireman’s carry takeover','{A} ducks under, lifts {D} across the shoulders and flips them to the mat.',{rv:['{D} drops their weight, blocks the {name} and spins behind {A}!'],zone:'mat',down:'d',cost:1.6,lift:30}],
     ['ch_snapmare','snapmare','{A} snaps {D} over the shoulder and onto the mat with a snapmare.',{zone:'mat',down:'d',next:[['sm_chinlock',3]]}],
     ['ch_deep_arm_drag','deep arm drag','{A} hooks the arm deep and drags {D} over with an arm drag.',{zone:'mat',down:'d',part:'arm'}],
     ['ch_japanese_arm_drag','Japanese arm drag','{A} flips forward with {D}’s arm, dragging them over!',{agile:1,zone:'mat',down:'d',part:'arm',cost:1.6,crowd:2,styles:'TS'}],
     ['ch_drop_toehold','drop toehold','{A} falls into {D}’s ankles and trips them face-first.',{rv:['{D} steps over the {name} and takes {A}’s back!'],zone:'mat',down:'d',part:'leg'}],
     ['go_behind','go-behind','{A} ducks under and gets behind {D}, holding the waist.',{next:[['sx_german',2],['standing_switch',2],['mat_takedown',2]]}],
     ['standing_switch','standing switch','{D} switches behind; {A} switches back. They go back and forth for position.',{rev:false,next:[['go_behind',2],['waist_escape',2],['sx_german',1]],block:false}],
     ['front_facelock','front facelock','{A} snaps {D} down into a front facelock.',{part:'neck',next:[['sx_vertical',2],['nk_ddt',2],['sx_brainbuster',1]]}],
     ['knuckle_lock','test of strength','{A} and {D} lock fingers in a test of strength. Neither gives ground.',{rv:['{D} bridges out of the test of strength, slips free and takes {A}’s back!'],cost:1.6,crowd:2,next:[['knuckle_break',2],['go_behind',1]],styles:'BY'}],
     ['knuckle_break','bridge in the test of strength','{A} forces {D} to their knees, but {D} bridges and pushes back up!',{rev:false,cost:1.8,crowd:3,next:[['strike_trade',2],['lockup',2]],styles:'TY',block:false}],
     ['ch_top_wristlock','top wristlock','{A} takes a top wristlock and turns {D} to face the mat.',{part:'arm',next:[['wrist_escape',2],['ch_snapmare',1]]}],
     ['ch_drop_down','drop-down and leapfrog','{D} drops down, then leapfrogs as {A} rebounds off the ropes.',{rev:false,cost:1.4,crowd:2,next:[['rope_run',2],['ch_deep_arm_drag',2],['pw_shoulder_tackle_power',1]],block:false}],
     ['ch_headlock_takedown','side headlock takedown','{A} drags {D} to the mat with a tight side headlock.',{zone:'mat',down:'d',part:'neck'}],
     ['ch_leg_trip','leg trip','{A} sweeps {D}’s legs and drops them on the mat.',{rv:['{D} hops over the {name} and spins behind {A}!'],zone:'mat',down:'d'}],
     ['ch_cravate','cravate','{A} locks the head in a cravate and grinds {D}’s neck.',{part:'neck',focus:1}],
     ['ch_short_arm','escape','{A} slips out from {D}’s grip and changes position.',{rev:false,block:false}],
     ['ch_dragon_screw','dragon screw','{A} catches {D}’s leg and spins it, taking {D} to the mat!',{zone:'mat',down:'d',part:'leg',focus:2,cost:1.8,crowd:2}],
     ['ch_rolling_wristlock','rolling wristlock','{A} rolls into a wristlock and keeps hold of {D}.',{part:'arm',cost:1.2,next:[['arm_wringer',2]]}],
     ['ch_kip_up','kip-up','{A} springs up with a kip-up and ends up face to face with {D}.',{rev:false,agile:1,crowd:3,cost:1.2,block:false,next:[['strike_trade',2],['lockup',2]]}],
     ['ch_headlock_escape','headscissors escape','{A} slips out of the headscissors, kips up and stands facing {D}.',{rev:false,agile:1,crowd:3,cost:1.4,block:false,next:[['circle',2],['lockup',2]]}],
     ['ch_rollthrough','roll-through','{A} rolls through and comes up on top.',{rev:false,cost:1,block:false}],
     ['ch_hip_toss_chain','hip toss','{A} tosses {D} over the hip.',{zone:'mat',down:'d'}]
    ]},
   pin:{requires:'standing',zone:'mat',down:'d',cost:1.4,lift:null,crowd:5,after:.45,nearfall:1,styles:'TY',
    from:['counter_strike','last_second_counter','quiet_reversal','strike_trade','lockup','finish_counter','dramatic_rally','rope_rebound','duck_rebound','waist_escape'],
    next:[['stand_reset',4],['strike_trade',2],['clothesline',1]],link:[['strike',1]],
    rev:{lines:['{D} sits down on the {name} and almost turns it into a pin of their own!','{D} blocks the {name}, rolls through and gets back up first!'],zone:'standing',down:null,cost:1,crowd:4,next:[['strike_trade',2],['clothesline',2]]},
    moves:[
     ['pn_small_package','small package','{A} rolls {D} into a small package! ONE! TWO! {D} kicks out!',{}],
     ['pn_schoolboy','schoolboy','{A} trips {D} from behind with a schoolboy! ONE! TWO! {D} kicks out!',{}],
     ['pn_inside_cradle','inside cradle','{A} rolls {D} up with an inside cradle! TWO AND THREE-QUARTERS!',{crowd:6}],
     ['pn_crucifix','crucifix pin','{A} traps the arms with a crucifix pin! ONE! TWO! {D} gets out!',{}],
     ['pn_sunset','sunset flip','{A} flips over {D} and rolls them up with a sunset flip! TWO! {D} kicks out!',{from:['rope_rebound','duck_rebound','rope_run']}],
     ['pn_victory_roll','victory roll','{A} leaps onto {D}’s shoulders and rolls them up! TWO! {D} kicks out!',{crowd:6,styles:'S'}],
     ['pn_backslide','backslide','{A} catches {D} with a backslide! ONE! TWO! {D} kicks out!',{}],
     ['pn_oconnor','rolling cradle','{A} rolls {D} up and holds the legs! ONE! TWO! No!',{}],
     ['pn_jackknife','jackknife cover','{A} folds {D} up with a jackknife cover! TWO! {D} gets free!',{}],
     ['pn_magistral','La Magistral cradle','{A} spins around {D}’s arm and rolls them up! TWO! {D} kicks out!',{crowd:6,styles:'S'}],
     ['pn_bridge_rollup','bridging rollup','{A} rolls {D} up and bridges for leverage! TWO! {D} kicks out!',{}]
    ]},
   outside:{requires:'outside',zone:'outside',down:null,cost:1.5,lift:null,crowd:2,styles:'BY',
    from:['outside_toss','floor_brawl','floor_counter','apron_stand','floor_regroup'],
    next:[['roll_inside',3],['floor_brawl',2],['floor_counter',1],['apron_stand',1]],link:[['outside',1]],
    rev:{lines:['{D} blocks the {name} and reverses, sending {A} into the barricade!','{D} turns the {name} around on the floor!'],requires:'outside',zone:'outside',down:null,cost:1.2,crowd:3,next:[['roll_inside',3],['floor_brawl',2]]},
    moves:[
     ['os_barricade','barricade whip','{A} whips {D} hard into the barricade.',{part:'back',focus:1}],
     ['os_post','ring post shot','{A} rams {D}’s shoulder into the ring post!',{part:'arm',focus:2,crowd:3}],
     ['os_post_leg','leg around the post','{A} pulls {D}’s leg around the ring post and wrenches it!',{rv:['{D} kicks {A} away from the post, and {A} crashes into the barricade!'],part:'leg',focus:2,crowd:-1,styles:'BT'}],
     ['os_apron_knee','apron knee drop','{A} drops a knee on {D}, draped over the apron.',{part:'neck',cost:1.8}],
     ['os_apron_ddt','DDT on the apron','{A} spikes {D} with a DDT on the ring apron!',{part:'neck',cost:3,crowd:5,after:.6,risk:1}],
     ['os_floor_chop','chop on the floor','{A} lands a loud chop on the floor. The crowd at ringside winces.',{part:'ribs',crowd:3}],
     ['os_steps','whip into the ring steps','{A} sends {D} into the ring steps!',{part:'leg',focus:1,crowd:3,cost:2,styles:'B'}],
     ['os_apron_slam','body slam on the apron','{A} body slams {D} on the hard edge of the ring apron!',{part:'back',focus:2,lift:26,cost:3,crowd:4,after:.5,risk:1}],
     ['os_crowd_brawl','brawl into the crowd','{A} and {D} brawl into the crowd. The fans scatter.',{rv:['{D} turns the brawl around in the crowd and throws {A} back over the barricade!'],cost:2,crowd:4,styles:'B'}],
     ['os_headbutt','headbutt on the floor','{A} grabs {D} by the hair and headbutts them on the floor.',{}],
     ['os_apron_forearm','forearm on the apron','{A} hits {D} with a forearm as they try to climb back in.',{}],
     ['os_ropes_choke','choke on the bottom rope','{A} hangs {D}’s throat over the bottom rope and drops on it while the referee counts.',{rv:['{D} drags {A} off the apron by the leg, and {A} lands against the barricade!'],part:'neck',crowd:-2,cost:1,styles:'BY'}],
     ['os_apron_kick','kick from the apron','{A} kicks {D} in the head from the apron!',{crowd:4,cost:2.2,styles:'S'}],
     ['os_count_tease','race against the count','{A} rolls in at eight. {D} only just beats the count!',{rev:false,zone:'standing',crowd:5,cost:1,next:[['strike_trade',2],['clothesline',2],['counter_strike',2]],block:false}]
    ]},
   heel:{requires:'standing',zone:'standing',down:null,cost:.7,lift:null,crowd:-2,styles:'BY',
    from:['strike_trade','lockup','clean_break','corner_push','cheap_shot','opponent_study','crowd_pose','taunt','false_handshake'],
    next:[['strike_trade',2],['corner_whip',1],['clothesline',1],['cheap_shot',1]],link:[['strike',1],['ground',0]],
    rev:{lines:['{D} sees the {name} coming and makes {A} pay for it!','{D} ignores the {name} and fires back with a flurry of punches!','The referee catches the {name}, and {D} uses the argument to strike back!'],zone:'standing',down:null,cost:1,crowd:4,next:[['strike_trade',2],['clothesline',2],['counter_strike',1]]},
    moves:[
     ['hl_hair_pull','hair pull','{A} drags {D} across the ring by the hair while the referee warns them.',{rv:['{D} grabs {A}’s wrist, breaks the grip on the hair and fires back!']}],
     ['hl_ref_argue','argument with the referee','{A} argues with the referee about the count while {D} recovers.',{rv:['While {A} is arguing with the referee, {D} spins them around and lands a right hand!'],cost:-1.2,next:[['circle',2],['probe_strike',2]]}],
     ['hl_stall','stalling','{A} slides under the bottom rope and takes a walk around ringside. The crowd boos.',{rv:['{D} has had enough of the stalling, follows {A} to the floor and throws them back into the ring!'],cost:-1.8,crowd:-3,next:[['lockup',2],['circle',2]]}],
     ['hl_thumb','thumb to the eye','{A} jabs a thumb into {D}’s eye.',{rv:['{D} blocks the thumb to the eye and answers with a punch of their own!']}],
     ['hl_low_blow_tease','kick to the knee','{A} kicks {D} in the knee while they are distracted.',{rv:['{D} catches the kick to the knee and spins {A} around into a forearm!'],part:'leg',focus:1}],
     ['hl_rope_leverage','grab at the ropes','{A} grabs the ropes for extra leverage behind the referee’s back.',{rv:['The referee kicks {A}’s hand off the ropes, and {D} takes full advantage!'],cost:.9}],
     ['hl_mock','mockery','{A} copies {D}’s signature pose. The crowd is furious.',{rv:['{D} is not amused by the mockery and catches {A} mid-pose with a forearm!'],cost:-.6,crowd:-3,next:[['counter_strike',3],['cheap_shot',1]]}],
     ['hl_choke_shirt','choke with the tape','{A} chokes {D} with the wrist tape while the referee counts.',{rv:['The referee pulls {A} off the choke, and {D} comes back swinging!'],part:'neck'}],
     ['hl_bite','bite','{A} bites {D}’s forehead. The referee warns {A} again.',{rv:['{D} shoves {A} away from the bite and fires back with a headbutt!']}],
     ['hl_rake','rake across the eyes','{A} rakes {D}’s eyes to stop the comeback.',{rv:['{D} blocks the rake across the eyes and answers with a forearm!']}],
     ['hl_fake_injury','faked injury','{A} clutches their knee. When {D} checks on them, {A} attacks!',{rv:['{D} does not fall for the faked injury and catches {A} with a kick as they spring up!'],after:.4,crowd:-4,next:[['pn_small_package',1],['clothesline',2]]}],
     ['hl_beg','plea for mercy','{A} backs into the corner, begging {D} to stop. {D} hesitates.',{rv:['{D} ignores the begging, drags {A} out of the corner and lets fly!'],cost:-.8,next:[['hl_thumb',2],['cheap_shot',2],['counter_strike',2]]}],
     ['hl_distraction_apron','apron distraction','{A} leans on the apron and distracts the referee.',{rv:['The referee ignores the distraction, and {D} catches {A} looking the wrong way!'],cost:-.5,next:[['cheap_shot',2],['hl_thumb',1]]}],
     ['hl_strut','strut','{A} struts around the ring as if the match is already won.',{rv:['{D} interrupts the strut with a forearm to the back of the head!'],cost:-1,crowd:-2,next:[['counter_strike',3],['probe_strike',2]]}]
    ]},
   fire:{requires:'standing',zone:'standing',down:null,cost:1.8,lift:null,crowd:4,styles:'YB',
    from:['hope_elbows','dramatic_rally','counter_rollup','submission_roll','stand_reset','hope_elbows_standing','handstand_escape','rope_break'],
    next:[['clothesline',2],['strike_trade',2],['corner_whip',1]],link:[['strike',1],['neck',1],['power',1]],
    rev:{lines:['{A} starts to fire up, but {D} cuts the comeback off with a knee to the gut!','{D} rakes the eyes and stops {A}’s rally before it can start!','{D} sees the comeback coming and drops {A} with a thumb to the throat!'],zone:'mat',down:'d',cost:1,crowd:-1,next:[['mat_hold',2],['target_hold',2],['gd_stomp',1]]},
    moves:[
     ['fr_no_sell','no-sell','{A} takes three forearms from {D} and does not move.',{after:.5,crowd:5,cost:1.2}],
     ['fr_punch_flurry','comeback punches','{A} fires back with a flurry of punches. The crowd counts along!',{crowd:5}],
     ['fr_ten_punches','punches in the corner','{A} rains down punches from the second rope as the crowd counts to ten!',{requires:'corner',zone:'corner',crowd:5,from:['corner_whip','corner_strikes']}],
     ['fr_double_clothesline','double clothesline','{A} and {D} hit each other with clotheslines at the same time. Both are down!',{rev:false,zone:'mat',down:'d',crowd:5,after:.5,cost:2.4,next:[['double_down_count',4]]}],
     ['fr_shake_ropes','rope-shaking rally','{A} rises and shakes the ropes. The crowd is behind them!',{after:.5,crowd:6,cost:.6,next:[['clothesline',3],['fr_punch_flurry',2]]}],
     ['fr_second_wind','second wind','{A} beats the count, staggers up and starts firing back.',{after:.55,crowd:5,cost:-.8}],
     ['fr_crowd_clap','crowd clap','{A} gets the crowd clapping as they fight back to their feet.',{crowd:5,cost:.4}],
     ['fr_atomic_drop','atomic drop','{A} hoists {D} up and drops them tailbone-first across the knee!',{part:'back',lift:26,cost:2.2,crowd:3,next:[['clothesline',3],['corner_whip',1]]}],
     ['fr_back_body_drop','back body drop','{A} catches {D} charging in and flips them over with a back body drop!',{zone:'mat',down:'d',crowd:4,cost:1.8,from:['rope_run','duck_rebound','rope_rebound']}],
     ['fr_flying_forearm','flying forearm','{A} bounces off the ropes and flattens {D} with a flying forearm!',{zone:'mat',down:'d',crowd:4,cost:2.2}],
     ['fr_inverted_atomic','inverted atomic drop','{A} drops {D} groin-first across the knee with an inverted atomic drop!',{lift:24,cost:2,crowd:3}],
     ['fr_hulk_kick','running boot','{A} charges in and lands a running boot!',{zone:'mat',down:'d',crowd:4,cost:2,after:.5}],
     ['fr_mounted_comeback','mounted punches on the mat','{A} jumps on {D} and throws punches as the crowd cheers.',{zone:'mat',down:'d',crowd:4,cost:1.6}],
     ['fr_fight_on_knees','strikes on the knees','{A} and {D} trade blows on their knees, slowly rising to their feet together.',{crowd:5,after:.5,cost:1.8}],
     ['double_down_count','double count','Both wrestlers are down. The referee counts… FOUR… FIVE… SIX… and they both stir.',{rev:false,requires:'mat',zone:'standing',down:null,crowd:4,cost:-2.2,block:false,next:[['fr_fight_on_knees',2],['strike_trade',3],['st_fighting_spirit',2]]}]
    ]},
   rest:{requires:'mat',zone:'mat',down:'d',cost:-.6,lift:null,crowd:0,focus:1,styles:'TY',
    from:['mat_hold','target_hold','mat_takedown','arm_drag','ch_headlock_takedown','ch_snapmare','hope_cutoff','grounded_switch'],
    next:[['hope_elbows',3],['mat_scramble',2],['rope_crawl',2],['target_hold',1]],link:[['submission',1],['ground',1]],
    rev:{lines:['{D} fights up to their feet with the crowd behind them and breaks the {name}!','{D} elbows free of the {name}!'],zone:'standing',down:null,cost:1.2,crowd:4,next:[['strike_trade',2],['counter_strike',2],['fr_punch_flurry',1]]},
    blk:{zone:'mat',lines:['{D} pushes up to a knee in the {name}, but {A} drags them back down.','The referee checks {D}’s arm in the {name}; it drops twice, then stays up!'],next:[['hope_elbows',2],['mat_scramble',1]]},
    moves:[
     ['rs_side_headlock','side headlock on the mat','{A} grinds a side headlock on the mat and slows the pace.',{part:'neck'}],
     ['rs_armbar_rest','rest armbar','{A} keeps a loose armbar and catches a breath while working {D}’s arm.',{part:'arm'}],
     ['rs_body_scissors','body scissors','{A} wraps the legs around {D}’s middle and squeezes.',{part:'ribs'}],
     ['rs_nerve_hold','shoulder nerve hold','{A} squeezes the base of {D}’s neck in a nerve hold.',{part:'neck',styles:'Y'}],
     ['rs_front_chancery','front chancery','{A} keeps {D}’s head trapped under the arm and grinds it.',{part:'neck'}],
     ['rs_leg_lace','leg lace','{A} ties up {D}’s legs and leans back, keeping them pinned down.',{part:'leg',styles:'T'}],
     ['rs_seated_chinlock','seated chinlock','{A} drives a knee between {D}’s shoulder blades and pulls the chin.',{part:'back'}],
     ['rs_hammerlock_mat','hammerlock on the mat','{A} holds {D}’s arm behind their back on the mat.',{part:'arm',styles:'T'}],
     ['rs_cover_rest','lateral press','{A} lays across {D} for a lateral press, mostly to slow things down. Kick-out at one.',{rev:false,block:false,after:.3,crowd:1}],
     ['rs_reverse_chinlock','reverse chinlock','{A} sits behind {D} and pulls back with a reverse chinlock.',{part:'neck',styles:'Y'}],
     ['rs_mat_stretch','grounded stretch','{A} stretches {D} across the canvas, keeping them down without spending energy.',{part:'back'}],
     ['rs_wrist_mat','wrist control on the mat','{A} holds {D}’s wrist down and keeps them flat on the mat.',{part:'arm',styles:'T'}]
    ]},
   lucha:{agile:1,requires:'standing',zone:'mat',down:'d',cost:2.2,lift:null,crowd:3,styles:'S',
    from:['rope_run','rope_rebound','duck_rebound','springboard_feint','ch_drop_down','counter_strike'],
    next:[['stand_reset',3],['rope_run',1],['springboard_rise',1],['early_cover',1]],link:[['lucha',1],['dive',0]],
    rev:{lines:['{D} catches {A} out of the {name} and slams them down!','{D} stops the {name} halfway and drops {A} on their back!'],zone:'mat',down:'d',cost:1.6,crowd:3,next:[['mat_hold',2],['stand_reset',3]]},
    blk:{zone:'standing',lines:['{D} reads the {name} and stays on their feet. {A} lands, and they face each other again.','{A} goes for the {name}, but {D} stops and backs off.'],next:[['circle',2],['strike_trade',1]]},
    moves:[
     ['lc_hurricanrana','hurricanrana','{A} leaps, scissors {D}’s head and flips them with a hurricanrana!',{part:'neck',crowd:4}],
     ['lc_headscissors','tilt-a-whirl headscissors','{A} swings around {D}’s body and takes them over with headscissors!',{}],
     ['lc_arm_drag_wheel','cartwheel into an arm drag','{A} cartwheels around {D} and hits an arm drag!',{part:'arm'}],
     ['lc_tornillo','tornillo','{A} spins forward through the air into a tornillo!',{cost:3,crowd:5,after:.45,risk:1}],
     ['lc_dropkick_flip','backflip into a dropkick','{A} backflips away from {D} and lands a dropkick!',{cost:2.6,crowd:4}],
     ['lc_rana_pin','hurricanrana into a pin','{A} flips {D} with a hurricanrana and rolls into a pin! TWO! {D} kicks out!',{after:.45,crowd:5,nearfall:1}],
     ['lc_handspring','handspring elbow','{A} handsprings off the ropes into a back elbow!',{cost:2.8,crowd:4,after:.35}],
     ['lc_wheelbarrow','wheelbarrow bulldog','{A} jumps onto {D}’s back and drives them face-first into the mat!',{part:'neck',crowd:4}],
     ['lc_rope_walk','rope walk','{A} runs along the top rope and comes down on {D} with a crossbody!',{cost:3.2,crowd:6,after:.5,risk:1}],
     ['lc_head_kick','head kick','{A} kicks {D} in the head!',{crowd:4}]
    ]},
   rope:{requires:'standing',zone:'standing',down:null,cost:1.4,lift:null,crowd:2,styles:'SB',
    from:['rope_run','rope_rebound','shove_ropes','corner_whip','strike_trade','duck_rebound'],
    next:[['strike_trade',2],['rope_run',1],['clothesline',1]],link:[['rope',1],['running',2]],
    rev:{lines:['{D} ducks under, and {A}’s momentum carries them over the top rope to the floor!','{D} pulls the top rope down, and {A} tumbles out to the floor!'],zone:'outside',down:null,cost:1.4,crowd:4,next:[['floor_regroup',2],['roll_inside',2]]},
    moves:[
     ['rp_hangman','hangman neckbreaker on the ropes','{A} snaps {D}’s neck across the top rope!',{part:'neck',crowd:3,cost:1.8}],
     ['rp_slingshot','slingshot back into the ring','{A} launches {D} into the bottom rope with a slingshot!',{part:'neck',cost:1.6}],
     ['rp_drop_kick_ropes','dropkick on the ropes','{A} dropkicks {D}, who is draped over the middle rope!',{crowd:3,cost:2}],
     ['rp_tiger_feint','feint kick through the ropes','{A} fakes a kick through the ropes, and {D} reels backwards!',{agile:1,crowd:4,cost:2.4,after:.35,styles:'S'}],
     ['rp_ropes_choke','choke on the middle rope','{A} hangs {D} across the middle rope and chokes them until four.',{rv:['{D} kicks free of the ropes and sends {A} tumbling through them to the floor!'],part:'neck',crowd:-2,cost:.8,styles:'BY'}],
     ['rp_rebound_lariat','rebound lariat','{A} bounces off the ropes and flattens {D} with a lariat!',{zone:'mat',down:'d',part:'neck',crowd:3,cost:2.2}],
     ['rp_springboard_feint','fake springboard','{A} jumps to the apron, fakes a springboard and catches {D} with a kick!',{agile:1,crowd:3,cost:1.6,styles:'S'}],
     ['rp_second_rope_elbow','elbow from the middle rope','{A} steps onto the middle rope and drops an elbow on {D}!',{zone:'mat',down:'d',cost:2,crowd:3}],
     ['rp_skin_cat','skin-the-cat','{A} goes over the top, holds the rope and swings back in!',{agile:1,crowd:5,cost:2,after:.3,styles:'S'}],
     ['rp_rope_hang','tie-up in the ropes','{A} ties {D}’s arms in the ropes and hits them.',{rv:['{D} pulls an arm free of the ropes and knocks {A} out to the floor!'],part:'ribs',focus:1,crowd:-1,styles:'B'}]
    ]},
   running:{requires:'standing',zone:'mat',down:'d',cost:2.2,lift:null,crowd:2,styles:'BS',
    from:['rope_run','rope_rebound','duck_rebound','corner_escape','rebound_counter','ch_drop_down'],
    next:[['stand_reset',3],['cover',1],['mat_hold',2]],link:[['ground',1],['pin',0]],
    rev:{lines:['{D} sidesteps the {name}, and {A} runs into the ropes!','{D} drops to the mat, and the {name} misses completely!','{D} leapfrogs the {name} and turns to face {A}!'],zone:'standing',down:null,cost:1,crowd:2,next:[['clothesline',2],['strike_trade',2],['counter_strike',1]]},
    moves:[
     ['rn_knee','running knee','{A} bounces off the ropes and drives a knee into {D}!',{crowd:3}],
     ['rn_crossbody','running crossbody','{A} jumps at {D} with a running crossbody!',{next:[['early_cover',2]]}],
     ['rn_spear','spear','{A} explodes across the ring and spears {D} in half!',{part:'ribs',cost:3,crowd:5,after:.45}],
     ['rn_flying_shoulder','flying shoulder block','{A} leaps and drives a shoulder into {D}.',{}],
     ['rn_elbow','running elbow','{A} rebounds off the ropes and smashes an elbow into {D}.',{}],
     ['rn_dropkick','running dropkick','{A} hits the ropes and catches {D} with a dropkick!',{crowd:3}],
     ['rn_thesz','Thesz press','{A} leaps on {D} with a Thesz press and rains down punches!',{crowd:3,after:.3}],
     ['rn_lariat','running lariat','{A} hits the ropes and comes back with a huge lariat!',{part:'neck',cost:2.6,crowd:4}],
     ['rn_hip_attack','running hip attack','{A} rebounds off the ropes and hits {D} with a hip attack!',{}],
     ['rn_seated_senton','seated senton','{A} flips over {D} and lands a seated senton!',{agile:1,styles:'S',cost:2.4,crowd:3}],
     ['rn_cannonball_mid','running cannonball','{A} cannonballs into {D} in the middle of the ring!',{cost:2.6,crowd:3,styles:'B'}],
     ['rn_bicycle_knee','bicycle knee','{A} leaps and switches legs mid-air, driving a knee into {D}!',{cost:2.6,crowd:4,after:.45}]
    ]}
  };
  // Hubs that the families need. These are ordinary graph nodes with original lines.
  node('top_follow','{A} follows {D} up the turnbuckles. Both are balanced on the top rope.',{requires:'corner',zone:'top',down:null,cost:1.8,risk:true,after:.45,next:[]});
  node('floor_regroup','{D} rolls to the floor to recover. {A} measures the distance from inside the ring.',{requires:'outside',zone:'outside',cost:-.4,next:[e('roll_inside',2),e('floor_brawl',2)]});
  node('hope_elbows_standing','{D} fights the hold with elbows to {A}’s head. The crowd is behind {D}.',{zone:'standing',down:null,crowd:3,next:[e('counter_strike',3),e('strike_trade',2)]});
  node('knee_strike_block','{A} keeps hold and drives knees into {D}’s ribs to soften them up.',{focus:1,cost:1,next:[e('snap_suplex',2),e('strike_trade',2)]});
  // Snapshot the hand-authored flow so the catalog can never drown it out.
  const authored=Object.fromEntries(Object.entries(A).map(([id,n])=>[id,new Set(n.next.map(x=>x[0]))]));
  const famOf={},members={};
  const counts={moves:0,reversals:0,blocks:0};
  for(const [fid,f] of Object.entries(F)){
   members[fid]=[];
   f.moves.forEach(([id,name,line,o={}])=>{
    const requires=o.requires||f.requires,zone=o.zone||f.zone,down=o.down!==undefined?o.down:(o.zone&&o.zone!=='mat'&&o.zone!=='outside'?null:f.down);
    const lift=o.lift!==undefined?o.lift:f.lift;
    node(id,line,{requires,zone,down,next:[...(o.next||[]),...f.next].map(([t,w])=>e(t,w)),
     cost:o.cost??f.cost,lift:lift??null,crowd:o.crowd??f.crowd,focus:o.focus??f.focus??0,
     part:o.part??f.part??null,after:o.after??f.after??0,risk:!!(o.risk??f.risk),nearfall:!!(o.nearfall??f.nearfall),agile:!!(o.agile??f.agile),
     styles:sty(o.styles||f.styles),family:fid,name});
    famOf[id]=fid;members[fid].push(id);counts.moves++;
    // Not everything is an 'attempt' that can be reversed (a kip-up, a double count). Stationary
    // offence and a few awkward names get their own wording instead of the family template.
    const rv=f.rev,rid=id+'_rev',rreq=rv.requires||requires,hasRev=o.rev!==false;
    if(hasRev){
     const words=o.rv||(o.still&&rv.still)||rv.lines;
     node(rid,words.map(t=>t.replace(/\{name\}/g,name)),{requires:rreq,reverse:true,zone:rv.zone,down:rv.down,
      next:rv.next.map(([t,w])=>e(t,w)),cost:rv.cost,crowd:rv.crowd,family:fid,name,counterOf:id,after:o.after??f.after??0});
     counts.reversals++;
    }
    if(f.blk&&o.block!==false){
     const bz=f.blk.zone||(requires==='top'?'standing':requires);
     node(id+'_blk',f.blk.lines.map(t=>t.replace(/\{name\}/g,name)),{requires,zone:bz,down:bz==='mat'?'d':null,
      next:[...(hasRev?[e(rid,1.5)]:[]),...f.blk.next.map(([t,w])=>e(t,w))],cost:Math.max(.6,(o.cost??f.cost)*.45),family:fid,name,blockOf:id,blockLift:lift??null});
     counts.blocks++;
    }
   });
  }
  // Wire setups -> moves (each move gets three deterministic entry points) and
  // moves -> other families' follow-ups, so the vocabulary forms one connected graph.
  const add=(from,to,w)=>{const n=A[from];if(!n||!A[to]||from===to)return;const hit=n.next.find(x=>x[0]===to);if(hit)hit[1]=Math.max(hit[1],w);else n.next.push([to,w]);};
  for(const [fid,f] of Object.entries(F)){
   f.moves.forEach(([id,,,o={}],i)=>{
    const pool=(o.from||f.from).filter(s=>A[s]);
    const k=Math.min(o.from?pool.length:3,pool.length),start=hash(id)%Math.max(1,pool.length);
    for(let j=0;j<k;j++){
     const src=pool[(start+j*7)%pool.length];
     const base=o.from?.9:.6;
     add(src,id,base);
     if(A[id+'_rev'])add(src,id+'_rev',base*.5);
     if(A[id+'_blk'])add(src,id+'_blk',base*.35);
    }
    for(const [tf,count] of f.link){
     const list=members[tf]||[];if(!list.length||!count)continue;
     for(let j=0;j<count;j++){
      const to=list[(hash(id+tf+j))%list.length];
      if(A[to].requires===A[id].zone||A[to].requires==='any')add(id,to,1);
     }
    }
   });
  }
  // A few climbing hubs and a superplex route for the bigger spots.
  for(const src of ['corner_strikes','corner_whip','cn_chops','cn_mounted_punches','cn_face_buckle'])add(src,'top_follow',.9);
  A.top_follow.next=members.superplex.flatMap(id=>[e(id,1),e(id+'_rev',.5),...(A[id+'_blk']?[e(id+'_blk',.35)]:[])]);
  // Catalog edges added to an authored node may carry at most half of its original weight.
  for(const [id,orig] of Object.entries(authored)){
   const n=A[id];if(!orig.size)continue;
   const base=n.next.filter(x=>orig.has(x[0])).reduce((t,x)=>t+x[1],0),extra=n.next.filter(x=>!orig.has(x[0])).reduce((t,x)=>t+x[1],0);
   if(extra>base*.5){const k=base*.5/extra;for(const x of n.next)if(!orig.has(x[0]))x[1]=Math.round(x[1]*k*1000)/1000;}
  }
  add('outside_toss','floor_regroup',1.5);add('pw_bearhug','hope_elbows_standing',1);
  return {F,famOf,members,counts};
 })();
 const CROWD_SCALE=.3,SHEET_PULL=1.8;
 const PART_OF={'lower back':'back','left knee':'leg',ankle:'leg',neck:'neck',shoulder:'arm',ribs:'ribs'};
 // Which move families belong in each dramatic arc. A heat segment is ground-and-hold work;
 // a comeback is strikes, rebounds and crowd fire; the finishing stretch reaches for the big spots.
 const ARC_FAMILIES={
  opening:['chain','strike'],chain:['chain','rest'],shine:['chain','running','lucha','strike','rope'],
  cutoff:['heel','strike','corner'],control:['ground','rest','submission','heel','power'],
  hope:['fire','pin'],denial:['heel','ground','rest'],comeback:['fire','running','strike','neck','corner'],
  resurgence:['corner','running','power','suplex','rope'],exchange:['strike','suplex','neck','pin','lucha','outside'],
  nearfall:['pin','suplex','power','neck','aerial','superplex'],escalation:['aerial','superplex','dive','neck','power','springboard'],
  finish_setup:['neck','power','suplex','pin','aerial','superplex'],
  stalling:['heel'],test_strength:['chain','power'],limb_work:['ground','submission','rest'],floor_heat:['outside','heel'],
  rest_hold:['rest','ground'],second_hope:['fire','pin'],dive_sequence:['dive','lucha','springboard'],
  fighting_spirit:['strike','fire'],double_down:['fire','strike'],top_rope_battle:['superplex','corner','aerial'],
  submission_battle:['submission','chain'],false_finish:['pin','neck','strike']
 };

 const ARCS={
  opening:{label:'Opening exchanges',phase:'open',control:'neutral',latest:.83,openers:1,min:2,max:5,entry:['circle','lockup','probe_strike','collar_snap','false_handshake'],out:[e('chain',5),e('shine',3),e('cutoff',1),e('stalling',1),e('test_strength',1)]},
  chain:{label:'Chain wrestling',phase:'open',control:'neutral',latest:.83,openers:1,min:3,max:7,entry:['lockup','waistlock','wristlock','ankle_pick','hip_toss'],out:[e('chain',2),e('shine',5),e('cutoff',2),e('test_strength',1)]},
  shine:{label:'Early advantage',phase:'shine',control:'w',latest:.83,openers:1,min:4,max:9,entry:['arm_drag','clothesline','rope_run','wristlock'],out:[e('shine',2),e('cutoff',7),e('exchange',1)]},
  cutoff:{label:'A sudden cut-off',phase:'heat',control:'f',latest:.9,focus:1,min:2,max:4,entry:['cheap_shot','counter_strike','corner_whip','stiff_forearm'],out:[e('control',6),e('hope',2),e('floor_heat',2),e('limb_work',2)]},
  control:{label:'Sustained pressure',phase:'heat',control:'f',latest:.9,focus:1,min:5,max:11,entry:['target_strike','mat_hold','corner_strikes','snap_suplex','body_shot','gutbuster','heavy_slam'],out:[e('control',2),e('hope',5),e('exchange',1),e('limb_work',3),e('rest_hold',2),e('floor_heat',1)]},
  hope:{label:'A hope spot',phase:'heat',control:'f',latest:.9,min:2,max:4,entry:['hope_elbows','mat_scramble','counter_strike'],out:[e('denial',6),e('comeback',3),e('second_hope',1)]},
  denial:{label:'The comeback is cut off',phase:'heat',control:'f',latest:.9,focus:1,min:3,max:6,entry:['hope_cutoff','mat_hold','target_strike'],out:[e('control',4),e('comeback',4),e('rest_hold',2),e('limb_work',1)]},
  comeback:{label:'The comeback',phase:'comeback',control:'w',earliest:.12,openers:1,min:4,max:9,entry:['counter_strike','clothesline','rope_run','snap_suplex','dramatic_rally','rope_rebound'],out:[e('resurgence',4),e('exchange',5),e('cutoff',1),e('dive_sequence',1)]},
  resurgence:{label:'The crowd rises',phase:'comeback',control:'w',openers:1,min:2,max:5,entry:['clothesline','snap_suplex','corner_whip','top_climb'],out:[e('exchange',7),e('cutoff',2),e('dive_sequence',2)]},
  exchange:{label:'Back-and-forth',phase:'stretch',control:'neutral',openers:1,min:4,max:8,entry:['counter_strike','strike_trade','finish_tease','waistlock','last_second_counter','quiet_reversal','baited_charge'],out:[e('nearfall',3),e('escalation',4),e('control',1),e('fighting_spirit',2),e('submission_battle',1),e('top_rope_battle',1)]},
  nearfall:{label:'Near falls',phase:'stretch',control:'neutral',earliest:.3,late:1,min:2,max:5,entry:['snap_suplex','cover','submission_set','counter_rollup','high_crossbody','short_arm_lariat'],out:[e('exchange',3),e('escalation',5),e('nearfall',1),e('false_finish',2),e('double_down',1)]},
  escalation:{label:'Finishing stretch',phase:'stretch',control:'neutral',earliest:.3,late:1,openers:1,min:4,max:8,entry:['finish_tease','corner_whip','top_climb','counter_strike'],out:[e('nearfall',3),e('exchange',2),e('finish_setup',4),e('top_rope_battle',2),e('false_finish',2),e('fighting_spirit',1)]},
  // v3.3 sub-arcs: finer-grained, commonly worked segments inside the classic structure.
  stalling:{label:'Stalling and mind games',phase:'open',control:'neutral',latest:.5,min:2,max:4,entry:['hl_stall','hl_strut','crowd_pose','taunt','hl_ref_argue'],out:[e('chain',3),e('test_strength',2),e('cutoff',2)]},
  test_strength:{label:'Test of strength',phase:'open',control:'neutral',latest:.5,openers:1,min:2,max:4,entry:['knuckle_lock','lockup','collar_snap'],out:[e('chain',3),e('shine',3),e('cutoff',1)]},
  limb_work:{label:'Working the body part',phase:'heat',control:'f',latest:.85,focus:1,min:4,max:8,entry:['target_hold','target_strike','gd_knee_stomp','gd_arm_elbows','gd_lower_back_knee','leg_wrench'],out:[e('control',2),e('hope',4),e('rest_hold',2),e('submission_battle',1)]},
  floor_heat:{label:'Heat on the floor',phase:'heat',control:'f',latest:.8,focus:1,min:2,max:5,entry:['outside_toss','os_barricade','os_post','os_floor_chop'],out:[e('control',4),e('hope',2),e('limb_work',1)]},
  rest_hold:{label:'Selling in a rest hold',phase:'heat',control:'f',latest:.85,focus:1,min:2,max:5,entry:['rs_side_headlock','rs_reverse_chinlock','rs_body_scissors','rs_front_chancery','mat_hold'],out:[e('hope',4),e('second_hope',2),e('control',2)]},
  second_hope:{label:'A second hope spot',phase:'heat',control:'f',earliest:.3,latest:.85,min:2,max:4,entry:['hope_elbows','fr_crowd_clap','counter_strike','mat_scramble'],out:[e('denial',3),e('comeback',5)]},
  dive_sequence:{label:'Dives to the floor',phase:'comeback',control:'w',earliest:.35,openers:1,min:2,max:4,entry:['outside_toss','rope_run','springboard_feint'],out:[e('exchange',4),e('resurgence',2),e('nearfall',2)]},
  fighting_spirit:{label:'A slugfest in the middle',phase:'stretch',control:'neutral',earliest:.5,late:1,openers:1,min:2,max:5,entry:['st_fighting_spirit','fr_no_sell','strike_trade','fr_fight_on_knees'],out:[e('double_down',3),e('nearfall',3),e('escalation',3)]},
  double_down:{label:'Both wrestlers down',phase:'stretch',control:'neutral',earliest:.55,late:1,min:1,max:3,entry:['fr_double_clothesline','double_down_count'],out:[e('fighting_spirit',2),e('nearfall',3),e('escalation',3)]},
  top_rope_battle:{label:'Fight on the top rope',phase:'stretch',control:'neutral',earliest:.55,late:1,min:2,max:4,entry:['corner_whip','corner_strikes','top_follow'],out:[e('nearfall',4),e('escalation',2),e('finish_setup',2)]},
  submission_battle:{label:'Submission battle',phase:'stretch',control:'neutral',earliest:.45,late:1,min:3,max:6,entry:['submission_set','grapple_trip','ankle_pick','ch_single_leg','mat_takedown'],out:[e('nearfall',3),e('escalation',3),e('finish_setup',2)]},
  false_finish:{label:'False finishes',phase:'stretch',control:'neutral',earliest:.6,late:1,min:2,max:5,entry:['finish_tease','pn_small_package','pn_inside_cradle','counter_rollup','pn_backslide'],out:[e('finish_setup',4),e('nearfall',2),e('escalation',1)]},
  finish_setup:{label:'Final sequence',phase:'stretch',control:'neutral',earliest:.43,late:1,min:2,max:8,entry:['finish_tease','counter_strike','clothesline','snap_suplex'],out:[e('finish_setup',4),e('escalation',1)]}
 };
 // The outcome graph is gated by the contract and the manager's live decisions.
 const OUTCOMES={
  win_clean:{who:'w',method:'finisher or submission',legal:'booked clean victory'},
  win_dirty:{who:'w',method:'illegal pin while official is distracted',legal:'booked dirty victory'},
  lose_protected:{who:'f',method:'rope break followed by opportunistic pin',legal:'booked protected loss'},
  lose_clean:{who:'f',method:'counter followed by decisive finisher',legal:'booked decisive loss'},
  nc:{who:null,method:'medical stoppage',legal:'explicit injury decision'},
  double:{who:'w',method:'refusing agreed finish',legal:'explicit off-script decision'}
 };
 const OUTCOME_EDGES={finish_setup:Object.keys(OUTCOMES)};
 // Match-study motifs: these guide probabilities; they are not copied scripts.
 // Source notes and direct links are in docs/match-graph.md.
 const PATTERNS={
  story:{inspiredBy:'Classic territory match structure',arcs:['shine','cutoff','control','hope','denial','comeback','resurgence','exchange','finish_setup'],actions:['lockup','arm_drag','cheap_shot','target_hold','hope_elbows','hope_cutoff','clothesline','finish_tease']},
  technical:{inspiredBy:'Hart/Austin 1996 chain-grappling and counters',arcs:['chain','shine','control','hope','exchange','nearfall','finish_setup'],actions:['lockup','wristlock','wrist_escape','hammerlock','waistlock','mat_takedown','mat_scramble','rope_break','submission_set','counter_rollup']},
  brawl:{inspiredBy:'Hart/Austin 1997 grudge, control and ringside fighting',arcs:['cutoff','control','hope','denial','comeback','exchange','escalation','finish_setup'],actions:['probe_strike','strike_trade','cheap_shot','corner_strikes','outside_toss','floor_brawl','floor_counter','roll_inside','target_strike']},
  spots:{inspiredBy:'Interlocking rebound/counter sequences and escalating high-risk exchanges',arcs:['shine','cutoff','comeback','resurgence','exchange','nearfall','escalation','finish_setup'],actions:['rope_run','duck_rebound','shoulder_tackle','clothesline','top_climb','aerial_attack','aerial_counter','cover','near_kickout']},
  safe:{inspiredBy:'Conservative territory layout with clean holds and controlled pace',arcs:['chain','shine','cutoff','control','hope','comeback','exchange','finish_setup'],actions:['lockup','clean_break','wristlock','mat_hold','mat_scramble','rope_break','stand_reset']}
 };
 const PHASE_NAMES={open:'Feeling out',shine:'Early advantage',heat:'Sustained control',comeback:'Comeback',stretch:'Finishing stretch'};

 // v2.9: wrestler identity and match temperament, fixed for the whole bout.
 const STYLE_BEATS={
  Brawl:{open:['stiff_forearm','power_spinebuster','cheap_shot','outside_toss','strike_trade'],bias:{power_spinebuster:3.6,cheap_shot:2.1,strike_trade:2.2,corner_strikes:2.1,outside_toss:2.4,floor_brawl:2.5,top_climb:.32,wristlock:.55}},
  Technical:{open:['collar_snap','ankle_pick','grapple_trip','wristlock','waistlock','hammerlock'],bias:{grapple_trip:3.8,wristlock:2.5,arm_wringer:2.5,mat_takedown:2.2,submission_set:2.8,wrist_escape:2.5,waist_escape:2.4,outside_toss:.35,top_climb:.4}},
  Spectacle:{open:['springboard_feint','rope_rebound','running_headscissors','springboard_rise','rope_run','top_climb','counter_strike'],bias:{springboard_rise:4,top_climb:3.2,rope_run:2.6,duck_rebound:2.2,aerial_attack:2.3,corner_whip:1.8,mat_hold:.5,target_hold:.6}},
  Story:{open:['false_handshake','opponent_study','baited_charge','crowd_pose','taunt','finish_tease','clean_break'],bias:{crowd_pose:3.8,taunt:2.6,finish_tease:2.3,hope_elbows:1.9,cheap_shot:1.6,near_kickout:1.5,top_climb:.75}}
 };
 const MOVE_COST={top_climb:2.2,aerial_attack:3.6,aerial_counter:2,snap_suplex:2,clothesline:1.6,corner_charge:2.2,corner_strikes:1.5,submission_set:2,target_hold:1.2,finish_tease:1.6,outside_toss:2.1,floor_brawl:1.4,mat_takedown:1,strike_trade:1,rope_run:1.2};
 function fighter(w){return D.PROFILES[w?.id]||{kg:85,trait:'Versatile',preferred:[]}}
 function costOf(id){return A[id].cost??MOVE_COST[id]??.55}
 function scout(w,f,plan,heat=0){
  const me=fighter(w),them=fighter(f),gap=them.kg-me.kg;
  const size=gap>=25?`${f.short} has a major size advantage (${gap} kg).`:gap<=-25?`${w.short} has the size advantage (${-gap} kg).`:'They are reasonably matched for size.';
  const styles=`${w.short} favours ${me.trait.toLowerCase()} tactics; ${f.short} prefers ${them.trait.toLowerCase()} tactics.`;
  const fatigue=(w.fatigue||0)>=40?` Fatigue is a serious concern for ${w.short} tonight.`:'';
  const danger=gap>=25?'Avoid lifting the heavier opponent. Use counters and targeted holds.':f.style==='Technical'?'Avoid long mat exchanges. Prioritise clean escapes.':f.style==='Spectacle'?'Keep them off the ropes and make aerial attacks expensive.':f.style==='Brawl'?'Keep the action in the ring instead of brawling on the floor.':'Vary the pace and protect the finishing sequence.';
  const advice={story:'Build patiently to the finish.',technical:'Target a limb and save energy for counters.',brawl:'Save the heavy strikes; a long brawl is exhausting.',spots:'Big aerial moves need setup and fresh legs.',safe:'Use rest holds and avoid unnecessary risks.'};
  const known=(them.signature||[]).map(id=>A[id]?.name).filter(Boolean).slice(0,2);
  const watch=known.length?' Watch for '+f.short+'’s '+known.join(' and ')+'.':'';
  return {brief:styles+' '+size+(heat>=45?' There is personal history here.':'')+fatigue,advice:danger+' '+(advice[plan]||advice.story)+watch,you:me,opponent:them};
 }
 function matchTexture(M){
  const gap=Math.abs((M.w.ring+M.w.psych)-(M.f.ring+M.f.psych));
  if(M.o.memory?.rivalry<43&&M.r()<.75)return 'grudge';
  if((M.o.feudHeat||0)>=48&&M.r()<.78)return 'grudge';
  if(gap>=31&&M.r()<.75)return 'underdog';
  if(M.w.style==='Technical'&&M.f.style==='Technical')return 'chess';
  if(M.w.style==='Brawl'&&M.f.style==='Brawl')return 'fight';
  if(M.w.style==='Spectacle'||M.f.style==='Spectacle')return M.r()<.77?'showcase':'fast';
  return M.r()<.38?'fast':'classic';
 }
 function init(M){
  const p=Psy.get(M);
  const frac=M.t/Math.max(1,M.len);
  // v2.6 saved bouts do not have graph state. Resume at the correct
  // narrative stage instead of replaying the opening halfway through.
  const current=M.t<=0?'opening':frac<.2?'chain':frac<.33?'shine':frac<.62?'control':frac<.77?'comeback':'escalation';
  const g={v:1,arc:current,age:0,node:null,visit:{[current]:1},history:[current],events:[],transitions:0,steps:0,lastTags:[],consecutive:0,target:p.target,
   targets:{w:p.target,f:M.w.style==='Technical'?'shoulder':M.w.style==='Spectacle'?'left knee':M.w.style==='Brawl'?'ribs':'lower back'},
   damage:{w:p.focusHits||0,f:0},nearfallCount:0,started:M.t>0,migrated:M.t>0,pattern:M.planId,texture:matchTexture(M)};
  M.graph=g;return g;
 }
 function get(M){return M.graph||init(M)}
 function pick(M,weighted){
  const arr=weighted.filter(([k,w])=>w>0);const sum=arr.reduce((n,[,w])=>n+w,0);
  if(!sum)return null;let n=M.r()*sum;
  for(const [key,w] of arr){n-=w;if(n<0)return key;}
  return arr[arr.length-1][0];
 }
 function canArc(M,id,frac){
  const g=get(M),n=ARCS[id];if(!n)return false;
  if(n.earliest&&frac<n.earliest)return false;
  if(frac<.43&&id==='finish_setup')return false;
  if(n.latest&&frac>n.latest)return false;
  if((g.visit[id]||0)>4&&id!=='finish_setup')return false;
  return true;
 }
 function selectArc(M,frac){
  const g=get(M),arc=ARCS[g.arc],pattern=PATTERNS[M.planId]||PATTERNS.story;
  if(frac>.93&&g.arc!=='finish_setup')return 'finish_setup';
  if(frac>.81&&!arc.late)return 'escalation';
  if(frac>.67&&['open','shine','heat'].includes(arc.phase))return 'comeback';
  const weights=arc.out.filter(([id])=>canArc(M,id,frac)).map(([id,w])=>{
   let weight=w;
   if(pattern.arcs.includes(id))weight*=1.4;
   if(id==='chain'&&M.planId==='technical')weight*=2.5;
   if(id==='cutoff'&&M.planId==='brawl')weight*=1.6;
   if(id==='nearfall'&&M.planId==='spots')weight*=1.8;
   if(id==='exchange'&&(M.planId==='technical'||M.planId==='spots'))weight*=1.35;
   if(id==='control'&&M.o.feudHeat>=45)weight*=1.5;
   if(id==='comeback'&&M.crowd>65)weight*=1.6;
   if((g.visit[id]||0)>1)weight*=.6;
   if(frac>.53&&['comeback','exchange','escalation'].includes(id))weight*=2.5;
   const t=g.texture;
   if(t==='grudge'&&['cutoff','denial','escalation'].includes(id))weight*=1.75;
   if(t==='chess'&&['chain','exchange','nearfall'].includes(id))weight*=1.8;
   if(t==='fight'&&['cutoff','control','exchange'].includes(id))weight*=1.65;
   if(t==='showcase'&&['resurgence','nearfall','escalation'].includes(id))weight*=1.55;
   if(t==='underdog'&&['hope','denial','comeback'].includes(id))weight*=1.5;
   if(t==='fast'&&['shine','exchange','comeback'].includes(id))weight*=1.6;
   return [id,weight];
  });
  return pick(M,weights)|| (frac>.75?'escalation':g.arc);
 }
 function enter(M,id,prev){
  const g=get(M),arc=ARCS[id],p=Psy.get(M);
  let words;
  if(id==='opening')words=M.planId==='brawl'?'{W} and {F} charge together. They start throwing hard forearms.':'{W} and {F} begin cautiously, testing their distance.';
  else if(id==='chain')words='{W} and {F} settle into a series of holds, escapes and counters.';
  else if(id==='shine')words='{F} reaches for control, but {W} catches the attack and turns the tables!';
  else if(id==='cutoff')words='{W} presses forward and gets caught. {F} reverses the attack and takes over!';
  else if(id==='control')words='{F} keeps {W} under pressure, deliberately slowing the contest.';
  else if(id==='hope')words='{W} starts to fight out of trouble. The crowd can sense an opening.';
  else if(id==='denial')words='{F} catches the attempted escape and cuts the rally short!';
  else if(id==='comeback')words='{F} rushes in once too often. {W} sidesteps and takes control!';
  else if(id==='resurgence')words='{W} keeps the pressure on. {F} struggles to find a way back.';
  else if(id==='exchange')words='Both wrestlers scramble to their feet. The advantage is there to be taken.';
  else if(id==='nearfall')words='They know one mistake could settle this. Every cover now matters.';
  else if(id==='escalation')words='The pace rises as both wrestlers start looking for their big attacks.';
  else if(id==='stalling')words='Nobody wants to commit. One of them keeps finding reasons to stop the action, and the crowd is getting restless.';
  else if(id==='test_strength')words='{W} and {F} reach for each other’s hands. This is going to be a test of strength.';
  else if(id==='limb_work')words='{F} has found a target and will not let it go. Every move goes back to the same body part.';
  else if(id==='floor_heat')words='{F} takes the fight to the floor, where the referee can see less and the barricade hurts more.';
  else if(id==='rest_hold')words='{F} slows it right down with a hold, grinding {W} into the canvas. The crowd tries to rally {W}.';
  else if(id==='second_hope')words='{W} has not given up. The crowd sense another chance.';
  else if(id==='dive_sequence')words='{W} clears the ring. The crowd know what is coming next.';
  else if(id==='fighting_spirit')words='{W} and {F} meet in the middle. Neither will take a step back.';
  else if(id==='double_down')words='They collide, and both go down. The referee starts a count.';
  else if(id==='top_rope_battle')words='The action moves to the corner. Somebody is going up top.';
  else if(id==='submission_battle')words='It goes to the mat. Whoever finds a submission first could end this.';
  else if(id==='false_finish')words='They are trading roll-ups and finishing attempts. Every count could be the last.';
  else words='{W} and {F} dig deep. The finishing sequence is close.';
  // Arc switches never teleport the wrestlers. Every needed reset is narrated.
  if(prev){
   if(p.position==='outside')say(M,fill(M,'{W} and {F} beat the referee’s count and slide back into the ring.'));
   else if(p.position==='top')say(M,fill(M,'The wrestler on the turnbuckle drops back down as the counter threat develops.'));
   else if(p.position==='corner')say(M,fill(M,'They separate in the corner and step out into open ring.'));
   else if(p.position==='mat')say(M,fill(M,'The wrestler on the mat pushes back up as the next exchange begins.'));
  }
  if(words)say(M,fill(M,words),'story');
  if(arc.control==='w'||arc.control==='f'){
   const change=p.control!==arc.control;
   if(change) p.changes++;
   p.control=arc.control;
   M.mom=arc.control==='w'?Math.max(25,M.mom):Math.min(-25,M.mom);
  }else p.control='neutral';
  p.phase=arc.phase;
  p.position='standing';p.down=null;
  g.node=null;
 }
 function advance(M,frac){
  const g=get(M),a=ARCS[g.arc];if(!g.started){g.started=true;enter(M,'opening',null);}g.age++;
  const force=frac>.93&&g.arc!=='finish_setup'||frac>.81&&!a.late||frac>.67&&['open','shine','heat'].includes(a.phase);
  if(force||g.age>=a.max||(g.age>=a.min&&M.r()<.16)){
   const next=selectArc(M,frac);
   if(next!==g.arc){
    const prev=g.arc;g.arc=next;g.age=0;g.visit[next]=(g.visit[next]||0)+1;
    g.history.push(next);g.transitions++;g.node=null;
    enter(M,next,prev);
   }
  }
  const arc=ARCS[g.arc],ph=PHASES.find(x=>x.id===arc.phase)||PHASES[0];
  return {id:ph.id,name:arc.label};
 }
 function isValid(M,nodeId){
  const n=A[nodeId],p=Psy.get(M);if(!n)return false;
  if((nodeId==='cover'||nodeId==='near_kickout')&&M.t/M.len<.58)return false;
  // v3.3: big moves, roll-ups and finishing-grade spots belong to the right part of the match.
  if(n.after&&M.t/M.len<n.after)return false;
  // Agility moves (lucha, springboards, moonsaults, most dives) are not in a heavyweight's toolkit.
  if(n.agile&&fighter(p.control==='f'?M.f:M.w).kg>=110)return false;
  const attacker=p.control==='f'?M.f:M.w,defender=p.control==='f'?M.w:M.f,stamina=p.control==='f'?M.fSt:M.wSt;
  const energy=costOf(nodeId);
  if(energy>=2.2&&stamina<16+energy*3.2)return false;
  const capacity=fighter(attacker).kg+Math.max(-5,((attacker.ring||60)-60)*.23);
  if(n.lift!==null&&fighter(defender).kg>capacity+n.lift)return false;
  if(nodeId==='snap_suplex'&&fighter(defender).kg>capacity+42)return false;
  if(n.requires==='mat'&&p.position!=='mat')return false;
  if(n.requires==='outside'&&p.position!=='outside')return false;
  if(n.requires==='corner'&&p.position!=='corner')return false;
  if(n.requires==='top'&&p.position!=='top')return false;
  if(n.requires==='standing'&&p.position!=='standing')return false;
  if(n.requires==='mat'&&p.down===null)return false;
  if(p.position==='outside'&&!['outside','any'].includes(n.requires))return false;
  if(p.position==='top'&&!['top','any'].includes(n.requires))return false;
  return true;
 }
 function context(M){
  const p=Psy.get(M);
  if(p.control==='w')return {A:M.w,Df:M.f,side:'w'};
  if(p.control==='f')return {A:M.f,Df:M.w,side:'f'};
  const w=(M.r()<.55);
  p.control=w?'w':'f';p.changes++;
  return {A:w?M.w:M.f,Df:w?M.f:M.w,side:w?'w':'f'};
 }
 function apply(M,id){
  const n=A[id],p=Psy.get(M),g=get(M);
  const {A:attacker,Df:defender,side}=context(M),opp=side==='w'?'f':'w';
  if(n.reverse){
   p.control=opp;p.changes++;M.mom=opp==='w'?30:-30;
  }
  // The placeholders always name the pre-event attacker (A) and defender (D).
  // A reversal is performed by D; control flips only AFTER the narration.
  const victim=n.reverse?side:opp;
  const part=g.targets?.[victim]||p.target;
  const variant=n.lines[Math.floor(M.r()*n.lines.length)];
  if(g.damage?.w>=3&&p.control==='w'&&['top_climb','rope_run','clothesline','snap_suplex'].includes(id)&&(!g.lastSell||M.t-g.lastSell>100)){
   const effect=g.targets.w==='left knee'?'hesitates on the damaged knee':g.targets.w==='lower back'?'winces and steadies the lower back':g.targets.w==='ribs'?'takes a painful breath and protects the ribs':'favouring the damaged shoulder';
   say(M,fill(M,'{W} '+effect+' before committing to the next move.'),'story');g.lastSell=M.t;
  }
  const text=fill(M,variant,{A:attacker.short,D:defender.short,part,move:n.kind});
  say(M,text,n.kind); // all dialogue is original and event-led
  const originalDown=n.reverse?side:opp;
  p.position=n.zone;
  p.down=n.down==='d'?originalDown:n.down==='a'?p.control:null;
  // A limb-specific move only adds to the worked body part when it hits that part.
  const onTarget=!n.part||!PART_OF[part]||n.part===PART_OF[part];
  if(n.focus&&onTarget){g.damage[victim]=(g.damage[victim]||0)+n.focus;if(victim==='w')p.focusHits+=n.focus;}
  if(n.crowd)M.crowd=clamp(M.crowd+n.crowd*(n.family?CROWD_SCALE:1));
  const exertion=costOf(id),activeSide=n.reverse?opp:side,staminaKey=activeSide==='w'?'wSt':'fSt';
  let effective=exertion;
  if(exertion>0&&fighter(activeSide==='w'?M.w:M.f).trait==='Workhorse')effective*=.8;
  M[staminaKey]=clamp(M[staminaKey]-effective);
  if(exertion<0)g.rests=(g.rests||0)+1;
  g.exertion=(g.exertion||0)+Math.max(0,effective);
  if(id==='near_kickout'||id==='counter_rollup'||n.nearfall) {M.nearfalls++;M.bonus+=n.nearfall?4:5;g.nearfallCount++;}
  if(n.family&&n.risk&&!n.counterOf&&!n.blockOf){M.spots++;M.spotHits++;M.bonus+=3;}
  if(n.counterOf&&A[n.counterOf]?.risk){M.spots++;M.bonus-=2;}
  if(id==='aerial_attack'){M.spots++;M.spotHits++;M.bonus+=10;}
  if(id==='springboard_strike'){M.spots++;M.spotHits++;M.bonus+=5;}
  if(id==='springboard_evaded'){M.spots++;M.bonus-=2;}
  if(id==='power_spinebuster'){M.bonus+=2;}
  if(id==='aerial_counter'){M.spots++;M.bonus-=5;}
  if(id==='cover')g.pendingCover=true;
  if(id==='target_hold'||id==='target_strike'||id==='arm_wringer')g.lastTarget=M.t;
  if(id==='near_kickout')g.pendingCover=false;
  g.node=id;g.steps++;g.events.push({id,t:M.t,preControl:side,control:p.control,position:p.position,down:p.down,arc:g.arc,reverse:n.reverse,victim,part,exertion:effective});
  if(g.events.length>220)g.events.shift();
  if(M.o.promo?.tactic?.kind==='counter'&&n.reverse&&side==='f'&&p.control==='w'&&
     M.t/M.len>=.58&&(M.o.promo.tactic.nodes.includes(id)||(!!n.counterOf&&(!M.o.promo.tactic.families||M.o.promo.tactic.families.includes(n.family))))&&!g.promoCounterPaid){
   g.promoCounterPaid=true;
   say(M,M.w.short+' reads '+M.f.short+' and turns the attack around! That is the counter promised at the microphone.','story');
   root.OfficeSheets?.settleVow?.(M,'counter',id);
  }
  if(M.o.promo?.tactic?.kind==='finisher'&&id==='finish_tease'&&!g.promoFinisherScouted){
   g.promoFinisherScouted=true;
   say(M,M.f.short+' recognises the advertised finishing setup! '+M.w.short+' has revealed the intention in advance.','story');
  }
  root.OfficeSheets?.observe(M,id,side,'action');
  if(n.name&&!n.counterOf&&!n.blockOf&&fighter(attacker).signature?.includes(id)){
   g.signatures??={w:0,f:0};
   if(!g.signatures[side]++)say(M,fill(M,'Colour: That is the {name} — nobody on this circuit does it quite like {A}.',{A:attacker.short,name:n.name}),'story');
  }
  if(M.t-(g.lastColourAt??-1000)>=100&&M.r()<.33){
   const reactions={
    grapple_trip:'Colour: That transition to the leg was perfectly timed.',
    power_spinebuster:'The ring shook on that impact. {D} felt every bit of it.',
    springboard_strike:'The timing was perfect! {A} took a chance and the crowd came with them.',
    springboard_evaded:'A split second too late! That risk changed the whole exchange.',
    crowd_pose:'Colour: There is confidence, and then there is giving an opponent time to think.',
    floor_counter:'Colour: One mistake on the floor can cost you the match. The referee is watching.',
    submission_roll:'Colour: They knew the escape before the hold was even on. Smart wrestling.'
   };
   if(reactions[id]){say(M,fill(M,reactions[id],{A:attacker.short,D:defender.short}),'story');g.lastColourAt=M.t;}
  }
 }
 function validPool(M){
  const g=get(M),p=Psy.get(M),arc=ARCS[g.arc],current=A[g.node],pattern=PATTERNS[M.planId]||PATTERNS.story;
  const from=current?.next?.length?current.next.map(([id,w])=>[id,w*4]):[];
  const entries=arc.entry.map(id=>[id,1]);
  const selected=[...from,...entries];
  const liveSide=p.control==='f'?M.f:M.w;
  const style=STYLE_BEATS[liveSide.style]||STYLE_BEATS.Story;
  if(p.position==='standing'&&arc.openers)
   for(const id of style.open)selected.push([id,1.6]);
  const prof=fighter(liveSide),stamina=p.control==='f'?M.fSt:M.wSt;
  if(p.position==='standing'&&M.t/M.len>.12){
   for(const id of prof.preferred)if(A[id])selected.push([id,1.4]);
   if(stamina<48)selected.push(['catch_breath',5]);
  }
  // v3.3: the arc invites its move families; the physical guards still decide what is legal.
  for(const fam of ARC_FAMILIES[g.arc]||[])for(const id of CAT.members[fam]||[]){
   const mv=A[id];if(mv.requires!==p.position&&mv.requires!=='any')continue;
   selected.push([id,.46]);if(A[id+'_rev'])selected.push([id+'_rev',.16]);if(A[id+'_blk'])selected.push([id+'_blk',.1]);
  }
  // Positional hubs: corner work needs a whip into the buckles, a superplex needs a climb.
  const famList=ARC_FAMILIES[g.arc]||[];
  if(p.position==='standing'){
   if(famList.includes('corner'))selected.push(['corner_whip',1.1],['corner_push',.5]);
   if(famList.includes('chain'))selected.push(['headlock',.8],['lockup',.4]);
   if(famList.includes('superplex'))selected.push(['corner_whip',.7]);
  }
  if(p.position==='corner'&&famList.includes('superplex'))selected.push(['top_follow',2.4]);
  // v3.5: an agents'-room sheet. The wrestler works towards the agreed move, or the setup it needs.
  const agreed=M.sheet?.v>=4&&root.OfficeRoom?root.OfficeRoom.wants(M,p.control==='f'?'f':'w',p.position)[0]:null;
  if(agreed)selected.push([agreed[0],1]);
  // v3.4: signature moves. A wrestler's trademark offence, wherever the position allows it.
  if(M.t/M.len>.1)for(const id of prof.signature||[])if(A[id])selected.push([id,.45]);
  const weights=new Map();
  for(const [id,w] of selected) if(isValid(M,id)) {
   let n=w;
   if(pattern.actions.includes(id))n*=1.6;
   n*=style.bias[id]||1;
   n*=prof.preferred.includes(id)?3.7:prof.signature?.includes(id)?1.7:.82;
   // A signature is a highlight: once it has landed twice, the wrestler moves on.
   if(prof.signature?.includes(id)&&g.events.filter(x=>x.id===id).length>=2)n*=.12;
   const energy=costOf(id);
   if(energy>=2&&stamina<45)n*=Math.max(.15,stamina/70);
   if(id==='catch_breath')n*=stamina<22?5:stamina<35?2.4:1;
   if(A[id].reverse){
    const defender=p.control==='f'?M.w:M.f;
    const difference=(defender.ring*.65+defender.psych*.35)-(liveSide.ring*.65+liveSide.psych*.35);
    const defenderStamina=p.control==='f'?M.wSt:M.fSt;
    n*=Math.max(.6,Math.min(1.4,1+difference/140))*Math.max(.4,Math.min(1.2,defenderStamina/70));
   }
   if(g.texture==='grudge'&&['cheap_shot','outside_toss','floor_brawl','counter_strike'].includes(id))n*=1.45;
   if(g.texture==='chess'&&['wristlock','grapple_trip','mat_takedown','mat_scramble','submission_set'].includes(id))n*=1.5;
   if(g.texture==='fight'&&['power_spinebuster','strike_trade','corner_strikes','outside_toss'].includes(id))n*=1.5;
   if(g.texture==='showcase'&&['springboard_rise','top_climb','aerial_attack','aerial_counter'].includes(id))n*=1.5;
   if(g.texture==='underdog'&&['hope_elbows','hope_cutoff','counter_strike','mat_scramble'].includes(id))n*=1.4;
   if(g.texture==='fast'&&['duck_rebound','counter_strike','springboard_rise','clothesline'].includes(id))n*=1.3;
   if(g.events.slice(-4).some(x=>x.id===id))n*=.25;
    const nd=A[id];
    if(nd.family){
     // Limb work follows the body part this wrestler is working, as in a real heat segment.
     const victimSide=p.control==='f'?'w':'f',want=PART_OF[g.targets?.[victimSide]]||null;
     const heat=!!ARCS[g.arc]?.focus;
     if(nd.part&&want)n*=nd.part===want?(heat?3:1.7):(heat?.35:.8);
     if(nd.styles)n*=nd.styles.includes(liveSide.style)?1.45:.78;
     if(nd.agile){const kg=fighter(liveSide).kg;n*=kg>=95?.3:kg>=85?.7:1.15;}
     if(nd.risk){n*=M.planId==='safe'?.1:M.planId==='spots'?1.8:1;if((liveSide.safe??70)<55)n*=.7;}
     if(nd.blockLift!==null&&nd.blockOf){
      const defender=p.control==='f'?M.w:M.f,gap=fighter(defender).kg-fighter(liveSide).kg;
      n*=Math.max(.45,Math.min(2.6,1+gap/45));
     }
     if(nd.nearfall)n*=g.arc==='nearfall'||g.arc==='false_finish'?1.2:.5;
     if(g.events.slice(-12).some(x=>x.id===id))n*=.35;
    }
   if(['submission_set','target_hold','target_strike'].includes(id)&&['control','denial','cutoff'].includes(g.arc))n*=2.5;
   if(['top_climb','aerial_attack','outside_toss'].includes(id)&&M.planId==='spots')n*=2;
   if(['counter_strike','wrist_escape','waist_escape','mat_scramble'].includes(id)&&M.planId==='technical')n*=1.8;
   if(['outside_toss','floor_brawl','cheap_shot'].includes(id)&&M.planId==='brawl')n*=1.8;
   if(['cover','submission_set'].includes(id)&&g.arc==='nearfall')n*=2;
   if((id==='top_climb'||id==='springboard_rise')&&(p.control==='f'?M.fSt:M.wSt)<30)n*=.22;
   if(Psy.get(M).focusHits>=3&&Psy.get(M).target==='left knee'&&Psy.get(M).control==='w'&&['rope_run','top_climb','clothesline'].includes(id))n*=.35;
   // The pool is ten times larger than in v3.2, so an agreed beat needs a proportionally firmer push.
   if(M.o.sheet?.v>=4&&root.OfficeRoom)n*=root.OfficeRoom.bias(M,id);
   if(A[id].reverse&&M.sheet?.v>=4&&root.OfficeRoom)n*=root.OfficeRoom.feed(M,p.control==='f'?'f':'w');
   if(root.OfficeSheets?.boost){const sb=root.OfficeSheets.boost(M,id,p.control==='f'?'f':'w');n*=sb>1?sb*SHEET_PULL:sb;}
   // The public promo is a tactical declaration. Counter promises favour
   // genuine worker reversals of opponent control, not arbitrary bonuses.
   const publicTactic=M.o.promo?.tactic;
   if(publicTactic){
    if(publicTactic.kind==='clean'&&(['cheap_shot','outside_toss','floor_brawl'].includes(id)||A[id].family==='heel'||(A[id].family&&A[id].crowd<0&&!A[id].counterOf)))n*=.28;
    if(publicTactic.kind==='counter'&&publicTactic.nodes.includes(id))
     n*=p.control==='f'&&A[id].reverse&&M.t/M.len>.45?(M.f.psych>=82?1.45:2.5):1;
    if(publicTactic.kind==='finisher'&&id==='finish_tease')n*=M.f.psych>=78?.8:2.4;
    if(publicTactic.kind==='misdirect'&&publicTactic.nodes.includes(id))n*=1.65;
    if(publicTactic.kind==='win'&&publicTactic.nodes.includes(id)&&M.t/M.len>.58)n*=1.4;
   }
   weights.set(id,(weights.get(id)||0)+n);
  }
  const pool=[...weights.entries()];
  // An agreed beat is not one option among fifty. If it is legal right now, the wrestler takes it
  // with odds set by how willing they are, whatever their habits would otherwise suggest.
  if(agreed){
   const i=pool.findIndex(x=>x[0]===agreed[0]);
   if(i>=0){
    const rest=pool.reduce((total,x,j)=>j===i?total:total+x[1],0);
    const notePenalty=Math.min(1,root.OfficeRoom.bias(M,agreed[0]));
    pool[i][1]=Math.max(pool[i][1],rest*agreed[1]*notePenalty);
   }
  }
  return pool;
 }
 function recover(M){
  const p=Psy.get(M),g=get(M);
  if(p.position==='outside'){apply(M,'roll_inside');return}
  if(p.position==='corner'){apply(M,'corner_break');return}
  if(p.position==='top'){
   if((p.control==='f'?M.fSt:M.wSt)<29){
    say(M,'The wrestler on the ropes checks their balance and safely steps down.','play');
    p.position='standing';p.down=null;g.node=null;return;
   }
   apply(M,'aerial_attack');return;
  }
  if(p.position==='mat'){
   apply(M,'stand_reset');return;
  }
  // Explicit reset is an event, not an invisible teleport.
  if(p.control!=='neutral')say(M,fill(M,'{W} and {F} disengage and return to the middle of the ring.'));
  p.control='neutral';p.position='standing';p.down=null;g.node=null;apply(M,'circle');
 }
 function step(M){
  const g=get(M),p=Psy.get(M);
  if(p.position==='outside'&&g.floorTicks>=4){apply(M,'roll_inside');g.floorTicks=0;return;}
  if(p.control==='neutral'){
   const advantage=(M.w.ring-M.f.ring)+(M.wSt-M.fSt)*.3;
   p.control=M.r()<Math.max(.3,Math.min(.7,.5+advantage/250))?'w':'f';p.changes++;
  }
  const candidates=validPool(M),id=pick(M,candidates);
  if(id){apply(M,id);return;}
  recover(M);
 }
 function nearfall(M){
  const g=get(M),p=Psy.get(M);
  if(M.t/M.len<.59)return;
  if(p.position==='outside'){say(M,fill(M,'{W} and {F} beat the referee’s count back into the ring.'));p.position='standing';p.down=null;}
  Psy.nearfall(M);
  vic(M,'nearfall',.45);
  g.nearfallCount++;
  g.events.push({id:'scheduled_nearfall',t:M.t,arc:g.arc,control:p.control,position:p.position,down:p.down});
  g.node='stand_reset';
  root.OfficeSheets?.observe(M,'scheduled_nearfall',p.control,'spot');
 }
 function special(M){
  const g=get(M),p=Psy.get(M);
  if(p.position==='outside'){apply(M,'roll_inside');g.floorTicks=0;return}
  const prior=M.spots;spot(M,false);const occurred=M.spots>prior;
  if(occurred)vic(M,'spot',.4);
  g.events.push({id:occurred?'special_spot':'special_deferred',t:M.t,arc:g.arc,control:p.control,position:p.position,down:p.down});
  g.node=null;
  if(occurred)root.OfficeSheets?.observe(M,'special_spot',p.control,'spot');
 }
 function finishCue(M){
  const g=get(M),outcome=M.outcome==='nc'?'nc':M.outcome==='double'?'double':M.o.finish;
  if(!OUTCOME_EDGES.finish_setup.includes(outcome))throw Error('Invalid match outcome: '+outcome);
  const def=OUTCOMES[outcome];
  if(outcome==='nc'&&!M.injury)throw Error('A no-contest medical stoppage requires a recorded injury.');
  g.outcome={id:outcome,winner:def.who,method:def.method,reason:def.legal,booked:M.o.finish};
  g.events.push({id:'outcome_'+outcome,t:M.t,arc:g.arc,control:Psy.get(M).control,position:Psy.get(M).position});
  root.OfficeSheets?.observe(M,'outcome_'+outcome,'either','outcome');
  root.OfficeSheets?.finalize(M);
  return g.outcome;
 }
 function validate(){
  const errors=[];
  for(const [id,n] of Object.entries(A)){
   for(const [to] of n.next)if(!A[to])errors.push(id+' -> '+to+' missing');
  }
  for(const [id,a] of Object.entries(ARCS)){
   for(const [to] of a.out)if(!ARCS[to])errors.push('arc '+id+' -> '+to+' missing');
   for(const nodeId of a.entry)if(!A[nodeId])errors.push('entry '+id+' -> '+nodeId+' missing');
  }
   for(const [id,n] of Object.entries(A)){
    if(n.counterOf&&!A[n.counterOf])errors.push(id+' counters missing '+n.counterOf);
    if(n.part&&!['arm','leg','neck','back','ribs'].includes(n.part))errors.push(id+' unknown part '+n.part);
    if(n.after<0||n.after>.95)errors.push(id+' timing out of range');
   }
   return {nodes:Object.keys(A).length,arcs:Object.keys(ARCS).length,outcomes:Object.keys(OUTCOMES).length,edges:Object.values(A).reduce((n,a)=>n+a.next.length,0),
    families:Object.keys(CAT.F).length,moves:CAT.counts.moves,reversals:CAT.counts.reversals,blocks:CAT.counts.blocks,errors};
 }
 return {A,ARCS,OUTCOMES,OUTCOME_EDGES,PATTERNS,CATALOG:CAT,PART_OF,ARC_FAMILIES,STYLE_BEATS,fighter,pool:validPool,get,init,advance,step,nearfall,special,finishCue,validate,apply,selectArc,scout,isValid};
})();

function create(o){
 const r=mulberry(o.seed||Date.now());
 const w=o.w,f=o.f,p=o.p,plan=D.PLANS[o.plan.game]||D.PLANS.story,slot=D.SLOTS[o.slot]||D.SLOTS.mid;
 const ego=w.ego,talk=o.plan.talk||'none',leash=o.plan.leash||'script',prep=o.preparation||{};
 let comply=48+w.pro*.32+w.loyal*.12+w.morale*.1-ego*.3;
 if(leash==='script')comply+=ego>=75?2:14;
 if(Number.isFinite(o.memory?.trust))comply+=(o.memory.trust-60)*.24;
 if(o.sheet?.signed)comply+=(o.sheet.workerConsent-60)*.28;
 if(prep.psych)comply+=Math.min(6,prep.psych*1.3);if(talk==='money')comply+=15;if(talk==='fire')comply-=ego>=75?18:9;if(talk==='calm')comply+=4;
 comply=clamp(Math.round(comply),12,96);
 let crowd=22+w.heat*.27+(o.feudHeat||0)*.28+slot.crowd+p.reach*.06+(talk==='fire'?5:0)+(o.blowoff?8:0)+Math.min(3,(prep.mic||0)*.75)+(o.promo?.crowdShift||0);
 const fit=(p.likes===o.plan.game?6:0)+(D.STYLE_PLAN[w.style]===o.plan.game?3:0)+(D.STYLE_PLAN[f.style]===o.plan.game?1.5:0)+Math.min(4,(prep.ring||0)*.95)+Math.min(3,(prep.psych||0)*.6);
 let riskMul=plan.risk*(talk==='calm'?.7:talk==='fire'?1.2:1)*(o.flags?.pushThrough?1.4:1)*(1-Math.min(.22,(prep.safe||0)*.05));
 if(o.sheet?.signed)riskMul*=1+Math.max(0,60-o.sheet.opponentConsent)*.002;
 const minutes=o.minutes||slot.mins;
 const stretchStart=.78,nf=1+(minutes>=15?1:0)+(r()<.5?1:0);
 const nearfallAt=Array.from({length:nf},(_,i)=>stretchStart+(.95-stretchStart)*(i+.5)/nf);
 const reactions=talkReaction(w,talk);
 const M={v:1,r,w,f,p,o,plan,planId:o.plan.game,leash,talk,len:minutes*60,minutes,t:0,stage:'entrance',phase:null,
  crowd:clamp(Math.round(crowd),5,88),crowdStart:0,crowdPeak:0,crowdSum:0,lastCrowdBand:null,
  wSt:clamp(100-w.fatigue*.7+(talk==='calm'?6:0)),fSt:92,mom:0,comply,listen:clamp(comply+(leash==='free'?10:0),15,97),resent:leash==='script'&&ego>=75&&(o.memory?.trust??60)<78,
  fit,riskMul,mode:null,calls:3,callsUsed:[],ignored:0,offScript:null,scriptChecks:0,scriptHits:0,
  qSum:0,qN:0,bonus:0,spots:0,spotHits:0,botches:0,nearfalls:0,nearfallAt,
  injury:0,injuryPart:null,workingHurt:false,foeHurt:false,stiff:false,shortened:false,
  offered:{},decision:null,outcome:'booked',refused:false,
  adj:{trust:0,heat:0,morale:0,rep:0,purseMul:1,otherTrust:0,loyal:0},
  queue:[],log:[],done:false,hints:{},reaction:reactions,prep:prep};
 M.story=Psy.make(M);
 if(o.sheet?.signed)M.sheet=JSON.parse(JSON.stringify(o.sheet));
 Graph.init(M);
 M.crowdStart=M.crowd;M.crowdPeak=M.crowd;
 return M;
}
function talkReaction(w,talk){
 const n=w.short;
 if(talk==='none')return null;
 if(talk==='calm')return w.morale<50||w.fatigue>40?`${n} breathes out. "Yeah. Steady. Got it."`:w.ego>=75?`${n} looks at you like you’ve said something obvious.`:`${n} nods. Focused.`;
 if(talk==='fire')return w.ego>=75?`${n} is already bouncing on the spot. This could go either way.`:w.morale<45?`${n} manages a half-smile. Something’s there.`:`${n} slaps the wall twice. Ready to go.`;
 if(talk==='money')return w.ego>=70?`${n}’s jaw tightens. "Understood." It isn’t.`:w.pro>=80?`${n} shrugs. "I always follow the layout."`:`${n} nods quickly and looks at the floor.`;
 return null;
}
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
 return say(M,fill(M,x,{pbp:D.BOOTH?.pbp.short||'partner'}),'story',{...opt,who:'colour'});
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
 const topics=[M.phase?.id,M.o.blowoff?'blowoff':heat>=35?'feud':null,M.crowd>=75?'loud':M.crowd<35?'flat':null,'card'].filter(Boolean);
 const open=topics.filter(t=>(t==='card'?card:VIC[t]||[]).some(x=>!said.includes(x)));
 if(!open.length)return null;
 const tag=open[Math.floor(vicRoll(M,'topic')*open.length)];
 return vic(M,tag,1,{},tag==='card'?card:null);
}
function fresh(M,a){M.recent??=[];let c=a.filter(x=>!M.recent.includes(x));if(!c.length)c=a.filter(x=>!M.recent.slice(-2).includes(x));if(!c.length)c=a;const x=c[Math.floor(M.r()*c.length)];M.recent.push(x);if(M.recent.length>8)M.recent.shift();return x}
function pick(M,who){const pool=D.MOVES[who.style]||D.MOVES.Story;return rnd(M,pool)}
function names(M){return {W:M.w.short,F:M.f.short,WF:M.w.name,FF:M.f.name,wfin:M.w.finisher,ffin:M.f.finisher,venue:M.p.venue}}
function fill(M,s,extra={}){const n={...names(M),...extra};return s.replace(/\{(\w+)\}/g,(m,k)=>n[k]??m).replace(/(^|[.!?]\s+)([a-z])/g,(m,a,b)=>a+b.toUpperCase())}
// Who is talking. Gloria calls the action, Vic adds colour, Ravi brings word from backstage.
// A "Colour:" or "Road agent:"/"In your ear:" prefix picks the speaker and is dropped from the text.
const VOICE_PREFIX=[[/^Colour: /,'colour'],[/^(?:Road agent|In your ear): /,'runner']];
const KIND_VOICE={play:'pbp',story:'pbp',crowd:'pbp',agent:'runner'};
function say(M,text,kind='play',opt={}){
 let who=opt.who;
 for(const [re,v] of VOICE_PREFIX)if(re.test(text)){text=text.replace(re,'');text=text.charAt(0).toUpperCase()+text.slice(1);if(who===undefined)who=v;break}
 if(who===undefined)who=KIND_VOICE[kind]||null;
 const line={t:fmt(opt.at??M.t),text,kind,big:!!opt.big,pause:opt.pause||0,who};M.queue.push(line);M.log.push(line);return line}

function phaseFor(frac,M){const ends=Psy.PHASE_ENDS[M?.planId]||Psy.PHASE_ENDS.story;return PHASES.find((p,i)=>frac<ends[i])||PHASES[4]}
function stars(M,final=false){
 if(!M.qN)return 0;
 const avgQ=(M.qSum+M.bonus)/M.qN;
 let s=1.1+(avgQ-40)*.068+(M.crowdPeak-65)*.01+Math.min(3,M.nearfalls)*(M.crowdPeak>=65?.12:.04)-M.botches*.2;
 if(M.shortened)s-=.45;
 s+=M.sheetAdj||0;
 if(M.minutes>=15&&avgQ>=60)s+=.2;
 if(M.outcome==='double')s+=.25;
 if(M.outcome==='nc')s=Math.min(s,1.5);
 if(!final){const frac=Math.min(1,M.t/M.len);s=s*(.6+.4*frac);}
 return clamp(Math.round(s*4)/4,0,5);
}

/* ---- the main loop ---- */
function next(M){
 while(!M.queue.length&&!M.decision&&!M.done)simulate(M);
 return M.queue.shift()||null;
}
function simulate(M){
 if(M.stage==='entrance')return entrances(M);
 if(M.stage==='finish')return finish(M);
 if(M.stage==='over'){M.done=true;return}
 tick(M);
}
function entrances(M){
 const fh=M.f.heat,wh=M.w.heat;
 say(M,`${M.f.name} comes out first. ${fh>=60?'Boos rain down.':'A smattering of jeers.'}`,'play',{at:0});
 const pop=wh<30?'Polite applause. Not many know the name yet.':wh<55?'A decent reaction.':wh<75?`A big pop for ${M.w.short}.`:`The roof comes off for ${M.w.short}!`;
 say(M,`Here comes ${M.w.name}. ${pop}`,wh>=75?'crowd':'play',{at:0,big:wh>=75});
 if(M.o.blowoff)say(M,'This is the end of the road for these two. Everyone here knows it.','story',{at:0});
 else if((M.o.feudHeat||0)>=35)say(M,'Bad blood here. These two have history.','story',{at:0});
 if(M.o.promo)say(M,M.o.promo.hook,'story',{at:0});
 if(M.o.memory?.recall)say(M,M.o.memory.recall,'story',{at:0,who:'runner'});
 if(M.sheet?.signed)say(M,'Road agent: '+M.sheet.method+' match layout agreed. The finish is contracted; the action must be earned.','story',{at:0});
 const notes={
  grudge:'The talk is finished. These two have scores to settle, and neither wants to back down.',
  underdog:'There is a gulf in experience here, but a wrestling match is not won on paper.',
  chess:'Two technicians, one ring. This could come down to a single counter.',
  fight:'Neither wrestler is known for taking a backwards step.',
  showcase:'Keep an eye on the ropes tonight. A big risk could change everything.',
  fast:'The word from the dressing room is pace. Neither intends to stand still.',
  classic:'A straightforward contest on paper. The details will decide it.'
 };
 if(M.graph?.texture)say(M,notes[M.graph.texture],'story',{at:0,who:M.graph.texture==='fast'?'runner':'pbp'});
 if(M.reaction)say(M,M.reaction,'agent',{at:0,who:null});
 const prepared=Object.entries(M.prep).filter(([skill,v])=>v>=1.5).sort((a,b)=>b[1]-a[1])[0];
 if(prepared){const lines={ring:`Road agent: ${M.w.short}'s ring drills are evident in the opening exchanges.`,psych:`Road agent: ${M.w.short} looks composed after working on match psychology.`,safe:`Road agent: ${M.w.short} has drilled the safety sequences; they are less likely to go wrong.`,mic:`Road agent: ${M.w.short}'s recent promo work has warmed up this crowd.`};say(M,lines[prepared[0]],'agent',{at:0});}
 vic(M,M.crowd>=60?'hot':M.crowd<40?'cold':'warm',1,{at:0});
 say(M,`Ding ding. We’re under way at ${M.p.venue}.`,'bell',{at:0,big:true});
 M.stage='live';
}
function tick(M){
 (M.crowdTrace??=[]).push([M.t,Math.round(M.crowd)]);
 M.t+=10;const frac=M.t/M.len,ph=Graph.advance(M,frac),w=M.w,f=M.f,plan=M.plan;
 if(!M.phase||M.phase.name!==ph.name){M.phase=ph;onPhase(M);if(M.decision)return;}
 // An outside exchange cannot continue indefinitely without a count-out.
 if(Psy.get(M).position==='outside'){
   const g=Graph.get(M);g.floorTicks=(g.floorTicks||0)+1;
   if(g.floorTicks>=5){say(M,fill(M,'The referee reaches eight. {W} and {F} scramble back through the ropes.'),'play');Psy.get(M).position='standing';Psy.get(M).down=null;g.node=null;g.floorTicks=0;}
  }else Graph.get(M).floorTicks=0;
 // momentum
 const target=Psy.get(M).control==='w'?52:Psy.get(M).control==='f'?-52:0;M.mom+=(target-M.mom)*.23+(M.r()*16-8);M.mom=clamp(M.mom,-100,100);
 // stamina
 const mode=M.mode?.type;
 const drain=.55*plan.drain*(mode==='pickup'?1.7:mode==='slow'?.3:1)*(1+w.fatigue/250)*(M.workingHurt?1.5:1);
 M.wSt=clamp(M.wSt-drain+(mode==='slow'?1.6:0));M.fSt=clamp(M.fSt-.5*plan.drain+(mode==='slow'?1.2:0));
 // quality of this ten seconds
 const sk=(w.ring*plan.w.ring+w.psych*plan.w.psych)*(.55+.45*M.wSt/100);
 const sf=(f.ring*plan.w.ring+f.psych*plan.w.psych)*(.55+.45*M.fSt/100);
 let q=18+(sk*.55+sf*.45)*.6+M.fit+(plan.qual||0)+(M.crowd-50)*.1+(M.talk==='fire'?2:0);
 if(M.leash==='free')q+=(M.r()*24-12)+(w.psych-62)*.18;else q+=M.r()*16-8;
 if(M.offScript==='showboat')q-=4;if(M.offScript==='audible')q+=(w.psych-65)/3;
 if(mode==='slow')q-=M.crowd<45?6:3;if(mode==='pickup')q+=M.wSt>45?3:-5;if(mode==='crowd')q-=3;
 if(M.workingHurt)q-=6;if(M.stiff==='protect')q-=4;
 if(M.wSt<25)q-=6;
 q=clamp(q,5,100);M.qSum+=q;M.qN++;
 // crowd
 let dc=(q-55)/22*CROWD_MUL[ph.id]*plan.crowd*(ph.id==='stretch'?plan.late:1);
 if(mode==='crowd')dc+=1.1*(w.mic/80);if(mode==='pickup')dc+=M.wSt>40?.6:-.4;if(mode==='slow')dc-=.5;
 if(M.offScript==='showboat')dc+=.4;
 dc-=(M.crowd-55)*.02;
 M.crowd=clamp(M.crowd+dc);
 // mode countdown
 if(M.mode){M.mode.ticks--;if(M.mode.ticks<=0)M.mode=null;}
 // the injured wrestler can make things worse
 if(M.workingHurt&&M.r()<.04&&M.injury<4){M.injury++;say(M,`${w.short} winces again. That’s getting worse.`,'agent');}
 // spots
 const spotP=plan.spotRate*SPOT_MUL[ph.id]*(mode==='pickup'?1.6:mode==='slow'?.2:1)*(M.offScript==='showboat'?1.5:1);
 let spoke=false;
 if(M.nearfallAt.length&&frac>=M.nearfallAt[0]){M.nearfallAt.shift();Graph.nearfall(M);spoke=true;}
 else if(M.r()<spotP){Graph.special(M);spoke=true;}
 // crowd bands
 crowdBand(M);
 // producer hints
 if(!M.hints.dead&&M.crowd<33&&frac>.3){M.hints.dead=1;say(M,`In your ear: they’re dying out here. Change something.`,'agent');}
 if(!M.hints.tired&&M.wSt<30){M.hints.tired=1;say(M,`In your ear: ${w.short} is blown up. Slow it down or take it home.`,'agent');}
 // incidents
 root.OfficeSheets?.advance(M);
 incidents(M,frac);
 if(M.decision)return;
 // play-by-play
 if(!spoke&&M.r()<.64)Graph.step(M);
 if(!spoke&&M.t-(M.vicAt??-200)>=100&&vicRoll(M,'chat')<.3)vicChat(M);
 M.crowdSum+=M.crowd;M.crowdPeak=Math.max(M.crowdPeak,M.crowd);
 if(M.t>=M.len){M.stage='finish';}
}
function onPhase(M){
 const ph=M.phase,w=M.w;
 if(M.leash==='script'&&ph.id!=='open'){
  M.scriptChecks++;
  if(M.r()*100<M.comply){M.scriptHits++;M.offScript=null;}
  else{M.offScript=w.ego>=65?'showboat':'audible';
   say(M,M.offScript==='showboat'?`${w.short} has gone off the layout, playing to the crowd instead of the plan.`:`${w.short} is calling audibles. This wasn’t the plan.`,'agent');}
 }
 if(ph.id==='heat'&&!M.offered.stiff&&M.f.ego>=68&&M.r()<(M.f.ego-55)/60){M.offered.stiff=1;decide(M,'stiff');return;}
 if(ph.id==='stretch'){
  if(M.o.flags?.dive){M.o.flags.dive=false;dive(M);}
  if(!M.offered.double&&M.o.finish.startsWith('lose')&&M.crowd>=82&&w.heat>=55&&M.outcome==='booked'){M.offered.double=1;if(M.r()<.5)decide(M,'double');}
 }
}
function incidents(M,frac){
 if(M.decision)return;
 if(M.p.tv&&!M.offered.time&&frac>=.45&&frac<.62){M.offered.time=1;if(M.r()<.45&&M.len-M.t>300)decide(M,'time');}
}
function crowdBand(M){
 const c=M.crowd,T=[35,55,70,85];let band=M.lastCrowdBand??T.filter(x=>c>=x).length;
 if(M.lastCrowdBand===null){M.lastCrowdBand=band;return}
 while(band<4&&c>=T[band]+2)band++;while(band>0&&c<T[band-1]-3)band--;
 if(band===M.lastCrowdBand)return;
 if(band>M.lastCrowdBand){
  const t=[null,`A murmur round ${M.p.venue}. They’re starting to pay attention.`,'The place is warming up now.','Loud now. They’re stamping their feet.','THIS PLACE IS COMING UNSTUCK!'][band];
  say(M,t,'crowd',{big:band>=3});
 }else if(band<M.lastCrowdBand){
  const t=['You could hear a pin drop. They’ve gone quiet.','The noise has dropped right off.','They’ve cooled a little.','Still loud, but not quite what it was.'][band];
  say(M,t,'crowd');
 }
 M.lastCrowdBand=band;
}
function actors(M){const c=M.story?.control;const yours=c==='w'?true:c==='f'?false:M.mom>=0;return yours?{A:M.w,D:M.f}:{A:M.f,D:M.w}}
function playByPlay(M){
 const {A,D:Df}=Psy.get(M).control==='w'?{A:M.w,D:M.f}:Psy.get(M).control==='f'?{A:M.f,D:M.w}:actors(M);
 const context=[];
 if(M.o.promo){
  if(M.o.promo.style==='challenge')context.push('Colour: That challenge from {W} before the match has raised the stakes.','The words at the microphone have given this one an edge.');
  if(M.o.promo.style==='rally')context.push('Listen to those supporters. {W} asked them to get involved, and they have.','Colour: {W} has made the crowd part of the contest.');
  if(M.o.promo.style==='mindgames')context.push('Colour: {F} still looks unsettled by that opening exchange on the microphone.','Those mind games have followed them out of the dressing room.');
  if(M.o.promo.style==='respect')context.push('There was respect on the microphone. There is no room for hesitation in the ring.','Colour: They said this was about wrestling. They are proving it.');
 }
 if((M.o.feudHeat||0)>=35)context.push('There is a lot of history under every exchange here.','Colour: {W} and {F} remember every previous meeting.','Neither wrestler has forgotten what happened last time.');
 if(M.wSt<35)context.push('Colour: {W} is running on fumes. This is the dangerous part.','{W} is working from instinct now. There is not much left in the tank.');
 if(M.crowd>75)context.push('The floor is shaking with the noise of the crowd.','Colour: Nobody in the building is sitting down for this.','You could feel that reaction at the back of the arena.');
 if(M.phase?.id==='stretch')context.push('Colour: Somebody has to take a chance now.','One good counter could settle this.','Road agent: They are on the last page of the match layout now.');
 if(context.length&&M.r()<.21&&(!M.lastContextTick||M.t-M.lastContextTick>=70)){
  M.lastContextTick=M.t;return say(M,fill(M,fresh(M,context)),'story');
 }
 if(Math.abs(M.mom)<12&&M.r()<.5)return say(M,fresh(M,NEUTRAL));
 let pool=LINES[M.phase.id];const ph=M.phase.id;
 if((ph==='shine'||ph==='comeback')&&A===M.f)pool=LINES.heat;
 if(ph==='heat'&&A===M.w)pool=HOPE;
 const line=fresh(M,pool);
 say(M,fill(M,line,{A:A.short,D:Df.short,move:pick(M,A),fin:the(A.finisher),part:rnd(M,PARTS)}));
}
function spot(M,big,forced){
 const {A,D:Df}=forced?{A:M.w,D:M.f}:actors(M);
 const yours=A===M.w,st=yours?M.wSt:M.fSt;
 const ap=D.PROFILES[A.id]||{kg:85},dp=D.PROFILES[Df.id]||{kg:85};
 const strengthGap=dp.kg-ap.kg;
 const moves=D.SPOTS[A.style]||D.SPOTS.Story;
 const possible=moves.filter(x=>!(strengthGap>32&&/suplex|piledriver|backdrop|powerbomb/i.test(x)));
 const move=rnd(M,possible.length?possible:['a running dropkick']);
 if(st<28){
  say(M,`${A.short} looks for a spectacular attack, but the tired legs will not cooperate. ${Df.short} gets a chance to recover.`,'agent',{who:'pbp'});
  M.crowd=clamp(M.crowd-(big?3:1));
  M.bonus-=big?6:2;
  return;
 }
 const wasBotched=M.botches;
 const outside=Psy.spotSetup(M,A,Df,move);
 let botchP=(.03+(100-A.safe)*.0018+(100-st)*.0015)*M.riskMul*(big?1.5:1);
 if(A.ring>=80)botchP*=.8;
 M.spots++;
 if(big||M.r()<.35)say(M,big?`${A.short} commits to the high-risk move!`:`${A.short} goes for it!`,'play',{pause:1});
 if(M.r()<botchP){
  M.botches++;M.bonus-=big?30:20;M.crowd=clamp(M.crowd-(big?9:6));
  say(M,`${move.charAt(0).toUpperCase()+move.slice(1)}… and it’s gone wrong. That looked nasty.`,'bad',{big:true});
  // who gets hurt: the taker or the one who went for it
  const hurtYours=yours?M.r()<.55:M.r()<.45;
  const injP=(.1+(100-(yours?M.w.safe:M.f.safe))/350)*(big?1.4:1);
  if(M.r()<injP){
   if(hurtYours&&!M.injury){M.injury=1+(M.r()<.4?1:0)+(big&&M.r()<.4?1:0);M.injuryPart=rnd(M,PARTS);decide(M,'injury');}
   else if(!hurtYours&&!M.foeHurt){M.foeHurt=true;say(M,`${M.f.short} is holding the ${rnd(M,PARTS)}. The referee leans in.`,'agent',{who:'pbp'});M.fSt=clamp(M.fSt-25);}
  }
 }else{
  M.spotHits++;const pop=(big?7:3)+M.r()*(big?7:4);M.crowd=clamp(M.crowd+pop*M.plan.crowd);M.bonus+=big?18:10;
  say(M,rnd(M,[`${move.charAt(0).toUpperCase()+move.slice(1)} from ${A.short}!${M.crowd>=70?' The crowd come up out of their seats!':''}`,`${A.short} connects with ${move}! ${Df.short} did not see it coming.`,`What a risk by ${A.short} — ${move} lands flush!`,`${A.short} gets all of ${move}! The front rows erupt.`]),M.crowd>=70?'crowd':'play',{big:big||M.crowd>=75});
 }
 // Both wrestlers pay the physical cost of an attempted special, including botches.
 if(yours)M.wSt=clamp(M.wSt-(big?7:4));
 else M.fSt=clamp(M.fSt-(big?7:4));
 Psy.spotAfter(M,A,Df,outside,M.botches>wasBotched);
}
function dive(M){
 say(M,`${M.w.short} drives ${M.f.short} through the ropes. They spill towards the aisle, well away from the ring.`,'play',{pause:1});
 say(M,`${M.w.short} is climbing… not the turnbuckle. The balcony.`,'play',{pause:2,big:true});
 const botchP=(.12+(100-M.w.safe)*.004)*M.riskMul;
 M.spots++;
 if(M.r()<botchP){M.botches++;M.bonus-=35;M.crowd=clamp(M.crowd-4);say(M,`${M.w.short} jumps… and comes up short. The front row scatters.`,'bad',{big:true});
  if(!M.injury&&M.r()<.55){M.injury=2+(M.r()<.4?1:0);M.injuryPart=rnd(M,PARTS);decide(M,'injury');}}
 else{M.spotHits++;M.bonus+=30;M.crowd=clamp(M.crowd+16);M.adj.heat+=4;say(M,`${M.w.short} FLIES off the balcony and wipes out ${M.f.short}! Phones are out everywhere!`,'crowd',{big:true});}
 Psy.get(M).position='outside';Psy.get(M).down=null;
}
function nearfall(M){
 return Psy.nearfall(M);
 const yoursFirst=!M.o.finish.startsWith('win');
 const yours=M.nearfalls%2===0?!yoursFirst:yoursFirst;
 const A=yours?M.w:M.f,Df=yours?M.f:M.w;
 const late=M.nearfallAt.length===0&&M.crowd>=68;
 const pop=3+M.crowd*.05*(late?1.4:1);
 if(late&&A.sub){
  say(M,`${A.short} locks in ${the(A.finisher)}!`,'play',{big:true,pause:1});
  say(M,`${Df.short} is fading… reaching for the ropes…`,'play',{pause:2});
  M.crowd=clamp(M.crowd+pop);
  say(M,`ROPE BREAK! ${Df.short} SURVIVES ${THE(A.finisher)}!`,'crowd',{big:true});
 }else{
  const move=late?`${the(A.finisher)}`:rnd(M,D.SPOTS[A.style]||D.SPOTS.Story).replace(/^a /,'a ');
  say(M,`${A.short} hits ${move}!`,'play',{big:true,pause:1});
  say(M,'Cover!','count',{pause:1});
  say(M,'ONE!','count',{pause:1,big:true});
  say(M,'TWO!','count',{pause:2,big:true});
  M.crowd=clamp(M.crowd+pop);
  say(M,late?rnd(M,[`NO! ${Df.short} KICKED OUT OF ${THE(A.finisher)}!`,`HOW? ${Df.short} survived ${THE(A.finisher)}!`,`A SHOULDER UP! ${Df.short} escaped the finisher!`]):rnd(M,[`Kick out! ${Df.short} survives!`,`Two and a half! ${Df.short} kicks free!`,`The referee's hand almost hit three — ${Df.short} is still in this!`,`A last-second escape from ${Df.short}!`]),'crowd',{big:true});
 }
 M.nearfalls++;M.bonus+=late?8:4;
}

/* ---- ringside calls ---- */
const CALLS={
 slow:{name:'Slow it down',hint:'Rest hold. Recover stamina; the crowd may cool.'},
 pickup:{name:'Pick it up',hint:'Faster pace. Crowd up if they have the legs.'},
 big:{name:'Hit the big spot',hint:'One big move now. Huge pop or a nasty botch.'},
 crowd:{name:'Work the crowd',hint:'Play to the seats. Builds noise, stalls the match.'},
 home:{name:'Take it home',hint:'Go to the finish now. Early means a shorter, weaker match.'},
 sheet:{name:'Back to the layout',hint:'Pull an improvising worker back to the plan.'}
};
function canCall(M,id){
 if(M.done||M.stage!=='live'||M.decision||M.calls<=0)return false;
 if(id==='sheet')return !!M.offScript;
 if(id==='home')return M.len-M.t>45;
 return true;
}
function call(M,id){
 if(!canCall(M,id))return false;
 M.calls--;M.callsUsed.push(id);const w=M.w;
 say(M,`You shout from ringside: “${CALLS[id].name}.”`,'you');
 const listen=M.listen+(id==='home'?20:0)+(id==='sheet'&&M.leash==='script'?10:0);
 if(M.r()*100>listen){M.ignored++;say(M,rnd(M,[`${w.short} waves you away.`,`${w.short} doesn’t even look over.`,`${w.short} hears you. Does the opposite.`]),'bad');if(w.ego>=70)M.adj.morale-=1;return true}
 root.OfficeSheets?.intervention(M,id);
 if(id==='slow'){M.mode={type:'slow',ticks:6};say(M,`${w.short} takes the call and slows it down with a rest hold.`,'play',{who:'runner'})}
 if(id==='pickup'){M.mode={type:'pickup',ticks:6};say(M,`${w.short} hears you. The pace picks up.`,'play',{who:'runner'})}
 if(id==='crowd'){M.mode={type:'crowd',ticks:5};say(M,`${w.short} turns to the crowd, arms out wide.`,'crowd')}
 if(id==='big'){const n=M.spots;spot(M,true,true);if(M.spots>n)root.OfficeSheets?.observe(M,'special_spot','w','spot')}
 if(id==='sheet'){M.offScript=null;M.comply=clamp(M.comply+15);say(M,`${w.short} nods. Back to the match layout.`,'play',{who:'runner'})}
 if(id==='home'){const frac=M.t/M.len;if(frac<.6){M.shortened=true;M.len=M.t+70;}else M.len=Math.min(M.len,M.t+40);
  M.nearfallAt=M.nearfallAt.filter(x=>x*M.len>M.t).slice(0,1);if(!M.nearfallAt.length&&M.len-M.t>30)M.nearfallAt=[(M.t+20)/M.len];
  say(M,`${w.short} relays it to ${M.f.short}: take it home.`,'play',{who:'runner'})}
 return true;
}

/* ---- decisions: the match pauses until the manager chooses ---- */
function decide(M,id){
 const w=M.w,f=M.f,p=M.p;
 const defs={
  injury:{title:`${w.short} is hurt`,body:`${w.name} landed badly. That’s a real ${M.injuryPart} injury, not a sell. The referee is looking over at you.`,options:[
   {id:'home',label:'Take it home now',hint:'Finish as booked within the minute. A short match, but the injury stays as it is.'},
   {id:'work',label:'Work through it',hint:'Keep the match going. The crowd may rally behind it. It may get worse.'},
   {id:'stop',label:'Stop the match',hint:'No contest. Half the purse, an unhappy booker, a protected wrestler.'}]},
  stiff:{title:`${f.short} is getting stiff`,body:`Those shots from ${f.name} are landing for real. ${w.short} glances at you between blows.`,options:[
   {id:'protect',label:'Cover up and ride it out',hint:'Keep the peace. The match loses a little.'},
   {id:'fire',label:'Give it back',hint:'The crowd will love it. The booker won’t. Someone may get hurt.'},
   {id:'ref',label:'Have the referee warn them',hint:'Calms it down, and takes the heat out of the match.'}]},
  time:{title:`${p.voice}: cut it short`,body:`From the production truck: “TV’s running long. Lose four minutes or we lose the finish on air.”`,options:[
   {id:'cut',label:'Cut four minutes',hint:'The booker is grateful. Less time to build to the finish.'},
   {id:'keep',label:'Let them work',hint:'Full match. The booker is furious unless it’s worth it (four stars or more).'}]},
  double:{title:`The crowd want ${w.short}`,body:`${p.venue.charAt(0).toUpperCase()+p.venue.slice(1)} is on its feet chanting for ${w.name}. The contract says ${w.short} loses tonight. ${f.short} is about to go for the cover.`,options:[
   {id:'job',label:'Do the job',hint:`Finish as booked. ${p.name} will remember you did business.`},
   {id:'kick',label:'Kick out. Win it.',hint:`Huge for ${w.short}. You will probably never work for ${p.name} again, and they won’t pay you.`}]}
 };
 M.decision={id,...defs[id]};
 say(M,defs[id].title+'.','alert',{big:true});
}
function resolve(M,choice){
 const d=M.decision;if(!d)return;M.decision=null;const w=M.w,f=M.f;
 const opt=d.options.find(o=>o.id===choice)||d.options[0];
 say(M,`Your call: “${opt.label}”`,'you');
 if(d.id==='injury'){
  if(choice==='home'){if(M.len-M.t>60)M.shortened=true;M.len=Math.min(M.len,M.t+50);M.nearfallAt=[];say(M,`${w.short} nods through gritted teeth. Straight to the finish.`,'play',{who:'runner'})}
  if(choice==='work'){M.workingHurt=true;M.crowd=clamp(M.crowd+5);M.adj.heat+=3;say(M,`${w.short} waves off the referee. The crowd start clapping. Brave, or daft.`,'crowd')}
  if(choice==='stop'){M.outcome='nc';M.adj.purseMul=.5;M.adj.trust-=6;M.adj.morale+=5;M.injury=Math.max(1,M.injury-1);M.stage='finish';}
 }
 if(d.id==='stiff'){
  if(choice==='protect'){M.stiff='protect';M.mode={type:'slow',ticks:3};M.wSt=clamp(M.wSt-8);say(M,`${w.short} covers up and rides out the storm.`)}
  if(choice==='fire'){M.stiff='fire';M.crowd=clamp(M.crowd+9);M.bonus+=10;M.adj.trust-=4;M.adj.morale+=4;say(M,`${w.short} fires back for real! This is a fight now!`,'crowd',{big:true});
   if(M.r()<.25){if(M.r()<.5&&!M.injury){M.injury=1;M.injuryPart='jaw';say(M,`${w.short} took one flush on the jaw. Wobbly.`,'bad')}else{M.foeHurt=true;say(M,`${f.short} is bleeding from the nose. That was not planned.`,'bad')}}}
  if(choice==='ref'){M.stiff='ref';M.crowd=clamp(M.crowd-4);say(M,`The referee has a word with ${f.short}. Things settle down.`)}
 }
 if(d.id==='time'){
  if(choice==='cut'){M.len=Math.max(M.t+90,M.len-240);M.adj.trust+=4;M.nearfallAt=M.nearfallAt.filter(x=>x*M.len>M.t+20).slice(0,2);if(!M.nearfallAt.length)M.nearfallAt=[(M.len-30)/M.len];say(M,'The referee gets the signal. Four minutes come out of the match.')}
  if(choice==='keep'){M.timeDefied=true;say(M,`${M.p.voice} is shouting in your headset. You take it off.`)}
 }
 if(d.id==='double'){
  if(choice==='job'){M.adj.trust+=5;M.adj.heat+=2;say(M,'You stand still. Business is business.','play',{who:null})}
  if(choice==='kick'){
   if(w.pro>=85){M.refused=true;M.adj.morale-=2;say(M,`${w.short} hears you… and shakes the head. ${w.short} is doing the job.`,'agent',{big:true})}
   else{M.outcome='double';say(M,'You give the signal.','agent',{who:null})}
  }
 }
}

function decisive(M,A,Df,step,end){
 if(A.sub){
  say(M,`${A.short} locks in ${the(A.finisher)}!`,'play',{...step(),big:true,pause:1});
  say(M,`${Df.short} reaches for the ropes…`,'play',{...step(),pause:2});
  say(M,`${Df.short} TAPS!`,'count',{...step(),big:true});
 }else{
  say(M,`${A.short} hits ${the(A.finisher)}!`,'play',{...step(),big:true,pause:1});
  say(M,'The cover.','count',{...step(),pause:1});
  say(M,'ONE!','count',{...step(),big:true,pause:1});say(M,'TWO!','count',{...step(),big:true,pause:2});say(M,'THREE!','count',{...step(),big:true});
 }
 say(M,end,'bell',{...step(),big:true});
}
/* ---- v3.3 finish routes: 4–6 believable ways to deliver each booked result ---- */
function finishContext(M){
 const g=M.graph||{},p=Psy.get(M),ev=g.events||[];
 return {dmgW:g.damage?.w||0,dmgF:g.damage?.f||0,partW:g.targets?.w||p.target,partF:g.targets?.f||'ribs',
  wRev:ev.filter(e=>e.reverse&&e.preControl==='f').length,fRev:ev.filter(e=>e.reverse&&e.preControl==='w').length,
  heat:Math.max(M.o.feudHeat||0,0),tiredW:M.wSt<30,tiredF:M.fSt<30,gap:M.wSt-M.fSt};
}
const count3=(M,step)=>{say(M,'ONE!','count',{...step(),big:true,pause:1});say(M,'TWO!','count',{...step(),big:true,pause:2});say(M,'THREE!','count',{...step(),big:true});};
const FINISH_ROUTES={
 win_clean:[
  {id:'finisher',when:()=>true,run(M,w,f,step){
   say(M,`${f.short} reaches for the waistlock, but ${w.short} elbows free and turns into position!`,'play',{...step(),pause:1});
   say(M,`${w.short} pulls ${f.short} into position, then signals for ${the(w.finisher)}…`,'play',{...step(),pause:1});
   decisive(M,w,f,step,`${w.name} wins it clean.`);}},
  {id:'reversal_finisher',when:x=>x.wRev>=3,run(M,w,f,step){
   say(M,`${f.short} goes for ${the(f.finisher)}, but ${w.short} has seen it all night and slips out the back!`,'play',{...step(),pause:1});
   decisive(M,w,f,step,`${w.name} countered at the decisive moment and wins it clean.`);}},
  {id:'top_rope',when:(x,M,w)=>w.style==='Spectacle'&&!x.tiredW,run(M,w,f,step){
   say(M,`${w.short} drops ${f.short} with a kick and climbs to the top rope. The whole building stands.`,'play',{...step(),pause:1});
   say(M,`${w.short} flies and hits ${the(w.finisher)} from the top!`,'play',{...step(),big:true,pause:1});
   say(M,'The cover.','count',{...step(),pause:1});count3(M,step);
   say(M,`${w.name} wins it clean from the top rope.`,'bell',{...step(),big:true});}},
  {id:'limb_finish',when:x=>x.dmgF>=4,run(M,w,f,step){
   say(M,`${w.short} goes back to the damaged ${M.graph?.targets?.f||'leg'} one more time. ${f.short} can barely stand.`,'play',{...step(),pause:1});
   decisive(M,w,f,step,`${w.name} wore ${f.short} down and wins it clean.`);}},
  {id:'strike_knockout',when:(x,M,w)=>w.style==='Brawl',run(M,w,f,step){
   say(M,`${w.short} and ${f.short} stand in the middle trading forearms. ${f.short}’s knees buckle first.`,'play',{...step(),pause:1});
   say(M,`${w.short} hits ${the(w.finisher)} before ${f.short} can fall!`,'play',{...step(),big:true,pause:1});
   say(M,'The cover.','count',{...step(),pause:1});count3(M,step);
   say(M,`${w.name} wins it clean. That was a fight.`,'bell',{...step(),big:true});}},
  {id:'outlasted',when:x=>x.tiredF&&x.gap>=15,run(M,w,f,step){
   say(M,`${f.short} is out on their feet. ${w.short} still has something left.`,'play',{...step(),pause:1});
   decisive(M,w,f,step,`${w.name} outlasted ${f.short} and wins it clean.`);}}
 ],
 win_dirty:[
  {id:'tights',when:()=>true,run(M,w,f,step){
   say(M,`${f.short} has ${w.short} reeling, but a commotion at ringside draws the referee's attention!`,'play',{...step(),pause:1});
   say(M,`${w.short} catches ${f.short} with a sudden roll-up and grabs a fistful of tights while the referee is looking away!`,'play',{...step(),big:true,pause:1});
   say(M,'The referee turns back, sees shoulders down, and drops to count. The illegal grip goes unnoticed.','play',{...step(),pause:1});
   count3(M,step);say(M,`${w.short} steals it! ${M.crowd>=60?'The crowd let them have it.':'Scattered boos.'}`,'bell',{...step(),big:true});}},
  {id:'feet_on_ropes',when:()=>true,run(M,w,f,step){
   say(M,`${f.short} charges, and ${w.short} pulls them down into a cover near the ropes. The referee is checking the other side of the ring.`,'play',{...step(),pause:1});
   say(M,`${w.short} puts both feet on the ropes for extra leverage!`,'play',{...step(),big:true,pause:1});
   say(M,'The referee turns back, sees shoulders down, and drops to count. Nobody sees the feet.','play',{...step(),pause:1});
   count3(M,step);say(M,`${w.short} steals it with the ropes! ${M.crowd>=60?'The crowd are furious.':'Boos ring out.'}`,'bell',{...step(),big:true});}},
  {id:'eye_poke',when:(x,M,w)=>['Brawl','Story'].includes(w.style),run(M,w,f,step){
   say(M,`${f.short} sets for ${the(f.finisher)}, but the referee is checking a turnbuckle pad.`,'play',{...step(),pause:1});
   say(M,`${w.short} jabs a thumb in the eye and rolls ${f.short} up!`,'play',{...step(),big:true,pause:1});
   say(M,'The referee turns back, sees shoulders down, and drops to count. The thumb was never seen.','play',{...step(),pause:1});
   count3(M,step);say(M,`${w.short} cheated and got away with it!`,'bell',{...step(),big:true});}},
  {id:'referee_bump',when:x=>x.heat>=40,run(M,w,f,step){
   say(M,`${w.short} ducks, and ${f.short} runs straight into the referee! The official is down.`,'play',{...step(),pause:1});
   say(M,`${w.short} pins ${f.short} and keeps holding the ropes for leverage while the referee crawls over.`,'play',{...step(),big:true,pause:1});
   say(M,'The referee turns back, sees shoulders down, and slowly makes the count.','play',{...step(),pause:1});
   count3(M,step);say(M,`${w.short} steals it in the chaos! ${f.short} cannot believe it.`,'bell',{...step(),big:true});}}
 ],
 lose_protected:[
  {id:'rope_rollup',when:()=>true,run(M,w,f,step){
   say(M,`${w.short} hits ${the(w.finisher)}!`,'play',{...step(),big:true,pause:1});say(M,'Cover!','count',{...step(),pause:1});
   say(M,'ONE!','count',{...step(),big:true,pause:1});say(M,'TWO!','count',{...step(),big:true,pause:2});
   say(M,`${f.short}’s foot is on the rope!`,'crowd',{...step(),big:true,pause:1});
   say(M,M.graph?.damage?.w>=3?`${w.short} argues with the referee, momentarily forgetting the injured ${Psy.get(M).target}. ${f.short} rolls up from behind with a handful of tights!`:`${w.short} argues with the referee and turns away for a second. ${f.short} takes advantage with a roll-up and a fistful of tights!`,'play',{...step(),big:true,pause:1});
   say(M,'ONE! TWO! THREE!','count',{...step(),big:true});
   say(M,`${w.name} was robbed, and everyone saw it.`,'bell',{...step(),big:true});}},
  {id:'slow_count',when:()=>true,run(M,w,f,step){
   say(M,`${w.short} covers ${f.short}… ONE… TWO… the referee is slow, and ${f.short} kicks out!`,'crowd',{...step(),big:true,pause:1});
   say(M,`${w.short} gets up to argue about the count. ${f.short} grabs the leg and rolls ${w.short} into a schoolboy!`,'play',{...step(),big:true,pause:1});
   say(M,'ONE! TWO! THREE!','count',{...step(),big:true});
   say(M,`${w.name} had it won. Everyone in the building saw the slow count.`,'bell',{...step(),big:true});}},
  {id:'exhausted_cover',when:x=>x.tiredW,run(M,w,f,step){
   say(M,`${w.short} hits ${the(w.finisher)}! But ${w.short} is too exhausted to make the cover!`,'play',{...step(),big:true,pause:1});
   say(M,`Both are down. ${f.short} rolls over and drapes an arm across ${w.short}.`,'play',{...step(),pause:1});
   say(M,'ONE! TWO! THREE!','count',{...step(),big:true});
   say(M,`${w.name} did everything but make the cover.`,'bell',{...step(),big:true});}},
  {id:'injury_gives',when:x=>x.dmgW>=3,run(M,w,f,step){
   say(M,`${w.short} sets ${f.short} up for ${the(w.finisher)}, but the injured ${M.graph?.targets?.w||Psy.get(M).target} gives way!`,'bad',{...step(),big:true,pause:1});
   say(M,`${f.short} sees it and rolls ${w.short} up!`,'play',{...step(),pause:1});
   say(M,'ONE! TWO! THREE!','count',{...step(),big:true});
   say(M,`${w.name} was beaten by the injury as much as by ${f.short}.`,'bell',{...step(),big:true});}}
 ],
 lose_clean:[
  {id:'duck_finisher',when:()=>true,run(M,w,f,step){
   say(M,M.graph?.damage?.w>=3?`${w.short} tries to plant on the battered ${Psy.get(M).target}, but hesitates just long enough for ${f.short} to duck the strike and catch ${w.short} off balance!`:`${w.short} lunges for another attack, but ${f.short} ducks beneath it and catches ${w.short} off balance!`,'play',{...step(),pause:1});
   decisive(M,f,w,step,`${f.name} wins, decisively. No excuses.`);}},
  {id:'finisher_reversed',when:x=>x.fRev>=3,run(M,w,f,step){
   say(M,`${w.short} sets up ${the(w.finisher)}, but ${f.short} has been reading it all night and reverses!`,'play',{...step(),big:true,pause:1});
   decisive(M,f,w,step,`${f.name} countered and wins, decisively.`);}},
  {id:'submission_defeat',when:x=>x.dmgW>=4,run(M,w,f,step){
   say(M,`${f.short} traps ${w.short}’s damaged ${M.graph?.targets?.w||Psy.get(M).target} and wrenches it back!`,'play',{...step(),big:true,pause:1});
   say(M,`${w.short} reaches for the ropes, but they are too far away…`,'play',{...step(),pause:2});
   say(M,`${w.short} TAPS!`,'count',{...step(),big:true});
   say(M,`${f.name} wins by submission. ${w.short} had nothing left.`,'bell',{...step(),big:true});}},
  {id:'outlasted',when:x=>x.tiredW&&x.gap<=-15,run(M,w,f,step){
   say(M,`${w.short} is out on their feet. ${f.short} still has something left.`,'play',{...step(),pause:1});
   decisive(M,f,w,step,`${f.name} outlasted ${w.short} and wins, decisively.`);}}
 ]
};
// Eighteen contracted routes plus the no-contest and the off-script double-cross make twenty.
const FINISH_ROUTE_COUNT=Object.values(FINISH_ROUTES).reduce((n,l)=>n+l.length,0)+2;
function pickFinishRoute(M){
 const list=FINISH_ROUTES[M.o.finish]||FINISH_ROUTES.win_clean,x=finishContext(M);
 const agreed=M.o.sheet?.finishRoute&&list.find(r=>r.id===M.o.sheet.finishRoute);
 if(agreed){M.r();return agreed;}
 const ok=list.filter(r=>r.when(x,M,M.w,M.f));
 // Specific routes earn more weight than the default, so the match so far shapes the ending.
 const weights=ok.map((r,i)=>i===0&&ok.length>1?.6:1.2);
 let n=M.r()*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<ok.length;i++){n-=weights[i];if(n<0)return ok[i];}
 return ok[ok.length-1];
}
/* ---- the finish ---- */
function finish(M){
 Graph.finishCue(M);
 const w=M.w,f=M.f,o=M.o;let at=M.t;const step=(n=4)=>(at+=n,{at});
 // The microphone story is a real obligation, not flavour text.
 const promise=o.promo?.promise?.type;
 if(promise==='win'){
  say(M,o.finish.startsWith('win')||M.outcome==='double'?w.short+' promised a victory before the bell. This is the moment to deliver it.':w.short+' promised a victory before the bell. The match is slipping away from that promise.','story',{...step()});
 }else if(promise==='finisher'){
  say(M,o.finish==='win_clean'?w.short+' told everyone exactly which finishing move to expect. Now the opponent knows what is coming.':w.short+' named the finishing move in that earlier promo, but the chance to use it is disappearing.','story',{...step()});
 }else if(promise==='clean'){
  say(M,['win_clean','lose_clean'].includes(o.finish)?'Both wrestlers promised a straight contest. The official is watching closely.':'A clean fight was promised on the microphone. That promise is now being tested.','story',{...step()});
 }
 if(Psy.get(M).position==='outside'){say(M,`${w.short} and ${f.short} scramble back inside before the referee reaches ten.`,'play',{...step()});Psy.get(M).position='standing';}
 if(Psy.get(M).position==='mat'){say(M,'They fight back to their feet. Both know the next exchange can end it.','play',{...step()});Psy.get(M).position='standing';}
 if(M.outcome==='nc'){
  say(M,'The referee waves it off. The doctor is in the ring.','bad',{...step(),big:true});
  say(M,'No contest.','bell',{...step(),big:true});
 }else if(M.outcome==='double'){
  if(f.sub){say(M,`${f.short} locks in ${the(f.finisher)}!`,'play',{...step(),big:true,pause:1});say(M,`${w.short} should be tapping now…`,'play',{...step(),pause:2});
   say(M,`${w.short} BREAKS THE HOLD! Nobody saw that coming!`,'crowd',{...step(),big:true,pause:1});}
  else{say(M,`${f.short} hits ${the(f.finisher)}! Cover!`,'play',{...step(),big:true,pause:1});
   say(M,'ONE!','count',{...step(),big:true,pause:1});say(M,'TWO!','count',{...step(),big:true,pause:2});
   say(M,`${w.short} KICKS OUT! Nobody saw that coming!`,'crowd',{...step(),big:true,pause:1});}
  say(M,`${f.short} looks at the referee. The referee looks at the curtain.`,'agent',{...step(6),pause:1,who:'pbp'});
  say(M,`That was not the plan. ${M.p.name} will want a word.`,'agent',{...step(0)});
  decisive(M,w,f,step,`${w.name} has pulled off the upset!`);
  say(M,`Chaos at ${M.p.venue}.`,'crowd',{...step(),big:true});
 }else{
  // v3.3: twenty finish routes. The contract chooses who wins; the match so far chooses how.
  const route=pickFinishRoute(M);M.finishRoute=route.id;
  if(M.graph?.outcome)M.graph.outcome.route=route.id;
  route.run(M,w,f,step);
 }
 M.t=at;M.stage='over';
 M.final=summary(M);
 if(M.outcome!=='nc'&&M.outcome!=='double')vic(M,M.final.stars>=4?'great':M.final.stars>=2.5?'good':'poor',1,{...step(3)});
 say(M,`Final rating: ${starText(M.final.stars)}`,'rating',{...step(2),big:true});
}
function summary(M){
 root.OfficeSheets?.closeVows?.(M);
 const s=stars(M,true);
 return {stars:s,crowd:Math.round(M.crowd),crowdPeak:Math.round(M.crowdPeak),crowdStart:M.crowdStart,botches:M.botches,spots:M.spots,spotHits:M.spotHits,nearfalls:M.nearfalls,
  script:M.scriptChecks?M.scriptHits/M.scriptChecks:null,callsUsed:M.callsUsed.slice(),ignored:M.ignored,injury:M.injury,injuryPart:M.injuryPart,
  outcome:M.outcome,finishRoute:M.finishRoute||null,crowdTrace:[...(M.crowdTrace||[]),[M.t,Math.round(M.crowd)]],rehearsed:!!M.o.sheet?.rehearsed,roomNote:root.OfficeRoom?.verify(M)||null,roomBonus:M.o.sheet?.bonus||0,roomFx:M.o.sheet?.fx||null,roomThreads:M.o.sheet?.threads||null,roomThreadUsed:M.o.sheet?.threadUsed||null,roomRepStake:M.o.sheet?.repStake||0,refused:M.refused,shortened:M.shortened,timeDefied:!!M.timeDefied,stiff:M.stiff,foeHurt:M.foeHurt,workingHurt:M.workingHurt,
  resent:M.resent,promo:M.o.promo||null,
  promoSignals:{
   workerCounter:!!M.graph?.promoCounterPaid,
   workerFinisherSetup:!!M.graph?.events?.some(e=>e.id==='finish_tease'&&e.preControl==='w'),
   workerDirty:!!M.graph?.events?.some(e=>e.id==='cheap_shot'&&e.preControl==='w'),
   opponentDirty:!!M.graph?.events?.some(e=>e.id==='cheap_shot'&&e.preControl==='f')
  },
  psychology:{archetype:M.planId,controlChanges:Psy.get(M).changes,target:Psy.get(M).target,targetingBeats:Psy.get(M).focusHits,hopeSpots:Psy.get(M).hopeSpots,graph:{nodes:M.graph?.steps||0,arcs:M.graph?.history?.slice()||[],edges:M.graph?.transitions||0,damage:{...(M.graph?.damage||{w:0,f:0})},nearfallCount:M.graph?.nearfallCount||0,pattern:M.graph?.pattern||M.planId,texture:M.graph?.texture||'classic',restBeats:M.graph?.rests||0,exertion:Math.round(M.graph?.exertion||0),outcome:M.graph?.outcome||null,actions:M.graph?.events?.slice(-40).map(e=>e.id)||[]}},preparation:{note:Object.keys(M.prep).some(k=>M.prep[k]>=1.5)?`${M.w.short}'s preparation helped in the match: ${Object.entries(M.prep).filter(([,v])=>v>=1.5).map(([k])=>k).join(', ')}.`:null},adj:{...M.adj},minutes:Math.round(M.t/60),plan:M.planId,leash:M.leash,talk:M.talk,stamina:Math.round(M.wSt)};
}
function starText(s){const whole=Math.floor(s),frac=s-whole;return '★'.repeat(whole)+(frac===.25?'¼':frac===.5?'½':frac===.75?'¾':'')+(s===0?'DUD':'');}
function liveStars(M){return stars(M,false)}
function phaseName(M){return M.stage==='entrance'?'Entrances':M.stage==='live'?M.phase?.name||'Feeling out':M.stage==='finish'?'The finish':'Full time'}

root.OfficeMatch={create,next,call,canCall,resolve,CALLS,FINISH_ROUTES,FINISH_ROUTE_COUNT,liveStars,starText,fmt,phaseName,PHASES,_stars:stars,GRAPH:Graph,scout:Graph.scout,note:(M,line,who)=>say(M,line,'story',who?{who}:{}),restore(M){M.r=mulberry(M.rState??M.o.seed);return M}};
})(typeof window!=='undefined'?window:globalThis);
