import {treeStats} from './mastery-tree.js?v=full-audit-20261016';
import {runeStats} from './runes.js?v=full-audit-20261016';
export const ATTRS = [['str','Сила'],['dex','Ловкость'],['Int','Мудрость'],['per','Восприятие'],['con','Стойкость']];
export const SLOTS = [['weapon1','Арбалет','Crossbow'],['weapon2','Жезл','Wand'],['head','Голова','Head'],['chest','Тело','Chest'],['hands','Перчатки','Hands'],['legs','Поножи','Legs'],['feet','Обувь','Feet'],['cape','Плащ','Cape'],['necklace','Ожерелье','Necklace'],['earring','Серьги','Earring'],['bracelet','Браслет','Bracelet'],['ring1','Кольцо 1','Ring'],['ring2','Кольцо 2','Ring'],['belt','Пояс','Belt']];
export const traitLimit = grade => ({Common:0,Uncommon:2,Rare:3,Rare2:4,Epic2:4,Epic:4,Heroic:4,Legendary:4}[grade] || 0);
export function itemStats(item,level=0,traits=[],catalog,resonanceId=null){
 const stats={}; const add=(k,v)=>{if(k==='species_damage_amplification')k='all_species_damage_amplification';if(Number.isFinite(Number(v)))stats[k]=(stats[k]||0)+Number(v)};
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
  const base=info.baseBySeed?.[String(item.traitBaseSeeds?.[t.id]||1)]??info.base??0;
  add(info.stat,info.curve?.length?Number(base)+Number(info.curve[lv-1]||0):Number(info.max??base));
 }
 for(const [k,v] of Object.entries(resonanceStats(item,{traits,resonanceId},catalog)))add(k,v);
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
  for(const [k,v] of Object.entries(itemStats(item,entry.level,entry.traits,catalog,entry.resonanceId))){
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
export function setPassives(state,catalog){
 return state.excludeSetBonuses?[]:activeSets(state,catalog).flatMap(g=>g.bonuses.flatMap(b=>(b.passives||[]).map(p=>({...p,set:g.name,pieces:b.pieces}))));
}
export function setStats(state,catalog){
 const stats={},add=(k,v)=>stats[k]=(stats[k]||0)+v;
 if(state.excludeSetBonuses)return stats;
 for(const group of activeSets(state,catalog))for(const bonus of group.bonuses){
  for(const row of bonus.stats||[]){
   const key=row.type.replace(/[A-Z]/g,(c,i)=>(i?'_':'')+c.toLowerCase());
   if(Number.isFinite(row.value)){if(key==='critical_damage_dealt_modifier')stats[key]=Math.max(stats[key]||0,row.value);else add(key,row.value);}
  }
  // These client passives have no numerical preview row. Never add a passive twice.
  if(!(bonus.stats||[]).length)for(const p of bonus.passives||[]){
   if(p.description==='Шанс атаки парным оружием повышается на 30%')add('off_hand_attack_chance_modifier',3000);
   if(p.description==='Эффективность исцеления умениями +25%')add('heal_modifier',2500);
   if(p.description==='Время действия ослабления +7,5%')add('debuff_given_duration_modifier',750);
   if(p.description==='Блокирование щитом +10%')add('shield_block_chance',1000);
  }
 }
 return stats;
}
// Evaluate after attributes and max HP/MP: these effects must see the completed build.
export function conditionalSetStats(state,catalog,attributes,raw){
 const out={},add=(k,v)=>out[k]=(out[k]||0)+v;
 for(const p of setPassives(state,catalog)){
  const id=p.id||p.clientSource?.locresId;
  if(id==='Item_Passive_Set_leather_aa_003_1_Passive'||p.set==='set_aa_leather_003'&&p.pieces===2){if(attributes.dex>=30)add('skill_cooldown_modifier',800);}
  if(id==='Item_Passive_Set_leather_aa_003_2_Passive'||p.set==='set_aa_leather_003'&&p.pieces===4)add('attack_speed_modifier',Math.floor(attributes.con/10)*200);
  if(id==='Item_Passive_Set_fabric_aa_T2_001_2_Passive')add('skill_cooldown_modifier',Math.min(20,Math.floor((raw.cost_max||0)/1000))*100);
  if(id==='Item_Passive_Set_plate_aa_T2_001_2_Passive')add('melee_double_attack',Math.min(240,Math.floor((raw.hp_max||0)/1000)*12)*10);
  if(id==='Item_Passive_Set_plate_aa_T2_003_1_Talland')for(const type of ['melee','range','magic'])add(type+'_critical_defense',Math.floor(attributes.per/10)*450);
  if(id==='Item_Passive_Set_plate_aa_T2_003_2_Talland'&&attributes.con>=50)add('main_weapon_base_damage',30);
 }
 return out;
}

export function resonanceReady(item,entry,catalog){
 const limit=traitLimit(item.grade),traits=(entry.traits||[]).filter(t=>item.traits?.includes(t?.id)&&catalog.traits[t.id]);
 return limit>0&&traits.length===3&&new Set(traits.map(t=>t.id)).size===3&&traits.every(t=>Number(t.level)>=limit);
}
export function resonanceStats(item,entry,catalog){
 if(!resonanceReady(item,entry,catalog))return {};
 const effect=item.resonanceEffects?.find(r=>r.id===entry.resonanceId),stats={};
 for(const row of effect?.stats||[])if(Number.isFinite(row.value))stats[row.stat]=(stats[row.stat]||0)+row.value;
 return stats;
}
