import assert from 'node:assert/strict';
import fs from 'node:fs';
import {itemStats,weaponRange,setStats} from '../engine.js';
import {runeChoices,runeEffects} from '../runes.js';
import {TREES,nodeRows,normalizeTree} from '../mastery-tree.js';
import {offhandChance,rapidOffhandChances,masteryEffects} from '../combat-mechanics.js';
import {DEFAULTS,IDS,PASS,deriveStats,simulate,expectedHit,models} from '../simulator.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../catalog.json',import.meta.url)));
const ref=JSON.parse(fs.readFileSync(new URL('./fixtures/tl-build-20261016.json',import.meta.url)));
const near=(a,b,msg='')=>assert(Math.abs(a-b)<1e-7,`${msg}: ${a} != ${b}`);
const base={items:{},attrs:{str:10,dex:10,Int:10,per:10,con:10},attrMode:'total',active:[],passive:[],defensive:[],specs:{},masteryTrees:{}};
let equipmentChecks=0;
for(const oracle of ref.equipment){
 const item=catalog.equipment.find(x=>x.id===oracle.id);
 for(let level=0;level<=oracle.enchantMaxLevel;level++){
  const expected={};for(const [a,b] of [['baseStats','enchantScaling'],['extraStats','extraEnchantScaling']])for(const row of [oracle[a],oracle[b]?.[level]])for(const [key,value] of Object.entries(row||{}))expected[key]=(expected[key]||0)+value;
  assert.deepEqual(itemStats(item,level,[],catalog),expected,`${item.id} +${level}`);equipmentChecks++;
 }
 for(const id of item.traits||[]){const info=ref.traits[id];if(!info)continue;const stat=info.stat.replace(/^(front|side|back)_all_/,'$1_'),plain=itemStats(item,0,[],catalog);
  for(let level=1;level<=4;level++){const s=itemStats(item,0,[{id,level}],catalog);const limit=['Epic','Epic2','Rare2','Heroic','Legendary'].includes(item.grade)?4:item.grade==='Rare'?3:item.grade==='Uncommon'?2:0;if(!limit)continue;const seed=item.traitBaseSeeds?.[id]||1;near(s[stat]-(plain[stat]||0),(info.baseBySeed?.[seed]??info.base)+(info.curve[Math.min(level,limit)-1]||0),`${item.id} ${id} ${level}`);}
 }
}
for(const [w,nodes] of Object.entries(ref.mastery))for(const source of nodes)if(source.levels?.length){const node=TREES[w].nodes.find(n=>n.id===source.id);for(let level=1;level<=source.maxLevel;level++)assert.deepEqual(Object.fromEntries(nodeRows(node,level).map(r=>[r.stat,r.value])),Object.fromEntries(source.levels[level-1].stats.map(r=>[r.stat,r.value])),`${source.id} ${level}`);}
let runeChecks=0;
for(const slot of ['Weapon','Ring','Necklace','Bracelet','Belt','Earring']){
 const item=catalog.equipment.find(x=>x.slot===slot&&x.runeSlots===3);if(!item)continue;
 for(const r of runeChoices(item))for(const {stat} of r.statPool)for(const level of [1,r.maxLevel]){
  const source=ref.runes.runes.find(x=>x.id===r.id);if(!source)continue;
  let expected=ref.runes.baseValues[source.baseValueId]?.[stat]||0;const curve=ref.runes.enchantCurves[source.enchantValueId]?.[stat]||[];expected+=curve[Math.min(level,curve.length)-1]||0;
  const f=catalog.formats[stat]||{},mul=f.mul??1,scaled=expected*mul;if(!f.suffix&&(Math.abs(scaled)>=10||Math.abs(scaled-Math.round(scaled))<=.35))expected=Math.round(scaled)/mul;
  near(runeEffects(item,{runes:[{runeId:r.id,stat,level}]},catalog).stats[stat],expected,`${r.id} ${stat} +${level}`);runeChecks++;
 }
}
near(offhandChance(28,0,30),36.4);near(offhandChance(28,0,100),56);near(offhandChance(28,2,50),45);
for(const q of [0,.2,.5,1])near(rapidOffhandChances(q,true).reduce((a,b)=>a+b,3),3+3*q+(1-q)**3);
for(const tree of Object.values(TREES)){
 const move=tree.nodes.find(n=>n.id==='Crossbow_Hero_Tactic_04');if(move){near(nodeRows(move,1)[0].value,440);near(nodeRows(move,10)[0].value,800);}
 const sanctity=tree.nodes.find(n=>n.id==='Wand_Hero_Util_02');if(sanctity){near(nodeRows(sanctity,1)[0].value,6.6);near(nodeRows(sanctity,10)[0].value,12);assert.deepEqual(nodeRows(tree.nodes.find(n=>n.id==='Wand_Hero_Tactic_04'),10),[]);}
}
const crPaid={Crossbow_Normal_Attack_01:10,Crossbow_Normal_AttackUtil_03:10,Crossbow_Normal_UtilDefense_06:10,Crossbow_Normal_Tactic_10:10,Crossbow_High_Attack_01:10,Crossbow_High_Attack_02:10,Crossbow_High_Defense_07:10,Crossbow_Rare_Attack_01:10};
for(const rank of [1,5,10]){
 const st={...base,masteryTrees:{CR:{...crPaid,Crossbow_Hero_Util_02:rank}}};assert.equal(normalizeTree(TREES.CR,st.masteryTrees.CR).Crossbow_Hero_Util_02,rank);near(masteryEffects(st).Crossbow_Hero_Util_02,.5+rank*.05);near(deriveStats(st,catalog).mana,deriveStats({...st,masteryTrees:{CR:crPaid}},catalog).mana-1000,'fixed mana penalty');
}
const specs=(id,nums)=>catalog.skills.find(s=>s.id===id).specializations.filter(s=>nums.includes(+s.id.split('_').at(-1))).map(s=>s.id);
const params={...DEFAULTS,crossMin:100,crossMax:100,offMin:100,offMax:100,wandMin:100,wandMax:100,auto:0,mana:1e6};
const once=(id,nums,p=params,priority=[id],st=base)=>simulate({catalog,state:{...st,specs:{...st.specs,[id]:specs(id,nums)}},params:p,priority,overrides:Object.fromEntries(priority.map(x=>[x,{cast:0,hitDelay:0,cooldownSec:999}]))},true);
for(const [q,hits] of [[0,4],[.5,4.625],[1,6]]){
 const result=once(IDS.rapid,[2],{...params,offhand:q*100});near(result.damage[IDS.rapid],hits*182,'three main shots and at least one offhand');
}
const ghost=once(IDS.rapid,[2],{...params,offhand:28},[IDS.ghost,IDS.rapid]);near(ghost.damage[IDS.rapid],182*(3+3*.56+.44**3));
const area=once(IDS.area,[1]);near(area.damage[IDS.area],9*(85+95));
const shot=once(IDS.shot,[2],params,[IDS.step,IDS.shot]);assert(shot.damage[IDS.shot]>0);
const tw=ref.equipment.find(x=>x.id==='wand_aa_t2_polymorph_001');assert.equal(tw.enchantMaxLevel,12);assert.deepEqual(weaponRange(tw,12),[89,165]);
const cross=catalog.equipment.find(x=>x.category==='Crossbow');
const attrs=deriveStats({...base,items:{weapon1:{id:cross.id,level:0,traits:[]}},attrs:{str:80,dex:80,Int:10,per:10,con:10}},catalog);
near(attrs.interval,Math.max(.001,(cross.baseStats.attack_speed_main_hand*.001)-.14)/(1+attrs.speed/100),'DEX interval uses exact client milliseconds');
for(const id of Object.values(IDS))if(id!==IDS.nature){const s=models(catalog,base).find(x=>x.id===id);assert(s.manaCost>=0);}
console.log(`TL Build reference audit: ${ref.equipment.length} items, ${equipmentChecks} upgrades, all available traits and ${runeChecks} rune values; mastery ranks, relative offhand, Quick Fire hit count, Ghost, Perst and exact DEX interval passed.`);
// Spiritual Wrath converts the passive into 1.4% base damage per stack,
// not its 8.2% healing coefficient. Only the weapon-scaled term grows.
const spirit={...base,passive:['WP_WA_GR_S_SupportAllyCostRegenUp'],masteryTrees:{WA_GR:{Wand_Normal_Util_04:10,Wand_Normal_Util_05:10}}};
assert(masteryEffects(spirit).Wand_Normal_Util_Skill);
const spiritual=once(IDS.rapid,[],params,[IDS.rapid],spirit);
near(spiritual.damage[IDS.rapid],182+(150*1.014+32)+(150*1.028+32),'Spiritual Wrath per-stack conversion');
const celestial={...base,passive:[PASS.duration],masteryTrees:{WA_GR:{Wand_Normal_Util_04:10,Wand_Normal_Util_05:10,Wand_Normal_UtilDefense_06:10,Wand_High_Defense_07:10,Wand_High_Defense_08:10}}};
assert(masteryEffects(celestial).Wand_High_Def_Skill);
const curse=once(IDS.touch,[],params,[IDS.touch],celestial);near(curse.damage[IDS.touch],9*78,'Celestial Call replaces the curse-duration bonus');
console.log('Transformed passives: Spiritual Wrath 1.4% per stack and Celestial Call replaces curse duration passed.');
for(const s of models(catalog,base)){
 if(s.id===IDS.nature)continue;const oracle=ref.skills.find(x=>x.id===s.id);
 assert.equal(s.manaCost,oracle.manaCost,s.id+' mana');assert.equal(s.cast,Math.max(0,oracle.castTime),s.id+' cast');
}
for(const source of ref.equipment){const item=catalog.equipment.find(x=>x.id===source.id);const mapping=ref.resonance.items[item.nativeId||item.id];if(!mapping)continue;const expected=ref.resonance.pools[mapping.pool].candidates;
 for(const effect of item.resonanceEffects)for(const row of effect.stats)near(row.value,expected.find(x=>x.stat===row.stat).value,item.id+' resonance '+row.stat);
}
console.log('All active-skill mana/cast records and matched resonance pools agree with the captured client tables.');

