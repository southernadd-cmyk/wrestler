/* THE OFFICE — MP1A: planning domain foundation.
   Reuse the shared Sugeno kernel and canonical worker axes. This module
   is not loaded by the live room yet; no decisions or saves change. */
(function(root){'use strict';
 const K=root.OfficePsychology;
 if(!K)throw Error('Planning fuzzy requires OfficePsychology');
 const owns=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 // Keep the canonical source as the single authority. Mic is available
 // for future explicit rules, not assumed to affect match planning.
 const workerCurves=K.workerCurves;
 function createModel(spec){
  if(!spec||typeof spec!=='object'||Array.isArray(spec))throw Error('Invalid planning fuzzy model');
  const extra=spec.curves??{};
  if(typeof extra!=='object'||Array.isArray(extra))throw Error('Invalid planning fuzzy curves');
  for(const axis of Object.keys(extra))if(owns(workerCurves,axis))throw Error('Cannot override canonical worker curve '+axis);
  return K.createModel({...spec,curves:{...workerCurves,...extra}});
 }
 root.OfficePlanningFuzzy=Object.freeze({version:1,workerCurves,workerInputs:K.workerInputs,createModel});
})(typeof window!=='undefined'?window:globalThis);
