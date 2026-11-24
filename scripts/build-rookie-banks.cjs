'use strict';
// Deterministic bank generation for academy rookies. Each rookie's 32 lines are composed from phrase
// sets keyed by their identity fields, so the same rookie always gets the same bank. Generated banks are
// used only when no authored bank exists for that id. Output has the same shape as an editorial pack.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const repo=path.resolve(__dirname,'..'),js=path.join(repo,'assets/js');

const hash=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
// FNV low bits are weak, so mix before taking a modulus.
const mix=h=>{h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return h>>>0;};
const pick=(list,id,key,slot)=>list[mix(hash(id+'|'+slot+'|'+key))%list.length];

// Phrase sets: eight phrasings per identity value. Every line stays inside the rookie's boundary.
const OPEN={
 'Quick and enthusiastic':['Oh, this is my moment!','Right, I am so keen!','Let us go, go, go!','I cannot wait to get started!','Yes! This is the one!','I am buzzing, honestly!','Quick, quick, let us crack on!','I have been bouncing all week!'],
 'Measured and methodical':['First, I want to be sure of the order.','One step, then the next, then the rest.','Let me take the plan in stages.','I like to check each part before I move.','Start with the facts, then the moves.','Two things matter here, and I will name both.','I would rather be slow and right.','The order matters to me, so let me set it out.'],
 'Reserved until challenged':['Maybe. Maybe not.','I am not one for speeches.','Give me a minute before I answer that.','I will hold my tongue for now.','Hm. I will think about that.','You have not earned a full answer yet.','I keep my plans to myself until they work.','Let me see you do it first.'],
 'Dry and direct':['Facts only, nothing dressed up.','Here is the list. There are two items.','Your question has a short answer, and it is no.','Ask me again after the bell.','Three words will do: I am ready.','Nothing clever here. Just the plan.','I do not need the crowd to clap for this.','Say it straight, and I will answer straight.']};
const MOTIV={
 'Get a chance to lead a match':['I want a chance to lead a match.','Give me the chance to lead a match and I will prove it.','I am ready to take the lead in a match.','A chance to call the shots in a match is what I want.','I want to be the one who leads a contest.','Let me lead a match and see what I can do.','My goal is to lead a match properly.','I want the responsibility of leading a match.'],
 'Become a reliable partner':['I want to be a reliable partner.','I want people to trust me in the ring.','I want to be the partner who turns up.','I want my partners to know they can count on me.','I want to be someone people choose to work with.','My aim is to be dependable in the ring.','I want to be the one who has your back.','I want to earn a reputation as a steady partner.'],
 'Earn a first regular booking':['I want a regular booking.','I want a regular spot on the card.','I want to earn a booking that lasts.','My goal is a booking that means something.','I want to be on the card every week, not just once.','I want a place on the card that I can keep.','I want to be booked and to stay booked.','A steady booking is what I am working for.'],
 'Build a reputation on merit':['I want my name built on what I do.','I want a reputation I have earned.','I want people to judge me by the work.','My reputation should come from what I show in the ring.','I want the work to speak for my name.','I want to be known for what I deliver.','Earned respect is what I am after.','I want a name that the work backs up.']};
const VULN={
 'Being dismissed before earning a chance':['I do not want to be dismissed before I get a chance.','Being written off before the bell is my fear.','I am worried I will be dismissed too early.','Being brushed aside before I have had a go is hard.','I hate the idea of being judged before I have shown anything.','Nobody should count me out before I have stepped in the ring.','I am afraid of being dismissed before I have had the chance to prove myself.','Being overlooked before I even start worries me.'],
 'Being treated as reckless muscle':['I do not want to be seen as reckless muscle.','Being called muscle with no mind bothers me.','I hate being treated as a brute.','People see the size and forget the brain.','I am more than a body in a ring.','Reckless is the last word I want people to use about me.','Being written off as just strength is frustrating.','I want people to see the thinking behind the work.'],
 'A mistake becoming their whole reputation':['One mistake should not define me.','A single error should not become my reputation.','I worry one slip will be all anyone remembers.','A bad night should not be the whole story of me.','One error could follow me for years, and that scares me.','I know one bad moment can become the only thing people talk about.','I do not want a single mistake to be my name.','A slip should not be the end of how people see me.'],
 'Being compared to a veteran':['Being measured against a veteran is hard.','I do not want to be compared to the veterans yet.','Every comparison to a veteran makes me nervous.','It is hard to be weighed against people with years behind them.','Comparisons to the veterans feel unfair at this stage.','I know I am being measured against people who have done it longer.','Being set beside a veteran puts pressure on me.','The veterans set a high bar, and I am still getting there.'],
 'Being rushed past preparation':['I hate being rushed past my preparation.','Being hurried past my training bothers me.','I want the time to prepare properly.','Rushing me past my preparation is the thing I dread.','I need time to get ready, and I do not want that taken away.','Being pushed on before I am ready makes me uneasy.','I want to do the preparation before I step out.','A rushed start is the one thing I want to avoid.'],
 'Being seen as a supporting character':['I do not want to be a supporting character.','Being background to someone else is my worry.','I want my own story, not a side role.','Being the sidekick in someone else\'s match frustrates me.','I want to be the reason the crowd is watching, not the filler.','Being an extra in other people\'s stories is not what I want.','I want my own moments in the ring.','Playing second fiddle is not something I want to do forever.']};
