import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DEFAULTS,PASS,IDS,simulate,deriveStats,characterStats,combatHealing,intervalWithSpeedBonus,rapidCriticalCooldownReduction,coverage,expectedHit} from '../dist/simulator.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../dist/catalog.json',import.meta.url)));
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const state={items:{},attrs:{str:10,dex:10,Int:10,per:10,con:10},attrMode:'base',masteryTrees:{},active:[],passive:[],passiveLevels:{},defensive:[],specs:{}};
const bronze={...state,passive:[PASS.bonus],passiveLevels:{[PASS.bonus]:4}};
near((characterStats(bronze,catalog).stamina_regen-characterStats(state,catalog).stamina_regen)*catalog.formats.stamina_regen.mul,5.6);
const daylight={...state,passive:[PASS.night],passiveLevels:{[PASS.night]:4}};
near(combatHealing(daylight,catalog,{healing:10,mana:10000,night:0}),44);
near(combatHealing(daylight,catalog,{healing:10,mana:10000,night:1}),10);
const params={...DEFAULTS,wandMin:100,wandMax:100,crossMin:100,crossMax:100,mana:1e6,auto:0,regen:0};
const beamInput={catalog,state:daylight,params,priority:[IDS.laser],overrides:{[IDS.laser]:{cast:0,hitDelay:0,cooldownSec:1e9}}};
const day=simulate(beamInput),night=simulate({...beamInput,params:{...params,night:1}});
near(day.damage[IDS.laser]/night.damage[IDS.laser],1.17);near(day.healing,34);
// Applying +20% speed must preserve the dexterity-adjusted numerator.
near(intervalWithSpeedBonus({...params,interval:.4,speed:25},20),.5/1.45);
// 1000 crit in each hand, guaranteed off-hand = one expected critical per bolt.
near(rapidCriticalCooldownReduction({...params,critR:1000},1),1);
near(rapidCriticalCooldownReduction({...params,critR:1000},0),.5);
assert(rapidCriticalCooldownReduction({...params,critR:1000},1,90)>1);
// Beam hits cannot keep a single 9-second curse alive via the incompatible passive.
const curseState={...state,passive:[PASS.thirst],active:[IDS.touch,IDS.laser]};
const curse=simulate({catalog,state:curseState,params,priority:curseState.active,overrides:{[IDS.touch]:{cast:0,hitDelay:0,cooldownSec:1e9},[IDS.laser]:{cast:0,hitDelay:0,cooldownSec:4}}},true);
assert.equal(curse.damageEvents.filter(e=>e.id===IDS.touch).length,9);
// Other weaken skills must not shorten Beam through the incompatible passive.
const weakening={...state,active:[IDS.area,IDS.laser]};
const run=s=>simulate({catalog,state:s,params,priority:s.active,overrides:{[IDS.area]:{cast:0,hitDelay:0,cooldownSec:1},[IDS.laser]:{cast:0,hitDelay:0,cooldownSec:10}}},true);
assert.deepEqual(run(weakening).logs.filter(e=>e.id===IDS.laser).map(e=>e.time),run({...weakening,passive:[PASS.thirst]}).logs.filter(e=>e.id===IDS.laser).map(e=>e.time));
// No weapon: flat bonus damage may not manufacture auto-attacks.
assert.equal(simulate({catalog,state,params:{...DEFAULTS,bonus:100},priority:[]}).total,0);
const bella={...state,items:{weapon1:{id:'crossbow_aa_t2_polymorph_001',level:12,traits:[]}}};
assert(coverage(bella,catalog).some(w=>w.includes('яд Бел’Адир')));
assert(coverage({...bella,items:{weapon1:{...bella.items.weapon1,level:10}}},catalog).some(w=>w.includes('сверены с TL Build')));
// Independent reference: cooldown, defence, crit and bonus-damage ordering.
near(expectedHit({...params,crossMin:100,crossMax:200,critR:1000,critDamage:20,defense:2500,bonus:25},'Crossbow',2,50),((350+450*1.2)/2)/2+25);
console.log('Math review: passive stamina, day healing, attack speed, offhand critical cooldowns, beam incompatibility, absent weapon, coverage and independent hit arithmetic passed.');

// Generic stat bonuses must be expanded into each type, as in the game sheet.
const aggregateItem={id:'audit-aggregate',slot:'Ring',grade:'Epic',baseStats:{},extraStats:{all_accuracy:200,all_evasion:300,all_armor:20,all_critical_defense:400,all_double_defense:500,all_state_accuracy:4000,all_state_tolerance:2000,all_species_damage_amplification:100},traits:[]};
const aggregateCatalog={...catalog,equipment:[...catalog.equipment,aggregateItem]};
const aggregated={...state,items:{ring1:{id:aggregateItem.id,level:0,traits:[]}}};
const baseSheet=characterStats(state,catalog),combined=characterStats(aggregated,aggregateCatalog);
for(const type of ['melee','range','magic']){near(combined[type+'_accuracy']-baseSheet[type+'_accuracy'],200);near(combined[type+'_evasion']-baseSheet[type+'_evasion'],300);near(combined[type+'_armor']-baseSheet[type+'_armor'],20);}
near(combined.weaken_accuracy-baseSheet.weaken_accuracy,4000);
near(combined.collide_resistance-baseSheet.collide_resistance,2000);
assert(!Object.hasOwn(combined,'all_accuracy'));near(deriveStats(aggregated,aggregateCatalog).species,10);

assert.equal(simulate({catalog,state,params:{...DEFAULTS,bonus:100,mana:100000},priority:[IDS.rapid,IDS.touch,IDS.burst,IDS.laser]}).total,0,'missing weapons must not produce damage from skill flat components');
