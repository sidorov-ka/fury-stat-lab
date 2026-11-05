import assert from 'node:assert/strict';
import fs from 'node:fs';
import {setStats,totalAttributes,gearStats} from '../engine.js';
import {deriveStats} from '../simulator.js';
const c=JSON.parse(fs.readFileSync(new URL('../catalog.json',import.meta.url)));
const base={items:{},attrs:{str:10,dex:10,Int:10,per:10,con:10},active:[],passive:[],defensive:[],specs:{},masteryTrees:{}};
const checks=[['Символы нерушимого оберега',{con:2,all_double_defense:600,hp_max:1000}],['Украшения великого стрелка',{dex:2,base_damage:5,hp_max:600}],['Атрибуты мудрого мага',{int:2,skill_power_amplification:450,hp_max:800}],['Ключи к могуществу',{str:2,critical_damage_dealt_modifier:400,hp_max:800}]];
for(const [name,want] of checks){const items=c.equipment.filter(i=>i.setName===name).slice(0,4);assert.equal(items.length,4);const entries=Object.fromEntries(items.map((i,n)=>['piece'+n,{id:i.id,level:0,traits:[]}]));const state={...base,items:entries};assert.deepEqual(setStats(state,c),want,name);const three={...state,items:{...entries}};delete three.items.piece3;assert.deepEqual(setStats(three,c),{},name+' threshold');assert.equal((gearStats(state,c).hp_max||0)-(gearStats({...state,excludeSetBonuses:true},c).hp_max||0),want.hp_max,name+' HP');if(name==='Атрибуты мудрого мага'){assert.equal(totalAttributes(state,c).Int-totalAttributes({...state,excludeSetBonuses:true},c).Int,2,'Wisdom adds to existing item Wisdom');assert.equal(deriveStats(state,c).boost-deriveStats({...state,excludeSetBonuses:true},c).boost,45,'skill damage boost');}}
const doubled=structuredClone(c);const item=doubled.equipment.find(i=>i.id==='ear_aa_t2_upgrade_003');item.extraStats.Int=7;item.extraStats.int=3;const attr=totalAttributes({...base,items:{earring:{id:item.id,level:0,traits:[]}}},doubled);assert.equal(attr.Int,20,'both catalog spellings must contribute');
console.log('Four accessory sets: thresholds, source values, Wisdom merging and derived attributes passed.');
const afterlifePieces=c.equipment.filter(i=>i.setName==='Комплект Бдение стража Посмертия').slice(0,2);
assert.equal(afterlifePieces.length,2);
const afterlife={...base,items:Object.fromEntries(afterlifePieces.map((i,n)=>['a'+n,{id:i.id,level:0,traits:[]}]))};
assert.equal(setStats(afterlife,c).critical_damage_dealt_modifier,1500);