const TRIGGER={
 'A rival dismisses their progress':['If someone dismisses my progress, I will answer it in the ring.','When a rival writes off my progress, I respond.','Dismissing my progress will not go unanswered.','If you say I have not moved on, I will show you otherwise.','Anyone who dismisses how far I have come will hear about it.','Write off my progress and you will see the proof.','My progress is real, and I will defend it.','If you think I have not improved, come and test it.'],
 'Being spoken for without permission':['Nobody speaks for me without asking.','Speaking for me without permission gets a reply.','I will answer for myself.','Do not speak for me unless I have asked you to.','I can say what I think, thank you.','You do not get to speak on my behalf.','I speak for myself, and I always will.','Putting words in my mouth gets you a straight answer.'],
 'A rival doubts their readiness':['Doubt about my readiness makes me work harder.','If you doubt I am ready, watch me.','Questions about my readiness are fair, and I answer them in the ring.','You question whether I am ready, so come and see.','Doubt is fuel, and I will prove you wrong.','If you think I am not ready, test me.','My readiness is a fair question, and the ring is where I answer it.','Say I am not ready again and I will show you.'],
 'A rival ridicules aerial work':['If you laugh at the aerial work, you will see it.','Mocking my aerial work is a mistake.','Ridicule of the flying side gets an answer.','You can laugh at the flying, but you will watch it land.','The aerial work gets mocked, and I will show you why it counts.','Making fun of the high work does not stop me doing it.','If you think aerial work is a joke, wait for the next move.','Laughing at my flying is your problem, not mine.'],
 'A rival takes the credit':['Taking my credit is not fair.','If you take the credit for my work, I will say so.','I will not let my work be taken.','That work was mine, and I will say so.','Claiming my work as yours will not go unchallenged.','The credit for what I did belongs to me.','Taking credit that is not yours is a bad idea in front of me.','I will not stand by while my effort is handed to someone else.'],
 'A rival questions courage':['Questions about my courage get an answer in the ring.','Doubting my nerve is a mistake you will regret.','You can question my courage, but watch what I do next.','My courage is not up for debate, and I will show you.','If you think I lack nerve, step through the ropes.','Calling me a coward is a risk you should not take.','I answer doubts about my courage with my body.','Courage is shown in the ring, and I will show mine.'],'A rival mocks technique':['Mocking technique is a mistake, and I will show you why.','If you mock the technique, I will test it.','Mockery of technique gets a reply in the ring.','Technique is not a joke, and I will prove it.','You laugh at the holds, so let us see you use them.','Making fun of the technique tells me you have not seen it done properly.','Mock the technique, and I will show you the grip.','Sneering at the craft gets a practical answer.']};
const TACTIC={
 'Ask one tactical question':['What is your first move?','Which hold will you start with?','Tell me the first step of your plan.','Where do you start when the bell goes?','What do you go for first?','Which move opens the match for you?','How do you start the exchange?','What is the opening sequence you trust?'],
 'Ask for a direct sporting test':['Give me a fair test in the ring.','Put a clear test in front of me.','Set a fair test and I will meet it.','Give me a test I can measure myself against.','Let us see a straight contest with no excuses.','Set the terms, and let us test each other.','A clear sporting test is what I am asking for.','Give me something specific to prove in the ring.'],
 'Find a reason the crowd should care':['Give the crowd a reason to care.','Why should the crowd care? Tell me.','The crowd needs a reason, and I will give one.','What makes this match worth watching?','Give the people something to care about.','The crowd should have a reason to invest in this.','Show the crowd why this one matters.','Make me see why the crowd should care, and I will do the rest.'],
 'Build anticipation of a credible athletic moment':['Watch for the moment that builds.','The big athletic moment is coming.','Wait for the moment that earns the reaction.','There is a moment coming that the crowd will not forget.','Keep your eyes on the move that is building.','The athletic peak of this match is still ahead.','Something spectacular is building, and you will see it.','Count on a moment that will earn the gasp.']};
