// Explicit additive contributions, not total character stats or a mastery tree.
export const MASTERY_FIELDS=[
 ['crossMin','Арбалет: минимум урона'],['crossMax','Арбалет: максимум урона'],
 ['offMin','Парное оружие: минимум'],['offMax','Парное оружие: максимум'],
 ['wandMin','Жезл: минимум урона'],['wandMax','Жезл: максимум урона'],
 ['critR','Критический удар: дальний бой'],['critM','Критический удар: магия'],
 ['heavyR','Мощная атака: дальний бой'],['heavyM','Мощная атака: магия'],
 ['critDamage','Критический урон, п.п.'],['boost','Повышение урона умений'],
 ['bonus','Дополнительный урон'],['cooldown','Скорость восстановления умений, п.п.'],
 ['speed','Скорость атаки, п.п.'],['offhand','Шанс парной атаки, п.п.'],
 ['mana','Максимальная мана'],['regen','Восстановление маны'],
 ['efficiency','Эффективность расхода маны, п.п.'],['hp','Максимальное здоровье'],
 ['buffDuration','Длительность положительных эффектов, п.п.'],['healing','Эффективность исцеления, п.п.']
];
export const emptyMastery=()=>Object.fromEntries(MASTERY_FIELDS.map(([k])=>[k,0]));
export function applyMastery(stats,mastery={}){
 const out={...stats};
 for(const [key] of MASTERY_FIELDS){const value=mastery[key];if(typeof value==='number'&&Number.isFinite(value)&&value>=0)out[key]=(out[key]||0)+value;}
 // Preserve the underlying attack interval, then apply the new speed bonus once.
 out.interval=stats.interval*(1+stats.speed/100)/(1+out.speed/100);
 return out;
}
