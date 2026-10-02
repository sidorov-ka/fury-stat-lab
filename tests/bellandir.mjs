import assert from 'node:assert/strict';
import fs from 'node:fs';
import {itemStats, weaponRange} from '../engine.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../catalog.json',import.meta.url)));
const item=catalog.equipment.find(x=>x.id==='crossbow_aa_t2_polymorph_001');
assert.equal(item.enchantMaxLevel,12);
assert.deepEqual(weaponRange(item,9),[28,115]);
assert.deepEqual(weaponRange(item,12),[31,127]);
for(const level of [10,11,12]){
 const stats=itemStats(item,level,[],catalog);
 const prev=itemStats(item,level-1,[],catalog);
 for(const key of ['attack_power_main_hand','bonus_attack_power_main_hand','attack_power_off_hand','bonus_attack_power_off_hand','stamina_regen','damage_reduction_penetration'])assert.ok(stats[key]>prev[key],`${key} at +${level}`);
}
const stats=itemStats(item,12,[],catalog);
assert.equal(stats.dex,11);
assert.equal(stats.stamina_regen,8600);
assert.equal(stats.damage_reduction_penetration,22);
assert.equal(1+stats.bonus_attack_power_off_hand,44);
assert.equal(stats.bonus_attack_power_off_hand+stats.attack_power_off_hand,166);
for(const file of ['catalog.json','equipment.json'])assert.deepEqual(fs.readFileSync(new URL('../'+file,import.meta.url)),fs.readFileSync(new URL('../dist/'+file,import.meta.url)));
