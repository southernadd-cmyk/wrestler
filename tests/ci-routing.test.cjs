'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const cp=require('node:child_process');
const root=path.join(__dirname,'..');
const route=path.join(root,'scripts/ci-ui-suites.sh');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'office-ci-routing-'));
function git(...args){return cp.execFileSync('git',args,{cwd:dir,encoding:'utf8'}).trim();}
function write(text){fs.writeFileSync(path.join(dir,'assets/js/ui.js'),text);}
try{
 git('init','-q');git('config','user.name','CI Test');git('config','user.email','ci@example.test');
 fs.mkdirSync(path.join(dir,'assets/js'),{recursive:true});
 const poster='function posterFace(img){\n return img.url;\n}\n';
 const promo='function showPromos(){\n return OfficeMic.choose();\n}\n';
 const finance='function updateCash(){\n return state.cash;\n}\n';
 const gap='\n// unrelated spacer\n'.repeat(8);
 const original=poster+gap+promo+gap+finance;
 write(original);git('add','.');git('commit','-qm','base');
 const base=git('rev-parse','HEAD');
 function check(text){write(text);git('add','.');git('commit','-qm','change');return cp.execFileSync('bash',[route,base,git('rev-parse','HEAD')],{cwd:dir,encoding:'utf8'}).trim().split('\n');}
 let result=check(original.replace('img.url','img.fileUrl'));
 assert.deepEqual(result,['tests/portrait-v4.test.cjs','tests/portrait-ageing.test.cjs']);
 result=check(original.replace('OfficeMic.choose()','OfficeMic.choose(2)'));
 assert.ok(result.includes('tests/promo-flow.test.cjs'));
 assert.ok(!result.includes('tests/early-career-finances.test.cjs'));
 result=check(original.replace('img.url','img.fileUrl').replace('state.cash','state.cash+1'));
 assert.ok(result.includes('tests/early-career-finances.test.cjs'));
 assert.ok(result.includes('tests/match-flow.test.cjs'));
 assert.ok(!result.includes('tests/promo-flow.test.cjs'));
 const workflow=fs.readFileSync(path.join(root,'.github/workflows/tests.yml'),'utf8');
 assert.match(workflow,/scripts\/ci-ui-suites\.sh "\$BASE_SHA" "\$HEAD_SHA"/);
 assert.match(workflow,/\.github\/workflows\/tests\.yml\|scripts\/ci-ui-suites\.sh\)\s*add tests\/ci-routing\.test\.cjs/);
 assert.match(workflow,/for suite in tests\/\*\.test\.cjs/);
 console.log('PASS CI routing: portrait-only, promo, mixed financial change and full-suite availability');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
