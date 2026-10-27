/**
 * Fury Stat Lab: damage attribution ONLY. No game damage formulas are implied.
 * Every damage event has one attackType and one mechanism.
 * A source (skill/weapon proc) is an independent dimension.
 */
export const ATTACK_TYPES = Object.freeze({magic:"Magic",ranged:"Ranged",melee:"Melee",unverified:"Не подтверждён"});
export const MECHANISMS = Object.freeze({
  auto_attack:"Автоатака", skill_direct:"Прямой урон умения",
  dot:"Периодический урон", explosion:"Взрыв / детонация",
  additional_hit:"Дополнительное попадание", weapon_proc:"Эффект оружия", other:"Прочий"
});
export const DOT_TYPES = Object.freeze({curse:"Проклятие",burning:"Горение",poison:"Яд",bleed:"Кровотечение",other:"Другой DoT"});
export const VALID_MODIFIERS = Object.freeze(["skillDamageBoost","magicDamage","rangedDamage","meleeDamage","curseDamage","dotDamage","bonusDamage","offhand","critical","heavy"]);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const clean=(name,keys,what)=> { if(typeof name!=="string" || !own(keys,name)) throw new TypeError("Invalid "+what+": "+name); return name; };
const empty=(keys)=>Object.fromEntries(Object.keys(keys).map(key=>[key,0]));
const summary=(map,total,duration,labelMap)=>Object.entries(map).map(([key,damage])=>({
  key,label:labelMap[key]??key,damage,dps:damage/duration,
  sharePercent:total===0?0:100*damage/total
}));
/**
 * Required event:
 * {source, damage, attackType:"magic"|"ranged"|"melee"|"unverified",
 *  mechanism, dotType? }
 * Optional: {isBookkeeping, modifiersApplied:[...], tags:[...]}
 * The unverified bucket is deliberately visible rather than guessed to be Magic.
 */
export function damageBreakdown(events,durationSeconds){
  if(!Array.isArray(events)||!Number.isFinite(durationSeconds)||durationSeconds<=0)
    throw new RangeError("Expected events array and positive durationSeconds");
  const attackTotals=empty(ATTACK_TYPES),mechanismTotals=empty(MECHANISMS),dotTotals=empty(DOT_TYPES);
  const sources=new Map(),sourceDetails=new Map();
  let total=0;
  for(const e of events){
    if(!e||typeof e.source!=="string"||!e.source.trim()) throw new TypeError("Missing damage source");
    if(!Number.isFinite(e.damage)||e.damage<0) throw new RangeError("Invalid event damage");
    const attack=clean(e.attackType,ATTACK_TYPES,"attackType");
    const mechanism=clean(e.mechanism,MECHANISMS,"mechanism");
    if(e.modifiersApplied!==undefined && (!Array.isArray(e.modifiersApplied)||e.modifiersApplied.some(m=>!VALID_MODIFIERS.includes(m))))
      throw new TypeError("Invalid modifiersApplied");
    if(e.tags!==undefined && (!Array.isArray(e.tags)||e.tags.some(t=>typeof t!=="string"))) throw new TypeError("Invalid tags");
    if(mechanism==="dot") clean(e.dotType,DOT_TYPES,"dotType");
    else if(e.dotType!==undefined) throw new TypeError("dotType only belongs to DoT");
    if(e.isBookkeeping===true) continue;
    const d=e.damage;total+=d;attackTotals[attack]+=d;mechanismTotals[mechanism]+=d;
    if(mechanism==="dot") dotTotals[e.dotType]+=d;
    sources.set(e.source,(sources.get(e.source)??0)+d);
    const s=sourceDetails.get(e.source)??{byAttackType:empty(ATTACK_TYPES),byMechanism:empty(MECHANISMS)};
    s.byAttackType[attack]+=d;s.byMechanism[mechanism]+=d;sourceDetails.set(e.source,s);
  }
  return {
    totalDamage:total,totalDps:total/durationSeconds,durationSeconds,
    byAttackType:summary(attackTotals,total,durationSeconds,ATTACK_TYPES),
    byMechanism:summary(mechanismTotals,total,durationSeconds,MECHANISMS),
    byDotType:summary(dotTotals,total,durationSeconds,DOT_TYPES),
    bySource:[...sources].map(([source,damage])=>({source,damage,dps:damage/durationSeconds,sharePercent:total?damage*100/total:0,...sourceDetails.get(source)})).sort((a,b)=>b.damage-a.damage)
  };
}
