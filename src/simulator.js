export function skillDamageMultiplier(boost=0,resistance=0){
  const diff=Number(boost||0)-Number(resistance||0);
  if(diff>=0) return 1+diff/(diff+1000);
  const x=-diff;
  return 1-x/(x+1000);
}

export function estimateAutoAttackDps(stats){
  const min=Math.max(0,Number(stats.minDamage)||0);
  const max=Math.max(min,Number(stats.maxDamage)||0);
  const avg=(min+max)/2;
  const attackSpeed=Math.max(-80,Number(stats.attackSpeed)||0);
  const attacksPerSecond=1*(1+attackSpeed/100);
  const critChance=Math.max(0,Math.min(1,(Number(stats.critChance)||0)/1000));
  const critBonus=Math.max(0,(Number(stats.critDamage)||0)/100);
  const heavyChance=Math.max(0,Math.min(1,(Number(stats.heavyChance)||0)/1000));
  const expectedCrit=1+critChance*critBonus;
  const expectedHeavy=1+heavyChance;
  return avg*attacksPerSecond*expectedCrit*expectedHeavy*skillDamageMultiplier(stats.skillBoost,stats.skillResist);
}

export function simulateFiveMinutes(stats){
  const duration=300;
  const autoDps=estimateAutoAttackDps(stats);
  return {
    duration,
    autoDps,
    dps:autoDps,
    totalDamage:autoDps*duration,
    warning:"Техническая версия: пока рассчитана только базовая ожидаемая автоатака. Ротация и эффекты умений подключаются следующим этапом."
  };
}
