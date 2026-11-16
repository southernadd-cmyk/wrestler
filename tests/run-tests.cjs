'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
for(const file of fs.readdirSync(__dirname).filter(x=>x.endsWith('.test.cjs')).sort()){
 console.log('\n== '+file+' ==');
 const r=cp.spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:'inherit'});
 if(r.error)throw r.error;
 if(r.status!==0)process.exit(r.status||1);
}
