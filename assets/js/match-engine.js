/* THE OFFICE v2 — live match engine.
   A tick is ten seconds of match time. The engine produces commentary lines one at a time;
   the UI plays them back at a chosen speed and can interrupt with ringside calls.
   The contracted finish is fixed unless the manager deliberately breaks it. */
(function(root){'use strict';
const D=root.OfficeData;
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
// Governing rules apply to EVERY graph transition, not only the last move.
const STIP_NO_COUNTOUT=new Set(['nodq','submission','anywhere']);
const noCountout=M=>STIP_NO_COUNTOUT.has(M.o?.stip||M.stip);
const pinText=/\b(?:pin(?:fall|ned|ning)?|pin attempt|cover|cradle|small package|backslide|roll[- ]?up|kick(?:s|ed)? out|shoulder up|near.?fall)\b|ONE!|TWO!/i;
// v0.3.13 Crowd noise has a ceiling the way a room does: each gain shrinks as the place gets louder,
// so a hot crowd needs sustained good work to stay hot and a full 100 is a rare, earned night.
// Losses always land in full. Every change to the crowd during a match goes through here.
const CROWD_EASE=28,CROWD_FLOOR=.05;
function lift(M,d){
 if(d>0)d*=Math.max(CROWD_FLOOR,Math.min(1,(100-M.crowd)/CROWD_EASE));
 M.crowd=clamp(M.crowd+d);return M.crowd;
}
// Moments the post-match report pins to the match clock: [seconds, kind, 1 if it was your wrestler].
function mark(M,k,yours){(M.marks??=[]).push([M.t,k,yours?1:0])}
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
 function line(M,words,kind='play',opt={}){say(M,fill(M,words),kind,opt)}
 function pair(M,words,kind='play'){for(const t of words)line(M,t,kind)}
 function take(M,choices){const s=get(M),pool=choices.filter(x=>!s.recentBeats.includes(x[0]));const choice=rnd(M,pool.length?pool:choices);s.last=choice[0];s.recentBeats.push(choice[0]);if(s.recentBeats.length>4)s.recentBeats.shift();return choice}
 function phase(M){
  const s=get(M),p=M.phase.id;s.phase=p;
  if(s.position==='outside'){pair(M,[noCountout(M)?'They return through the ropes by choice. There is no count-out in this stipulation.':'The referee is up to six. Both wrestlers scramble back beneath the bottom rope.']);s.position='standing';s.down=null}
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
   pair(M,noCountout(M)?[`${A.short} rolls ${Df.short} back under the bottom rope. Neither is forced in by a count.`,`${A.short} follows inside and stays close.`]:[`The referee has reached six. ${A.short} rolls ${Df.short} back under the bottom rope.`,`The count is broken. They are back inside, and ${A.short} stays close.`]);
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
   line(M,noCountout(M)?`${A.short} and ${Df.short} choose to bring the fight back inside.`:`${A.short} and ${Df.short} climb back into the ring while the referee is counting.`);
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
   if(s.position==='outside')line(M,noCountout(M)?`${A.short} hauls ${Df.short} upright on the floor. They are under no count-out pressure.`:`${A.short} hauls ${Df.short} upright on the floor. The referee is still counting.`);
   else line(M,noCountout(M)?`${A.short} sends ${Df.short} over the ropes and follows. They can fight on the floor.`:`${A.short} sends ${Df.short} over the ropes to the floor and follows. The referee begins the count.`);
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
   line(M,`${A.short} drags ${Df.short} back under the bottom rope. ${M.o.stip==='anywhere'?'The fall would have counted outside too.':M.o.stip==='submission'?'Only a submission can decide this match.':'A pin only counts inside the ring.'}`);
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
  M.nearfalls++;lift(M,pop);mark(M,'nf',yours);M.bonus+=late?8:4;
 }
 // A live scheduled kick-out may credit only the wrestler who actually
 // landed the immediately preceding in-ring knockdown. Never write an
 // imaginary strike, reversal or change of attacker to satisfy the clock.
 function earnedNearfall(M,source){
  const s=get(M),side=source?.side,other=side==='w'?'f':'w';
  if(!['w','f'].includes(side)||s.control!==side||
     s.position!=='mat'||s.down!==other)return false;
  const attacker=side==='w'?M.w:M.f,defender=other==='w'?M.w:M.f;
  const move=source.label||'knockdown';
  // Earned covers already require real recorded, mechanically eligible landings.
  s.coverNarrationCount=(s.coverNarrationCount||0)+1;
  const covers=[
   attacker.short+' stays close after the '+move+' and hooks '+defender.short+"'s far leg for the cover!",
   attacker.short+' follows the '+move+' with an immediate pin attempt on '+defender.short+'.',
   'After the '+move+', '+attacker.short+' presses '+defender.short+"'s shoulders down and hooks a leg.",
   attacker.short+' drops into a cover, keeping '+defender.short+' down after the '+move+'.',
   attacker.short+' hooks '+defender.short+"'s leg right after the "+move+' and waits for the count.',
   'The '+move+' left '+defender.short+' on the mat; '+attacker.short+' takes the cover.',
   attacker.short+' folds into a cover after the '+move+'. '+defender.short+' has to kick free.',
   attacker.short+' tries to keep '+defender.short+' pinned following the '+move+'.'
  ];
  line(M,covers[(s.coverNarrationCount-1)%covers.length],'count',
   {textureId:'earned-nearfall-cover'});
  line(M,'ONE!','count');line(M,'TWO!','count');
  // Keep exactly one original commentary RNG draw for the real kick-out.
  line(M,rnd(M,[
   defender.short+' lifts a shoulder before three!',
   'TWO AND A HALF! '+defender.short+' finds the escape!',
   'NO! '+defender.short+' kicks out at the last instant!',
   defender.short+' manages to lift a shoulder at two and a half!',
   'The count stops short of three! '+defender.short+' gets free!',
   'Shoulder up! '+defender.short+' survives the cover.',
   'A late kick-out from '+defender.short+' breaks the count!',
   'The referee signals two — '+defender.short+' has escaped!'
  ]),'crowd',{textureId:'earned-nearfall-kickout'});
  const late=M.nearfallAt.length===0&&M.crowd>=67;
  M.nearfalls++;lift(M,3+M.crowd*.05*(late?1.4:1));
  mark(M,'nf',side==='w');M.bonus+=late?8:4;
  return true;
 }
 return {PHASE_ENDS,make,get,phase,beat,recover,spotSetup,spotAfter,nearfall,earnedNearfall};
})();


