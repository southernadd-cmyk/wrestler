/* THE OFFICE v3.1 — cooperative match planning and causal commitments.
   Reusable registries and explicit event IDs connect the signed sheet to real moves.
   The match's physical rules, not the planner, decide which moves can happen. */
(function installOfficeSheets(root){'use strict';
 const D=root.OfficeData,actions=root.OfficeMatch.GRAPH.A;
 const K={
  registry:{},register(kind,records){
   if(!Array.isArray(records)||!records.length)throw Error('Graph requires nodes');
   const map=Object.fromEntries(records.map(x=>[x.id,x]));
   if(Object.keys(map).length!==records.length)throw Error('Duplicate graph node');
   for(const node of records)for(const dep of node.requires||[])if(!map[dep])throw Error('Unknown prerequisite '+dep);
   this.registry[kind]=map;return map;
  },
  eligible(node,state){
   const reasons=[];
   if(node.requires?.some(id=>state[id]?.status==='pending'))reasons.push('awaiting prior commitment');
   return {ok:!reasons.length,reasons};
  },
  commit(M,event){
   if(!M.sheet)return null;
   const log=M.sheet.ledger??(M.sheet.ledger=[]);
   M.sheet.eventSeq=(M.sheet.eventSeq||0)+1;
   const record={id:'evt-'+M.sheet.eventSeq,at:M.t,action:event.action,actor:event.actor||null,kind:event.kind||'action',cause:event.cause||null};
   log.push(record);if(log.length>220)log.shift();return record;
  },
  validate(nodes){
   const by=Object.fromEntries(nodes.map(x=>[x.id,x]));
   const bad=[];
   for(const n of nodes){if(!n.id||!n.actions?.length)bad.push('Missing action '+n.id);
    for(const a of [...n.actions,...(n.backup||[])])if(a!=='finish_cue'&&!actions[a]&&!a.startsWith('outcome_')&&!['special_spot','scheduled_nearfall'].includes(a))bad.push('Unknown action '+a);
    for(const dep of n.requires||[])if(!by[dep])bad.push('Unknown dependency '+dep);
   }
   const visit=(id,stack=[])=>{
    if(stack.includes(id)){bad.push('Cycle '+id);return}
    const node=by[id];if(node)for(const dep of node.requires||[])visit(dep,[...stack,id]);
   };
   nodes.forEach(n=>visit(n.id));return bad;
  }
 };
 // Phase 1: a separately versioned, descriptive structure contract.
 // NOT consumed by live match logic, scoring, commentary or planning slots yet.
 // Legacy sheets carry no 'structure' field and remain byte-for-byte compatible.
 const STRUCTURES=(function(){
  const VERSION=1;
  // Dramatic lead is NOT the player's wrestler, winner, babyface or heel.
  const DEFINITIONS={
   classic_american:{label:'Classic American',objectives:[
    ['opening_edge','Establish an early advantage','opening_advantage','lead',[.02,.32]],
    ['sustained_pressure','Build sustained pressure','pressure','other',[.20,.65]],
    ['fighting_return','Fight back from the disadvantage','comeback','lead',[.43,.85]],
    ['decisive_payoff','Build to an appropriate payoff','payoff','either',[.62,.98]]
   ]},
   kings_road:{label:"King's Road",objectives:[
    ['technical_open','Establish an even technical contest','technical_exchange','either',[.02,.36]],
    ['earned_escalation','Escalate through actual offence','escalation','either',[.20,.70]],
    ['tactical_callback','Revisit a meaningful earlier exchange','callback','either',[.44,.89]],
    ['final_confrontation','Build a decisive closing exchange','finish_build','either',[.70,1]]
   ]},
   chickenshit_heel:{label:'Chickenshit Heel',objectives:[
    ['avoid_confrontation','Avoid a fair confrontation','evasion','lead',[0,.35]],
    ['caught_out','Let the opponent expose the evasion','exposure','other',[.15,.63]],
    ['unfair_advantage','Seek an opportunistic or unfair advantage','shortcut','lead',[.33,.85]],
    ['desperate_escape','Struggle to survive the closing danger','escape','lead',[.64,1]]
   ]},
   dominant_ace:{label:'Dominant Ace',objectives:[
    ['establish_superiority','Establish convincing superiority','dominance','lead',[0,.40]],
    ['opponent_challenge','Allow a credible opponent challenge','challenge','other',[.20,.68]],
    ['answer_challenge','Reassert superiority through real offence','reassertion','lead',[.46,.88]],
    ['decisive_statement','Build to a decisive ending','finish_build','lead',[.70,1]]
   ]}
  };
  const OWNERS=new Set(['w','f','either']),COMMITMENTS=new Set(['guide','landmark','required']);
  const plain=o=>o&&typeof o==='object'&&!Array.isArray(o);
  const validId=s=>typeof s==='string'&&/^[a-z][a-z0-9_]{1,63}$/.test(s);
  function validate(value){
   const problems=[];
   if(!plain(value))return ['Structure contract must be a JSON object'];
   for(const key of Object.keys(value))if(!['version','id','execution','roles','objectives'].includes(key))
    problems.push('Unknown structure contract field '+key);
   if(value.version!==VERSION)problems.push('Unsupported structure version '+value.version);
   const def=Object.prototype.hasOwnProperty.call(DEFINITIONS,value.id)?DEFINITIONS[value.id]:null;
   if(!def)problems.push('Unknown structure '+value.id);
   if(value.execution!=='metadata_only')problems.push('Phase 1 structures must be metadata_only');
   const roles=value.roles;
   if(!plain(roles)||!['w','f'].includes(roles.lead)||roles.other!==(roles.lead==='w'?'f':'w')||
     Object.keys(roles).some(k=>!['lead','other'].includes(k)))
    problems.push('Roles must assign one explicit lead and the opposite side');
   if(!Array.isArray(value.objectives)||!value.objectives.length||value.objectives.length>16){
    problems.push('Structure objectives must be a non-empty bounded array');return problems;
   }
   if(def&&value.objectives.length!==def.objectives.length)problems.push('Unexpected number of '+value.id+' objectives');
   const seen=new Set();
   value.objectives.forEach((obj,i)=>{
    if(!plain(obj)){problems.push('Invalid objective at '+i);return}
    for(const key of Object.keys(obj))if(!['id','title','intent','actor','window','requires','commitment'].includes(key))
     problems.push('Unknown objective field '+key);
    if(!validId(obj.id)||seen.has(obj.id))problems.push('Missing or duplicate objective ID '+obj.id);
    if(def&&obj.id!==def.objectives[i]?.[0])problems.push('Objective ID mismatches signed template at '+i);
    if(typeof obj.title!=='string'||!obj.title.trim()||obj.title.length>120)problems.push('Invalid objective title '+obj.id);
    if(!validId(obj.intent))problems.push('Invalid objective intent '+obj.id);
    if(!OWNERS.has(obj.actor))problems.push('Invalid objective actor '+obj.id);
    const win=obj.window;
    if(!Array.isArray(win)||win.length!==2||!win.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1)||
      win[0]>=win[1])problems.push('Invalid objective window '+obj.id);
    if(!COMMITMENTS.has(obj.commitment))problems.push('Invalid objective commitment '+obj.id);
    if(!Array.isArray(obj.requires)||obj.requires.some(dep=>!validId(dep)||!seen.has(dep))||
      new Set(obj.requires).size!==obj.requires.length)problems.push('Unordered or unknown prerequisite for '+obj.id);
    seen.add(obj.id);
   });
   return problems;
  }
  function create(selection){
   const spec=typeof selection==='string'?{id:selection}:selection;
   if(!plain(spec)||!Object.prototype.hasOwnProperty.call(DEFINITIONS,spec.id))throw Error('Unknown match structure');
   for(const k of Object.keys(spec))if(!['id','lead'].includes(k))throw Error('Unexpected structure selection field '+k);
   const lead=spec.lead===undefined&&spec.id==='classic_american'?'w':spec.lead;
   if(lead!=='w'&&lead!=='f')throw Error('Match structure requires explicit lead side w or f');
   const other=lead==='w'?'f':'w';
   const objectives=DEFINITIONS[spec.id].objectives.map((d,i)=>({
    id:d[0],title:d[1],intent:d[2],
    actor:d[3]==='lead'?lead:d[3]==='other'?other:'either',
    window:[...d[4]],requires:i?[DEFINITIONS[spec.id].objectives[i-1][0]]:[],
    commitment:'landmark'
   }));
   const contract={version:VERSION,id:spec.id,execution:'metadata_only',roles:{lead,other},objectives};
   const bad=validate(contract);if(bad.length)throw Error('Invalid structure contract: '+bad.join('; '));
   return contract;
  }
  // Preserve the completed traditional sheet and its separately agreed finish.
  function attach(sheet,spec){
   if(!sheet?.signed||sheet.v!==4||!Array.isArray(sheet.nodes)||!sheet.nodes.some(b=>b.id==='finish'))
    throw Error('A completed signed v4 match sheet is required');
   if(Object.prototype.hasOwnProperty.call(sheet,'structure'))throw Error('Match sheet already has a structure contract');
   const value=plain(spec)&&Object.prototype.hasOwnProperty.call(spec,'version')?
    JSON.parse(JSON.stringify(spec)):create(spec);
   const bad=validate(value);if(bad.length)throw Error('Invalid structure contract: '+bad.join('; '));
   return {...sheet,structure:value};
  }
  function read(sheet){
   if(!sheet||sheet.structure==null)return {mode:'legacy',id:'classic_american',contract:null,errors:[]};
   const bad=validate(sheet.structure);
   return bad.length?{mode:'unsupported',id:null,contract:null,errors:bad}:
    {mode:'metadata_only',id:sheet.structure.id,contract:JSON.parse(JSON.stringify(sheet.structure)),errors:[]};
  }
  function catalogue(){return Object.entries(DEFINITIONS).map(([id,def])=>({id,label:def.label,objectiveIds:def.objectives.map(d=>d[0])}));}
  return Object.freeze({VERSION,catalogue,create,validate,attach,read});
 })();
 const MODE={
  detailed:{label:'Detailed layout',desc:'Both performers agree a sequence of specific beats. Highest commitment, less room for improvisation.',weight:13},
  landmarks:{label:'Key moments',desc:'Agree the essential dramatic beats and call the transitions live. Recommended.',weight:8},
  live:{label:'Call it in the ring',desc:'Agree the story, one meaningful turning point and the finish; adapt the details to the crowd.',weight:3.3}
 };
 const STYLE={
  Technical:{open:['collar_snap','wristlock'],pressure:['leg_wrench','target_hold'],return:['leveraged_bridge','counter_strike'],spectacle:['submission_set','counter_rollup']},
  Brawl:{open:['stiff_forearm','strike_trade'],pressure:['body_shot','target_strike'],return:['rolling_elbow','clothesline'],spectacle:['short_arm_lariat','power_spinebuster']},
  Spectacle:{open:['springboard_feint','rope_run'],pressure:['rope_rebound','corner_whip'],return:['running_headscissors','duck_rebound'],spectacle:['high_crossbody','missile_dropkick']},
  Story:{open:['false_handshake','crowd_pose'],pressure:['opponent_study','target_strike'],return:['dramatic_rally','counter_strike'],spectacle:['last_second_counter','finish_tease']}
 };
 const fp=w=>STYLE[w.style]||STYLE.Story;
 // The career ledger and real character state provide context. Style differences
 // alone never justify a quarrel; without history, wrestlers can agree naturally.
 function careerContext(c,w,f){
  const G=root.OfficeGame,career=G?.S;
  const past=(career?.history||[]).filter(x=>x.wid===w.id&&x.rid===f.id);
  const memories=career?(root.OfficeMemory?.view(w.id).entries||[]).filter(x=>x.against===f.id):[];
  return {matches:past.length,losses:past.filter(x=>(x.finish||'').startsWith('lose')).length,
   chemistry:memories.some(x=>x.kind==='chemistry'),
   injuredBefore:memories.some(x=>x.kind==='hurt'),
   grievance:memories.some(x=>['humiliation','rebellion','promise_broken'].includes(x.kind)),
   remembered:memories[0]?.text||null,
   heat:Math.max(c.feudHeat||0,career?(G.feud(w.id,f.id)?.heat||0):0),
   weightGap:(D.PROFILES[f.id]?.kg||85)-(D.PROFILES[w.id]?.kg||85)};
 }
 function conflicts(c,w,f,h,game,a,b){
  const issues=[],add=(actor,why,weight,safety=false)=>issues.push({actor,why,weight,safety});
  const risky=id=>['high_crossbody','missile_dropkick','springboard_strike','aerial_attack','power_spinebuster','heavy_slam','gutbuster'].includes(id);
  if(c.finish.startsWith('lose')&&w.ego>=73&&w.pro<96&&(h.losses||h.grievance))
   add('w',w.short+' remembers losing to '+f.short+' and wants a convincing comeback before doing the job again.',3);
  if(c.finish.startsWith('win')&&f.ego>=78&&f.pro<86&&h.matches&&h.heat>=30)
   add('f',f.short+' is proud and does not want the rematch to make them look helpless.',2);
  if(h.injuredBefore&&(game==='spots'||w.flags?.pushThrough))
   add('w',w.short+' was injured against '+f.short+' and does not want to repeat that dangerous setup.',4,true);
  if(game==='spots'&&(w.injury||w.flags?.pushThrough||w.fatigue>=58)&&w.pro>=65)
   add('w',w.short+' is not fit enough for the ambitious high-risk layout.',4,true);
  if(game==='spots'&&risky(a.payoff)&&w.safe<58&&f.pro>=76)
   add('f',f.short+' has concerns about taking a dangerous move from '+w.short+' given their safety record.',3,true);
  if(game==='spots'&&risky(b.payoff)&&f.safe<53&&w.pro>=74)
   add('w',w.short+' does not trust '+f.short+' to execute a dangerous spot safely.',3,true);
  return issues.sort((a,b)=>b.weight-a.weight);
 }

 const FINISH_TEXT={win_clean:'a clean win',win_dirty:'a dirty win',lose_protected:'a protected loss',lose_clean:'a clean loss',win_dq:'a win by disqualification',lose_dq:'a disqualification loss',nc:'a no contest',double:'a double-cross'};
 const label=id=>{const n=actions[id];if(id.startsWith('outcome_'))return FINISH_TEXT[id.slice(8)]||id.slice(8).replace(/_/g,' ');
  if(n?.name)return n.counterOf?'a reversal of the '+n.name:n.blockOf?'a blocked '+n.name:n.name;return id.replace(/_/g,' ');};

 // A match outline has a creative objective chosen for these two actual
 // performers. An objective must have a reason and a distinct event-level plan.
 function focusOptions(c,w,f,game){
  const h=careerContext(c,w,f),opts=[],ww=fp(w),ff=fp(f);
  const add=(id,title,why,tradeoff)=>opts.push({id,title,why,tradeoff});
  add('authentic','Let their styles tell the story',
   w.short+' prefers '+label(ww.open[0])+'; '+f.short+' prefers '+label(ff.pressure[0])+'. Build on what they actually do well.',
   'Most reliable, but less of a deliberate callback.');
  add('counter','Scout '+f.short+' and turn their strength against them',
   f.short+' is a '+f.style.toLowerCase()+' wrestler. Build a specific counter to the pressure they favour.',
   'The counter needs good timing and might be anticipated.');
  if(h.chemistry)add('chemistry','Build on their last strong performance',
   w.short+' and '+f.short+' remember an excellent match together. Agree a more ambitious counter sequence without ignoring either performer.',
   'A sequence that worked before may be scouted this time.');
  if(h.losses||h.grievance) add('redemption','Answer the previous result',
   w.short+' '+(h.losses?'has already lost to '+f.short+'.':'has unfinished business with '+f.short+'.')+
   ' Earn a real comeback before the contracted ending.',
   'The emotional payoff depends on an actual counter landing.');
  if(w.style==='Spectacle'||f.style==='Spectacle'||game==='spots')
   add('spectacle','Build around a crowd-changing spectacular move',
    (w.style==='Spectacle'?w.short:f.short)+' has an aerial style. Agree a setup, then pay it off in the closing stretch.',
    'Poor safety, fatigue or an injury may make the moment too risky.');
  if(w.fatigue>=35||w.injury||w.flags?.pushThrough||h.injuredBefore||f.safe<55)
   add('protect','Protect the performers and get the finish home',
    w.short+(h.injuredBefore?' was hurt in a previous encounter.':w.fatigue>=35?' is carrying fatigue.': ' needs a safer, more controlled layout.'),
    'Less spectacle; a clean, credible counter becomes the high point.');
  else add('pressure','Let '+f.short+' work a weakness, then escape it',
   f.short+' can control the middle of the match; '+w.short+' has to find a believable way out.',
   'Requires the escape to follow the hold, not an unearned comeback.');
  return opts;
 }
 function applyFocus(nodes,focus,w,f,h){
  if(focus==='authentic')return;
  const find=id=>nodes.find(n=>n.id===id),opening=find('opening'),pressure=find('pressure'),reversal=find('reversal'),payoff=find('payoff');
  if(focus==='counter'){
   opening.actions=['opponent_study'];opening.backup=[fp(w).open[0]];
   reversal.actions=['last_second_counter'];reversal.backup=['quiet_reversal','counter_strike'];
   payoff.actions=['counter_strike'];payoff.backup=['counter_rollup','scheduled_nearfall'];
   payoff.owner='w';payoff.title=w.short+' counters '+f.short+' after studying the earlier pressure';
  }else if(focus==='chemistry'){
   opening.actions=['lockup'];opening.backup=[fp(w).open[0]];
   pressure.actions=['target_strike'];pressure.backup=[fp(f).pressure[0]];
   reversal.actions=['wrist_escape'];reversal.backup=['counter_strike'];
   payoff.actions=['finish_tease'];payoff.backup=['last_second_counter','scheduled_nearfall'];
   payoff.owner='w';payoff.title=w.short+' and '+f.short+' build on their previous counter sequence';
  }else if(focus==='redemption'){
   pressure.actions=['target_strike'];pressure.backup=[fp(f).pressure[0]];
   reversal.actions=['dramatic_rally'];reversal.backup=['counter_strike'];
   payoff.actions=['last_second_counter'];payoff.backup=['scheduled_nearfall','counter_rollup'];
   payoff.owner='w';payoff.title=w.short+' turns their previous failure into a comeback';
  }else if(focus==='spectacle'){
   // Never force a top-rope move as a standing action. Commit to the
   // preparatory setup, and let the tactical graph require a legal followup.
   opening.actions=[w.style==='Spectacle'?'springboard_feint':fp(w).open[0]];
   payoff.actions=[w.style==='Spectacle'?'springboard_rise':f.style==='Spectacle'?'scheduled_nearfall':'special_spot'];
   payoff.backup=['special_spot','scheduled_nearfall'];
   payoff.owner=w.style==='Spectacle'?'w':f.style==='Spectacle'?'f':'w';
   payoff.title=(payoff.owner==='w'?w.short:f.short)+' sets up the high-risk turning point';
  }else if(focus==='protect'){
   pressure.actions=['mat_hold'];pressure.backup=['target_hold'];
   reversal.actions=['quiet_reversal'];reversal.backup=['counter_strike'];
   payoff.actions=['finish_tease'];payoff.backup=['counter_strike','scheduled_nearfall'];
   payoff.owner='w';payoff.title=w.short+' earns a controlled near-finish without a dangerous lift';
  }else if(focus==='pressure'){
   pressure.actions=['target_strike'];pressure.backup=['target_hold'];
   reversal.actions=['counter_strike'];reversal.backup=['mat_scramble','quiet_reversal'];
   payoff.actions=['counter_rollup'];payoff.backup=['scheduled_nearfall','finish_tease'];
   payoff.owner='w';payoff.title=w.short+' escapes '+f.short+' and nearly steals the decision';
  }
 }
 // Alternative beats are proposed before the wrestlers sign, with an explicit
 // record of who conceded and why. No free universal numerical bonus.
 function revise(sheet,beatId){
  if(!sheet||!['pressure','reversal','payoff'].includes(beatId))return false;
  const beat=sheet.nodes.find(x=>x.id===beatId),alt=beat?.backup?.find(x=>actions[x]||x==='special_spot'||x==='scheduled_nearfall');
  if(!beat||!alt||alt===beat.actions[0]||sheet.confirmed)return false;
  const prior=beat.actions[0];
  beat.actions=[alt];beat.backup=[prior,...beat.backup.filter(x=>x!==alt&&x!==prior)];
  if(K.validate(sheet.nodes).length){beat.actions=[prior];beat.backup=[alt,...beat.backup.filter(x=>x!==prior)];return false}
  sheet.revisions??=[];
  sheet.revisions.push({beat:beatId,from:prior,to:alt,reason:'Manager and performers reviewed a viable alternative to the initial '+beatId+'.'});
  const owner=beat.owner==='f'?sheet.proposals.opponent:sheet.proposals.worker;
  sheet.speakers.push({actor:owner.name,text:'I can work '+label(alt)+' instead of '+label(prior)+'. That changes how we earn the next beat.'});
  // Replacing a contested high-risk payoff with an agreed safer beat can
  // genuinely address a safety objection rather than merely changing flavour.
  if(beatId==='payoff'&&sheet.issues?.some(x=>x.safety)&&!['aerial_attack','high_crossbody','missile_dropkick','power_spinebuster'].includes(alt)){
   sheet.workerConsent=Math.min(95,sheet.workerConsent+5);
   sheet.opponentConsent=Math.min(95,sheet.opponentConsent+5);
  }
  return true;
 }

 function proposal(w,side,h){
  const st=fp(w),p=D.PROFILES[w.id],mine=side==='w';
  const defeated=mine?h.losses:Math.max(0,h.matches-h.losses);
  const tired=(w.fatigue||0)>=43||!!w.injury||!!w.flags?.pushThrough;
  const smaller=mine?h.weightGap>=27:h.weightGap<=-27;
  const opening=defeated&&w.psych>=55?st.open[1]:st.open[0];
  let payoff=st.spectacle[0];
  if((tired||smaller)&&['Brawl','Spectacle'].includes(w.style))payoff=st.return[1];
  else if(defeated&&w.psych>=75)payoff=st.spectacle[1];
  const goals=[];
  if(mine&&h.injuredBefore)goals.push('protect the injury from our last match');
  if(tired)goals.push('work safely with my current fatigue');
  if(smaller)goals.push('use counters rather than trying to lift the heavier opponent');
  if(defeated)goals.push('change the tactic that failed last time');
  if(mine&&h.grievance)goals.push('restore my credibility after the last result');
  if(h.chemistry&&!h.grievance)goals.push('build on the strong match we worked together last time');
  if(!goals.length)goals.push(w.psych>=78?'build a believable story':w.ego>=75?'make my big moment matter':'give the crowd a good match');
  return {actor:side,name:w.short,style:w.style,opening,pressure:st.pressure[0],
   rally:st.return[0],payoff,motive:goals[0],
   concern:goals.slice(1).join('; ')||'keep the timing natural',preferred:p?.preferred||[]};
 }
 function build(c,w,f,game,method='landmarks',decision=null,focus='authentic'){
  if(!focusOptions(c,w,f,game).some(o=>o.id===focus))focus='authentic';
  if(!MODE[method])method='landmarks';
  const h=careerContext(c,w,f),a=proposal(w,'w',h),b=proposal(f,'f',h);
  const issues=conflicts(c,w,f,h,game,a,b);
  if(focus==='spectacle'&&((w.fatigue||0)>=42||w.safe<58||h.injuredBefore)&&f.pro>=68&&!issues.some(x=>x.safety))
   issues.push({actor:'f',why:f.short+' will only agree to the spectacle if '+w.short+' can execute it safely at their current fitness.',weight:4,safety:true});
  const disputed=issues.length>0;
  const chosen=decision||(!disputed?'agreed':'pending');
  const lead=chosen==='worker'?a:chosen==='opponent'?b:chosen==='agreed'?(c.finish.startsWith('win')?a:b):null;
  const main=lead||a,guest=lead?lead===a?b:a:b;
  const wop=fp(w),fop=fp(f);
  const pressure=chosen==='worker'?fop.pressure[1]:b.pressure;
  const safetyRevision=chosen==='compromise'&&issues.some(x=>x.safety);
  const payoff=safetyRevision?(lead===b?fop.return[1]:wop.return[1]):lead===b?b.payoff:a.payoff;
  // Each commitment names an intended performer, a real legal graph event,
  // an alternative and a causal predecessor. The booked finish is immutable.
  const first={id:'opening',owner:'w',title:w.short+' establishes the opening',actions:[a.opening],backup:[wop.open[1]],window:[.03,.32],requires:[]};
  const second={id:'pressure',owner:'f',title:f.short+' takes control',actions:[pressure],backup:[fop.pressure[0],fop.pressure[1]].filter(x=>x!==pressure),window:[.20,.65],requires:['opening']};
  const third={id:'reversal',owner:'w',title:w.short+' fights for a comeback',actions:[a.rally],backup:[wop.return[1]],window:[.43,.85],requires:['pressure']};
  const fourth={id:'payoff',owner:lead===b?'f':'w',title:(lead===b?f.short:w.short)+' attempts a signature turning point',actions:[payoff],backup:[lead===b?fop.spectacle[1]:wop.spectacle[1],'special_spot','scheduled_nearfall'],window:[.62,.96],requires:['reversal']};
  const final={id:'finish',owner:'either',title:'Deliver the contracted '+(c.finish.startsWith('win')?'victory':'defeat'),actions:['outcome_'+c.finish],backup:['outcome_double','outcome_nc'],window:[.89,1.2],requires:['payoff']};
  applyFocus([first,second,third,fourth,final],focus,w,f,h);
  const nodes=method==='detailed'?[first,second,third,fourth,final]:
   method==='live'?[{...first,actions:[first.actions[0],wop.open[1]]},second,{...fourth,requires:['pressure']}, {...final,requires:['payoff']}]:
   [first,second,third,fourth,final];
  const problems=K.validate(nodes);if(problems.length)throw Error('Sheet: '+problems.join(','));
  const signed=chosen!=='pending',dispute=disputed;
  let workerConsent=Math.min(90,Math.max(45,Math.round(74+(w.pro-70)*.24+(w.psych-65)*.1)));
  let opponentConsent=Math.min(90,Math.max(45,Math.round(74+(f.pro-70)*.24+(f.psych-65)*.1)));
  if(h.chemistry&&!dispute){workerConsent+=4;opponentConsent+=4;}
  if(dispute&&signed){
   const importance=Math.max(...issues.map(x=>x.weight));
   if(chosen==='worker'){workerConsent+=issues.some(x=>x.actor==='w')?importance*3:1;opponentConsent-=issues.some(x=>x.actor==='f')?importance*5:importance*2;}
   if(chosen==='opponent'){opponentConsent+=issues.some(x=>x.actor==='f')?importance*3:1;workerConsent-=issues.some(x=>x.actor==='w')?importance*5:importance*2;}
   if(chosen==='compromise'){workerConsent+=3;opponentConsent+=3;}
  }
  workerConsent=Math.max(20,Math.min(95,workerConsent));
  opponentConsent=Math.max(20,Math.min(95,opponentConsent));

  const lines=[
   {actor:w.short,text:'I can open with '+label(a.opening)+' and work towards '+label(a.payoff)+'. I want to '+a.motive+'.'},
   {actor:f.short,text:'I can take control with '+label(b.pressure)+' and aim for '+label(b.payoff)+'. I want to '+b.motive+'.'}
  ];
  if(h.remembered)lines.push({actor:'Road agent',text:'Last time: '+h.remembered});
  if(dispute){
   issues.slice(0,2).forEach(x=>lines.push({actor:x.actor==='w'?w.short:f.short,text:x.why}));
   if(signed)lines.push({actor:'Road agent',text:chosen==='worker'?'The stable leads the disputed beat; the opponent may still object.':chosen==='opponent'?'The opponent’s concern takes priority; your wrestler may be unhappy.':'Both performers alter the disputed spot while keeping the contracted result.'});
  }else lines.push({actor:'Road agent',text:'The proposed sequences work together. Both wrestlers agree; there is nothing to arbitrate.'});
  if(signed&&dispute&&workerConsent<55)lines.push({actor:w.short,text:'I will work the agreed finish, but I have reservations.'});
  if(signed&&dispute&&opponentConsent<55)lines.push({actor:f.short,text:'The finish is fine. I still have concerns about the layout.'});
  return {v:3,contract:c.id,method,focus,decision:chosen,signed,disputed,issues,history:{priorMatches:h.matches,priorLosses:h.losses,priorInjury:h.injuredBefore,reason:h.remembered},authority:chosen==='opponent'?'opponent':chosen==='worker'?'worker':'shared',
   w:w.id,f:f.id,workerConsent,opponentConsent,premise:w.short+' and '+f.short+' try to earn a '+game+' match without breaking the agreed '+c.finish.replace(/_/g,' ')+' finish.',
   speakers:lines,proposals:{worker:a,opponent:b},nodes:nodes.map(x=>({...x,status:'pending',actual:null,at:null,why:''})),revisions:[],ledger:[],changes:[],finish:c.finish};
 }
 function current(M){return M.sheet?.signed?M.sheet:null}
 function eligibleBeat(M,b){
  if(b.status!=='pending')return false;
  const s=current(M);if(!s)return false;
  const map=Object.fromEntries(s.nodes.map(n=>[n.id,n]));
  return K.eligible(b,map).ok;
 }
 function boost(M,id,actor){
  const s=current(M);if(!s)return 1;
  const frac=M.t/Math.max(1,M.len);
  let mult=1;
  for(const b of s.nodes){
   if(b.vow||b.corner||b.impossible||!eligibleBeat(M,b)||frac<b.window[0]-.07||frac>b.window[1])continue;
   if(b.owner!=='either'&&b.owner!==actor)continue;
   if(b.actions.includes(id))mult=Math.max(mult,MODE[s.method].weight);
   else if(b.backup?.includes(id))mult=Math.max(mult,MODE[s.method].weight*.52);
  }
  return mult;
 }
 function observe(M,id,actor,kind='action'){
  const s=current(M);if(!s)return;
  const event=K.commit(M,{action:id,actor,kind});
  const frac=M.t/Math.max(1,M.len);
  // A scripted spectacle is credited by its landed, named graph action,
  // not by a generic event emitted for an attempt (including a botch).
  const performed=M.graph?.events?.at(-1);
  const landedScripted=kind==='action'&&performed?.id===id&&performed.scriptedSpot===true;
  for(const b of s.nodes){
   if(b.impossible||b.vow||b.corner)continue;
   if(kind!=='outcome'&&!eligibleBeat(M,b))continue;
   if(kind==='outcome'&&b.id!=='finish')continue;
   if(frac<b.window[0]-.10||frac>b.window[1]+.12)continue;
   if(b.owner!=='either'&&b.owner!==actor&&kind!=='outcome')continue;
   const exact=b.actions.includes(id)||(landedScripted&&b.actions.includes('special_spot'));
   const alternate=b.backup?.includes(id)||(landedScripted&&b.backup?.includes('special_spot'));
   if(!exact&&!alternate)continue;
   const missedBefore=b.id==='finish'?[]:(b.requires||[]).filter(dep=>s.nodes.some(x=>x.id===dep&&x.status==='missed'));
   b.status=missedBefore.length?'adapted':exact?'achieved':'adapted';b.actual=id;b.at=M.t;
   b.why=missedBefore.length?'The earlier '+missedBefore.join(', ')+' beat was missed; the performers rebuilt the sequence.':
    exact?'Agreed move performed.':'A legal alternative replaced the original beat.';
   event.cause=b.id;
   if(s.v>=4&&b.id!=='finish'){
    const sc=Math.max(0,s.story?.score||0),hit=b.status==='achieved';
    // Stars for doing what was agreed, more if the running order told a story.
    M.sheetAdj=(M.sheetAdj||0)+(hit?.01+.035*sc:0);if(root.OfficeMatch?.lift)root.OfficeMatch.lift(M,hit?2:1);else M.crowd=Math.min(100,(M.crowd||0)+(hit?2:1));
   }
   if(b.id!=='finish'&&root.OfficeMatch?.note)root.OfficeMatch.note(M,(exact?(s.v>=4?'Just as agreed backstage: '+b.title+'.':'The agreed '+b.title.toLowerCase()+' pays off.'):'An audible: '+label(id)+' replaces the planned '+label(b.actions[0])+'.'),'runner');
   break;
  }
 }
 function advance(M){
  const s=current(M);if(!s)return;
  const frac=M.t/Math.max(1,M.len);
  for(const b of s.nodes){
   // Vows and the corner's moment keep their own time; they are settled by their own modules.
   if(b.status!=='pending'||b.id==='finish'||b.vow||b.corner||frac<=b.window[1])continue;
   if(s.v>=4)M.sheetAdj=(M.sheetAdj||0)-.15;
   b.status='missed';b.why=M.shortened?'The match was cut short; this agreed sequence no longer fit before the finish.':'The opportunity passed before the planned move could be performed.';
   s.changes.push({beat:b.id,at:M.t,reason:b.why});
   if(root.OfficeMatch?.note&&s.changes.length<=2)root.OfficeMatch.note(M,'Road agent: '+b.title+' did not happen. The wrestlers will need another route to the finish.','runner');
  }
 }
 function intervention(M,id){
  const s=current(M);if(!s)return;
  s.calls??=[];
  s.calls.push({id,at:M.t,reason:id==='home'?'The manager ordered an early finish.':id==='big'?'The manager requested a risky highlight.':
    id==='sheet'?'The manager asked the wrestlers to return to the agreed commitments.':
    'The manager requested a change of pacing.'});
 }
 // A promise made at the microphone, carried on the sheet as a beat of its own.
 function settleVow(M,kind,id,at){
  const s=current(M),b=s?.nodes.find(n=>n.vow&&n.kind===kind&&n.status==='pending');if(!b)return;
  b.status='achieved';b.actual=id;b.at=at??M.t;b.why='The promise made at the microphone was kept.';
  M.sheetAdj=(M.sheetAdj||0)+.08;
 }
 // Vows are closed once the finish has actually been described, just before the rating.
 function closeVows(M){
  const s=current(M);if(!s)return;
  const fv=s.nodes.find(n=>n.vow&&n.kind==='finisher'&&n.status==='pending');
  // A named finisher counts only if it won the match it was promised for.
  if(fv&&M.o?.finish==='win_clean'&&M.outcome==='booked'&&M.w?.finisher){
   const line=(M.log||[]).find(l=>String(l.text||'').includes(M.w.finisher));
   if(line){const [m,sec]=String(line.t).split(':').map(Number);settleVow(M,'finisher','finish_tease',Number.isFinite(m*60+sec)?m*60+sec:M.t);}
  }
  for(const b of s.nodes)if(b.vow&&b.status==='pending'){b.status='missed';b.why=b.kind==='finisher'?'The finishing move promised at the microphone never won the match.':'The counter promised at the microphone never came.';M.sheetAdj=(M.sheetAdj||0)-.15;}
 }
 function finalize(M){
  const s=current(M);if(!s)return null;
  advance(M);
  for(const b of s.nodes)if(b.status==='pending'&&!b.vow){b.status='missed';b.why='The bell came before this planned commitment.'}
  return report(M);
 }
 function report(M){
  const s=current(M);if(!s)return null;
  const achieved=s.nodes.filter(b=>b.status==='achieved').length,adapted=s.nodes.filter(b=>b.status==='adapted').length,missed=s.nodes.filter(b=>b.status==='missed').length;
  return {method:s.method,focus:s.focus,room:s.v>=4?{premise:s.premise,left:s.clockLeft,route:s.finishRoute,performed:s.performedFinishRoute||null}:null,decision:s.decision,revisions:(s.revisions||[]).map(x=>({...x})),calls:(s.calls||[]).map(x=>({...x})),total:s.nodes.length,achieved,adapted,missed,
   beats:s.nodes.map(b=>({id:b.id,title:b.title,status:b.status,expected:b.actions[0],actual:b.actual,reason:b.why,at:b.at})),
   eventCount:s.ledger.length};
 }
 // v3.7 THE MATCH STRIP. The running order laid along the match clock: where each beat is due,
 // whose it is, and what became of it. Pure data, so the screen only has to draw it.
 const STRIP_NAME={opening:'Shine',pressure:'Heat',reversal:'Comeback',payoff:'Big spot',finish:'Finish',vow:'Vow'};
 function strip(M,{final=false}={}){
  const s=M?.sheet;if(!s?.signed||!s.nodes?.length)return null;
  const len=Math.max(1,M.len),frac=Math.min(1,(M.t||0)/len),pct=x=>Math.round(Math.max(0,Math.min(1,x))*1000)/10;
  const clock=t=>(root.OfficeMatch?.fmt||(x=>Math.round(x)+'s'))(t);
  const who=o=>o==='w'?M.w?.short:o==='f'?M.f?.short:null;
  let row=0;
  const beats=s.nodes.map(b=>{const lane=b.vow?2:row++%2;
   const start=Math.max(0,b.window[0]),end=Math.min(1,b.window[1]),slot=STRIP_NAME[b.id]||b.id;
   const move=b.move?b.move:b.vow?(b.kind==='counter'?'a counter on '+(M.f?.short||'them'):(M.w?.finisher||'the finisher')):b.id==='finish'?label(b.actions[0]):b.actions[0]==='scheduled_nearfall'?'a run of near-falls':label(b.actions[0]);
   const open=frac>=b.window[0]-.07&&frac<=b.window[1];
   const state=b.status!=='pending'?b.status:final?'missed':open?'due':'waiting';
   // Where the mark goes: when it happened, or where the chance ran out.
   const at=b.at!=null?b.at/len:b.status==='missed'||state==='missed'?end:null;
   const mark=at==null?null:Math.round(Math.max(0,Math.min(1,(at-start)/Math.max(.01,end-start)))*1000)/10;
   const owner=who(b.owner),whose=owner&&!b.vow?owner+'’s ':'';
   const title=slot+': '+whose+move+'. '+(
    state==='achieved'?(b.vow?'Promise kept at '+clock(b.at)+'.':'Landed at '+clock(b.at)+'.'):
    state==='adapted'?'Audible at '+clock(b.at)+': '+label(b.actual)+' instead.':
    state==='missed'?(b.why||'It never happened.'):
    state==='due'?'Due now.':'Due between '+clock(b.window[0]*len)+' and '+clock(Math.min(1,b.window[1])*len)+'.');
   return {id:b.id,slot,move,owner:b.owner,ownerName:owner,lane,vow:!!b.vow,start:pct(start),width:Math.max(4,pct(end)-pct(start)),state,mark,title};
  });
  return {beats,head:final?null:pct(frac),done:beats.filter(b=>b.state==='achieved'||b.state==='adapted').length,total:beats.length};
 }
 root.OfficeGraphKernel=K;root.OfficeSheets={MODE,STRUCTURES,build,focusOptions,revise,observe,boost,advance,intervention,finalize,report,proposal,strip,STRIP_NAME,settleVow,closeVows};
})(typeof window!=='undefined'?window:globalThis);
