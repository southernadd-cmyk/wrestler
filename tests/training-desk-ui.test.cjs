'use strict';
// Training management desk rendering smoke tests; actual career rules are covered by training-sessions.test.cjs.
(function testTrainingDesk(){
 'use strict';
 const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
 const src=fs.readFileSync(path.join(__dirname,'..','assets/js/ui.js'),'utf8');
 const a=src.indexOf('function trainingReportsPanel(){'),b=src.indexOf('\n\n\nfunction scoutingComparison(',a);
 assert.ok(a>=0&&b>a,'training renderer is present');
 const state={cash:2000,coach:null,roster:[
  {id:'mara',name:'Mara Vale',short:'Mara',style:'Story',training:'ring',intensity:'standard',fatigue:65,injury:0,ring:58,mic:35,psych:52,safe:60,startSkills:{ring:56,mic:35,psych:52,safe:60},progress:{ring:.4},session:null,prepHistory:[],program:null},
  {id:'rex',name:'Rex Titan',short:'Rex',style:'Brawl',training:'rest',intensity:'light',fatigue:10,injury:0,ring:71,mic:30,psych:45,safe:58,startSkills:{ring:71,mic:30,psych:45,safe:58},progress:{},session:'rehearse',prepHistory:[],program:null}
 ]};
 let html='';
 const D={TRAINING:{ring:{name:'Ringcraft',stat:'ring'},rest:{name:'Rest'},promo:{name:'Record a promo'}}};
 const G={SESSION_CAP:2,INTENSITY:{light:{name:'Light drills',cost:0,gain:.3,risk:0},standard:{name:'Coached session',cost:55,gain:.85,risk:.009},hard:{name:'Intensive camp',cost:140,gain:1.6,risk:.045}},
  COACHES:{technical:{name:'Technical coach',stat:'ring',fee:230,wage:65,boost:.35}},
  trainingCost:w=>w.training==='rest'?0:55,trainingBill:()=>55,
  trainingAdvice:()=>[{priority:'urgent',kind:'focus',value:'rest',title:'Give them a rest',why:'Fatigue is high.'}],
  trainingForecast:()=>({kind:'skill',stat:'ring',gain:1,progress:40,fatigue:50,riskPct:.9}),
  sessionTip:w=>w.id==='mara'?{value:'rehearse',why:'Booked soon.'}:null,
  sessionOptions:()=>[{value:'rehearse',label:'Rehearse for the next match',hint:'Rehearsal improves match preparation.'}]};
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sandbox={D,G,S:()=>state,trainingSelected:null,trainingPane:'development',trainingReportWeek:null,esc,
  money:n=>'£'+n,plural:(n,s)=>n===1?s:s+'s',att:n=>String(n),bar:()=>'<span class="bar"></span>',fatKind:()=>'',face:()=>'',
  status:()=>'Booked',weekLabel:()=>'S1 W1',trainNote:()=>'Training continues',sessionNote:()=>'',
  sessionSelect:w=>'<select data-session="'+w.id+'"></select>',
  trainSelects:w=>['<select data-train="'+w.id+'"></select>','<select data-intensity="'+w.id+'"></select>'],
  win:(name,body)=>'<section><h2>'+name+'</h2>'+body+'</section>',
  paint:(cls,body)=>{html=body;}
 };
 const render=vm.runInNewContext(src.slice(a,b)+'\nrenderTraining',sandbox);
 const before=JSON.stringify(state);
 render();
 assert.match(html,/Weekly training bill/);
 assert.match(html,/Condition alerts/);
 assert.match(html,/data-trainpick="mara"/);
 assert.match(html,/aria-pressed="true"/);
 assert.match(html,/Dennis's assessment/);
 assert.match(html,/data-advice-kind="focus"/);
 assert.match(html,/Current-week outlook/);
 assert.match(html,/Weekly reports/);
 assert.match(html,/data-train="mara"/);
 assert.match(html,/data-intensity="mara"/);
 assert.match(html,/data-session="mara"/);
 assert.match(html,/Base injury chance: 0\.9%/);
 assert.match(html,/3-week camp · £185\/wk/);
 assert.equal(JSON.stringify(state),before,'render does not change career state');
 sandbox.trainingSelected='rex';
 render();
 assert.match(html,/data-train="rex"/,'selection changes detail panel');
 sandbox.trainingPane='coaches';
 render();
 assert.match(html,/data-hirecoach="technical"/,'coaching options remain available');
 state.coach='technical';
 render();
 assert.match(html,/data-firecoach="1"/,'active coach can be released');
 sandbox.trainingPane='reports';
 state.trainingReviews=[{a:1,trainingCost:55,coachCost:0,entries:[{id:'mara',name:'Mara Vale',cost:55,worked:false,delta:{ring:1,fatigue:8},notes:['Mara improves.']}]}];
 render();
 assert.match(html,/Mara improves/,'the weekly report shows recorded progress');
 sandbox.trainingPane='development';
 state.roster[1].program={type:'block',total:3,left:2,gains:1};
 render();
 assert.match(html,/data-cancelprogram="rex"/,'active development blocks are manageable');
 assert.doesNotMatch(html,/data-program="camp"/,'locked programmes cannot be duplicated');
 state.roster=[];
 render();
 assert.match(html,/Sign a wrestler to begin training/,'empty stable is actionable');
 assert.match(src,/if\(d\.trainpick\)/,'wrestler selection is wired');
 assert.match(src,/if\(d\.trainpane\)/,'coaching view toggle is wired');
 console.log('PASS training desk UI: overview, selection, forecasts, advice, reports, staff, programmes and empty stable');
})();
