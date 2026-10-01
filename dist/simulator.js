// Experimental expected-value PvE model. No claim of a verified RU combat engine.
import {gearStats,itemStats,weaponRange,ATTRS,totalAttributes} from './engine.js';
import {applyMastery} from './mastery.js';
import {treeStats,treeWarnings} from './mastery-tree.js';
export const IDS={mark:'WP_CR_CR_S_ArmorBreakShot',step:'WP_CR_CR_S_Step',nature:'WP_CR_CR_S_AddProjectile',rapid:'WP_CR_CR_S_RapidShot',mana:'WP_CR_CR_S_BloodToSoul',ghost:'WP_CR_S_GhostWalk',buck:'WP_CR_CR_S_BuckShot',barrage:'WP_CR_FuriousFire',shot:'WP_CR_D_AddShot',weak:'WP_CR_D_WeakPointShot',trap:'WP_CR_TauntTrap',touch:'WP_WA_GR_S_Corruption',decay:'WP_WA_GR_S_Decay',burst:'WP_WA_GR_S_CurseBurst',area:'WP_WA_GR_S_CurseArea',spread:'WP_WA_GR_S_CurseSpread',light:'WP_WA_GR_S_DefenseUp',laser:'WP_WA_GR_S_LinkLaser'};
export const PASS={thirst:'WP_CR_CR_S_WeakenAttackBonus',adapt:'WP_CR_CR_S_PeaceTimeBuff',ambi:'WP_CR_S_OffHandMaxDmg',bonus:'WP_CR_S_CriticalAttack',duration:'WP_WA_GR_S_CurseDuration',night:'WP_WA_GR_S_DayHealNightCurse',pact:'WP_WA_GR_S_CurseAttackHeal'};
export const DEFAULTS={rangeDamage:0,magicDamage:0,crossMin:0,crossMax:0,offMin:0,offMax:0,wandMin:0,wandMax:0,critR:0,critM:0,heavyR:0,heavyM:0,critDamage:0,boost:0,bonus:0,cooldown:0,speed:0,offhand:0,interval:0.5,mana:5175,regen:6,regenPeriod:10,efficiency:0,hp:5175,buffDuration:0,night:0,defense:0,defenseK:2500,ratingK:1000,species:0,pve:1,dotCrit:0,auto:1,animationFloor:0.25,latency:0,healing:0,sheetIncludesPassives:0};
export const SCREENSHOT={crossMin:87,crossMax:400,offMin:71,offMax:376,wandMin:166,wandMax:491,offhand:32.8,healing:3.6,critR:1371.2,critM:1437.2,heavyR:337,heavyM:409,critDamage:9,boost:130.5,bonus:25,cooldown:43.8,speed:27.66,interval:0.340,mana:12523,regen:661.75,efficiency:41.51,hp:16613,buffDuration:33.25};
export const SUPPORTED_SPECS={mark:[1,2,3],step:[1,3,4],nature:[2,4],rapid:[1,2,3,4],mana:[1,2,3],ghost:[2,3],buck:[1,2],barrage:[3],shot:[1,2,3],weak:[1,2],trap:[1,2,3],touch:[1,2,3],decay:[1,2,3],burst:[1,2,3],area:[1,3],spread:[1,2,3],light:[1,2,3],laser:[2,3,4]};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const BUFF_DEFAULTS={resistance:0,selfSkillBoost:80,selfDurationExtension:3,targetResistanceDrop:220,lightMaxBonus:50,lightOpeningMultiplier:1,lightOpeningSeconds:2};
export const ROLE_LABELS={DPS:'Урон',cooldown:'Откат',resource:'Ресурс',utility:'Вспомогательный',defensive:'Защита',unsupported:'Не подтверждён'};
export function lightBonusAt(time,start,end,directed,params){return time>=start&&time<end?params.lightMaxBonus*(!directed&&time<start+params.lightOpeningSeconds?params.lightOpeningMultiplier:1):0;}
export function specializationRole(id,n){
 const key=Object.keys(IDS).find(k=>IDS[k]===id);
 const roles={mark:['utility','DPS','utility'],step:['DPS','unsupported','cooldown','defensive'],nature:['unsupported','unsupported','unsupported','DPS'],rapid:['DPS','DPS','DPS','cooldown'],mana:['resource','utility','utility'],ghost:['defensive','defensive','utility'],buck:['cooldown','utility'],barrage:['unsupported','unsupported','DPS'],shot:['DPS','DPS','DPS'],weak:['utility','cooldown'],trap:['utility','utility','utility'],touch:['utility','DPS','DPS'],decay:['DPS','DPS','utility'],burst:['DPS','DPS','cooldown'],area:['DPS','unsupported','DPS'],spread:['DPS','utility','DPS'],light:['DPS','utility','DPS'],laser:['utility','utility','cooldown','DPS']};
 return roles[key]?.[n-1]||'unsupported';
}
export function specializationUtility(catalog,specs){return catalog.skills.reduce((sum,s)=>sum+(s.specializations||[]).filter(t=>specs[s.id]?.includes(t.id)&&['utility','defensive'].includes(specializationRole(s.id,Number(t.id.split('_').at(-1))))).reduce((n,t)=>n+t.cost,0),0);}
export const chance=(rating,k=1000)=>Math.max(0,rating)/(Math.max(0,rating)+k);
export function attackInterval(baseSeconds,dexPercent,speedPercent){return Math.max(.001,baseSeconds-Math.max(0,dexPercent)*.0067)/Math.max(.01,1+speedPercent/100);}
export function deriveStats(state,catalog){
 const raw={...catalog.attributes.baseCharacter.stats};for(const [k,v] of Object.entries(gearStats(state,catalog)))raw[k]=(raw[k]||0)+v;
 const mastery=treeStats(state);for(const [k,v] of Object.entries(mastery))raw[k]=(raw[k]||0)+v;
 raw.cost_max=(raw.cost_max||0)+(Number.isFinite(state.baseMana)&&state.baseMana>=0?state.baseMana:catalog.attributes.baseLevelStats.cost_max);
 raw.hp_max=(raw.hp_max||0)+(Number.isFinite(state.baseHp)&&state.baseHp>=0?state.baseHp:catalog.attributes.baseLevelStats.hp_max);
 for(const entry of Object.values(state.items)){const item=catalog.equipment.find(x=>x.id===entry.id);if(item&&item.slot!=='Weapon'){const st=itemStats(item,entry.level,entry.traits,catalog);for(const k of ['bonus_attack_power_main_hand','attack_power_main_hand'])raw[k]=(raw[k]||0)+(st[k]||0);}}
 const extras={Crossbow:{},Wand:{}},attributes=totalAttributes(state,catalog);let dexPercent=0;
 for(const [attr] of ATTRS){
  const total=Math.trunc(attributes[attr]);
  const row=catalog.attributeStats[attr.toLowerCase()]?.[Math.min(100,total)]||{};
  for(const [k,v] of Object.entries(row)){if(attr==='dex'&&k==='attack_speed_modifier'){dexPercent=Math.max(0,(v-(catalog.attributeStats.dex?.[10]?.attack_speed_modifier||0))*.01);continue;}if(typeof v==='number')raw[k]=(raw[k]||0)+v;else for(const weapon of ['Crossbow','Wand'])extras[weapon][k]=(extras[weapon][k]||0)+(v[weapon.toLowerCase()]||0);}
  for(const m of catalog.attributes.milestones||[])if(m.attribute===attr.toUpperCase()&&total>=m.count)for(const b of m.bonuses)raw[b.stat]=(raw[b.stat]||0)+b.value;
 }
 const val=k=>(raw[k]||0)*(catalog.formats[k]?.mul??1);
 const out={...DEFAULTS,critR:val('all_critical_attack')+val('range_critical_attack'),critM:val('all_critical_attack')+val('magic_critical_attack'),heavyR:val('all_double_attack')+val('range_double_attack'),heavyM:val('all_double_attack')+val('magic_double_attack'),critDamage:val('critical_damage_dealt_modifier'),boost:val('skill_power_amplification'),bonus:val('damage_reduction_penetration'),cooldown:val('skill_cooldown_modifier'),speed:val('attack_speed_modifier'),mana:val('cost_max'),regen:val('cost_regen'),efficiency:val('cost_consumption_modifier'),hp:val('hp_max'),buffDuration:val('buff_given_duration_modifier')};
 for(const [slot,weapon,prefix] of [['weapon1','Crossbow','cross'],['weapon2','Wand','wand']]){
  const e=state.items[slot],item=catalog.equipment.find(x=>x.id===e?.id);if(!item)continue;
  const r=weaponRange(item,e.level),x=extras[weapon];
  const minBonus=(raw.bonus_attack_power_main_hand||0)+(x.bonus_attack_power_main_hand||0),spreadBonus=(raw.attack_power_main_hand||0)+(x.attack_power_main_hand||0);
  out[prefix+'Min']=r[0]+minBonus;out[prefix+'Max']=r[1]+minBonus+spreadBonus;
  if(prefix==='cross'){const s=itemStats(item,e.level,e.traits,catalog);out.offMin=1+(s.bonus_attack_power_off_hand||0)+minBonus;out.offMax=out.offMin+Math.max(0,(s.attack_power_off_hand||0)-1)+spreadBonus+(state.passive.includes(PASS.ambi)?40:0);out.offhand=(s.off_hand_attack_chance||0)*.01+val('off_hand_attack_chance_modifier');out.interval=attackInterval((s.attack_speed_main_hand||500)*.001,dexPercent,out.speed);}
 }
 if(state.passive.includes(PASS.bonus))out.bonus+=13;
 out.offhand+=(mastery.off_hand_attack_chance||0)*.01;
 out.healing=val('heal_modifier');
 out.rangeDamage=(raw.range_damage_dealt_modifier||0)*.01;out.magicDamage=(raw.magic_damage_dealt_modifier||0)*.01;
 // This node gives the same rating against all five monster species; count it once.
 out.species+=Math.min(...['demon','animal','undead','grankus','creation'].map(k=>(mastery[k+'_damage_amplification']||0)*.1));
 return applyMastery(out,state.mastery);
}
export function statBreakdown(state,catalog){
 const baseline={...state,attributeAdjustments:{},items:{},attrs:{str:10,dex:10,Int:10,per:10,con:10},attrMode:'total',masteryTrees:{},mastery:{},passive:[],active:[],defensive:[],specs:{}};
 const attributes={...baseline,attrs:state.attrs,attrMode:state.attrMode};
 const gear={...attributes,items:Object.fromEntries(Object.entries(state.items).map(([k,v])=>[k,{...v,runes:[]}]))};
 const runes={...gear,items:state.items};
 const mastery={...runes,masteryTrees:state.masteryTrees};
 const passives={...mastery,passive:state.passive};
 const steps=[baseline,attributes,gear,runes,mastery,passives,state].map(s=>deriveStats(s,catalog));
 return {labels:['База + 10 атрибутов','Атрибуты','Экипировка','Руны','Мастерство','Пассивные','Ручные прибавки'],values:Object.fromEntries(Object.keys(steps.at(-1)).map(k=>[k,steps.map((s,i)=>s[k]-(i?steps[i-1][k]:0))])),total:steps.at(-1)};
}
// Epic level 5. Only the exact cooldown progression label describes this skill's cooldown.
// Passive reductions and defensive skill effects must not replace their own cooldown.
export function levelFiveCooldown(skill){
 const row=(skill.levelProgression||[]).find(r=>r.label.trim()==='Время восстановления ▼');
 const match=row?.values?.[4]?.match(/^([\d]+(?:[.,]\d+)?)\s*сек\./);
 return match?Number(match[1].replace(',','.')):skill.cooldownSec;
}
export function models(catalog,state,overrides={}){
 return Object.entries(IDS).map(([key,id])=>{
  const s=catalog.skills.find(s=>s.id===id),selected=state.specs[id]||[];
  const specs=selected.map(x=>Number(x.split('_').at(-1)));
  return {...s,skillLevel:5,cooldownSec:levelFiveCooldown(s),...(key==='nature'?{cooldownSec:0,manaCost:0,hitDelay:0}:{}),key,specs,cast:key==='nature'?0:Math.max(0,s.castTime),pve:1,...overrides[id]};
 });
}
export function coverage(state,catalog){
 const warnings=treeWarnings(state);
 if(state.active.includes(IDS.nature))warnings.push('Общее допущение — эпические умения ур. 5. Исключение: для постоянного Гнева природы нет подтверждённых коэффициентов ур. 5; временно сохранены данные скриншота RU ур. 4. Старая шестисекундная версия RUTL не используется.');
 if(state.active.includes(IDS.touch))warnings.push('Глубокая скорбь: вероятность дополнительного уровня пока заменяется средним 1,5 уровня. Порог взрыва и достижение 3 уровней поэтому приближённые. Воспламенение не входит во взрыв.');
 if(state.active.includes(IDS.area))warnings.push('Ритуальный круг: блокировка действий взята из каталога (4 с); для Перста угасания отдельное время отсутствует. Его нужно замерить в RU.');
 if(state.passive.includes(PASS.thirst)&&state.active.includes(IDS.laser))warnings.push('Взаимодействие Жажды битвы с Лучом погибели не подтверждено: сейчас общий обработчик попаданий продлевает ослабления и общий обработчик откатов затрагивает луч. Это может завышать DPS.');
 if(state.active.includes(IDS.decay))warnings.push('Час преодоления (специализация 1) — бафф +80 на себя. Базовый Час отмщения и Час иссушения по монстру снижают сопротивление цели на 220. В модели RUTL сопротивление ограничено нулём; в альтернативе Rabubu29 допускается отрицательное. Поведение RU требует подтверждения. Длительность ▲ для личного баффа трактуется как +3 с — требует проверки RU.');
 if(state.active.includes(IDS.light))warnings.push('Свет доблести — +50 максимального урона на себя. Перенос начального удвоения защитной версии на атакующую не подтверждён: по умолчанию множитель 1, длительность окна 2 с; оба параметра редактируются. Направленный свет отключает начальное усиление.');
 if(state.active.includes(IDS.nature)){const specs=state.specs[IDS.nature]||[];if(!specs.length)warnings.push('Гнев природы: выбери стихию в специализациях; без стихии он не участвует в расчёте.');if(specs.some(s=>s.endsWith('_2')))warnings.push('Гнев природы, огонь: учтены заряд 21% и расход 23 маны. Урон и взаимодействия воспламенения не учтены: требуется описание «Огненных зарядов». DPS огненной сборки неполный.');if(specs.length>1)warnings.push('Гнев природы: перед боем включается первая выбранная стихия в порядке ветер → огонь → холод → молния; переключения в бою не моделируются.');}
 for(const id of state.active.filter(Boolean))if(!Object.values(IDS).includes(id))warnings.push(`${catalog.skills.find(s=>s.id===id)?.name}: ещё не моделируется и не участвует в поиске.`);
 for(const [key,id] of Object.entries(IDS))for(const sp of state.specs[id]||[])if(!SUPPORTED_SPECS[key].includes(Number(sp.split('_').at(-1))))warnings.push(`${catalog.skills.find(s=>s.id===id)?.name} — ${catalog.skills.find(s=>s.id===id)?.specializations.find(s=>s.id===sp)?.name}: эффект не учтён.`);
 for(const id of state.passive.filter(Boolean))if(!Object.values(PASS).includes(id))warnings.push(`${catalog.skills.find(s=>s.id===id)?.name}: пассивный эффект не моделируется (либо не действует на неподвижной цели без ответных атак).`);
 return warnings;
}
export function expectedHit(p,weapon,coef,flat,{dot=false,skill=true,off=false,maxBonus=0,critBonus=0,critDamageBonus=0,boostBonus=0,resistanceDrop=0,bonus=0,skillMultiplier=1}={}){
 const magic=weapon==='Wand',lo=magic?p.wandMin:off&&p.offMax>0?p.offMin:p.crossMin,hi=(magic?p.wandMax:off&&p.offMax>0?p.offMax:p.crossMax)+maxBonus;
 const cr=chance((magic?p.critM:p.critR)+critBonus,p.ratingK),hv=chance(magic?p.heavyM:p.heavyR,p.ratingK);
 const avg=(lo+hi)/2,cd=1+(p.critDamage+critDamageBonus)/100;
 const normal=coef*avg+flat,critical=(coef*(dot?avg:hi)+flat)*cd;
 const base=dot&&!p.dotCrit?normal:normal*(1-cr)+critical*cr;
 const rawResistance=(p.resistance||0)-resistanceDrop;
 const resistance=Math.max(0,rawResistance),delta=p.boost+boostBonus-rawResistance;
 // Sources disagree: RUTL and WTFOMG's PvE endpoint use independent factors;
 // Rabubu29's empirical model uses the signed difference (including debuffs).
 const mult=!skill?1:p.resistanceModel==='difference'?1+Math.sign(delta)*chance(Math.abs(delta),p.ratingK):(1+chance(p.boost+boostBonus,p.ratingK))*(1-chance(resistance,700));
 const typeBonus=1+(magic?(p.magicDamage||0):(p.rangeDamage||0))/100;
 return Math.max(0,base*mult*(1+hv)*typeBonus*(1+chance(p.species,p.ratingK))*p.pve*skillMultiplier/(1+p.defense/p.defenseK)+(dot?0:p.bonus+bonus));
}
export function simulate({catalog,state,params,overrides={},priority,burstStacks=3},detail=false){
 const p={...DEFAULTS,...BUFF_DEFAULTS,...params},all=models(catalog,state,overrides),byId=new Map(all.map(s=>[s.id,s]));
 // "Несовместимые умения" в описании пассивки не запрещают держать оба навыка
 // на панели. «Луч погибели» продолжает работать сам по себе; взаимодействие
 // пассивки с его отдельными эффектами моделируется только там, где подтверждено.
 const list=priority.map(id=>byId.get(id)).filter(Boolean),has=id=>state.passive.includes(id),sp=(s,n)=>s.specs.includes(n);
 const cd=Object.fromEntries(list.map(s=>[s.id,0])),counts={},damage={},logs=[],damageEvents=[],bins=Array(30).fill(0),pending=[];
 let total=0,t=0,busy=0,nextAuto=0,mana=p.mana,hp=p.hp,minMana=mana,starved=0,charges=0,gale=0,galeEnd=0,slow=0;
 const natureSkill=list.find(s=>s.key==='nature'),natureElement=natureSkill?.specs.slice().sort((a,b)=>a-b)[0]||0;
 let natureMana=0,natureUptime=0,natureStops=0;
 const buffs={nature:0,ghost:0,step:0,adapt:0,decay:0,selfBoost:0,light:0,wind:0},dots={},effectEvents=[];
 let lightStarted=0,lightDirected=false;
 let markEnd=0,markPool=0,markExplosive=false,markSource=null,procWindow=-1,procCount=0;
 const duration=n=>n*(1+p.buffDuration/100),curseDuration=n=>n+(has(PASS.duration)?3.3:0);
 const activeDot=key=>dots[key]&&dots[key].end>t;
 const dotStacks=()=>activeDot('touch')?dots.touch.stacks:0;
 const weak=()=>dotStacks()>0||activeDot('area')||buffs.decay>t||markEnd>t||slow>t;
 const add=(id,value,hits=0)=>{if(t>=300||value<=0)return;total+=value;damage[id]=(damage[id]||0)+value;if(detail)damageEvents.push({time:+t.toFixed(2),id,value});bins[Math.min(29,Math.floor(t/10))]+=value;if(markEnd>t&&id!=='mark-explosion')markPool+=value;if(has(PASS.pact)&&(activeDot('touch')||activeDot('area')))hp=Math.min(p.hp,hp+value*.174);};
 const opts=(dot=false,off=false)=>({dot,off,maxBonus:lightBonusAt(t,lightStarted,buffs.light,lightDirected,p)+(off&&has(PASS.ambi)&&!p.sheetIncludesPassives?40:0),critBonus:off&&has(PASS.ambi)?90:0,critDamageBonus:buffs.step>t?20:0,boostBonus:(buffs.selfBoost>t?p.selfSkillBoost:0)+(buffs.adapt>t?19:0),resistanceDrop:buffs.decay>t?p.targetResistanceDrop:0,bonus:(has(PASS.bonus)&&!p.sheetIncludesPassives?13:0)+(buffs.adapt>t?26:0)});
 const offchance=(s)=>clamp(p.offhand/100+(buffs.ghost>t?1:0)+(s?.key==='shot'&&sp(s,3)?.3:0),0,1);
 const hitValue=(s,c,f,dot=false,mult=1)=>expectedHit(p,s.weapon,c,f,{...opts(dot),skillMultiplier:s.pve*mult});
 function reduce(amount){for(const s of list)if(s.key!=='ghost'||has(PASS.thirst))cd[s.id]=Math.max(t,cd[s.id]-amount);}
 function weaken(stacks=1){
  if(!has(PASS.thirst)&&buffs.ghost<=t)return;
  const window=Math.floor(t);if(window!==procWindow){procWindow=window;procCount=0;}
  if(procCount++<10)reduce(stacks>1?.072:.36);
 }
 function procGale(s,hits){
  if(!((s.key==='rapid'&&sp(s,1))||(s.key==='barrage'&&sp(s,3))||(s.key==='shot'&&sp(s,1))))return;
  if(galeEnd<=t)gale=0;
  const count=hits*((s.key==='shot'?2:1)+(buffs.wind>t?1:0));gale+=count;galeEnd=t+6;weaken(gale);
  while(gale>=10){gale-=10;add('gale',hitValue(s,1.5,30));}
 }
 function direct(s,c,f,count=1,{projectile=true,off=true,mult=1,hitMultiplier=1}={}){
  const extra=s.weapon==='Crossbow'&&off?offchance(s):0;
  const value=(hitValue(s,c,f,false,mult)+extra*expectedHit(p,s.weapon,c,f,{...opts(false,true),skillMultiplier:s.pve*mult}))*count*hitMultiplier;
  const hits=count*(1+extra)*hitMultiplier;add(s.id,value,hits);
  if(markEnd>t&&!markExplosive){add('mark-hit',hitValue(markSource,.23,15)*hits);}
  if(projectile)natureProc(hits);
  if(has(PASS.thirst)||buffs.ghost>t){for(const d of Object.values(dots))if(d.end>t)d.end+=.05*hits;if(buffs.decay>t)buffs.decay+=.05*hits;if(markEnd>t)markEnd+=.05*hits;}
  procGale(s,hits);
 }
 function enqueue(at,fn){pending.push({at,fn});pending.sort((a,b)=>a.at-b.at);}
 function dotDamage(d){return hitValue(d.s,d.c,d.f,true)*d.stacks*(has(PASS.night)&&p.night?1.36:1);}
 function putDot(key,s,c,f,seconds,stacks=1){
  const previous=dots[key];dots[key]={s,c,f,end:t+curseDuration(seconds),next:previous&&previous.end>t?previous.next:t+1,stacks};weaken(stacks);
 }
 function markBoom(){if(markPool>0)add('mark-explosion',markPool*(markExplosive?.4:.1));markPool=0;markEnd=0;}
 function effect(s){
  switch(s.key){
   case 'touch':{const old=dotStacks(),stacks=Math.min(3,old+(sp(s,3)?1.5:1));putDot('touch',s,.41,37,9+(sp(s,2)?3:0)+(old>=3?2:0),stacks);break;}
   case 'area':putDot('area',s,sp(s,1)?.60:.65,sp(s,1)?22:73,9);if(sp(s,3))direct(s,2.6,0,1,{projectile:false,off:false});break;
   case 'burst':{
    direct(s,4.2,272,1,{projectile:false,off:false});const stacks=dotStacks();
    if(stacks||activeDot('area')){let rest=0;for(const d of Object.values(dots))if(d.end>t){const ticks=Math.max(0,Math.floor((d.end-d.next)+1e-8)+1);rest+=dotDamage(d)*ticks;}
     add('curse-explosion',rest*(1+(sp(s,2)?.10:.05)*stacks)*(sp(s,1)?.5:1));if(!sp(s,1))for(const d of Object.values(dots))d.end=t;
    }break;}
   case 'decay':{
    const self=sp(s,1),key=self?'selfBoost':'decay';
    buffs[key]=t+(self?duration(9+(sp(s,2)?p.selfDurationExtension:0)):curseDuration(9+(sp(s,2)?3:0)));
    if(!self)weaken();
    if(detail)effectEvents.push({time:t,end:buffs[key],id:s.id,target:self?'self':'enemy',stat:self?'skillBoost':'skillResistance',value:self?p.selfSkillBoost:-p.targetResistanceDrop});
    break;
   }
   case 'spread':if(sp(s,3))direct(s,2*(Number(!!activeDot('touch'))+Number(!!activeDot('area'))+Number(buffs.decay>t)),0,1,{projectile:false,off:false});if(sp(s,1)){for(const d of Object.values(dots))if(d.end>t)d.end+=5;if(buffs.decay>t)buffs.decay+=5;}break;
   case 'mark':if(markEnd>t)markBoom();direct(s,2.8,109);markEnd=t+3;markExplosive=sp(s,2);markSource=s;markPool=0;weaken();break;
   case 'step':charges=Math.min(3,charges+1);buffs.step=t+duration(.5);if(has(PASS.adapt))buffs.adapt=t+duration(3);if(sp(s,1))buffs.wind=t+3;if(sp(s,3)&&cd[IDS.rapid]!==undefined)cd[IDS.rapid]=t;break;
   case 'nature':if(natureElement&&mana>=p.mana*.1)buffs.nature=Infinity;break;
   case 'ghost':buffs.ghost=t+duration(6);break;
   case 'rapid':{const count=sp(s,2)?4:3,boost=weak(),mult=sp(s,3)?1.2:1;for(let i=0;i<count;i++)enqueue(t+i*.12,()=>{direct(s,boost?1.7:1.5,boost?39:32,1,{mult});if(sp(s,4))cd[s.id]=Math.max(t,cd[s.id]-(s.cooldownSec+(sp(s,3)?3:0))*.1*chance(p.critR,p.ratingK)/(1+p.cooldown/100));});break;}
   case 'mana':hp-=450*(sp(s,1)?2:1);mana=Math.min(p.mana,mana+590*(sp(s,1)?2:1));break;
   case 'buck':direct(s,2.9,99);if(cd[IDS.step]!==undefined)cd[IDS.step]=Math.max(t,cd[IDS.step]-15);if(!sp(s,1)){slow=t+3;weaken();}break;
   case 'barrage':{const dur=Math.max(.5,(s.cast-s.hitDelay)/(1+p.speed/100));for(let i=0;i<32;i++)enqueue(t+i*dur/32,()=>direct(s,.27,17,1,{off:false,hitMultiplier:1+.5*offchance(s),mult:1+.08*Math.min(i,10)}));break;}
   case 'shot':{const over=sp(s,2)&&charges>=3;charges-=over?3:1;direct(s,over?6:3.1,over?12:32);break;}
   case 'weak':direct(s,5,135);break;
   case 'trap':enqueue(t+2,()=>{direct(s,6,165,1,{projectile:false,off:false});slow=t+3;weaken();});break;
   case 'laser':{
    // The skill has a normal 1.7 s cast, then a 6 s link with one hit every
    // 0.5 s. The link is a background damage effect: it must not block other
    // skills after the initial cast. Concentrated Beam halves both duration
    // and tick count while doubling its damage.
    const duration=sp(s,4)?3:6,count=sp(s,4)?6:12;
    // effect() already runs at the impact time; do not add hitDelay again.
    for(let i=0;i<count;i++)enqueue(t+(i+1)*duration/count,()=>direct(s,.82,20,1,{off:false,projectile:false,mult:1.3*(1+p.healing/200)*(sp(s,4)?2:1)}));
    break;
   }
   case 'light':if(sp(s,1)){lightStarted=t;lightDirected=sp(s,2);buffs.light=t+duration(6+(sp(s,3)?1:0));if(detail)effectEvents.push({time:t,end:buffs.light,id:s.id,target:'self',stat:'maxDamage',value:p.lightMaxBonus});}break;
  }
 }
 function eligible(s){
  if(cd[s.id]>t+1e-7)return false;
  if(s.key==='nature'&&(!natureElement||mana<Math.max(23,p.mana*.25)))return false;
  if(s.key==='shot'&&charges<=0)return false;
  if(s.key==='mana'&&(mana>p.mana-590*(sp(s,1)?2:1)||hp<=450*(sp(s,1)?2:1)))return false;
  if(s.key==='touch'&&dotStacks()>=3&&dots.touch.end-t>3)return false;
  if(s.key==='area'&&activeDot('area')&&dots.area.end-t>3)return false;
  if(s.key==='burst'&&dotStacks()<burstStacks&&list.some(x=>x.key==='touch')&&t<295)return false;
  if(s.key==='spread'&&(!sp(s,1)&&!sp(s,3)||!activeDot('touch')&&!activeDot('area')))return false;
  if(s.key==='light'&&!sp(s,1))return false;
  if(s.key==='decay'&&sp(s,1)&&buffs.selfBoost>t)return false;
  if(['nature','ghost','decay','light'].includes(s.key)&&buffs[s.key]>t)return false;
  return true;
 }
 if(natureSkill&&natureElement&&p.mana>0){buffs.nature=Infinity;counts[IDS.nature]=1;if(detail)logs.push({time:0,id:IDS.nature,name:'Гнев природы — включение до боя',mana:Math.round(mana),duration:0});}
 function natureProc(hits){
  if(buffs.nature<=t)return;
  if(mana<p.mana*.1||mana<23){buffs.nature=0;natureStops++;return;}
  const funded=Math.max(0,Math.min(hits,Math.floor((mana-p.mana*.1)/23)+1,mana/23));
  mana-=23*funded;natureMana+=23*funded;minMana=Math.min(minMana,mana);
  const coefficient={1:.21,2:.21,3:.28,4:.30}[natureElement];
  add('nature-hit',expectedHit(p,'Crossbow',coefficient,0,opts())*funded);
  if(natureElement===4)add('nature-lightning',expectedHit(p,'Crossbow',1.2,0,opts())*.145*funded);
  // Wind/cold: direct charge only; secondary behavior remains outside this model.
  // Fire DoT is deliberately not synthesized from an absent tooltip.

  if(mana<p.mana*.1){buffs.nature=0;natureStops++;}
 }
 for(let tick=0;tick<6000;tick++){
  t=tick*.05;mana=Math.min(p.mana,mana+p.regen/p.regenPeriod*.05);
  if(buffs.nature>t&&mana<p.mana*.1){buffs.nature=0;natureStops++;}if(buffs.nature>t)natureUptime+=.05;
  if(markEnd&&markEnd<=t)markBoom();
  while(pending.length&&pending[0].at<=t+1e-7)pending.shift().fn();
  for(const d of Object.values(dots))if(d.next<=t+1e-7&&d.next<=d.end+1e-7){add(d.s.id,dotDamage(d));d.next+=1;}
  if(t+1e-7<busy)continue;
  let chosen=natureSkill&&eligible(natureSkill)?natureSkill:null,unfunded=false;
  for(const s of list)if(!chosen&&eligible(s)){const cost=s.manaCost/(1+p.efficiency/100);if(mana+1e-7>=cost){chosen=s;break;}unfunded=true;}
  if(chosen){
   const s=chosen,speed=1+(p.speed+(buffs.step>t?20:0))/100;
   const cast=Math.max(p.animationFloor,s.cast/speed)+p.latency;
   if(t+Math.min(cast,Math.max(.05,s.hitDelay/speed))>=300)continue;
   mana-=s.manaCost/(1+p.efficiency/100);minMana=Math.min(minMana,mana);
   let cooldown=s.cooldownSec;if(s.key==='laser'&&sp(s,3))cooldown-=6;if(s.key==='rapid'&&sp(s,3))cooldown+=3;if(s.key==='buck')cooldown+=sp(s,1)?-6:sp(s,2)?9:0;if(s.key==='burst'&&sp(s,3))cooldown-=6;if(s.key==='weak'&&sp(s,2))cooldown*=.8;if(s.key==='mana'&&sp(s,1))cooldown*=2;
   if(has(PASS.night)&&p.night&&['touch','area','burst','decay','spread'].includes(s.key))cooldown*=.9;
   cd[s.id]=t+Math.max(.05,cooldown/(1+p.cooldown/100));busy=t+cast;counts[s.id]=(counts[s.id]||0)+1;
   if(detail)logs.push({time:+t.toFixed(2),id:s.id,name:s.key==='decay'?(sp(s,1)?'Час преодоления — на себя':'Час отмщения — на цель'):s.key==='light'?'Свет доблести — на себя':s.name,mana:Math.round(mana),duration:cast});
   enqueue(t+Math.min(cast,Math.max(.05,s.hitDelay/speed)),()=>effect(s));
  }else{
   if(unfunded)starved+=.05;
   if(p.auto&&t+1e-7>=nextAuto){const s={id:'auto',weapon:'Crossbow',pve:1,key:'auto',specs:[]};const extra=offchance(s);const v=expectedHit(p,'Crossbow',1,0,{...opts(),skill:false,skillMultiplier:1+.1*dotStacks()})+extra*expectedHit(p,'Crossbow',1,0,{...opts(false,true),skill:false,skillMultiplier:1+.1*dotStacks()});add('auto',v);natureProc(1+extra);if(markEnd>t&&!markExplosive)add('mark-hit',hitValue(markSource,.23,15)*(1+extra));if(has(PASS.thirst)||buffs.ghost>t){for(const d of Object.values(dots))if(d.end>t)d.end+=.05*(1+extra);if(markEnd>t)markEnd+=.05*(1+extra);if(buffs.decay>t)buffs.decay+=.05*(1+extra);}nextAuto=t+p.interval;}
  }
 }
 return {total,dps:total/300,counts,damage,logs,damageEvents,effectEvents,bins,minMana,mana,hp,starved,natureMana,natureUptime,natureStops,natureElement,priority,burstStacks};
}
function optimizeFixed(input,progress=()=>{}){
 const all=models(input.catalog,input.state,input.overrides).filter(s=>(s.key!=='light'||s.specs.includes(1))&&(s.key!=='nature'||s.specs.length>0));
 const pool=input.mode==='all'?all.map(s=>s.id):input.state.active.filter(id=>all.some(s=>s.id===id));
 const selected=input.state.active.filter(id=>pool.includes(id));
 const initial=selected.length?selected:pool.slice(0,12);
 const run=(priority,burstStacks=3)=>simulate({...input,priority,burstStacks});
 const baseline=run(initial);let best=baseline,seed=78231;
 const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 const budget=Math.max(20,Math.min(600,input.budget||180));let tested=1;
 for(let i=0;i<budget;i++){
  let order=[...best.priority],stacks=best.burstStacks;
  if(i%15===0){order=[...pool];for(let j=order.length-1;j>0;j--){const k=Math.floor(random()*(j+1));[order[j],order[k]]=[order[k],order[j]];}order=order.slice(0,12);}
  const kind=Math.floor(random()*5);
  if(kind===0&&order.length>1){const a=Math.floor(random()*order.length),b=Math.floor(random()*order.length);[order[a],order[b]]=[order[b],order[a]];}
  else if(kind===1&&order.length>1&&input.mode==='all')order.splice(Math.floor(random()*order.length),1);
  else if(kind===2){const choices=pool.filter(id=>!order.includes(id));if(choices.length){const id=choices[Math.floor(random()*choices.length)];if(order.length>=12)order[Math.floor(random()*order.length)]=id;else order.splice(Math.floor(random()*(order.length+1)),0,id);}}
  else if(kind===3&&order.length>1){const [id]=order.splice(Math.floor(random()*order.length),1);order.splice(Math.floor(random()*(order.length+1)),0,id);}
  else stacks=1+Math.floor(random()*3);
  const cost=all.filter(s=>order.includes(s.id)).reduce((sum,s)=>sum+s.specializations.filter(t=>input.state.specs[s.id]?.includes(t.id)).reduce((n,t)=>n+t.cost,0),0);if(cost>100)continue;
  const trial=run(order,stacks);tested++;if(trial.total>best.total)best=trial;
  if(i%10===0)progress({done:i+1,budget,dps:best.dps});
 }
 return {...simulate({...input,priority:best.priority,burstStacks:best.burstStacks},true),baseline:baseline.dps,tested};
}

