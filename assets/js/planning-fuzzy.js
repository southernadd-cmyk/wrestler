/* THE OFFICE — MP1B: planning domain membership functions.
   Reuse the shared Sugeno kernel and canonical worker axes. This module
   is not loaded by the live room yet; no decisions or saves change. */
(function(root){'use strict';
 const K=root.OfficePsychology;
 if(!K)throw Error('Planning fuzzy requires OfficePsychology');
 const owns=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 // Keep the canonical source as the single authority. Mic is available
 // for future explicit rules, not assumed to affect match planning.
 const workerCurves=K.workerCurves;
 // Provisional knots, not empirical calibration or physical safety limits.
 // Unavailable evidence remains null; proposal scores require a later
 // explicit evidence contract rather than guessed worker attributes.
 const planningCurves=Object.freeze(Object.fromEntries(Object.entries({
  consent:[30,60,85],fatigue:[20,45,75],safetyAbility:[45,70,90],
  ringAbility:[40,65,85],professionalTrust:[25,50,80],morale:[30,55,80],
  proposalRisk:[20,45,75],proposalFairness:[25,50,75],
  sequenceDifficulty:[25,50,80],structureCompatibility:[25,50,75],
  creativeBenefit:[25,50,80]
 }).map(([axis,knots])=>[axis,Object.freeze(knots)])));
 const curves=Object.freeze({...workerCurves,...planningCurves});
 function createModel(spec){
  if(!spec||typeof spec!=='object'||Array.isArray(spec))throw Error('Invalid planning fuzzy model');
  const extra=spec.curves??{};
  if(typeof extra!=='object'||Array.isArray(extra))throw Error('Invalid planning fuzzy curves');
  for(const axis of Object.keys(extra)){
   if(owns(workerCurves,axis))throw Error('Cannot override canonical worker curve '+axis);
   if(owns(planningCurves,axis))throw Error('Cannot override versioned planning curve '+axis);
  }
  return K.createModel({...spec,curves:{...curves,...extra}});
 }
 root.OfficePlanningFuzzy=Object.freeze({version:1,workerCurves,planningCurves,curves,workerInputs:K.workerInputs,createModel});
})(typeof window!=='undefined'?window:globalThis);
