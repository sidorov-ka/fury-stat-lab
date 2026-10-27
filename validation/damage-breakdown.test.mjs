import test from "node:test";
import assert from "node:assert/strict";
import {damageBreakdown} from "./damage-breakdown.mjs";
const events=[
 {source:"Касание скорби",damage:400,attackType:"magic",mechanism:"dot",dotType:"curse",modifiersApplied:["dotDamage"]},
 {source:"Огненный эффект",damage:200,attackType:"magic",mechanism:"dot",dotType:"burning"},
 {source:"Автоатака арбалета",damage:100,attackType:"ranged",mechanism:"auto_attack"},
 {source:"Скоростная стрельба",damage:100,attackType:"ranged",mechanism:"skill_direct",tags:["offhand"]},
 {source:"Метка смерти",damage:120,attackType:"unverified",mechanism:"explosion",modifiersApplied:["skillDamageBoost"]},
 {source:"Беландир",damage:80,attackType:"unverified",mechanism:"weapon_proc"},
 {source:"Метка смерти",damage:800,attackType:"unverified",mechanism:"explosion",isBookkeeping:true}
];
test("one total by all three dimensions, including unverified",()=>{
 const r=damageBreakdown(events,10);
 assert.equal(r.totalDamage,1000);assert.equal(r.totalDps,100);
 assert.equal(r.byAttackType.find(x=>x.key==="magic").damage,600);
 assert.equal(r.byAttackType.find(x=>x.key==="ranged").damage,200);
 assert.equal(r.byAttackType.find(x=>x.key==="unverified").damage,200);
 for(const dimension of [r.byAttackType,r.byMechanism,r.bySource])
   assert.ok(Math.abs(dimension.reduce((acc,x)=>acc+x.damage,0)-r.totalDamage)<1e-10);
 assert.equal(r.byDotType.find(x=>x.key==="curse").damage,400);
 assert.equal(r.bySource.find(x=>x.source==="Метка смерти").damage,120);
});
test("no invented Melee, crit or skill damage categories",()=>{
 const r=damageBreakdown(events,10);
 assert.equal(r.byAttackType.find(x=>x.key==="melee").damage,0);
 assert.equal(r.byAttackType.length,4);
});
test("empty input safe",()=>{const r=damageBreakdown([],10);assert.equal(r.totalDps,0);assert.ok(r.byAttackType.every(x=>x.sharePercent===0));});
test("unknown classification fails, not silently assigned",()=>{
 assert.throws(()=>damageBreakdown([{source:"x",damage:1,attackType:"spell",mechanism:"skill_direct"}],10),TypeError);
 assert.throws(()=>damageBreakdown([{source:"x",damage:1,attackType:"magic",mechanism:"dot"}],10),TypeError);
 assert.throws(()=>damageBreakdown([],0),RangeError);
});
test("DoT cannot be added to direct attack",()=>{
 assert.throws(()=>damageBreakdown([{source:"x",damage:1,attackType:"magic",mechanism:"skill_direct",dotType:"curse"}],5),TypeError);
});
