/* Isolated analysis only. All inference and legal proposals use production code. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OfficeFuzzyLab=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 function spec(model){return clone({curves:model.curves,outputs:model.outputs,rules:model.rules,prior:model.prior});}
 function evaluate(K,model,values,cues={},edits={}){
  const config=spec(model);
  for(const [axis,knots] of Object.entries(edits)){
   if(!Object.hasOwn(config.curves,axis))throw Error('Unknown membership axis: '+axis);
   config.curves[axis]=knots.slice();
  }
  const sandbox=K.createModel(config);
  return {config,grades:sandbox.fuzzify(values),...sandbox.evaluate(values,cues)};
 }
 function setup(root,cfg){
  const D=root.OfficeData,R=root.OfficeRoom,F=root.OfficePlanningFuzzy;
  const w0=D.ALL.find(x=>x.id===cfg.w),f0=D.ALL.find(x=>x.id===cfg.f);
  if(!w0||!f0||w0.id===f0.id)throw Error('Select two different wrestlers.');
  if(D.divisionOf(w0.id)!==D.divisionOf(f0.id))throw Error('Select wrestlers from the same division.');
  const w={...w0,...cfg.worker},f={...f0,...cfg.opponent};
  const c={id:'fuzzy-lab-'+cfg.seed,wid:w.id,rid:f.id,pid:D.PROMOS[0].id,slot:'main',finish:cfg.finish,minutes:cfg.minutes||12,eventAbs:10,feudHeat:cfg.heat||0};
  const p=D.PROMOS[0],opts={structure:{id:cfg.structure,lead:cfg.lead},structurePlanning:true,planningCareer:{},planningInitiative:true,planningProposal:true,planningDialogue:true,planningBargaining:true,planningSequences:true,planningSequencePolicy:2,planningSequenceSigning:true};
  const room=R.begin(c,w,f,p,opts);
  R.act(room,'plan_'+cfg.approach);
  return {room,w,f,c,profile:side=>F.behaviour(room.planningEvidence,room,side)};
 }
 function alternatives(root,room){
  const R=root.OfficeRoom,A=root.OfficeMatch.GRAPH.A,out=[];
  for(const [objective,call] of Object.entries(room.structureBoard||{})){
   if(!call?.action)continue;
   let n=0;
   for(const id of Object.keys(A)){
    if(id===call.action)continue;
    const evidence=R.proposalEvidence(room,objective,id);
    if(!evidence.eligible)continue;
    out.push({objective,action:id,owner:call.owner,label:(A[call.action].name||call.action)+' → '+(A[id].name||id)});
    if(++n>=8)break;
   }
  }
  return out;
 }
 function replay(root,cfg,choices=[]){
  const R=root.OfficeRoom,{room}=setup(root,cfg);
  const steps=[{id:'plan_'+cfg.approach,stage:'plan'}];
  for(let i=0;i<100&&room.stage!=='done';i++){
   const opts=R.options(room);
   if(!opts.length)throw Error('Replay stopped without an available choice.');
   const requested=choices[i],preferred=({board:'board_ok',review:'review_ok',curtain:'talk_none'})[room.stage];
   const choice=requested?opts.find(o=>o.id===requested):opts.find(o=>o.id===preferred)||opts[0];
   if(!choice)throw Error('Unavailable replay choice: '+requested);
   steps.push({id:choice.id,stage:room.stage,label:choice.label});
   R.act(room,choice.id);
  }
  if(room.stage!=='done')throw Error('Replay did not reach a signed layout within 100 decisions.');
  return {steps,log:clone(room.log),sheet:clone(room.sheet)};
 }
 function distribution(root,cfg,model,edits={}){
  const D=root.OfficeData,rows=[];
  for(const w of D.ALL){
   const preferred=D.ALL.find(f=>f.id===cfg.f&&f.id!==w.id&&D.divisionOf(f.id)===D.divisionOf(w.id));
   const opponent=preferred||D.ALL.find(f=>f.id!==w.id&&D.divisionOf(f.id)===D.divisionOf(w.id));
   if(!opponent)continue;
   const context=setup(root,{...cfg,w:w.id,f:opponent.id,worker:{},opponent:{}});
   const p=context.profile('w'),v=evaluate(root.OfficePsychology,model,p.observation.values,p.cues,edits);
   rows.push({id:w.id,name:w.name,opponent:opponent.id,scores:v.scores});
  }
  return {count:rows.length,rows,outputs:Object.fromEntries(model.outputs.map(k=>{
   const values=rows.map(r=>r.scores[k]).filter(Number.isFinite),bins=Array(5).fill(0);
   for(const v of values)bins[Math.min(4,Math.floor(v/20))]++;
   return [k,{count:values.length,bins,mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null}];
  }))};
 }
 return {spec,evaluate,setup,alternatives,replay,distribution};
});