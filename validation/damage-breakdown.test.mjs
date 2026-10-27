import test from "node:test";
import assert from "node:assert/strict";
import {damageBreakdown} from "./damage-breakdown.mjs";
test("category contributions total 100% and aggregate each event exactly once",()=>{
  const result=damageBreakdown([
    {source:"Касание скорби",damageType:"magic_dot",damage:600},
    {source:"Касание скорби",damageType:"magic_direct",damage:100},
    {source:"Скоростная стрельба",damageType:"ranged",damage:100},
    {source:"Беландир",damageType:"weapon_proc",damage:100},
    {source:"Метка смерти",damageType:"mark_explosion",damage:100},
    {source:"Метка смерти",damageType:"mark_explosion",damage:1000,isBookkeeping:true}
  ],10);
  assert.equal(result.totalDamage,1000);
  assert.equal(result.totalDps,100);
  assert.equal(result.byType.reduce((s,x)=>s+x.sharePercent,0),100);
  assert.equal(result.bySource.find(x=>x.source==="Касание скорби").damage,700);
});
test("zero damage handled without NaN",()=>{
  const result=damageBreakdown([],10);
  assert.equal(result.totalDps,0);
  assert.ok(result.byType.every(x=>x.sharePercent===0));
});
test("unknown categories and invalid duration rejected",()=>{
  assert.throws(()=>damageBreakdown([{source:"x",damageType:"mystery",damage:1}],10),TypeError);
  assert.throws(()=>damageBreakdown([],0),RangeError);
});
