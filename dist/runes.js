import {RUNE_DATA as data} from './rune-data.js?v=t2-chance-20261013';
const grades=['kC','kB','kA','kAA'];
export const runeSlots=item=>Math.min(3,Math.max(0,Number(item?.runeSlots)||0));
export const runeChoices=item=>data.runes.filter(r=>r.slot===item.slot&&r.type!=='All');
export function runeEffects(item,entry,catalog){
 const stats={},add=(k,v)=>stats[k]=(stats[k]||0)+v;
 const selected=Array.from({length:runeSlots(item)},(_,i)=>{
  const s=entry?.runes?.[i],r=runeChoices(item).find(r=>r.id===s?.runeId);
  if(!r||!r.statPool.some(p=>p.stat===s.stat))return null;
  const level=Math.max(1,Math.min(r.maxLevel,Math.trunc(Number(s.level)||1)));
  const curve=data.enchantCurves[r.enchantValueId]?.[s.stat]||[];
  let value=Number(curve[level]??curve[level-1]??0);
  const f=catalog.formats[s.stat]||{},mul=f.mul??1,scaled=value*mul;
  if(!f.suffix&&(Math.abs(scaled)>=10||Math.abs(scaled-Math.round(scaled))<=.35))value=Math.round(scaled)/mul;
  add(s.stat,value);return {...r,level};
 });
 let synergy=[];
 if(selected.length===3&&selected.every(Boolean)){
  const grade=grades[Math.min(...selected.map(r=>grades.indexOf(r.grade)))];
  synergy=data.synergy[item.slot]?.[grade]?.[selected.map(r=>r.type).join('-')]||[];
  for(const {stat,value} of synergy)add(stat,value);
 }
 return {stats,selected,synergy};
}
export function runeStats(state,catalog){
 const out={};for(const entry of Object.values(state.items||{})){
  const item=catalog.equipment.find(i=>i.id===entry.id);if(!item)continue;
  for(const [k,v] of Object.entries(runeEffects(item,entry,catalog).stats))out[k]=(out[k]||0)+v;
 }return out;
}

export const FIXED_RUNE_LEVEL=80;
export const maxRuneChoices=item=>runeChoices(item).filter(r=>r.grade==='kAA'&&r.maxLevel>=FIXED_RUNE_LEVEL);
export function maxRuneSelection(item,type,stat){
 const rune=maxRuneChoices(item).find(r=>r.type===type);if(!rune)return null;
 return {runeId:rune.id,stat:rune.statPool.some(p=>p.stat===stat)?stat:rune.statPool[0].stat,level:FIXED_RUNE_LEVEL};
}
export function normalizeMaxRunes(item,entry){
 const choices=runeChoices(item);
 return Array.from({length:runeSlots(item)},(_,i)=>{const saved=entry?.runes?.[i],r=choices.find(r=>r.id===saved?.runeId);return r&&r.statPool.some(p=>p.stat===saved.stat)?maxRuneSelection(item,r.type,saved.stat):null;});
}
export function runeSynergies(item){return Object.entries(data.synergy[item.slot]?.kAA||{}).map(([order,stats])=>({order,types:order.split('-'),stats}));}
export function applyRuneSynergy(item,entry,order){
 const synergy=runeSynergies(item).find(r=>r.order===order);if(!synergy||runeSlots(item)!==3)return normalizeMaxRunes(item,entry);
 const old=normalizeMaxRunes(item,entry),byType=new Map(old.filter(Boolean).map(s=>[runeChoices(item).find(r=>r.id===s.runeId).type,s.stat]));
 return synergy.types.map(type=>maxRuneSelection(item,type,byType.get(type)));
}
