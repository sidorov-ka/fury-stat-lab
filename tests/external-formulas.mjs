import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DEFAULTS,expectedHit} from '../dist/simulator.js';
// Actual JSON responses from https://wtfomg.eu/calculate, 2026-09-29.
// Synthetic public test values, not a user's profile. No network in tests.
const rows=JSON.parse(fs.readFileSync(new URL('./fixtures/wtfomg-2026-09-29.json',import.meta.url)));
for(const {name,input,result} of rows){
 const {attacker:a,defender:d,skill:s}=input;
 const p={...DEFAULTS,crossMin:a.atk_min,crossMax:a.atk_max,boost:a.skill_dmg_boost,bonus:a.bonus_dmg,heavyR:a.heavy_attack,critR:a.critical_hit,critDamage:a.critical_dmg,defense:d.defense,resistance:d.skill_dmg_reduction};
 const ours=expectedHit(p,'Crossbow',s.base_dmg/100,s.add_dmg,{skillMultiplier:s.charging_mult*s.pve_mult*s.special_mult});
 assert(Math.abs(ours-result.avg_dmg)<1,`${name}: ${ours} vs external ${result.avg_dmg}`);
 console.log(`${name}: Fury ${ours.toFixed(6)} / WTFOMG ${result.avg_dmg}`);
}
const p={...DEFAULTS,crossMin:100,crossMax:100,boost:700,resistance:400,resistanceModel:'difference'};
assert.equal(expectedHit(p,'Crossbow',1,0),100*(1+300/1300));
assert.equal(expectedHit({...p,boost:200},'Crossbow',1,0),100*(1-200/1200));
assert.equal(expectedHit({...p,boost:0,resistance:0},'Crossbow',1,0,{resistanceDrop:220}),100*(1+220/1220));
assert.equal(expectedHit({...p,resistanceModel:'rutl',boost:0,resistance:0},'Crossbow',1,0,{resistanceDrop:220}),100);
const dot={...DEFAULTS,wandMin:100,wandMax:200,critM:1000,critDamage:20,bonus:25,dotCrit:1};
assert.equal(expectedHit(dot,'Wand',1,0,{dot:true}),165,'DoT critical keeps average base and excludes bonus damage');
console.log('External comparison and explicit alternative model: passed');
