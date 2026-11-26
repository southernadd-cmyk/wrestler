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
    // A v1 objective is a fixed description, not a free-form substitute.
    const expected=def?.objectives[i];
    if(expected&&plain(roles)&&['w','f'].includes(roles.lead)){
     const actor=expected[3]==='lead'?roles.lead:expected[3]==='other'?roles.other:'either';
     if(obj.actor!==actor)problems.push('Objective actor contradicts assigned role '+obj.id);
     if(obj.intent!==expected[2])problems.push('Objective intent contradicts signed template '+obj.id);
     const predecessor=i?def.objectives[i-1]?.[0]:null;
     if(!Array.isArray(obj.requires)||obj.requires.length!==(i?1:0)||
       (i&&obj.requires[0]!==predecessor))problems.push('Objective dependencies contradict signed template '+obj.id);
    }
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
  // Phase 2, still a signed EDITORIAL plan, not an executable instruction
  // to Graph or a record of moves landed. No structure objective can bypass
  // match physics or silently change the contracted winner or finish route.
  // MP7C: signed conditional setup metadata can be restored without
  // the original room. Validate graph topology, timing, safety limits
  // and control/position continuity independently of live execution.
  // Physical eligibility was checked by the room at signing; stamina,
  // grip, locations and participant fitness must be checked live in MP8.
  function validateSequence(seq,obj,sheet){
   const bad=[],fail=why=>['Invalid conditional sequence '+obj.id+': '+why];
   if(!plain(seq)||![1,2].includes(seq.version)||seq.mode!=='conditional'||
      Object.keys(seq).some(k=>!['version','mode','start','actions',...(seq.version===2?['openings']:[])].includes(k)))return fail('schema');
   if(!obj.call?.chosen||obj.call.source!=='negotiated'||!['w','f'].includes(obj.call.owner))return fail('missing negotiated call');
   const ids=seq.actions,start=seq.start,positions=['standing','mat','corner','top','outside'],other=s=>s==='w'?'f':'w';
   if(!Array.isArray(ids)||ids.length<2||ids.length>4||new Set(ids).size!==ids.length||ids.at(-1)!==obj.call.action||
      !plain(start)||Object.keys(start).some(k=>!['control','position','down'].includes(k))||
      !['w','f'].includes(start.control)||!positions.includes(start.position)||
      (start.position==='mat'?!['w','f'].includes(start.down):start.down!==null))return fail('entry or actions');
   let {control,position,down}=start,performer=null;
   const limits=sheet?.limits||{},note=sheet?.note?.honour&&!sheet.note.waived?sheet.note:null;
   const banned=(id,n)=>[limits,note].some(l=>l&&((Array.isArray(l.banIds)&&l.banIds.includes(id))||
    (Array.isArray(l.ban)&&l.ban.includes(n.family))))||sheet?.spice<0&&n.risk;
   for(let i=0;i<ids.length;i++){
    const id=ids[i],n=typeof id==='string'&&Object.prototype.hasOwnProperty.call(actions,id)?actions[id]:null;
    if(!n||n.counterOf||n.blockOf||n.nearfall||n.family==='pin'||
       ['early_cover','cover','near_kickout','counter_rollup','finish_tease','finish_counter'].includes(id))return fail('excluded action '+i);
    if(i&&!actions[ids[i-1]].next.some(([to,weight])=>to===id&&weight>0))return fail('disconnected action '+i);
    if(!['any',position].includes(n.requires)||n.requires==='mat'&&down===null||
       n.family==='ground'&&(position!=='mat'||down!==other(control)))return fail('position or control '+i);
    if(!Number.isFinite(n.after)||n.after>Math.min(.98,obj.window[1]+.08)||banned(id,n))return fail('timing or restriction '+i);
    performer=n.reverse?other(control):control;
    down=n.down==='d'?(n.reverse?control:other(control)):n.down==='a'?performer:null;
    control=performer;position=n.zone;
   }
   if(performer!==obj.call.owner)return fail('final performer');
   if(seq.version===2){
    if(!Array.isArray(seq.openings)||seq.openings.length<1||seq.openings.length>2)return fail('opening count');
    const graph=root.OfficeMatch?.GRAPH,first=actions[ids[0]];
    const transition=(n,entry)=>{
     const actor=n.reverse?other(entry.control):entry.control;
     return {control:actor,position:n.zone,down:n.down==='d'?(n.reverse?entry.control:other(entry.control)):n.down==='a'?actor:null};
    };
    const canonical=transition(first,start),seen=new Set();
    for(const entry of seq.openings){
     if(!plain(entry)||Object.keys(entry).some(k=>!['start','action'].includes(k))||
        !plain(entry.start)||!['standing','mat','corner'].includes(entry.start.position)||
        ids.includes(entry.action)||seen.has(JSON.stringify(entry.start)))return fail('alternative schema');
     seen.add(JSON.stringify(entry.start));
     const n=actions[entry.action];
     if(!n||n.risk||!graph||graph.costOf(entry.action)>Math.max(1.8,graph.costOf(ids[0]))||
        graph.PHYSICAL_GRIP_MOVES[entry.action]||graph.GRIP_ENTRY[entry.action]!==graph.GRIP_ENTRY[ids[0]]||
        JSON.stringify(transition(n,entry.start))!==JSON.stringify(canonical))return fail('alternative continuity or risk');
     const errors=validateSequence({version:1,mode:'conditional',start:entry.start,actions:[entry.action,...ids.slice(1)]},obj,sheet);
     if(errors.length)return fail('alternative: '+errors[0]);
    }
   }
   return bad;
  }
  function validatePlan(plan,structure,sheet){
   const bad=[];
   const structureBad=validate(structure);
   if(structureBad.length)return ['Invalid structure: '+structureBad.join('; ')];
   if(!plain(plan))return ['Structure editorial plan must be an object'];
   for(const k of Object.keys(plan))
    if(!['version','structureId','roles','finishRoute','objectives','objections'].includes(k))
     bad.push('Unexpected plan field '+k);
   if(![1,2].includes(plan.version)||plan.structureId!==structure.id)bad.push('Structure plan version or identity mismatch');
   const roles=plan.roles;
   if(!plain(roles)||roles.lead!==structure.roles.lead||roles.other!==structure.roles.other)
    bad.push('Structure plan role mismatch');
   if(plan.finishRoute!==(sheet?.finishRoute||null))bad.push('Editorial plan changes signed finish');
   if(!Array.isArray(plan.objectives)||plan.objectives.length!==structure.objectives.length){
    bad.push('Structure objective count mismatch');return bad;
   }
   let sequences=0;
   plan.objectives.forEach((obj,i)=>{
    const known=structure.objectives[i];
    if(!plain(obj)){bad.push('Objective '+i+' must be an object');return}
    for(const k of Object.keys(obj))
     if(!['id','title','intent','actor','window','requires','commitment','call',...(plan.version===2?['sequence']:[])].includes(k))
      bad.push('Unexpected objective plan field '+k);
    for(const k of ['id','title','intent','actor'])
     if(obj[k]!==known[k])bad.push('Objective '+i+' changes '+k);
    if(JSON.stringify(obj.window)!==JSON.stringify(known.window)||
       JSON.stringify(obj.requires)!==JSON.stringify(known.requires))
     bad.push('Objective '+i+' changes timing or dependencies');
    if(obj.commitment!==(obj.call?'landmark':'guide'))bad.push('Objective '+i+' commitment must reflect actual signed call');
    if(Object.prototype.hasOwnProperty.call(obj,'sequence')){
     sequences++;
     if(plan.version!==2)bad.push('Conditional sequence requires plan v2');
     else bad.push(...validateSequence(obj.sequence,{...obj,window:known.window},sheet));
    }
    if(obj.call!=null){
     const c=obj.call;
     if(!plain(c)){bad.push('Invalid called spot '+i);return}
     for(const k of Object.keys(c))
      if(!['action','owner','proposedBy','label','source','chosen','backups'].includes(k))
       bad.push('Unexpected called spot field '+k);
     if(typeof c.action!=='string'||!actions[c.action])bad.push('Unknown named move in objective '+i);
     if(!['w','f'].includes(c.owner)||(known.actor!=='either'&&c.owner!==known.actor))
      bad.push('Move owner contradicts dramatic role '+i);
     if(!['agent','w','f'].includes(c.proposedBy)||!['suggested','manual','negotiated','revised'].includes(c.source))
      bad.push('Unknown provenance for called spot '+i);
     if(typeof c.chosen!=='boolean'||typeof c.label!=='string'||!c.label.trim()||c.label.length>120)
      bad.push('Incomplete called spot agreement '+i);
     if(!Array.isArray(c.backups)||c.backups.length>2||
       c.backups.some(move=>typeof move!=='string'||!actions[move]||move===c.action)||
       new Set(c.backups).size!==c.backups.length)
      bad.push('Invalid legal-alternative metadata '+i);
     if('status' in c||'actual' in c||'at' in c)bad.push('A planned spot must not claim to be performed '+i);
    }
   });
   if(plan.version===2&&sequences===0)bad.push('Plan v2 requires at least one conditional sequence');
   if(!Array.isArray(plan.objections)||plan.objections.length>10||
      plan.objections.some(x=>!plain(x)||!structure.objectives.some(o=>o.id===x.objective)||
       !['safety','prohibited'].includes(x.reason)||!['replace','open','keep'].includes(x.decision)||
       typeof x.from!=='string'||!actions[x.from]||(x.to!=null&&!actions[x.to])))
    bad.push('Invalid structure objection ledger');
   return bad;
  }
  function readPlan(sheet){
   if(!sheet||sheet.structurePlan==null)return {mode:'absent',plan:null,errors:[]};
   const structure=read(sheet);
   if(structure.mode!=='metadata_only')return {mode:'unsupported',plan:null,
    errors:structure.errors.length?structure.errors:['Missing supported structure contract']};
   const errors=validatePlan(sheet.structurePlan,structure.contract,sheet);
   return errors.length?{mode:'unsupported',plan:null,errors}:
    {mode:'editorial',plan:JSON.parse(JSON.stringify(sheet.structurePlan)),errors:[]};
  }
  // Career activation is opt-in: only a final, matching signed Phase 2
  // editorial layout is eligible. Old and traditional saves stay legacy.
  function executionChoice(sheet,selection){
   if(selection==null)return false;
   // readPlan validates content, but the career boundary must also require
   // a genuinely SIGNED v4 agreement; a tampered signed flag fails closed.
   if(!sheet?.signed||sheet.v!==4)throw Error('Selected match structure does not match a signed editorial plan');
   if(!plain(selection)||Object.keys(selection).some(k=>!['id','lead'].includes(k))||
      !Object.prototype.hasOwnProperty.call(DEFINITIONS,selection.id)||
      !['w','f'].includes(selection.lead))
    throw Error('Invalid selected match structure');
   const r=readPlan(sheet);
   if(r.mode!=='editorial'||r.plan.structureId!==selection.id||
      r.plan.roles.lead!==selection.lead)
    throw Error('Selected match structure does not match a signed editorial plan');
   return true;
  }
  function catalogue(){return Object.entries(DEFINITIONS).map(([id,def])=>({id,label:def.label,objectiveIds:def.objectives.map(d=>d[0])}));}
  return Object.freeze({VERSION,catalogue,create,validate,attach,read,validatePlan,readPlan,executionChoice});
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
   ...(s.promoReconciliation?{promoReconciliation:JSON.parse(JSON.stringify(s.promoReconciliation))}:{}),eventCount:s.ledger.length};
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
 // Phase 3: explicit opt-in runtime. Signed editorial objectives are immutable;
 // success is witnessed only by real graph actions, never a proposed move.
 const DIRECTOR=(function(){
  const F={
   opening_advantage:['chain','strike','running'],pressure:['ground','power','submission'],
   comeback:['fire','strike','running'],payoff:['power','suplex','neck','aerial'],
   technical_exchange:['chain','submission','ground'],escalation:['strike','power','suplex','neck','aerial'],
   callback:['chain','submission'],finish_build:['power','suplex','neck','strike','aerial'],
   evasion:['heel','outside'],exposure:['strike','running','chain'],
   shortcut:['heel'],escape:['heel','outside','chain','fire'],
   dominance:['power','suplex','neck','ground','strike','chain'],challenge:['fire','strike','running','chain','ground','power'],
   reassertion:['power','suplex','neck','ground','strike','chain']
  };
  const ARC={
   technical_exchange:['chain','test_strength','exchange'],
   escalation:['exchange','fighting_spirit','escalation'],
   callback:['chain','exchange','submission_battle'],
   evasion:['stalling','chain'],exposure:['exchange','shine'],
   shortcut:['cutoff','floor_heat'],escape:['hope','exchange'],
   dominance:['shine','control'],challenge:['exchange','comeback'],
   reassertion:['escalation','control'],
   opening_advantage:['shine','chain'],pressure:['control','limb_work'],
   comeback:['comeback','exchange'],payoff:['escalation','exchange'],
   finish_build:['escalation','finish_setup']
  };
  const active=M=>M?.structureDirector?.version===1&&M.structureDirector.mode==='active';
  // MP8A: independent conditional execution ledger. A dramatic objective
  // can be earned by other moves; that does not complete its signed setup.
  const sequenceRows=M=>active(M)&&Array.isArray(M.structureDirector.sequences)?M.structureDirector.sequences:[];
  const opposite=side=>side==='w'?'f':'w';
  const adaptiveSequences=M=>active(M)&&M.structureDirector.sequencePolicy===2;
  // Use the same deterministic psychology kernel as backstage planning.
  // This is live willingness to follow a plan, not a physical permission.
  let followModel;
  function sequenceWillingness(M){
   if(!followModel&&root.OfficePsychology){
    const family=(axis,values,weight)=>['low','medium','high'].map((grade,i)=>({
     id:axis+'_'+grade,output:'follow',value:values[i],weight,when:[axis+'.'+grade]
    }));
    followModel=root.OfficePsychology.createModel({curves:{
     consent:[35,60,85],professionalism:[30,60,85],stamina:[25,55,80],psychology:[30,60,85]
    },outputs:['follow'],rules:[
     ...family('consent',[15,55,95],4),...family('professionalism',[25,60,90],2),
     ...family('stamina',[10,55,90],2),...family('psychology',[30,60,90],1)
    ]});
   }
   const values={
    consent:Math.min(M.sheet.workerConsent,M.sheet.opponentConsent,M.comply),
    professionalism:Math.min(M.w.pro,M.f.pro),stamina:Math.min(M.wSt,M.fSt),
    psychology:Math.min(M.w.psych,M.f.psych)
   };
   return followModel?.evaluate(values,{}).scores.follow??50;
  }
  function sequenceSteps(seq){
   let entry={...seq.start};
   return seq.actions.map(id=>{
    const n=actions[id],performer=n.reverse?opposite(entry.control):entry.control;
    const exit={control:performer,position:n.zone,down:n.down==='d'?(n.reverse?entry.control:opposite(entry.control)):n.down==='a'?performer:null};
    const step={id,performer,entry,exit};entry=exit;return step;
   });
  }
  const equalState=(a,b)=>!!a&&!!b&&a.control===b.control&&a.position===b.position&&a.down===b.down;
  function sequenceWindow(M,o,remaining,opening=null){
   const frac=M.t/Math.max(1,M.len);
   // Preserve a finishing runway even for a very late negotiated setup.
   const duration=M.o.sequenceTimingVersion===1?o.sequence.actions.slice(-remaining).reduce((n,id,i)=>n+root.OfficeMatch.GRAPH.sequenceMoveSeconds(i===0&&opening?opening.action:id),0):remaining*20;
   return M.outcome==='booked'&&frac>=o.window[0]-.04&&frac<=o.window[1]+.08&&
    M.len-M.t>=Math.max(45,duration+25)&&frac<.91&&
    !M.bigSpotRequest&&!M.workingHurt&&!M.shortened;
  }
  function openingReadiness(M,steps,landed=false){
   if(M.sheet?.sequenceContinuationVersion!==1)return true;
   const graph=root.OfficeMatch.GRAPH,F=root.OfficePlanningFuzzy;
   const evidence=steps.map(x=>({...x,action:x.id}));
   if(!F.continuationGrip(evidence).possible)return false;
   const energy={w:M.wSt,f:M.fSt};
   let at=M.t;
   // At a witnessed first landing its costs have already been paid.
   // At a proposed opening they have not. Future selections begin no
   // earlier than the next 10-second graph opportunity.
   for(let i=0;i<steps.length;i++){
    const x=steps[i],cost=graph.costOf(x.id),side=x.entry.control;
    if(i===0&&landed){at+=10;continue;}
    if(at/Math.max(1,M.len)<(actions[x.id].after||0))return false;
    if(cost>=2.2&&energy[side]<16+cost*3.2)return false;
    energy[x.performer]-=Math.max(0,cost);
    const ticks=graph.sequenceMoveSeconds(x.id)/10;
    // Lower-bound routine exertion estimate; actual live validator is
    // still authoritative and may reject a later action.
    energy.w-=ticks*.5;energy.f-=ticks*.5;at+=ticks*10;
   }
   return true;
  }
  function sequenceContext(M,row,pre,previous,landed=null){
   const o=M.sheet.structurePlan.objectives.find(x=>x.id===row.objective);
   if(!o?.sequence||!['pending','running'].includes(row.status))return null;
   if(o.requires.some(id=>M.structureDirector.objectives.some(s=>s.id===id&&s.status==='pending')))return null;
   const steps=sequenceSteps(o.sequence);let step=steps[row.progress],opening=null;
   if(!step)return null;
   // A fallback is a separately signed first move, not invented after
   // the fact. For a natural landing, match its actual pre-state and ID.
   if(!row.progress&&o.sequence.version===2&&adaptiveSequences(M)&&
      (!equalState(pre,step.entry)||landed&&landed!==step.id||
       !landed&&(!sequenceMoveAllowed(M,step.id,step.performer)||!root.OfficeMatch.GRAPH.isValid(M,step.id)))){
    for(const entry of o.sequence.openings){
     if(!equalState(pre,entry.start)||landed&&landed!==entry.action)continue;
     const alt=sequenceSteps({start:entry.start,actions:[entry.action,...o.sequence.actions.slice(1)]})[0];
     if(!landed&&(!sequenceMoveAllowed(M,alt.id,alt.performer)||!root.OfficeMatch.GRAPH.isValid(M,alt.id)))continue;
     step=alt;opening=entry;break;
    }
   }
   if(!sequenceWindow(M,o,steps.length-row.progress,opening)||!equalState(pre,step.entry))return null;
   if(row.progress){
    const last=row.evidence.at(-1);
    if(!last||previous?.id!==last.id||previous.t!==last.at||
       previous.preControl!==last.entry.control||!equalState(previous,last.exit)||
       M.t-last.at>30||adaptiveSequences(M)&&Object.prototype.hasOwnProperty.call(pre,'node')&&pre.node!==last.id)return null;
   }else if(row.attempts>=3||!openingReadiness(M,opening?[step,...steps.slice(1)]:steps,!!landed))return null;
   return {o,steps,step,opening};
  }
  function sequenceMoveAllowed(M,id,actor){
   const n=actions[id],worker=actor==='w'?M.w:M.f,stamina=actor==='w'?M.wSt:M.fSt;
   const cost=root.OfficeMatch.GRAPH.costOf(id);
   if(!worker||worker.injury>0&&n.risk||cost>=2.2&&stamina<16+cost*3.2)return false;
   if(n.risk&&(M.planId==='safe'||M.sheet.spice<0||adaptiveSequences(M)&&(M.injury||M.foeHurt)))return false;
   const limits=M.sheet.limits,note=M.sheet.note?.honour&&!M.sheet.note.waived?M.sheet.note:null;
   return ![limits,note].some(l=>l&&(l.banIds?.includes(id)||l.ban?.includes(n.family)));
  }
  // A substitution is a real authored bridge between the observed
  // preceding move and the next signed move. Same performer, family and
  // resulting state; no risk increase, no substitute for the final call.
  function sequenceSubstitute(M,row,ctx,previous){
   if(!row.progress||row.progress>=ctx.steps.length-1||
      row.evidence.some(e=>e.planned)||!previous)return null;
   const graph=root.OfficeMatch.GRAPH,original=actions[ctx.step.id];
   const next=ctx.steps[row.progress+1].id,entry=ctx.step.entry;
   const candidates=(actions[previous.id]?.next||[]).filter(([,weight])=>weight>0).map(([id])=>id).filter(id=>{
    const n=actions[id];
    if(!n||id===ctx.step.id||ctx.o.sequence.actions.includes(id)||row.evidence.some(e=>e.id===id)||
       n.family!==original.family||n.reverse!==original.reverse||n.counterOf||n.blockOf||n.nearfall||n.risk||
       graph.costOf(id)>graph.costOf(ctx.step.id)+.3||
       !n.next.some(([to,weight])=>to===next&&weight>0))return false;
    const performer=n.reverse?opposite(entry.control):entry.control;
    const exit={control:performer,position:n.zone,down:n.down==='d'?(n.reverse?entry.control:opposite(entry.control)):n.down==='a'?performer:null};
    return performer===ctx.step.performer&&equalState(exit,ctx.step.exit)&&
     sequenceMoveAllowed(M,id,performer)&&graph.isValid(M,id);
   });
   return candidates.sort((a,b)=>Math.abs(graph.costOf(a)-graph.costOf(ctx.step.id))-Math.abs(graph.costOf(b)-graph.costOf(ctx.step.id))||a.localeCompare(b))[0]||null;
  }
  // Expose a candidate only; Graph still enforces its complete live pool
  // filters, stamina, physical grip, location, note and authored defences.
  function sequenceOffer(M,pre){
   const g=M.graph;
   if(!g||g.pendingAerial||g.pendingGrapple||g.pendingStrike||g.pendingContact)return null;
   const previous=g.events.at(-1);
   for(const row of sequenceRows(M)){
    const adaptive=adaptiveSequences(M);
    const ctx=sequenceContext(M,row,adaptive?{...pre,node:g.node}:pre,previous);
    if(!ctx)continue;
    const actor=ctx.step.performer;
    let id=ctx.step.id;
    const allowed=sequenceMoveAllowed(M,id,actor);
    if(!adaptive){if(allowed)return {id,continuation:row.progress>0};continue;}
    if(!allowed||!root.OfficeMatch.GRAPH.isValid(M,id)){
     id=sequenceSubstitute(M,row,ctx,previous);
     if(!id)continue;
    }
    const willingness=sequenceWillingness(M);
    // Willing workers get a strong but still probabilistic continuation.
    // Low consent and fatigue retain a substantial competing pool.
    const follow=Math.max(0,Math.min(1,willingness/100));
    const actorProfile=root.OfficeMatch.livePsychology?.(M,actor);
    // MP10: improv preference only changes a legal substitute's weight;
    // the bridge, final call, retry limit and physics checks stay unchanged.
    const improv=id!==ctx.step.id&&actorProfile?Math.max(.8,Math.min(1.2,1+(actorProfile.scores.improvisation-50)/200)):1;
    const ratio=(row.progress?2.5+follow*8:1+follow*2)*improv;
    return {id,continuation:row.progress>0,objective:row.objective,planned:ctx.opening?ctx.o.sequence.actions[0]:ctx.step.id,
     ratio,willingness};
   }
   return null;
  }
  function interruptSequence(row,why,code='exchange_broken'){
   if(row.status!=='running')return;
   row.interruptions++;
   if(row.causes)row.causes[code]=(row.causes[code]||0)+1;
   // Keep best witnessed prefix for diagnostics, not as future progress.
   if(row.evidence.length>row.best.length)row.best=row.evidence.map(e=>JSON.parse(JSON.stringify(e)));
   row.progress=0;row.evidence=[];row.status=row.attempts>=3?'missed':'pending';row.reason=why;
  }
  // Called at the sole Graph.apply landing boundary, with genuine
  // pre-state and previous graph event. No attempted/countered parent
  // can count as the expected landing; no synthetic state transitions.
  function observeSequence(M,e,pre,previous,offer=null){
   if(!M.graph?.events?.includes(e)||!actions[e.id]||!pre)return;
   for(const row of sequenceRows(M)){
    if(!['pending','running'].includes(row.status))continue;
    const ctx=sequenceContext(M,row,pre,previous,e.id);
    const substituted=adaptiveSequences(M)&&ctx&&offer?.objective===row.objective&&offer.planned===ctx.step.id&&
     offer.id===e.id&&e.id!==ctx.step.id;
    if(!ctx||e.id!==ctx.step.id&&!substituted||!equalState(e,ctx.step.exit)||e.preControl!==ctx.step.entry.control){
     const n=actions[e.id],expected=ctx?.step.id;
     const counter=!!(n?.counterOf===expected||n?.blockOf===expected)&&!!expected;
     const code=counter?'defended':!ctx?'state_or_window':'different_move';
     interruptSequence(row,!adaptiveSequences(M)?'The connected exchange was interrupted.':counter?'The planned attack was defended.':!ctx?'The required position or timing was lost.':'The wrestlers chose another move.',code);continue;
    }
    if(!row.progress){row.attempts++;row.status='running';row.reason=null;}
    row.evidence.push({id:e.id,at:e.t,progress:e.t/Math.max(1,M.len),performer:ctx.step.performer,entry:{...ctx.step.entry},exit:{...ctx.step.exit},
     ...(ctx.opening?{planned:ctx.o.sequence.actions[0],opening:true,reason:'A signed alternative opening reached the agreed exchange.'}:substituted?{planned:ctx.step.id,reason:'A legal authored bridge replaced the unavailable intermediate move.'}:{})});
    row.progress++;
    if(row.progress===ctx.steps.length){
     const adapted=row.evidence.some(x=>x.planned);
     row.status=adapted?'adapted':'completed';row.at=e.t;
     row.reason=adapted?'Connected setup adapted; the agreed final move landed.':'All consecutive graph landings verified.';
    }
   }
  }
  function advanceSequences(M,final=false){
   for(const row of sequenceRows(M)){
    if(!['pending','running'].includes(row.status))continue;
    const o=M.sheet.structurePlan.objectives.find(x=>x.id===row.objective);
    if(row.status==='running'&&M.t-row.evidence.at(-1).at>30)interruptSequence(row,'The next move did not follow in time.','timeout');
    if(final||!o||M.t/Math.max(1,M.len)>o.window[1]+.08||M.len-M.t<45||M.shortened){
     if(row.status==='running'&&row.evidence.length>row.best.length)row.best=row.evidence.map(e=>JSON.parse(JSON.stringify(e)));
     row.status='missed';row.reason=final?'The bell came before the sequence was completed.':'The safe window for the sequence closed.';
     if(row.causes){
      const code=final?'bell':M.shortened?'shortened':'window_closed';
      row.causes[code]=(row.causes[code]||0)+1;
     }
    }
   }
  }
  function init(M){
   if(M.o.structureExecution!==true)return;
   const r=STRUCTURES.readPlan(M.sheet);
   if(!M.sheet?.signed||r.mode!=='editorial')throw Error('Active structure requires a valid signed editorial plan');
   M.structureDirector={version:1,mode:'active',id:r.plan.structureId,roles:{...r.plan.roles},
    objectives:r.plan.objectives.map(o=>({id:o.id,intent:o.intent,status:'pending',at:null,reason:null,evidence:[]})),
    ...(r.plan.version===2?{...(M.o.sequencePolicy!==1?{sequencePolicy:2}:{}),sequences:r.plan.objectives.filter(o=>o.sequence).map(o=>({
     objective:o.id,status:'pending',progress:0,attempts:0,interruptions:0,at:null,reason:null,evidence:[],best:[],
     ...(M.o.sequencePolicy!==1?{causes:{}}:{})
    }))}:{})};
  }
  function current(M){
   if(!active(M))return null;
   const states=M.structureDirector.objectives,plan=M.sheet.structurePlan.objectives,at=M.t/Math.max(1,M.len);
   for(let i=0;i<states.length;i++){
    if(states[i].status!=='pending'||at>plan[i].window[1]+.08)continue;
    if(plan[i].requires.some(id=>states.some(s=>s.id===id&&s.status==='pending')))continue;
    return {state:states[i],objective:plan[i],index:i};
   }
   return null;
  }
  const DIRTY=/cheap_shot|eye_rake|_rake|_thumb|hair_pull|_bite|low_blow|choke|rope_leverage|fake_injury|distraction_apron|_poke|_low_blow_tease/;
  const EVASIVE=/^hl_(?:stall|beg|ref_argue|distraction_apron)$|^floor_regroup$/;
  const ESCAPE=/wrist_escape|waist_escape|headlock_escape|mat_scramble|floor_counter|armbar_roll|counter_strike/;
  const EXPOSURE_CORE=new Set(['clothesline','arm_drag','snap_suplex','short_arm_lariat','counter_strike','shoulder_tackle','mat_takedown','heavy_slam']);
  function fits(o,e,n,actor){
   if(o.actor!=='either'&&o.actor!==actor)return false;
   const id=e.id,kind=o.intent,f=n.family||'';
   if(n.nearfall||n.blockOf&&kind!=='escape')return false;
   if(kind==='evasion')return !n.reverse&&EVASIVE.test(id);
   if(kind==='shortcut')return !n.reverse&&!n.blockOf&&DIRTY.test(id);
   if(kind==='escape')return !!n.reverse||!!n.blockOf||ESCAPE.test(id);
   if(kind==='exposure'){
    if(n.reverse)return true; // genuine counter of the heel's initiative
    if(EXPOSURE_CORE.has(id))return true;
    return ['strike','running','chain','fire','power','suplex','neck','aerial','springboard','lucha'].includes(f)&&
      (n.cost??1)>=1&&!(n.crowd<0);
   }
   if(!F[kind]?.includes(f))return false;
   if(['escalation','finish_build','payoff'].includes(kind))
    return (n.cost??0)>=1.4&&(n.crowd??0)>=0;
   if(['dominance','reassertion'].includes(kind))return (n.cost??0)>=.9&&(n.crowd??0)>=0;
   return true;
  }
  // Planning and live recognition use the same objective compatibility.
  function compatibleCall(o,id,owner){
   const n=actions[id];return !!n&&fits(o,{id},n,owner);
  }
  function enough(intent,ev,previous){
   const moves=new Set(ev.map(x=>x.id)),sides=new Set(ev.map(x=>x.actor));
   if(intent==='technical_exchange')return sides.size===2&&moves.size>=2;
   if(intent==='callback')return ev.some(x=>previous.some(p=>p.family===x.family&&x.at>=p.at+30&&(x.id===p.id||x.actor!==p.actor)));
   if(intent==='evasion')return ev.length>=1; // A witnessed evasive action, not a posed intention.
   // Escape needs recent real opponent pressure, not just an incidental
   // defensive action with no threat to escape from.
   if(intent==='escape')return ev.some(x=>x.threatened);
   // A final attack can grow out of a different, actually witnessed late
   // setup: two distinct qualifying closing moves remain sufficient, but
   // one impactful closing move plus an earlier earned beat is also causal.
   // Never credit the signed call alone or a phantom hit.
   if(intent==='finish_build')return moves.size>=2||ev.some(e=>e.impact&&
    previous.some(p=>p.id!==e.id&&p.at<e.at&&e.at-p.at<=150));
   if(intent==='escalation')return moves.size>=2;
   if(intent==='exposure')return ev.some(e=>e.countered||e.impact)||moves.size>=2;
   if(['opening_advantage','pressure','comeback','dominance','challenge','reassertion','evasion'].includes(intent))
    return ev.length>=2&&moves.size>=2;
   return ev.length>0;
  }
  function observe(M,e){
   if(!active(M)||!e||!Number.isFinite(e.t)||!M.graph?.events?.includes(e))return;
   const n=actions[e.id];if(!n)return; // ignore attempted / invented / outcome cues
   const actor=n.blockOf?(e.preControl==='w'?'f':'w'):n.reverse?e.control:e.preControl;
   if(actor!=='w'&&actor!=='f')return;
   const states=M.structureDirector.objectives,plan=M.sheet.structurePlan.objectives,frac=e.t/Math.max(1,M.len);
   for(let i=0;i<states.length;i++){
    const s=states[i],o=plan[i];
    if(s.status!=='pending'||frac<o.window[0]-.04||frac>o.window[1]+.08||
       o.requires.some(id=>states.some(x=>x.id===id&&x.status==='pending'))||!fits(o,e,n,actor))continue;
    // Capture progress at the action's actual instant. Live 'go home' /
    // 'cut' decisions can subsequently change M.len; a later final duration
    // must never make a legitimately witnessed move appear out of window.
    // The escape is earned only when a REAL opponent attack occurred close
    // to this recorded defensive move. No synthetic damage or control switch.
    const dangerRange=Math.min(150,M.len*.18);
    const threatened=o.intent==='escape'&&M.graph.events.slice(0,-1).some(previous=>{
     const attack=actions[previous.id];
     return previous.t<e.t&&e.t-previous.t<=dangerRange&&
      (previous.preControl==='w'||previous.preControl==='f')&&previous.preControl!==actor&&
      attack&&!attack.reverse&&!attack.blockOf&&!attack.nearfall&&
      (attack.cost??0)>=1.5&&
      ['strike','running','power','suplex','neck','submission','aerial','fire','ground','corner'].includes(attack.family);
    });
    const fact={id:e.id,at:e.t,progress:frac,actor,family:n.family||null,
     ...(o.intent==='escape'?{threatened}:{}),
     countered:!!n.reverse,impact:!!n.reverse||(!n.blockOf&&
      (['strike','running','power','suplex','neck','aerial','springboard','lucha'].includes(n.family)||
       EXPOSURE_CORE.has(e.id))&&(n.cost??1)>=1)};
    if(s.evidence.some(x=>x.id===fact.id&&x.at===fact.at&&x.actor===actor))return;
    s.evidence.push(fact);if(s.evidence.length>12)s.evidence.shift();
    // A tactical callback can refer to any earlier witnessed exchange.
    const prior=states.slice(0,i).flatMap(x=>x.evidence);
    if(enough(o.intent,s.evidence,prior)){
     s.status=o.requires.some(id=>states.some(x=>x.id===id&&x.status==='missed'))?'adapted':'achieved';
     s.at=e.t;s.reason='Verified from time-ordered performed graph actions.';
    }
    return; // One landing cannot finish two objectives.
   }
  }
  function advance(M){
   if(!active(M))return;
   advanceSequences(M);
   const at=M.t/Math.max(1,M.len);
   M.structureDirector.objectives.forEach((s,i)=>{
    if(s.status==='pending'&&at>M.sheet.structurePlan.objectives[i].window[1]+.08){
     s.status='missed';s.reason='No sufficient performed evidence in the planned window.';
    }
   });
  }
  function finalize(M){
   if(!active(M))return;
   advance(M);advanceSequences(M,true);
   for(const s of M.structureDirector.objectives)if(s.status==='pending'){
    s.status='missed';s.reason='The bell came before enough performed evidence.';
   }
  }
  // The action pool is built for the controller, but the defending side
  // PERFORMS a reversal or block. Never weight that for the attacker.
  const performer=(side,n)=>n.reverse||n.blockOf?(side==='w'?'f':'w'):side;
  function dependencyFocus(M){
   if(M.o.sequenceDependencyVersion!==1||M.sheet?.sequenceContinuationVersion!==1||
      M.outcome!=='booked'||M.workingHurt||M.shortened||M.bigSpotRequest)return null;
   const x=current(M);if(!x)return null;
   const {objective:o,state}=x,frac=M.t/Math.max(1,M.len);
   // Respect the active objective's actual evidence window. Restrict
   // this policy to simple distinct-action evidence, not special heel,
   // callback, escape, or both-performer technical conditions.
   if(!['opening_advantage','pressure','comeback','dominance','challenge','reassertion','escalation'].includes(o.intent)||
      frac<o.window[0]-.04||frac>o.window[1]+.08)return null;
   const rows=sequenceRows(M),graph=root.OfficeMatch.GRAPH;
   if(rows.some(r=>r.status==='running'))return null;
   const next=M.sheet.structurePlan.objectives.find(n=>n.requires.includes(o.id)&&n.sequence&&
    rows.some(r=>r.objective===n.id&&r.status==='pending'&&!r.attempts));
   if(!next||frac>next.window[1]+.08||frac>=.91)return null;
   const duration=next.sequence.actions.reduce((n,id)=>n+graph.sequenceMoveSeconds(id),0);
   const earliest=Math.max(M.t,next.window[0]*M.len-.04*M.len);
   if(M.len-earliest<Math.max(45,duration+25)+20)return null;
   return {state,objective:o,next};
  }
  function dependencyPreference(M,id,side,focus=dependencyFocus(M)){
   const n=actions[id];if(!focus||!n)return 1;
   const actor=performer(side,n),{state,objective:o}=focus;
   // The same recogniser used at actual landing, not family alone.
   // Do not boost hazards, pending-parent counters, or repeated moves.
   if(n.risk||n.blockOf||n.counterOf||n.nearfall||!fits(o,{id},n,actor)||
      state.evidence.some(e=>e.id===id)||!sequenceMoveAllowed(M,id,actor))return 1;
   // A second distinct qualifying action is enough for these intents.
   // A bounded preference only: no new graph candidates, RNG draws,
   // forced success, change of control, or fabricated evidence.
   return state.evidence.length?2.8:1.7;
  }
  function bias(M,id,side){
   const x=current(M),n=actions[id];if(!x||!n)return 1;
   const o=x.objective,frac=M.t/Math.max(1,M.len);
   // Keep all three non-Heel directors on their already-tested tuning.
   // Their dramaturgy must not change as a side effect of the Heel repair.
   if(M.structureDirector.id!=='chickenshit_heel'){
    // Defensive moves belong to the defender, not the source attacker.
    const actor=performer(side,n);
    if(frac<o.window[0]-.07||o.actor!=='either'&&o.actor!==actor)return 1;
    const focus=dependencyFocus(M);
    const preference=focus?dependencyPreference(M,id,side,focus):1;
    if(o.call?.action===id&&o.call.owner===actor&&fits(o,{id},n,actor))return 4.6*preference;
    // In the focused window, remove the structural bonus from moves
    // that do not actually add distinct evidence. Their ordinary
    // graph/style weights remain intact; signed named calls retain theirs.
    if(focus)return fits(o,{id},n,actor)&&!focus.state.evidence.some(e=>e.id===id)?2.8*preference:1;
    return F[o.intent]?.includes(n.family)&&
     (!['evasion','shortcut','escape'].includes(o.intent)||fits(o,{id},n,actor))?2.8:1;
   }
   const actor=performer(side,n);
   if(frac<o.window[0]-.07||o.actor!=='either'&&o.actor!==actor)return 1;
   if(o.call?.action===id&&o.call.owner===actor&&fits(o,{id},n,actor))return 4.6;
   return fits(o,{id},n,actor)?2.8:1;
  }
  // Add *available* authored actions to the same ordinary graph pool, not
  // scripted results. isValid, stamina, location, safety, pending exact-parent
  // defences, performer consent, and subsequent RNG all still apply.
  const HEEL_GUIDES={
   evasion:['hl_stall','hl_beg','hl_ref_argue','hl_distraction_apron'],
   exposure:['counter_strike','clothesline','arm_drag','st_headbutt','st_roundhouse','ch_rollthrough','shoulder_tackle'],
   shortcut:['st_eye_rake','hl_rake','hl_thumb','hl_hair_pull','hl_bite','hl_rope_leverage','hl_fake_injury','cheap_shot'],
   escape:['counter_strike','wrist_escape','headlock_escape','waist_escape','mat_scramble','armbar_roll','floor_counter']
  };
  function offers(M,side){
   const goal=current(M);if(!goal)return [];
   const o=goal.objective;
   if(M.structureDirector.id!=='chickenshit_heel'){
    // Phase 8: the signed action must enter the pool before its bias matters.
    // The ordinary graph validator still enforces exact-parent counters,
    // position, location, stamina, training and safety; never script a result.
    const id=o.call?.action,n=actions[id],frac=M.t/Math.max(1,M.len);
    if(!n||frac<o.window[0]-.04||frac>o.window[1]+.08||
       o.call.owner!==performer(side,n)||!fits(o,{id},n,o.call.owner))return [];
    return [[id,4.2]];
   }
   // Retain the Phase 7 Heel pool and weights unchanged.
   const arr=HEEL_GUIDES[o.intent]||[];
   const last=M.graph?.events?.at(-1),time=M.t;
   // A counter is only presented as a desperate escape when an opponent
   // has actually attacked in the preceding exchange, not as free offence.
   const realPressure=last&&last.control===side&&last.preControl===side&&
    time-last.t>=0&&time-last.t<=35&&actions[last.id]&&
    !actions[last.id].reverse&&!actions[last.id].blockOf&&
    (actions[last.id].cost??1)>=.7&&
    !['rest','heel'].includes(actions[last.id].family);
   const out=[],seen=new Set();
   for(const id of [o.call?.action,...arr]){
    if(!id||seen.has(id))continue;seen.add(id);
    const n=actions[id];if(!n)continue;
    const actor=performer(side,n);
    if(!fits(o,{id},n,actor))continue;
    if(o.intent==='escape'&&n.reverse&&!realPressure)continue;
    // An eligible called spot is a stronger *preference*, never a landing.
    // Phase 7: preferences, not automatic execution. Ease the old near-
    // deterministic Heel shortcuts without removing any legal option.
    out.push([id,id===o.call?.action?5.5:3.5]);
   }
   return out;
  }
  function arcBias(M,id){
   const x=current(M);return x&&ARC[x.objective.intent]?.includes(id)?
    (M.structureDirector.id==='chickenshit_heel'?3.4:5.6):1;
  }
  // Export a compact, factual receipt for the existing career rivalry
  // ledger. A planned or attempted action is not a witnessed delivery.
  function sequenceReceipt(M,row){
   if(!['completed','adapted','missed'].includes(row.status))return null;
   const obj=M.sheet?.structurePlan?.objectives?.find(o=>o.id===row.objective),seq=obj?.sequence;
   if(!seq)return null;
   const planned=seq.actions,steps=sequenceSteps(seq);
   const evidence=row.status==='missed'&&row.best.length>row.evidence.length?row.best:row.evidence;
   if(!Array.isArray(evidence)||evidence.length>planned.length)return null;
   let changes=0;
   for(let i=0;i<evidence.length;i++){
    const e=evidence[i],n=actions[e.id];let step=steps[i];
    const opening=i===0&&e.opening===true&&seq.version===2?seq.openings.find(x=>x.action===e.id&&equalState(x.start,e.entry)):null;
    if(e.opening&&!opening)return null;
    if(opening)step=sequenceSteps({start:opening.start,actions:[opening.action,...planned.slice(1)]})[0];
    if(!n||!equalState(e.entry,step.entry)||!equalState(e.exit,step.exit)||e.performer!==step.performer||
       (e.planned||e.id)!==(opening?planned[0]:step.id)||!Number.isFinite(e.at)||
       !M.graph?.events?.some(x=>x.id===e.id&&x.t===e.at&&x.preControl===e.entry.control&&equalState(x,e.exit)&&
        ['aerialResolution','grappleResolution','strikeResolution','contactResolution'].every(k=>!x[k]||x[k]==='landed')))return null;
    if(i&&(!actions[evidence[i-1].id]?.next?.some(([id,w])=>id===e.id&&w>0)||
       e.at<evidence[i-1].at||e.at-evidence[i-1].at>30))return null;
    if(e.planned){
     const original=actions[step.id];
     if(opening){if(++changes>1||e.planned!==planned[0]||e.id===planned[0])return null;continue;}
     if(++changes>1||i===0||i===planned.length-1||e.id===e.planned||n.risk||
        n.family!==original.family||n.reverse!==original.reverse||
        !n.next.some(([id,w])=>id===planned[i+1]&&w>0))return null;
    }
   }
   if(row.status!=='missed'&&(evidence.length!==planned.length||evidence.at(-1)?.id!==obj.call.action||
      (row.status==='adapted')!==(changes===1)))return null;
   if(row.status==='missed'&&evidence.length===planned.length)return null;
   return {v:1,objective:obj.id,status:row.status,planned:planned.slice(),
    witnessed:evidence.map(e=>({id:e.id,at:e.at,performer:e.performer,...(e.planned?{planned:e.planned}:{}) ,...(e.opening?{opening:true}:{})})),
    attempts:row.attempts,interruptions:row.interruptions,
    protectedExit:!!(M.injury||M.foeHurt||M.workingHurt||M.shortened||M.outcome!=='booked')};
  }
  function report(M){
   if(!active(M))return null;
   const d=M.structureDirector;
   return {version:d.version,id:d.id,roles:{...d.roles},
    objectives:d.objectives.map(s=>({...s,evidence:s.evidence.map(x=>({...x}))})),
    ...(Array.isArray(d.sequences)?{sequences:d.sequences.map(row=>{
     const receipt=sequenceReceipt(M,row);
     return {...JSON.parse(JSON.stringify(row)),...(receipt?{receipt}:{})};
    })}:{})};
  }
  // Presentation only: do not turn missing evidence or protected exits into blame.
  function deliveryDebrief(row){
   const r=row?.receipt, count=r?.witnessed?.length||0;
   if(r?.v!==1||r.status!==row.status||!Array.isArray(r.planned)||!Array.isArray(r.witnessed))
    return {label:'Unverified',tone:'',note:'No verified receipt is available. No delivery memory is inferred.'};
   if(r.status==='completed')return {label:'Delivered as agreed',tone:'achieved',note:'All agreed moves were witnessed.'};
   if(r.status==='adapted')return {label:'Delivered with adaptation',tone:'adapted',note:'An alternative move preserved the agreed final move.'};
   if(r.status!=='missed')return {label:'Unverified',tone:'',note:'No terminal delivery is verified.'};
   if(r.protectedExit)return {label:'Protected exit',tone:'',note:'The bout had a protected exit. Incomplete delivery is not negative evidence.'};
   if(!count)return {label:r.attempts?'No verified landing':'No opening',tone:'',note:'No agreed sequence move was verified. This is not negative evidence.'};
   if(r.interruptions>0)return {label:'Interrupted sequence',tone:'missed',note:'A verified prefix was interrupted. Future sequence proposals may reflect this shared experience, not personal blame.'};
   return {label:'Incomplete sequence',tone:'',note:'Only part of the sequence was verified. No interruption-based negative evidence is inferred.'};
  }
  return {active,init,current,observe,advance,finalize,bias,offers,arcBias,report,compatibleCall,dependencyFocus,dependencyPreference,sequenceOffer,openingReadiness,observeSequence,deliveryDebrief};
 })();
 root.OfficeGraphKernel=K;root.OfficeSheets={MODE,STRUCTURES,DIRECTOR,build,focusOptions,revise,observe,boost,advance,intervention,finalize,report,proposal,strip,STRIP_NAME,settleVow,closeVows};
})(typeof window!=='undefined'?window:globalThis);
