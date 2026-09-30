import test from "node:test";
import assert from "node:assert/strict";
import {skillDamageMultiplier,simulateFiveMinutes} from "../src/simulator.js";

test("skill damage multiplier is neutral at equal boost/resistance",()=>{
  assert.equal(skillDamageMultiplier(100,100),1);
});

test("five minute result returns finite non-negative DPS",()=>{
  const result=simulateFiveMinutes({minDamage:100,maxDamage:200,attackSpeed:0,critChance:0,critDamage:50,heavyChance:0,skillBoost:0,skillResist:0});
  assert.ok(Number.isFinite(result.dps));
  assert.ok(result.dps>=0);
  assert.equal(result.duration,300);
});