const BOUND={
 'No invented technical achievements':['I will not claim what I have not done.','I will not invent a record I do not have.','I will only say what I have actually done.','I will not overstate what I have achieved.','Only what I have really done gets mentioned.','I will not make up results to sound better.','I will keep my claims to what is true.','My record is my record, nothing added to it.'],
 'No deliberate injury threats':['I will not threaten anyone with injury.','I am not here to hurt anyone on purpose.','I will not make a threat about anyone\'s body.','My intention is to compete, not to injure.','I will not promise to hurt anyone.','Harm is not my plan, and I will not say it is.','I want a clean contest, not a grudge with consequences.','I will not talk about hurting people, because that is not what this is.'],
 'No invented personal tragedies':['I will not make up a sad story.','I will not invent a tragedy for the cameras.','My story is the one I have lived, nothing more.','I will not dress up my past with things that did not happen.','I am not going to borrow a tragedy to get sympathy.','The truth is enough for me to say.','I will keep my personal story honest.','I will not make myself a victim of a story I did not live.'],
 'No unsafe stunt promises':['I will not promise a stunt I cannot do safely.','No promises I cannot keep safely.','I will only offer what I can do safely.','I will not promise moves that could get someone hurt.','Safety comes before any spectacle I offer.','I will not put a dangerous stunt on the card just to impress.','If I cannot do it safely, I will not promise it.','The stunts I offer will be ones I can land safely.']};
const PRESS={
 'Returns to one practiced hold':['When it gets hard, I go back to one hold I practised.','The hold I trust is the one I drilled hardest.','When it tightens, I reach for the move I know cold.','I trust the one hold I have repeated every day.','When it gets tense, the drilled hold is the one that comes.','The hold I drilled is the one my hands go to when it counts.','When things tighten, I return to the basics I practise.','Strain brings out the one hold I know best.'],
 'Cuts the challenge to one clear demand':['When it gets tough, I ask for one clear thing.','The strain makes me narrow it to one demand.','I cut it down to one clear demand.','Pressure reduces my ask to a single point.','When it is tense, I ask for one plain thing and hold to it.','At the sharp end I simplify it to one demand.','When the stakes rise, I ask for one thing and wait for it.','I keep it to a single request when it gets hot.'],
 'Admits uncertainty then states the goal':['I am not sure of everything, but I know the goal.','I do not have all the answers, but I know what I want.','I am uncertain, and I still know where I am going.','I may not know every detail, but my goal is clear.','I admit I am not certain, yet I know what I am after.','I am unsure of a lot, and I still know where I want to end up.','I do not have it all worked out, but I know my aim.','I am not certain how it will go, but I know what I am aiming for.'],
 'Slows down and chooses a smaller commitment':['When it gets heavy, I slow down and choose a smaller promise.','The weight of it makes me take the smaller, surer step.','I back off to the commitment I can keep when things get heavy.','Slowing down is what I do when the load rises.','I take the step I can manage and nothing further.','When the pressure rises, I commit to less and deliver it.','The heavier it gets, the smaller my promise becomes.','I slow the pace and promise only what I can deliver.']};

// Slot frames: each slot is filled from the identity fields. Frames are placed in slot order.
const FRAMES=['{O} {T}','{O} {M}','{V} {B}','{O} {P}','{M} {O}','{P} {M}','{M}','{B} {O}',
 '{T}','{R} {T}','{V} {O}','{B} {P}','{M}','{R}','{V} {B}','{O} {V}',
 '{P}','{M} {O}','{B}','{O} {T}','{P} {M}','{T}','{B}','{O} {M}',
 '{V} {R}','{P}','{M}','{M} {B}','{O} {M}','{B}','{P} {T}','{R} {O}'];

function slotsFromSource(){
 const src=fs.readFileSync(path.join(js,'promo-dialogue-bank-c2.js'),'utf8');
 const m=src.match(/const slots=(\[.*?\]\]);/s);
 return JSON.parse(m[1]);
}

