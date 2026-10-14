// RU October 2026: directional ratings are separate from the character sheet.
export const ATTACK_POSITIONS=['front','side','back'];
const chance=(rating,k)=>Math.max(0,rating)/(Math.max(0,rating)+k);
export function combatRatings(p,weapon,position=p.attackPosition||'front',critBonus=0,accuracyBonus=0){
 const magic=weapon==='Wand',suffix=magic?'M':'R',boss=p.targetIsBoss?1:0,k=p.ratingK||1000;
 const at=direction=>{
  const accuracy=(p['accuracy'+suffix]||0)+(p[direction+'Accuracy']||0)+boss*(p['bossAccuracy'+suffix]||0)+accuracyBonus;
  const crit=(p['crit'+suffix]||0)+(p[direction+'Crit']||0)+boss*(p['bossCrit'+suffix]||0)+critBonus;
  const heavy=(p['heavy'+suffix]||0)+(p[direction+'Heavy']||0)+boss*(p['bossHeavy'+suffix]||0);
  // The patch grants three percentage points to back hit/critical probability.
  const back=direction==='back'?.03:0;
  return {position:direction,hit:Math.min(1,1-chance((p.evasion||0)-accuracy,k)+back),critical:Math.min(1,chance(crit-(p.endurance||0),k)+back),heavy:chance(heavy-(p.heavyEvasion||0),k),glancing:chance((p.endurance||0)-crit,k)};
 };
 if(position!=='best')return at(ATTACK_POSITIONS.includes(position)?position:'front');
 const lo=magic?p.wandMin:p.crossMin,hi=magic?p.wandMax:p.crossMax,avg=(lo+hi)/2;
 const score=r=>r.hit*((1-r.critical)*(avg*(1-r.glancing)+lo*r.glancing)+r.critical*hi*(1+(p.critDamage||0)/100))*(1+r.heavy);
 return ATTACK_POSITIONS.map(at).reduce((best,row)=>score(row)>=score(best)?row:best);
}
