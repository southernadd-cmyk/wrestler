'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const {script}=require('./_source.cjs');
const storage = new Map();
const localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
};
const root = { addEventListener() {} };
vm.runInNewContext(script.slice(0, script.indexOf('/* THE OFFICE — interface v3')), {
  window: root, localStorage, Date, Math, JSON, console,
});

const { OfficeData: data, OfficeGame: game, OfficeMatch: match, OfficePortraits: portraits,
  OfficeTerritory: territory } = root;
const all = [...data.TALENT, ...data.FOES];
assert.equal(data.TALENT.length, 16);
assert.equal(data.FOES.length, 12);
assert.equal(new Set(all.map(w => w.id)).size, 28);

const atlas = fs.readFileSync(path.join(__dirname,'..','assets','portrait-atlas.png'));
assert.equal(atlas.subarray(12, 16).toString(), 'IHDR');
assert.equal(atlas.readUInt32BE(16), 4 * 144);
assert.equal(atlas.readUInt32BE(20), 21 * 180);
const css = fs.readFileSync(path.join(__dirname,'..','assets','css','core.css'),'utf8');
assert.match(css, /\.roster-portrait\{[^}]*background-size:400% 2100%/);
const positions = new Set();
function checkPortrait(key, name) {
  const markup = portraits.avatar({ key, name });
  assert.match(markup, /roster-portrait/);
  assert.ok(markup.includes(`aria-label="Pixel-art portrait of ${name}"`));
  const position = markup.match(/background-image:url\('([^']+)'\);background-position:([^"]+)/).slice(1).join('@');
  positions.add(position);
  return position;
}
for (const wrestler of all) {
  const profile = data.PROFILES[wrestler.id];
  assert.ok(profile?.signature.length, `${wrestler.name} has signature moves`);
  for (const id of [...profile.signature, ...profile.preferred]) {
    assert.ok(match.GRAPH.A[id], `${wrestler.name} uses known move ${id}`);
  }
  checkPortrait('wrestler:' + wrestler.id, wrestler.name);
}
for (const promoter of data.PROMOS)checkPortrait('booker:' + promoter.id, promoter.voice);
assert.equal(positions.size, all.length + data.PROMOS.length);

game.fresh();
const archive=game.IDENTITY_ARCHIVE;
assert.ok(archive.people.includes(game.S.identity.manager),
 'new careers choose a fictional British wrestling homage');
assert.ok(archive.stables.includes(game.S.identity.stable),
 'new careers choose a fictional stable');
assert.ok(game.S.identity.portrait>=0&&game.S.identity.portrait<16);
assert.deepEqual(game.suggestIdentity(442),game.suggestIdentity(442),
 'old-career suggestions are deterministic');
