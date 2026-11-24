/* Small startup loader for independently versioned character dialogue banks.
   Fetch only participating workers; cache immutable payloads, not career data. */
(function(root){'use strict';
 const D=root.OfficePromoDialogue,manifest=root.OfficePromoBankManifest||{};
 const pending=new Map(),memory=new Map(),prefix='office-promo-bank-v1:';
 const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');};
 function decode(payload){
  if(!payload||payload.v!==1||typeof payload.owner!=='string'||!Array.isArray(payload.rows)||payload.rows.length>128)throw Error('Invalid promo bank');
  return {owner:payload.owner,role:'wrestler',lines:payload.rows.map(row=>{
   if(!Array.isArray(row)||row.length<7||row.length>8)throw Error('Invalid promo bank row');
   const [suffix,stage,action,side,category,text,variants,extra]=row;
   return {id:payload.owner+'.'+suffix,stage,action,side,category,text,when:{hasMouthpiece:false,...(variants?{variants}:{}),...(extra||{})}};
  })};
 }
 function validate(raw,id,rev){
  if(typeof raw!=='string'||raw.length>100000||hash(raw)!==rev)throw Error('Promo bank revision mismatch');
  const payload=JSON.parse(raw);
  if(payload.owner!==id)throw Error('Promo bank owner mismatch');
  D.catalogue([decode(payload)]);return payload;
 }
 function cached(id,rev){
  try{const raw=root.localStorage?.getItem(prefix+id);if(!raw)return null;return validate(raw,id,rev);}catch(_){return null;}
 }
 async function fetchBank(id,rev){
  const hit=cached(id,rev);if(hit)return hit;
  if(typeof root.fetch!=='function')return null;
  let timer,timedOut=false,controller=typeof root.AbortController==='function'?new root.AbortController():null;
  try{
   // Retry one transient failure inside the original total deadline.
   const request=(async()=>{
    for(let attempt=0;attempt<2;attempt++){
     let r;
     try{r=await root.fetch('assets/promo-banks/'+id+'.'+rev+'.json',{cache:attempt?'reload':'force-cache',...(controller?{signal:controller.signal}:{})});}
     catch(err){if(attempt||timedOut||root.navigator?.onLine===false)throw err;continue;}
     if(timedOut)throw Error('Promo bank timeout');
     if(!r.ok){if(!attempt&&r.status>=500&&r.status<600)continue;throw Error('Promo bank unavailable');}
     return validate(await r.text(),id,rev);
    }
    throw Error('Promo bank unavailable');
   })();
   const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{timedOut=true;controller?.abort();reject(Error('Promo bank timeout'));},2500);});
   const payload=await Promise.race([request,timeout]);
   try{root.localStorage?.setItem(prefix+id,JSON.stringify(payload));}catch(_){}
   return payload;
  }catch(_){return null;}finally{clearTimeout(timer);}
 }
 function loadOne(id){
  if(!Object.prototype.hasOwnProperty.call(manifest,id))return Promise.resolve(null);
  if(memory.has(id))return Promise.resolve(memory.get(id));
  if(pending.has(id))return pending.get(id);
  const request=fetchBank(id,manifest[id]).then(bank=>{if(bank)memory.set(id,bank);return bank;}).finally(()=>pending.delete(id));
  pending.set(id,request);return request;
 }
 async function load(ids){
  return (await Promise.all([...new Set(ids.filter(Boolean))].map(loadOne))).filter(Boolean);
 }
 // Token ownership prevents an old request from clearing/reopening a later scene.
 function beginSceneLoad(n,cid){
  if(n.promoLoading?.cid===cid&&n.stage==='promo')return null;
  const token={cid};n.promoLoading=token;n.stage='promo';return token;
 }
 function completeSceneLoad(n,token,isCurrent){
  if(n.promoLoading!==token)return false;
  delete n.promoLoading;
  return n.stage==='promo'&&isCurrent();
 }
 // Scene snapshots are deliberately compact and self-contained; no network at choose().
 function catalogue(banks){return D.catalogue(banks.map(decode));}
 root.OfficePromoBanks=Object.freeze({load,decode,catalogue,hash,beginSceneLoad,completeSceneLoad});
})(typeof window!=='undefined'?window:globalThis);
