(function(){'use strict';
const $=id=>document.getElementById(id),D=window.OfficeData,P=window.OfficePlanningFuzzy,K=window.OfficePsychology,L=window.OfficeFuzzyLab;
const cohort=L.loadAcademy(window,47);
const models={behaviour:P.behaviourModel,proposal:P.proposalModel,sequence:P.sequencePreferenceModel},edits={behaviour:{},proposal:{},sequence:{}};
const node=(tag,text,parent)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;parent?.append(e);return e;};
const options=(el,items,value)=>{el.replaceChildren();for(const [v,t] of items){const o=node('option',t,el);o.value=v;}if([...el.options].some(o=>o.value===value))el.value=value;};
const roster=()=>D.ALL.slice().sort((a,b)=>a.name.localeCompare(b.name));
const rosterLabel=x=>x.name+(x.id.startsWith('academy-')?' (Academy preview)':'');
options($('w'),roster().map(x=>[x.id,rosterLabel(x)]),'rex');
function opponents(){options($('f'),roster().filter(x=>x.id!==$('w').value&&D.divisionOf(x.id)===D.divisionOf($('w').value)).map(x=>[x.id,rosterLabel(x)]),$('f').value||'silas');}
opponents();options($('structure'),OfficeSheets.STRUCTURES.catalogue().map(x=>[x.id,x.label]),'classic_american');options($('approach'),Object.entries(D.PLANS).map(([id,p])=>[id,p.name]),'story');
const overrideKeys=['fatigue','morale','pro','ego','psych','safe','ring'];
for(const side of ['w','f'])for(const key of overrideKeys){const l=node('label',(side==='w'?'Wrestler':'Opponent')+' '+key,$('circumstances'));const input=node('input',null,l);input.id=side+'_'+key;input.type='number';input.min=0;input.max=100;input.placeholder='Original';}
function cfg(){const overrides=side=>Object.fromEntries(overrideKeys.flatMap(k=>{const x=$(side+'_'+k).value;return x===''?[]:[[k,Math.max(0,Math.min(100,Number(x)))]];}));return {w:$('w').value,f:$('f').value,structure:$('structure').value,approach:$('approach').value,lead:$('lead').value,finish:$('finish').value,seed:Number($('seed').value)||1,heat:Math.max(0,Math.min(100,Number($('heat').value)||0)),worker:overrides('w'),opponent:overrides('f')};}
const kind=()=>$('model').value,model=()=>models[kind()],activeEdits=()=>edits[kind()];
let context,choices=[],lastReplay=null,lastDistribution=null;
function axisOptions(){options($('axis'),Object.keys(model().curves).map(x=>[x,x]),$('axis').value);knots();}
function knots(){const values=activeEdits()[$('axis').value]||model().curves[$('axis').value];['low','middle','high'].forEach((k,i)=>$(k).value=values[i]);}
function curve(values){const svg=$('curve');svg.replaceChildren();const [a,b,c]=activeEdits()[$('axis').value]||model().curves[$('axis').value];const lines=[[[0,1],[a,1],[b,0],[100,0]],[[0,0],[a,0],[b,1],[c,0],[100,0]],[[0,0],[b,0],[c,1],[100,1]]];const make=(tag,attrs)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);svg.append(e);return e;};lines.forEach((pts,i)=>make('polyline',{points:pts.map(([x,y])=>[20+x*4.6,105-y*85].join(',')).join(' '),stroke:['#8ab8df','#f5cf7e','#82c7a0'][i],fill:'none','stroke-width':3}));for(const [i,v] of values.entries())if(Number.isFinite(v))make('line',{x1:20+v*4.6,x2:20+v*4.6,y1:10,y2:110,stroke:i?'#f7b6b6':'#fff','stroke-dasharray':'4 3'});['Low','Medium','High'].forEach((s,i)=>{const e=make('text',{x:20+i*150,y:121,fill:['#8ab8df','#f5cf7e','#82c7a0'][i],'font-size':11});e.textContent=s;});}
function scores(parent,name,data,base){const c=node('div',null,parent);node('h3',name,c);for(const [key,v] of Object.entries(data.scores)){const r=node('div',null,c);r.className='metric';node('span',key,r);const m=node('meter',null,r);m.min=0;m.max=100;m.value=v??0;node('span',Number.isFinite(v)?v.toFixed(1):'—',r);if(Number.isFinite(v)&&Number.isFinite(base[key]))r.title='Production: '+base[key].toFixed(1);}}
function render(){try{
 const mode=kind(),F=P,room=context.room;
 let results=[];
 if(mode==='behaviour')results=['w','f'].map(s=>{const p=context.profile(s);return {name:context[s].name,values:p.observation.values,cues:p.cues};});
 else if(mode==='sequence'){const q=P.sequencePreference(room.planningEvidence,room);results=[{name:'Shared sequence preference',values:q.values,cues:{}}];}
 else{const choice=choices[Number($('proposal').value)];if(choice)results=['w','f'].flatMap(s=>{const q=P.evaluateProposal(room.planningEvidence,room,s,choice.objective,choice.action).assessment;return q?[{name:context[s].name,values:q.values,cues:q.cues}]:[];});}
 const out=$('outputs'),rule=$('rules');out.replaceChildren();rule.replaceChildren();$('grades').replaceChildren();
 if(!results.length){node('p','No eligible alternative for this configuration.',out);curve([]);return;}
 const tab=node('table',null,rule),head=node('tr',null,node('thead',null,tab));['Wrestler / pair','Output','Rule','Activation','Weighted strength','Consequent'].forEach(x=>node('th',x,head));const body=node('tbody',null,tab),axis=$('axis').value,values=[];
 for(const item of results){const base=model().evaluate(item.values,item.cues),q=L.evaluate(K,model(),item.values,item.cues,activeEdits());scores(out,item.name,q,base.scores);values.push(item.values[axis]);const g=q.grades[axis];node('p',item.name+': '+(g?'input '+item.values[axis]+' · '+Object.entries(g).map(([k,v])=>k+' '+v.toFixed(2)).join(' / '):'Unknown input — no fabricated membership'),$('grades'));for(const [k,list] of Object.entries(q.fired))for(const r of list){const tr=node('tr',null,body);[item.name,k,r.id,r.activation.toFixed(3),r.weight.toFixed(3),r.value].forEach(x=>node('td',x,tr));}}
 curve(values);$('status').textContent='Production kernel · sandbox edits affect inspection only.';
 }catch(e){$('status').textContent=e.message;}}
