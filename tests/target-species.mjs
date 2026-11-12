import assert from 'node:assert/strict';import fs from 'node:fs';
import {deriveStats,simulationParams} from '../simulator.js';
const c=JSON.parse(fs.readFileSync(new URL('../catalog.json',import.meta.url)));
c.attributes.baseCharacter.stats.demon_damage_amplification=350;c.attributes.baseCharacter.stats.bonus_demon_attack_power=20;
const state={items:{},attrs:{str:10,dex:10,Int:10,per:10,con:10},active:[],passive:[],defensive:[],specs:{},masteryTrees:{}};
const base=simulationParams(state,c),demon=simulationParams(state,c,{targetSpecies:'demon'}),undead=simulationParams(state,c,{targetSpecies:'undead'});
assert.equal(demon.species-base.species,35);assert.equal(demon.bonus-base.bonus,20);assert.equal(undead.species,base.species);assert.equal(undead.bonus,base.bonus);assert.equal(deriveStats(state,c,'invalid').species,base.species);
console.log('Monster species bonus and accuracy of fallback passed.');