const {brawlConditioning,Graph}=root.OfficeMatchGraph.install({
  get D(){return D},
  get Psy(){return Psy},
  get clamp(){return clamp},
  get fill(){return fill},
  get lift(){return lift},
  get mark(){return mark},
  get noCountout(){return noCountout},
  get phaseFor(){return phaseFor},
  get pinText(){return pinText},
  get referee(){return referee},
  get regularBigMoment(){return regularBigMoment},
  get say(){return say},
  get spot(){return spot},
  get structureCommentary(){return structureCommentary},
  get vic(){return vic}
});

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
 root.OfficeSheets?.DIRECTOR?.init(M);
 if(root.OfficeSheets?.DIRECTOR?.active(M))M.structureSpoken={};
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
 // Alternative structures get objective-specific commentary, not legacy American beat labels.
 const topics=[root.OfficeSheets?.DIRECTOR?.active(M)?null:M.phase?.id,M.o.blowoff?'blowoff':heat>=35?'feud':null,M.crowd>=75?'loud':M.crowd<35?'flat':null,'card'].filter(Boolean);
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
 // Final defence against legacy narration from old saved graphs or generic texture lines.
 // Do not turn an unrelated phrase (e.g. "pin drop") into fictional action.
 // Only suppress a typed legacy cover or count in submission-only matches.
 if(M.stage==='live'&&M.o?.stip==='submission'&&
   (kind==='count'||opt.eventType==='pin'))return null;
 if(noCountout(M)&&/referee (?:is up to|has reached|reaches|begins the count|starts counting|is still counting)|count(?:-?out| is broken)|before (?:the )?referee reaches ten|beat the referee.?s count/i.test(text)){
  text='They fight on without a count-out. Neither wrestler is forced back inside.';
 }
 let who=opt.who;
 for(const [re,v] of VOICE_PREFIX)if(re.test(text)){text=text.replace(re,'');text=text.charAt(0).toUpperCase()+text.slice(1);if(who===undefined)who=v;break}
 if(who===undefined)who=KIND_VOICE[kind]||null;
 const line={t:fmt(opt.at??M.t),text,kind,big:!!opt.big,pause:opt.pause||0,who};
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
  const n=Graph.A[o.call.action],duration=Math.max(1,M.len);
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
  construction=constructionOf(M);
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
  executionQuality:{stars:stars(M,true),botches:M.botches,psychologyScore:construction.score,
   linkedPairs:construction.linkedPairs,
   explanation:'Existing star calculation only. Structural completion adds no rating bonus.'}};
}
function phaseFor(frac,M){const ends=Psy.PHASE_ENDS[M?.planId]||Psy.PHASE_ENDS.story;return PHASES.find((p,i)=>frac<ends[i])||PHASES[4]}
// Grade observed, mechanically connected offence and actual dramatic payoffs.
// Never infer good wrestling from spot counts, named moves alone or the match plan.
function constructionOf(M){
 const g=M.graph||{},actions=(g.events||[]).filter(e=>Graph.A[e.id]&&e.preControl);
 let linkedPairs=0,threeBeatSequences=0,staleRepetitions=0,lastLinked=false;
 for(let i=0;i<actions.length;i++){
  const event=actions[i],prev=actions[i-1];
  const linked=!!(prev&&prev.control===event.preControl&&
   prev.preControl===prev.control&&event.preControl===event.control&&
   event.t>=prev.t&&event.t-prev.t<=30&&
   Graph.A[prev.id].next.some(([to])=>to===event.id));
  if(linked){linkedPairs++;if(lastLinked)threeBeatSequences++;}
  lastLinked=linked;
  if(actions.slice(Math.max(0,i-7),i).filter(x=>
   x.id===event.id&&x.preControl===event.preControl).length>=2)
   staleRepetitions++;
 }
 const history=g.history||[],pressureIndex=history.findIndex(x=>['cutoff','control','limb_work'].includes(x));
 const hopeIndex=history.findIndex((x,i)=>i>pressureIndex&&['hope','denial'].includes(x));
 const comeback=history.findIndex((x,i)=>i>hopeIndex&&['comeback','resurgence'].includes(x));
 const earnedComeback=pressureIndex>=0&&hopeIndex>pressureIndex&&comeback>hopeIndex;
 const workedDamage=(g.damage?.w||0)+(g.damage?.f||0);
 const focusedWork=workedDamage>=3;
 const opportunities=Math.max(1,actions.length-1);
 // Ratios make longer matches no more valuable than shorter, well-built ones.
 // A cap protects the five-star scale and keeps raw ringcraft decisive.
 let score=actions.length<5?0:
  Math.min(.22,linkedPairs/opportunities*.28+
   threeBeatSequences/Math.max(1,actions.length-2)*.18)+
  (focusedWork?.07:workedDamage>0?.03:0)+(earnedComeback?.08:0)-
  Math.min(.18,staleRepetitions*.025);
 score=Math.round(clamp(score,-.2,.37)*1000)/1000;
 return {linkedPairs,threeBeatSequences,staleRepetitions,focusedWork,
  workedDamage,earnedComeback,actions:actions.length,score};
}
// Credit landed, technically clean high-risk offence rather than granting
// unearned stars for a showy match plan or an unsuccessful/aborted attempt.
// One wrestler cannot inflate a rating by repeating the same spot ten times;
// the bounded score is proportional to ringcraft and safe execution.
function spectacularExecutionOf(M){
 let sum=0;const credited=new Set();
 for(const e of M.graph?.events||[]){
  const n=Graph.A[e.id];
  if(!n?.risk||n.reverse||n.blockOf||
     !['aerial','springboard','dive','lucha','corner','outside','superplex'].includes(n.family))
   continue;
  if(e.aerialResolution&&e.aerialResolution!=='landed')continue;
  if(e.grappleResolution&&e.grappleResolution!=='landed')continue;
  if(e.contactResolution&&e.contactResolution!=='landed')continue;
  const performer=e.preControl==='f'?M.f:M.w;
  if(!['w','f'].includes(e.preControl))continue;
  const key=e.preControl+':'+e.id;
  if(credited.has(key))continue;
  credited.add(key);
  const craft=clamp(((performer.ring||60)+(performer.safe||60)-110)/70,0,1);
  const trained=performer.style==='Spectacle'?1.25:1;
  const planFit=M.planId==='spots'?1.2:1;
  sum+=(.05+.12*craft)*trained*planFit;
 }
 return Math.round(Math.min(.45,sum)*1000)/1000;
}
// Every match plan earns its quality through actual recent ring work.
// A successful plan has a distinct identity, never a guaranteed flat score.
// The last three minutes of events matter so a hot opening cannot carry a
// tired, repetitive finishing stretch. Unique landed moves only.
function earnedPlanQuality(M){
 const plan=M.planId;
 const caps={story:3.5,spots:4.25,technical:4,brawl:3.5,safe:1.5};
 if(!Object.prototype.hasOwnProperty.call(caps,plan))return 0;
 // The original graph also contains genuine, narrated core techniques
 // without catalogue-family labels. Include only hand-reviewed, physically
 // completed actions; not entry setups, pose/stall nodes or generic resets.
 const core={
  technical:['lockup','headlock','wristlock','arm_wringer','waistlock',
    'hammerlock','mat_takedown'],
  spots:['aerial_attack','springboard_strike','missile_dropkick','high_crossbody'],
  brawl:['clothesline','body_shot','stiff_forearm','floor_brawl',
    'corner_strikes','short_arm_lariat'],
  story:['hope_elbows','hope_cutoff','dramatic_rally','target_hold','target_strike'],
  safe:['wristlock','headlock','mat_hold','clean_break','target_hold','mat_takedown']
 };
 const seen=new Set(),start=M.t-180;let earned=0;
 const build=['cutoff','control','limb_work','hope','denial','comeback','resurgence',
  'nearfall','false_finish','escalation','submission_battle','fighting_spirit'];
 for(const e of M.graph?.events||[]){
  if(e.t<start||e.t>M.t||!['w','f'].includes(e.preControl))continue;
  const n=Graph.A[e.id];
  if(!n||(!n.family&&!core[plan].includes(e.id))||n.reverse||n.counterOf||n.blockOf||
     (e.aerialResolution&&e.aerialResolution!=='landed')||
     (e.grappleResolution&&e.grappleResolution!=='landed')||
     (e.strikeResolution&&e.strikeResolution!=='landed')||
     (e.contactResolution&&e.contactResolution!=='landed'))continue;
  const worker=e.preControl==='w'?M.w:M.f,key=e.preControl+':'+e.id;
  if(seen.has(key))continue;
  let gain=0;
  switch(plan){
   case 'technical':
    if(['chain','submission','suplex','ground','rest','neck'].includes(n.family)||
       core.technical.includes(e.id))
     gain=(n.family?1.15:.65)*clamp(((worker.ring||0)-40)/50,.2,1);
    break;
   case 'spots':
    if((n.risk&&['aerial','springboard','dive','lucha','corner','outside','superplex'].includes(n.family))||
       core.spots.includes(e.id))
     gain=(n.family?2.8:1.1)*clamp(((worker.ring||0)+(worker.safe||0)-100)/60,0,1);
    break;
   case 'brawl':
    if(['strike','running','power','outside','corner','rope'].includes(n.family)||
       core.brawl.includes(e.id))
     gain=(n.family?1.05:.35)*clamp(((worker.ring||0)+(worker.psych||0)-85)/95,.25,1);
    break;
   case 'story':
    // An actual move must support a heat, hope, comeback or late pay-off.
    // Merely reaching the scheduled story arc earns nothing on its own.
    if(build.includes(e.arc))
     gain=(n.family?.9:.6)*clamp(((worker.psych||0)+(worker.ring||0)-85)/95,.25,1);
    break;
   case 'safe':
    // The deliberate low-ceiling plan values genuinely manageable work;
    // dangerous aerials and long, punishing high-cost moves cannot count.
    if(!n.risk&&(n.cost??0)<=2.2&&
       (['chain','rest','ground','pin','submission','strike','neck'].includes(n.family)||
        core.safe.includes(e.id)))
     gain=(n.family?.55:.3)*clamp(((worker.safe||0)-35)/55,.2,1);
    break;
  }
  if(gain>0){seen.add(key);earned+=gain;}
 }
 // 'Keep it safe' retains its existing -2 quality baseline: choosing it
 // still trades spectacle and ceiling for lower risk and stamina cost.
 const base=plan==='safe'?(M.plan?.qual??-2):0;
 return Math.round((base+Math.min(caps[plan],earned))*1000)/1000;
}
// The rating, itemised: what each part added to (or took off) the stars. stars() is their sum.
function starParts(M){
 if(!M.qN)return [];
 const avgQ=(M.qSum+M.bonus)/M.qN;
 const parts=[['work','The wrestling',1.1+(M.qSum/M.qN-40)*.068],['moments','Big moments',M.bonus/M.qN*.068],
  ['crowd','The crowd',(M.crowdPeak-65)*.01],['nearfalls','Near falls',Math.min(3,M.nearfalls)*(M.crowdPeak>=65?.12:.04)],['botches','Mistakes',-M.botches*.2]];
 if(M.shortened)parts.push(['short','Cut short',-.45]);
 if(M.sheetAdj)parts.push(['layout','The agreed layout',M.sheetAdj]);
 if(M.minutes>=15&&avgQ>=60)parts.push(['length','Long match, held together',.2]);
 const execution=spectacularExecutionOf(M);
 if(execution)parts.push(['showcase','Clean high-risk execution',execution]);
 const construction=constructionOf(M);
 if(construction.score)parts.push(['psychology','Sequences and psychology',construction.score]);
 if(M.outcome==='double')parts.push(['double','Double count-out',.25]);
 return parts;
}
function stars(M,final=false){
 if(!M.qN)return 0;
 let s=starParts(M).reduce((t,p)=>t+p[2],0);
 if(M.outcome==='nc')s=Math.min(s,1.5);
 if(M.outcome==='dq')s=Math.min(s,2.5);
 if(!final){const frac=Math.min(1,M.t/M.len);s=s*(.6+.4*frac);}
 return clamp(Math.round(s*4)/4,0,5);
}

