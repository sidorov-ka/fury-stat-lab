// Classification of already calculated damage. These labels do not implement
// combat formulas. 'model' describes the ratings selected by the simulator,
// not an independently confirmed damage type on the RU game server.
export const ATTACK_LABELS={magic:'Магия',ranged:'Дальний бой',melee:'Ближний бой',unverified:'Не подтверждён'};
export const MECHANISM_LABELS={auto:'Автоатаки',direct:'Прямой урон умений',dot:'Периодический урон',explosion:'Взрывы',additional:'Дополнительные попадания',weapon:'Эффекты оружия',other:'Прочий урон'};
export const DOT_LABELS={curse:'Проклятие',burning:'Воспламенение',poison:'Яд',bleed:'Кровотечение',other:'Другой периодический урон'};
export const HAND_LABELS={main:'Основная рука',off:'Парное оружие',none:'Не разделено'};
const other={attackType:'unverified',mechanism:'other',source:null,hand:'none',confidence:'unverified'};
const modeled=weapon=>weapon==='Wand'?'magic':weapon==='Crossbow'?'ranged':'unverified';
export function eventInfo(id,context={}){
 const e={...other,source:id,...context};
 if(context.weapon){e.modeledType=modeled(context.weapon);if(!context.attackType){e.attackType=e.modeledType;e.confidence='model';}}
 if(id==='mark-explosion'){e.mechanism='explosion';e.source='mark-explosion';}
 else if(id==='curse-explosion'||id.endsWith('-explosion')||id==='gale'||id==='abyssal-burst'||id==='delayed-explosion'){e.mechanism='explosion';}
 else if(id==='mark-hit'||id==='nature-hit'||id==='nature-lightning'||id==='moving-lightning'||id==='vampiric-onslaught')e.mechanism='additional';
 else if(id==='weapon-projectile')e.mechanism='weapon';
 else if(id==='auto')e.mechanism='auto';
 if(e.mechanism==='dot'&&!e.dotType)e.dotType='other';
 if(context.weapon){e.modelInputs=['Диапазон урона оружия',context.weapon==='Wand'?'Крит и мощная атака магии':'Крит и мощная атака дальнего боя',context.weapon==='Wand'?'Урон магией':'Урон дальнего боя','Защита цели','Урон по типу противника'];if(e.mechanism!=='auto')e.modelInputs.push('Повышение урона умений','Сопротивление умениям цели');if(e.mechanism!=='dot')e.modelInputs.push('Дополнительный урон');if(e.hand==='off')e.modelInputs.push('Шанс парной атаки');if(e.mechanism==='dot')e.modelInputs.push('Периодический урон');}
 delete e.weapon;
 return e;
}
export function breakdown(events,seconds=300){
 if(!Number.isFinite(seconds)||seconds<=0)throw new RangeError('positive fight duration required');
 const dimensions={attackType:new Map(),mechanism:new Map(),source:new Map(),dotType:new Map(),hand:new Map()};let total=0;
 const details=new Map(),inputs=new Map();
 for(const event of events){
  if(!Number.isFinite(event.value)||event.value<0)throw new RangeError('invalid damage');
  const parts=event.parts||[{value:event.value,...event.attribution}];
  if(Math.abs(parts.reduce((n,x)=>n+x.value,0)-event.value)>1e-8*Math.max(1,event.value))throw new Error('damage parts do not match event');
  for(const part of parts){
   const x={...other,source:event.id,...event.attribution,...part};
   if(!Object.hasOwn(ATTACK_LABELS,x.attackType)||!Object.hasOwn(MECHANISM_LABELS,x.mechanism)||!Object.hasOwn(HAND_LABELS,x.hand))throw new Error('invalid classification');
   if(x.mechanism==='dot'&&!Object.hasOwn(DOT_LABELS,x.dotType))throw new Error('invalid DoT type');
   total+=x.value;
   for(const key of ['attackType','mechanism','source','hand'])dimensions[key].set(x[key],(dimensions[key].get(x[key])||0)+x.value);
   if(x.mechanism==='dot')dimensions.dotType.set(x.dotType,(dimensions.dotType.get(x.dotType)||0)+x.value);
   const known=inputs.get(x.source)||new Set();for(const name of x.modelInputs||[])known.add(name);inputs.set(x.source,known);
   const group=details.get(x.source)||new Map(),key=x.mechanism+'|'+x.attackType+'|'+x.hand;group.set(key,(group.get(key)||0)+x.value);details.set(x.source,group);
  }
 }
 const rows=(map,labels={})=>[...map].map(([key,value])=>({key,label:labels[key]||key,damage:value,dps:value/seconds,share:total?100*value/total:0})).sort((a,b)=>b.damage-a.damage);
 return {total,dps:total/seconds,attackType:rows(dimensions.attackType,ATTACK_LABELS),mechanism:rows(dimensions.mechanism,MECHANISM_LABELS),source:rows(dimensions.source),dotType:rows(dimensions.dotType,DOT_LABELS),hand:rows(dimensions.hand,HAND_LABELS),details:Object.fromEntries([...details].map(([source,map])=>[source,rows(map)])),inputs:Object.fromEntries([...inputs].map(([source,values])=>[source,[...values]]))};
}
