import assert from 'node:assert/strict';
import fs from 'node:fs';
import {optimize,simulate,DEFAULTS,IDS} from '../dist/simulator.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../dist/catalog.json',import.meta.url)));
const state={items:{},attrs:{str:10,dex:10,Int:10,per:10,con:10},active:[IDS.rapid,IDS.weak],passive:[],defensive:[],specs:{}};
// An intentionally exaggerated buff isolates search coverage, not game balance.
const input={catalog,state,params:{...DEFAULTS,crossMin:100,crossMax:100,wandMin:100,wandMax:100,mana:1000000,lightMaxBonus:10000},mode:'all',budget:20};
const result=optimize(input);
assert(result.priority.includes(IDS.light),'search must discover an indirect damage buff absent from the original panel');
assert(result.specs[IDS.light].some(x=>x.endsWith('_1')));
const replay={...input,state:{...state,active:result.priority,specs:result.specs},priority:result.priority,burstStacks:result.burstStacks};
assert.equal(simulate(replay).dps,result.dps);
assert(result.dps>simulate({...replay,priority:result.priority.filter(x=>x!==IDS.light)}).dps);
assert(result.specPoints<=100);
assert(result.curseSearch.tested>=36,'curse packages must be tested even if original panel has no curses');
assert(result.dps>=result.curseSearch.bestDps,'search must retain any better curse-package result');
console.log('Buff search: discovers absent buff with required specialization, improves whole-fight DPS, replays exactly.');
