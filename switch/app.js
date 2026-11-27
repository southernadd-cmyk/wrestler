/* Separate switch presentation: actual OfficeGame and OfficeMatch APIs, no desktop UI. */
(function(){
'use strict';
const G=window.OfficeGame,D=window.OfficeData,X=window.OfficeMatch,M=window.NarbeScanManager,V=window.NarbeVoiceManager;
const $=id=>document.getElementById(id),a=(id,label,run,hint='')=>({id,label,run,hint}),money=G.money;
const MATCH_KEY='the-office-switch-match-v1', PLAN_KEY='the-office-switch-planning-v1';
let planning=null,planLoadToken=0,planSaveError='';
let items=[],input,active=null,identity=null,saveError='',refreshSettings=null,returnFromPause=null;
const s=()=>G.S;
const summary=()=>s()?'Season '+s().season+' · Week '+s().week+' · '+money(s().cash)+' · Reputation '+s().rep:'';
function persistMatch(){
 try{if(active)localStorage.setItem(MATCH_KEY,JSON.stringify({careerSeed:s().careerSeed,period:G.abs(),cid:active.cid,M:{...active.M,rState:active.M.r.getState()}}));else localStorage.removeItem(MATCH_KEY);saveError='';return true;}catch(e){saveError='Match progress could not be saved. Keep this page open.';return false;}
}
function restoreMatch(){
 active=null;
 try{const r=JSON.parse(localStorage.getItem(MATCH_KEY)||'null');if(r&&r.careerSeed===s().careerSeed&&r.period===G.abs()&&s().card.some(c=>c.id===r.cid)&&!G.resultRecorded({id:r.cid}))active={cid:r.cid,M:X.restore(r.M)};}catch(e){saveError='Could not restore the unfinished match. The booked match is still on your card.';}
}
function saveNotice(){return [G.saveStatus().ok===false?'Career could not be saved. Keep this page open.':'',saveError,planSaveError].filter(Boolean).join(' ');}
function highlight(item,state){
 for(const x of items){x.element.classList.toggle('scan',x.id===item?.id);if(x.id===item?.id)x.element.dataset.braked=String(!!state.braked||!!state.brakePaused);else delete x.element.dataset.braked;}
 $('controls').textContent=M.getSettings().autoScan?'ONE SWITCH · Enter selects · '+M.getScanInterval()/1000+' second scan':'TWO SWITCHES · Space moves · Enter selects';
 $('scanPosition').textContent=state.suspended?'Listening…':state.parked?'Scan parked':item?'Choice '+(items.indexOf(item)+1)+' of '+items.length:'Ready to scan';
 if(item?.element&&!state.suspended)item.element.scrollIntoView({block:'nearest',inline:'nearest'});
}
const boothSpeech=window.OfficeBoothSpeech.create(V);
let narrationLock=null,broadcastStopRequested=false;
const broadcastHeld=new Set();
function requestBroadcastPause(){broadcastStopRequested=true;$('controls').textContent='Pause requested — after the current commentary line.';}
const MODE_KEY='the-office-switch-management-mode';
let managementMode='guided';try{if(localStorage.getItem(MODE_KEY)==='full')managementMode='full';}catch(_){}
const guided=()=>managementMode==='guided';
const scan=M.createChoiceScan({choice:true,holdThreshold:600,statusHost:$('parkStatus'),getId:x=>x.id,getLabel:x=>x.label+(x.hint?'. '+x.hint:''),getElement:x=>x.element,onHighlight:highlight,onSelect:choose,speak:t=>boothSpeech.speak(t)});
function stopNarration(){
 if(!narrationLock)return;
 const lock=narrationLock;narrationLock=null;lock.ticket?.cancel();scan.setSuspended(false);
}
function narrateMatch(parts,onComplete=null,{skippable=false}={}){
 // Match commentary is not a scan label. Hold BOTH switch modes at the
 // blank start until the complete broadcast has finished, regardless of
 // the player's normal menu wait-for-speech preference.
 const lock={ticket:null,continuous:!!onComplete,skippable,held:onComplete?broadcastHeld:new Set()};narrationLock=lock;scan.setSuspended(true);
 $('controls').textContent=onComplete?'Live broadcast · Press and release Enter to pause after this line.':skippable?'Listening to the scene. Press and release your switch to skip narration; then choose.':'Listening to commentary. Choices resume when speech ends.';
 const finish=result=>{
  if(narrationLock!==lock)return;
  narrationLock=null;input.cancel();scan.setSuspended(false);
  if(onComplete){onComplete(result);return;}
  if(result?.reason==='timeout'||result?.reason==='error'||result?.reason==='failed-to-start'||result?.reason==='unavailable'){
   $('saveNotice').textContent=[saveNotice(),'Speech could not finish. The current text remains visible; you can review the conversation or replay commentary where available.'].filter(Boolean).join(' ');
  }
 };
 lock.ticket=boothSpeech.sequence(parts);
 lock.ticket.finished.then(finish,()=>finish({reason:'error'}));
}
input=window.OfficeChoiceInput.create({scan,manager:M,holdThreshold:600});
function choose(item){if(narrationLock||!item||!items.some(x=>x===item))return;try{item.run();}catch(e){console.error(e);screen('Office notice','The action could not be completed. Your career remains available.',[a('back','Return to the office',()=>s()?desk():mainMenu())]);}}
function screen(title,body,choices,{restoreId=null,fresh=true,portrait=null,announce=true,kicker='DENNIS · YOUR ASSISTANT',speechParts=null,onSpeechComplete=null,scene=null}={}){
 if(fresh){stopNarration();input.cancel();refreshSettings=null;}
 $('heading').textContent=title;$('kicker').textContent=kicker;$('careerStatus').textContent=summary();$('saveNotice').textContent=saveNotice();
 renderPresentation(title,body,portrait,scene,kicker);
 items=choices.map(x=>{const element=document.createElement('button');element.type='button';element.dataset.choice=x.id;const label=document.createElement('span');label.className='choiceLabel';label.textContent=x.label;element.append(label);if(x.hint){const hint=document.createElement('span');hint.className='choiceHint';hint.textContent=x.hint;element.append(hint);}const item={...x,element};element.onclick=()=>{if(narrationLock){if(narrationLock.continuous&&item.id==='pause')requestBroadcastPause();if(!narrationLock.skippable)return;stopNarration();}input.cancel();choose(item);};return item;});
 $('choices').replaceChildren(...items.map(x=>x.element));if(fresh)scan.open(items,{restoreId,startParked:restoreId===null&&M.isParkingEnabled()});else scan.setItems(items);
 if(announce){const sceneSpeech=(!!scene&&['backstage','promo'].includes(scene.stage))||kicker.startsWith('LEARN THE ROPES');const parkedHint=scan.getState().parked?' Parked. Press Enter to start scanning.':'';if(speechParts?.length)narrateMatch([...speechParts,...(parkedHint&&!onSpeechComplete?[{text:parkedHint.trim()}]:[])],onSpeechComplete,{skippable:sceneSpeech});else if(guided()&&sceneSpeech&&V.getSettings().ttsEnabled)narrateMatch([{text:title+'. '+body+parkedHint}],null,{skippable:true});else scan.announceCurrent(title+'. '+body+parkedHint);}
}
// Visual information is supplementary; the same text is available to speech.
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
function faceUrl(w){
 return window.OfficePortraits?.portraitCell({key:'wrestler:'+w.id,name:w.name},s())?.fileUrl||'assets/portraits/'+w.id+'.png';
}
let liveCard=null;
function renderPresentation(title,body,portrait,scene,kicker){
 const stage=scene?.stage||(kicker.startsWith('LIVE')?'ring':kicker.startsWith('AFTER')?'after':'office');
 document.body.dataset.stage=stage;
 document.body.dataset.broadcast=String(title==='Live broadcast');
 document.body.dataset.ringfax=String(kicker.startsWith('RINGFAX'));
 $('modeLabel').textContent=(guided()?'GUIDED':'FULL')+' MANAGEMENT';
 const journey=$('showJourney'),steps=['office','backstage','promo','ring','after'];
 journey.hidden=!s();Array.from(journey.children).forEach((el,i)=>{el.classList.toggle('current',steps[i]===stage);el.classList.toggle('past',steps.indexOf(stage)>i);if(steps[i]===stage)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
 const card=$('matchCard'),read=$('sceneRead'),story=$('story');read.replaceChildren();story.replaceChildren();
 card.hidden=!(scene?.w&&scene?.f);
 const reuse=stage==='ring'&&!card.hidden&&liveCard?.w===scene.w.id&&liveCard?.f===scene.f.id&&liveCard?.venue===scene.venue&&liveCard?.fact===scene.fact&&liveCard?.wSt===Number.isFinite(scene.wSt)&&liveCard?.fSt===Number.isFinite(scene.fSt);
 const condition=(box,value)=>{if(!Number.isFinite(value))return;value=Math.max(0,Math.min(100,Math.round(value)));box.querySelector('.conditionText').textContent='Stamina '+value+'%';box.querySelector('.conditionFill').style.width=value+'%';};
 if(reuse){condition(card.querySelector('.competitor.home'),scene.wSt);condition(card.querySelector('.competitor.away'),scene.fSt);}
 else{card.replaceChildren();liveCard=null;}
 if(!card.hidden&&!reuse){
  const mast=node('div','matchMast',scene.venue||'MATCH NIGHT');card.append(mast);
  const pair=node('div','matchPair');
  const person=(w,condition,side)=>{
   const box=node('div','competitor '+side),img=node('img','castFace');img.src=faceUrl(w);img.alt='';img.addEventListener('error',()=>{img.hidden=true;},{once:true});
   box.append(img,node('strong','castName',w.name),node('span','castDetail',w.style||'Wrestler'));
   if(condition!==undefined&&Number.isFinite(condition)){
    const value=Math.max(0,Math.min(100,Math.round(condition))),bar=node('div','conditionBar'),fill=node('span','conditionFill');fill.style.width=value+'%';bar.append(fill);box.append(node('span','conditionText','Stamina '+value+'%'),bar);
   }
   return box;
  };
  pair.append(person(scene.w,scene.wSt,'home'),node('div','versus','VS'),person(scene.f,scene.fSt,'away'));card.append(pair);
  if(scene.fact)card.append(node('div','matchFact',scene.fact));
  if(stage==='ring')liveCard={w:scene.w.id,f:scene.f.id,venue:scene.venue,fact:scene.fact,wSt:Number.isFinite(scene.wSt),fSt:Number.isFinite(scene.fSt)};
 }
 $('portrait').hidden=!portrait||!card.hidden;
 if(!$('portrait').hidden){$('face').hidden=false;$('face').src=portrait.id==='dennis'?'assets/portraits/dennis.png':faceUrl(portrait);$('face').alt=portrait.name;}
 read.hidden=!scene?.read?.length;
 if(!read.hidden)for(const x of scene.read)read.append(node('span','sceneMetric',x));
 const lines=String(body||'').split('\n').filter(Boolean);
 const speakers=[scene?.w?.short,scene?.f?.short,'Dennis','Gloria','Vic','Ravi','Interviewer','Stage','You','Agent'].filter(Boolean);
 for(const line of lines){
  const prefix=line.match(/^([^:]{1,35}):\s+(.+)$/);
  if(prefix&&speakers.some(x=>x.toLowerCase()===prefix[1].toLowerCase())){
   const box=node('div','dialogueLine');box.append(node('span','speaker',prefix[1]),node('p','spokenLine',prefix[2]));story.append(box);
  }else story.append(node('p','storyLine',line));
 }
 if(!portrait&&stage==='office'&&/^Dennis:/.test(title)){
  $('portrait').hidden=false;$('face').hidden=false;$('face').src='assets/portraits/dennis.png';$('face').alt='Dennis';
 }
 $('decisionHeading').textContent=stage==='ring'?'Your ringside call':stage==='promo'?'Choose the message':stage==='backstage'?'Make the call':'What do you do?';
}
function matchScene(c,w,f,stage,read=[]){
 const p=G.P(c.pid);return {stage,w,f,venue:p?.name||'MATCH NIGHT',fact:(D.SLOTS[c.slot]?.name||'Match')+' · '+(D.FINISHES[c.finish]?.name||'Booked result'),read};
}
function momentumText(m){return !Number.isFinite(m.mom)?'Momentum not available':m.mom>=25?'Momentum: '+m.w.short:m.mom<=-25?'Momentum: '+m.f.short:'Momentum: even';}
function liveScene(m,c){return {...matchScene(c,m.w,m.f,'ring',[X.fmt(m.t),'Crowd '+Math.round(m.crowd)+' / 100',momentumText(m),'Calls left '+m.calls]),wSt:m.wSt,fSt:m.fSt,fact:'LIVE FROM RINGSIDE'};}
const back=(fn)=>a('back','Back',fn);
function confirm(title,body,yes,fn,cancel){screen(title,body,[a('cancel','Cancel',cancel),a('confirm',yes,fn)]);}
function mainMenu(restoreId=null){
 const has=G.hasSave();
 screen('Main menu','Run your own wrestling stable. Sign talent, make bookings and manage matches at your own pace.',[
 ...(has?[a('continue','Continue career',()=>{if(G.load()){restoreMatch();restorePlanning();desk();}else screen('Save unavailable','Your saved career could not be opened.',[back(mainMenu)]);})]:[]),
 a('new','New career',()=>has?confirm('New career?','This replaces only your Switch Edition career. The regular game is unaffected.','Start new career',newIdentity,()=>mainMenu('new')):newIdentity()),
 a('help','How to play',()=>help(()=>mainMenu('help'))),a('settings','Settings',()=>settings(()=>mainMenu('settings'))),a('exit','Exit game',()=>exit(()=>mainMenu('exit')))
 ],{restoreId});
}
function newIdentity(){introduction(()=>{identity=G.suggestIdentity();identityScreen();},()=>mainMenu('new'));}
function difficultyName(state=s()){return state?.switchDifficulty==='relaxed'?'Relaxed':'Standard';}
function startCareer(difficulty){
 active=null;persistMatch();planning=null;planLoadToken++;persistPlanning();G.fresh(identity);window.OfficeRingfax.reset();
 if(difficulty==='relaxed'){s().switchDifficulty='relaxed';G.save();}
 desk('The keys are yours. You have £2,250 and an empty stable. '+difficultyName()+' career. Sign your first wrestler.');
}
function identityScreen(){screen('Meet the new boss',identity.manager+' · '+identity.stable+'. Choose your career challenge, or suggest another identity.',[
 a('start','Start standard career',()=>startCareer('standard'),'The original challenge. Financial failure can end the career.'),
 a('relaxed','Start relaxed career',()=>startCareer('relaxed'),'No bankruptcy. Weekly support restores the bank to at least £750. All wrestling and other consequences remain.'),
 a('another','Suggest another identity',()=>{identity=G.suggestIdentity();identityScreen();}),back(()=>mainMenu('new'))]);}
// Short, optional onboarding. No save is created or replaced until Start career.
const INTRO=[
 {title:'You run a wrestling business',body:'You represent a group of wrestlers, called a stable. You are their manager and employer, not the person running the wrestling shows. You hire wrestlers, pay their wages, negotiate their contracts with promoters and decide how to develop their careers.'},
 {title:'Your job is to make stars',body:'You want your wrestlers to become popular, earn better pay and eventually compete for championships. Keep them fit and happy, earn the promoters’ trust and keep your business profitable. Sometimes the best decision is to turn down a match or let a tired wrestler rest.'},
 {title:'The matches are scripted',body:'Promoters usually decide who should win. You negotiate the deal and help the wrestlers plan an entertaining match. You can advise them during the action, but they perform the moves and may ignore you. Even losing can be a success if the crowd loves the match and the agreed ending is delivered.'},
 {title:'Your first week',body:'Dennis, your assistant, will guide you through hiring, booking, backstage planning and match night. Review how your choices affected the wrestlers, the fans and your bank balance. Each week brings new opportunities. Choose Relaxed difficulty to learn without the risk of bankruptcy.'}
];
const BASICS=[
 {id:'business',title:'Your job and the money',body:'You employ and represent wrestlers, rather than owning a wrestling promotion. A promoter runs shows; a booker arranges matches. You choose whom to hire, which offers to accept, what terms to negotiate and how to train your team. A purse is the payment for a match. Pay wages and costs, build reputation and help your wrestlers earn better opportunities.'},
 {id:'finishes',title:'Winning, losing and finishes',body:'A finish is the planned ending. A pin means holding the opponent’s shoulders down for a three count. Submission means giving up. A clean win or loss follows the rules; a dirty win uses cheating. A protected loss makes the loser still look strong. DQ means disqualification for breaking rules. No contest means no winner. An agreed ending can go wrong.'},
 {id:'backstage',title:'Planning and wrestling styles',body:'A layout or structure is the story of the match: how it builds and ends. The dramatic lead shapes that story, not who wins. Technical wrestling uses holds and skill. Brawling uses rough fighting. A spot is a planned memorable move or moment. A spot-fest uses many big moves. A finisher is a wrestler’s signature match-ending move.'},
 {id:'people',title:'Fans, characters and promos',body:'A face is a hero; a heel is a villain. Heat measures how much attention or reaction a wrestler gets, not their goodness. A pop is a big crowd reaction. A promo is a speech or interview in character. A feud or rivalry is a continuing dispute; a programme is a storyline across several matches.'},
 {id:'ringside',title:'During and after the match',body:'Stamina is energy left during a match; fatigue is tiredness that carries into future weeks. Momentum shows who has the advantage. A ringside call is an instruction, not direct control: wrestlers may ignore it. A botch is a mistake. Stars measure performance quality, not just who won. The main event is the headline match. A title or belt is a championship.'}
];
function learningScreen(title,body,choices,restoreId=null){
 screen(title,body,choices,{kicker:'LEARN THE ROPES · THE OFFICE',restoreId,speechParts:V.getSettings().ttsEnabled?[{text:title+'. '+body}]:null});
}
function introduction(start,ret,page=0,revisit=false){
 const i=Math.max(0,Math.min(page,INTRO.length-1)),entry=INTRO[i];
 learningScreen(entry.title,entry.body+'\nIntroduction '+(i+1)+' of '+INTRO.length+'.',[
  a('next',i===INTRO.length-1?(revisit?'Return to guide':'Choose your career'):'Next',i===INTRO.length-1?start:()=>introduction(start,ret,i+1,revisit)),
  ...(i>0?[a('previous','Previous',()=>introduction(start,ret,i-1,revisit))]:[]),
  ...(i<INTRO.length-1?[a('skip','Skip introduction',start)]:[]),back(ret)]);
}
function help(returnTo){
 learningScreen('How to play','You do not need to know wrestling to play. Choose a short guide, or read the introduction again. You can return to the game whenever you are ready.',[
  a('intro','Read the introduction',()=>introduction(()=>help(returnTo),()=>help(returnTo),0,true)),
  a('controls','Switch controls',()=>controlHelp(()=>help(returnTo))),
  a('basics','Wrestling words and concepts',()=>basicsHelp(()=>help(returnTo))),
  back(returnTo)]);
}
function controlHelp(ret){
 learningScreen('Switch controls','Two switches: Space moves the highlight, Enter selects. One switch: the highlight moves automatically after scanning starts; Enter selects. If scanning is parked, press Enter to start. Release your switch to choose. In Guided mode with speech on, matches play automatically. Press and release Enter to pause after the current line. With speech off, use the next commentary choices. Pause gives access to settings and I Need Help.',[back(ret)]);
}
function basicsHelp(ret,page=0,restoreId=null){
 const i=Math.max(0,Math.min(page,Math.ceil(BASICS.length/3)-1)),rows=BASICS.slice(i*3,i*3+3);
 learningScreen('Wrestling basics','Choose the topic you want explained. Nothing in your career changes while you read.',[
  ...rows.map(x=>a(x.id,x.title,()=>learningScreen(x.title,x.body,[back(()=>basicsHelp(ret,i,x.id))]))),
  ...(i===0?[a('next','More topics',()=>basicsHelp(ret,1))]:[a('previous','Previous topics',()=>basicsHelp(ret,0))]),back(ret)],restoreId);
}

function exit(returnTo){confirm('Exit game?',window.parent===window?'Return to the main menu? Your career is kept.':'Return to the Hub? Your career is kept.','Exit game',()=>{mainMenu();if(window.parent!==window){input.cancel({resetGuard:true});V.cancel();window.parent.postMessage({action:'focusBackButton'},'*');}},returnTo);}
function requestHelp(){
 const message='I need help, please! I need help, please!';
 let service;try{if(window.parent!==window&&window.parent.location.origin===window.location.origin)service=window.parent.NarbeCommunicationSpeech;}catch(_){}
 let ticket;try{ticket=service?.isEnabled?.()?service.speak(message):V.speak(message,{force:true});}catch(_){ticket=V.speak(message,{force:true});}
 if(ticket)scan.holdForSpeech(ticket);
}
function pause(returnTo,restoreId=null){returnFromPause=returnTo;screen('Pause','Your game is waiting. No match time passes here.',[a('continue','Continue',returnTo),a('settings','Settings',()=>settings(()=>pause(returnTo,'settings'))),a('mode','Management mode',()=>modeScreen(()=>pause(returnTo,'mode'))),a('help','I Need Help',requestHelp),a('learn','How to play / wrestling words',()=>help(()=>pause(returnTo,'learn'))),a('menu','Main menu',()=>mainMenu()),a('exit','Exit game',()=>exit(()=>pause(returnTo,'exit')))],{restoreId});}
function settings(returnTo,fresh=true,restoreId=null){
 screen('Settings','Access settings are shared with other compatible NARBE games on this origin.',[
 a('tts','Text to speech: '+(V.getSettings().ttsEnabled?'On':'Off'),()=>{V.toggleTTS();settings(returnTo,false);}),
 a('voice','Voice: '+V.getVoiceDisplayName(V.getCurrentVoice()),()=>{V.cycleVoice();settings(returnTo,false);}),
 a('auto','Auto scan: '+(M.getSettings().autoScan?'On — One switch':'Off — Two switches'),()=>{if(M.getSettings().autoScan)confirm('Use two switches?','You need Space to move the highlight and Enter to select. Cancel if you only use one switch.','Use two switches',()=>{M.setAutoScan(false);settings(returnTo,true,'auto');},()=>settings(returnTo,true,'auto'));else{M.setAutoScan(true);settings(returnTo,false);}}),
 a('speed','Scan speed: '+M.getScanInterval()/1000+' seconds',()=>{M.cycleScanSpeed();settings(returnTo,false);}),
 back(returnTo)],{fresh,announce:fresh,restoreId});
 refreshSettings=()=>settings(returnTo,false);
}
function desk(note='',restoreId=null,full=false){
 if(s()?.switchAfter||s()?.after?.autonomous){afterScreen();return;}
 if(active){matchScreen(note);return;}
 if(planning&&planning.room&&s().card.some(c=>c.id===planning.cid)){if(planning.onMic)preMatch();else roomScreen();return;}
 if(s().switchWeekReview?.pending){weeklyReview();return;}
 if(s().over){screen('Career ended','Your career has ended. You can review the final balance or start again.',[a('new','Main menu',()=>mainMenu()),a('pause','Pause',()=>pause(()=>desk()))]);return;}
 if(guided()&&!full){guidedDesk(note);return;}
 const n=G.pending().length,b=G.officeBrief();
 const list=[a('inbox',n?'Inbox — '+n+' decisions waiting':'Inbox',()=>inbox()),a('stable',s().roster.length?'Manage your stable':'Sign your first wrestler',()=>stable()),a('offers','Booking offers — '+(b.today.length+b.deadline.length)+' urgent',()=>offers()),a('week',s().card.length?'Prepare for match night':'Advance the week',()=>advance()),a('more','More office options',()=>more())];
 screen('Your desk',(note?note+'\n\n':'')+s().identity.stable+'. '+s().roster.length+' wrestlers under contract. '+s().card.length+' matches booked. '+n+' messages need a decision. '+money(b.after)+' projected bank balance after signed purses and costs.',list,{restoreId});
}
// The guide is a presentation of actual career decisions, not an autoplay manager.
function modeScreen(ret){
 screen('Management mode','Guided: Dennis brings you important decisions. Full: choose every task through the office. Both use the same rules, wrestlers and finances.',[
 a('guided','Guided management'+(guided()?' — selected':''),()=>setMode('guided',ret)),
 a('full','Full management'+(!guided()?' — selected':''),()=>setMode('full',ret)),
 ...(s()&&!s().over?[a('difficulty','Career difficulty: '+difficultyName(),()=>difficultyScreen(()=>modeScreen(ret)))]:[]),back(ret)]);
}
function difficultyScreen(ret){
 const current=difficultyName();
 const choose=mode=>{
  if(difficultyName().toLowerCase()===mode){ret();return;}
  confirm('Change career difficulty?',mode==='relaxed'?'Future weekly settlements restore the bank to at least £750. Match results, wages, injuries and other consequences do not change.':'Financial support stops from the next settlement. Bankruptcy is possible again. Previous support is not reversed.',mode==='relaxed'?'Use relaxed mode':'Use standard mode',()=>{if(mode==='relaxed')s().switchDifficulty='relaxed';else delete s().switchDifficulty;G.save();ret();},()=>difficultyScreen(ret));
 };
 screen('Career difficulty','Current: '+current+'. Standard uses the original financial rules. Relaxed keeps the career going with a minimum £750 balance after weekly settlement. Spending is still limited by available cash; no matches, training or contracts are automatically decided.',[
 a('standard','Standard'+(current==='Standard'?' — selected':''),()=>choose('standard')),
 a('relaxed','Relaxed'+(current==='Relaxed'?' — selected':''),()=>choose('relaxed')),back(ret)]);
}
function setMode(mode,ret){
 managementMode=mode;try{localStorage.setItem(MODE_KEY,mode);}catch(_){}
 ret();
}
function guideState(){
 if(s().switchGuide?.period!==G.abs())s().switchGuide={period:G.abs(),reviewed:[]};
 return s().switchGuide;
}
function guideMark(id){const g=guideState();if(!g.reviewed.includes(id))g.reviewed.push(id);G.save();}
// Dennis ranks genuine opportunities; recommendations never spend money or
// commit a wrestler. Scouting scores use only the available estimated bands.
function guideRecruitOptions(state,initial=false){
 const reserve=initial?250:750;
 const estimate=(w,k)=>{const b=G.scoutBand(w,k);return (b.lo+b.hi)/2;};
 const entries=state.free.map(w=>({w,f:G.signingForecast(w.id)})).filter(x=>x.f?.affordable);
 const safe=entries.filter(({f})=>f.afterWeek>=Math.max(reserve,initial?0:f.weeklyCost));
 const pool=initial&&!safe.length?entries:safe;
 return pool.map(({w,f})=>({w,f,score:estimate(w,'ring')+estimate(w,'psych')+estimate(w,'safe')-w.fee/10-w.wage/2+(state.roster.length&&!state.roster.some(x=>D.divisionOf(x)===D.divisionOf(w))?12:0)}))
  .sort((a,b)=>b.score-a.score||a.w.fee-b.w.fee||a.w.id.localeCompare(b.w.id));
}
function guideExpansion(state,seen){
 if(!state.roster.length||state.roster.length>=5||seen.has('expansion'))return null;
 // Do not rely on projected purses or future Relaxed support to pay fees.
 const target=state.cash>=4000?5:state.cash>=2500?4:state.cash>=1500?3:2;
 if(state.roster.length>=target)return null;
 return guideRecruitOptions(state)[0]||null;
}
function guideTrainingAdvice(w){
 const existing=G.trainingAdvice(w).filter(x=>x.priority==='urgent');
 if(w.injury||w.program)return existing;
 if(w.training!=='rest'&&w.fatigue>=45){
  return [{priority:'urgent',kind:'focus',value:'rest',title:'Give them a rest',why:w.short+' has '+w.fatigue+' fatigue. Rest this week helps protect future performances; training while tired can make recovery harder.'}];
 }
 if(w.training==='rest'&&w.fatigue<=25){
  if(w.intensity==='hard')return [{priority:'urgent',kind:'intensity',value:'light',title:'Reduce the next training load',why:w.short+' has recovered. Switch to light drills before restarting skill training.'}];
  const focus=w.style==='Spectacle'&&w.safe<65?'safe':w.psych<65?'psych':'ring';
  return [{priority:'urgent',kind:'focus',value:focus,title:'Resume skill training',why:w.short+' has recovered to '+w.fatigue+' fatigue. Resume '+D.TRAINING[focus].name.toLowerCase()+' training to develop their skills.'}];
 }
 return existing;
}
function guideOffer(state,brief,seen,now){
 const urgent=new Set([...brief.today,...brief.deadline].map(x=>x.id));
 const special=new Set(['Regional Showcase','Television Audition','Season Finale','Title match','Title defence']);
 const rows=state.offers.filter(o=>!seen.has('offer:'+o.id)&&(urgent.has(o.id)||(o.eventAbs>now&&o.eventAbs<=now+2&&(special.has(o.tag)||o.title||o.pid==='union'))));
 const score=({o,w,p,pay})=>pay-w.fatigue*4+(D.STYLE_PLAN[w.style]===p.likes?80:0)+(o.pid==='union'&&!state.goals?.union?150:0)+(o.title?100:0);
 const candidates=rows.flatMap(o=>{
  const p=G.P(o.pid);if(!p)return [];
  return G.offerCandidates(o).map(w=>{
   // Programmes advertise the combined purse; compare a per-match average.
   const n=o.programme?.beats?.length||1,pay=o.programme?OfficeProgrammes.totalPurse(o,w)/n:G.purse(o,w);
   const today=o.eventAbs===now||o.programme?.beats?.some(b=>b.at===now);
   return {o,w,p,pay,today,fit:D.STYLE_PLAN[w.style]===p.likes};
  });
 });
 return candidates.sort((a,b)=>Number(!!b.today)-Number(!!a.today)||score(b)-score(a)||a.o.id.localeCompare(b.o.id)||a.w.id.localeCompare(b.w.id))[0]||null;
}
function guideObjective(state){
 const goals=G.goalList(),goal=id=>goals.find(g=>g.id===id);
 if(state.season===1&&state.week<=4&&!state.monthReview){
  const m=G.monthStatus(),need=[];
  if(!m.okMatch)need.push('a three-star match');
  if(!m.passed){if(!m.cash)need.push('£750 in the bank');if(!m.rep)need.push('reputation 30');if(!m.developed)need.push('two skill points for one wrestler');}
  if(m.passed)return 'The first-month targets are currently met. Keep enough cash for weekly costs.';
  return 'First-month review: a three-star match plus two of cash £750, reputation 30 and two skill points for one wrestler. '+(need.length?'Still to work on: '+need.join(', ')+'.':'');
 }
 if(!goal('union')?.done){
  const p=G.P('union');
  if(p&&state.rep<p.minRep)return 'Next step towards Grand Union: reputation '+state.rep+' of '+p.minRep+' needed to qualify for offers. Good matches build reputation.';
  return 'Next objective: secure a Grand Union booking when an eligible offer appears.';
 }
 if(!goal('four')?.done)return 'Next objective: produce a four-star match. Choose a style that suits the wrestlers and keep them fit.';
 if(!goal('rep')?.done)return 'Next objective: '+goal('rep').text+'.';
 if(!goal('solvent')?.done)return 'Next objective: restore a positive bank balance.';
 return 'Season objectives are currently met. Keep the stable healthy and profitable.';
}
function guidePlan(w,p,options){
 const preferred=D.STYLE_PLAN[w.style],id=(w.fatigue>=78||w.injury)?'safe':preferred||p.likes||'story';
 return options.find(x=>x.id==='plan_'+id)||options.find(x=>x.id==='plan_'+p.likes)||options[0];
}
function guidedDesk(note=''){
 const g=guideState(),seen=new Set(g.reviewed),b=G.officeBrief();
 const office=()=>desk('','',true),moreChoice=a('office','Full office / settings',office);
 const pending=G.pending()[0];
 if(pending){
  const body=(Array.isArray(pending.body)?pending.body.join('\n'):pending.body||'');
  pending.read=true;G.save();
  const rows=(pending.options||[]).map(o=>a(o.id,o.label+(o.hint?'. '+o.hint:''),()=>{
   const result=G.answer(pending.id,o.id);
   if(!pending.answer){screen('Response unavailable',String(result),[back(()=>guidedDesk())]);return;}
   guidedDesk('Decision recorded: '+(pending.outcome||'Response recorded.'));
  }));
  screen(pending.subject,(note?note+'\n':'')+pending.from+'. '+body,rows.concat(moreChoice));return;
 }
 if(!s().roster.length){
  const choices=guideRecruitOptions(s(),true).slice(0,3);
  screen('Dennis: build your stable',(note?note+'\n':'')+'We need wrestlers before we can book a show. I have compared estimated skills, signing fees and wages. '+(choices.length?'Review a suggested recruit or browse all free agents.':'No affordable recruits are available right now.'),[
   ...choices.map(({w,f})=>a(w.id,w.name+' — '+w.style+', '+money(w.fee),()=>signProfile(w,()=>guidedDesk()),money(w.wage)+' weekly wage. '+money(f.afterWeek)+' left after estimated weekly costs.')),a('scout','Browse all free agents',()=>scout(()=>guidedDesk())),moreChoice]);return;
 }
 const urgent=s().roster.flatMap(w=>guideTrainingAdvice(w).filter(x=>x.priority==='urgent'&&!seen.has('training:'+w.id+':'+x.title)).map(x=>({w,x})))[0];
 if(urgent){
  const {w,x}=urgent,id='training:'+w.id+':'+x.title,methods={focus:G.setTraining,intensity:G.setIntensity,session:G.setSession};
  const go=()=>{guideMark(id);guidedDesk();};
  const choices=[];
  if(methods[x.kind])choices.push(a('apply','Apply: '+x.title,()=>confirm('Change training?',x.why,'Apply recommendation',()=>{const e=methods[x.kind](w.id,x.value);if(e){screen('Training unavailable',e,[back(()=>guidedDesk())]);return;}guideMark(id);guidedDesk('Training updated for '+w.short+'.');},()=>guidedDesk())));
  choices.push(a('keep','Keep current arrangements',go),a('review','Review wrestler development',()=>{guideMark(id);training(w,()=>guidedDesk());}),moreChoice);
  screen('Dennis: '+x.title,(note?note+'\n':'')+x.why,choices,{portrait:w});return;
 }
 const expansion=guideExpansion(s(),seen);
 if(expansion){
  const {w,f}=expansion,skip=()=>{guideMark('expansion');guidedDesk();};
  screen('Dennis: grow your stable',(note?note+'\n':'')+'A larger team can take more bookings and let tired wrestlers rest. '+w.name+' is a promising recruit for '+money(w.fee)+', with wages of '+money(w.wage)+' a week. Estimated cash after signing and weekly costs: '+money(f.afterWeek)+', before any match income. Keep a reserve for quiet weeks.',[
   a('review','Review '+w.name+' for signing',()=>{guideMark('expansion');signProfile(w,()=>guidedDesk());}),
   a('skip','Keep the current stable this week',skip),moreChoice],{portrait:w});return;
 }
 const recommended=guideOffer(s(),b,seen,G.abs());
 if(recommended){
  const {o,w,p,fit,pay}=recommended,f=G.F(o.rid),id='offer:'+o.id,skip=()=>{guideMark(id);guidedDesk();};
  const candidates=G.offerCandidates(o);
  const reasons=[o.programme?'Average match pay '+money(pay)+'.':'',fit?'Their style suits this promoter.':'',o.pid==='union'&&!s().goals?.union?'This helps meet the Grand Union objective.':'',o.title?'This is a championship opportunity.':'',w.fatigue>=65?'Fatigue is high; consider leaving this offer or choosing another wrestler.':''].filter(Boolean).join(' ');
  screen('Dennis: booking opportunity',(note?note+'\n':'')+p.name+' has an invitation against '+(f?.name||'an opponent')+'. I suggest '+w.name+' based on match pay, condition and promoter fit. '+bookingTerms(o,w)+' '+(recommended.today?'This week.':'Future booking; condition can change.')+' Fatigue '+w.fatigue+'. '+reasons,[
   ...(!o.talk||['start','done'].includes(o.talk.step)?[a('accept','Accept offered terms',()=>signBooking(o,w,()=>guidedDesk()))]:[]),
   a('review','Review / negotiate offer',()=>offerTerms(o,w,()=>guidedDesk())),
   ...(candidates.length>1?[a('other','Choose another wrestler',()=>offer(o,()=>guidedDesk()))]:[]),
   a('skip','Leave offer for now',skip),moreChoice],{portrait:w});return;
 }
 screen(s().card.length?'Dennis: ready for match night':'Dennis: the week is ready',(note?note+'\n':'')+s().card.length+' matches booked. '+money(b.after)+' projected balance after costs. '+(b.today.length+b.deadline.length?'There are still '+(b.today.length+b.deadline.length)+' unsigned urgent invitations. ':'')+'Existing training plans continue. '+guideObjective(s())+' Nothing is automatically signed or spent.',[
 a('continue',s().card.length?'Start match night':'Finish the week',advance),a('stable','Review your stable',stable),a('ringfax','Read Ringfax',()=>ringfaxHome(()=>guidedDesk())),moreChoice]);
}
function more(){screen('More office options',summary(),[a('finances','Finances and objectives',finances),a('results','Recent results',()=>results()),a('progress','Career progress',()=>careerProgress()),a('ringfax','Ringfax',()=>ringfaxHome(more)),a('mode','Management mode: '+(guided()?'Guided':'Full'),()=>modeScreen(more)),a('pause','Pause / settings',()=>pause(()=>more())),back(()=>desk('','more'))]);}
// Ringfax is read-only; keep the existing editorial generator and quiz rules.
const RF=window.OfficeRingfax;
const rfKicker='RINGFAX · REGIONAL WRESTLING TELETEXT';
function ringfaxHome(ret){
 screen('Ringfax — page 100','Season '+s().season+', week '+s().week+'. News, opinions and the weekly wrestling quiz. The career waits while you read.',[
  a('news','News and results',()=>ringfaxDirectory('News and results',[101,102,103,104,200,201],ret)),
  a('features','Features and fan letters',()=>ringfaxDirectory('Features and fan letters',[300,301,302,500,501],ret)),
  a('rankings','Championships and rankings',()=>ringfaxRankings(ret)),
  a('quiz','Weekly wrestling quiz',()=>ringfaxQuiz(ret)),a('pause','Pause / settings',()=>pause(()=>ringfaxHome(ret))),back(ret)],{kicker:rfKicker});
}
function ringfaxDirectory(title,numbers,ret,page=0,restoreId=null){
 const pages=RF.build(s()),count=Math.ceil(numbers.length/3),i=Math.max(0,Math.min(page,count-1));
 const rows=numbers.slice(i*3,i*3+3).filter(n=>pages[n]).map(n=>a('rf'+n,pages[n].title,()=>ringfaxArticle(n,()=>ringfaxDirectory(title,numbers,ret,i,'rf'+n))));
 screen(title,'Ringfax index. Page '+(i+1)+' of '+count+'.',[
  ...rows,...(i+1<count?[a('next','More articles',()=>ringfaxDirectory(title,numbers,ret,i+1))]:[]),
  ...(i>0?[a('previous','Previous articles',()=>ringfaxDirectory(title,numbers,ret,i-1))]:[]),back(()=>ringfaxHome(ret))],{kicker:rfKicker,restoreId});
}
function ringfaxParagraphs(rows){
 const lines=[];let text='',colour=null;
 const flush=()=>{if(text)lines.push(text);text='';colour=null;};
 for(const row of rows){
  const value=String(row.text||'').trim();
  if(!value||/^[-=]+$/.test(value)){flush();continue;}
  if(colour!==row.colour)flush();
  text+=(text?' ':'')+value;colour=row.colour;
 }
 flush();return lines;
}
function ringfaxArticle(number,ret,page=0){
 const article=RF.build(s())[number];if(!article){ret();return;}
 // Retain authored subpage boundaries; ordinary articles use the same
 // 17-row partition as Ringfax. Pages never advance while being read.
 const rows=article.lines||[],chunks=article.subpages||Array.from({length:Math.max(1,Math.ceil(rows.length/17))},(_,i)=>rows.slice(i*17,i*17+17));
 const i=Math.max(0,Math.min(page,chunks.length-1)),body=ringfaxParagraphs(chunks[i]).join('\n');
 screen(article.title,body+(chunks.length>1?'\nPage '+(i+1)+' of '+chunks.length+'.':''),[
  ...(i+1<chunks.length?[a('next','Next page',()=>ringfaxArticle(number,ret,i+1))]:[]),
  ...(i>0?[a('previous','Previous page',()=>ringfaxArticle(number,ret,i-1))]:[]),
  a('repeat','Read page again',()=>ringfaxArticle(number,ret,i)),back(ret)],{kicker:rfKicker+' · '+number});
}
function ringfaxRankings(ret,restoreId=null){
 const promos=s().promoters||D.PROMOS;
 screen('Championships and rankings','Choose a promotion. These are the current circuit records, not predictions.',promos.map(p=>a(p.id,p.name,()=>ringfaxDivision(p,ret))).concat(back(()=>ringfaxHome(ret))),{kicker:rfKicker,restoreId});
}
function ringfaxDivision(p,ret){
 screen(p.name,'Choose a division.',D.DIVISION_ORDER.map(div=>a(div,D.DIVISIONS[div].name+' division',()=>ringfaxLadder(p,div,ret))).concat(back(()=>ringfaxRankings(ret,p.id))),{kicker:rfKicker});
}
function ringfaxRankData(state,pid,div){
 const rows=window.OfficeTerritory.promotionRank(pid,div,state.territory,state);
 const holder=state.territory?.titles?.[pid]?.[div]?.holder;
 const name=holder?(rows.find(w=>w.id===holder)?.name||D.findWrestler?.(holder)?.name||holder):'Vacant';
 return {champion:name,lines:rows.map((w,i)=>(i+1)+'. '+w.name+(w.owned?' — your stable':'')+(w.champion?' — champion':''))};
}
function ringfaxLadder(p,div,ret,page=0){
 const rank=ringfaxRankData(s(),p.id,div),count=Math.max(1,Math.ceil(rank.lines.length/5)),i=Math.max(0,Math.min(page,count-1));
 const rows=rank.lines.slice(i*5,i*5+5);
 screen(p.name+' — '+D.DIVISIONS[div].name,'Champion: '+rank.champion+'.\n'+(rows.length?rows.join('\n'):'No rankings recorded.')+'\nPage '+(i+1)+' of '+count+'.',[
  ...(i+1<count?[a('next','Next rankings',()=>ringfaxLadder(p,div,ret,i+1))]:[]),
  ...(i>0?[a('previous','Previous rankings',()=>ringfaxLadder(p,div,ret,i-1))]:[]),back(()=>ringfaxDivision(p,ret))],{kicker:rfKicker});
}
const rfColours=['Red','Green','Yellow','Cyan'];
function ringfaxQuiz(ret){
 // Use the actual quiz API. Reopening page 777 in the same week does not
 // reset an attempt; the shared module rotates questions on week changes.
 RF.press('go',777,s());
 const info=RF.quizInfo(),q=RF.quizQuestions[info.index],again=()=>ringfaxQuiz(ret);
 const act=(action,value)=>()=>{if(RF.press(action,value,s()))again();};
 let title='Ringfax weekly quiz',body='Twelve wrestling questions. Checkpoints after questions four and eight. No effect on your career.',choices=[];
 if(info.stage==='question'){
  title='Question '+(info.index+1)+' of '+info.total;body=q.q;
  choices=q.a.map((label,i)=>a('quiz-'+i,rfColours[i]+': '+label,act('quiz-answer',i)));
 }else if(info.stage==='wrong'){
  title='You have been bodyslammed!';body='Correct answer: '+q.a[q.correct]+'. Retry from question '+(info.checkpoint+1)+'.'+(info.reveal?' '+q.fact:'');
  choices=[a('retry','Try again',act('quiz-retry')),a('reveal',info.reveal?'Hide trivia':'Reveal trivia',act('quiz-reveal'))];
 }else if(info.stage==='won'){
  title='You are the Quiz Champion!';body='All '+info.total+' questions answered. Wrong turns: '+info.misses+'. A main-event performance!';
  choices=[a('again','Play again',act('quiz-start')),a('rules','Rules',act('quiz-rules'))];
 }else if(info.stage==='rules'){
  title='Quiz rules';body='Select one answer. An incorrect answer sends you back to the last checkpoint when you retry. Reveal the trivia fact if you like. No timer, no money at stake.';
  choices=[a('start','Start quiz',act('quiz-start')),a('intro','Back to quiz introduction',act('quiz-back'))];
 }else choices=[a('start','Start quiz',act('quiz-start')),a('rules','How to play',act('quiz-rules'))];
 screen(title,body,[...choices,back(()=>ringfaxHome(ret))],{kicker:rfKicker+' · 777'});
}
function finances(){screen('Finances and objectives','Bank '+money(s().cash)+'. Weekly wages '+money(G.wages())+'. Overheads '+money(G.overhead())+'. Training '+money(G.trainingBill())+'.\n'+G.goalList().map(x=>(x.done?'Complete: ':'Open: ')+x.text).join('\n'),[back(more),a('pause','Pause',()=>pause(finances))]);}
function paged(title,rows,page,open,returnTo,describe=x=>x.name,restoreId=null){
 const count=3,pages=Math.max(1,Math.ceil(rows.length/count));page=Math.max(0,Math.min(pages-1,page));
 screen(title,rows.length?rows.length+' entries. Page '+(page+1)+' of '+pages+'.':'Nothing to review.',[
 ...rows.slice(page*count,page*count+count).map(x=>a(x.id,describe(x),()=>open(x,()=>paged(title,rows,page,open,returnTo,describe,x.id)))),
 ...(pages>1?[a('next','Next page',()=>paged(title,rows,(page+1)%pages,open,returnTo,describe))]:[]),
 back(returnTo)],{restoreId});
}
function inbox(){const rows=[...s().inbox].sort((x,y)=>Number(y.kind==='decision'&&!y.answer)-Number(x.kind==='decision'&&!x.answer));paged('Inbox',rows,0,message,()=>desk('','inbox'),m=>m.subject+(m.kind==='decision'&&!m.answer?' — reply needed':''));}
function message(m,returnTo){m.read=true;G.save();screen(m.subject,m.from+'.\n'+(Array.isArray(m.body)?m.body.join('\n'):m.body||'')+(m.outcome?'\nOutcome: '+m.outcome:''),[...(m.kind==='decision'&&!m.answer?(m.options||[]).map(o=>a(o.id,o.label+(o.hint?'. '+o.hint:''),()=>{const result=G.answer(m.id,o.id);if(!m.answer){screen('Response unavailable',String(result),[back(()=>message(m,returnTo))]);return;}screen('Response recorded',m.outcome||'Decision recorded.',[back(returnTo)]);})):[]),a('repeat','Repeat message',()=>message(m,returnTo)),back(returnTo)]);}
function stable(){const opts=[...(s().roster.length?[a('roster','Your wrestlers',()=>paged('Your wrestlers',s().roster,0,profile,stable))]:[]),a('scout','Scout and sign wrestlers',scout),a('coach','Coaching staff',coaches),a('reports','Training reports',trainingReports),back(()=>desk('','stable'))];screen('Your stable',s().roster.length+' of 5 contract places filled.',opts);}
function scout(returnTo=stable,restoreId=null){screen('Find talent','Choose a division. The shortlist is ordered by signing fee; every affordable free agent is available.',D.DIVISION_ORDER.map(div=>a(div,D.DIVISIONS[div].name+' division',()=>scoutList(div,returnTo))).concat(back(returnTo)),{restoreId});}
function scoutList(div,returnTo=stable){const rows=s().free.filter(w=>D.divisionOf(w)===div).sort((x,y)=>x.fee-y.fee);paged('Free agents',rows,0,signProfile,()=>scout(returnTo,div),w=>w.name+' · '+money(w.fee));}
function signProfile(w,returnTo){const f=G.signingForecast(w.id);if(!f){returnTo();return;}const bands=['ring','mic','psych','safe'].map(k=>{const b=G.scoutBand(w,k);return k+': '+(typeof b==='string'?b:Array.isArray(b)?b.join(' to '):b?.label||'estimated');}).join('. ');screen(w.name,w.style+' wrestler. Signing fee '+money(w.fee)+'. Weekly wage '+money(w.wage)+'. Bank after signing '+money(f.afterFee)+'. '+bands,[...(f.affordable?[a('sign','Sign for '+money(w.fee),()=>confirm('Sign '+w.name+'?','Pay '+money(w.fee)+' now and '+money(w.wage)+' each week.','Confirm signing',()=>{const e=G.sign(w.id);if(e){screen('Signing unavailable',e,[back(returnTo)]);return;}desk(w.name+' has joined your stable.');},()=>signProfile(w,returnTo)))]:[]),back(returnTo)],{portrait:w});}
function profile(w,returnTo){
 w=G.W(w.id);if(!w){stable();return;}
 const again=()=>profile(w,returnTo),amb=window.OfficeAmbitions?.view(w.id);
 screen(w.name,w.style+'. '+(w.bio||'')+'\nMorale '+w.morale+', loyalty '+w.loyal+', fatigue '+w.fatigue+'. Ring '+w.ring+', psychology '+w.psych+', safety '+w.safe+', microphone '+w.mic+'. Weekly wage '+money(w.wage)+'. '+(w.injury?'Injured for '+w.injury+' weeks.':'Available for work.')+(amb?'\nWants: '+amb.name+'. '+amb.mood+'. '+amb.progress:'')+(w.promise?.status==='open'?'\nFeatured-match promise due by career week '+w.promise.deadline+'.':''),[
 a('train','Wrestler development',()=>training(w,returnTo)),a('meeting','Private meeting',()=>privateMeeting(w,again)),a('contract','Contract and wages',()=>workerContract(w,again)),back(returnTo)],{portrait:w});
}
function developmentAction(w,method,value,message,returnTo){
 const error=method(w.id,value);
 screen(error?'Not available':'Development updated',error||message,[back(returnTo)],{portrait:G.W(w.id)});
}
function training(w,returnTo){
 w=G.W(w.id);if(!w){stable();return;}
 const again=()=>training(w,returnTo),forecast=G.trainingForecast(w);
 const outlook=forecast?.kind==='skill'?'Projected gain '+forecast.gain+' '+forecast.stat+' points; '+forecast.progress+' percent towards the next point. Fatigue '+forecast.fatigue+'. Injury chance '+forecast.riskPct.toFixed(1)+' percent.':forecast?.kind==='rest'?'Projected fatigue '+forecast.fatigue+'.':forecast?.kind==='promo'?'Projected heat gain '+forecast.heat+'. Fatigue '+forecast.fatigue+'.':'';
 const session=G.sessionOptions(w).find(o=>o.value===w.session);
 screen('Development — '+w.short,'Current focus: '+(D.TRAINING[w.training]?.name||w.training)+'. '+(G.INTENSITY[w.intensity]?.name||'Light drills')+'. '+money(G.trainingCost(w))+' this week. '+outlook+' Further matches may change the forecast.\n'+(w.program?'Active '+w.program.type+', '+w.program.left+' weeks left. ':'')+'Dennis session: '+(session?.label||'none')+'.',[
 a('weekly','Weekly focus and intensity',()=>weeklyTraining(w,again)),
 a('programme','Development programme',()=>developmentProgramme(w,again)),
 a('session','Sessions with Dennis',()=>dennisSessions(w,again)),
 a('advice','Dennis’s assessment',()=>trainingAssessment(w,again)),
 back(()=>profile(w,returnTo))],{portrait:w});
}
function weeklyTraining(w,ret){
 w=G.W(w.id);if(!w){stable();return;}
 const here=()=>weeklyTraining(w,ret);
 const focus=Object.entries(D.TRAINING).map(([id,t])=>({id,name:t.name,blurb:t.blurb||t.desc||''}));
 screen('Weekly training',w.short+': '+(D.TRAINING[w.training]?.name||w.training)+', '+(G.INTENSITY[w.intensity]?.name||'Light drills')+'. '+money(G.trainingCost(w))+' a week. '+(w.program?'The programme locks these settings.':w.injury?'Recovery takes priority while injured.':'Choose a focus or intensity.'),[
 ...(!w.program&&!w.injury?[a('focus','Choose training focus',()=>paged('Training focus',focus,0,(t,r)=>confirm('Change training?',t.name+'. '+t.blurb,'Set '+t.name,()=>developmentAction(w,G.setTraining,t.id,'Focus set to '+t.name+'.',here),r),here,t=>t.name+(t.id===w.training?' — current':''))),
 a('intensity','Choose intensity',()=>paged('Training intensity',Object.entries(G.INTENSITY).map(([id,t])=>({id,...t})),0,(t,r)=>confirm('Change intensity?',t.hint,'Set '+t.name,()=>developmentAction(w,G.setIntensity,t.id,'Intensity set to '+t.name+'.',here),r),here,t=>t.name+' — '+t.hint+(t.id===w.intensity?' — current':'')))]:[]),back(ret)],{portrait:w});
}
function developmentProgramme(w,ret){
 w=G.W(w.id);if(!w){stable();return;}
 const here=()=>developmentProgramme(w,ret);
 if(w.program){screen('Active programme',w.short+' has '+w.program.left+' of '+w.program.total+' weeks remaining. '+w.program.gains+' points gained. '+money(G.trainingCost(w))+' per week.',[a('cancel','End programme early',()=>confirm('End development programme?','Previous costs are not refunded. Ending a camp early costs 3 morale and adds 5 fatigue.','End programme',()=>developmentAction(w,G.cancelProgram,undefined,'Programme ended.',here),here)),back(ret)],{portrait:w});return;}
 const ready=!w.injury&&!['rest','promo'].includes(w.training);
 const rows=[{id:'block3',label:'Three-week block',cost:G.trainingCost(w),weeks:3},{id:'block6',label:'Six-week block',cost:G.trainingCost(w),weeks:6},{id:'camp',label:'Residential camp',cost:185,weeks:3}];
 screen('Development programme',ready?'Commit the current skill focus. Blocks lock focus and intensity; residential camps make the wrestler unavailable for bookings for three weeks.':'Choose a skill focus and wait until the wrestler is fit before starting a programme.',[
 ...(ready?rows.map(x=>a(x.id,x.label+' — '+money(x.cost)+' per week',()=>confirm('Commit '+x.label.toLowerCase()+'?',x.weeks+' weeks, '+money(x.cost)+' per week. '+(x.id==='camp'?'Cannot take bookings during camp.':'Focus and intensity are locked.'),'Confirm programme',()=>developmentAction(w,G.startProgram,x.id,'Programme committed.',here),here))):[]),back(ret)],{portrait:w});
}
function dennisSessions(w,ret){
 w=G.W(w.id);if(!w){stable();return;}
 const used=s().roster.filter(x=>x.session).length,all=G.sessionOptions(w),current=all.find(x=>x.value===w.session);
 const here=()=>dennisSessions(w,ret);
 const select=kind=>{
  const rows=all.filter(x=>!x.disabled&&(kind==='learn'?x.value.startsWith('learn:'):kind==='mic'?x.value.startsWith('mic:'):x.value==='none'||x.value==='rehearse')).map(x=>({...x,id:x.value}));
  paged('Sessions with Dennis',rows,0,(x,r)=>confirm('Set session?',x.label+'. '+x.hint+(x.why?' Dennis: '+x.why:''),'Confirm session',()=>developmentAction(w,G.setSession,x.value,'Session: '+x.label+'.',here),r),here,x=>x.label+(x.value===w.session?' — current':'')+(x.suggested?' — recommended':'')+'. '+x.hint);
 };
 screen('Sessions with Dennis',used+' of '+G.SESSION_CAP+' weekly sessions assigned. '+w.short+': '+(current?.label||'no session')+'. '+(!w.session&&used>=G.SESSION_CAP?'All sessions are booked. Free one up first.':'Sessions are additional to normal training.'),[
 a('rehearse','Rehearsal or cancel session',()=>select('rehearse')),a('learn','Learn wrestling moves',()=>select('learn')),a('mic','Microphone practice',()=>select('mic')),back(ret)],{portrait:w});
}
function trainingAssessment(w,ret){
 w=G.W(w.id);if(!w){stable();return;}
 const rows=G.trainingAdvice(w),here=()=>trainingAssessment(w,ret);
 const methods={focus:G.setTraining,intensity:G.setIntensity,session:G.setSession};
 screen('Dennis’s assessment',rows.map(x=>x.title+'. '+x.why).join('\n'),rows.filter(x=>methods[x.kind]).map(x=>a(x.kind+':'+x.value,'Apply: '+x.title,()=>confirm('Apply recommendation?',x.why,'Apply',()=>developmentAction(w,methods[x.kind],x.value,'Recommendation applied.',here),here))).concat(back(ret)),{portrait:w});
}
function privateMeeting(w,ret){
 w=G.W(w.id);if(!w){stable();return;}
 const here=()=>privateMeeting(w,ret);
 const rows=[{id:'listen',label:'Listen and reassure',hint:'Morale +5, loyalty +4. No promise.'},{id:'promise',label:'Promise a featured match',hint:'Morale +8 now. Deliver a feature or main event within two weeks, or lose 14 morale and 12 loyalty.',disabled:w.promise?.status==='open'},{id:'bonus',label:'Pay £120 loyalty bonus',hint:'Morale +6, loyalty +9. Costs £120 now.',disabled:s().cash<120}];
 screen('Private meeting — '+w.short,'Morale '+w.morale+'. Loyalty '+w.loyal+'. '+s().focus+' management meetings left this week. A private conversation uses one, leaving fewer for promoter negotiations. '+(w.promise?.status==='open'?'A featured-match promise is already open.':''),[
 ...(s().focus>0?rows.filter(x=>!x.disabled).map(x=>a(x.id,x.label+'. '+x.hint,()=>confirm('Private conversation?',x.hint+' Uses one management meeting.',x.label,()=>{const r=G.checkIn(w.id,x.id);screen(r.error?'Meeting unavailable':'Private conversation',r.error||r.text,[back(ret)],{portrait:G.W(w.id)});},here))):[]),back(ret)],{portrait:w});
}
function workerContract(w,ret){
 w=G.W(w.id);if(!w){stable();return;}
 const amb=window.OfficeAmbitions?.view(w.id),raise=window.OfficeAmbitions?.raiseAvailable(w.id),here=()=>workerContract(w,ret);
 screen('Contract — '+w.short,'Weekly wage '+money(w.wage)+'. '+(amb?amb.name+'. '+amb.counts+' '+amb.progress+' '+(amb.words||''):'')+' '+(raise?.error||''),[
 ...(raise&&!raise.error?[a('raise','Increase weekly wage by £40',()=>confirm('Permanent wage increase?',money(w.wage)+' becomes '+money(w.wage+40)+' every week. No one-off payment. Another raise is unavailable for four weeks.','Confirm raise',()=>{const r=OfficeAmbitions.giveRaise(w.id);screen(r.error?'Raise unavailable':'Wage increased',r.error||r.text,[back(here)]);},here))]:[]),
 a('release','Release wrestler',()=>confirm('Release '+w.name+'?','They leave today. No refund. Their bookings are cancelled.','Confirm release',()=>{G.release(w.id);stable();},here)),back(ret)],{portrait:w});
}
function coaches(){
 const c=s().coach&&G.COACHES[s().coach];
 if(c){screen('Coaching staff',c.name+'. '+c.stat+' training boost '+Math.round(c.boost*100)+' percent. '+money(c.wage)+' every week, even if nobody trains that skill.',[a('fire','End coaching contract',()=>confirm('Release coach?','Future wages stop. Hiring fee is not refunded.','End contract',()=>{const e=G.fireCoach();screen('Coaching staff',e||'Contract ended.',[back(coaches)]);},coaches)),back(stable)]);return;}
 const rows=Object.entries(G.COACHES).map(([id,x])=>({id,...x}));
 paged('Specialist coaches',rows,0,(x,ret)=>screen(x.name,x.stat+' training boost '+Math.round(x.boost*100)+' percent. '+money(x.fee)+' to hire, '+money(x.wage)+' per week. Bank '+money(s().cash)+'.',[
 ...(s().cash>=x.fee?[a('hire','Hire specialist',()=>confirm('Hire '+x.name+'?',money(x.fee)+' now and '+money(x.wage)+' every week.','Confirm hire',()=>{const e=G.hireCoach(x.id);screen('Coaching staff',e||'Specialist hired.',[back(coaches)]);},ret))]:[]),back(ret)]),stable,x=>x.name+' — '+money(x.fee)+' upfront');
}
function trainingReports(){
 const rows=(s().trainingReviews||[]).slice().reverse().map(r=>({...r,id:String(r.a),name:'Season '+Math.ceil(r.a/16)+', week '+((r.a-1)%16+1)}));
 paged('Completed training reports',rows,0,(r,ret)=>{
  const entries=(r.entries||[]).map(e=>({...e,id:e.id,name:e.name||e.id}));
  const detail=()=>paged('Wrestler training results',entries,0,(e,backTo)=>screen(e.name,['ring','mic','psych','safe'].map(k=>k+' '+((e.delta?.[k]||0)>=0?'+':'')+(e.delta?.[k]||0)).join('. ')+'. Fatigue change '+(e.delta?.fatigue||0)+'. Cost '+money(e.cost||0)+'. '+(e.notes||[]).join(' '),[back(backTo)]),()=>showReport());
  const showReport=()=>screen(r.name,'Training and promo costs '+money(r.trainingCost||0)+'. Coach wages '+money(r.coachCost||0)+'. These are completed results, not forecasts.',[a('detail','Individual wrestler results',detail),back(ret)]);
  showReport();
 },stable);
}
function offers(){const rows=s().offers.filter(o=>G.offerCandidates(o).length);paged('Available booking offers',rows,0,offer,()=>desk('','offers'),o=>G.P(o.pid).name+' · versus '+G.F(o.rid).name);}
function offer(o,returnTo){const candidates=G.offerCandidates(o);paged(G.P(o.pid).name+' — choose your wrestler',candidates,0,(w,ret)=>offerTerms(o,w,ret),returnTo,w=>w.name+' · '+money(o.programme?OfficeProgrammes.totalPurse(o,w):G.purse(o,w)));}
const FINISH_EXPLANATIONS={win_clean:'Your wrestler is expected to win fairly.',win_dirty:'Your wrestler is expected to win by cheating.',lose_protected:'Your wrestler is expected to lose but still look strong.',lose_clean:'Your wrestler is expected to lose fairly.',win_dq:'Your wrestler is expected to win because the opponent is disqualified.',lose_dq:'Your wrestler is expected to lose by disqualification.'};
function bookingTerms(o,w,terms=o){
 const x={...o,...terms};
 return D.SLOTS[x.slot].name+' match. '+D.FINISHES[x.finish].name+'. '+(FINISH_EXPLANATIONS[x.finish]||'')+' '+(x.stip?OfficeStips.STIPS[x.stip]?.name+'. ':'')+'Purse (match pay) '+money(o.programme?OfficeProgrammes.totalPurse(o,w):G.purse(x,w))+'.';
}
function offerTerms(o,w,returnTo){
 const live=s().offers.find(x=>x.id===o.id),worker=G.W(w.id);
 if(!live||!worker||!G.offerCandidates(live).some(x=>x.id===worker.id)){screen('Offer unavailable','This invitation can no longer be accepted by this wrestler.',[back(returnTo)]);return;}
 o=live;w=worker;
 const p=G.P(o.pid),f=G.F(o.rid),t=o.talk;
 const body=p.name+' wants '+w.name+' against '+f.name+'. '+(o.programme?o.programme.beats.length+' match programme. ':'')+bookingTerms(o,w)+' '+(o.eventAbs===G.abs()?'This week.':'Future week '+o.eventAbs+'.')+' Reply by week '+o.expiresAbs+'.';
 const choices=[];
 if(!t||t.step==='start'||t.step==='done')choices.push(a('book',t?.step==='done'?'Sign current terms':'Accept offered terms',()=>signBooking(o,w,()=>offerTerms(o,w,returnTo))));
 if(!o.programme&&(t||s().focus>0))choices.push(a('talk',t?.step==='done'?'Review negotiation':t&&t.step!=='start'?'Resume negotiation':'Negotiate with '+p.voice,()=>negotiation(o.id,w.id,0,'main','',returnTo)));
 choices.push(back(returnTo));
 screen('Contract offer',body+(!o.programme?' '+s().focus+' management meetings left. Asking for changes uses one meeting; signing as offered does not.':''),choices,{portrait:w});
}
function signBooking(o,w,cancel,revert=false){
 const original=revert?o.talk?.original:null;
 confirm('Sign the booking?', 'Commit '+w.name+' to '+G.P(o.pid).name+'. '+bookingTerms(o,w,original||o),'Sign contract',()=>{
  const current=s().offers.find(x=>x.id===o.id);
  if(!current){screen('Booking unavailable','This invitation is no longer available.',[back(offers)]);return;}
  if(revert){const r=G.talkMove(o.id,w.id,'revert');if(r.error){screen('Booking unavailable',r.error,[back(cancel)]);return;}}
  const e=G.book(o.id,w.id);if(e){screen('Booking unavailable',e,[back(offers)]);return;}
  desk('Booking confirmed for '+w.name+'.');
 },cancel);
}
function leaveNegotiation(oid,wid,returnTo=offers){
 const o=s().offers.find(x=>x.id===oid),w=G.W(wid);
 // Merely opening a discussion never reserves the wrestler or spends a meeting.
 if(o?.talk?.step==='start'){o.talk=null;G.save();}
 if(o&&w)offerTerms(o,w,returnTo);else returnTo();
}
function negotiation(oid,wid,page=0,section='main',extra='',returnTo=offers){
 const r=G.meeting(oid,wid);
 if(r.error){screen('Negotiation unavailable',r.error,[back(returnTo)]);return;}
 const {offer:o,talk:t}=r,w=G.W(wid),p=G.P(o.pid),read=OfficeNegotiationsV2.read(o,w),trades=OfficeNegotiationsV2.tradeOptions(o,w,t);
 const go=(page=0,section='main')=>negotiation(oid,wid,page,section,'',returnTo);
 const reopen=()=>go(page,section),root=()=>go();
 const move=id=>{
  const perform=()=>{
   const x=G.talkMove(oid,wid,id);
   if(x.error){screen('Negotiation',x.error,[back(reopen)]);return;}
   if(x.withdrawn){screen('Invitation withdrawn',x.detail||'The promoter has withdrawn the booking.',[back(returnTo)]);return;}
   root();
  };
  if(id==='reply:walk')confirm('Walk away?', 'This withdraws the invitation. It cannot be undone.','Withdraw from booking',perform,reopen);
  else if(id==='push:hold')confirm('Insist on the full change?', 'Promoter trust will fall by '+read.hardballCost+'. The booking could be withdrawn.','Insist on the full change',perform,reopen);
  else perform();
 };
 const last=t.log?.slice(-2).map(x=>x.who+': '+x.text).join('\n')||'';
 const body=(extra?extra+'\n':'')+last+'\n'+(t.proposal&&t.step!=='done'?'Proposed, not accepted: '+bookingTerms(o,w,t.proposal):'Current unsigned terms: '+bookingTerms(o,w))+'\n'+(t.package?'Exchange: '+t.package.give+' in return for '+t.package.get+'.\n':'')+'Trust '+p.trust+'. '+s().focus+' meetings left.'+(t.step==='start'?' '+read.signal:'')+(t.detail?' '+t.detail:'');
 const leave=()=>leaveNegotiation(oid,wid,returnTo);
 if(section==='history'){
  const rows=t.log||[],pages=Math.max(1,Math.ceil(rows.length/3)),i=Math.max(0,Math.min(page,pages-1));
  screen('Negotiation transcript',rows.slice(i*3,i*3+3).map(x=>x.who+': '+x.text).join('\n')+'\nPage '+(i+1)+' of '+pages,[...(pages>1?[a('next','Next page',()=>go((i+1)%pages,'history'))]:[]),back(root)]);return;
 }
 if(section==='details'){
  screen('Promoter and terms',p.voice+'. '+read.name+'. '+read.priority+'. '+read.evidence+'. '+read.warning+'\nOriginal: '+bookingTerms(o,w,t.original)+'\n'+(t.proposal&&t.step!=='done'?'Proposed, not accepted: '+bookingTerms(o,w,t.proposal):'Current unsigned terms: '+bookingTerms(o,w)),[a('history','Read full conversation',()=>go(0,'history')),back(root)]);return;
 }
 if(section==='stips'||section==='trades'){
  const rows=section==='stips'?Object.entries(OfficeStips.STIPS).map(([id,x])=>({id:'ask:stip:'+id,label:x.name,hint:x.hint+(OfficeStips.tasteOf(p,id)>=8?' '+p.voice+' likes this.':OfficeStips.tasteOf(p,id)<=-8?' '+p.voice+' dislikes this.':'')})):trades.map(x=>({id:'trade:'+x.id,label:x.label,hint:x.hint}));
  const pages=Math.max(1,Math.ceil(rows.length/3)),i=Math.max(0,Math.min(page,pages-1));
  screen(section==='stips'?'Match stipulations':'Concrete exchanges','Choose a request. '+(section==='trades'?'A rejected trade costs one promoter trust. ':'')+'Page '+(i+1)+' of '+pages,rows.slice(i*3,i*3+3).map(x=>a(x.id,x.label+(x.hint?'. '+x.hint:''),()=>move(x.id))).concat(pages>1?[a('next','Next page',()=>go((i+1)%pages,section))]:[],back(root)));return;
 }
 if(t.step==='done'){
  const changed=t.original.slot!==o.slot||t.original.finish!==o.finish||(t.original.stip||null)!==(o.stip||null)||t.original.fee!==G.purse(o,w);
  screen('Negotiation complete',body,[a('sign',changed?'Sign accepted terms':'Sign original terms',()=>signBooking(o,w,root)),...(changed?[a('original','Sign original terms',()=>signBooking(o,w,root,true))]:[]),a('details','Review terms and transcript',()=>go(0,'details')),a('later','Decide later',leave)]);return;
 }
 const opts=OfficeSwitchNegotiation.options(o,t,read,trades,s().focus);
 const pages=Math.max(1,Math.ceil(opts.length/3)),i=Math.max(0,Math.min(page,pages-1));
 const buttons=opts.slice(i*3,i*3+3).map(x=>a(x.id,x.label+(x.hint?'. '+x.hint:''),()=>['stips','trades'].includes(x.id)?go(0,x.id):move(x.id)));
 if(pages>1)buttons.push(a('next','More responses',()=>go((i+1)%pages)));
 buttons.push(a('review','Review or leave discussion',()=>screen('Review discussion','Nothing is booked until you sign.',[a('details','Promoter, terms and transcript',()=>go(0,'details')),...(t.step==='start'?[a('sign','Sign as offered',()=>signBooking(o,w,root))]:t.step!=='done'?[a('original','Keep and sign original terms',()=>confirm('Return to original terms?','Any unaccepted proposal will be discarded. The meeting and trust costs remain.','Keep original terms',()=>{const x=G.talkMove(oid,wid,'reply:original');if(x.error){screen('Negotiation',x.error,[back(root)]);return;}root();},root))]:[]),a('later','Decide later',leave),back(root)])));
 screen('Speaking with '+p.voice,body+(pages>1?' Responses page '+(i+1)+' of '+pages+'.':''),buttons,{kicker:'BOOKING OFFICE · '+p.name.toUpperCase()});
}
function advance(){
 if(G.pending().length){screen('Reply before continuing','There are decisions waiting in your inbox.',[a('inbox','Review inbox',inbox),back(()=>desk())]);return;}
 OfficeTerritory.reconcileOrdinaryTitles();
 if(!s().roster.length&&s().week===1){screen('Build your stable','Sign your first wrestler before continuing.',[a('scout','Find talent',scout),back(()=>desk())]);return;}
 const b=G.officeBrief();
 confirm(s().card.length?'Start match night?':'Advance without a match?',s().card.length+' booked matches. '+b.today.length+' bookable offers this week and '+b.deadline.length+' future offers expiring. Projected bank after costs '+money(b.after)+'.',s().card.length?'Start match night':'Advance week',()=>s().card.length?prepare():endWeek(),()=>desk());
}
function persistPlanning(){
 try{if(planning)localStorage.setItem(PLAN_KEY,JSON.stringify({careerSeed:s().careerSeed,period:G.abs(),plan:planning}));else localStorage.removeItem(PLAN_KEY);planSaveError='';return true;}
 catch(e){planSaveError='Backstage progress could not be saved. Keep this page open.';return false;}
}
function restorePlanning(){
 planning=null;planLoadToken++;
 try{const v=JSON.parse(localStorage.getItem(PLAN_KEY)||'null');
  if(!active&&v&&v.careerSeed===s().careerSeed&&v.period===G.abs()&&s().card.some(c=>c.id===v.plan?.cid)&&v.plan.room?.v===3&&!G.resultRecorded({id:v.plan.cid}))planning=v.plan;
 }catch(e){planSaveError='The saved backstage conversation could not be restored.';}
}
const structureDescriptions={traditional:'Start strong, take the pressure, fight back and reach the finish.',classic_american:'Guided opening, pressure, comeback and payoff.',kings_road:'Technical exchanges, escalation, callback and finish build.',chickenshit_heel:'Avoid, get exposed, use a shortcut, then survive.',dominant_ace:'Take control, absorb a challenge and reassert dominance.'};
function prepare(page=0,manual=false){
 if(s()?.switchAfter||s()?.after?.autonomous){afterScreen();return;}
 if(planning?.room&&s().card.some(c=>c.id===planning.cid)){roomScreen();return;}
 const c=s().card.slice().sort((a,b)=>D.SLOTS[a.slot].rank-D.SLOTS[b.slot].rank)[0];
 if(!c){endWeek();return;}
 const w=G.W(c.wid),f=G.F(c.rid),choices=[{id:'traditional',label:'Traditional'},...OfficeSheets.STRUCTURES.catalogue()],pages=Math.ceil(choices.length/3);
 if(guided()&&!manual){screen('Dennis: shape the match',w.name+' versus '+f.name+'. '+D.FINISHES[c.finish].name+'. The layout is the story of the match, not the winner. A traditional layout is a straightforward starting point. You still make the backstage decisions.',[a('recommended','Use traditional layout',()=>beginRoom(c,null)),a('custom','Choose another match structure',()=>prepare(0,true)),a('pause','Pause',()=>pause(()=>prepare()))],{portrait:w,scene:matchScene(c,w,f,'backstage')});return;}
 screen('Shape the match',w.name+' versus '+f.name+'. '+D.FINISHES[c.finish].name+'. Choose how the match unfolds. This never changes the booked winner. Page '+(page+1)+' of '+pages+'.',choices.slice(page*3,page*3+3).map(x=>a(x.id,x.label+'. '+structureDescriptions[x.id],()=>x.id==='traditional'?beginRoom(c,null):chooseLead(c,x.id,page))).concat(pages>1?[a('next','More structures',()=>prepare((page+1)%pages,true))]:[],back(()=>desk())),{portrait:w,scene:matchScene(c,w,f,'backstage')});
}
function chooseLead(c,id,page){
 const w=G.W(c.wid),f=G.F(c.rid);
 screen('Choose the dramatic lead','Who should shape the story and rhythm of the match? This is not a choice of winner.',[a('w',w.name,()=>beginRoom(c,{id,lead:'w'})),a('f',f.name,()=>beginRoom(c,{id,lead:'f'})),back(()=>prepare(page,true))],{portrait:w});
}
function beginRoom(c,choice){
 const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid),token=++planLoadToken;
 const begin=banks=>{
  if(token!==planLoadToken||active||!s().card.some(x=>x.id===c.id))return;
  const opts={recent:s().roomRecent||[],threads:OfficeRoom.liveThreads(s().roomThreads,c.eventAbs??G.abs()),heat:G.feud(w.id,f.id)?.heat||0,rehearsed:G.rehearsed(w)};
  if(choice)Object.assign(opts,{structure:choice,structurePlanning:true,planningCareer:s(),planningInitiative:true,planningProposal:true,planningDialogue:true,planningBargaining:true,planningSequences:true,planningSequencePolicy:3,planningAdaptiveEntries:true,planningContinuationVersion:1,planningSequenceSigning:true,planningBanks:banks});
  try{planning={cid:c.id,choice,room:OfficeRoom.begin(c,w,f,p,opts)};persistPlanning();roomScreen();}
  catch(e){console.error(e);planning=null;screen('Backstage unavailable','Could not prepare the conversation. Choose a structure to retry.',[back(()=>prepare())]);}
 };
 if(!choice){begin([]);return;}
 screen('Backstage','Preparing the wrestlers’ conversation.',[a('cancel','Cancel',()=>{planLoadToken++;prepare();})],{portrait:w});
 Promise.resolve(OfficePlanningDialogue.loadPair(w,f)).catch(()=>[]).then(begin);
}
function roomText(v,st){
 const latest=v.log.slice(-3).map(x=>x.who+': '+x.text).join('\n');
 const moods=st.w.short+' is '+v.moods.w.word+'. '+st.f.short+' is '+v.moods.f.word+'.';
 return latest+'\n'+v.ask+'\n'+moods;
}
function roomReview(v){
 const b=v.structureBrief;
 return [v.finishPlan?.label?'Finish: '+v.finishPlan.label:'',v.finishPlan?.requirement||'',v.finishPlan?.summary||'',b?b.label+'. '+b.lead+' leads. '+b.approach+'. '+b.focus+'. '+b.advice:'',...(v.review||v.board||[]).map(x=>x.name+': '+(x.current||'Called in the ring')),v.story?.verdict||''].filter(Boolean).join('\n');
}
// On a successful new decision, show only the newly spoken lines. History and
// explicit re-entry retain context; this cursor is never persisted to the career.
function guidedLines(log,previousCount,limit){return previousCount!==null&&previousCount>=0&&previousCount<=log.length?log.slice(previousCount):log.slice(-limit);}
function roomScreen(page=0,section='main',extra='',previousCount=null){
 if(!planning?.room){prepare();return;}
 const st=planning.room,v=OfficeRoom.view(st),c=s().card.find(x=>x.id===planning.cid);
 if(!c){planning=null;persistPlanning();desk('The booked match is no longer available.');return;}
 const scene=matchScene(c,st.w,st.f,'backstage',['Meeting '+v.step+' / '+v.total,st.w.short+': '+v.moods.w.word,st.f.short+': '+v.moods.f.word]);
 const show=(title,body,choices,opts={})=>screen(title,body,choices,{...opts,scene});
 const root=()=>roomScreen(),returnHere=()=>roomScreen(page,section),pauseHere=()=>pause(returnHere);
 const act=(id,stay=false)=>{
  const before=v.log.length;
   try{OfficeRoom.act(st,id);persistPlanning();}
  catch(e){console.error(e);show('Backstage decision','Dennis could not agree that choice. Review the plan before trying again.',[back(returnHere)]);return;}
  roomScreen(0,stay&&st.stage==='board'?section:'main','',before);
 };
 const fmt=o=>o.label+(o.selected?' — selected':'');
 const hint=o=>[o.hint,...(o.tags||[])].filter(Boolean).join(' · ');
 const pageChoices=(rows,fn,backFn)=>{
  const pages=Math.max(1,Math.ceil(rows.length/3)),i=Math.max(0,Math.min(page,pages-1));
  return rows.slice(i*3,i*3+3).map(o=>a(o.id,fmt(o),()=>fn(o),hint(o))).concat(pages>1?[a('next','More options — page '+((i+1)%pages+1),()=>roomScreen((i+1)%pages,section))]:[],[back(backFn)]);
 };
 if(section==='history'){
  const pages=Math.max(1,Math.ceil(v.log.length/3)),i=Math.max(0,Math.min(page,pages-1));
  show('Backstage conversation',v.log.slice(i*3,i*3+3).map(x=>x.who+': '+x.text).join('\n')+'\nPage '+(i+1)+' of '+pages,[...(pages>1?[a('next','Next page',()=>roomScreen((i+1)%pages,'history'))]:[]),back(root)]);return;
 }
 if(section==='more'){
  show('Backstage options','Your current plan is saved when storage is available. No match time passes here.',[a('history','Read full conversation',()=>roomScreen(0,'history')),a('pause','Pause / settings',pauseHere),back(root)]);return;
 }
 const body=(extra?extra+'\n':'')+(guided()&&!planning.fullRoom?guidedLines(v.log,previousCount,2).map(x=>x.who+': '+x.text).join('\n')+'\n'+v.ask:roomText(v,st));
 const assisted=guided()&&!planning.fullRoom;
 const detailed=()=>{planning.fullRoom=true;persistPlanning();root();};
 if(assisted&&section==='main'&&v.stage==='plan'){
  const candidates=v.options||[],recommended=guidePlan(st.w,st.promoter,candidates);
  const preview=JSON.parse(JSON.stringify(st));
  if(recommended)OfficeRoom.act(preview,recommended.id);
  const proposed=OfficeRoom.view(preview),description=[proposed.finishPlan?.summary,...(proposed.board||[]).map(x=>x.name+': '+(x.current||'called in the ring'))].filter(Boolean).join('. ');
  show('Dennis: suggested layout',v.ask+' '+(st.w.fatigue>=78||st.w.injury?'Condition is poor, so protect the wrestler with a safer match if possible. ':'')+(recommended?recommended.label+'. '+recommended.hint:'')+' '+description,[
   ...(recommended?[a('approve','Use '+recommended.label+' and Dennis’s running order',()=>{
    OfficeRoom.act(st,recommended.id);
    if(OfficeRoom.view(st).options.some(x=>x.id==='board_ok'))OfficeRoom.act(st,'board_ok');
    persistPlanning();root();
   })]:[]),a('custom','Plan the details myself',detailed),a('pause','Pause',pauseHere)],{portrait:st.w});return;
 }
 if(assisted&&section==='main'&&v.stage==='review'&&v.options.some(x=>x.id==='review_ok')){
  show('Dennis: final agreement',body+'\n'+roomReview(v)+'\nApprove the agreed finish and send them out with a calm reminder to work safely, or adjust it yourself.',[
   a('approve','Approve & go to the microphone',()=>{OfficeRoom.act(st,'review_ok');if(OfficeRoom.view(st).options.some(x=>x.id==='talk_calm'))OfficeRoom.act(st,'talk_calm');if(st.stage==='done'&&st.sheet?.signed){planning.onMic=true;persistPlanning();preMatch();}else{persistPlanning();root();}},'Approve the layout and give a calm safety reminder.'),
   a('custom','Review or change the details',detailed),a('pause','Pause',pauseHere)],{portrait:st.w});return;
 }
 if(v.stage==='done'){
  const sh=st.sheet;
  show('Match layout signed',body+'\n'+(sh?.premise||'')+'\n'+v.agreed.join('. ')+'. '+(OfficeSigning.eligible(c)?'A public contract signing is next.':sh?.skipPromo?'No promo tonight.':'Choose the microphone segment next.'),[a('ring',OfficeSigning.eligible(c)?'To the contract signing':sh?.skipPromo?'Go to ringside':'To the microphone',()=>{planning.onMic=true;persistPlanning();preMatch();}),a('history','Review conversation',()=>roomScreen(0,'history')),a('pause','Pause',pauseHere)],{portrait:st.w});return;
 }
 if(v.stage==='board'){
  if(assisted&&section==='main'&&v.options.some(x=>x.id==='board_ok')){
   show('Dennis: agree the running order',v.ask+'\n'+roomReview(v),[a('agree','Accept the suggested running order',()=>act('board_ok')),a('custom','Change the finish or called spots',detailed),a('pause','Pause',pauseHere)],{portrait:st.w});return;
  }
  if(section==='finish'){
   show('Choose the finishing route',body+'\n'+(v.finishPlan?.summary||''),pageChoices(v.finishes||[],o=>act(o.id,true),root),{portrait:st.w});return;
  }
  if(section==='objectives'){
   const rows=v.board.map(r=>({id:r.slot,label:r.name,hint:r.current||'Called in the ring'}));
   show(st.structurePlanning?'Dramatic objectives':'Called spots','Choose an objective to edit.\n'+rows.map(r=>r.label+': '+r.hint).join('\n'),pageChoices(rows,o=>roomScreen(0,'objective:'+o.id),root));return;
  }
  if(section.startsWith('objective:')){
   const row=v.board.find(r=>r.slot===section.slice(10));
   if(!row){root();return;}
   const rows=row.cards.map(o=>({...o,hint:o.who+'’s idea'}));
   show(row.name,row.ask+'\nCurrently: '+(row.current||'Called in the ring')+'.\n'+v.log.slice(-2).map(x=>x.who+': '+x.text).join('\n'),pageChoices(rows,o=>act(o.id,true),()=>roomScreen(0,'objectives')));return;
  }
  show(v.title,body+'\n'+roomReview(v),[
   ...(v.finishes?.length?[a('finish','Choose finishing route',()=>roomScreen(0,'finish'))]:[]),
   a('objectives',st.structurePlanning?'Edit dramatic objectives':'Edit called spots',()=>roomScreen(0,'objectives')),
   a('agree','Agree finish and running order',()=>act('board_ok')),
   a('more','Conversation / pause',()=>roomScreen(0,'more'))
  ],{portrait:st.w});return;
 }
 const text=v.stage==='review'?body+'\n'+roomReview(v):body;
 const rows=v.options||[],pages=Math.max(1,Math.ceil(rows.length/3)),i=Math.max(0,Math.min(page,pages-1));
 const choices=rows.slice(i*3,i*3+3).map(o=>a(o.id,fmt(o),()=>act(o.id),hint(o)));
 if(pages>1)choices.push(a('next','More responses — page '+((i+1)%pages+1),()=>roomScreen((i+1)%pages)));
 choices.push(a('more','Conversation / pause',()=>roomScreen(0,'more')));
 show(v.title,text+(pages>1?'\nPage '+(i+1)+' of '+pages+'.':''),choices,{portrait:st.w});
}
function switchLadder(c){
 try{const div=D.divisionOf(c.rid),r=OfficeTerritory.promotionRank(c.pid,div),holder=OfficeTerritory.title(c.pid,div)?.holder;
 const at=id=>{const i=r.findIndex(x=>x.id===id);return i<0?null:{rank:i+1,slot:r[i].slot,stable:r[i].stable||null};};
 return {size:r.length,w:at(c.wid),f:at(c.rid),champ:holder===c.wid?'w':holder===c.rid?'f':null,champName:G.P(c.pid)?.name+' '+D.DIVISIONS[div].name+' Champion',belt:c.title?D.belt(c.title.pid,c.title.div)?.name:null};
 }catch(e){return null;}
}
// The existing pre-match scene engines remain the authority for choices and effects.
function preMatch(page=0,section='main',previousCount=null){
 const P=planning,c=P&&s().card.find(x=>x.id===P.cid);
 if(!c||!P.room?.sheet?.signed){roomScreen();return;}
 const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid),SG=OfficeSegments,MP=OfficeMouthpiece;
 const scene=matchScene(c,w,f,'promo',['Layout signed']);
 const show=(title,body,choices,opts={})=>screen(title,body,choices,{...opts,scene});
 const root=()=>preMatch(),here=()=>preMatch(page,section);
 const pauseHere=()=>pause(here);
 const label=x=>x.label;
 const hint=x=>[x.hint,...(x.tags||[]),x.risk].filter(Boolean).join(' · ');
 const pick=(title,body,rows,select,backFn=null)=>{
  const pages=Math.max(1,Math.ceil(rows.length/3)),i=Math.max(0,Math.min(page,pages-1));
  const list=rows.slice(i*3,i*3+3).map(x=>a(x.id,label(x),()=>select(x),hint(x)));
  if(pages>1)list.push(a('next','More choices — page '+((i+1)%pages+1),()=>preMatch((i+1)%pages,section)));
  list.push(a('more',backFn?'Back':'Pause / settings',backFn||pauseHere));
  show(title,body+(pages>1?'\nPage '+(i+1)+' of '+pages+'.':''),list,{portrait:w,kicker:'PRE-MATCH · '+p.name.toUpperCase()});
 };
 const load=(ids,create)=>{
  const token=++planLoadToken;
  show('Preparing the microphone','Loading the wrestlers’ dialogue.',[a('pause','Pause',()=>{planLoadToken++;pause(root);})],{portrait:w});
  Promise.resolve().then(()=>OfficePromoBanks.load(ids.filter(Boolean))).catch(()=>[]).then(banks=>{
   if(token!==planLoadToken||planning!==P||active||!s().card.some(x=>x.id===c.id))return;
   try{create(banks);persistPlanning();root();}
   catch(e){console.error(e);show('Microphone unavailable','The conversation could not be prepared. Retry without advancing the match.',[a('retry','Retry',root),a('pause','Pause',pauseHere)]);}
  });
 };
 const seconds=OfficeRingside.seconds(c,w,f);
 if(P.corner===undefined){
  const available=seconds.filter(x=>!x.refuse);
  if(!available.length){P.corner='none';persistPlanning();}
  else if(section.startsWith('corner:')){
   const person=available.find(x=>x.id===section.slice(7));if(!person){root();return;}
   const jobs=person.jobs.map(id=>({id,label:OfficeRingside.JOBS[id].label,hint:OfficeRingside.JOBS[id].hint,tags:OfficeRingside.JOBS[id].tags}));
   pick(person.short+' — ringside role',person.note||'Choose what they will try to do at ringside.',jobs,x=>{P.corner=person.id+':'+x.id;persistPlanning();root();},root);return;
  }else{
   const rows=[{id:'none',label:'Nobody',hint:w.short+' walks out alone.'},...available.map(x=>({id:x.id,label:x.short,hint:x.note||'Available to accompany '+w.short+'.'}))];
   const refused=seconds.filter(x=>x.refuse).map(x=>x.refuse).join(' ');
   pick('Choose a ringside companion','Dennis: Who goes out with '+w.short+'? '+refused,rows,x=>{if(x.id==='none'){P.corner='none';persistPlanning();root();}else preMatch(0,'corner:'+x.id);});return;
  }
 }
 const arc=OfficeProgrammeArcs.options(c);
 if(arc&&!P.arcChoice){pick(arc.title,(arc.follow||'')+' '+arc.ask+' Programme chapter '+(arc.step+1)+' of '+arc.total+'.',arc.choices,x=>{P.arcChoice=x.id;persistPlanning();root();});return;}
 let kind,st,api;
 if(OfficeSigning.eligible(c)){
  if(!P.signing){P.signing=OfficeSigning.begin(c,w,f,p);persistPlanning();}
  kind='signing';st=P.signing;api=OfficeSigning;
 }else if(P.room.sheet.skipPromo){startMatch(c,P,null);return;}
 else{
  if(!P.segment&&guided()&&!P.fullPromo){
   const presets=[
    {id:'crowd',type:'solo',picks:['crowd','story','walk'],label:'Win over the crowd',hint:'Tell a true story and finish without making a promise.'},
    {id:'rival',type:'solo',picks:['rival','threat','walk'],label:'Stoke the rivalry',hint:'Address the opponent and make a threat. Feud heat may rise.'},
    {id:'tape',type:'vignette',picks:['road','intense','tight'],label:'Run a short recorded promo',hint:'A focused, lower-risk pre-taped segment; less potential impact than a live promo.'}
   ];
   if(w.mic<40)presets.unshift(presets.pop());
   const direct=presets;
   show('Dennis: what is the message?',SG.advice(c,w,f)+' Choose the direction and let '+w.short+' deliver it, or direct each individual line.',[
    ...direct.map(x=>a(x.id,x.label,()=>{P.quickPromo={...x,at:0};P.segment=x.type;persistPlanning();root();},x.hint)),
    a('duel','Face off with '+f.short,()=>{P.segment='duel';persistPlanning();root();},'Trade words with your opponent. You choose the responses.'),
    a('custom','More segments / full control',()=>{P.fullPromo=true;persistPlanning();root();}),a('pause','Pause',pauseHere)],{portrait:w,kicker:'PRE-MATCH · '+p.name.toUpperCase()});return;
  }
  if(!P.segment){
   pick('Choose a microphone segment','A promo is a speech or interview to entertain the fans and build interest in the match. Dennis: '+SG.advice(c,w,f),SG.menu(c,w,f,p),x=>{P.segment=x.id;persistPlanning();root();});return;
  }
  if(P.segment!=='duel'){
   if(!P.seg){
    if(SG.BANKED.has(P.segment)){load([OfficePromoIdentity.bankId(w)||w.id],banks=>{P.seg=SG.begin(P.segment,c,w,f,p,{banks});});return;}
    P.seg=SG.begin(P.segment,c,w,f,p,{banks:[]});persistPlanning();
   }
   kind='segment';st=P.seg;api=SG;
  }else{
   const talkers=!P.promo?MP.candidates(c,w):[];
   if(talkers.length&&!P.mouth){
    const rows=[{id:'none',label:w.short+' speaks for themselves',hint:'Own voice, microphone skill '+w.mic+'.'},...talkers.filter(x=>!x.refuse).map(x=>({id:x.id,label:x.short+' does the talking',hint:'Microphone skill '+x.mic+'. '+(x.note||'')+' '+(x.ego||'')}))];
    pick('Who has the microphone?','A mouthpiece speaks, but '+w.short+' is held to the words.',rows,x=>{P.mouth=x.id;persistPlanning();root();});return;
   }
   const mouth=P.mouth&&P.mouth!=='none'?MP.pick(c,w,P.mouth):null;
   const bid=x=>OfficePromoIdentity.bankId(x)||x.id;
   if(!P.promo){
    load([bid(mouth||w),bid(f)],banks=>{
     const arcIntro=OfficeProgrammeArcs.intro(c,P.arcChoice);
     P.promo=OfficeMic.begin(c,w,f,G.feud(w.id,f.id),P.room.sheet,p,{mouth,mouthProfile:mouth?G.W(mouth.id):null,arc:arcIntro,directed:true,formats:true,dialogue:true,authored:true,banks,composition:true,semantic:true,fuzzy:true,fuzzyEmotion:true,fuzzyPacing:true,fuzzyAudience:true,fuzzyBalance:true});
     const intro=window.OfficeRivalry?.introFor(P.promo.core);
     if(intro&&P.promo.openingQuestion){P.promo.log[0].line=intro;P.promo.openingQuestion={...P.promo.openingQuestion,kind:'record',prompt:intro};}
     else if(intro)P.promo.log[0].line=P.promo.director?.format?P.promo.log[0].line+' '+intro:arcIntro?arcIntro.prompt+' '+intro:intro;
    });return;
   }
   if(P.promo.authoredDialogue&&!Array.isArray(P.promo.authoredDialogue.banks)&&P.promo.stage!=='done'){
    load([bid(P.promo.speaker||w),bid(f)],banks=>{P.promo.authoredDialogue.banks=banks;});return;
   }
   kind='duel';st=P.promo;api=OfficeMic;
  }
 }
 if(kind==='segment'&&P.quickPromo&&st.stage!=='done'){
  const q=P.quickPromo;
  try{
   while(st.stage!=='done'&&q.at<q.picks.length){
    const id=q.picks[q.at];
    if(!api.view(st).options.some(x=>x.id===id)||!api.choose(st,id))throw Error('Preset response unavailable');
    q.at++;persistPlanning();
   }
  }catch(e){console.error(e);P.quickPromo=null;P.fullPromo=true;persistPlanning();root();return;}
 }
 const v=api.view(st),entries=v.log.map(e=>({who:e.speaker||e.who||'Stage',text:e.line||e.text||''})),done=v.stage==='done';
 const renderEntries=rows=>rows.map(e=>e.who+': '+e.text).join('\n');
 if(section==='history'){
  const pages=Math.max(1,Math.ceil(entries.length/3)),i=Math.max(0,Math.min(page,pages-1));
  show('Microphone transcript',renderEntries(entries.slice(i*3,i*3+3))+'\nPage '+(i+1)+' of '+pages,[...(pages>1?[a('next','Next page',()=>preMatch((i+1)%pages,'history'))]:[]),back(root)]);return;
 }
 if(section==='more'){
  show('Microphone options','Your conversation is saved. No match time passes here.',[a('history','Read the full conversation',()=>preMatch(0,'history')),a('pause','Pause / settings',()=>pause(root)),back(root)]);return;
 }
 const result=done?api.result(st):null;
 const mood=kind==='duel'?'Crowd: '+v.meterWord+'.':kind==='signing'?'Tension: '+v.tensionWord+'.':v.meter.label+': '+v.meter.word+'.';
 scene.read=[mood,kind==='segment'?'Segment '+Math.min(v.round+1,v.total)+' / '+v.total:kind==='signing'?'Contract signing':'Face to face'];
 const context=[...(v.read||[]),v.cue,v.unresolved,v.conversation?.subject?'Subject: '+v.conversation.subject:null,v.conversation?.latestPoint,v.claim?.thesis?'Your argument: '+v.claim.thesis:null,v.claim?.evidence,...(v.record||[])].filter(Boolean).join('\n');
 const reconciliation=result?OfficeRoom.promoReconciliation(P.room.sheet,result,w,f,c.finish):null;
 const body=renderEntries(guided()&&!P.fullPromo?guidedLines(entries,previousCount,2):entries.slice(-3))+'\n'+mood+'\n'+(done?[result?.reaction,result?.hook,result?.tactic?.stake,reconciliation?'Dennis: '+reconciliation.reason:null].filter(Boolean).join('\n'):[v.help,context].filter(Boolean).join('\n'));
 const title=kind==='signing'?'Contract signing — '+v.name:kind==='duel'?(v.conversation?.formatName||'Promo duel')+' — '+v.name:v.name+' — '+v.heading;
 if(done){const parts=P.quickPromo?[...entries.filter(e=>e.text).map(e=>({text:e.text})),{text:[result?.reaction,result?.hook,reconciliation?'Dennis: '+reconciliation.reason:null].filter(Boolean).join(' ')}]:null;show(title,body,[a('ring','Ring the bell',()=>startMatch(c,P,result)),a('history','Review conversation',()=>preMatch(0,'history')),a('pause','Pause',pauseHere)],{portrait:w,kicker:'PRE-MATCH · '+p.name.toUpperCase(),speechParts:parts});return;}
 const rows=v.options||[],pages=Math.max(1,Math.ceil(rows.length/3)),i=Math.max(0,Math.min(page,pages-1));
 const buttons=rows.slice(i*3,i*3+3).map(x=>a(x.id,label(x),()=>{
  try{api.choose(st,x.id);persistPlanning();preMatch(0,'main',entries.length);}
  catch(e){console.error(e);show('Microphone decision','That response could not be completed. Review the conversation and retry.',[back(root)]);}
 },hint(x)));
 if(pages>1)buttons.push(a('next','More responses — page '+((i+1)%pages+1),()=>preMatch((i+1)%pages)));
 buttons.push(a('more','Conversation / pause',()=>preMatch(0,'more')));
 show(title,body+(pages>1?'\nPage '+(i+1)+' of '+pages+'.':''),buttons,{portrait:w,kicker:'PRE-MATCH · '+p.name.toUpperCase()});
}
function startMatch(c,P,promoRes=null){
 const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid),prep={...w.prep},focus=D.TRAINING[w.training]?.stat,st=P.room,sh=st.sheet;
 if(!sh?.signed){roomScreen();return;}
 let structureExecution,matchSheet;
 try{matchSheet=OfficeRingside.attach(OfficeRoom.addVow(sh,promoRes,w,f,c.finish),c,P.corner);structureExecution=OfficeSheets.STRUCTURES.executionChoice(matchSheet,P.choice);}
 catch(e){console.error(e);screen('Layout not ready','The signed structure could not be verified. Review the backstage conversation.',[back(()=>roomScreen())]);return;}
 if(focus&&!w.injury)prep[focus]=(prep[focus]||0)+(w.intensity==='hard'?2:w.intensity==='standard'?1.5:.6);
 const fatigue=w.training==='rest'||w.training==='promo'?0:w.program?.type==='camp'?8:w.intensity==='hard'?15:w.intensity==='standard'?5:0;
 OfficeProgrammeArcs.prepare(c,P.arcChoice,promoRes);G.save();
 const match=X.create({w:{...w,fatigue:G.clamp(w.fatigue+fatigue)},f,p,ladder:switchLadder(c),slot:c.slot,minutes:sh.minutes||c.minutes,finish:c.finish,stip:c.stip||null,feudHeat:Math.max(c.feudHeat||0,G.feud(w.id,f.id)?.heat||0),blowoff:c.blowoff,promo:promoRes,plan:{game:sh.game,leash:sh.leash||(w.psych>=75&&w.ego<75?'free':'script'),talk:sh.talk||'none'},preparation:prep,flags:{...w.flags,...sh.flags},memory:OfficeMemory.context(w.id,f.id),sheet:matchSheet,livePsychologyVersion:structureExecution?1:undefined,sequenceTimingVersion:structureExecution?1:undefined,sequenceDependencyVersion:structureExecution?1:undefined,sequenceHandoverVersion:structureExecution?1:undefined,sequenceRecoveryProjectionVersion:structureExecution?1:undefined,sequenceRecoveryPacingVersion:structureExecution?1:undefined,sequenceAlternativeReadinessVersion:structureExecution?1:undefined,bigSpotArbitrationVersion:3,structureExecution,identity:G.normaliseIdentity(s().identity),seed:Math.floor(Math.random()*2**31)});
 OfficeRivalCorner.attach(match,c);active={cid:c.id,M:match};const saved=persistMatch();if(saved){planning=null;persistPlanning();}if(guided()&&V.getSettings().ttsEnabled)startBroadcast();else matchScreen('The bell is about to ring.');
}
function contextualAdvice(m,canCall){
 if(m.stage!=='live'||m.done||m.decision||m.queue.length||m.calls<=0||m.t<45)return null;
 const st=m.switchAdvice||{},last=st.lastAt??-Infinity,remaining=m.len-m.t;
 if((st.count||0)>=4||m.t-last<65||remaining<=20)return null;
 const seen=st.seen||{},worker=m.w.short||m.w.name,crowd=Math.round(m.crowd),energy=Math.round(m.wSt);
 const propose=(id,title,body,calls)=>{
  if(seen[id]!==undefined)return null;
  const legal=calls.filter(x=>canCall(m,x)).slice(0,2);
  return legal.length?{id,title,body,calls:legal}:null;
 };
 const candidates=[];
 if(m.offScript)candidates.push(()=>propose('layout','They have gone off the layout',worker+' is '+(m.offScript==='showboat'?'playing to the crowd instead of following the plan.':'calling audibles rather than sticking to the agreement.')+' Do we trust their judgement or pull them back?', ['sheet']));
 if(energy<=35||m.workingHurt)candidates.push(()=>propose('tired','Your wrestler is struggling',worker+' has '+energy+' percent stamina'+(m.workingHurt?' and is working hurt.':'.')+' We can ease the pace'+(remaining>45?' or ask them to bring it home.':'.'),['slow','home']));
 if(crowd<=35||m.crowdPeak-crowd>=12)candidates.push(()=>propose('crowd','The crowd is cooling', 'Crowd reaction is '+crowd+' out of 100'+(m.crowdPeak-crowd>=12?', down from '+Math.round(m.crowdPeak):'')+'. Do we work the audience or change the pace?', ['crowd',...(energy>=50?['pickup']:['slow'])]));
 if(m.mom<=-32&&energy>=40&&remaining>65)candidates.push(()=>propose('pressure',worker+' is under pressure','The opponent has the momentum. Do we ask for a quicker exchange or let the wrestlers find their own comeback?', ['pickup']));
 if(m.mom>=28&&energy>=55&&remaining>65&&!m.bigSpotRequest)candidates.push(()=>propose('opening','There may be an opening for a big moment',worker+' has the momentum and '+energy+' percent stamina. A big move is possible, not guaranteed.', ['big','crowd']));
 if(remaining<=Math.max(75,m.len*.25)&&remaining>45&&energy<55)candidates.push(()=>propose('finish','The finish is approaching',worker+' has '+energy+' percent stamina. Ask them to finish sooner, or protect their energy and let the agreed finish play out.', ['home','slow']));
 for(const candidate of candidates){const q=candidate();if(q)return q;}
 return null;
}
function recordAdvice(m,q){
 const st=m.switchAdvice??={seen:{},count:0};
 st.seen??={};st.seen[q.id]=m.t;st.count=(st.count||0)+1;st.lastAt=m.t;st.pending=q;persistMatch();
}
function adviceScreen(q,note='',commentary=[],replay=false){
 const m=active?.M,c=m&&s().card.find(x=>x.id===active.cid);
 if(!c)return desk();
 if(m.done||m.decision||!guided()||!V.getSettings().ttsEnabled){if(m.switchAdvice)delete m.switchAdvice.pending;persistMatch();matchScreen(note,commentary,true);return;}
 const legal=q.calls.filter(id=>X.canCall(m,id));
 if(!legal.length){delete m.switchAdvice.pending;persistMatch();startBroadcast();return;}
 const resume=id=>{
  if(id&&!X.canCall(m,id)){matchScreen('That instruction is no longer available.');return;}
  delete m.switchAdvice.pending;
  if(id)X.call(m,id);
  persistMatch();startBroadcast();
 };
 const choices=[a('broadcast','Let them wrestle',()=>resume(null),'Keep your remaining calls for later.'),
  ...legal.map(id=>a(id,X.CALLS[id].name,()=>resume(id),X.CALLS[id].hint)),
  a('pause','Pause / settings',()=>pause(()=>adviceScreen(q,note,commentary)))];
 const status='Calls left: '+m.calls+'.';
 const speech='Dennis. '+q.title+'. '+q.body+' '+status;
 screen('Dennis: '+q.title,q.body+' '+status+(note?'\n\n'+note:''),choices,{scene:liveScene(m,c),kicker:'LIVE FROM RINGSIDE · DENNIS',speechParts:replay?boothSpeech.parts(commentary,speech):[{text:speech}]});
}
function ringStatus(m){return X.fmt(m.t)+' · '+m.w.name+' stamina '+Math.round(m.wSt)+' percent. '+m.f.name+' stamina '+Math.round(m.fSt)+' percent. Crowd '+Math.round(m.crowd)+' out of 100. '+momentumText(m)+'. Calls left '+m.calls+'.';}
function matchScreen(note='',commentary=[],played=false,readStatus=false){
 const m=active.M,c=s().card.find(x=>x.id===active.cid);
 if(!c){active=null;persistMatch();desk('The match is no longer on the card.');return;}
 const scene=liveScene(m,c);
 const status=ringStatus(m);
 const narration=(tail)=>played?(tail?[{text:tail}]:null):commentary.length?boothSpeech.parts(commentary,tail):null;
 const replay=()=>matchScreen(note,commentary);
 const replayOption=commentary.length?[a('replay','Replay commentary',replay)]:[];
 if(m.done&&(!guided()||!V.getSettings().ttsEnabled||!m.queue.length)){screen('The final bell',status+' '+(note||''),[a('result','Review result',settleMatch),...replayOption,a('pause','Pause',()=>pause(()=>matchScreen(note,commentary,true)))],{scene,speechParts:narration('The final bell. '+status)});return;}
 if(m.decision&&!m.queue.length){const d=m.decision;screen(d.title,(note?note+'\n':'')+d.body+'\n'+status,d.options.map(o=>a(o.id,o.label+'. '+o.hint,()=>{X.resolve(m,o.id);persistMatch();if(guided()&&V.getSettings().ttsEnabled)startBroadcast();else burst(1);})).concat(replayOption,a('pause','Pause',()=>pause(()=>matchScreen(note,commentary,true)))),{scene,speechParts:narration(d.title+'. '+d.body+' '+status)});return;}
 if(guided()&&V.getSettings().ttsEnabled&&m.switchAdvice?.pending){adviceScreen(m.switchAdvice.pending,note,commentary);return;}
 if(guided()&&V.getSettings().ttsEnabled){
  screen('At ringside',(note?note+'\n\n':'')+status,[
   a('broadcast','Continue live broadcast',startBroadcast),
   ...(Object.keys(X.CALLS).some(id=>X.canCall(m,id))?[a('calls','Give a ringside instruction',()=>calls(note,commentary))]:[]),
   a('status','Read match status',()=>matchScreen(note,commentary,true,true)),
   ...replayOption,
   a('pause','Pause / settings',()=>pause(()=>matchScreen(note,commentary,true)))],{kicker:'LIVE FROM RINGSIDE',portrait:m.w,scene,speechParts:narration(readStatus?status:played?'Ringside. Continue listening, give an instruction if available, or pause.':''),announce:true});return;
 }
 screen('At ringside',(note?note+'\n\n':'')+status,[a('line','Hear next commentary',()=>burst(1)),a('burst','Continue — up to five commentary lines',()=>burst(5)),...(Object.keys(X.CALLS).some(id=>X.canCall(m,id))?[a('calls','Give a ringside instruction',()=>calls(note,commentary))]:[]),a('status',commentary.length?'Replay commentary / status':'Repeat match status',()=>commentary.length?replay():matchScreen()),a('pause','Pause',()=>pause(()=>matchScreen(note,commentary,true)))],{kicker:'LIVE FROM RINGSIDE',portrait:m.w,scene,speechParts:narration(''),announce:!played});
}
// Pull just one commentary line from the real engine at a time. A pause
// finishes that line, never simulates the next one, and retains a replay window.
function startBroadcast(){
 if(!active)return;
 broadcastStopRequested=false;broadcastHeld.clear();
 const run=active,m=run.M;let recent=[];
 if(m.switchAdvice?.pending){delete m.switchAdvice.pending;persistMatch();}
 const display=lines=>lines.map(l=>(D.BOOTH?.[l.who]?.short?D.BOOTH[l.who].short+': ':'')+l.text).join('\n');
 const finish=()=>{broadcastHeld.clear();matchScreen(display(recent),recent,true);};
 const nextLine=()=>{
  if(active!==run)return;
  if(broadcastStopRequested||(!m.queue.length&&(m.done||m.decision))){finish();return;}
  const line=X.next(m);
  if(!line){finish();return;}
  recent=[...recent,line].slice(-3);persistMatch();
  screen('Live broadcast',display(recent),[a('pause','Pause after this line',requestBroadcastPause)],{portrait:m.w,kicker:'LIVE FROM RINGSIDE',scene:liveScene(m,s().card.find(x=>x.id===run.cid)),speechParts:boothSpeech.parts([line]),onSpeechComplete:result=>{
   if(active!==run)return;
   if(result?.reason!=='end'){
    finish();
    $('saveNotice').textContent=[saveNotice(),'Speech stopped. Replay commentary or continue.'].filter(Boolean).join(' ');return;
   }
   if(broadcastStopRequested||(!m.queue.length&&(m.done||m.decision))){finish();return;}
   const advice=contextualAdvice(m,X.canCall);
   if(advice){broadcastHeld.clear();recordAdvice(m,advice);adviceScreen(advice,display(recent),recent);return;}
   nextLine();
  }});
 };
 nextLine();
}
function burst(n){const m=active.M,lines=[];for(let i=0;i<n&&(!m.done||m.queue.length);i++){if(m.decision&&!m.queue.length)break;const l=X.next(m);if(!l)break;lines.push(l);}persistMatch();matchScreen(lines.map(l=>(D.BOOTH?.[l.who]?.short?D.BOOTH[l.who].short+': ':'')+l.text).join('\n'),lines);}
function calls(note='',commentary=[],page=0){
 const m=active.M,c=s().card.find(x=>x.id===active.cid),list=Object.entries(X.CALLS).filter(([id])=>X.canCall(m,id));
 const pages=Math.max(1,Math.ceil(list.length/3)),i=Math.min(Math.max(0,page),pages-1);
 const rows=list.slice(i*3,i*3+3).map(([id,v])=>a(id,v.name,()=>{
  if(!X.canCall(m,id)){matchScreen('That instruction is no longer available.',commentary,true);return;}
  X.call(m,id);persistMatch();if(guided()&&V.getSettings().ttsEnabled)startBroadcast();else burst(1);
 },v.hint));
 if(pages>1)rows.push(a('next','More instructions — page '+((i+1)%pages+1),()=>calls(note,commentary,(i+1)%pages)));
 rows.push(back(()=>matchScreen(note,commentary,true)));
 screen('Ringside instructions',ringStatus(m)+' '+(list.length?'Choose an instruction. A wrestler may ignore you.':'No instructions currently available.'),rows,{scene:liveScene(m,c),kicker:'LIVE FROM RINGSIDE'});
}
function settleMatch(){const m=active.M,c=s().card.find(x=>x.id===active.cid);if(!c||!m.done)return matchScreen();const fin={...m.final,log:m.log.map(({t,text,kind,big,who,actionId})=>({t,text,kind,big,who,actionId}))};let cons;G.atomicSettlement(()=>{cons=G.applyResult(c,fin);cons.push(...OfficeRingside.settle(c,m),...OfficeRivalCorner.settle(c,m));const h=s().history.find(x=>x.cid===c.id),report=OfficeSheets.report(m),structure=X.structureReport(m);if(report){if(h)h.sheet=report;if(structure){if(h){h.structure=JSON.parse(JSON.stringify(structure));if(fin.structureAssessment)h.structureAssessment=JSON.parse(JSON.stringify(fin.structureAssessment));}const n=structure.objectives.filter(o=>['achieved','adapted'].includes(o.status)).length;cons.push({text:'Dramatic structure: '+n+' of '+structure.objectives.length+' objectives witnessed in the ring.',tone:0});}else{cons.push({text:'Match layout: '+report.achieved+' performed, '+report.adapted+' adapted, '+report.missed+' missed.',tone:report.missed>2?-1:1});if(report.achieved>=3&&report.missed===0&&fin.stars>=3.5)OfficeMemory.remember(m.w.id,'chemistry',m.w.short+' remembers how well the agreed match with '+m.f.short+' came together.',m.f.id,3,4,c.id+':chemistry');if(report.missed>=3)OfficeMemory.remember(m.w.id,'sheet_changes',m.w.short+' remembers how far the match departed from the agreed match layout against '+m.f.short+'.',m.f.id,-2,0,c.id+':sheet');}}if(m.o.sheet?.situations)s().roomRecent=[...(s().roomRecent||[]),...m.o.sheet.situations].slice(-6);if(h){h.stip=c.stip||null;h.consequences=cons.map(x=>({text:x.text,tone:x.tone??0}));h.notes??=[];for(const effect of h.consequences)if(!h.notes.includes(effect.text))h.notes.push(effect.text);}const contract={id:c.id,wid:c.wid,rid:c.rid,pid:c.pid,slot:c.slot,finish:c.finish,...(c.programme?{programme:{id:c.programme.id,step:c.programme.step}}:{})};const captured=OfficeAfter.capture(fin,h);const scene=OfficeAfter.prepareAutonomous(contract,captured,c.afterPlan);s().switchAfter={period:G.abs(),c:contract,fin:captured,plan:c.afterPlan??null,scene:scene||null,reviewPending:!!scene,summary:m.w.name+' versus '+m.f.name+'. '+fin.stars+' stars.\n'+cons.map(x=>x.text).join('\n')};G.save();});active=null;planning=null;if(G.saveStatus().ok!==false){persistMatch();persistPlanning();}afterScreen();}
// Post-bell state is part of the same career commit as the settled match.
let afterLoadToken=0;
function afterRecord(){
 const st=s().after?.autonomous;
 if(!s().switchAfter&&st){s().switchAfter={period:G.abs(),c:st.c,fin:st.fin,plan:null,scene:st,summary:'A compulsory post-match incident remains unresolved.'};G.save();}
 return s().switchAfter;
}
function finishAfter(next){
 const record=afterRecord();
 if(!record)return desk();
 if(s().after?.autonomous||(record.scene&&record.scene.stage!=='done')){afterScreen();return;}
 G.atomicSettlement(()=>{delete s().switchAfter;});
 if(next&&s().card.length)prepare();else if(next)endWeek();else desk();
}
function afterScreen(page=0,section='main'){
 const record=afterRecord();if(!record){desk();return;}
 const root=()=>afterScreen(),here=()=>afterScreen(page,section);
 const nextLabel=s().card.length?'Prepare next match':'Finish the week';
 if(section==='result'){const h=s().history.find(x=>x.cid===record.c?.id);if(h)matchReport(h,root);else screen('Match result',record.summary,[back(root)]);return;}
 if(!record.scene||record.reviewPending){
  const h=s().history.find(x=>x.cid===record.c?.id),review=h?matchOverview(h,s()):null;
  const details=h?[a('details','Full match report',()=>matchReport(h,root))]:[];
  const next=a('next',nextLabel,()=>finishAfter(true)),angle=a('angle','Choose a post-match segment',()=>openAfterScene(record));
  const options=record.scene?[a('continue','Continue to post-match incident',()=>{record.reviewPending=false;G.save();root();}),...details]:[...(guided()?[next,angle]:[angle,next]),...details,a('desk','Return to desk',()=>finishAfter(false))];
  screen(review?.title||'Match result',review?.lines.join('\n')||record.summary,options.concat(a('pause','Pause',()=>pause(root))),{kicker:'AFTER THE BELL'});return;
 }
 const st=record.scene,v=OfficeAfter.view(st),w=G.W(st.c.wid)||D.findWrestler(st.c.wid);
 if(!st.dialogue&&['angle','mic'].includes(st.stage)&&!record.dialogueAttempted){openAfterScene(record);return;}
 const log=v.log.map(x=>(x.who?x.who+': ':'')+x.text);
 if(section==='history'){
  const pages=Math.max(1,Math.ceil(log.length/3)),i=Math.max(0,Math.min(page,pages-1));
  screen('Post-match transcript',log.slice(i*3,i*3+3).join('\n')+'\nPage '+(i+1)+' of '+pages,[...(pages>1?[a('next','Next page',()=>afterScreen((i+1)%pages,'history'))]:[]),back(root)]);return;
 }
 if(section==='more'){screen('Post-match options','No match time passes here.',[a('history','Read full transcript',()=>afterScreen(0,'history')),a('result','Review match result',()=>afterScreen(0,'result')),a('pause','Pause / settings',()=>pause(root)),back(root)]);return;}
 const body=log.slice(-3).join('\n')+'\n'+v.ask+(v.cons.length?'\n'+v.cons.map(x=>x.text).join('\n'):'');
 if(v.stage==='done'){screen('After the bell — complete',body,[a('next',nextLabel,()=>finishAfter(true)),a('desk','Return to desk',()=>finishAfter(false)),a('more','Review result or transcript',()=>afterScreen(0,'more'))],{portrait:w,kicker:'AFTER THE BELL'});return;}
 const rows=v.options||[],pages=Math.max(1,Math.ceil(rows.length/3)),i=Math.max(0,Math.min(page,pages-1));
 const choices=rows.slice(i*3,i*3+3).map(x=>a(x.id,x.label+(x.hint?'. '+x.hint:'')+(x.tags?.length?' · '+x.tags.join(', '):''),()=>{
  try{G.atomicSettlement(()=>{
    const current=s().switchAfter?.scene;if(!current||current.cid!==st.cid||current.stage!==v.stage)throw Error('Stale scene');
    const action=v.stage==='angle'?OfficeAfter.choose:v.stage==='follow'?OfficeAfter.continueAngle:OfficeAfter.speak;
    if(!action(current,x.id))throw Error('Choice unavailable');
   });root();}
  catch(e){console.error(e);screen('Post-match decision','The response could not be completed. No partial consequences were saved.',[back(root)]);}
 }));
 if(pages>1)choices.push(a('next','More responses — page '+((i+1)%pages+1),()=>afterScreen((i+1)%pages)));
 choices.push(a('more','Conversation / pause',()=>afterScreen(0,'more')));
 screen(v.title,(st.required?'Required response. ':'')+body+(pages>1?'\nPage '+(i+1)+' of '+pages+'.':''),choices,{portrait:w,kicker:'AFTER THE BELL'});
}
function openAfterScene(record){
 const token=++afterLoadToken,c=record.c,w=G.W(c.wid)||D.findWrestler(c.wid),f=G.F(c.rid)||D.findWrestler(c.rid);
 screen('After the bell','Preparing the post-match conversation.',[a('pause','Pause',()=>{afterLoadToken++;pause(()=>afterScreen());})],{portrait:w});
 Promise.resolve().then(()=>OfficePlanningDialogue.loadPair(w,f)).catch(()=>[]).then(banks=>{
  if(token!==afterLoadToken||s()?.switchAfter!==record||record.period!==G.abs())return;
  try{
   G.atomicSettlement(()=>{
    record.scene??=OfficeAfter.begin(c,record.fin,record.plan);
    if(!record.scene)throw Error('Scene unavailable');
    OfficeAfter.attachDialogue(record.scene,banks);record.dialogueAttempted=true;
   });afterScreen();
  }catch(e){console.error(e);screen('Post-match segment unavailable','Retry without advancing the week.',[a('retry','Retry',()=>afterScreen()),a('pause','Pause',()=>pause(()=>afterScreen()))]);}
 });
}

// Reports are presentation only. The engine's settled records are the authority.
function ratingText(n){return Number.isFinite(n)?n.toFixed(2).replace(/0+$/,'').replace(/\.$/,'')+' stars':'Rating unavailable';}
function resultText(h){
 const actual=h.outcome||'booked';
 if(actual==='nc')return 'No contest.';
 if(actual==='double')return h.name+' won against the agreed finish.';
 if(actual==='dq')return h.name+' was disqualified; '+h.foe+' won.';
 if(actual!=='booked'||!D.FINISHES[h.finish])return 'Finish not recorded.';
 const winner=D.FINISHES[h.finish].win?h.name:h.foe;
 return winner+' won'+(/_dq$/.test(h.finish)?' by disqualification':'')+'.';
}
function matchTitleChanges(h,state){
 const period=(h.season-1)*16+h.week;
 return (state.territory?.titleLog||[]).filter(x=>x.week===period&&x.how==='match'&&x.pid===h.pid&&h.wid&&h.rid&&((x.from===h.rid&&x.to===h.wid)||(x.from===h.wid&&x.to===h.rid))).map(x=>(x.to===h.wid?h.name:h.foe)+' won '+(D.belt?.(x.pid,x.div)?.name||'the championship')+'.');
}
function matchOverview(h,state){
 const ratings=(state.seasonResults||[]).filter(x=>x.season===h.season&&Number.isFinite(x.stars));
 const index=ratings.findIndex(x=>x.cid&&x.cid===h.cid);
 const bestBefore=index>0?Math.max(...ratings.slice(0,index).map(x=>x.stars)):null;
 const seasonBest=index>0&&Number.isFinite(h.stars)&&h.stars>bestBefore;
 const titles=matchTitleChanges(h,state);
 const title=titles.length?'Championship changed hands':h.stars>=4?'Four-star performance!':seasonBest?'New season best!':h.stars>=3?'A solid performance':'Match result';
 const lines=[h.name+' versus '+h.foe+(h.promoter?' at '+h.promoter:'')+'.',ratingText(h.stars)+'. '+resultText(h)];
 if(typeof h.contractHonoured==='boolean')lines.push(h.contractHonoured?'The agreed finish was delivered.':'The agreed finish was not delivered.');
 if(Number.isFinite(h.purse))lines.push('Purse received: '+money(h.purse)+'.');
 if(Number.isFinite(h.crowd))lines.push('Final crowd reaction: '+Math.round(h.crowd)+' out of 100.');
 if(seasonBest)lines.push('New best match of the season so far, improving on '+ratingText(bestBefore)+'.');
 lines.push(...titles);
 return {title,lines};
}
function matchReport(h,ret){
 const review=matchOverview(h,s()),notes=[...new Set([...(h.notes||[]),...(h.consequences||[]).map(x=>x.text)].filter(Boolean))];
 const details=[];
 if(h.sheet&&['achieved','adapted','missed'].every(k=>Number.isFinite(h.sheet[k])))details.push('Agreed layout: '+h.sheet.achieved+' performed, '+h.sheet.adapted+' adapted, '+h.sheet.missed+' missed.');
 if(h.structure?.objectives?.length)details.push(...h.structure.objectives.map(x=>(x.label||x.name||'Dramatic objective')+': '+x.status+'.'));
 if(h.bookedFinish&&D.FINISHES[h.bookedFinish])details.push('Booked finish: '+D.FINISHES[h.bookedFinish].name+'.');
 const lines=[...new Set([...details,...notes])];
 const show=()=>screen(review.title,review.lines.join('\n'),[
  ...(lines.length?[a('details','What changed after the match',()=>reportPages('Match consequences',lines,show))]:[]),
  ...(h.log?.length?[a('history','Review commentary',()=>reportPages('Match commentary',h.log.map(x=>(D.BOOTH?.[x.who]?.short?D.BOOTH[x.who].short+': ':'')+x.text),show))]:[]),back(ret)],{kicker:'AFTER THE BELL'});
 show();
}
function reportPages(title,lines,ret,page=0){
 const pages=Math.max(1,Math.ceil(lines.length/3)),i=Math.max(0,Math.min(page,pages-1));
 screen(title,lines.slice(i*3,i*3+3).join('\n')+(pages>1?'\nPage '+(i+1)+' of '+pages+'.':''),[
  ...(i+1<pages?[a('next','Next page',()=>reportPages(title,lines,ret,i+1))]:[]),
  ...(i>0?[a('previous','Previous page',()=>reportPages(title,lines,ret,i-1))]:[]),back(ret)]);
}
function buildWeekReview(state,period,season,week,preCash,preRep){
 const matches=(state.history||[]).filter(h=>h.season===season&&h.week===week);
 const best=matches.filter(h=>Number.isFinite(h.stars)).reduce((a,b)=>!a||b.stars>a.stars?b:a,null);
 const ledger=(state.books||[]).find(b=>b.a===period),training=(state.trainingReviews||[]).find(r=>r.a===period);
 const summary=[matches.length?matches.length+' match'+(matches.length===1?'':'es')+' completed.':'No matches this week.'];
 if(best)summary.push('Best match: '+best.name+' versus '+best.foe+', '+ratingText(best.stars)+'.');
 if(matches.length&&matches.every(h=>Number.isFinite(h.purse)))summary.push('Match purses received: '+money(matches.reduce((n,h)=>n+h.purse,0))+'.');
 summary.push('Bank balance: '+money(state.cash)+'. Reputation: '+state.rep+'.');
 const detail=[];
 if(ledger)detail.push('Weekly wages: '+money(ledger.wages)+'. Other weekly costs: '+money(ledger.other)+'.');
 if(ledger?.switchSupport>0)detail.push('Relaxed career support: '+money(ledger.switchSupport)+'. This is support, not match earnings.');
 if(Number.isFinite(preCash)&&Number.isFinite(state.cash))detail.push('Bank before weekly settlement: '+money(preCash)+'. After settlement: '+money(state.cash)+'.');
 if(Number.isFinite(preRep)&&Number.isFinite(state.rep)&&preRep!==state.rep)detail.push('Reputation changed from '+preRep+' to '+state.rep+' during weekly settlement.');
 for(const e of training?.entries||[]){
  const gains=['ring','mic','psych','safe'].filter(k=>e.delta?.[k]>0).map(k=>({ring:'ring skill',mic:'microphone',psych:'psychology',safe:'safety'}[k])+' +'+e.delta[k]);
  if(gains.length)detail.push(e.name+' improved: '+gains.join(', ')+'.');
  if(e.injuryBefore>0&&e.injuryAfter===0)detail.push(e.name+' recovered from injury during training settlement.');
  if(e.injuryAfter>e.injuryBefore)detail.push(e.name+' has an injury: '+e.injuryAfter+' weeks remaining after training settlement.');
 }
 const titleLines=[...new Set(matches.flatMap(h=>matchTitleChanges(h,state)))];
 const highlights=[...titleLines];
 if(ledger?.switchSupport>0)highlights.push('Relaxed career support of '+money(ledger.switchSupport)+' kept the bank at £750.');
 if(best?.stars>=4)highlights.push('Four-star performance this week!');
 if(season===1&&week===4&&state.monthReview)highlights.push(state.monthReview.passed?'First-month target achieved. The backer invested £450.':'First-month target not achieved. No investment this time; the campaign continues.');
 const seasonLetter=(state.inbox||[]).find(m=>m.subject==='Season '+season+' review'&&m.season===season);
 if(week===16&&seasonLetter)highlights.push(...(Array.isArray(seasonLetter.body)?seasonLetter.body:[seasonLetter.body]).filter(Boolean));
 const injuries=(state.roster||[]).filter(w=>w.injury>0).map(w=>w.name+' is currently unavailable for '+w.injury+' week'+(w.injury===1?'':'s')+'.');
 detail.push(...injuries);
 const pending=(state.inbox||[]).filter(m=>m.kind==='decision'&&!m.answer).length;
 if(pending)detail.push(pending+' inbox decision'+(pending===1?' needs':'s need')+' a reply.');
 if(state.over)summary.push('The career has ended. Review the final accounts before returning to the main menu.');
 return {period,season,week,summary,highlights,detail,pending:true};
}
function weeklyReview(ret=null){
 const r=s().switchWeekReview;
 if(!r){if(ret)ret();else desk();return;}
 const show=()=>weeklyReview(ret);
 const proceed=()=>{if(r.pending){r.pending=false;G.save();}if(ret)ret();else desk();};
 screen('Week '+r.week+' complete — Season '+r.season,[...r.summary,...r.highlights].join('\n'),[
  a('continue',ret?'Back':s().over?'Review career end':'Continue to the office',proceed),
  ...(r.detail.length?[a('details','Accounts and wrestler development',()=>reportPages('Weekly review details',r.detail,show))]:[]),
  a('results','This week’s match reports',()=>results(show,{season:r.season,week:r.week})),a('pause','Pause',()=>pause(show))]);
}
function careerProgress(){
 const state=s(),goals=G.goalList(),achieved=goals.filter(g=>g.done&&g.id!=='solvent').length;
 const ratings=(state.seasonResults||[]).filter(h=>h.season===state.season&&Number.isFinite(h.stars));
 const best=ratings.length?Math.max(...ratings.map(h=>h.stars)):null;
 const lines=['Season '+state.season+', week '+state.week+'. '+difficultyName(state)+' career. '+state.roster.length+' wrestlers under contract.',ratings.length+' recorded matches this season.'+(best!==null?' Best: '+ratingText(best)+'.':''),achieved+' of '+goals.filter(g=>g.id!=='solvent').length+' performance objectives currently met.',...goals.map(g=>g.id==='solvent'?'Financial objective: '+g.text+'. Current balance '+money(state.cash)+'.':(g.done?'Achieved: ':'Still to achieve: ')+g.text+'.')];
 if(state.monthReview)lines.push(state.monthReview.passed?'First-month investment secured.':'First-month investment was not secured.');
 screen('Career progress',lines.join('\n'),[...(state.switchWeekReview?[a('review','Latest weekly review',()=>weeklyReview(careerProgress))]:[]),a('results','Recent match reports',()=>results(careerProgress)),back(more)]);
}
function endWeek(){
 if(s()?.switchAfter||s()?.after?.autonomous){afterScreen();return;}
 if(s().card.length||active||G.pending().length){desk('Finish booked matches and inbox decisions first.');return;}
 const period=G.abs(),season=s().season,week=s().week,preCash=s().cash,preRep=s().rep;
 G.atomicSettlement(()=>{G.endWeek();s().switchWeekReview=buildWeekReview(s(),period,season,week,preCash,preRep);});
 weeklyReview();
}
function results(returnTo=more,filter=null){
 const rows=s().history.filter(h=>!filter||(h.season===filter.season&&h.week===filter.week)).slice(0,20).map((h,i)=>({...h,id:h.cid||String(i)}));
 paged(filter?'This week’s match reports':'Recent results',rows,0,matchReport,returnTo,h=>h.name+' v '+h.foe+' — '+ratingText(h.stars));
}
M.subscribe(()=>{if(refreshSettings)refreshSettings();});
V.onSettingsChange(()=>{if(refreshSettings)refreshSettings();});
const duringNarration=(handler)=>e=>{
 const lock=narrationLock,k=e.code==='NumpadEnter'?'Enter':e.code;
 if(lock&&['Space','Enter'].includes(k)){
  e.preventDefault();
  if(e.type==='keydown'&&!e.repeat)lock.held.add(k);
  if(e.type==='keyup'&&lock.held.delete(k)){
   if(lock.continuous&&k==='Enter')requestBroadcastPause();
   else if(lock.skippable){stopNarration();input.cancel();}
  }
  return;
 }
 handler(e);
};
document.addEventListener('keydown',duringNarration(input.down));document.addEventListener('keyup',duringNarration(input.up));document.addEventListener('narbe-input-cancelled',()=>{input.cancel();if(narrationLock){narrationLock.held.clear();scan.setSuspended(true);}});window.addEventListener('blur',()=>{broadcastHeld.clear();boothSpeech.cancel();input.cancel({resetGuard:true});});document.addEventListener('visibilitychange',()=>{if(document.hidden){broadcastHeld.clear();boothSpeech.cancel();input.cancel({resetGuard:true});}});window.addEventListener('pagehide',e=>{broadcastHeld.clear();boothSpeech.cancel();input.cancel({resetGuard:true});V.cancel();if(!e.persisted)scan.dispose();});
mainMenu();
})();