for(const rule of ref.setRules){
 const items=catalog.equipment.filter(x=>x.setName?.replace(/^Комплект /,'')===rule.setName).slice(0,rule.pieces);if(items.length<rule.pieces)continue;
 const state={...base,items:Object.fromEntries(items.map((x,i)=>['set'+i,{id:x.id,level:0,traits:[]}]))},stats=setStats(state,catalog);
 for(const [rawKey,value] of Object.entries(rule.stats)){const key=rawKey==='weaken_given_duration_modifier'?'debuff_given_duration_modifier':rawKey;near(stats[key],value,rule.setName+' '+rule.pieces+' '+key);}
}
console.log('35 source set rules checked at their real equipment thresholds.');
let rutlUpgrades=0;
for(const source of ref.rutlOnlyEquipment){const item=catalog.equipment.find(x=>x.id===source.id);for(let level=0;level<=source.enchantMaxLevel;level++){
 const expected={};for(const [base,scale] of [['baseStats','enchantScaling'],['extraStats','extraEnchantScaling']])for(const row of [source[base],source[scale]?.[level]])for(const [key,value] of Object.entries(row||{}))expected[key]=(expected[key]||0)+value;
 assert.deepEqual(itemStats(item,level,[],catalog),expected,source.id+' RUTL +'+level);rutlUpgrades++;
}}
console.log(`RUTL-only coverage: ${ref.rutlOnlyEquipment.length} further items / ${rutlUpgrades} upgrades; all ${catalog.equipment.length} catalog entries have a reference.`);
function expandAll(input){const out={...input};for(const stat of ['accuracy','evasion','armor','critical_attack','double_attack','critical_defense','double_defense']){const key='all_'+stat;if(key in out){for(const type of ['melee','range','magic'])out[type+'_'+stat]=(out[type+'_'+stat]||0)+out[key];delete out[key];}}return Object.fromEntries(Object.entries(out).filter(([,v])=>v));}
for(const [upper,levels] of Object.entries(ref.attributeOracle))for(const [level,byWeapon] of Object.entries(levels))for(const [weapon,oracle] of Object.entries(byWeapon)){
 const rows=catalog.attributeStats[upper.toLowerCase()][level],out={};for(const [key,value] of Object.entries(rows))out[key]=typeof value==='number'?value:value[weapon.toLowerCase()]||0;
 for(const m of catalog.attributes.milestones)if(m.attribute===upper&&Number(level)>=m.count)for(const b of m.bonuses)out[b.stat]=(out[b.stat]||0)+b.value;
 const expected=expandAll(oracle);
 // TL Build's detector skips a newly appearing stat when the previous row omits zero.
 // CON 50 already includes 1000 in each typed field; the additional all_* 1000 duplicates it.
 if(upper==='CON'&&Number(level)>=50)for(const type of ['melee','range','magic'])expected[type+'_double_defense']-=1000;
 assert.deepEqual(expandAll(out),expandAll(expected),`${upper} ${level} ${weapon}: no duplicated milestones`);
}
console.log('1,000 independent TL Build attribute/weapon outputs: levels 1–100, every milestone and both damage tables agree after the documented CON 50 double-count correction.');
