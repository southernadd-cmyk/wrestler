/* THE OFFICE / PIXEL PORTRAIT STUDIO v1.0
   assets/portrait-atlas.png supplies the default portrait for all 80 wrestlers
   and the 4 promoters (built by tools/build_portraits.py).
   The layered renderer below only draws explicit appearance overrides and any
   character that has no atlas cell.
*/
(function(root){'use strict';
const hash=s=>{let h=2166136261>>>0;for(const c of String(s)){h=Math.imul(h^c.charCodeAt(0),16777619)>>>0}return h>>>0};
const OPTIONS={
 presentation:[['male','Male'],['female','Female'],['neutral','Androgynous']],
 complexion:[['deep','#683f34'],['umber','#8a5543'],['bronze','#ac7355'],['tan','#c18d6d'],['warm','#d8a17e'],['peach','#e9bb94'],['fair','#f3d2aa'],['olive','#aa9669']],
 face:[['square','Square'],['oval','Oval'],['round','Round'],['angular','Angular'],['heart','Heart'],['long','Long']],
 hair:[['buzz','Buzz cut'],['crop','Cropped'],['swept','Swept'],['spikes','Spiked'],['mohawk','Mohawk'],['curly','Curls'],['afro','Afro'],['waves','Waves'],['long','Long'],['ponytail','Ponytail'],['braids','Braids'],['topknot','Top knot'],['undercut','Undercut'],['bald','Bald']],
 hairColor:[['ink','#161925'],['brown','#55362c'],['chestnut','#8a503d'],['blond','#d9b376'],['silver','#b8bbc1'],['ginger','#ac5a33'],['auburn','#a14750'],['blue','#3872a4'],['pink','#b95c8f'],['white','#dfd6c8'],['green','#548a63']],
 eyes:[['calm','Calm'],['sharp','Sharp'],['wide','Wide'],['sleepy','Sleepy'],['heavy','Heavy brow'],['bright','Bright']],
 eyeColor:[['dark','#27242b'],['brown','#6b4234'],['hazel','#7e7751'],['green','#49776d'],['blue','#5379a7'],['grey','#7f9296']],
 nose:[['short','Short'],['straight','Straight'],['broad','Broad'],['crooked','Crooked']],
 mouth:[['neutral','Neutral'],['smile','Smiling'],['smirk','Smirking'],['frown','Frowning'],['grim','Grim'],['grin','Grinning']],
 beard:[['none','None'],['shadow','Stubble'],['moustache','Moustache'],['goatee','Goatee'],['full','Full beard'],['sideburns','Sideburns']],
 scars:[['none','None'],['cheek','Cheek scar'],['brow','Brow scar'],['nose','Nose scar']],
 accessory:[['none','None'],['glasses','Glasses'],['shades','Sunglasses'],['earring','Earring'],['eyepatch','Eye patch'],['piercing','Piercing']],
 headwear:[['none','None'],['headband','Headband'],['bandana','Bandana'],['mask','Ring mask'],['cap','Cap']],
 gear:[['singlet','Singlet'],['jacket','Jacket'],['tee','T-shirt'],['vest','Vest'],['robe','Entrance robe'],['suit','Promoter suit']],
 gearColor:[['crimson','#a83f4a'],['steel','#607f9f'],['gold','#b98b44'],['teal','#377d83'],['violet','#705b9e'],['forest','#47745d'],['charcoal','#34394b'],['cream','#ddd0aa'],['rose','#bc657e'],['orange','#bb7138']],
 bg:[['navy','#242e46'],['rust','#553c39'],['teal','#284e50'],['violet','#4b3d5d'],['olive','#3e4a3d'],['slate','#3a464d'],['gold','#564b31']]
};
const items=Object.fromEntries(Object.entries(OPTIONS).map(([k,v])=>[k,v.map(x=>x[0])]));
const presets={mara:'female',lyra:'female',juno:'female',roxy:'female',rex:'male',brick:'male',sol:'male',red:'male',silas:'male',rev:'male'};
// The first four atlas cells have baked-in backgrounds; regenerate only those
// four plus the new v4 performers as transparent 48x60 sprites in the browser.
const legacyCutouts=new Set(['mara','rex','lyra','brick']);
function transparentPortrait(key){
 if(!key?.startsWith('wrestler:'))return false;
 const id=key.slice(9);
 return legacyCutouts.has(id)||!!root.OfficeData?.V4?.newCast?.some(w=>w.id===id);
}
const legacyLooks={
 mara:{presentation:'female',hair:'long',hairColor:'ink',complexion:'fair',gear:'jacket',gearColor:'crimson',headwear:'none',accessory:'none'},
 rex:{presentation:'male',hair:'bald',beard:'none',complexion:'tan',gear:'vest',gearColor:'steel',headwear:'none',accessory:'none'},
 lyra:{presentation:'female',hair:'long',headwear:'mask',gear:'jacket',gearColor:'violet',complexion:'warm'},
 brick:{presentation:'male',hair:'swept',hairColor:'ginger',beard:'full',complexion:'peach',gear:'vest',gearColor:'orange',headwear:'none',accessory:'none'}
};

/* Individually art-directed 48x60 pixel cutouts for all 52 v4 wrestlers.
   These are the cast-bible silhouettes, not random new-character appearances.
   Appearance editor overrides and portraitNonce re-rolls still work. */
const curatedLooks={"faye":{"presentation":"female","hair":"crop","hairColor":"ink","complexion":"fair","gear":"jacket","gearColor":"steel","beard":"none","accessory":"none","headwear":"none","scars":"brow"},"bao":{"presentation":"male","hair":"crop","hairColor":"ink","complexion":"warm","gear":"singlet","gearColor":"violet","beard":"none","accessory":"none","headwear":"none","scars":"none"},"zara":{"presentation":"female","hair":"undercut","hairColor":"ginger","complexion":"tan","gear":"vest","gearColor":"forest","beard":"none","accessory":"earring","headwear":"none","scars":"none"},"miro":{"presentation":"neutral","hair":"long","hairColor":"chestnut","complexion":"fair","gear":"jacket","gearColor":"steel","beard":"none","accessory":"none","headwear":"none","scars":"none"},"aisha":{"presentation":"female","hair":"braids","hairColor":"ink","complexion":"deep","gear":"vest","gearColor":"crimson","beard":"none","accessory":"none","headwear":"none","scars":"none"},"ellis":{"presentation":"male","hair":"crop","hairColor":"brown","complexion":"fair","gear":"singlet","gearColor":"charcoal","beard":"none","accessory":"glasses","headwear":"none","scars":"none"},"anya":{"presentation":"female","hair":"swept","hairColor":"blue","complexion":"fair","gear":"jacket","gearColor":"steel","beard":"none","accessory":"earring","headwear":"none","scars":"none"},"nolan":{"presentation":"male","hair":"bald","hairColor":"ink","complexion":"tan","gear":"jacket","gearColor":"forest","beard":"full","accessory":"none","headwear":"none","scars":"none"},"ivo":{"presentation":"male","hair":"swept","hairColor":"silver","complexion":"olive","gear":"singlet","gearColor":"steel","beard":"shadow","accessory":"none","headwear":"none","scars":"none"},"rina":{"presentation":"female","hair":"braids","hairColor":"blue","complexion":"tan","gear":"singlet","gearColor":"violet","beard":"none","accessory":"none","headwear":"none","scars":"none"},"priya":{"presentation":"female","hair":"curly","hairColor":"ink","complexion":"bronze","gear":"jacket","gearColor":"steel","beard":"none","accessory":"none","headwear":"none","scars":"none"},"nate":{"presentation":"male","hair":"crop","hairColor":"brown","complexion":"warm","gear":"jacket","gearColor":"cream","beard":"full","accessory":"none","headwear":"none","scars":"none"},"cass":{"presentation":"neutral","hair":"long","hairColor":"ink","complexion":"peach","gear":"jacket","gearColor":"gold","beard":"none","accessory":"earring","headwear":"none","scars":"none"},"jun":{"presentation":"male","hair":"swept","hairColor":"ink","complexion":"warm","gear":"jacket","gearColor":"teal","beard":"none","accessory":"none","headwear":"none","scars":"none"},"sylvia":{"presentation":"female","hair":"undercut","hairColor":"auburn","complexion":"fair","gear":"jacket","gearColor":"violet","beard":"none","accessory":"none","headwear":"none","scars":"none"},"kofi":{"presentation":"male","hair":"afro","hairColor":"ink","complexion":"deep","gear":"singlet","gearColor":"teal","beard":"none","accessory":"none","headwear":"mask","scars":"none"},"mae":{"presentation":"female","hair":"curly","hairColor":"silver","complexion":"deep","gear":"jacket","gearColor":"crimson","beard":"none","accessory":"none","headwear":"none","scars":"none"},"theo":{"presentation":"male","hair":"swept","hairColor":"ink","complexion":"peach","gear":"singlet","gearColor":"charcoal","beard":"none","accessory":"none","headwear":"none","scars":"none"},"soraya":{"presentation":"female","hair":"ponytail","hairColor":"ink","complexion":"olive","gear":"singlet","gearColor":"teal","beard":"none","accessory":"none","headwear":"none","scars":"none"},"milo":{"presentation":"male","hair":"long","hairColor":"auburn","complexion":"fair","gear":"jacket","gearColor":"orange","beard":"none","accessory":"none","headwear":"none","scars":"none"},"winnie":{"presentation":"female","hair":"ponytail","hairColor":"brown","complexion":"peach","gear":"singlet","gearColor":"violet","beard":"none","accessory":"glasses","headwear":"none","scars":"none"},"bronte":{"presentation":"female","hair":"braids","hairColor":"brown","complexion":"tan","gear":"vest","gearColor":"steel","beard":"none","accessory":"none","headwear":"none","scars":"none"},"gus":{"presentation":"male","hair":"buzz","hairColor":"silver","complexion":"warm","gear":"jacket","gearColor":"charcoal","beard":"shadow","accessory":"none","headwear":"none","scars":"cheek"},"nikita":{"presentation":"female","hair":"mohawk","hairColor":"pink","complexion":"fair","gear":"tee","gearColor":"charcoal","beard":"none","accessory":"none","headwear":"none","scars":"none"},"jett":{"presentation":"male","hair":"waves","hairColor":"blond","complexion":"fair","gear":"vest","gearColor":"steel","beard":"none","accessory":"none","headwear":"none","scars":"none"},"alina":{"presentation":"female","hair":"waves","hairColor":"ginger","complexion":"warm","gear":"robe","gearColor":"cream","beard":"none","accessory":"none","headwear":"none","scars":"none"},"cedric":{"presentation":"male","hair":"swept","hairColor":"silver","complexion":"fair","gear":"suit","gearColor":"charcoal","beard":"full","accessory":"none","headwear":"none","scars":"none"},"marisol":{"presentation":"female","hair":"curly","hairColor":"ink","complexion":"bronze","gear":"singlet","gearColor":"teal","beard":"none","accessory":"none","headwear":"none","scars":"none"},"felix":{"presentation":"male","hair":"curly","hairColor":"ginger","complexion":"fair","gear":"jacket","gearColor":"cream","beard":"none","accessory":"none","headwear":"none","scars":"none"},"eira":{"presentation":"female","hair":"crop","hairColor":"ink","complexion":"peach","gear":"singlet","gearColor":"steel","beard":"none","accessory":"none","headwear":"none","scars":"none"},"gideon":{"presentation":"male","hair":"bald","hairColor":"silver","complexion":"fair","gear":"singlet","gearColor":"steel","beard":"full","accessory":"none","headwear":"none","scars":"none"},"vera":{"presentation":"female","hair":"crop","hairColor":"ink","complexion":"warm","gear":"singlet","gearColor":"cream","beard":"none","accessory":"none","headwear":"none","scars":"none"},"tomas":{"presentation":"male","hair":"swept","hairColor":"brown","complexion":"peach","gear":"jacket","gearColor":"steel","beard":"none","accessory":"none","headwear":"none","scars":"none"},"ari":{"presentation":"neutral","hair":"long","hairColor":"ink","complexion":"tan","gear":"jacket","gearColor":"violet","beard":"none","accessory":"none","headwear":"none","scars":"none"},"tomasash":{"presentation":"male","hair":"buzz","hairColor":"silver","complexion":"olive","gear":"vest","gearColor":"charcoal","beard":"shadow","accessory":"none","headwear":"none","scars":"none"},"kezia":{"presentation":"female","hair":"braids","hairColor":"ginger","complexion":"fair","gear":"singlet","gearColor":"forest","beard":"none","accessory":"none","headwear":"none","scars":"none"},"dev":{"presentation":"male","hair":"curly","hairColor":"ink","complexion":"tan","gear":"jacket","gearColor":"gold","beard":"none","accessory":"none","headwear":"none","scars":"none"},"liya":{"presentation":"female","hair":"long","hairColor":"pink","complexion":"fair","gear":"vest","gearColor":"charcoal","beard":"none","accessory":"none","headwear":"none","scars":"none"},"emmett":{"presentation":"male","hair":"crop","hairColor":"silver","complexion":"peach","gear":"singlet","gearColor":"violet","beard":"moustache","accessory":"none","headwear":"none","scars":"none"},"nadia":{"presentation":"female","hair":"curly","hairColor":"ink","complexion":"olive","gear":"singlet","gearColor":"violet","beard":"none","accessory":"none","headwear":"none","scars":"none"},"leandro":{"presentation":"male","hair":"curly","hairColor":"ink","complexion":"tan","gear":"singlet","gearColor":"rose","beard":"none","accessory":"none","headwear":"mask","scars":"none"},"iris":{"presentation":"female","hair":"crop","hairColor":"silver","complexion":"fair","gear":"singlet","gearColor":"violet","beard":"none","accessory":"none","headwear":"none","scars":"none"},"kellan":{"presentation":"male","hair":"undercut","hairColor":"blond","complexion":"warm","gear":"singlet","gearColor":"teal","beard":"none","accessory":"none","headwear":"mask","scars":"none"},"ayla":{"presentation":"female","hair":"waves","hairColor":"chestnut","complexion":"warm","gear":"jacket","gearColor":"gold","beard":"none","accessory":"none","headwear":"none","scars":"none"},"sasha":{"presentation":"female","hair":"crop","hairColor":"white","complexion":"fair","gear":"robe","gearColor":"violet","beard":"none","accessory":"none","headwear":"none","scars":"none"},"morgan":{"presentation":"neutral","hair":"swept","hairColor":"ink","complexion":"tan","gear":"jacket","gearColor":"steel","beard":"none","accessory":"none","headwear":"none","scars":"none"},"noelle":{"presentation":"female","hair":"swept","hairColor":"silver","complexion":"fair","gear":"jacket","gearColor":"crimson","beard":"none","accessory":"none","headwear":"none","scars":"none"},"ash":{"presentation":"male","hair":"buzz","hairColor":"ink","complexion":"tan","gear":"vest","gearColor":"charcoal","beard":"shadow","accessory":"none","headwear":"none","scars":"none"},"zane":{"presentation":"male","hair":"buzz","hairColor":"blond","complexion":"peach","gear":"singlet","gearColor":"forest","beard":"none","accessory":"none","headwear":"none","scars":"none"},"elodie":{"presentation":"female","hair":"crop","hairColor":"ginger","complexion":"fair","gear":"jacket","gearColor":"cream","beard":"none","accessory":"none","headwear":"none","scars":"none"},"bashir":{"presentation":"male","hair":"buzz","hairColor":"silver","complexion":"bronze","gear":"vest","gearColor":"steel","beard":"none","accessory":"none","headwear":"none","scars":"none"},"cleo":{"presentation":"female","hair":"curly","hairColor":"ink","complexion":"deep","gear":"singlet","gearColor":"crimson","beard":"none","accessory":"none","headwear":"none","scars":"none"}};
const portraitDetails={"faye":"lapels","bao":"wrap","zara":"neon","miro":"worn","aisha":"gloves","ellis":"glasses","anya":"streak","nolan":"work","ivo":"wrap","rina":"moth","priya":"lapels","nate":"coat","cass":"cards","jun":"wrap","sylvia":"gloves","kofi":"maskgold","mae":"silver","theo":"trunks","soraya":"bronze","milo":"patch","winnie":"glasses","bronte":"battered","gus":"worn","nikita":"gloves","jett":"denim","alina":"pearl","cedric":"pinstripe","marisol":"waves","felix":"freckles","eira":"slate","gideon":"blue","vera":"blacktrim","tomas":"pinstripe","ari":"fringe","tomasash":"wrap","kezia":"braid","dev":"mustard","liya":"goldtrim","emmett":"indigo","nadia":"star","leandro":"tealtrim","iris":"wrap","kellan":"neon","ayla":"star","sasha":"cape","morgan":"slate","noelle":"streak","ash":"shoulders","zane":"broad","elodie":"lapels","bashir":"work","cleo":"silvertrim"};

function generated(key,nonce=0,meta={}){
 const o={};const base=String(key)+'|look-v9|'+(nonce||0);
 for(const [k,opts] of Object.entries(items)){
  const h=hash(base+'|'+k);o[k]=opts[h%opts.length];
 }
 const id=key.split(':').slice(1).join(':');if(nonce===0&&presets[id])o.presentation=presets[id];
 if(nonce===0&&legacyLooks[id])Object.assign(o,legacyLooks[id]);
 if(nonce===0&&curatedLooks[id])Object.assign(o,curatedLooks[id]);
 if(meta.type==='booker')o.gear=hash(base+'|booker')%3?'suit':'jacket';
 if(o.presentation==='female'&&hash(base+'|beard')%12!==0)o.beard='none';
 if(o.presentation==='male'&&hash(base+'|hair')%4===0&&o.hair==='long')o.hair='ponytail';
 if(o.gear==='suit'&&meta.type==='wrestler')o.gear='jacket';
 return o;
}
function sanitize(val,key,fallback){return items[key].includes(val)?val:fallback}
function getLook(actor){const raw=actor?.appearance||generated(actor?.key||'anon',actor?.portraitNonce||0,actor||{});const fallback=generated(actor?.key||'anon',actor?.portraitNonce||0,actor||{});const out={};for(const key in items)out[key]=sanitize(raw[key],key,fallback[key]);return out}
function color(key,value){return OPTIONS[key].find(x=>x[0]===value)?.[1]||'#999999'}
function shade(hex,amount){let n=parseInt(hex.slice(1),16);let r=Math.min(255,Math.max(0,(n>>16)+amount)),g=Math.min(255,Math.max(0,((n>>8)&255)+amount)),b=Math.min(255,Math.max(0,(n&255)+amount));return '#'+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')}
const cache=new Map();
function renderCanvas(actor,appearance=null,scale=1){
 const look=appearance||getLook(actor),cutout=transparentPortrait(actor?.key);const canvas=document.createElement('canvas');canvas.width=48*scale;canvas.height=60*scale;const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
 g.setTransform(scale,0,0,scale,0,0);
 const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const pix=(x,y,c)=>rect(x,y,1,1,c);
 const bg=color('bg',look.bg),skin=color('complexion',look.complexion),dark=shade(skin,-33),light=shade(skin,19),hair=color('hairColor',look.hairColor),hLight=shade(hair,28),suit=color('gearColor',look.gearColor),gearL=shade(suit,27),gearD=shade(suit,-30),eye=color('eyeColor',look.eyeColor);
 if(!cutout){rect(0,0,48,60,bg);rect(2,2,44,56,shade(bg,14));rect(4,4,40,52,bg);}
 // Pinstripes, arena lighting and a portrait-card border.
 if(!cutout){for(let j=0;j<5;j++)rect(4+j*9,4,1,8,shade(bg,25));rect(0,47,48,13,shade(bg,-20));rect(1,1,46,1,'#95816a');rect(1,58,46,1,'#655b56');}
 const male=look.presentation==='male',female=look.presentation==='female';
 rect(8,50,32,10,gearD);rect(male?5:7,42,male?38:34,18,suit);rect(12,42,24,18,gearL);
 if(look.gear==='suit'||look.gear==='jacket'||look.gear==='robe'){
  rect(7,45,14,15,suit);rect(27,45,14,15,suit);rect(20,44,8,16,look.gear==='suit'?'#ded2bb':skin);
  rect(21,48,6,12,look.gear==='suit'?'#2a2d36':suit);rect(23,47,2,10,look.gear==='suit'?'#ad8450':gearL);
  if(look.gear==='robe'){rect(6,45,5,15,gearL);rect(37,45,5,15,gearL);}
 } else if(look.gear==='singlet'){rect(13,43,5,15,gearD);rect(30,43,5,15,gearD);rect(19,45,10,5,skin)}
 else if(look.gear==='vest'){rect(17,45,14,7,skin);rect(10,44,6,15,gearD);rect(32,44,6,15,gearD)}
 else if(look.gear==='tee'){rect(8,44,9,10,gearD);rect(31,44,9,10,gearD);rect(18,44,12,10,suit)}
 // Back hair for long styles, ponytail, braids, and afro.
 const longHair=['long','ponytail','braids','waves'].includes(look.hair);
 if(longHair){rect(12,9,24,32,hair);rect(11,21,5,29,shade(hair,-13));rect(32,21,5,29,hair)}
 if(look.hair==='ponytail'){rect(32,21,7,26,hair);rect(33,35,5,16,hLight)}
 if(look.hair==='braids'){for(const x of [10,35]){rect(x,19,3,30,hair);for(let y=23;y<49;y+=6)rect(x+1,y,2,2,hLight)}}
 if(look.hair==='afro'){for(const [x,y,w,h] of [[9,9,30,16],[11,5,26,12],[6,14,8,18],[35,14,8,17]])rect(x,y,w,h,hair)}
 // Neck and face silhouette: each face family has a different width/cheek/jaw pattern.
 rect(20,38,8,9,dark);rect(21,38,6,8,skin);
 let top=look.face==='long'?14:15;let jaw=look.face==='long'?41:look.face==='heart'?38:40;
 let left=look.face==='square'?12:look.face==='round'?13:look.face==='angular'?14:look.face==='heart'?13:look.face==='long'?15:14;
 let right=48-left;
 rect(left+3,top-3,right-left-6,4,dark);
 rect(left,top+3,right-left,jaw-top-7,dark);
 rect(left+1,top,right-left-2,jaw-top-3,skin);
 if(look.face==='square'){rect(13,34,22,7,skin);rect(12,29,2,7,dark);rect(34,29,2,7,dark)}
 if(look.face==='round'){rect(12,25,24,10,skin);rect(14,35,20,5,skin)}
 if(look.face==='oval'){rect(14,35,20,5,skin);rect(16,39,16,2,dark)}
 if(look.face==='long'){rect(16,37,16,6,skin);rect(17,42,14,2,dark)}
 if(look.face==='heart'){rect(13,24,22,9,skin);rect(17,36,14,4,skin);rect(20,40,8,2,dark)}
 if(look.face==='angular'){rect(13,28,4,9,dark);rect(31,28,4,9,dark);rect(17,37,14,4,skin)}
 // Ears, highlights, shadows.
 rect(left-2,26,3,8,skin);rect(right-1,26,3,8,skin);rect(left-1,28,1,4,dark);rect(right+1,28,1,4,dark);
 rect(left+2,19,3,14,light);rect(right-4,19,3,14,dark);
 rect(18,35,12,3,shade(skin,-9));rect(19,37,10,2,skin);
 // Hairline. All hair options available for every presentation.
 if(look.hair==='bald'){rect(17,13,14,1,light)}
 else if(look.hair==='buzz'){rect(13,12,22,6,hair);rect(15,17,18,2,hLight)}
 else if(look.hair==='crop'){rect(12,10,24,9,hair);rect(16,16,12,3,hLight)}
 else if(look.hair==='swept'){rect(11,10,27,9,hair);rect(13,14,21,4,hLight);rect(11,18,9,4,hair)}
 else if(look.hair==='spikes'){for(let i=0;i<6;i++){let x=12+i*4;rect(x,7-(i%2)*3,3,13,hair);rect(x+1,8,1,5,hLight)}}
 else if(look.hair==='mohawk'){rect(20,4,8,16,hair);rect(21,6,4,12,hLight);rect(13,14,7,2,dark);rect(28,14,7,2,dark)}
 else if(look.hair==='curly'){for(let j=0;j<7;j++){const x=10+j*4;rect(x,9+(j%2)*2,6,9,hair);rect(x+1,9+(j%2)*2,3,3,hLight)}rect(12,16,22,4,hair)}
 else if(look.hair==='afro'){rect(8,15,32,6,hair);rect(12,10,24,7,hair);for(let i=0;i<8;i++)rect(10+i*4,10+(i%3)*2,2,2,hLight)}
 else if(look.hair==='topknot'){rect(17,4,14,9,hair);rect(13,12,22,7,hair);rect(21,6,6,4,hLight)}
 else if(look.hair==='undercut'){rect(12,11,24,7,hair);rect(13,17,5,5,shade(hair,45));rect(20,13,13,4,hLight)}
 else {rect(11,10,26,8,hair);rect(13,16,22,4,hair);rect(16,12,15,2,hLight)}
 // Eye shapes and brows.
 const eyey=26;
 for(const x of [18,30]){
  rect(x-3,eyey-5,6,1,shade(hair,-3));
  if(look.eyes==='heavy')rect(x-4,eyey-6,8,3,hair);
  if(look.eyes==='sharp'){rect(x-3,eyey-1,6,2,'#f6e5ce');rect(x-1,eyey,2,2,eye);pix(x+2,eyey-2,dark)}
  else if(look.eyes==='wide'){rect(x-3,eyey-2,6,5,'#f3e7d7');rect(x-1,eyey-1,2,4,eye)}
  else if(look.eyes==='sleepy'){rect(x-3,eyey,6,1,dark);rect(x-1,eyey-1,2,1,eye)}
  else {rect(x-3,eyey-1,6,3,'#e7d6c2');rect(x-1,eyey,2,2,eye)}
 }
 if(look.eyes==='bright'){pix(17,26,'#fff');pix(29,26,'#fff')}
 // Nose, lips and individual expression.
 if(look.nose==='broad'){rect(22,29,5,6,dark);rect(21,34,7,2,light)}
 else if(look.nose==='crooked'){rect(23,29,2,3,dark);rect(22,32,3,2,dark);rect(24,34,2,1,light)}
 else if(look.nose==='straight'){rect(23,29,2,6,light);rect(24,35,2,1,dark)}
 else {rect(23,32,2,3,dark)}
 const lip=shade(skin,-42);
 if(look.mouth==='smile'){rect(21,37,6,1,lip);pix(20,36,lip);pix(27,36,lip)}
 else if(look.mouth==='smirk'){rect(22,37,6,1,lip);pix(28,36,lip)}
 else if(look.mouth==='frown'){rect(20,38,8,1,lip);pix(21,37,lip);pix(27,37,lip)}
 else if(look.mouth==='grin'){rect(19,37,10,3,lip);rect(21,38,7,1,'#e9d5bd')}
 else if(look.mouth==='grim'){rect(19,37,10,2,lip)}
 else rect(21,38,7,1,lip);
 // Facial hair layered over lower face.
 if(look.beard==='shadow'){rect(16,37,16,3,shade(skin,-23));rect(18,39,12,2,shade(skin,-25))}
 if(look.beard==='moustache'||look.beard==='goatee'||look.beard==='full'){rect(19,36,10,2,hair);pix(19,38,hLight)}
 if(look.beard==='goatee'||look.beard==='full'){rect(21,40,7,4,hair)}
 if(look.beard==='full'){rect(15,31,3,10,hair);rect(30,31,3,10,hair);rect(17,39,14,4,hair)}
 if(look.beard==='sideburns'){rect(13,24,3,13,hair);rect(32,24,3,13,hair)}
 // Scars and accessories.
 if(look.scars==='cheek'){rect(29,30,1,7,'#e2ab9b');pix(28,33,'#df9388')}
 if(look.scars==='brow'){rect(16,19,2,5,'#d7afa0');pix(17,23,'#f4ddc5')}
 if(look.scars==='nose'){rect(21,32,5,1,'#d58d83')}
 if(['glasses','shades'].includes(look.accessory)){const glass=look.accessory==='shades'?'#101924':'#bbcaca';rect(13,22,10,7,'#201d22');rect(25,22,10,7,'#201d22');rect(23,24,2,2,'#201d22');rect(15,24,6,4,glass);rect(27,24,6,4,glass)}
 if(look.accessory==='eyepatch'){rect(13,23,10,7,'#181923');rect(18,22,19,1,'#151820')}
 if(look.accessory==='earring'){rect(10,32,3,5,'#d9b668');pix(11,37,'#e9c579')}
 if(look.accessory==='piercing'){pix(27,35,'#e1bf85');pix(11,29,'#d5a866')}
 if(look.headwear==='headband'){rect(12,15,24,4,gearL)}
 if(look.headwear==='bandana'){rect(11,12,26,8,suit);rect(16,14,15,2,gearL);rect(35,19,5,10,suit)}
 if(look.headwear==='mask'){rect(12,18,24,24,suit);rect(15,24,9,6,'#eee0cb');rect(26,24,9,6,'#eee0cb');rect(18,27,3,2,eye);rect(29,27,3,2,eye);rect(21,36,7,3,gearD);rect(23,18,2,24,gearL)}
 if(look.headwear==='cap'){rect(11,9,26,11,suit);rect(9,19,28,3,gearD);rect(15,12,17,3,gearL)}
 // Tiny hand-set costume/character marks from the v4 appearance briefs.
 const detail=cutout?portraitDetails[actor?.key?.slice(9)]:null;
 if(detail){
  const trim=detail==='neon'?'#a5f64c':detail==='silvertrim'||detail==='silver'||detail==='streak'?'#e1e6ed':detail==='goldtrim'||detail==='star'||detail==='maskgold'?'#ead16c':detail==='tealtrim'?'#54d7cc':'#d9c9ab';
  if(['lapels','pearl','coat','pinstripe','slate','silver','mustard'].includes(detail)){rect(11,45,2,13,trim);rect(35,45,2,13,trim);}
  if(detail==='pinstripe'){for(const x of [9,16,31,38])rect(x,48,1,10,trim);}
  if(['wrap','gloves','battered','work','worn','denim','patch','shoulders','broad'].includes(detail)){rect(7,51,5,3,detail==='gloves'?'#cf4559':trim);rect(36,51,5,3,detail==='gloves'?'#cf4559':trim);}
  if(['star','moth','cards','waves','goldtrim','blacktrim','bronze','blue','trunks','indigo','maskgold','tealtrim','neon'].includes(detail)){
   rect(22,51,4,2,detail==='blacktrim'?'#1e2030':trim);
   rect(23,49,2,6,detail==='blacktrim'?'#1e2030':trim);
   if(detail==='moth'){rect(18,50,4,3,'#e6e5df');rect(26,50,4,3,'#e6e5df');}
   if(detail==='cards'){rect(19,47,3,5,'#f4e8da');rect(27,47,3,5,'#8e303d');}
  }
  if(detail==='streak'||detail==='fringe'){rect(15,13,4,4,'#9ec4df');rect(18,16,5,2,'#9ec4df');}
  if(detail==='freckles'){for(const x of [17,19,29,31])pix(x,33,'#b17b59');}
  if(detail==='gloves'){rect(5,47,5,8,'#ac344a');rect(38,47,5,8,'#ac344a');}
  if(detail==='cape'){rect(3,44,6,16,gearD);rect(39,44,6,16,gearD);}
 }
 // Jersey emblem and bottom cut.
 if(look.gear!=='suit'&&look.gear!=='robe'){rect(22,52,4,2,gearL);rect(23,53,2,3,gearD)}
 if(!cutout){rect(0,57,48,3,shade(bg,-30));rect(1,1,1,57,'#8d765d');rect(46,1,1,57,'#81715b');}
 return canvas;
}
function asData(actor,appearance=null){const look=appearance||getLook(actor),key=(actor?.key||'none')+'|'+JSON.stringify(look);if(cache.has(key))return cache.get(key);const url=renderCanvas(actor,look).toDataURL('image/png');if(cache.size>550)cache.clear();cache.set(key,url);return url}
const portraitRows=[
 ['wrestler:mara','wrestler:rex','wrestler:lyra','wrestler:brick'],
 ['wrestler:juno','wrestler:sol','wrestler:dee','wrestler:kit'],
 ['wrestler:dax','wrestler:val','wrestler:nico','wrestler:cal'],
 ['wrestler:imani','wrestler:otis','wrestler:kira','wrestler:ezra'],
 ['wrestler:red','wrestler:roxy','wrestler:silas','wrestler:night'],
 ['wrestler:rev','wrestler:malik','wrestler:dean','wrestler:rocco'],
 ['wrestler:nova','wrestler:ace','wrestler:magnus','wrestler:tori'],
 ['booker:dock','booker:pulse','booker:crown','booker:union'],
 ['wrestler:faye','wrestler:bao','wrestler:zara','wrestler:miro'],
 ['wrestler:aisha','wrestler:ellis','wrestler:anya','wrestler:nolan'],
 ['wrestler:ivo','wrestler:rina','wrestler:priya','wrestler:nate'],
 ['wrestler:cass','wrestler:jun','wrestler:sylvia','wrestler:kofi'],
 ['wrestler:mae','wrestler:theo','wrestler:soraya','wrestler:milo'],
 ['wrestler:winnie','wrestler:bronte','wrestler:gus','wrestler:nikita'],
 ['wrestler:jett','wrestler:alina','wrestler:cedric','wrestler:marisol'],
 ['wrestler:felix','wrestler:eira','wrestler:gideon','wrestler:vera'],
 ['wrestler:tomas','wrestler:ari','wrestler:tomasash','wrestler:kezia'],
 ['wrestler:dev','wrestler:liya','wrestler:emmett','wrestler:nadia'],
 ['wrestler:leandro','wrestler:iris','wrestler:kellan','wrestler:ayla'],
 ['wrestler:sasha','wrestler:morgan','wrestler:noelle','wrestler:ash'],
 ['wrestler:zane','wrestler:elodie','wrestler:bashir','wrestler:cleo'],
];
const portraitCells=new Map(portraitRows.flatMap((row,y)=>row.map((key,x)=>[
 key,`${100*x/(row.length-1)}% ${100*y/(portraitRows.length-1)}%`
])));
function avatar(actor,appearance=null,cssClass='portrait'){
 const safe=String(actor?.name||'Wrestler').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
 const label='Pixel-art portrait of '+safe;
 const position=appearance===null&&portraitCells.get(actor?.key);
 if(position)return `<span class="${cssClass} roster-portrait" role="img" aria-label="${label}" style="background-position:${position}"></span>`;
 return `<img class="${cssClass}" src="${asData(actor,appearance)}" alt="${label}" width="48" height="60" loading="lazy">`;
}
function png(actor,appearance=null){const canvas=renderCanvas(actor,appearance||getLook(actor),8);const link=document.createElement('a');link.download='the-office-'+(actor.name||actor.key).replace(/[^a-z0-9-]+/gi,'-').toLowerCase()+'-portrait.png';link.href=canvas.toDataURL('image/png');link.click()}
root.OfficePortraits={OPTIONS,items,generated,getLook,renderCanvas,asData,avatar,png,hash,curatedLooks,portraitDetails};
})(typeof window!=='undefined'?window:globalThis);
