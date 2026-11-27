'use strict';
// The real season-end career transition must move portrait cells when a
// character crosses an age band, and the chosen cell must survive a save.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {script}=require('./_source.cjs');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/portrait-ages/manifest.json'),'utf8'));
const root={addEventListener(){}},store=new Map();
const localStorage={
 getItem:key=>store.get(key)||null,
 setItem:(key,value)=>store.set(key,String(value)),
 removeItem:key=>store.delete(key)
};
vm.runInNewContext(script.slice(0,script.indexOf('/* THE OFFICE — interface v3')),{window:root,localStorage,JSON,console});
const {OfficeGame:G,OfficePortraits:P,OfficeData:D,OfficeAgePortraitCells:cells}=root;
assert.equal(Object.keys(cells).length,227);
assert.equal(manifest.records.length,227*3);
for(const record of manifest.records){
 const [sheet,column,row]=cells[record.id];
 const bandOffset={young:0,middle:1,old:2}[record.age];
 assert.equal(record.x,(column+bandOffset)*144,record.file);
 assert.equal(record.y,row*180,record.file);
 assert.equal(record.atlas,`atlases/portrait-atlas-${String(sheet).padStart(2,'0')}.png`);
}
for(let sheet=1;sheet<=10;sheet++){
 const image=fs.readFileSync(path.join(__dirname,`../assets/portrait-ages/atlas-${String(sheet).padStart(2,'0')}.webp`));
 assert.equal(image.subarray(0,4).toString(),'RIFF');
 assert.equal(image.subarray(8,12).toString(),'WEBP');
}
for(const worker of D.ALL)assert.ok(cells[worker.id],`missing three ages for ${worker.name}`);
for(const key of [...D.PROMOS.map(p=>'booker:'+p.id),...['iron','coastal','northern','eastbank','meridian','redwood'].map(id=>'manager:'+id)])
 assert.ok(cells[key],`missing staff portrait ${key}`);

G.fresh();
const s=G.S;
const ownedId=s.free[0].id;
assert.equal(G.sign(ownedId),null);
const owned=G.W(ownedId);
owned.age=29;
const rivalId=s.territory.teams[0].roster[0];
s.worldV4.personnel={[rivalId]:{age:41,retireWarned:false}};
const free=s.free[0];
free.age=29;
const face=id=>P.avatar({key:'wrestler:'+id,name:id});
const beforeOwned=face(ownedId),beforeRival=face(rivalId);
assert.equal(P.ageBand({key:'wrestler:'+ownedId}),'young');
assert.equal(P.ageBand({key:'wrestler:'+rivalId}),'middle');
assert.equal(P.ageBand({key:'wrestler:'+free.id}),'young');
assert.equal(P.ageBand({key:'booker:pulse'}),'young');
assert.equal(P.ageBand({key:'manager:coastal'}),'middle');
const playerBefore=P.playerPortrait(4,'My manager');

s.cash=100000;s.week=16;
G.endWeek();
assert.equal(s.season,2);
assert.equal(owned.age,30);
assert.equal(G.F(rivalId).age,42);
assert.equal(G.F(free.id).age,30);
assert.equal(P.ageBand({key:'wrestler:'+ownedId}),'middle');
assert.equal(P.ageBand({key:'wrestler:'+rivalId}),'old');
assert.equal(P.ageBand({key:'wrestler:'+free.id}),'middle');
assert.notEqual(face(ownedId),beforeOwned,'owned wrestler switched at season end');
assert.notEqual(face(rivalId),beforeRival,'rival wrestler switched at season end');
assert.equal(P.playerPortrait(4,'My manager'),playerBefore,'staff do not skip an age band each season');
assert.equal(P.ageBand({key:'booker:pulse'},{season:4}),'middle');
assert.equal(P.ageBand({key:'booker:pulse'},{season:21}),'old');
assert.equal(P.ageBand({key:'manager:coastal'},{season:11}),'old');
assert.equal(P.ageBand({key:'player-manager-05'},{season:7}),'middle');
assert.equal(P.ageBand({key:'player-manager-05'},{season:24}),'old');
const promoterBefore=P.avatar({key:'booker:pulse',name:'Nina Sato'});
const managerBefore=P.avatar({key:'manager:coastal',name:'Coastal manager'});
s.season=4;
assert.notEqual(P.avatar({key:'booker:pulse',name:'Nina Sato'}),promoterBefore,
 'promoter changes on the correct season');
