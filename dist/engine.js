import {treeStats} from './mastery-tree.js?v=passive-sheet-1';
import {runeStats} from './runes.js';
export const ATTRS = [['str','Сила'],['dex','Ловкость'],['Int','Мудрость'],['per','Восприятие'],['con','Стойкость']];
export const SLOTS = [['weapon1','Арбалет','Crossbow'],['weapon2','Жезл','Wand'],['head','Голова','Head'],['chest','Тело','Chest'],['hands','Перчатки','Hands'],['legs','Поножи','Legs'],['feet','Обувь','Feet'],['cape','Плащ','Cape'],['necklace','Ожерелье','Necklace'],['bracelet','Браслет','Bracelet'],['ring1','Кольцо 1','Ring'],['ring2','Кольцо 2','Ring'],['belt','Пояс','Belt']];
export const traitLimit = grade => ({Common:0,Uncommon:2,Rare:3,Rare2:4,Epic:4,Heroic:4,Legendary:4}[grade] || 0);
export function itemStats(item,level=0,traits=[],catalog){
 const stats={}; const add=(k,v)=>{if(Number.isFinite(Number(v)))stats[k]=(stats[k]||0)+Number(v)};
 for(const [base,scale] of [['baseStats','enchantScaling'],['extraStats','extraEnchantScaling']]){
  for(const key of new Set([...Object.keys(item[base]||{}),...Object.keys(item[scale]?.[level]||{})])) add(key,Number(item[base]?.[key]||0)+Number(item[scale]?.[level]?.[key]||0));
 }
 const seen=new Set();
 for(const t of traits.slice(0,3)){
  if(!t?.id)continue;
  if(seen.has(t.id)||!item.traits?.includes(t.id))continue;
  seen.add(t.id);const info=catalog.traits[t.id];if(!info)continue;
  const limit=traitLimit(item.grade);if(!limit)continue;
  const lv=Math.max(1,Math.min(limit,t.level||1));
  add(info.stat,info.curve?.length?Number(info.base||0)+Number(info.curve[lv-1]||0):Number(info.max??info.base??0));
 }
 return stats;
}
export function weaponRange(item,level=0){
 if(!item)return null;
 const sc=item.enchantScaling?.[level]||{};
 const min=1+Number(item.baseStats?.bonus_attack_power_main_hand||0)+Number(sc.bonus_attack_power_main_hand||0);
 const spread=Math.max(0,Number(item.baseStats?.attack_power_main_hand||0)+Number(sc.attack_power_main_hand||0)-1);
 return [min,min+spread];
}
export function gearStats(state,catalog){
 const out=runeStats(state,catalog);
 if(!state.excludeSetBonuses)for(const [k,v] of Object.entries(setStats(state,catalog)))out[k]=(out[k]||0)+v;
 for(const entry of Object.values(state.items)){
  const item=catalog.equipment.find(x=>x.id===entry.id);if(!item)continue;
  for(const [k,v] of Object.entries(itemStats(item,entry.level,entry.traits,catalog))){
   if(/_main_hand$|_off_hand$/.test(k)||k==='off_hand_attack_chance')continue;
   out[k]=(out[k]||0)+v;
  }
 }
 return out;
}
export function specCost(state,catalog){
 const equipped=new Set([...state.active,...state.passive,...state.defensive].filter(Boolean));let cost=0;
 for(const s of catalog.skills)if(equipped.has(s.id))for(const t of s.specializations||[])if(state.specs[s.id]?.includes(t.id))cost+=Number(t.cost||0);
 return cost;
}
export function totalAttributes(state,catalog){
 const gear=gearStats(state,catalog),mastery=treeStats(state);
 return Object.fromEntries(ATTRS.map(([k])=>[k,Number(state.attrs[k]||0)+Number(state.attributeAdjustments?.[k]||0)+(state.attrMode==='total'?0:Number(gear[k]||gear[k.toLowerCase()]||0)+Number(mastery[k.toLowerCase()]||0))]));
}

// A set threshold is applied once, regardless of how many equipped pieces carry its definition.
export function activeSets(state,catalog){
 const groups=new Map(),seen=new Set();
 for(const entry of Object.values(state.items||{})){
  const item=catalog.equipment.find(x=>x.id===entry.id);if(!item?.setName||seen.has(item.id))continue;
  seen.add(item.id);const group=groups.get(item.setName)||{name:item.setName,count:0,bonuses:new Map()};group.count++;
  for(const bonus of item.setBonuses||[])if(!group.bonuses.has(bonus.pieces))group.bonuses.set(bonus.pieces,bonus);
  groups.set(item.setName,group);
 }
 return [...groups.values()].map(g=>({name:g.name,count:g.count,bonuses:[...g.bonuses.values()].filter(b=>g.count>=b.pieces)}));
}
export function setStats(state,catalog){
 const stats={};
 for(const group of activeSets(state,catalog))for(const bonus of group.bonuses)for(const row of bonus.stats||[]){
  const key=row.type.replace(/[A-Z]/g,(c,i)=>(i?'_':'')+c.toLowerCase());
  if(Number.isFinite(row.value))stats[key]=(stats[key]||0)+row.value;
 }
 return stats;
}
