'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'../assets/js/portraits.js'),'utf8');
const draw=[];
const document={createElement(type){
 assert.equal(type,'canvas');
 const canvas={width:0,height:0};
 canvas.getContext=()=>({setTransform(){},imageSmoothingEnabled:false,fillStyle:'#000',
 fillRect(x,y,w,h){draw.push([x,y,w,h]);}});
 canvas.toDataURL=()=>'data:image/png;base64,portrait';
 return canvas;
}};
const root={OfficeData:{V4:{newCast:[{id:'faye'}]}}};
vm.runInNewContext(code,{window:root,document,Math,console});
const P=root.OfficePortraits;
function avatar(id){return P.avatar({key:'wrestler:'+id,name:id,type:'wrestler'});}
for(const id of ['mara','rex','lyra','brick','faye']){
 draw.length=0;const html=avatar(id);
 assert.match(html,/^<img /,'transparent sprite should render from canvas: '+id);
 assert.match(html,/data:image\/png;base64,portrait/);
 assert.ok(!draw.some(rect=>rect[0]===0&&rect[1]===0&&rect[2]===48&&rect[3]===60),'no opaque backdrop on '+id);
 assert.ok(!draw.some(rect=>rect[0]===0&&rect[1]===57&&rect[2]===48&&rect[3]===3),'no coloured bottom border on '+id);
}
const original=avatar('juno');assert.match(original,/roster-portrait/,'existing transparent atlas sprites unchanged');
console.log('PASS first four and new v4 portraits use transparent canvas; legacy transparent atlas remains intact');