s.season=7;
assert.notEqual(P.playerPortrait(4,'My manager'),playerBefore,
 'selected player manager changes after enough seasons');
s.season=11;
assert.notEqual(P.avatar({key:'manager:coastal',name:'Coastal manager'}),managerBefore,
 'rival manager ages as the career advances');
s.season=2;

const after=face(ownedId);
G.save();assert.ok(G.load());
assert.equal(face(ownedId),after,'the reloaded career uses the saved age');
assert.equal(P.ageBand({key:'wrestler:'+rivalId}),'old');
const legacy=JSON.parse(JSON.stringify(G.S));
delete legacy.roster.find(w=>w.id===ownedId).age;
G.S=legacy;
assert.equal(G.W(ownedId).age,D.findWrestler(ownedId).age,'legacy age repair remains intact');
console.log('PASS 227 three-age identities, real season transition, staff progression and save reload');

{

 // Audit the actual lossless pixel cells, not just their mapped coordinates.
 // Decode with the system WebP library (Ubuntu ships libwebp), or Pillow
 // if installed. No new npm dependency, workflow or package install.
 const cp=require('node:child_process');
 const decoder=String.raw`
import sys
try:
    from PIL import Image
except ImportError:
    import ctypes as c
    import ctypes.util
    lib=c.CDLL(ctypes.util.find_library("webp") or "libwebp.so.7")
    lib.WebPDecodeRGBA.argtypes=[c.c_void_p,c.c_size_t,c.POINTER(c.c_int),c.POINTER(c.c_int)]
    lib.WebPDecodeRGBA.restype=c.c_void_p
    lib.WebPFree.argtypes=[c.c_void_p]
    lib.WebPFree.restype=None
    data=open(sys.argv[1],"rb").read()
    buf=c.create_string_buffer(data)
    w,h=c.c_int(),c.c_int()
    ptr=lib.WebPDecodeRGBA(buf,len(data),c.byref(w),c.byref(h))
    if not ptr: raise ValueError("Invalid WebP")
    try:
        assert (w.value,h.value)==(1296,1440)
        sys.stdout.buffer.write(c.string_at(ptr,w.value*h.value*4))
    finally:
        lib.WebPFree(ptr)
else:
    with Image.open(sys.argv[1]) as im:
        assert im.size==(1296,1440)
        sys.stdout.buffer.write(im.convert("RGBA").tobytes())
`;
 const bin=['python3','python'].find(name=>cp.spawnSync(name,['--version'],{encoding:'utf8'}).status===0);
 if(!bin){if(process.env.CI)throw new Error('Portrait pixel audit requires Python on CI');console.log('PORTRAIT FRAME AUDIT skipped: Python not installed locally');}
 else{
  const W=1296,H=1440,CW=144,CH=180,rows=[];
  for(let sheet=1;sheet<=10;sheet++){
   const file=path.join(__dirname,`../assets/portrait-ages/atlas-${String(sheet).padStart(2,'0')}.webp`);
   const decoded=cp.spawnSync(bin,['-c',decoder,file],{maxBuffer:W*H*4+1024});
   assert.equal(decoded.status,0,decoded.stderr?.toString());
   const pixels=decoded.stdout;assert.equal(pixels.length,W*H*4,'exact decoded atlas dimensions');
   for(const r of manifest.records.filter(x=>x.atlas.endsWith('-'+String(sheet).padStart(2,'0')+'.png'))){
    let x0=CW,y0=CH,x1=-1,y1=-1,opaque=0,bottom=0,top=0;
    for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){
     if(pixels[((r.y+y)*W+r.x+x)*4+3]<128)continue;
     x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);opaque++;
     if(y===CH-1)bottom++;if(y===0)top++;
    }
    assert.ok(opaque>0,'empty portrait '+r.id+' '+r.age);
    // Analyze the dominant connected silhouette, excluding disconnected atlas
    // remnants; record each lower row so a sparse tail cannot hide a cut-off.
    const mask=new Uint8Array(CW*CH),seen=new Uint8Array(CW*CH),counts=new Uint16Array(CH),components=[];
    for(let y=0;y<CH;y++)for(let x=0;x<CW;x++)mask[y*CW+x]=pixels[((r.y+y)*W+r.x+x)*4+3]>=128?1:0;
    for(let start=0;start<mask.length;start++){
     if(!mask[start]||seen[start])continue;
     const queue=[start];seen[start]=1;let left=CW,right=-1,top=CH,base=-1;
     for(let q=0;q<queue.length;q++){
      const p=queue[q],x=p%CW,y=Math.floor(p/CW);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);base=Math.max(base,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
       if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||nx>=CW||ny<0||ny>=CH)continue;
       const j=ny*CW+nx;if(mask[j]&&!seen[j]){seen[j]=1;queue.push(j);}
      }
     }
     components.push({size:queue.length,left,right,top,base,queue});
    }
    components.sort((a,b)=>b.size-a.size);
    const major=components[0];
    for(const p of major.queue)counts[Math.floor(p/CW)]++;
    // A credible torso occupies at least half a cell's width. Hair or narrow
    // remnants on lower rows are separately reported, not treated as a torso.
    let solidBase=-1;for(let y=0;y<CH;y++)if(counts[y]>=CW/2)solidBase=y;
    const lower=Array.from(counts.slice(-24));
    rows.push({id:r.id,age:r.age,sheet,left:x0,top:y0,right:CW-1-x1,bottom:CH-1-y1,basePixels:bottom,topPixels:top,coverage:Math.round(opaque/(CW*CH)*100),
     majorTop:major.top,majorBottom:CH-1-major.base,solidBottom:solidBase<0?null:CH-1-solidBase,
     lower,detached:opaque-major.size,components:components.slice(0,4).map(({queue,...c})=>c)});
   }
  }
  assert.equal(rows.length,manifest.records.length);
  const flagged=rows.filter(r=>r.bottom>3).sort((a,b)=>b.bottom-a.bottom||a.id.localeCompare(b.id)||a.age.localeCompare(b.age));
  console.log('PORTRAIT FRAME SUMMARY '+JSON.stringify({total:rows.length,bottomGap:flagged.length,topTouch:rows.filter(r=>r.topPixels>0).length,sideTouch:rows.filter(r=>!r.left||!r.right).length,opaque:rows.filter(r=>r.coverage===100).length}));
  for(const r of rows.filter(r=>r.id==='magnus'||r.id==='rex'))console.log('PORTRAIT REFERENCE '+JSON.stringify(r));
  for(const r of flagged)console.log('PORTRAIT FLOATING BASE '+JSON.stringify(r));
  const weak=rows.filter(r=>r.majorBottom>2||(r.solidBottom!==null&&r.solidBottom>5));
  console.log('PORTRAIT SILHOUETTE SUMMARY '+JSON.stringify({total:rows.length,weakBase:weak.length,detachedBottom:rows.filter(r=>r.majorBottom>r.bottom).length,solidGap:rows.filter(r=>r.solidBottom!==null&&r.solidBottom>5).length}));
  for(const r of weak)console.log('PORTRAIT WEAK BASE '+JSON.stringify({id:r.id,age:r.age,majorBottom:r.majorBottom,solidBottom:r.solidBottom,detached:r.detached,lower:r.lower}));
  for(const id of ['magnus','rex','cal'])for(const r of rows.filter(r=>r.id===id))console.log('PORTRAIT SILHOUETTE '+JSON.stringify(r));
  console.log('PASS all 681 age portrait cells decoded and checked for transparent edge margins');
 }

}
