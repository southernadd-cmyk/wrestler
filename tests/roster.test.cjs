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
assert.equal(atlas.readUInt32BE(16), 4 * 48);
assert.equal(atlas.readUInt32BE(20), 21 * 60);
const css = fs.readFileSync(path.join(__dirname,'..','assets','css','core.css'),'utf8');
assert.match(css, /\.roster-portrait\{[^}]*background-size:400% 2100%/);
const positions = new Set();
function checkPortrait(key, name) {
  const markup = portraits.avatar({ key, name });
  assert.match(markup, /roster-portrait/);
  assert.ok(markup.includes(`aria-label="Pixel-art portrait of ${name}"`));
  const position = markup.match(/background-position:([^"]+)/)[1];
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
for (const [column, promoter] of data.PROMOS.entries()) {
  assert.equal(checkPortrait('booker:' + promoter.id, promoter.voice), `${100*column/3}% 35%`);
}
assert.equal(positions.size, all.length + data.PROMOS.length);

game.fresh();
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

console.log('roster: 80 wrestlers, six agencies, four promotion ladders, AI transfers and save migration passed');