assert.ok(archive.people.includes('Mitzi Millward')&&archive.people.includes('Klondyke Kay'));
assert.ok(archive.groups.includes('The Crown Cousins')&&archive.groups.includes('The Bootlace Belles'));
const formerRealPeople=['Mick McManus','Jackie Pallo','Les Kellett','Johnny Saint','Billy Robinson','Adrian Street','Mark Rocco','Jim Breaks','Bert Royal','Vic Faulkner','George Kidd','Big Daddy','Giant Haystacks','Kendo Nagasaki','Davey Boy Smith','Dynamite Kid','Marty Jones','Tony St Clair','Pat Roach','Johnny Kwango','Max Crabtree','Brian Dixon','Orig Williams','Gorgeous George Gillette','Lloyd Ryan','Paul Lincoln','Ricky Knight','Mitzi Mueller','Klondyke Kate','Rusty Blair','Nicky Monroe','Sue Brittain','Sweet Saraya'];
const formerRealGroups=['The Royal Family','The British Bulldogs','The Bovver Birds','British Strong Style','The Origin'];
assert.ok(formerRealPeople.every(name=>!archive.people.includes(name)));
assert.ok(formerRealGroups.every(name=>!archive.stables.includes(name)));
assert.ok(!archive.people.includes('Tommy Dynamite'),'retired manager homage is not suggested');
assert.ok(!archive.stables.includes('The Wigan Mastiffs'),'retired team homage is not suggested');
assert.equal(new Set(archive.people).size,archive.people.length);
assert.equal(new Set(archive.stables).size,archive.stables.length);
for(let seed=0;seed<256;seed++){
 const suggestion=game.suggestIdentity(seed);
 assert.ok(archive.people.includes(suggestion.manager));
 assert.ok(archive.stables.includes(suggestion.stable));
}
const savedIdentity=JSON.parse(JSON.stringify(game.S));
savedIdentity.identity={manager:'Mick McManus',stable:'The British Bulldogs',portrait:3};
game.S=savedIdentity;
assert.equal(game.S.identity.manager,'Mick McManus','previously saved manager is preserved');
assert.equal(game.S.identity.stable,'The British Bulldogs','previously saved stable is preserved');
assert.equal(game.S.identity.portrait,3);
const untouchedSeed=game.S.seed;
assert.equal(game.setIdentity({manager:'  Ada   Lovelace ',stable:'  Royal   Mat ',portrait:8}),true);
assert.equal(game.S.identity.manager,'Ada Lovelace');
assert.equal(game.S.identity.stable,'Royal Mat');
assert.equal(game.S.identity.portrait,8);
assert.equal(game.S.seed,untouchedSeed,'changing the player portrait never advances simulation RNG');
assert.equal(game.S.free.length, 20);
assert.equal(game.S.territory.teams.flatMap(team => team.roster).length, 44);
assert.equal(territory.rank().length, 60);
assert.equal(data.ALL.length,80);
assert.equal(game.S.worldV4.version,4);
assert.equal(game.sign('dax'), 'Not available.');
assert.equal(territory.stableFor('dax').name, 'Iron Borough');
assert.equal(territory.promotionRank('dock')[0].id, 'rocco');
assert.equal(territory.promotionRank('pulse')[0].id, 'night');
assert.equal(territory.promotionRank('crown')[0].id, 'rev');
assert.equal(territory.promotionRank('union')[0].id, 'silas');
assert.ok(game.S.offers.every(o => territory.opponents(o.pid, o.slot).some(w => w.id === o.rid)));

assert.equal(game.sign('mara'), null);
const oldSave = JSON.parse(JSON.stringify(game.S));
delete oldSave.identity;
delete oldSave.worldV4;
oldSave.free = oldSave.free.filter(w => data.TALENT.findIndex(x => x.id === w.id) < 8 && w.id !== 'sol');
oldSave.free[0].fee = 1234;
oldSave.territory.teams = data.STABLES.map((team, i) => ({
  name: team.legacy, rep: 57, wins: 1, losses: 2,
  roster: data.FOES.slice(0, 6).filter((_, index) => index % 3 === i).map(w => w.id),
}));
delete oldSave.territory.stablesReady;
delete oldSave.territory.cards;
storage.set('the-office-v22', JSON.stringify(oldSave));
game.load();
const inherited=game.suggestIdentity(oldSave.careerSeed??oldSave.seed);
assert.equal(game.S.identity.manager,inherited.manager,'legacy save has a stable fictional manager name');
assert.equal(game.S.identity.stable,inherited.stable,'legacy save has a stable fictional group name');
assert.equal(game.S.identity.portrait,inherited.portrait,'legacy save gets a fixed seeded portrait');
assert.equal(game.S.free.length, 18);
assert.equal(game.S.free[0].fee, 1234);
assert.equal(game.S.roster[0].id, 'mara');
assert.equal(game.S.territory.champion, oldSave.territory.champion);
assert.equal(game.S.territory.teams[0].rep, 57);
assert.ok(game.S.free.some(w => w.id === 'nico'));
assert.ok(!game.S.free.some(w => w.id === 'sol'));
assert.equal(new Set(game.S.territory.teams.flatMap(team => team.roster)).size, 44);
assert.equal(game.S.territory.teams.length,6);
game.load();
assert.equal(game.S.identity.manager,inherited.manager,'identity survives a second load');
assert.equal(game.S.identity.stable,inherited.stable,'stable survives a second load');
assert.equal(game.S.free.length, 18);