// Enumerate legal supported choices per skill, then solve an exact budget by DP.
// Nature is deliberately a single precombat element (no cycling in this engine).
export function specializationOptions(catalog,id){
 const key=Object.keys(IDS).find(k=>IDS[k]===id);
 const ts=(catalog.skills.find(s=>s.id===id)?.specializations||[]).filter(t=>SUPPORTED_SPECS[key]?.includes(Number(t.id.split('_').at(-1)))&&['DPS','dps','cooldown','resource'].includes(specializationRole(id,Number(t.id.split('_').at(-1)))));
 const out=[];
 for(let mask=0;mask<2**ts.length;mask++){
  const chosen=ts.filter((_,i)=>mask&(1<<i)),ns=chosen.map(t=>Number(t.id.split('_').at(-1)));
  if(key==='nature'&&ns.length!==1)continue;
  if(key==='light'&&!ns.includes(1))continue;
  if((key==='buck'&&ns.includes(1)&&ns.includes(2))||(key==='decay'&&ns.includes(1)&&ns.includes(3)))continue;
  out.push({ids:chosen.map(t=>t.id),cost:chosen.reduce((n,t)=>n+Number(t.cost),0),utility:chosen.filter(t=>['utility','defensive'].includes(specializationRole(id,Number(t.id.split('_').at(-1))))).reduce((n,t)=>n+t.cost,0)});
 }
 return out;
}
export function allocateSpecializations(catalog,priority,preferred={},random=()=>.5,target=100){
 let dp=new Map([[0,{score:0,specs:{}}]]);
 for(const id of priority){
  const options=specializationOptions(catalog,id).map(o=>({...o,score:-10000*o.utility+o.ids.reduce((n,t)=>n+(preferred[id]?.includes(t)?10:0)+random(),0)- (preferred[id]||[]).filter(t=>!o.ids.includes(t)).length*10}));
  const next=new Map();
  for(const [spent,prev] of dp)for(const o of options){const cost=spent+o.cost;if(cost>target)continue;const score=prev.score+o.score;if(!next.has(cost)||score>next.get(cost).score)next.set(cost,{score,specs:{...prev.specs,[id]:o.ids}});}
  dp=next;
 }
 return [...dp.entries()].sort((a,b)=>b[1].score-a[1].score||a[0]-b[0])[0]?.[1].specs||null;
}
// Independent, reproducible starting panels. These are search controls, not a
// claim that a particular community build must win on every character.
export function referenceConfigurations(catalog,target=100){
 const result=[];
 for(const preserve of [false,true])for(const stacks of [1,2,3]){
  const keys=['nature','mana','light','decay','ghost','mark','touch','area','spread','burst','laser','rapid'];
  const priority=keys.map(k=>IDS[k]);
  const ns={nature:[4],mana:[1],light:[1],decay:[1],ghost:[],mark:[2],touch:[2,3],area:[3],spread:[1,3],burst:preserve?[1,2,3]:[2,3],laser:[3,4],rapid:[]};
  const preferred=Object.fromEntries(keys.map(k=>[IDS[k],catalog.skills.find(s=>s.id===IDS[k]).specializations.filter(t=>ns[k].includes(Number(t.id.split('_').at(-1)))).map(t=>t.id)]));
  const specs=allocateSpecializations(catalog,priority,preferred,()=>0,target);
  if(specs)result.push({name:`Проклятия + усиления · ${preserve?'сохранение':'снятие'} · ${stacks} ур.`,priority,specs,burstStacks:stacks});
 }
 return result;
}
export function interactionComparison(input,result){
 const replay={...input,state:{...input.state,active:result.priority,specs:result.specs||input.state.specs},priority:result.priority,burstStacks:result.burstStacks};
 // Leave the buff casts, costs and uptime intact. Disable only their numerical
 // bonuses; removing their buttons would also change opportunity costs.
 const without=simulate({...replay,params:{...input.params,lightMaxBonus:0,selfSkillBoost:0}});
 return {withoutPersonalBonuses:without.dps,personalBonusDelta:result.dps-without.dps};
}
export function optimize(input,progress=()=>{}){
 if(input.mode!=='all'){const result={...optimizeFixed(input,progress),specs:structuredClone(input.state.specs)};return {...result,interaction:interactionComparison(input,result)};}
 let seed=78231;const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const pool=Object.values(IDS);
 const fixedIds=[...(input.state.passive||[]),...(input.state.defensive||[])].filter(Boolean);
 const fixedSpecs=Object.fromEntries(fixedIds.map(id=>[id,input.state.specs[id]||[]]));
 const fixedCost=input.catalog.skills.filter(s=>fixedIds.includes(s.id)).reduce((n,s)=>n+(s.specializations||[]).filter(t=>fixedSpecs[s.id]?.includes(t.id)).reduce((a,t)=>a+Number(t.cost),0),0);
 const target=100-fixedCost;if(target<0)throw new Error('Специализации фиксированных умений превышают 100 очков.');
 const original=input.state.active.filter(id=>pool.includes(id));
 const baseline=simulate({...input,priority:original});
 const run=(priority,specs,burstStacks=3,detail=false)=>simulate({...input,state:{...input.state,active:priority,specs:{...fixedSpecs,...specs}},priority,burstStacks},detail);
 let initial=[...new Set([...original,...pool])].slice(0,12),allocation=allocateSpecializations(input.catalog,initial,input.state.specs,random,target);
 if(!allocation)throw new Error('Не удалось подобрать специализации в пределах 100 очков.');
 let best=run(initial,allocation),bestSpecs=allocation,tested=1;
 const pointsOf=specs=>input.catalog.skills.reduce((n,s)=>n+(s.specializations||[]).filter(t=>specs[s.id]?.includes(t.id)).reduce((a,t)=>a+Number(t.cost),0),0);
 const originalSpecs=Object.fromEntries(original.map(id=>[id,input.state.specs[id]||[]]));
 const frontier=[],referenceTrials=[];
 function remember(trial,specs){
  const key=JSON.stringify([trial.priority,specs,trial.burstStacks]);
  if(!frontier.some(x=>x.key===key)){
   frontier.push({key,priority:trial.priority,specs,burstStacks:trial.burstStacks,total:trial.total});
   frontier.sort((a,b)=>b.total-a.total);frontier.length=Math.min(12,frontier.length);
  }
  if(trial.total>best.total){best=trial;bestSpecs=specs;}
 }
 remember(best,bestSpecs);
 if(pointsOf(originalSpecs)<=target){remember(run(original,originalSpecs),originalSpecs);tested++;}
 for(const reference of referenceConfigurations(input.catalog,target)){
  const trial=run(reference.priority,reference.specs,reference.burstStacks);tested++;
  referenceTrials.push({...reference,dps:trial.dps});remember(trial,reference.specs);
 }
 const budget=Math.max(20,Math.min(600,input.budget||180));
 const supportTrials=[];
 let curseSearch={tested:0,bestDps:0};
 function refine(){
 // Explicitly evaluate support actions before damage actions. Appending a buff
 // to a saturated priority list can starve it and falsely suggest it is useless.
 const support=[IDS.light,IDS.decay,IDS.ghost,IDS.step,IDS.nature,IDS.mana];
 const points=specs=>input.catalog.skills.reduce((n,s)=>n+(s.specializations||[]).filter(t=>specs[s.id]?.includes(t.id)).reduce((a,t)=>a+Number(t.cost),0),0);
 // Test curse packages together: individual additions can lose before their
 // complementary DoT/explosion skills and specializations are present.
 const trait=(id,ns)=>(input.catalog.skills.find(s=>s.id===id)?.specializations||[]).filter(t=>ns.includes(Number(t.id.split('_').at(-1)))).map(t=>t.id);
 for(const group of [[IDS.touch,IDS.burst],[IDS.touch,IDS.area,IDS.burst],[IDS.touch,IDS.area,IDS.spread,IDS.burst]]){
  const base=best.priority.filter(id=>!group.includes(id)).slice(0,12-group.length);
  for(const preserve of [false,true])for(const stacks of [1,2,3]){
   const locked=Object.fromEntries(group.map(id=>[id,trait(id,id===IDS.touch?[2,3]:id===IDS.burst?(preserve?[1,2,3]:[2,3]):id===IDS.area?[3]:[1,3])]));
   const cost=points(locked);if(cost>target)continue;
   const remaining=allocateSpecializations(input.catalog,base,bestSpecs,()=>0,target-cost);if(!remaining)continue;
   const next={...remaining,...locked};
   for(const position of [0,Math.min(2,base.length)]){
    const order=[...base];order.splice(position,0,...group);
    const trial=run(order,next,stacks);tested++;curseSearch.tested++;
    curseSearch.bestDps=Math.max(curseSearch.bestDps,trial.dps);
    remember(trial,next);
   }
  }
 }
 for(let pass=0;pass<2;pass++)for(const id of support){
  const before=best.dps;
  const rest=best.priority.filter(x=>x!==id);
  const bases=rest.length<12?[rest]:rest.map((_,i)=>rest.filter((x,j)=>j!==i));
  for(const base of bases)for(const option of specializationOptions(input.catalog,id)){
   const preferred=Object.fromEntries(base.map(key=>[key,bestSpecs[key]||[]]));preferred[id]=option.ids;
   // Reserve points for this specific buff configuration before reallocating others.
   if(option.cost>target)continue;
   let others=allocateSpecializations(input.catalog,base,preferred,()=>0,target-option.cost);
   if(!others)continue;
   const next={...others,[id]:option.ids};
   for(const position of [0,1,2].filter(n=>n<=base.length)){
    const order=[...base];order.splice(position,0,id);
    const trial=run(order,next,best.burstStacks);tested++;
    remember(trial,next);
   }
  }
  supportTrials.push({id,pass,before,after:best.dps});

 }
 // Remove actions and specializations that do not improve this five-minute fight.
 let improved=true;while(improved){improved=false;
  for(const id of [...best.priority]){
   const order=best.priority.filter(x=>x!==id),next={...bestSpecs};delete next[id];
   const trial=run(order,next,best.burstStacks);tested++;
   if(trial.total>=best.total){best=trial;bestSpecs=next;improved=true;}
  }
  for(const id of best.priority)for(const t of [...(bestSpecs[id]||[])]){
   const next={...bestSpecs,[id]:bestSpecs[id].filter(x=>x!==t)};
   if(!specializationOptions(input.catalog,id).some(o=>JSON.stringify(o.ids)===JSON.stringify(next[id])))continue;
   const trial=run(best.priority,next,best.burstStacks);tested++;
   if(trial.total>=best.total){best=trial;bestSpecs=next;improved=true;}
  }
 }
 }
 refine();
 for(let i=1;i<budget;i++){
  let order=[...best.priority],preferred=structuredClone(bestSpecs),stacks=best.burstStacks;
  // Explore several complete builds, including temporarily weaker alternatives.
  // A single greedy incumbent cannot cross a dip before a synergy pays off.
  if(i%4===0){const parent=frontier[Math.floor(random()*frontier.length)];order=[...parent.priority];preferred=structuredClone(parent.specs);stacks=parent.burstStacks;}
  if(i%9===0&&referenceTrials.length){const parent=referenceTrials[Math.floor(random()*referenceTrials.length)];order=[...parent.priority];preferred=structuredClone(parent.specs);stacks=parent.burstStacks;}
  if(!order.length){order=[pool[Math.floor(random()*pool.length)]];preferred={};}
  if(i%20===0){order=shuffle([...pool]).slice(0,1+Math.floor(random()*12));preferred={};}
  else if(i%7===0&&order.length>1){order.splice(Math.floor(random()*order.length),1);}
  else if(i%11===0&&order.length<12){const choices=pool.filter(id=>!order.includes(id));if(choices.length)order.push(choices[Math.floor(random()*choices.length)]);}
  else if(i%3===0){const a=Math.floor(random()*order.length),b=Math.floor(random()*order.length);[order[a],order[b]]=[order[b],order[a]];if(random()<.4)stacks=1+Math.floor(random()*3);}
  else if(i%5===0){const choices=pool.filter(id=>!order.includes(id));if(choices.length)order[Math.floor(random()*order.length)]=choices[Math.floor(random()*choices.length)];}
  else {for(let j=0;j<1+Math.floor(random()*3);j++){const id=order[Math.floor(random()*order.length)],opts=specializationOptions(input.catalog,id);preferred[id]=opts[Math.floor(random()*opts.length)].ids;}}
  const specs=allocateSpecializations(input.catalog,order,preferred,random,target);
  if(specs){const trial=run(order,specs,stacks);tested++;remember(trial,specs);}
  if(i%20===19)refine();
  if(i%10===0)progress({done:i,budget,dps:best.dps});
 }
 const specs={...fixedSpecs,...bestSpecs},state={...input.state,active:best.priority,specs};
 const specPoints=input.catalog.skills.reduce((sum,s)=>sum+(s.specializations||[]).filter(t=>specs[s.id]?.includes(t.id)).reduce((n,t)=>n+Number(t.cost),0),0);
 const result={...run(best.priority,bestSpecs,best.burstStacks,true),specs,specPoints,supportTrials,curseSearch,referenceTrials,utilityPoints:specializationUtility(input.catalog,specs),baseline:baseline.dps,tested,warnings:coverage(state,input.catalog)};
 return {...result,interaction:interactionComparison(input,result)};
}
