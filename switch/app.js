/* Separate switch presentation: actual OfficeGame and OfficeMatch APIs, no desktop UI. */
(function(){
'use strict';
const G=window.OfficeGame,D=window.OfficeData,X=window.OfficeMatch,M=window.NarbeScanManager,V=window.NarbeVoiceManager;
const $=id=>document.getElementById(id),a=(id,label,run)=>({id,label,run}),money=G.money;
const MATCH_KEY='the-office-switch-match-v1';
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
function saveNotice(){return [G.saveStatus().ok===false?'Career could not be saved. Keep this page open.':'',saveError].filter(Boolean).join(' ');}
function highlight(item,state){
 for(const x of items){x.element.classList.toggle('scan',x.id===item?.id);if(x.id===item?.id)x.element.dataset.braked=String(!!state.braked||!!state.brakePaused);else delete x.element.dataset.braked;}
 $('controls').textContent=M.getSettings().autoScan?'ONE SWITCH · Enter selects · '+M.getScanInterval()/1000+' second scan':'TWO SWITCHES · Space moves · Enter selects';
 if(item?.element&&!state.suspended)item.element.scrollIntoView({block:'nearest',inline:'nearest'});
}
const scan=M.createChoiceScan({choice:true,holdThreshold:600,statusHost:$('parkStatus'),getId:x=>x.id,getLabel:x=>x.label,getElement:x=>x.element,onHighlight:highlight,onSelect:choose,speak:t=>V.speak(t)});
input=window.OfficeChoiceInput.create({scan,manager:M,holdThreshold:600});
function choose(item){if(!item||!items.some(x=>x===item))return;try{item.run();}catch(e){console.error(e);screen('Office notice','The action could not be completed. Your career remains available.',[a('back','Return to the office',()=>s()?desk():mainMenu())]);}}
function screen(title,body,choices,{restoreId=null,fresh=true,portrait=null,announce=true,kicker='DENNIS · YOUR ASSISTANT'}={}){
 if(fresh){input.cancel();refreshSettings=null;}
 $('heading').textContent=title;$('story').textContent=body;$('kicker').textContent=kicker;$('careerStatus').textContent=summary();$('saveNotice').textContent=saveNotice();
 $('portrait').hidden=!portrait;if(portrait){$('face').src='assets/portraits/'+portrait.id+'.png';$('face').alt=portrait.name;}
 items=choices.map(x=>{const element=document.createElement('button');element.type='button';element.textContent=x.label;const item={...x,element};element.onclick=()=>{input.cancel();choose(item);};return item;});
 $('choices').replaceChildren(...items.map(x=>x.element));if(fresh)scan.open(items,{restoreId});else scan.setItems(items);
 if(announce)scan.announceCurrent(title+'. '+body);
}
const back=(fn)=>a('back','Back',fn);
function confirm(title,body,yes,fn,cancel){screen(title,body,[a('cancel','Cancel',cancel),a('confirm',yes,fn)]);}
function mainMenu(restoreId=null){
 const has=G.hasSave();
 screen('Main menu','Run your own wrestling stable. Sign talent, make bookings and manage matches at your own pace.',[
 ...(has?[a('continue','Continue career',()=>{if(G.load()){restoreMatch();desk();}else screen('Save unavailable','Your saved career could not be opened.',[back(mainMenu)]);})]:[]),
 a('new','New career',()=>has?confirm('New career?','This replaces only your Switch Edition career. The regular game is unaffected.','Start new career',newIdentity,()=>mainMenu('new')):newIdentity()),
 a('help','How to play',()=>help(()=>mainMenu('help'))),a('settings','Settings',()=>settings(()=>mainMenu('settings'))),a('exit','Exit game',()=>exit(()=>mainMenu('exit')))
 ],{restoreId});
}
function newIdentity(){identity=G.suggestIdentity();identityScreen();}
function identityScreen(){screen('Meet the new boss',identity.manager+' · '+identity.stable+'. You can choose another identity or begin with this one.',[a('start','Start career',()=>{active=null;persistMatch();G.fresh(identity);desk('The keys are yours. You have £2,250 and an empty stable. Sign your first wrestler.');}),a('another','Suggest another identity',()=>{identity=G.suggestIdentity();identityScreen();}),back(()=>mainMenu('new'))]);}
function help(returnTo){screen('How to play','Sign a wrestler, review offers, book matches and choose training. On match night choose a game plan, then advance commentary or give ringside instructions. The simulation waits for each choice. Space advances and Enter selects in two-switch mode. In one-switch mode the highlight moves automatically and Enter selects. Pause and settings are always available at decision screens.',[a('repeat','Repeat instructions',()=>help(returnTo)),back(returnTo)]);}
function exit(returnTo){confirm('Exit game?',window.parent===window?'Return to the main menu? Your career is kept.':'Return to the Hub? Your career is kept.','Exit game',()=>{mainMenu();if(window.parent!==window){input.cancel({resetGuard:true});V.cancel();window.parent.postMessage({action:'focusBackButton'},'*');}},returnTo);}
function pause(returnTo){returnFromPause=returnTo;screen('Pause','Your game is waiting. No match time passes here.',[a('continue','Continue',returnTo),a('settings','Settings',()=>settings(()=>pause(returnTo))),a('help','Help',()=>help(()=>pause(returnTo))),a('menu','Main menu',()=>mainMenu()),a('exit','Exit game',()=>exit(()=>pause(returnTo)))]);}
function settings(returnTo,fresh=true){
 screen('Settings','Access settings are shared with other compatible NARBE games on this origin.',[
 a('tts','Text to speech: '+(V.getSettings().ttsEnabled?'On':'Off'),()=>{V.toggleTTS();settings(returnTo,false);}),
 a('voice','Voice: '+V.getVoiceDisplayName(V.getCurrentVoice()),()=>{V.cycleVoice();settings(returnTo,false);}),
 a('auto','Auto scan: '+(M.getSettings().autoScan?'On — One switch':'Off — Two switches'),()=>{if(M.getSettings().autoScan)confirm('Use two switches?','You need Space to move the highlight and Enter to select. Cancel if you only use one switch.','Use two switches',()=>{M.setAutoScan(false);settings(returnTo);},()=>settings(returnTo));else{M.setAutoScan(true);settings(returnTo,false);}}),
 a('speed','Scan speed: '+M.getScanInterval()/1000+' seconds',()=>{M.cycleScanSpeed();settings(returnTo,false);}),
 back(returnTo)],{fresh,announce:fresh});
 refreshSettings=()=>settings(returnTo,false);
}
function desk(note='',restoreId=null){
 if(active){matchScreen(note);return;}
 if(s().over){screen('Career ended','Your career has ended. You can review the final balance or start again.',[a('new','Main menu',()=>mainMenu()),a('pause','Pause',()=>pause(()=>desk()))]);return;}
 const n=G.pending().length,b=G.officeBrief();
 const list=[a('inbox',n?'Inbox — '+n+' decisions waiting':'Inbox',()=>inbox()),a('stable',s().roster.length?'Manage your stable':'Sign your first wrestler',()=>stable()),a('offers','Booking offers — '+(b.today.length+b.deadline.length)+' urgent',()=>offers()),a('week',s().card.length?'Prepare for match night':'Advance the week',()=>advance()),a('more','More office options',()=>more())];
 screen('Your desk',(note?note+'\n\n':'')+s().identity.stable+'. '+s().roster.length+' wrestlers under contract. '+s().card.length+' matches booked. '+n+' messages need a decision. '+money(b.after)+' projected bank balance after signed purses and costs.',list,{restoreId});
}
function more(){screen('More office options',summary(),[a('finances','Finances and objectives',finances),a('results','Recent results',()=>results()),a('pause','Pause / settings',()=>pause(()=>more())),back(()=>desk('','more'))]);}
function finances(){screen('Finances and objectives','Bank '+money(s().cash)+'. Weekly wages '+money(G.wages())+'. Overheads '+money(G.overhead())+'. Training '+money(G.trainingBill())+'.\n'+G.goalList().map(x=>(x.done?'Complete: ':'Open: ')+x.text).join('\n'),[back(more),a('pause','Pause',()=>pause(finances))]);}
function paged(title,rows,page,open,returnTo,describe=x=>x.name){
 const count=3,pages=Math.max(1,Math.ceil(rows.length/count));page=Math.max(0,Math.min(pages-1,page));
 screen(title,rows.length?rows.length+' entries. Page '+(page+1)+' of '+pages+'.':'Nothing to review.',[
 ...rows.slice(page*count,page*count+count).map(x=>a(x.id,describe(x),()=>open(x,()=>paged(title,rows,page,open,returnTo,describe)))),
 ...(pages>1?[a('next','Next page',()=>paged(title,rows,(page+1)%pages,open,returnTo,describe))]:[]),
 back(returnTo)],{});
}
function inbox(){const rows=[...s().inbox].sort((x,y)=>Number(y.kind==='decision'&&!y.answer)-Number(x.kind==='decision'&&!x.answer));paged('Inbox',rows,0,message,()=>desk('','inbox'),m=>m.subject+(m.kind==='decision'&&!m.answer?' — reply needed':''));}
function message(m,returnTo){m.read=true;G.save();screen(m.subject,m.from+'.\n'+(Array.isArray(m.body)?m.body.join('\n'):m.body||'')+(m.outcome?'\nOutcome: '+m.outcome:''),[...(m.kind==='decision'&&!m.answer?(m.options||[]).map(o=>a(o.id,o.label+(o.hint?'. '+o.hint:''),()=>{const result=G.answer(m.id,o.id);if(!m.answer){screen('Response unavailable',String(result),[back(()=>message(m,returnTo))]);return;}screen('Response recorded',m.outcome||'Decision recorded.',[back(returnTo)]);})):[]),a('repeat','Repeat message',()=>message(m,returnTo)),back(returnTo)]);}
function stable(){const opts=[...(s().roster.length?[a('roster','Your wrestlers',()=>paged('Your wrestlers',s().roster,0,profile,stable))]:[]),a('scout','Scout and sign wrestlers',scout),back(()=>desk('','stable'))];screen('Your stable',s().roster.length+' of 5 contract places filled.',opts);}
function scout(){screen('Find talent','Choose a division. The shortlist is ordered by signing fee; every affordable free agent is available.',D.DIVISION_ORDER.map(div=>a(div,D.DIVISIONS[div].name+' division',()=>scoutList(div))).concat(back(stable)));}
function scoutList(div){const rows=s().free.filter(w=>D.divisionOf(w)===div).sort((x,y)=>x.fee-y.fee);paged('Free agents',rows,0,signProfile,scout,w=>w.name+' · '+money(w.fee));}
function signProfile(w,returnTo){const f=G.signingForecast(w.id);if(!f){scout();return;}const bands=['ring','mic','psych','safe'].map(k=>{const b=G.scoutBand(w,k);return k+': '+(typeof b==='string'?b:Array.isArray(b)?b.join(' to '):b?.label||'estimated');}).join('. ');screen(w.name,w.style+' wrestler. Signing fee '+money(w.fee)+'. Weekly wage '+money(w.wage)+'. Bank after signing '+money(f.afterFee)+'. '+bands,[...(f.affordable?[a('sign','Sign for '+money(w.fee),()=>confirm('Sign '+w.name+'?','Pay '+money(w.fee)+' now and '+money(w.wage)+' each week.','Confirm signing',()=>{const e=G.sign(w.id);if(e){screen('Signing unavailable',e,[back(returnTo)]);return;}desk(w.name+' has joined your stable.');},()=>signProfile(w,returnTo)))]:[]),back(returnTo)],{portrait:w});}
function profile(w,returnTo){screen(w.name,w.style+'. Morale '+w.morale+', fatigue '+w.fatigue+', ring skill '+w.ring+', psychology '+w.psych+'. '+(w.injury?'Injured for '+w.injury+' weeks.':'Available for work.'),[a('train','Choose training',()=>training(w,returnTo)),a('rest','Set rest for the week',()=>{const e=G.setTraining(w.id,'rest');screen('Training',e||w.name+' will rest.',[back(()=>profile(w,returnTo))]);}),back(returnTo)],{portrait:w});}
function training(w,returnTo){const list=Object.entries(D.TRAINING).filter(([k])=>k!=='rest').map(([k,t])=>({id:k,name:t.name}));paged('Training focus',list,0,(t,ret)=>confirm('Train '+w.name+'?',t.name+' training carries the usual weekly cost.','Set '+t.name,()=>{const e=G.setTraining(w.id,t.id);screen('Training',e||'Training set to '+t.name,[back(()=>profile(w,returnTo))]);},ret),()=>profile(w,returnTo));}
function offers(){const rows=s().offers.filter(o=>G.offerCandidates(o).length);paged('Available booking offers',rows,0,offer,()=>desk('','offers'),o=>G.P(o.pid).name+' · versus '+G.F(o.rid).name);}
function offer(o,returnTo){const candidates=G.offerCandidates(o);paged(G.P(o.pid).name+' — choose your wrestler',candidates,0,(w,ret)=>offerTerms(o,w,ret),returnTo,w=>w.name+' · '+money(o.programme?OfficeProgrammes.totalPurse(o,w):G.purse(o,w)));}
function offerTerms(o,w,returnTo){const p=G.P(o.pid),f=G.F(o.rid),fee=o.programme?OfficeProgrammes.totalPurse(o,w):G.purse(o,w);screen('Contract offer',p.name+' wants '+w.name+' against '+f.name+'. '+(o.programme?o.programme.beats.length+' match programme.':D.FINISHES[o.finish].name+'. '+D.SLOTS[o.slot].name+' match.')+' Purse '+money(fee)+'. '+(o.eventAbs===G.abs()?'This week.':'Future week '+o.eventAbs+'.')+' This preview accepts the offered terms; bargaining is not yet available.',[a('book','Accept offered terms',()=>confirm('Sign the booking?','Commit '+w.name+' to '+p.name+'.','Sign contract',()=>{const e=G.book(o.id,w.id);if(e){screen('Booking unavailable',e,[back(()=>offers())]);return;}desk('Booking confirmed for '+w.name+'.');},()=>offerTerms(o,w,returnTo))),back(returnTo)],{portrait:w});}
function advance(){
 if(G.pending().length){screen('Reply before continuing','There are decisions waiting in your inbox.',[a('inbox','Review inbox',inbox),back(()=>desk())]);return;}
 OfficeTerritory.reconcileOrdinaryTitles();
 if(!s().roster.length&&s().week===1){screen('Build your stable','Sign your first wrestler before continuing.',[a('scout','Find talent',scout),back(()=>desk())]);return;}
 const b=G.officeBrief();
 confirm(s().card.length?'Start match night?':'Advance without a match?',s().card.length+' booked matches. '+b.today.length+' bookable offers this week and '+b.deadline.length+' future offers expiring. Projected bank after costs '+money(b.after)+'.',s().card.length?'Start match night':'Advance week',()=>s().card.length?prepare():endWeek(),()=>desk());
}
function prepare(){const c=s().card.slice().sort((a,b)=>D.SLOTS[a.slot].rank-D.SLOTS[b.slot].rank)[0];if(!c){endWeek();return;}const w=G.W(c.wid),f=G.F(c.rid);const plans=Object.entries(D.PLANS).map(([id,p])=>({id,name:p.name,blurb:p.blurb}));paged('Match plan — '+w.name+' versus '+f.name,plans,0,(p,ret)=>screen('Match plan',p.name+'. '+p.blurb+' The promoter has booked: '+D.FINISHES[c.finish].name+'.',[a('start','Go to ringside',()=>startMatch(c,p.id)),back(ret),a('pause','Pause',()=>pause(()=>prepare()))],{portrait:w}),()=>desk(),p=>p.name);}
function startMatch(c,game){
 const w=G.W(c.wid),f=G.F(c.rid),p=G.P(c.pid),prep={...w.prep},focus=D.TRAINING[w.training]?.stat;
 if(focus&&!w.injury)prep[focus]=(prep[focus]||0)+(w.intensity==='hard'?2:w.intensity==='standard'?1.5:.6);
 const fatigue=w.training==='rest'||w.training==='promo'?0:w.program?.type==='camp'?8:w.intensity==='hard'?15:w.intensity==='standard'?5:0;
 const match=X.create({w:{...w,fatigue:G.clamp(w.fatigue+fatigue)},f,p,slot:c.slot,minutes:c.minutes,finish:c.finish,stip:c.stip||null,feudHeat:Math.max(c.feudHeat||0,G.feud(w.id,f.id)?.heat||0),blowoff:c.blowoff,plan:{game,leash:w.psych>=75&&w.ego<75?'free':'script',talk:'none'},preparation:prep,flags:{...w.flags},memory:OfficeMemory.context(w.id,f.id),identity:G.normaliseIdentity(s().identity),seed:Math.floor(Math.random()*2**31)});
 OfficeRivalCorner.attach(match,c);active={cid:c.id,M:match};persistMatch();matchScreen('The bell is about to ring.');
}
function matchScreen(note=''){
 const m=active.M,c=s().card.find(x=>x.id===active.cid);
 if(!c){active=null;persistMatch();desk('The match is no longer on the card.');return;}
 const status=X.fmt(m.t)+' · '+m.w.name+' stamina '+Math.round(m.wSt)+' percent. '+m.f.name+' stamina '+Math.round(m.fSt)+' percent. Crowd '+Math.round(m.crowd)+'. Calls left '+m.calls+'.';
 if(m.done){screen('The final bell',status+' '+(note||''),[a('result','Review result',settleMatch),a('pause','Pause',()=>pause(()=>matchScreen()))]);return;}
 if(m.decision&&!m.queue.length){const d=m.decision;screen(d.title,(note?note+'\n':'')+d.body+'\n'+status,d.options.map(o=>a(o.id,o.label+'. '+o.hint,()=>{X.resolve(m,o.id);persistMatch();burst(1);})).concat(a('pause','Pause',()=>pause(()=>matchScreen()))));return;}
 screen('At ringside',(note?note+'\n\n':'')+status,[a('line','Hear next commentary',()=>burst(1)),a('burst','Continue — up to five commentary lines',()=>burst(5)),...(Object.keys(X.CALLS).some(id=>X.canCall(m,id))?[a('calls','Give a ringside instruction',calls)]:[]),a('status','Repeat match status',()=>matchScreen(note)),a('pause','Pause',()=>pause(()=>matchScreen()))],{kicker:'LIVE FROM RINGSIDE',portrait:m.w});
}
function burst(n){const m=active.M,lines=[];for(let i=0;i<n&&!m.done;i++){if(m.decision&&!m.queue.length)break;const l=X.next(m);if(!l)break;lines.push((D.BOOTH?.[l.who]?.short?D.BOOTH[l.who].short+': ':'')+l.text);}persistMatch();matchScreen(lines.join('\n'));}
function calls(){const m=active.M,list=Object.entries(X.CALLS).filter(([id])=>X.canCall(m,id)).map(([id,v])=>({id,name:v.name,hint:v.hint}));paged('Ringside instructions',list,0,(o,ret)=>{X.call(m,o.id);persistMatch();burst(1);},()=>matchScreen(),o=>o.name);}
function settleMatch(){const m=active.M,c=s().card.find(x=>x.id===active.cid);if(!c||!m.done)return matchScreen();const fin={...m.final,log:m.log.map(({t,text,kind,big,who,actionId})=>({t,text,kind,big,who,actionId}))};let cons;G.atomicSettlement(()=>{cons=G.applyResult(c,fin);cons.push(...OfficeRingside.settle(c,m),...OfficeRivalCorner.settle(c,m));G.save();});active=null;if(G.saveStatus().ok!==false)persistMatch();screen('After the bell',m.w.name+' versus '+m.f.name+'. '+fin.stars+' stars.\n'+cons.map(x=>x.text).join('\n'),[a('next',s().card.length?'Prepare next match':'Finish the week',()=>s().card.length?prepare():endWeek()),a('desk','Return to desk',()=>desk()),a('pause','Pause',()=>pause(()=>desk()))]);}
function endWeek(){if(s().card.length||active||G.pending().length){desk('Finish booked matches and inbox decisions first.');return;}G.atomicSettlement(()=>G.endWeek());desk('A new week begins. Review your inbox and new offers.');}
function results(){const rows=s().history.slice().reverse().slice(0,20).map((h,i)=>({...h,id:h.cid||String(i)}));paged('Recent results',rows,0,(h,ret)=>screen('Match report',JSON.stringify({rating:h.stars,week:h.week,season:h.season}),[back(ret)]),more,h=>'Week '+h.week+' · '+h.stars+' stars');}
M.subscribe(()=>{if(refreshSettings)refreshSettings();});
V.onSettingsChange(()=>{if(refreshSettings)refreshSettings();});
document.addEventListener('keydown',input.down);document.addEventListener('keyup',input.up);document.addEventListener('narbe-input-cancelled',()=>input.cancel());window.addEventListener('blur',()=>input.cancel({resetGuard:true}));document.addEventListener('visibilitychange',()=>{if(document.hidden)input.cancel({resetGuard:true});});window.addEventListener('pagehide',e=>{input.cancel({resetGuard:true});V.cancel();if(!e.persisted)scan.dispose();});
mainMenu();
})();