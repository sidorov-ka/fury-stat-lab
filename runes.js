import {RUNE_DATA as data} from './rune-data.js';
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
