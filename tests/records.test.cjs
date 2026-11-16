'use strict';
// v3.8 records behind the graphs: weekly attribute snapshots, the books, and the crowd through a match.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
const db=new Map(),root={addEventListener(){}};
const localStorage={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
vm.runInNewContext(script.slice(0,script.indexOf('/* THE OFFICE — interface v3')),{window:root,localStorage,console,Math,Date,JSON});
const {OfficeData:D,OfficeGame:G,OfficeMatch:M}=root;

G.fresh();G.S.cash=1e6;
const id=G.S.free[0].id;G.sign(id);const w=G.W(id);
assert.equal(w.trend.length,1,'signing starts the chart');
assert.ok(['ring','mic','psych','safe','heat','morale'].every(k=>Number.isFinite(w.trend[0][k])));
w.training='ring';w.intensity='hard';
for(let i=0;i<6;i++){G.S.card=[];w.fatigue=0;w.injury=0;G.endWeek();}
assert.equal(G.S.books.length,6,'one line in the books a week');
for(const b of G.S.books)assert.ok(Number.isFinite(b.cash)&&b.wages>0&&b.other>=0&&Number.isInteger(b.a));
assert.ok(G.S.books.some(b=>b.other>0),'training spend counts in the weekly bill');
assert.ok(G.S.books.every((b,i,a)=>!i||b.a===a[i-1].a+1),'one entry per week, in order');
assert.ok(w.trend.length>=6&&w.trend.at(-1).ring>=w.trend[0].ring,'the trend follows training');
assert.ok(new Set(w.trend.map(p=>p.a)).size===w.trend.length,'one snapshot per week');
// Long careers stay small.
for(let i=0;i<70;i++){G.S.card=[];w.fatigue=0;w.injury=0;if(G.S.over)break;G.endWeek();}
assert.ok(G.S.books.length<=48&&w.trend.length<=40,'records are capped');
const kept={books:G.S.books.length,trend:w.trend.length};
const weeksBooked=G.S.books.length,snapshots=w.trend.length;
// Old saves gain the books and the trend.
const old=JSON.parse(JSON.stringify(G.S));delete old.books;for(const r of old.roster)delete r.trend;
G.S=old;assert.ok(Array.isArray(G.S.books)&&G.S.roster.every(r=>Array.isArray(r.trend)));

// The crowd is sampled through every match, in time order, inside the meter's range.
const w2=D.TALENT[0],f=D.FOES[0],p=D.PROMOS[0];
for(const seed of [1,2,3]){
 const m=M.create({w:{...w2,flags:{},fatigue:5},f,p,slot:'mid',minutes:10,finish:'win_clean',plan:{game:'story',leash:'script',talk:'none'},preparation:{},flags:{},seed});
 for(let t=0;t<9000&&!m.done;t++){if(m.decision&&!m.queue.length)M.resolve(m,m.decision.options[0].id);M.next(m);}
 const tr=m.final.crowdTrace;
 assert.ok(tr.length>=m.len/10*.8,'sampled every ten seconds');
 assert.ok(tr.every((pt,i)=>pt[1]>=0&&pt[1]<=100&&(!i||pt[0]>=tr[i-1][0])),'in range and in order');
 assert.equal(tr.at(-1)[1],m.final.crowd,'the trace ends where the crowd ended');
}
console.log(`PASS records v3.8: ${kept.books} weeks in the books (capped), ${kept.trend} weekly snapshots (capped), crowd traces checked`);