/* ---- the main loop ---- */
function next(M){
 while(!M.queue.length&&!M.decision&&!M.done)simulate(M);
 return M.queue.shift()||null;
}
function simulate(M){
 // A disqualification called during the match (the referee, or a run-in caught at ringside) ends it now.
 if(M.dqCall&&M.stage==='live'&&M.outcome==='booked'){M.outcome='dq';M.stage='finish';}
 if(M.stage==='entrance')return entrances(M);
 if(M.stage==='finish')return finish(M);
 if(M.stage==='over'){M.done=true;return}
 tick(M);
}
function entrances(M){
 const fh=M.f.heat,wh=M.w.heat;
 say(M,`${M.f.name} comes out first. ${fh>=60?'Boos rain down.':'A smattering of jeers.'}`,'play',{at:0});
 const pop=wh<30?'Polite applause. Not many know the name yet.':wh<55?'A decent reaction.':wh<75?`A big pop for ${M.w.short}.`:`The roof comes off for ${M.w.short}!`;
 say(M,`Here comes ${M.w.name}${M.o.identity?.stable?' representing '+M.o.identity.stable:''}. ${pop}`,wh>=75?'crowd':'play',{at:0,big:wh>=75});
 if(M.o.blowoff)say(M,'This is the end of the road for these two. Everyone here knows it.','story',{at:0});
 else if((M.o.feudHeat||0)>=35)say(M,'Bad blood here. These two have history.','story',{at:0});
 if(M.o.promo)say(M,M.o.promo.hook,'story',{at:0});
 if(M.o.memory?.recall)say(M,M.o.memory.recall,'story',{at:0,who:'runner'});
 if(M.sheet?.signed)say(M,'Road agent: '+(M.o.identity?.manager?M.o.identity.manager+' signed off the ':'The ')+M.sheet.method+' match layout. The finish is contracted; the action must be earned.','story',{at:0});
 if(root.OfficeSheets?.DIRECTOR?.active(M))say(M,'Tonight’s '+(STRUCTURE_LABELS[M.structureDirector.id]||'alternative')+' layout sets four intended objectives. They count only if actually performed.','story',{at:0,who:'runner'});
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
 M.t+=10;
 // Resolve the *specific* committed aerial attack before any scene/arc reset
 // or unrelated spot can change positions. Pending state survives JSON saves.
 const aerialResolved=Graph.resolveAerial(M);
 const grappleResolved=Graph.resolveGrapple(M);
 const strikeResolved=Graph.resolveStrike(M);
 const contactResolved=Graph.resolveContact(M);
 const frac=M.t/M.len,ph=Graph.advance(M,frac),w=M.w,f=M.f,plan=M.plan;
 // Minor graph arcs update the label, but do not repeatedly roll the
 // producer's compliance/incidents checks within the same timed phase.
 const majorPhaseChange=!M.phase||M.phase.id!==ph.id;
 if(majorPhaseChange||M.phase.name!==ph.name){
  M.phase=ph;
  if(majorPhaseChange){onPhase(M);if(M.decision)return;}
 }
 // An outside exchange cannot continue indefinitely without a count-out.
 if(Psy.get(M).position==='outside'){
   const g=Graph.get(M);g.floorTicks=(g.floorTicks||0)+1;
   if(g.floorTicks>=5){say(M,fill(M,noCountout(M)?'{W} and {F} choose to go back through the ropes; there is no count to beat.':'The referee reaches eight. {W} and {F} scramble back through the ropes.'),'play');Psy.get(M).position='standing';Psy.get(M).down=null;Graph.resetPhysical(M);g.node=null;g.floorTicks=0;}
  }else Graph.get(M).floorTicks=0;
 // momentum
 const target=Psy.get(M).control==='w'?52:Psy.get(M).control==='f'?-52:0;M.mom+=(target-M.mom)*.23+(M.r()*16-8);M.mom=clamp(M.mom,-100,100);
 // stamina
 const mode=M.mode?.type;
 // A skilled, safe high-flyer can work a fast layout efficiently; an
 // untrained wrestler still pays the full Spot-fest stamina cost.
 const spotDrain=(worker)=>M.planId==='spots'?
  // Competent and safe workers conserve movement across a demanding
  // aerial layout. Untrained wrestlers (ring+safety <=120) still pay the
  // full 1.35 rate; even the best-trained retain a 0.96 rate and pay
  // every actual move's stamina cost.
  // No free stars or reduced botch probability: this only changes
  // sustained exertion, which has measurable late-match quality effects.
  clamp(plan.drain-Math.max(0,worker.ring+worker.safe-120)*.010,.96,plan.drain):plan.drain;
 // Only a previously narrated, saved rest lets a trained high-flyer
 // conserve movement between exchanges for up to 180 seconds. Neither
 // deliberate pickup nor explicit slow calls get an extra pacing discount.
 // Real aerial setup/move costs and their safety gates are untouched.
 const pacing=Graph.get(M).pacedRest;
 const paceFactor=(actor,side)=>{
  if(mode==='pickup'||mode==='slow')return 1;
  const earnedOutlast=Graph.get(M).pacedOutlast?.[side];
  const outlastFactor=earnedOutlast&&M.t<=earnedOutlast.until?
   1-(.48+.10*clamp(((actor.ring||0)+(actor.safe||0)-120)/60,0,1)):1;
  if(M.len<900)return outlastFactor;
  if(M.planId==='spots'&&actor.style==='Spectacle'&&pacing?.[side]&&
     M.t<=pacing[side].until){
   const skill=clamp(((actor.ring||0)+(actor.safe||0)-120)/60,0,1);
   return Math.min(outlastFactor,1-(skill>=.95?.82:.64)*skill);
  }
  const pacedBrawl=Graph.get(M).pacedBrawl?.[side];
  if(M.planId==='brawl'&&actor.style==='Brawl'&&
     pacedBrawl&&M.t<=pacedBrawl.until)
   return Math.min(outlastFactor,1-.45*brawlConditioning(actor));
  return outlastFactor;
 };
 // Skilled brawlers conserve movement, but actual action costs remain
 // unchanged. This reduction is never unlocked by choosing Brawl alone.
 const workDrain=worker=>M.planId==='brawl'&&M.len>=900&&worker.style==='Brawl'?
  clamp(plan.drain-Math.max(0,worker.ring+worker.safe+worker.psych-180)*.0032,.95,plan.drain):
  spotDrain(worker);
 const drain=.55*workDrain(w)*(mode==='pickup'?1.7:mode==='slow'?.3:1)*
  (1+w.fatigue/250)*(M.workingHurt?1.5:1)*paceFactor(w,'w');
 M.wSt=clamp(M.wSt-drain+(mode==='slow'?1.6:0));
 M.fSt=clamp(M.fSt-.5*workDrain(f)*paceFactor(f,'f')+(mode==='slow'?1.2:0));
 // quality of this ten seconds
 const sk=(w.ring*plan.w.ring+w.psych*plan.w.psych)*(.55+.45*M.wSt/100);
 const sf=(f.ring*plan.w.ring+f.psych*plan.w.psych)*(.55+.45*M.fSt/100);
 let q=18+(sk*.55+sf*.45)*.6+M.fit+earnedPlanQuality(M)+(M.crowd-50)*.1+(M.talk==='fire'?2:0);
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
 lift(M,dc);
 // A room cannot hold a roar: the louder it is, the faster it settles without something new.
 M.crowd=clamp(M.crowd-(M.crowd-55)*.02-Math.max(0,M.crowd-84)*.025);
 // mode countdown
 if(M.mode){M.mode.ticks--;if(M.mode.ticks<=0)M.mode=null;}
 // the injured wrestler can make things worse
 if(M.workingHurt&&M.r()<.04&&M.injury<4){M.injury++;say(M,`${w.short} winces again. That’s getting worse.`,'agent');}
 // spots
 // When the active wrestler is spent, build recovery or a lower-risk graph
 // exchange instead of repeatedly scheduling an impossible high spot.
 const spotWorker=actors(M).A;
 const spotSt=spotWorker===M.w?M.wSt:M.fSt;
 const recoveryWeight=spotSt<28?0:spotSt<42?.4:1;
 // An agreed Outlasted finish requires the eventual winner to retain
 // stamina. Extra *unscripted* spectacular spots can otherwise spend that
 // wrestler's remaining reserves independently of the legal move pool.
 // Lower only this optional opportunity, never a manually called spot,
 // already committed flight, scripted signed-sheet beat or move-cost rule.
 const signedOutlast=M.o.sheet?.finishRoute==='outlasted'&&
  M.outcome==='booked'&&['win_clean','lose_clean'].includes(M.o.finish)&&
  M.len>=600;
 const outlastWinner=signedOutlast?
  (M.o.finish==='win_clean'?M.w:M.f):null;
 const outlastLoser=signedOutlast?
  (M.o.finish==='win_clean'?M.f:M.w):null;
 const loserSt=outlastLoser===M.w?M.wSt:M.fSt;
 const winnerSt=outlastWinner===M.w?M.wSt:M.fSt;
 const lead=winnerSt-loserSt;
 const electiveWinnerSpot=signedOutlast&&spotWorker===outlastWinner&&
  ((M.planId==='spots'&&frac>=.33&&frac<.97&&
    loserSt<64&&lead<23)||
   (frac>=.76&&frac<.98&&loserSt<38&&lead>=7));
 const optionalSpotFactor=electiveWinnerSpot?
  (M.planId==='spots'?.30:.43):1;
 const spotP=plan.spotRate*SPOT_MUL[ph.id]*(mode==='pickup'?1.6:mode==='slow'?.2:1)*
  (M.offScript==='showboat'?1.5:1)*recoveryWeight*optionalSpotFactor;
 let spoke=aerialResolved||grappleResolved;
 // A requested spectacular spot waits for a physically legal setup. The
 // script never awards one merely because the manager pressed a button.
 if(M.bigSpotRequest&&!spoke){
  spoke=tryPendingBigSpot(M);
 }
 // Once both workers contest the turnbuckles for a legal named move,
 // resolve that organic exchange before an unrelated scheduled spectacle.
 // Deferred nearfalls are still available on a later tick.
 const topContest=!spoke&&Graph.readyTopContest(M);
 const preparedFlight=!spoke&&!topContest&&Graph.readyNamedAerial(M);
 const preparedRun=!spoke&&!topContest&&!preparedFlight&&Graph.readyBrawlRebound(M);
 const preparedGrip=!spoke&&!topContest&&!preparedFlight&&!preparedRun&&Graph.readyTechnicalGrip(M);
 const preparedHope=!spoke&&!topContest&&!preparedFlight&&!preparedRun&&!preparedGrip&&Graph.readyStoryHope(M);
 const earnedCover=!spoke&&!topContest&&
  !preparedFlight&&!preparedRun&&!preparedGrip&&!preparedHope&&
  M.o.stip!=='submission'&&M.nearfallAt.length&&
  frac>=M.nearfallAt[0]?Graph.earnedNearfallSource(M):null;
 // All plans must earn their scheduled pin from a genuinely landed,
 // still-live knockdown. A timer is only an opportunity, never a strike,
 // unsolicited control switch or imaginary physical relocation.
 // Submission-only stipulations preserve their non-pin escape sequence.
 if(!spoke&&!topContest&&!preparedFlight&&!preparedRun&&!preparedGrip&&!preparedHope&&
    M.nearfallAt.length&&frac>=M.nearfallAt[0]&&
    (M.o.stip==='submission'||earnedCover)){
  if(M.o.stip==='submission'){
   M.nearfallAt.shift();Graph.nearfall(M);spoke=true;
  }else if(Graph.nearfall(M,earnedCover)){
   M.nearfallAt.shift();spoke=true;
  }
 }else if(!spoke&&!topContest&&!preparedFlight&&!preparedRun&&!preparedGrip&&!preparedHope&&M.r()<spotP)spoke=Graph.special(M);
 // crowd bands
 crowdBand(M);
 // producer hints
 if(!M.hints.dead&&M.crowd<33&&frac>.3){M.hints.dead=1;say(M,`In your ear: they’re dying out here. Change something.`,'agent');}
 if(!M.hints.tired&&M.wSt<30){M.hints.tired=1;say(M,`In your ear: ${w.short} is blown up. Slow it down or take it home.`,'agent');}
 // incidents
 root.OfficeSheets?.advance(M);
 root.OfficeSheets?.DIRECTOR?.advance(M);
 structureCommentary(M);
 incidents(M,frac);
 if(M.decision)return;
 // play-by-play
 // During the last minute, a Story finish needs an actual physical
 // exchange rather than a long run of narration-only ticks. The ordinary
 // graph pool still decides what can be performed; it cannot bypass a
 // committed move, a defensive counter, positioning or the planned finish.
 const closingStory=!spoke&&M.planId==='story'&&M.len>=720&&
  M.len-M.t<=60&&M.len-M.t>=0;
 if(!spoke&&(topContest||preparedFlight||preparedRun||preparedGrip||
    preparedHope||closingStory||M.r()<.64))Graph.step(M);
 // Count the *performed* big moment, not the request or a failed setup.
 if(M.bigSpotRequest)witnessOrdinaryBigSpot(M);
 if(M.bigSpotRequest&&M.t>=M.bigSpotRequest.expires)closePendingBigSpot(M);
 // An accepted request to get back on the layout is not proof of compliance.
 // Wait for a real, legal, landed graph action by our wrestler.
 if(M.layoutReturn){
  const request=M.layoutReturn;
  const action=Graph.get(M).events?.slice(request.from).find(e=>
   e.preControl==='w'&&e.id&&Graph.A[e.id]&&!e.blocked&&!e.botched);
  if(action){
   M.offScript=null;M.comply=clamp(M.comply+15);
   say(M,`${w.short} follows through with ${Graph.A[action.id].name||'a legal exchange'}. The layout is back on track.`,'agent',{who:'runner'});
   request.status='witnessed';request.action=action.id;request.atAction=action.t;
   M.layoutReturn=null;
  }else if(M.t-request.at>=90){
   say(M,'Road agent: The instruction was heard, but there is still no in-ring evidence of a return to the layout.','agent',{who:'runner'});
   request.status='unfulfilled';M.layoutReturn=null;
  }
 }
 // Record the result of completed calls from actual stamina, crowd and graph
 // history. This observer is read-only and does not award a move or rating.
 const activePace=M.ringsideEvidence?.findLast(e=>e.status==='pending'&&
  ['slow','pickup','crowd'].includes(e.id));
 if(activePace&&M.mode?.type!==activePace.id)settlePaceEvidence(M);
 if(!spoke&&M.t-(M.vicAt??-200)>=100&&vicRoll(M,'chat')<.3)vicChat(M);
 M.crowdSum+=M.crowd;M.crowdPeak=Math.max(M.crowdPeak,M.crowd);
 // v0.3.13 The match as the office reads it afterwards: every ten seconds, the crowd, who had the
 // upper hand, which part of the match it was and how good the work was.
 (M.flow??=[]).push([M.t,Math.round(M.crowd),Math.round(M.mom),PHASES.findIndex(x=>x.id===ph.id),Math.round(q)]);
 if(M.t>=M.len){M.stage='finish';}
}
function onPhase(M){
 const ph=M.phase,w=M.w;
 if(M.leash==='script'&&ph.id!=='open'){
  M.scriptChecks++;
  if(M.r()*100<M.comply){M.scriptHits++;M.offScript=null;}
  else{
   M.offScript=w.ego>=65?'showboat':'audible';
   // Keep real layout disagreements in state, but make the agent report
   // transitions or a genuinely new reminder, not 20 identical alerts.
   if(M.lastOffScriptAnnounced!==M.offScript||M.t-(M.lastOffScriptAt??-9999)>=480){
    say(M,M.offScript==='showboat'?`${w.short} has gone off the layout, playing to the crowd instead of the plan.`:`${w.short} is calling audibles. This wasn’t the plan.`,'agent');
    M.lastOffScriptAnnounced=M.offScript;M.lastOffScriptAt=M.t;
   }
  }
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
 const yours=A===M.w,side=yours?'w':'f',st=yours?M.wSt:M.fSt;
 const g=Graph.get(M);
 if(st<28){
  M.lastExhaustedSpot??={};
  if(M.t-(M.lastExhaustedSpot[side]??-9999)>=160){
   say(M,`${A.short} cannot get their footing for the spectacular attack. ${Df.short} has room to recover.`,'agent',{who:'pbp'});
   M.lastExhaustedSpot[side]=M.t;
  }
  if(!M.mode||M.mode.type!=='slow')M.mode={type:'slow',ticks:3};
  lift(M,-(big?3:1));mark(M,'tired',yours);M.bonus-=big?6:2;
  return false;
 }
 const mapped=(D.SPOTS[A.style]||D.SPOTS.Story).map(move=>({
  move,id:Graph.SCRIPTED_SPOT_IDS[move]
 }));
 // Safe is a conservative match layout, not an override of the
 // normal move legality system. Every pre-authored scripted spectacle
 // is risk-tagged; exclude floor impacts, superplexes and flipping dives.
 // The plain diving elbow is permitted only to a sufficiently skilled
 // and safety-trained worker. Never add RNG or alter other plans.
 const safeScripted=M.planId==='safe';
 const candidates=mapped.filter(x=>
  (!safeScripted||(x.id==='ar_elbow_point'&&A.ring>=78&&
    A.safe>=75&&st>=38))&&Graph.canScriptedSpot(M,x.id,side));
 if(!candidates.length){
  if(forced)say(M,safeScripted?'Road agent: The Safe layout does not permit that dangerous high spot. Keep the legal exchange going.':`${A.short} cannot find a legal setup for the requested big move right now.`,'agent',{who:'pbp'});
  return false;
 }
 const chosen=rnd(M,candidates);
 if(!Graph.prepareScriptedSpot(M,chosen.id,side))return false;
 const outside=Graph.A[chosen.id].zone==='outside';
 const botchP=(.03+(100-A.safe)*.0018+(100-st)*.0015)*M.riskMul*(big?1.5:1)*(A.ring>=80?.8:1);
 const attempt={t:M.t,id:chosen.id,name:chosen.move,side,big:!!big,outcome:'pending'};
 (g.scriptedSpotAttempts??=[]).push(attempt);
 if(g.scriptedSpotAttempts.length>220)g.scriptedSpotAttempts.shift();
 M.spots++;
 if(big||M.r()<.35)say(M,big?`${A.short} commits to the high-risk move!`:`${A.short} goes for it!`,'play',{pause:1});
 if(M.r()<botchP){
  attempt.outcome='botched';M.botches++;M.bonus-=big?30:20;
  lift(M,-(big?9:6));mark(M,'botch',yours);
  say(M,`${chosen.move.charAt(0).toUpperCase()+chosen.move.slice(1)}… and it’s gone wrong. That looked nasty.`,'bad',{big:true});
  const hurtYours=yours?M.r()<.55:M.r()<.45;
  const injP=(.1+(100-A.safe)/350)*(big?1.4:1);
  if(M.r()<injP){
   if(hurtYours&&!M.injury){M.injury=1+(M.r()<.4?1:0)+(big&&M.r()<.4?1:0);M.injuryPart=rnd(M,PARTS);decide(M,'injury');}
   else if(!hurtYours&&!M.foeHurt){M.foeHurt=true;say(M,`${M.f.short} is holding the ${rnd(M,PARTS)}. The referee leans in.`,'agent',{who:'pbp'});M.fSt=clamp(M.fSt-25);}
  }
  // A botch is an attempted manoeuvre, not a false landed action.
  Psy.spotAfter(M,A,Df,outside,true);Graph.resetPhysical(M,outside?'floor':'ring');g.node=null;
 }else{
  // The executed graph action owns its own named narration, effects,
  // movement and event record; do not count it as a second scripted spot.
  Graph.apply(M,chosen.id,{scriptedSpot:true,big});
  attempt.outcome='landed';M.spotHits++;
  const pop=(big?7:3)+M.r()*(big?7:4);
  lift(M,pop*M.plan.crowd);mark(M,big?'big':'spot',yours);M.bonus+=big?18:10;
  if(big)say(M,`${Df.short} is rocked by the impact. The front rows erupt!`,'crowd',{big:true});
 }
 if(yours)M.wSt=clamp(M.wSt-(big?7:4));
 else M.fSt=clamp(M.fSt-(big?7:4));
 return true;
}
function dive(M){
 // A special balcony stunt is not ordinary graph wrestling. It cannot
 // override a Safe layout, even when an old match flag requests one.
 if(M.planId==='safe')return;
 say(M,`${M.w.short} drives ${M.f.short} through the ropes. They spill towards the aisle, well away from the ring.`,'play',{pause:1});
 say(M,`${M.w.short} is climbing… not the turnbuckle. The balcony.`,'play',{pause:2,big:true});
 const botchP=(.12+(100-M.w.safe)*.004)*M.riskMul;
 M.spots++;
 if(M.r()<botchP){M.botches++;M.bonus-=35;lift(M,-4);mark(M,'botch',1);say(M,`${M.w.short} jumps… and comes up short. The front row scatters.`,'bad',{big:true});
  if(!M.injury&&M.r()<.55){M.injury=2+(M.r()<.4?1:0);M.injuryPart=rnd(M,PARTS);decide(M,'injury');}}
 else{M.spotHits++;M.bonus+=30;lift(M,16);mark(M,'big',1);M.adj.heat+=4;say(M,`${M.w.short} FLIES off the balcony and wipes out ${M.f.short}! Phones are out everywhere!`,'crowd',{big:true});}
 Psy.get(M).position='outside';Psy.get(M).down=null;Graph.resetPhysical(M,'floor');
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
  lift(M,pop);
  say(M,`ROPE BREAK! ${Df.short} SURVIVES ${THE(A.finisher)}!`,'crowd',{big:true});
 }else{
  const move=late?`${the(A.finisher)}`:rnd(M,D.SPOTS[A.style]||D.SPOTS.Story).replace(/^a /,'a ');
  say(M,`${A.short} hits ${move}!`,'play',{big:true,pause:1});
  say(M,'Cover!','count',{pause:1});
  say(M,'ONE!','count',{pause:1,big:true});
  say(M,'TWO!','count',{pause:2,big:true});
  lift(M,pop);
  say(M,late?rnd(M,[`NO! ${Df.short} KICKED OUT OF ${THE(A.finisher)}!`,`HOW? ${Df.short} survived ${THE(A.finisher)}!`,`A SHOULDER UP! ${Df.short} escaped the finisher!`]):rnd(M,[`Kick out! ${Df.short} survives!`,`Two and a half! ${Df.short} kicks free!`,`The referee's hand almost hit three — ${Df.short} is still in this!`,`A last-second escape from ${Df.short}!`]),'crowd',{big:true});
 }
 M.nearfalls++;M.bonus+=late?8:4;
}

