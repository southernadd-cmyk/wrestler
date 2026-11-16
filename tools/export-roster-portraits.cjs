'use strict';
// Offline pixel-perfect export of The Office's curated 48x60 portrait renderer.
// This is NOT a second art style: it rasterises the very same renderCanvas
// code that the browser uses for character-specific portraits.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.argv[2]||path.join(root,'assets','portraits'));
fs.mkdirSync(out,{recursive:true});
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc32(b){let c=0xffffffff;for(const n of b)c=crcTable[(c^n)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function chunk(type,data){const t=Buffer.from(type),n=Buffer.alloc(4),crc=Buffer.alloc(4);n.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([n,t,data,crc]);}
function png(w,h,pixels){
 const header=Buffer.alloc(13);header.writeUInt32BE(w,0);header.writeUInt32BE(h,4);header[8]=8;header[9]=6;
 const raw=Buffer.alloc((1+4*w)*h);
 for(let y=0;y<h;y++)Buffer.from(pixels.subarray(y*w*4,(y+1)*w*4)).copy(raw,y*(1+4*w)+1);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
function createCanvas(){
 const canvas={width:0,height:0,pixels:null};
 const ctx={fillStyle:'#000000',scale:1,imageSmoothingEnabled:false,
  setTransform(s){this.scale=s;},
  fillRect(x,y,w,h){
   const color=String(this.fillStyle);if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Unexpected drawing colour '+color);
   const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
   const s=this.scale,W=canvas.width,H=canvas.height,p=canvas.pixels;
   for(let j=Math.max(0,Math.round(y*s));j<Math.min(H,Math.round((y+h)*s));j++)
    for(let i=Math.max(0,Math.round(x*s));i<Math.min(W,Math.round((x+w)*s));i++){
     const k=(j*W+i)*4;p[k]=rgb[0];p[k+1]=rgb[1];p[k+2]=rgb[2];p[k+3]=255;
    }
  }
 };
 canvas.getContext=type=>{if(type!=='2d')throw Error('Expected 2d canvas');canvas.pixels=new Uint8Array(canvas.width*canvas.height*4);return ctx};
 return canvas;
}
const context={window:{addEventListener(){}},document:{createElement:t=>{if(t!=='canvas')throw Error('Unexpected DOM element '+t);return createCanvas();}},console};
vm.createContext(context);
for(const filename of ['portraits.js','data.js','roster-registry.js']){
 const source=fs.readFileSync(path.join(root,'assets','js',filename),'utf8');
 vm.runInContext(source,context,{filename});
}
const D=context.window.OfficeData,P=context.window.OfficePortraits;
const ids=[...D.V4.newCast.map(w=>w.id),'mara','rex','lyra','brick'];
if(D.V4.newCast.length!==52||new Set(ids).size!==56)throw Error('Incorrect cast size');
for(const id of ids){
 const actor={key:'wrestler:'+id,name:D.findWrestler(id)?.name||id};
 const canvas=P.renderCanvas(actor);
 if(canvas.width!==48||canvas.height!==60||!canvas.pixels)throw Error('Bad render '+id);
 const transparent=canvas.pixels.filter((_,i)=>i%4===3&&canvas.pixels[i]===0).length;
 if(transparent<100)throw Error('No transparent cutout for '+id);
 fs.writeFileSync(path.join(out,id+'.png'),png(48,60,canvas.pixels));
}
console.log('Exported 52 real v4 character portraits and 4 existing transparent redraws to '+out);