function setup(){try{context=L.setup(window,cfg());choices=L.alternatives(window,context.room);options($('proposal'),choices.map((x,i)=>[String(i),x.label]),$('proposal').value);$('histogram').replaceChildren();lastDistribution=null;$('exportDistribution').disabled=true;render();}catch(e){context=null;$('status').textContent=e.message;$('outputs').replaceChildren();$('rules').replaceChildren();}}
function download(name,value){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('w').addEventListener('change',()=>{opponents();setup();});
for(const el of document.querySelectorAll('#conditions input,#conditions select,#circumstances input'))if(el.id!=='w')el.addEventListener('change',setup);
$('model').addEventListener('change',()=>{axisOptions();render();});$('axis').addEventListener('change',()=>{knots();render();});$('proposal').addEventListener('change',render);
$('apply').addEventListener('click',()=>{try{const v=['low','middle','high'].map(k=>Number($(k).value)),axis=$('axis').value;L.evaluate(K,model(),{},{},{...activeEdits(),[axis]:v});activeEdits()[axis]=v;render();}catch(e){$('status').textContent='Use ascending knots between 0 and 100. '+e.message;}});
$('reset').addEventListener('click',()=>{edits[kind()]={};knots();render();});
$('export').addEventListener('click',()=>download('office-fuzzy-sandbox.json',{schema:'office-fuzzy-lab-v1',model:kind(),conditions:cfg(),config:L.evaluate(K,model(),{},{},activeEdits()).config}));
$('distribution').addEventListener('click',()=>{try{
 const conditions=cfg(),q=L.distribution(window,conditions,P.behaviourModel,edits.behaviour),p=$('histogram');
 lastDistribution={schema:'office-fuzzy-distribution-v1',cohort,conditions,curveEdits:JSON.parse(JSON.stringify(edits.behaviour)),...q};$('exportDistribution').disabled=false;
 p.replaceChildren();node('p',q.count+' wrestlers · '+q.groups.established.count+' established / '+q.groups.academy.count+' academy previews · seed '+cohort.seed,p);
 for(const [label,sample] of [['All wrestlers',q],['Established',q.groups.established],['Academy preview',q.groups.academy]]){
  node('h3',label+' ('+sample.count+')',p);const grid=node('div',null,p);grid.className='hist';
  for(const [k,v] of Object.entries(sample.outputs)){const box=node('div',null,grid);node('b',k,box);node('p','Mean '+(v.mean?.toFixed(1)??'—'),box);const bars=node('div',null,box);bars.className='bins';v.bins.forEach((n,i)=>{const bar=node('div',String(n),bars);bar.className='bin';bar.style.height=Math.max(3,n/Math.max(...v.bins,1)*100)+'%';bar.title=(i*20)+'–'+((i+1)*20)+': '+n;});node('small','0–20 · 20–40 · 40–60 · 60–80 · 80–100',box);}
 }
 }catch(e){$('status').textContent=e.message;}});
$('exportDistribution').addEventListener('click',()=>{if(lastDistribution)download('office-fuzzy-distribution.json',lastDistribution);});
$('replay').addEventListener('click',()=>{try{const conditions=cfg();lastReplay={conditions,...L.replay(window,conditions,$('choices').value.split(',').map(s=>s.trim()).filter(Boolean))};const p=$('tape');p.replaceChildren();node('b','Signed: '+lastReplay.sheet.finishRoute+' · '+lastReplay.steps.length+' decisions',p);node('p','Replay choice IDs: '+lastReplay.steps.slice(1).map(x=>x.id).join(', '),p);for(const row of lastReplay.log)node('p',(row.actor||row.side||'')+': '+(row.text||row.line||''),p);$('exportReplay').disabled=false;}catch(e){$('status').textContent=e.message;}});
$('exportReplay').addEventListener('click',()=>{if(lastReplay)download('office-negotiation-replay.json',lastReplay);});
axisOptions();setup();
})();