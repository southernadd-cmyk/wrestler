'use strict';
// Every wrestler (28 originals + 52 v4 newcomers) and every promoter shows its
// painted portrait from assets/portrait-atlas.png, in a browser as well as in
// Node. Only an explicit appearance override falls back to the canvas renderer.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'../assets/js/portraits.js'),'utf8');
const json=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/living-roster-v4.json'),'utf8'));
const document={createElement(type){
 assert.equal(type,'canvas');
 const canvas={width:0,height:0};
 canvas.getContext=()=>({setTransform(){},imageSmoothingEnabled:false,fillStyle:'#000',fillRect(){}});
 canvas.toDataURL=()=>'data:image/png;base64,portrait';
 return canvas;
}};
const newIds=json.new_wrestlers.map(w=>w.id);
const root={OfficeData:{V4:{newCast:newIds.map(id=>({id}))}}};
vm.runInNewContext(code,{window:root,document,Math,console});
const P=root.OfficePortraits;
const keys=[
 ...[...json.preserved_originals.talent_ids,...json.preserved_originals.opponent_ids,...newIds].map(id=>'wrestler:'+id),
 ...['dock','pulse','crown','union'].map(id=>'booker:'+id)
];
assert.equal(keys.length,84);
const positions=new Set();
for(const key of keys){
 const html=P.avatar({key,name:key,type:key.split(':')[0]});
 assert.match(html,/roster-portrait/,'atlas portrait expected for '+key);
 positions.add(html.match(/background-position:([^"]+)/)[1]);
}
assert.equal(positions.size,84,'every portrait has its own atlas cell');
const override=P.avatar({key:'wrestler:faye',name:'Faye Calder'},P.getLook({key:'wrestler:faye'}));
assert.match(override,/^<img [^>]*data:image\/png;base64,portrait/,'appearance overrides still use the renderer');
const stranger=P.avatar({key:'manager:someone',name:'Someone'});
assert.match(stranger,/^<img /,'characters without an atlas cell use the renderer');
// Dennis, the road agent, has a painted portrait of his own: 144×180 with a transparent background.
const dennis=P.avatar({key:'booker:dennis',name:'Dennis'});
assert.match(dennis,/^<img [^>]*src="assets\/portraits\/dennis\.png"/,'Dennis uses his painted portrait');
assert.match(dennis,/alt="Pixel-art portrait of Dennis"/);
const dennisPng=fs.readFileSync(path.join(__dirname,'..','assets','portraits','dennis.png'));
assert.equal(dennisPng.subarray(1,4).toString(),'PNG');assert.equal(dennisPng.readUInt32BE(16),144);assert.equal(dennisPng.readUInt32BE(20),180);
assert.equal(dennisPng[25],6,'with an alpha channel');
console.log('PASS portraits: 80 wrestlers and 4 promoters use painted atlas cells; Dennis has his own painted portrait; overrides still render');