/* ---- ringside calls ---- */
// Preflight mirrors the *existing* forced-spot legal candidate pool.
 // No RNG, no physical relocation, and no new moves are introduced here.
// Technical and conservative workers have a valid big moment too: a real,
 // suitably impactful move from the ordinary, connected graph. A safe match
 // cannot use risky stunts merely because the manager demands excitement.
function regularBigMoment(M,id){
 const n=Graph.A[id];if(!n||n.reverse||n.counterOf||n.blockOf||
  n.nearfall||n.risk||M.t/Math.max(1,M.len)<.35)return false;
 const families=['suplex','power','neck','running','strike','ground','submission','chain'];
 if(!families.includes(n.family))return false;
 if(n.family==='submission')return (n.cost||0)>=1.8&&(n.crowd||0)>=3;
 if(n.family==='chain')return (n.cost||0)>=1.8&&(n.crowd||0)>=3;
 return (n.cost||0)>=2.2&&(n.crowd||0)>=2;
}
function witnessOrdinaryBigSpot(M){
 const pending=M.bigSpotRequest;if(!pending)return;
 const event=(M.graph?.events||[]).findLast(e=>
  e.t>pending.at&&e.t/Math.max(1,M.len)>=.35&&
  e.preControl==='w'&&regularBigMoment(M,e.id)&&
  !e.botched&&!e.blocked);
 if(!event)return;
 const evidence=M.ringsideEvidence?.[pending.index];
 if(evidence){
  evidence.status='witnessed';evidence.atAction=event.t;
  evidence.action=event.id;evidence.kind='ordinary-graph';
 }
 M.bigSpotRequest=null;
 say(M,`Road agent: ${M.w.short} found a genuine big moment with ${Graph.A[event.id].name||'a legal attack'}.`,'agent',{who:'runner'});
}
function availableBigSpot(M){
 if(M.wSt<28)return false;
 const safe=M.planId==='safe';
 return (D.SPOTS[M.w.style]||D.SPOTS.Story).some(move=>{
  const id=Graph.SCRIPTED_SPOT_IDS[move];
  return (!safe||(id==='ar_elbow_point'&&M.w.ring>=78&&
   M.w.safe>=75&&M.wSt>=38))&&Graph.canScriptedSpot(M,id,'w');
 });
}
function settlePaceEvidence(M){
 const e=M.ringsideEvidence?.findLast(e=>e.status==='pending'&&
  ['slow','pickup','crowd'].includes(e.id));
 if(!e)return;
 const events=(M.graph?.events||[]).filter(x=>x.t>e.at&&Graph.A[x.id]);
 const offence=events.find(x=>x.preControl==='w'&&
  !Graph.A[x.id].reverse&&!Graph.A[x.id].blockOf&&
  Graph.A[x.id].family!=='rest'&&(Graph.A[x.id].cost||0)>0);
 const realRest=events.find(x=>x.preControl==='w'&&
  (x.id==='catch_breath'||Graph.A[x.id].family==='rest'));
 e.staminaDelta=Math.round(M.wSt-e.staminaStart);
 e.crowdDelta=Math.round(M.crowd-e.crowdStart);
 e.atEnd=M.t;
 if(e.id==='slow'){
  e.status='applied';if(realRest)e.action=realRest.id;
  if(M.stage==='live')say(M,realRest?
   `Road agent: A genuine breather helped ${M.w.short} manage the slower stretch.`:
   e.staminaDelta>0?`Road agent: The reduced tempo recovered ${M.w.short}'s stamina; no rest hold was performed.`:
   'Road agent: The tempo dropped, but there was no recorded rest hold or net stamina gain.','agent',{who:'runner'});
 }else if(e.id==='pickup'){
  e.status=offence?'witnessed':'no-offence';
  if(offence){e.action=offence.id;e.atAction=offence.t;}
  if(M.stage==='live')say(M,offence?
   `Road agent: ${M.w.short} answered the faster-pace call with performed offence.`:
   'Road agent: The pace was called, but no qualifying attack was performed during that stretch.','agent',{who:'runner'});
 }else{
  e.status=e.crowdDelta>0?'responded':'flat';
  if(M.stage==='live')say(M,e.crowdDelta>0?
   'The crowd is louder after that appeal, though the wrestling slowed.':
   'The crowd has not grown any louder after the appeal.','crowd');
 }
}
function closePendingBigSpot(M){
 const pending=M.bigSpotRequest;if(!pending)return;
 const evidence=M.ringsideEvidence?.[pending.index];
 if(evidence){evidence.status='unavailable';evidence.reason='No physically legal opening before the finish';}
 M.calls=Math.min(3,M.calls+1); // Reserve only: no attempt means no spent call.
 const idx=M.callsUsed.lastIndexOf('big');if(idx>=0)M.callsUsed.splice(idx,1);
 M.bigSpotRequest=null;
 if(M.stage==='live')say(M,'Road agent: The high-spot opening never arrived. Your ringside call is returned.','agent',{who:'runner'});
}
function tryPendingBigSpot(M){
 const pending=M.bigSpotRequest;
 if(!pending||M.stage!=='live'||!availableBigSpot(M))return false;
 const before=Graph.get(M).events.length;
 if(!spot(M,true,true))return false; // setup must still pass actual graph legality
 const landed=Graph.get(M).events.slice(before).some(e=>e.scriptedSpot===true);
 const evidence=M.ringsideEvidence?.[pending.index];
 if(evidence){evidence.status=landed?'witnessed':'botched';evidence.atAction=M.t;}
 M.bigSpotRequest=null;
 return true;
}
const CALLS={
 slow:{name:'Slow it down',hint:'Ease the pace to recover energy; a rest hold is not guaranteed.'},
 pickup:{name:'Pick it up',hint:'Demand a faster spell; whether they find offence is tracked.'},
 big:{name:'Hit the big spot',hint:'Queue a major move from their own repertoire. A real attempt can still fail; unfulfilled calls are returned.'},
 crowd:{name:'Work the crowd',hint:'Appeal to the crowd; their actual response is tracked.'},
 home:{name:'Take it home',hint:'Request a shortened finish. Missed structure objectives are reported.'},
 sheet:{name:'Back to the layout',hint:'Pull an improvising worker back to the plan.'}
};
function canCall(M,id){
 if(M.done||M.stage!=='live'||M.decision||M.calls<=0)return false;
 if(id==='sheet')return !!M.offScript;
 if(id==='big')return !M.bigSpotRequest&&M.len-M.t>45;
 if(id==='home')return M.len-M.t>45;
 return true;
}
function call(M,id){
 if(!canCall(M,id))return false;
 M.calls--;M.callsUsed.push(id);const w=M.w;mark(M,'call:'+id,1);
 say(M,`${M.o.identity?.manager||'You'} ${M.o.identity?.manager?'calls from ringside':'shout from ringside'}: “${CALLS[id].name}.”`,'you');
 const listen=M.listen+(id==='home'?20:0)+(id==='sheet'&&M.leash==='script'?10:0);
 if(M.r()*100>listen){M.ignored++;say(M,rnd(M,[`${w.short} waves you away.`,`${w.short} doesn’t even look over.`,`${w.short} hears you. Does the opposite.`]),'bad');if(w.ego>=70)M.adj.morale-=1;return true}
 root.OfficeSheets?.intervention(M,id);
 if(['slow','pickup','crowd','home'].includes(id))settlePaceEvidence(M);
 if(id==='slow'){
  M.mode={type:'slow',ticks:6};
  (M.ringsideEvidence??=[]).push({id,at:M.t,status:'pending',
   staminaStart:M.wSt,crowdStart:M.crowd});
  say(M,`${w.short} agrees to ease the tempo. Whether a real rest hold occurs is up to the wrestling.`,'play',{who:'runner'});
 }
 if(id==='pickup'){
  M.mode={type:'pickup',ticks:6};
  (M.ringsideEvidence??=[]).push({id,at:M.t,status:'pending',
   staminaStart:M.wSt,crowdStart:M.crowd});
  say(M,`${w.short} hears the call to speed up. The next exchanges will show whether it pays off.`,'play',{who:'runner'});
 }
 if(id==='crowd'){
  M.mode={type:'crowd',ticks:5};
  (M.ringsideEvidence??=[]).push({id,at:M.t,status:'pending',
   staminaStart:M.wSt,crowdStart:M.crowd});
  say(M,`${w.short} turns to the crowd, arms out wide. Will they respond?`,'crowd');
 }
 if(id==='big'){
  const evidence={id,at:M.t,status:'pending'};
  const list=M.ringsideEvidence??(M.ringsideEvidence=[]);
  const index=list.push(evidence)-1;
  M.bigSpotRequest={index,at:M.t,expires:Math.max(M.t,M.len-40)};
  if(!tryPendingBigSpot(M)){
   if(M.wSt<28)M.mode={type:'slow',ticks:3};
   say(M,M.planId==='safe'?
    `Safe layout: ${w.short} will look for a legal high-impact move, not a dangerous stunt. The call returns if no opening appears.`:
    `${w.short} accepts the call and looks for a big moment from the legal match repertoire. It is queued, not guaranteed.`,'agent',{who:'runner'});
  }
 }
 if(id==='sheet'){
  const request={id,at:M.t,from:Graph.get(M).events.length,status:'pending'};
  (M.ringsideEvidence??=[]).push(request);
  M.layoutReturn=request;
  say(M,`${w.short} acknowledges the call. We will see whether the next exchanges follow the layout.`,'agent',{who:'runner'});
 }
 if(id==='home'){const originalLen=M.len;const frac=M.t/M.len;if(frac<.6){M.shortened=true;M.len=M.t+70;}else M.len=Math.min(M.len,M.t+40);
  (M.ringsideEvidence??=[]).push({id,at:M.t,status:'applied',oldLength:originalLen,newLength:M.len});
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
 say(M,`${M.o.identity?.manager||'Your'} call: “${opt.label}”`,'you');
 if(d.id==='injury'){
  if(choice==='home'){if(M.len-M.t>60)M.shortened=true;M.len=Math.min(M.len,M.t+50);M.nearfallAt=[];say(M,`${w.short} nods through gritted teeth. Straight to the finish.`,'play',{who:'runner'})}
  if(choice==='work'){M.workingHurt=true;lift(M,5);M.adj.heat+=3;say(M,`${w.short} waves off the referee. The crowd start clapping. Brave, or daft.`,'crowd')}
  if(choice==='stop'){M.outcome='nc';M.adj.purseMul=.5;M.adj.trust-=6;M.adj.morale+=5;M.injury=Math.max(1,M.injury-1);M.stage='finish';}
 }
 if(d.id==='stiff'){
  if(choice==='protect'){M.stiff='protect';M.mode={type:'slow',ticks:3};M.wSt=clamp(M.wSt-8);say(M,`${w.short} covers up and rides out the storm.`)}
  if(choice==='fire'){M.stiff='fire';lift(M,9);M.bonus+=10;M.adj.trust-=4;M.adj.morale+=4;say(M,`${w.short} fires back for real! This is a fight now!`,'crowd',{big:true});
   if(M.r()<.25){if(M.r()<.5&&!M.injury){M.injury=1;M.injuryPart='jaw';say(M,`${w.short} took one flush on the jaw. Wobbly.`,'bad')}else{M.foeHurt=true;say(M,`${f.short} is bleeding from the nose. That was not planned.`,'bad')}}}
  if(choice==='ref'){M.stiff='ref';lift(M,-4);say(M,`The referee has a word with ${f.short}. Things settle down.`)}
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
/* ---- v0.3.22 the referee: cheap shots can be seen, warned and, for your wrestler, end the match ---- */
function dqHash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
function noDQ(M){return ['nodq','anywhere'].includes(M.stip||M.o.stip)||['win_dq','lose_dq'].includes(M.o.finish)||M.outcome!=='booked';}
function referee(M,side){
 if(noDQ(M)||M.stage!=='live')return;
 const ref=M.ref??={w:0,f:0};
 // The referee does not see everything; the television promotions' officials see more. Hashed, so the
 // match's own random numbers are untouched.
 // After a warning the referee is watching that wrestler closely.
 const p=(side==='w'&&ref.w?.5:.2)+(['traditional','cold'].includes(M.p?.personality)?.08:0);
 if(dqHash((M.o.seed||0)+'|ref|'+side+'|'+M.t)>=p)return;
 if(side==='f'){if(!ref.f){ref.f=1;say(M,`The referee saw that one. ${M.f.short} gets a warning.`,'story',{who:'colour'});}return;}
 // A professional heeds the first warning; anybody else may not.
 if(!ref.w){ref.w=1;say(M,`The referee saw the cheap shot and warns ${M.w.short}. Next time, it is over.`,'bad',{big:true,pause:1,who:'colour'});mark(M,'warning',1);return;}
 if(M.w.pro>=78){if(ref.w===1){ref.w=2;say(M,`${M.w.short} nearly takes another liberty, then remembers the warning.`,'story',{who:'colour'});}return;}
 // Unscripted disobedience alone isn't a manager instruction to sacrifice
 // the booked finish. Only an explicit free leash / fired-up instruction can
 // turn repeated cheap shots into a referee DQ; an off-layout scripted worker
 // receives the last warning and pulls back. Caught run-ins are handled apart.
 if(!(M.leash==='free'||M.talk==='fire')){if(ref.w===1){ref.w=2;say(M,`A final warning for ${M.w.short}. The referee means it.`,'story',{who:'colour'});}return;}
 M.dqCall={why:'cheap',side:'w',at:M.t};
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
// v0.3.22 Booked disqualifications. Who wins is still the contract; the referee simply sees it this time.
FINISH_ROUTES.win_dq=[
 {id:'dq_chair_f',when:()=>true,run(M,w,f,step){
  say(M,`${f.short} is losing it. They slide out, pull a chair from under the ring and walk back in with it.`,'play',{...step(),pause:1});
  say(M,`The referee tries to take it. ${f.short} swings anyway, and ${w.short} is down.`,'play',{...step(),big:true,pause:1});
  say(M,'The bell! The referee has seen enough.','bell',{...step(),pause:1});
  say(M,`${f.name} is disqualified. ${w.name} wins.`,'bell',{...step(),big:true});}},
 {id:'dq_ref_shove_f',when:x=>x.heat>=25,run(M,w,f,step){
  say(M,`${w.short} has ${f.short} in trouble. ${f.short} shoves the referee out of the way to get at them.`,'play',{...step(),big:true,pause:1});
  say(M,'You cannot put hands on the official. The bell goes immediately.','bell',{...step(),pause:1});
  say(M,`${w.name} wins by disqualification. ${f.short} is still arguing.`,'bell',{...step(),big:true});}},
 {id:'dq_low_blow_f',when:(x,M,w,f)=>['Brawl','Story'].includes(f.style),run(M,w,f,step){
  say(M,`${f.short} sees the finish coming and goes low, right in front of the referee.`,'play',{...step(),big:true,pause:1});
  say(M,'The referee does not even have to think about it.','bell',{...step(),pause:1});
  say(M,`${f.name} is disqualified. ${w.short} wins, doubled over.`,'bell',{...step(),big:true});}}
];
FINISH_ROUTES.lose_dq=[
 {id:'dq_chair_w',when:()=>true,run(M,w,f,step){
  say(M,`${w.short} has had enough of ${f.short}. Out under the ropes, back with a chair.`,'play',{...step(),pause:1});
  say(M,`The referee is right there. ${w.short} swings it anyway.`,'play',{...step(),big:true,pause:1});
  say(M,'The bell! The referee had no choice.','bell',{...step(),pause:1});
  say(M,`${w.name} is disqualified. ${f.short} wins, but ${f.short} is the one on the floor.`,'bell',{...step(),big:true});}},
 {id:'dq_choke_w',when:x=>x.heat>=25||x.dmgW>=3,run(M,w,f,step){
  say(M,`${w.short} has ${f.short} choked over the bottom rope. The referee counts. One. Two. Three. Four.`,'play',{...step(),big:true,pause:1});
  say(M,`${w.short} will not let go at five.`,'bell',{...step(),pause:1});
  say(M,`${w.name} is disqualified. ${f.short} wins, if you can call it that.`,'bell',{...step(),big:true});}},
 {id:'dq_ref_shove_w',when:(x,M,w)=>w.ego>=65,run(M,w,f,step){
  say(M,`The referee steps in to break it up and ${w.short} shoves the official across the ring.`,'play',{...step(),big:true,pause:1});
  say(M,'The bell goes at once.','bell',{...step(),pause:1});
  say(M,`${w.name} is disqualified. ${f.short} wins.`,'bell',{...step(),big:true});}}
];
// Eighteen contracted routes plus the no-contest and the off-script double-cross make twenty; v0.3.22 adds
// six booked disqualification routes, twenty-six in all.
const FINISH_ROUTE_COUNT=Object.values(FINISH_ROUTES).reduce((n,l)=>n+l.length,0)+2;
function pickFinishRoute(M){
 const list=FINISH_ROUTES[M.o.finish]||FINISH_ROUTES.win_clean,x=finishContext(M);
 const agreed=M.o.sheet?.finishRoute&&list.find(r=>r.id===M.o.sheet.finishRoute);
 // The agreed route is preferred only if its real in-ring preconditions hold.
 // Otherwise choose another legal route to the SAME contracted result.
 if(agreed&&agreed.when(x,M,M.w,M.f)){M.r();return agreed;}
 if(agreed)M.finishRouteFallbackFrom=agreed.id;
 const ok=list.filter(r=>r.when(x,M,M.w,M.f));
 // Specific routes earn more weight than the default, so the match so far shapes the ending.
 const weights=ok.map((r,i)=>i===0&&ok.length>1?.6:1.2);
 let n=M.r()*weights.reduce((a,b)=>a+b,0);
 for(let i=0;i<ok.length;i++){n-=weights[i];if(n<0)return ok[i];}
 return ok[ok.length-1];
}
/* ---- the finish ---- */
function finish(M){
 // Snapshot the real closing tape BEFORE the scripted finish extends M.t.
 // No random draw, finish-route change or synthetic move is introduced.
 M.finishingRunway=Graph.closingRunway(M);
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
 if(Psy.get(M).position==='outside'){say(M,noCountout(M)?`${w.short} and ${f.short} bring the finish back inside by choice.`:`${w.short} and ${f.short} scramble back inside before the referee reaches ten.`,'play',{...step()});Psy.get(M).position='standing';}
 if(Psy.get(M).position==='mat'){say(M,'They fight back to their feet. Both know the next exchange can end it.','play',{...step()});Psy.get(M).position='standing';}
 Graph.resetPhysical(M);
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
 }else if(M.outcome==='dq'){
  const k=M.dqCall||{why:'cheap'};M.finishRoute='dq_'+(k.why==='runin'?'runin':'cheap');
  if(M.graph?.outcome)M.graph.outcome.route=M.finishRoute;
  if(k.why==='runin')say(M,`The referee has seen ${k.who||'somebody'} come over the barrier, and that is that.`,'bad',{...step(),big:true,pause:1});
  else say(M,`${w.short} goes for one more cheap shot, and this time the referee is looking straight at it.`,'bad',{...step(),big:true,pause:1});
  say(M,'The referee calls for the bell!','bell',{...step(),pause:1});
  say(M,`${w.name} is disqualified. ${f.short} wins.`,'bell',{...step(),big:true});
  say(M,`That was not the finish anybody agreed. ${M.p.name} will want a word.`,'agent',{...step(2),who:'runner'});
  lift(M,-8);
 }else{
  // v3.3: twenty finish routes. The contract chooses who wins; the match so far chooses how.
  const route=pickFinishRoute(M);M.finishRoute=route.id;
  if(M.sheet)M.sheet.performedFinishRoute=route.id;
  if(M.finishRouteFallbackFrom){
   const beat=M.sheet?.nodes?.find(b=>b.id==='finish');
   if(beat&&beat.status==='achieved'){
    beat.status='adapted';
    beat.why='The agreed '+M.finishRouteFallbackFrom+' finish was not physically available; '+route.id+' delivered the contracted result instead.';
   }
   say(M,'Road agent: the agreed finish was not there. They call an audible and keep the contracted result.','agent',{...step(),who:'runner'});
  }
  if(M.graph?.outcome)M.graph.outcome.route=route.id;
  // Only credit the bridge when the chosen route is compatible with
  // the already witnessed last exchanges. Never claim the scripted finisher
  // itself was a previously executed physical-graph landing.
  if(M.finishingRunway&&['finisher','top_rope','limb_finish','strike_knockout','outlasted'].includes(route.id)){
   const evidence=M.finishingRunway,who=evidence.winner==='w'?w:f;
   const move=id=>Graph.A[id]?.name||id.replaceAll('_',' ');
   const story=evidence.status==='witnessed'?
    who.short+' genuinely countered the pressure, then worked through the '+
     move(evidence.setup.id)+' and connected with the '+move(evidence.impact.id)+'.':
    who.short+' connected the '+move(evidence.setup.id)+' with the '+
     move(evidence.impact.id)+'.';
   say(M,story+' Those real exchanges have brought the agreed finish into view.',
    'story',{...step(3),who:'colour',textureId:'causal-finish-runway'});
   evidence.spoken=true;
  }
  route.run(M,w,f,step);
 }
 M.t=at;M.stage='over';
 // The bell can interrupt an accepted order. Do not turn an unperformed
 // request into a successful call or invent a move at the result.
 if(M.bigSpotRequest)closePendingBigSpot(M);
 settlePaceEvidence(M);
 M.final=summary(M);
 if(M.final.structureAssessment){
  const a=M.final.structureAssessment,b=a.structuralCoherence,c=a.planAdherence;
  say(M,(STRUCTURE_LABELS[a.id]||'The planned structure')+': '+b.witnessed+' of '+b.total+' dramatic objectives witnessed; '+c.witnessedCalls+' of '+c.namedCalls+' named calls evidenced. The rating is earned by the wrestling itself.','story',{who:'colour',textureId:'structure-final'});
 }
 if(M.outcome!=='nc'&&M.outcome!=='double')vic(M,M.final.stars>=4?'great':M.final.stars>=2.5?'good':'poor',1,{...step(3)});
 say(M,`Final rating: ${starText(M.final.stars)}`,'rating',{...step(2),big:true});
}
function summary(M){
 root.OfficeSheets?.closeVows?.(M);
 root.OfficeSheets?.DIRECTOR?.finalize(M);
 const s=stars(M,true);
 // Final structure evidence is already settled above; a shortened match may
 // legitimately miss an agreed objective. Report its identity without credit.
 const ringsideEvidence=(M.ringsideEvidence||[]).map(e=>e.id==='home'?
  {...e,missedObjectives:(M.structureDirector?.objectives||[]).filter(o=>o.status==='missed').map(o=>o.id)}:{...e});
 return {stars:s,crowd:Math.round(M.crowd),crowdPeak:Math.round(M.crowdPeak),crowdStart:M.crowdStart,botches:M.botches,spots:M.spots,spotHits:M.spotHits,nearfalls:M.nearfalls,
  script:M.scriptChecks?M.scriptHits/M.scriptChecks:null,callsUsed:M.callsUsed.slice(),ignored:M.ignored,...(ringsideEvidence.length?{ringsideEvidence}:{}),injury:M.injury,injuryPart:M.injuryPart,
  outcome:M.outcome,finishRoute:M.finishRoute||null,crowdTrace:[...(M.crowdTrace||[]),[M.t,Math.round(M.crowd)]],flow:(M.flow||[]).slice(),marks:(M.marks||[]).slice(),starParts:starParts(M).map(([k,label,v])=>[k,label,Math.round(v*100)/100]),len:M.len,rehearsed:!!M.o.sheet?.rehearsed,roomNote:root.OfficeRoom?.verify(M)||null,roomBonus:M.o.sheet?.bonus||0,roomFx:M.o.sheet?.fx||null,roomThreads:M.o.sheet?.threads||null,roomThreadUsed:M.o.sheet?.threadUsed||null,roomRepStake:M.o.sheet?.repStake||0,refused:M.refused,shortened:M.shortened,timeDefied:!!M.timeDefied,stiff:M.stiff,foeHurt:M.foeHurt,workingHurt:M.workingHurt,
  resent:M.resent,promo:M.o.promo||null,
  promoSignals:{
   workerCounter:!!M.graph?.promoCounterPaid,
   workerFinisherSetup:!!M.graph?.events?.some(e=>e.id==='finish_tease'&&e.preControl==='w'),
   workerDirty:!!M.graph?.events?.some(e=>e.id==='cheap_shot'&&e.preControl==='w'),
   opponentDirty:!!M.graph?.events?.some(e=>e.id==='cheap_shot'&&e.preControl==='f')
  },
  evidence:evidenceOf(M),nearfallDrama:Graph.nearfallDrama(M),roomNegotiation:M.o.sheet?.negotiation||null,
  ...(root.OfficeSheets?.DIRECTOR?.active(M)?{structure:root.OfficeSheets.DIRECTOR.report(M),structureAssessment:structureAssessment(M),
   ...(Graph.motifSummary(M)?{matchMotif:Graph.motifSummary(M)}:{}),
   ...(Graph.sellingReport(M)?{matchSelling:Graph.sellingReport(M)}:{}),
   ...(M.finishingRunway?{finishingRunway:{...M.finishingRunway}}:{})}:{}),
  psychology:{archetype:M.planId,construction:constructionOf(M),controlChanges:Psy.get(M).changes,target:Psy.get(M).target,targetingBeats:Psy.get(M).focusHits,hopeSpots:Psy.get(M).hopeSpots,graph:{nodes:M.graph?.steps||0,arcs:M.graph?.history?.slice()||[],edges:M.graph?.transitions||0,damage:{...(M.graph?.damage||{w:0,f:0})},nearfallCount:M.graph?.nearfallCount||0,pattern:M.graph?.pattern||M.planId,texture:M.graph?.texture||'classic',restBeats:M.graph?.rests||0,exertion:Math.round(M.graph?.exertion||0),outcome:M.graph?.outcome||null,actions:M.graph?.events?.slice(-40).map(e=>e.id)||[]}},preparation:{note:Object.keys(M.prep).some(k=>M.prep[k]>=1.5)?`${M.w.short}'s preparation helped in the match: ${Object.entries(M.prep).filter(([,v])=>v>=1.5).map(([k])=>k).join(', ')}.`:null},adj:{...M.adj},minutes:Math.round(M.t/60),plan:M.planId,leash:M.leash,talk:M.talk,stamina:Math.round(M.wSt)};
}
// v0.3.12 What happened, as structured facts a rivalry can cite later: who reversed whom and which kind
// of attack, who cheated, who was spent at the bell, who was hurt, and what became of each agreed beat.
// Read-only: it draws no random numbers and changes nothing about the match.
function evidenceOf(M){
 const ev=M.graph?.events||[],len=Math.max(1,M.len||1);
 const out={len:Math.round(len),counters:{w:0,f:0},late:{w:0,f:0},families:{w:[],f:[]},dirty:{w:false,f:false},
  stamina:{w:Math.round(M.wSt),f:Math.round(M.fSt)},injured:{w:M.injury?(M.injuryPart||'body'):null,f:!!M.foeHurt},
  damage:{w:M.graph?.damage?.w||0,f:M.graph?.damage?.f||0},route:M.finishRoute||null,beats:null};
 for(const e of ev){
  const n=Graph.A[e.id];if(!n)continue;
  if(n.reverse&&e.control&&e.preControl&&e.control!==e.preControl){
   const by=e.control==='w'?'w':'f';out.counters[by]++;if(e.t/len>=.58)out.late[by]++;
   if(n.counterOf&&n.family&&!out.families[by].includes(n.family))out.families[by].push(n.family);
  }
  if(e.id==='cheap_shot'&&(e.preControl==='w'||e.preControl==='f'))out.dirty[e.preControl]=true;
 }
 const s=M.sheet?.signed?M.sheet:null;
 if(s)out.beats=s.nodes.map(b=>({id:b.id,status:b.status,expected:b.actions?.[0]||null,actual:b.actual||null,negotiated:!!b.negotiated}));
 return out;
}
function starText(s){const whole=Math.floor(s),frac=s-whole;return '★'.repeat(whole)+(frac===.25?'¼':frac===.5?'½':frac===.75?'¾':'')+(s===0?'DUD':'');}
function liveStars(M){return stars(M,false)}
function phaseName(M){return M.stage==='entrance'?'Entrances':M.stage==='live'?M.phase?.name||'Feeling out':M.stage==='finish'?'The finish':'Full time'}

root.OfficeMatch={create,next,lift,call,canCall,resolve,CALLS,FINISH_ROUTES,FINISH_ROUTE_COUNT,liveStars,starText,fmt,phaseName,PHASES,_stars:stars,_starParts:starParts,_construction:constructionOf,_earnedPlanQuality:earnedPlanQuality,GRAPH:Graph,scout:Graph.scout,structureReport:M=>root.OfficeSheets?.DIRECTOR?.report(M)||null,structureAssessment,note:(M,line,who)=>say(M,line,'story',who?{who}:{}),restore(M){M.r=mulberry(M.rState??M.o.seed);
 if(root.OfficeSheets?.DIRECTOR?.active(M)&&!M.structureSpoken){
  M.structureSpoken=Object.fromEntries(M.structureDirector.objectives.filter(o=>o.status!=='pending').map(o=>[o.id,o.status]));
 }
 return M}};
})(typeof window!=='undefined'?window:globalThis);