const contract = {id:'pyramid-test',wid:'mara',rid:'red',pid:'dock',slot:'mid',minutes:12,
  finish:'win_clean',purse:300,feudHeat:0,blowoff:false,eventAbs:1};
const finish = {stars:3.5,crowd:61,crowdPeak:68,outcome:'booked',botches:0,script:.9,
  adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},minutes:12,
  plan:'story',stamina:45,injury:0,ignored:0,callsUsed:[],log:[]};
const pulseBefore = JSON.stringify(game.S.territory.cards.pulse);
game.applyResult(contract, finish);
assert.equal(JSON.stringify(game.S.territory.cards.pulse), pulseBefore);
assert.ok(territory.promotionRank('dock').some(w => w.id === 'mara' && w.wins === 1));
assert.ok(!territory.promotionRank('pulse').some(w => w.id === 'mara'));
game.applyResult(contract, finish);
assert.equal(game.S.territory.cards.dock.mara.matches, 1);
game.load();
assert.equal(game.S.territory.cards.dock.mara.matches, 1);

game.S.week = 5;
const market = game.S.free.length;
territory.evolve();
assert.ok(data.PROMOS.every(p => Object.values(game.S.territory.cards[p.id]).some(row => row.matches > 0)));
assert.ok(game.S.territory.reports[0].lines.some(line => line.includes(' signed ')));
assert.ok(game.S.free.length < market,'multiple AI managers can sign on week five');
assert.ok(game.S.free.every(w => !territory.stableFor(w.id)));
const weekFive = JSON.stringify(game.S.territory);
territory.evolve();
assert.equal(JSON.stringify(game.S.territory), weekFive);

const placeholder=JSON.parse(JSON.stringify(game.S));
placeholder.identity={manager:'Alex Morgan',stable:'The New Guard',portrait:9};
game.S=placeholder;
assert.equal(game.S.identity.manager,game.suggestIdentity(placeholder.careerSeed).manager,
 'legacy placeholder migrates once');
assert.equal(game.S.identity.stable,game.suggestIdentity(placeholder.careerSeed).stable);
assert.equal(game.S.identity.portrait,9,'portrait choice is preserved');
const custom=JSON.parse(JSON.stringify(game.S));
custom.identity={manager:'A Custom Booker',stable:'A Custom Stable',portrait:12};
game.S=custom;
assert.equal(game.S.identity.manager,'A Custom Booker','custom name is not overwritten');
assert.equal(game.S.identity.stable,'A Custom Stable','custom stable is not overwritten');
assert.equal(game.S.identity.portrait,12,'custom portrait is not overwritten');
game.fresh({manager:'  Jane  Smith  ',stable:' Smiths & Co ',portrait:15});
assert.equal(game.S.identity.manager,'Jane Smith');
assert.equal(game.S.identity.stable,'Smiths & Co');
assert.equal(game.S.identity.portrait,15);
const customSeed=game.S.seed;
game.setIdentity({manager:'New Manager',stable:'Old Firm',portrait:999});
assert.equal(game.S.identity.portrait,0,'out-of-range portrait indexes are safely reset');
assert.equal(game.S.seed,customSeed);
game.load();
assert.equal(game.S.identity.manager,'New Manager','identity survives automatic save and load');
assert.equal(game.S.identity.stable,'Old Firm');
console.log('roster: 80 wrestlers, six agencies, four promotion ladders, identity persistence and save migration passed');
