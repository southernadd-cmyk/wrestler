/* THE OFFICE v0.3.19 — rival stables: looking over the fence, and approaching their wrestlers.
   The six agencies' rosters are open to you now: who is there, what they want, how they feel about it
   and when their contract is up. A wrestler who wants out will listen to an approach. It costs you a
   management meeting, and if they come you pay their stable a transfer fee. A settled wrestler turns
   you down, and either way the manager hears about it. Managers you poach from hold it against you.
   Deterministic: nothing here draws a random number. */
(function installApproaches(root){'use strict';
 const G=root.OfficeGame,D=root.OfficeData,T=root.OfficeTerritory,V4=root.OfficeWorldV4,M=root.OfficeManagers;
 function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return ((h>>>0)%10007)/10007;}
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
 const info=id=>D.findWrestler(id)||{};
 const COOLDOWN=4,ROSTER_CAP=5;

 function state(t=G.S?.territory){
  if(!t)return null;
  const a=M?.state(t)||(t.agents??={});
  a.grudge??={};a.approached??={};
  return a;
 }
 const amb=(s,id)=>s.ambitions?.w?.[id]||null;
 // How a wrestler feels about where they are, as the circuit would put it.
 function mood(s,id){const sat=amb(s,id)?.sat??50;return sat<35?'Wants out':sat<55?'Restless':'Settled';}
 function contract(s,id){return s.worldV4?.contracts?.[id]||null;}
 function weeksLeft(s,id){const c=contract(s,id);return c?.expiresWeek==null?null:Math.max(0,c.expiresWeek-G.abs());}
 function titled(s,id){return D.PROMOS.some(p=>D.DIVISION_ORDER.some(d=>s.territory?.titles?.[p.id]?.[d]?.holder===id));}
 // What their stable will want for them: cheaper near the end of the contract, dearer from a careful
 // manager, more for a champion.
 function fee(s,id){
  const c=contract(s,id),team=c?.agencyId,thrift=M?.profile(team)?.thrift??.5,left=weeksLeft(s,id);
  const mult=Math.max(.5,1+thrift*.5-(left!=null&&left<=4?.4:0)+(titled(s,id)?.5:0));
  return Math.round((info(id).fee||1000)*mult/10)*10;
 }
 // What you can put on the table for what they want.
 function pitch(s,id){
  const kind=amb(s,id)?.kind,ps=s.promoters||[];
  const best=ps.filter(p=>G.eligible(p)).sort((x,y)=>y.trust-x.trust)[0];
  if(kind==='money')return {text:'More money: a fifth on top of their wage.',bonus:12,wage:1.2};
  if(['title','push','stage'].includes(kind)&&best&&best.trust>=55)return {text:`A promoter who rates your stable: ${best.name} (trust ${best.trust}).`,bonus:12};
  if(['title','push','stage'].includes(kind))return {text:'A chance to climb, but no promoter who trusts you enough to promise it.',bonus:0};
  return {text:'A fresh start somewhere that wants them.',bonus:5};
 }
 function chance(s,id){
  const e=amb(s,id),sat=e?.sat??50,loyal=info(id).loyal??55;
  if(sat>=55)return 0;
  const team=contract(s,id)?.agencyId,grudge=state(s.territory)?.grudge?.[team]||0;
  const score=(60-sat)+(60-loyal)*.5+((s.rep||20)-30)*.4+pitch(s,id).bonus-grudge*4;
  return clamp(score/60,0,.9);
 }
 function read(c){return c<=0?'Happy where they are':c<.35?'Might hear you out':c<.65?'Will listen':'Keen to talk';}

 // The rosters, for the screen.
 function stables(s=G.S){
  const t=s?.territory,w=s?.worldV4;if(!t||!w)return [];
  return t.teams.filter(team=>w.agencies[team.id]).map(team=>({id:team.id,name:team.name,manager:team.manager,blurb:M?.blurb(team)||'',grudge:state(t).grudge[team.id]||0,
   wrestlers:team.roster.filter(id=>w.contracts[id]?.owner==='ai').map(id=>view(id,s)).filter(Boolean)}));
 }
 function view(id,s=G.S){
  const c=contract(s,id),x=info(id);if(!c||c.owner!=='ai'||!x.id)return null;
  const team=s.territory.teams.find(t=>t.id===c.agencyId),k=amb(s,id)?.kind,p=chance(s,id),last=state(s.territory).approached[id];
  return {...x,team:team?.name,teamId:c.agencyId,manager:team?.manager,mood:mood(s,id),wants:k?root.OfficeAmbitions?.KINDS?.[k]?.name||k:null,
   weeksLeft:weeksLeft(s,id),wage:Math.round((c.wage||x.wage)*(pitch(s,id).wage||1)),fee:fee(s,id),champion:titled(s,id),
   read:read(p),pitch:pitch(s,id).text,cooldown:last!=null&&G.abs()-last<COOLDOWN?COOLDOWN-(G.abs()-last):0};
 }

 // Making an approach. Returns {ok, text} or {error}.
 function approach(id){
  const s=G.S,t=s?.territory,a=state(t),c=contract(s,id);
  if(!c||c.owner!=='ai')return {error:'They are not with a rival stable.'};
  const team=t.teams.find(x=>x.id===c.agencyId),x=info(id),price=fee(s,id);
  if(s.roster.length>=ROSTER_CAP)return {error:'Your locker room is full (five contracts).'};
  if(s.focus<1)return {error:'No management meetings left this week.'};
  if(a.approached[id]!=null&&G.abs()-a.approached[id]<COOLDOWN)return {error:`${x.short} has already heard from you. Give it a few weeks.`};
  if(s.cash<price)return {error:`You need ${G.money(price)} for ${team.name}’s fee.`};
  s.focus--;s.business.meetings++;a.approached[id]=G.abs();
  const p=chance(s,id),yes=p>0&&hash(id+':'+G.abs()+':'+s.season)<p;
  a.grudge[team.id]=(a.grudge[team.id]||0)+(yes?2:1);
  if(!yes){
   G.msg({from:`${team.manager}, ${team.name}`,subject:`Leave ${x.short} alone`,kind:'info',body:[
    `“I hear you’ve been talking to ${x.name}. They told me. Don’t do it again.”`,
    p<=0?`${x.short} is happy at ${team.name} and said so.`:`${x.short} listened, and said no. For now.`]});
   G.save();return {ok:false,text:p<=0?`${x.short} is happy where they are. ${team.manager} knows you asked.`:`${x.short} listened, but stays with ${team.name}. ${team.manager} knows you asked.`};
  }
  // They come: their stable lets them go, you pay the fee, and they sign.
  if(!V4.releaseAI(s,id)){a.grudge[team.id]-=2;return {error:'The deal could not be done.'};}
  const free=s.free.find(w=>w.id===id);
  if(free){free.fee=price;const pw=pitch(s,id).wage;if(pw)free.wage=Math.round((free.wage||x.wage)*pw);}
  const err=G.sign(id);
  if(err){V4.hire(s,team.id,id);return {error:err};}
  const agency=s.worldV4.agencies[team.id];if(agency)agency.cash+=price;
  G.msg({from:`${team.manager}, ${team.name}`,subject:`You took ${x.short}`,kind:'info',body:[
   `“${x.name} has gone, and you paid the fee, so there it is. I won’t forget who came knocking.”`,
   `${G.money(price)} to ${team.name}. ${team.manager} will be harder to deal with for a while.`]});
  G.save();return {ok:true,text:`${x.name} has signed from ${team.name} for ${G.money(price)}.`};
 }

 root.OfficeApproaches={state,stables,view,approach,fee,mood,chance,COOLDOWN};
})(typeof window!=='undefined'?window:globalThis);
