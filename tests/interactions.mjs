import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DEFAULTS,SCREENSHOT,IDS,PASS,simulate,optimize,expectedHit,referenceConfigurations} from '../dist/simulator.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../dist/catalog.json',import.meta.url)));
const state={items:{},attrs:{str:10,dex:10,Int:10,per:10,con:10},active:[],passive:[],defensive:[],specs:{}};
const params={...DEFAULTS,crossMin:100,crossMax:100,wandMin:100,wandMax:100,auto:0,mana:1e6,regen:0};
const spec=(id,ns)=>catalog.skills.find(s=>s.id===id).specializations.filter(t=>ns.includes(Number(t.id.split('_').at(-1)))).map(t=>t.id);
// Hand-calculated multiplier order: 175 expected weapon damage, 1.5 heavy,
// 1.5 skill boost, 2 skill modifier, half from defense, then +25 flat damage.
assert.equal(expectedHit({...params,crossMax:200,critR:1000,heavyR:1000,boost:1000,defense:2500,bonus:25},'Crossbow',1,0,{skillMultiplier:2}),418.75);
assert.equal(expectedHit({...params,bonus:25},'Crossbow',1,0,{skillMultiplier:2}),225);
const beam=(ns=[])=>simulate({catalog,state:{...state,specs:{[IDS.laser]:spec(IDS.laser,ns)}},params,priority:[IDS.laser,IDS.weak],overrides:{[IDS.laser]:{cooldownSec:999},[IDS.weak]:{cooldownSec:999}}},true);
const regular=beam(),concentrated=beam([4]);
const ticks=r=>r.damageEvents.filter(e=>e.id===IDS.laser);
assert.equal(ticks(regular).length,12);assert.equal(ticks(concentrated).length,6);
assert.equal(ticks(regular)[0].time,1.9,'impact delay is applied exactly once');
assert.equal(ticks(regular).at(-1).time,7.4);
assert.equal(ticks(concentrated).at(-1).time,4.4);
assert.equal(regular.logs[0].duration,1.7);assert.equal(concentrated.logs[0].duration,1.7);
assert.equal(regular.logs[1].time,1.7,'other skills work during the beam');
assert(Math.abs(regular.damage[IDS.laser]-concentrated.damage[IDS.laser])<1e-8);
// Same priority and cast times: a real buff must affect future damage only.
const buffInput={catalog,state:{...state,specs:{[IDS.light]:spec(IDS.light,[1])}},params,priority:[IDS.laser,IDS.light,IDS.rapid],overrides:{[IDS.laser]:{cooldownSec:999},[IDS.light]:{cooldownSec:999,hitDelay:.7},[IDS.rapid]:{cooldownSec:3}}};
const buffed=simulate(buffInput,true),neutral=simulate({...buffInput,params:{...params,lightMaxBonus:0}},true);
assert.deepEqual(buffed.logs,neutral.logs,'effect comparison keeps casts and costs');
const event=buffed.effectEvents[0];let before=0,during=0,after=0;
for(let i=0;i<buffed.damageEvents.length;i++){
 const a=buffed.damageEvents[i],b=neutral.damageEvents[i];assert.equal(a.time,b.time);assert.equal(a.id,b.id);
 if(a.time<event.time){assert.equal(a.value,b.value);before++;}
 else if(a.time>event.time&&a.time<event.end){assert(a.value>b.value);during++;}
 else if(a.time>=event.end){assert.equal(a.value,b.value);after++;}
}
assert(before&&during&&after,'test covers all three periods');
const overlapInput={catalog,state:{...state,specs:{[IDS.light]:spec(IDS.light,[1]),[IDS.decay]:spec(IDS.decay,[1])}},params,priority:[IDS.light,IDS.decay,IDS.laser],overrides:Object.fromEntries([IDS.light,IDS.decay,IDS.laser].map(id=>[id,{cooldownSec:999}]))};
const overlap=simulate(overlapInput,true);
const overlapHit=overlap.damageEvents.find(e=>e.id===IDS.laser);
assert(overlap.effectEvents.every(e=>e.time<=overlapHit.time&&e.end>overlapHit.time));
assert.equal(overlapHit.value,expectedHit(params,'Wand',.82,20,{maxBonus:50,boostBonus:80,skillMultiplier:1.3}),'both buffs affect the same hit through their own formula, without an invented joint multiplier');
// Independent analytical check of Touch + Circle + extension + explosion.
const priority=[IDS.touch,IDS.area,IDS.spread,IDS.burst];
const overrides=Object.fromEntries(priority.map(id=>[id,{cooldownSec:999,cast:0,hitDelay:0}]));
const combo=preserve=>simulate({catalog,state:{...state,specs:{[IDS.spread]:spec(IDS.spread,[1]),[IDS.burst]:spec(IDS.burst,preserve?[1]:[])}},params,priority,overrides,burstStacks:1},true);
const consumed=combo(false),preserved=combo(true);
assert(Math.abs(consumed.damage['curse-explosion']-(78+138)*14*1.05)<1e-8);
assert(Math.abs(preserved.damage['curse-explosion']-(78+138)*14*1.05*.5)<1e-8);
assert.equal(consumed.damage[IDS.touch]||0,0);assert.equal(consumed.damage[IDS.area]||0,0);
assert.equal(preserved.damage[IDS.touch],78*14);assert.equal(preserved.damage[IDS.area],138*14);
// Measured stats from earlier screenshots; this is NOT the user's full build.
const reference=referenceConfigurations(catalog).find(r=>r.burstStacks===3&&r.specs[IDS.burst].includes(spec(IDS.burst,[1])[0]));
const input={catalog,state:{...state,active:reference.priority,specs:reference.specs,passive:[PASS.thirst,PASS.duration,PASS.night]},params:{...DEFAULTS,...SCREENSHOT,night:1},mode:'all',budget:20};
const result=optimize(input);
assert(result.dps>=result.baseline,'the optimizer may not lose a valid input build');
for(const row of result.referenceTrials){
 const replay=simulate({...input,state:{...input.state,active:row.priority,specs:row.specs},priority:row.priority,burstStacks:row.burstStacks});
 assert.equal(row.dps,replay.dps);assert(result.dps>=row.dps,'all control panels are retained if better');
}
assert.equal(result.dps,simulate({...input,state:{...input.state,active:result.priority,specs:result.specs},priority:result.priority,burstStacks:result.burstStacks}).dps);
assert(result.specPoints<=100);
console.log(JSON.stringify({checks:'interaction audit passed',baseline:result.baseline,best:result.dps,controls:result.referenceTrials.map(r=>({name:r.name,dps:r.dps})),buffs:result.interaction},null,2));
