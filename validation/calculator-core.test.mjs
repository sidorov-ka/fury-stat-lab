import test from "node:test";
import assert from "node:assert/strict";
import { sumDamage, sensitivity, summarizeMark, applyWeakenCdr } from "./calculator-core.mjs";

test("damage breakdown sums separately without double-counting", () => {
  assert.deepEqual(sumDamage([{source:"curse",damage:40},{source:"curse",damage:10},{source:"crossbow",damage:5}]), {
    total:55, bySource:{curse:50,crossbow:5}
  });
});
test("invalid damage is rejected", () => {
  assert.throws(() => sumDamage([{source:"curse",damage:-10}]), RangeError);
});
test("sensitivity changes exactly one attribute and does not mutate the original", () => {
  const stats={magicHeavy:100,rangedHeavy:20};
  const result=sensitivity({stats,stat:"magicHeavy",delta:10,evaluate:s=>2*s.magicHeavy+s.rangedHeavy});
  assert.equal(result.baseline,220);
  assert.equal(result.modified,240);
  assert.equal(result.gainPercent,(240/220-1)*100);
  assert.deepEqual(stats,{magicHeavy:100,rangedHeavy:20});
});
test("mark records only eligible events and never includes explosion recursively", () => {
  const events=[{source:"curse",damage:30,markEligible:true},{source:"crossbow",damage:10,markEligible:false}];
  assert.deepEqual(summarizeMark({events,qualifies:x=>x.markEligible,explosion:15}),{recorded:30,explosion:15,combined:45});
});
test("experimental weaken cdr distinguishes first and later stacks and clamps", () => {
  assert.equal(applyWeakenCdr({remaining:3,stacksAfter:1}),2.64);
  assert.equal(Number(applyWeakenCdr({remaining:3,stacksAfter:2}).toFixed(3)),2.928);
  assert.equal(applyWeakenCdr({remaining:0.1,stacksAfter:1}),0);
  assert.equal(applyWeakenCdr({remaining:3,stacksAfter:1,eligible:false}),3);
});
