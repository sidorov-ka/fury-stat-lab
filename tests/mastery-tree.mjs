import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TREES,summary,changeNode,normalizeTree,treeStats,treeWarnings} from '../dist/mastery-tree.js';
import {deriveStats,expectedHit,DEFAULTS} from '../dist/simulator.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../dist/catalog.json',import.meta.url)));
const t=TREES.CR;let s={};
const add=(id,count)=>{for(let i=0;i<count;i++){const r=changeNode(t,s,id,1);assert.equal(r.error,'');s=r.selected;}};
assert.equal(TREES.CR.nodes.length,52);assert.equal(TREES.WA_GR.nodes.length,52);
assert(changeNode(t,s,'Crossbow_High_Attack_01',1).error);
add('Crossbow_Normal_Attack_01',10);assert(changeNode(t,s,'Crossbow_Normal_Attack_01',1).error);
add('Crossbow_Normal_Attack_02',9);assert(!s.Crossbow_Normal_Attack_Skill);
add('Crossbow_Normal_Attack_02',1);assert.equal(s.Crossbow_Normal_Attack_Skill,1);assert.equal(summary(t,s).total,20);
assert(!changeNode(t,s,'Crossbow_Normal_Attack_02',-1).selected.Crossbow_Normal_Attack_Skill);
add('Crossbow_Normal_AttackUtil_03',10);
assert.equal(summary(t,s).total,30);
assert.equal(s.Crossbow_Normal_Attack_Skill,1);assert.equal(summary(t,s).total,30);
const clicked=changeNode(t,s,'Crossbow_Normal_Attack_Skill',-1);assert.deepEqual(clicked.selected,s);
const stripped=Object.fromEntries(Object.entries(s).filter(([id])=>!id.endsWith('_Skill')));assert.deepEqual(normalizeTree(t,stripped),s);
assert.equal(normalizeTree(t,{Crossbow_Normal_Attack_Skill:1}).Crossbow_Normal_Attack_Skill,undefined);
add('Crossbow_High_Attack_01',10);add('Crossbow_High_Attack_02',10);
const state={items:{},attrs:{str:10,dex:10,Int:10,per:10,con:10},attrMode:'base',active:[],passive:[],defensive:[],specs:{},masteryTrees:{CR:s,WA_GR:{}}};
const base=deriveStats({...state,masteryTrees:{}},catalog),p=deriveStats(state,catalog);
assert.equal(p.speed,base.speed+2.1);assert.equal(p.critR,base.critR+88);assert.equal(p.rangeDamage,3);
assert(treeWarnings(state).length);assert.equal(treeStats(state).melee_armor,-48);
const saved=JSON.parse(JSON.stringify(s));assert.deepEqual(normalizeTree(t,saved),s);
const removed=changeNode(t,s,'Crossbow_Normal_Attack_01',-1).selected;assert(!removed.Crossbow_High_Attack_01);assert(!removed.Crossbow_High_Attack_02);
assert.deepEqual(normalizeTree(t,{fake:10,Crossbow_Normal_Attack_01:200}),{Crossbow_Normal_Attack_01:10});
const hit={...DEFAULTS,crossMin:100,crossMax:100,wandMin:100,wandMax:100,rangeDamage:3};assert.equal(expectedHit(hit,'Crossbow',1,0),103);assert.equal(expectedHit(hit,'Wand',1,0),100);
assert.equal(treeStats({...state,masteryTrees:{CR:{},WA_GR:{}}}).range_critical_attack,undefined);
let capped={};for(const n of t.nodes.filter(n=>n.grade!=='epic'&&n.type!=='synergy'))for(let i=0;i<10;i++){const r=changeNode(t,capped,n.id,1);if(!r.error)capped=r.selected;}
assert.equal(summary(t,capped).total,200);
const room=t.nodes.find(n=>n.type!=='synergy'&&n.grade==='common'&&(capped[n.id]||0)<10)||t.nodes.find(n=>n.type!=='synergy'&&n.grade==='uncommon'&&(capped[n.id]||0)<10);
assert(changeNode(t,capped,room.id,1).error);
for(const tree of Object.values(TREES))for(const l of tree.links){assert(tree.nodes.some(n=>n.id===l.from));assert(tree.nodes.some(n=>n.id===l.to));assert(l.points.length>=2);}
console.log('Mastery trees: source geometry, level caps, ring locks, cascading removal, source-unit conversion, negative stats and persistence passed.');

// A third eligible sector must not evict the previously unlocked pair.
let stable=normalizeTree(t,{Crossbow_Normal_Attack_01:10,Crossbow_Normal_AttackUtil_03:10,Crossbow_Normal_UtilDefense_06:10,Crossbow_Normal_Tactic_10:10,Crossbow_High_Attack_01:10,Crossbow_High_Attack_02:10,Crossbow_High_Defense_07:10,Crossbow_Rare_Attack_01:10});
stable=changeNode(t,stable,'Crossbow_Hero_Util_02',1).selected;
assert.equal(stable.Crossbow_Hero_Util_02,1);
const retained=Object.fromEntries(Object.entries(stable));
for(let i=0;i<10;i++){
 const next=changeNode(t,stable,'Crossbow_Normal_TacticAttack_12',1);assert.equal(next.error,'');stable=next.selected;
 assert.equal(stable.Crossbow_Normal_Util_Skill,1,'third sector must not replace an eligible unlocked key');
 assert.equal(stable.Crossbow_Normal_Attack_Skill,1);
 assert.equal(stable.Crossbow_Hero_Util_02,1,'dependent epic stays selected');
 for(const [id,level] of Object.entries(retained))assert.equal(stable[id],level,'adding points cannot remove '+id);
 assert.deepEqual(normalizeTree(t,stable),stable,'repeated redraw is stable');
 assert.deepEqual(normalizeTree(t,JSON.parse(JSON.stringify(stable))),stable,'reload preserves eligible key choices');
}
assert.equal(stable.Crossbow_Normal_Tac_Skill,undefined,'still only two keys on the ring');
const switched=changeNode(t,stable,'Crossbow_Normal_UtilDefense_06',-1).selected;
assert.equal(switched.Crossbow_Normal_Util_Skill,undefined,'real loss of eligibility disables the key');
assert.equal(switched.Crossbow_Normal_Tac_Skill,1,'free slot enables the eligible replacement');
assert.equal(switched.Crossbow_Hero_Util_02,undefined,'dependent epic is removed when its condition truly fails');
console.log('Automatic mastery keys: monotone additions, retained epic dependency, repeated redraw, persistence and genuine threshold loss passed.');