function lineFor(profile,id,slotIndex,frame){
 const fill={
  O:pick(OPEN[profile.delivery]||OPEN['Dry and direct'],id,'O',slotIndex),
  M:pick(MOTIV[profile.motivation]||MOTIV['Build a reputation on merit'],id,'M',slotIndex),
  V:pick(VULN[profile.vulnerability]||VULN['Being rushed past preparation'],id,'V',slotIndex),
  R:pick(TRIGGER[profile.trigger]||TRIGGER['A rival doubts their readiness'],id,'R',slotIndex),
  T:pick(TACTIC[profile.tactic]||TACTIC['Ask one tactical question'],id,'T',slotIndex),
  B:pick(BOUND[profile.boundary]||BOUND['No invented technical achievements'],id,'B',slotIndex),
  P:pick(PRESS[profile.underPressure]||PRESS['Returns to one practiced hold'],id,'P',slotIndex)};
 return frame.replace(/\{([OMVRTBP])\}/g,(_,k)=>fill[k]).replace(/\s+/g,' ').trim();
}

// Profiles come from the engine itself, so generated banks always follow the identity catalogue.
function loadProfiles(){
 const {core}=require(path.join(repo,'tests/_source.cjs'));
 const root={addEventListener(){}};const store=new Map();
 vm.runInNewContext(core,{window:root,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},Date,Math,JSON,console});
 const I=root.OfficePromoIdentity;
 return root.OfficeAcademyRegister.map(e=>{const live={...e,style:e.wrestling_style};return {id:e.id,profile:I.wrestler(live)};});
}

// Returns one pack per academy entrant in the same shape as an editorial pack.
function packs(){
 const slots=slotsFromSource();
 if(slots.length!==FRAMES.length)throw Error('slot/frame mismatch '+slots.length+' vs '+FRAMES.length);
 return loadProfiles().map(({id,profile})=>({role:'wrestler',owner:id,lines:slots.map(([stage,action,side,variant,category],i)=>({
  id:id+'.g.'+String(i+1).padStart(2,'0'),stage,action,side,category,text:lineFor(profile,id,i,FRAMES[i]),when:{hasMouthpiece:false,...(variant?{variants:[variant]}:{})}}))}));
}

// Claim each generated opponent-side line raises, taken from its first placeholder. Used for the reviewed table.
const TACTIC_CLAIM={'Ask one tactical question':'strategy','Ask for a direct sporting test':'effort','Find a reason the crowd should care':'audience','Build anticipation of a credible athletic moment':'appearance'};
const TRIGGER_CLAIM={'A rival dismisses their progress':'progress','Being spoken for without permission':'legitimacy','A rival doubts their readiness':'present','A rival ridicules aerial work':'air','A rival takes the credit':'name','A rival mocks technique':'effort','A rival questions courage':'present'};
const CLAIM_BY_FIELD={M:'present',V:'present',B:'legitimacy',P:'pace',O:'respect'};
function claimFor(profile,frame){
 const m=frame.match(/\{([OMVRTBP])\}/);if(!m)return null;const k=m[1];
 if(k==='T')return TACTIC_CLAIM[profile.tactic]||null;
 if(k==='R')return TRIGGER_CLAIM[profile.trigger]||null;
 return CLAIM_BY_FIELD[k]||null;
}
// Generated packs, excluding any id that already has an authored pack, plus the claim for each opponent-side line.
function generate(authoredOwners=new Set()){
 const slots=slotsFromSource();const out={packs:[],claims:{}};
 for(const {id,profile} of loadProfiles()){
  if(authoredOwners.has(id))continue;
  const lines=slots.map(([stage,action,side,variant,category],i)=>({
   id:id+'.g.'+String(i+1).padStart(2,'0'),stage,action,side,category,text:lineFor(profile,id,i,FRAMES[i]),when:{hasMouthpiece:false,...(variant?{variants:[variant]}:{})}}));
  out.packs.push({role:'wrestler',owner:id,lines});
  for(let i=0;i<slots.length;i++){const [,,side]=slots[i];if(side==='f'){const c=claimFor(profile,FRAMES[i]);if(c)out.claims[id+'.g.'+String(i+1).padStart(2,'0')]=c;}}
 }
 return out;
}
module.exports={packs,lineFor,FRAMES,claimFor,generate};
if(require.main===module){
 const ps=packs();
 const sample=process.argv[2];
 if(sample){const p=ps.find(x=>x.owner===sample);console.log(p.lines.map(l=>l.text).join('\n'));}
 else console.log('packs',ps.length,'lines',ps.reduce((n,p)=>n+p.lines.length,0));
}
