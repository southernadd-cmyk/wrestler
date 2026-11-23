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
assert.equal(P.PLAYER_PORTRAITS.length,16,'16 selectable manager looks');
assert.equal(new Set(P.PLAYER_PORTRAITS.map(p=>p.label)).size,16,'each manager has a distinct label');
assert.equal(new Set(P.PLAYER_PORTRAITS.map(p=>p.inspiration)).size,16,'British-wrestling callbacks are individual');
const art=fs.readFileSync(path.join(__dirname,'../assets/portraits/player-managers.webp'));
assert.equal(art.subarray(0,4).toString(),'RIFF','bundled manager atlas');
assert.equal(art.subarray(8,12).toString(),'WEBP','manager art format');
assert.equal(art.subarray(12,16).toString(),'VP8X','extended WEBP stores alpha and dimensions');
assert.equal(art.readUIntLE(24,3)+1,192,'four 48px manager columns');
assert.equal(art.readUIntLE(27,3)+1,240,'four 60px manager rows');
const css=fs.readFileSync(path.join(__dirname,'../assets/css/core.css'),'utf8');
assert.ok(css.includes('background-image:url(\'../portraits/player-managers.webp\')'),
 'manager cells are from the bundled asset, not the procedural renderer');
assert.ok(css.includes('background-size:400% 400%'),'manager atlas is an exact 4x4 grid');
const managerPositions=new Set();
for(let i=0;i<16;i++){
 const image=P.playerPortrait(i,'Jane Smith','portrait x2');
 assert.match(image,/^<span class="portrait x2 player-manager-portrait" role="img"/,
  'player option '+i+' uses the illustrated atlas');
 assert.match(image,/Pixel-art portrait of Jane Smith/);
 managerPositions.add(image.match(/background-position:([^"]+)/)[1]);
}
assert.equal(managerPositions.size,16,'all 16 choices have different artwork cells');
assert.match(P.playerPortrait(0,'A&B <script>'),/A&amp;B &lt;script>/,'manager name safely escaped');
assert.equal(P.playerPortrait(999,'Fallback'),P.playerPortrait(0,'Fallback'),
 'invalid portrait indexes still fall back safely');
console.log('PASS portraits: 80 wrestlers, 4 promoters, Dennis and 16 illustrated manager portraits');
