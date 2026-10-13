import assert from 'node:assert/strict';
import fs from 'node:fs';
import {maxRuneChoices,maxRuneSelection,normalizeMaxRunes,applyRuneSynergy,runeSynergies,runeEffects,runeChoices} from '../dist/runes.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../dist/catalog.json',import.meta.url)));
for(const slot of ['Weapon','Ring','Necklace','Bracelet','Belt']){
 const item=catalog.equipment.find(i=>i.slot===slot&&i.runeSlots===3);assert(item,slot);
 const choices=maxRuneChoices(item);assert.equal(choices.length,3);assert(choices.every(r=>r.grade==='kAA'&&r.maxLevel===80));
 const all=runeChoices(item),old=all.find(r=>r.grade==='kC'&&r.type==='Attack'),stat=old.statPool[0].stat;
 const entry={runes:[{runeId:old.id,stat,level:1},null,{runeId:'foreign',stat,level:80}]},before=structuredClone(entry);
 const upgraded=normalizeMaxRunes(item,entry);assert.deepEqual(entry,before);assert.equal(upgraded[0].stat,stat);assert.equal(upgraded[0].level,80);assert.equal(upgraded[0].runeId,choices.find(r=>r.type==='Attack').id);assert.equal(upgraded[1],null);assert.equal(upgraded[2],null);
 assert.equal(maxRuneSelection(item,'Attack','invalid').stat,choices.find(r=>r.type==='Attack').statPool[0].stat);assert.equal(maxRuneSelection(item,'All',stat),null);
 for(const synergy of runeSynergies(item)){
  const runes=applyRuneSynergy(item,entry,synergy.order);assert.equal(runes.length,3);assert(runes.every(r=>r.level===80));
  assert.deepEqual(runeEffects(item,{runes},catalog).synergy,synergy.stats);
  assert.equal(runes[synergy.types.indexOf('Attack')].stat,stat);
  assert.deepEqual(normalizeMaxRunes(item,{runes}),runes);
 }
 assert.deepEqual(applyRuneSynergy(item,entry,'invalid'),upgraded);
}
assert.deepEqual(normalizeMaxRunes({slot:'Head',runeSlots:0},{runes:[]}),[]);
console.log('Fixed rune selection: all equipment slots, level 80 migration, preserved stats, empty slots, illegal choices and six synergy orders passed.');
