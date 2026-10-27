import {eventInfo,breakdown} from './damage-attribution.js?v=damage-model-20261027b';
import {combatRatings} from './position-combat.js?v=full-audit-20261016';
import {Bloodlust,cooldownSeconds,offhandChance,rapidOffhandChances,masteryEffects,signedChance,weakenProbability,remainingCooldownFactor,nightMultiplier,actionDuration} from './combat-mechanics.js?v=full-audit-20261016';
import {weaponEffects,WEAPON_EFFECTS,ProcDot} from './weapon-effects.js?v=full-audit-20261016';
import {commonSelection,commonWarnings,COMMON_IDS} from './common-mastery.js?v=full-audit-20261016';
// Experimental expected-value PvE model. No claim of a verified RU combat engine.
import {gearStats,itemStats,weaponRange,ATTRS,totalAttributes,conditionalSetStats,setPassives} from './engine.js?v=full-audit-20261016';

import {TREES,normalizeTree,treeStats,treeWarnings} from './mastery-tree.js?v=full-audit-20261016';
export const IDS={mark:'WP_CR_CR_S_ArmorBreakShot',step:'WP_CR_CR_S_Step',nature:'WP_CR_CR_S_AddProjectile',rapid:'WP_CR_CR_S_RapidShot',mana:'WP_CR_CR_S_BloodToSoul',ghost:'WP_CR_S_GhostWalk',buck:'WP_CR_CR_S_BuckShot',barrage:'WP_CR_FuriousFire',shot:'WP_CR_D_AddShot',weak:'WP_CR_D_WeakPointShot',trap:'WP_CR_TauntTrap',touch:'WP_WA_GR_S_Corruption',decay:'WP_WA_GR_S_Decay',burst:'WP_WA_GR_S_CurseBurst',area:'WP_WA_GR_S_CurseArea',spread:'WP_WA_GR_S_CurseSpread',light:'WP_WA_GR_S_DefenseUp',laser:'WP_WA_GR_S_LinkLaser',wind:'WP_CR_D_RobShot',heal:'WP_WA_GR_S_Heal',healAll:'WP_WA_GR_S_HealAll',sleep:'WP_WA_GR_S_Sleep',healField:'WP_WA_GR_S_HealField',shield:'WP_WA_GR_S_MagicShield'};
export const PASS={thirst:'WP_CR_CR_S_WeakenAttackBonus',adapt:'WP_CR_CR_S_PeaceTimeBuff',ambi:'WP_CR_S_OffHandMaxDmg',bonus:'WP_CR_S_CriticalAttack',duration:'WP_WA_GR_S_CurseDuration',night:'WP_WA_GR_S_DayHealNightCurse',pact:'WP_WA_GR_S_CurseAttackHeal'};
// Stored levels are Epic 1–5; missing levels retain the previous Epic 5 default.
export function passiveLevel(state,id){const value=Number(state.passiveLevels?.[id]);return Number.isFinite(value)&&value>=1?Math.min(5,Math.trunc(value)):5;}
export function passiveValue(state,catalog,id,label,fallback){
 const row=catalog.skills.find(s=>s.id===id)?.levelProgression?.find(r=>r.label.trim()===label);
 const value=row?.values?.[passiveLevel(state,id)-1]?.match(/^([\d]+(?:[.,]\d+)?)/);
 return value?Number(value[1].replace(',','.')):fallback;
}
const REVIVAL='WP_WA_GR_S_HealEfficiencyByMaxCost';
const masteryActive=(state,key,id)=>Boolean(normalizeTree(TREES[key],state.masteryTrees?.[key])[id]);
export function passiveSheetEffects(state,catalog,mana){
 const has=id=>(state.passive||[]).includes(id),value=(id,label,fallback)=>passiveValue(state,catalog,id,label,fallback);
 const revenge=has(REVIVAL)&&masteryActive(state,'WA_GR','Wand_High_Attack_Skill');
 const revival=has(REVIVAL)?value(REVIVAL,'Эффективность исцеления ▲',3.02)*mana/1000:0;
 const advantage=has(PASS.ambi)&&masteryActive(state,'CR','Crossbow_High_Attack_Skill');
 return {revival,healingMultiplier:revenge?.7:1,baseDamagePercent:revenge?revival*.25:0,
  offMaxBonus:has(PASS.ambi)?value(PASS.ambi,'Макс. урон парного оружия ▲',40)+(advantage?30:0):0,
  offChanceBonus:advantage?-4:0,bonus:has(PASS.bonus)?value(PASS.bonus,'Дополнит. урон ▲',13):0,staminaRegen:has(PASS.bonus)?value(PASS.bonus,'Восстановление выносливости',6):0,
  weaken:has('WP_CR_S_WeakenAccuracy')?value('WP_CR_S_WeakenAccuracy','Ослабление ▲',205):0};
}
export const DEFAULTS={targetIsBoss:0,stepDuration:1,accuracyR:0,accuracyM:0,weaken:0,evasion:0,endurance:0,heavyEvasion:0,weakenResistance:0,controlImmune:1,giantBlessing:0,enemyMana:0,incomingDps:0,furyInterval:0,enemyAttacks:0,moving:0,killInterval:0,targetDistance:0,targetHealth:100,rangeDamage:0,magicDamage:0,crossMin:0,crossMax:0,offMin:0,offMax:0,wandMin:0,wandMax:0,critR:0,critM:0,heavyR:0,heavyM:0,critDamage:0,boost:0,bonus:0,cooldown:0,speed:0,offhand:0,interval:0.5,mana:5175,regen:6,regenPeriod:10,efficiency:0,hp:5175,buffDuration:0,night:0,defense:0,defenseK:2500,ratingK:1000,species:0,pve:1,dotCrit:1,auto:1,animationFloor:0.25,latency:0,healing:0,sheetIncludesPassives:0,baseDamagePercent:0};
export const SCREENSHOT={crossMin:87,crossMax:400,offMin:71,offMax:376,wandMin:166,wandMax:491,offhand:32.8,healing:3.6,critR:1371.2,critM:1437.2,heavyR:337,heavyM:409,critDamage:9,boost:130.5,bonus:25,cooldown:43.8,speed:27.66,interval:0.340,mana:12523,regen:661.75,efficiency:41.51,hp:16613,buffDuration:33.25};
export const SUPPORTED_SPECS={mark:[1,2,3],step:[1,2,3,4],nature:[1,2,3,4],rapid:[1,2,3,4],mana:[1,2,3],ghost:[2,3,4],buck:[1,2],barrage:[3],shot:[1,2,3],weak:[1,2],trap:[1,2,3],touch:[1,2,3],decay:[1,2,3],burst:[1,2,3],area:[1,2,3],spread:[1,2,3],light:[1,2,3],laser:[1,2,3,4],wind:[1,2],heal:[1,2,3,4],healAll:[1,2,3],sleep:[1,2,3],healField:[1,2,3],shield:[1,2,3]};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const BUFF_DEFAULTS={resistance:0,selfSkillBoost:220,selfDurationExtension:3,targetResistanceDrop:220,lightMaxBonus:92,lightOpeningMultiplier:1,lightOpeningSeconds:2};
export const ROLE_LABELS={DPS:'Урон',cooldown:'Откат',resource:'Ресурс',utility:'Вспомогательный',defensive:'Защита',unsupported:'Не подтверждён'};
export function lightBonusAt(time,start,end,directed,params){return time>=start&&time<end?params.lightMaxBonus*(!directed&&time<start+params.lightOpeningSeconds?params.lightOpeningMultiplier:1):0;}
export function specializationRole(id,n){
 const key=Object.keys(IDS).find(k=>IDS[k]===id);
 const roles={wind:['utility','resource'],heal:['resource','resource','utility','resource'],healAll:['DPS','utility','utility'],sleep:['utility','utility','utility'],healField:['resource','utility','resource'],shield:['defensive','utility','defensive'],mark:['utility','DPS','utility'],step:['DPS','cooldown','cooldown','defensive'],nature:['DPS','DPS','DPS','DPS'],rapid:['DPS','DPS','DPS','cooldown'],mana:['resource','utility','utility'],ghost:['defensive','defensive','utility','DPS'],buck:['cooldown','utility'],barrage:['unsupported','unsupported','DPS'],shot:['DPS','DPS','DPS'],weak:['utility','cooldown'],trap:['utility','utility','utility'],touch:['utility','DPS','DPS'],decay:['DPS','DPS','utility'],burst:['DPS','DPS','cooldown'],area:['DPS','DPS','DPS'],spread:['DPS','utility','DPS'],light:['DPS','utility','DPS'],laser:['utility','utility','cooldown','DPS']};
 return roles[key]?.[n-1]||'unsupported';
}
export function specializationUtility(catalog,specs){return catalog.skills.reduce((sum,s)=>sum+(s.specializations||[]).filter(t=>specs[s.id]?.includes(t.id)&&['utility','defensive'].includes(specializationRole(s.id,Number(t.id.split('_').at(-1))))).reduce((n,t)=>n+t.cost,0),0);}
export const chance=(rating,k=1000)=>Math.max(0,rating)/(Math.max(0,rating)+k);
export function attackInterval(baseSeconds,dexPercent,speedPercent,dexSeconds=null){return Math.max(.001,baseSeconds+(dexSeconds??-Math.max(0,dexPercent)*.0067))/Math.max(.01,1+speedPercent/100);}
// Client-derived base level table: TL Codex gear builder, retrieved 2026-10-01.
// https://tlcodex.com/en/gearbuild/934/ : character level 55, stat IDs 163 (HP), 166 (MP).
export const LEVEL_55_BASE=Object.freeze({hp:6675,mana:5550});
function rawCharacterStats(state,catalog){
 const raw={...catalog.attributes.baseCharacter.stats};for(const [k,v] of Object.entries(gearStats(state,catalog)))raw[k]=(raw[k]||0)+v;
 const mastery=treeStats(state);for(const [k,v] of Object.entries(mastery))raw[k]=(raw[k]||0)+v;
 raw.cost_max=(raw.cost_max||0)+LEVEL_55_BASE.mana;
 raw.hp_max=(raw.hp_max||0)+LEVEL_55_BASE.hp;
 raw.cost_max-=masteryEffects(state).Crossbow_Hero_Util_02?1000:0;
 for(const entry of Object.values(state.items)){const item=catalog.equipment.find(x=>x.id===entry.id);if(item&&item.slot!=='Weapon'){const st=itemStats(item,entry.level,entry.traits,catalog,entry.resonanceId);for(const k of ['bonus_attack_power_main_hand','attack_power_main_hand'])raw[k]=(raw[k]||0)+(st[k]||0);}}
 const extras={Crossbow:{},Wand:{}},attributes=totalAttributes(state,catalog);let dexPercent=0,dexSeconds=null;
 for(const [attr] of ATTRS){
  const total=Math.trunc(attributes[attr]);
  const row=catalog.attributeStats[attr.toLowerCase()]?.[Math.min(100,total)]||{};
  for(const [k,v] of Object.entries(row)){if(attr==='dex'&&k==='attack_speed_main_hand'){dexSeconds=v*.001;continue;}if(attr==='dex'&&k==='attack_speed_modifier'){dexPercent=Math.max(0,(v-(catalog.attributeStats.dex?.[10]?.attack_speed_modifier||0))*.01);continue;}if(typeof v==='number')raw[k]=(raw[k]||0)+v;else for(const weapon of ['Crossbow','Wand'])extras[weapon][k]=(extras[weapon][k]||0)+(v[weapon.toLowerCase()]||0);}
  for(const m of catalog.attributes.milestones||[])if(m.attribute===attr.toUpperCase()&&total>=m.count)for(const b of m.bonuses)raw[b.stat]=(raw[b.stat]||0)+b.value;
 }
 for(const [k,v] of Object.entries(conditionalSetStats(state,catalog,attributes,raw)))raw[k]=(raw[k]||0)+v;
 return {raw,extras,dexPercent,dexSeconds,mastery};
}
export function deriveStats(state,catalog){
 const {raw,extras,dexPercent,dexSeconds,mastery}=rawCharacterStats(state,catalog),mx=masteryEffects(state);

 const val=k=>(raw[k]||0)*(catalog.formats[k]?.mul??1);
 const out={...DEFAULTS,accuracyR:val('all_accuracy')+val('range_accuracy'),accuracyM:val('all_accuracy')+val('magic_accuracy'),weaken:val('all_state_accuracy')+val('weaken_accuracy'),critR:val('all_critical_attack')+val('range_critical_attack'),critM:val('all_critical_attack')+val('magic_critical_attack'),heavyR:val('all_double_attack')+val('range_double_attack'),heavyM:val('all_double_attack')+val('magic_double_attack'),critDamage:val('critical_damage_dealt_modifier'),boost:val('skill_power_amplification'),bonus:val('damage_reduction_penetration'),cooldown:val('skill_cooldown_modifier'),speed:val('attack_speed_modifier'),mana:val('cost_max'),regen:val('cost_regen'),efficiency:val('cost_consumption_modifier'),hp:val('hp_max'),buffDuration:val('buff_given_duration_modifier')};
 for(const position of ['front','side','back'])for(const [name,stat] of [['Accuracy','accuracy'],['Crit','critical_attack'],['Heavy','double_attack']])out[position+name]=val(position+'_'+stat);
 for(const [suffix,type] of [['R','range'],['M','magic']])for(const [name,stat] of [['Accuracy','accuracy'],['Crit','critical_attack'],['Heavy','double_attack']])out['boss'+name+suffix]=val('boss_all_'+stat)+val('boss_'+type+'_'+stat);
 out.bossBonus=val('boss_bonus_attack_power');out.bossBoost=val('boss_skill_power_amplification');
 for(const [slot,weapon,prefix] of [['weapon1','Crossbow','cross'],['weapon2','Wand','wand']]){
  const e=state.items[slot],item=catalog.equipment.find(x=>x.id===e?.id);if(!item)continue;
  const r=weaponRange(item,e.level),x=extras[weapon];
  const minBonus=(raw.bonus_attack_power_main_hand||0)+(x.bonus_attack_power_main_hand||0),spreadBonus=(raw.attack_power_main_hand||0)+(x.attack_power_main_hand||0);
  out[prefix+'Min']=r[0]+minBonus;out[prefix+'Max']=r[1]+minBonus+spreadBonus;
  if(prefix==='cross'){const s=itemStats(item,e.level,e.traits,catalog,e.resonanceId);out.offMin=1+(s.bonus_attack_power_off_hand||0)+minBonus;out.offMax=out.offMin+Math.max(0,(s.attack_power_off_hand||0)-1)+spreadBonus;out.offhandBase=(s.off_hand_attack_chance||0)*.01;out.offhandModifier=val('off_hand_attack_chance_modifier');out.interval=attackInterval((s.attack_speed_main_hand||500)*.001,dexPercent,out.speed,dexSeconds);}
 }
 out.crossMin+=raw.main_weapon_base_damage||0;out.crossMax+=raw.main_weapon_base_damage||0;
 const passive=passiveSheetEffects(state,catalog,out.mana);
 out.offMax+=out.offMin?passive.offMaxBonus:0;out.offhandModifier=(out.offhandModifier||0)+(out.offMin?passive.offChanceBonus:0);
 out.bonus+=passive.bonus;out.baseDamagePercent=passive.baseDamagePercent;
 // Apply the sheet modifier once, after additive weapon and attribute bonuses.
 for(const key of ['crossMin','crossMax','offMin','offMax','wandMin','wandMax'])out[key]+=Math.floor(out[key]*passive.baseDamagePercent/100);
 out.offhandBase=(out.offhandBase||0)+(mastery.off_hand_attack_chance||0)*.01;out.offhand=offhandChance(out.offhandBase,0,out.offhandModifier);
 out.healing=(val('heal_modifier')+passive.revival)*passive.healingMultiplier;
 out.rangeDamage=(raw.range_damage_dealt_modifier||0)*.01;out.magicDamage=(raw.magic_damage_dealt_modifier||0)*.01;
 // This node gives the same rating against all five monster species; count it once.
 out.weaken+=passive.weaken;
 out.wandInterval=attackInterval((itemStats(catalog.equipment.find(i=>i.id===state.items.weapon2?.id)||{},state.items.weapon2?.level||0,state.items.weapon2?.traits||[],catalog).attack_speed_main_hand||2000)*.001,dexPercent,out.speed,dexSeconds);
 out.species+=val('all_species_damage_amplification')+Math.min(...['demon','animal','undead','grankus','creation'].map(k=>(raw[k+'_damage_amplification']||0)*(catalog.formats[k+'_damage_amplification']?.mul??.1)));
 return out;
}
// Character values always come from the build. Only fight assumptions may be overridden.
export const COMBAT_ASSUMPTION_KEYS=['attackPosition','targetIsBoss','controlImmune','giantBlessing','enemyMana','stepDuration','mainWeapon','evasion','endurance','heavyEvasion','weakenResistance','incomingDps','furyInterval','enemyAttacks','moving','killInterval','targetDistance','targetHealth','resistance','selfSkillBoost','selfDurationExtension','targetResistanceDrop','lightMaxBonus','lightOpeningMultiplier','lightOpeningSeconds','regenPeriod','pve','defense','defenseK','ratingK','animationFloor','latency'];
export function simulationParams(state,catalog,assumptions={}){
 const params={mainWeapon:'Crossbow',attackPosition:'front',...BUFF_DEFAULTS,...deriveStats(state,catalog),targetIsBoss:1,sheetIncludesPassives:1};
 for(const key of COMBAT_ASSUMPTION_KEYS)if(Object.hasOwn(assumptions,key))params[key]=assumptions[key];
 return params;
}
export function characterStats(state,catalog){
 const {raw}=rawCharacterStats(state,catalog),out={...raw},combat=deriveStats(state,catalog);
 for(const suffix of ['accuracy','armor','evasion','critical_attack','double_attack','critical_defense','double_defense']){
  for(const type of ['melee','range','magic'])out[type+'_'+suffix]=(raw[type+'_'+suffix]||0)+(raw['all_'+suffix]||0);
  delete out['all_'+suffix];
 }
 for(const suffix of ['accuracy','tolerance']){for(const type of ['weaken','stun','petrification','sleep','silence','bind','blind'])out[type+'_'+suffix]=(raw[type+'_'+suffix]||0)+(raw['all_state_'+suffix]||0);const impulse=suffix==='accuracy'?'collide_amplification':'collide_resistance';out[impulse]=(raw[impulse]||0)+(raw['all_state_'+suffix]||0);delete out['all_state_'+suffix];}
 const passive=passiveSheetEffects(state,catalog,combat.mana);
 out.stamina_regen=(out.stamina_regen||0)+passive.staminaRegen/(catalog.formats.stamina_regen?.mul||1);
 out.weaken_accuracy=(out.weaken_accuracy||0)+passive.weaken/(catalog.formats.weaken_accuracy?.mul||1);
 out.attack_power_modifier=(out.attack_power_modifier||0)+passive.baseDamagePercent/(catalog.formats.attack_power_modifier?.mul||.01);
 for(const [stat,key] of [['damage_reduction_penetration','bonus'],['heal_modifier','healing']])out[stat]=combat[key]/(catalog.formats[stat]?.mul||1);
 out.off_hand_attack_chance=combat.offhand*100;delete out.off_hand_attack_chance_modifier;
 return out;
}
export function statBreakdown(state,catalog){
 const baseline={...state,attributeAdjustments:{},items:{},attrs:{str:10,dex:10,Int:10,per:10,con:10},attrMode:'total',masteryTrees:{},commonMastery:{level:0,selected:[]},mastery:{},passive:[],active:[],defensive:[],specs:{}};
 const attributes={...baseline,attrs:state.attrs,attrMode:state.attrMode,attributeAdjustments:state.attributeAdjustments};
 const gear={...attributes,excludeSetBonuses:true,items:Object.fromEntries(Object.entries(state.items).map(([k,v])=>[k,{...v,runes:[]}]))};
 const runes={...gear,items:state.items};
 const sets={...runes,excludeSetBonuses:false};
 const mastery={...sets,masteryTrees:state.masteryTrees,commonMastery:state.commonMastery};
 const passives={...mastery,passive:state.passive,passiveLevels:state.passiveLevels};
 const steps=[baseline,attributes,gear,runes,sets,mastery,passives].map(s=>deriveStats(s,catalog));
 return {labels:['База + 10 атрибутов','Атрибуты','Экипировка','Руны','Комплекты','Мастерство','Пассивные'],values:Object.fromEntries(Object.keys(steps.at(-1)).map(k=>[k,steps.map((s,i)=>s[k]-(i?steps[i-1][k]:0))])),total:steps.at(-1)};
}
// Epic level 5. Only the exact cooldown progression label describes this skill's cooldown.
// Passive reductions and defensive skill effects must not replace their own cooldown.
export function levelFiveCooldown(skill){
 // Ghost's progression is seconds removed from OTHER cooldowns per weaken.
 // Its own 36-second cooldown never becomes the 0.36-second proc coefficient.
 if(skill.id===IDS.ghost)return skill.cooldownSec;
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
 const warnings=['Средний урон по одной цели за 300 секунд. Уклонение, устойчивость и сопротивление цели задаются в настройках боя.'];
 if(state.active.includes(IDS.step))warnings.push('Смещение: время рывка по умолчанию 1 с. В данных RU время применения равно нулю; длительность анимации выбрана по контексту и редактируется в настройках боя.');
 if(state.active.includes(IDS.nature))warnings.push('Гнев природы: коэффициенты заряда RU ур. 4; Огонь RU ур. 4: 30% на воспламенение длительностью 3 с; коэффициент тика взят из Огненных зарядов RU. Выбрана одна стихия до начала боя.');
 if(state.active.includes(IDS.touch)&&(state.specs[IDS.touch]||[]).some(id=>id.endsWith('_3')))warnings.push('Глубокая скорбь: 50% на дополнительный уровень, предел 3 применяется к каждой вероятностной ветви. Приоритет взрыва оценивается по средним уровням.');
 if(weaponEffects(state).has('bellandir'))warnings.push('Вероятностный яд Бел’Адир: 20% при критическом попадании. При обновлении сохраняется фаза тиков; выбран наиболее вероятный вариант механики RU T2.');
 if(state.active.includes(IDS.area))warnings.push('Ритуальный круг: сохранение области повторно накладывает проклятие после снятия. Время применения взято из данных RU; точная анимация Перста угасания не измерена.');
 if(masteryEffects(state).Wand_Hero_Tactic_04)warnings.push('Летаргия: контроль монстров не изменяет урон по неподвижной цели. Входящие атаки не приостанавливаются вероятностным контролем.');
 if(masteryEffects(state).Wand_Rare_Tac_Skill)warnings.push('Тёмный апостол: при отсутствии отдельного коэффициента RU преобразованное умение использует коэффициент исходного исцеления.');
 if(masteryEffects(state).Wand_High_Tac_Skill)warnings.push('Мрачный обет: коэффициент преобразования принят равным значению Священного обета; нужны входящие атаки умениями.');
 if(commonSelection(state).includes('WM_Common_SKILL_005'))warnings.push('Общее исцеляющее мастерство: неизвестный коэффициент области принят равным базовому Источнику жизни RU.');
 if(Object.values(state.items||{}).some(e=>e.id==='crossbow_aa_t2_polymorph_001'&&[10,11].includes(e.level)))warnings.push('Бел’Адир +10/+11: значения сверены с TL Build; источник RU напрямую подтверждает +12.');
 if(state.active.includes(IDS.light))warnings.push('Свет доблести: +92 максимального урона. Начальное удвоение не переносится с защитного варианта без подтверждения.');
 if(state.active.includes(IDS.wind)||state.active.includes(IDS.shield)||(state.defensive||[]).some(Boolean))warnings.push('Защитные и групповые эффекты включаются только при выполнении условий боя. Без входящего урона и яростных атак они не создают дополнительный DPS.');
 return warnings;
}

export function expectedHit(p,weapon,coef,flat,{position=p.attackPosition||'front',accuracyBonus=0,resistanceProbability=1,baseDamageBonus=0,typeDamageBonus=0,forceCrit=false,dot=false,skill=true,off=false,maxBonus=0,critBonus=0,critDamageBonus=0,boostBonus=0,resistanceDrop=0,bonus=0,skillMultiplier=1}={}){
 const magic=weapon==='Wand',lo=magic?p.wandMin:off&&p.offMax>0?p.offMin:p.crossMin,hi=(magic?p.wandMax:off&&p.offMax>0?p.offMax:p.crossMax)+maxBonus;
 const ratings=combatRatings(p,weapon,position,critBonus,accuracyBonus),cr=forceCrit?1:ratings.critical,hv=ratings.heavy;
 const hitChance=dot?1:ratings.hit;
 const damageScale=1+baseDamageBonus/100;const avg=(lo+hi)/2*damageScale,cd=1+(p.critDamage+critDamageBonus)/100;
 const glancing=dot?0:ratings.glancing;const normal=(coef*avg+flat)*(1-glancing)+(coef*lo*damageScale+flat)*glancing,critical=(coef*(dot?avg:hi*damageScale)+flat)*cd;
 const base=dot&&!p.dotCrit?normal:normal*(1-cr)+critical*cr;
 const rawResistance=(p.resistance||0)-resistanceDrop;
 const resistance=rawResistance;
 // Independent amplification and resistance factors; validated against PvE fixtures.
 const resistFactor=(1-resistanceProbability)*(1-signedChance(p.resistance||0,700))+resistanceProbability*(1-signedChance(resistance,700));
 const mult=!skill?1:(1+chance(p.boost+boostBonus+(p.targetIsBoss?p.bossBoost||0:0),p.ratingK))*resistFactor;
 const typeBonus=1+typeDamageBonus/100+(magic?(p.magicDamage||0):(p.rangeDamage||0))/100;
 return hitChance*Math.max(0,base*mult*(1+hv)*typeBonus*(1+chance(p.species,p.ratingK))*p.pve*skillMultiplier/(1+p.defense/p.defenseK)+(dot?0:p.bonus+bonus+(p.targetIsBoss?p.bossBonus||0:0)));
}
// Day/night affects combat healing, not the time-independent character sheet.
export function combatHealing(state,catalog,params){
 const day=masteryActive(state,'WA_GR','Wand_Normal_Def_Skill'),night=masteryActive(state,'WA_GR','Wand_High_Util_Skill');
 const factor=day&&night?1.2:params.night?(day?.5:0):(day?1.2:1);
 return params.healing+((state.passive||[]).includes(PASS.night)?passiveValue(state,catalog,PASS.night,'Эффективность исцеления ▲',36)*factor*passiveSheetEffects(state,catalog,params.mana).healingMultiplier:0);
}
export function intervalWithSpeedBonus(params,bonus){return params.interval*(1+params.speed/100)/(1+(params.speed+bonus)/100);}
// Expected critical attempts per projectile; the cooldown itself uses remainingCooldownFactor.
export function rapidCriticalCooldownReduction(params,offChance,offCritBonus=0){
 return chance(params.critR,params.ratingK)+offChance*chance(params.critR+offCritBonus,params.ratingK);
}
export function simulate({catalog,state,params,overrides={},priority,burstStacks=3,rotationPolicy=null},detail=false){
 const p={mainWeapon:'Crossbow',attackPosition:'front',...DEFAULTS,...BUFF_DEFAULTS,targetDistance:0,targetHealth:100,...params};
 const mx=masteryEffects(state),hasMx=id=>Boolean(mx[id]),rank=id=>mx[id]||0;
 const ordinaryDotBonus=.05*rank('Wand_Rare_Attack_01'),curseDotBonus=(hasMx('Wand_Rare_Attack_Skill')?.15:0)-.12*rank('Wand_Hero_Util_02');
 if((state.passive||[]).includes('WP_CR_CR_S_DistanceRangeAcc')){const perMeter=passiveValue(state,catalog,'WP_CR_CR_S_DistanceRangeAcc','Меткость (магия) ▲',20);p.accuracyR+=40+perMeter*p.targetDistance;p.accuracyM+=40+perMeter*p.targetDistance;p.weaken+=5*p.targetDistance;}
 if(hasMx('Crossbow_Normal_Util_Skill')&&(state.passive||[]).includes('WP_CR_CR_S_DistanceRangeAcc')){if(p.targetDistance<=15){p.accuracyR+=100;p.accuracyM+=100;}if(p.targetDistance<=10){p.critR+=100;p.critM+=100;}}
 p.offhandBase??=p.offhand;p.offhandModifier??=0;if(p.targetDistance<=10)p.offhandModifier+=20*rank('Crossbow_Hero_Attack_01');

 const weapons=weaponEffects(state),sets=setPassives(state,catalog),setIds=new Set(sets.map(x=>x.id||x.clientSource?.locresId));
 const dotBase=setIds.has('Item_Passive_Set_fabric_aa_T2_002_1_Passive')?20:0,elder=setIds.has('Item_Passive_Set_fabric_aa_T2_001_1_Talland');let weakenCount=0,weaponBuffEnd=0,weaponBuffReady=0,braukaStacks=0;
 const dotsFromWeapons=[...(weapons.has('bellandir')?[{id:'bellandir-poison',weapon:'Crossbow',c:1.1,duration:5,dot:new ProcDot(3),kind:'poison'}]:[]),...(weapons.has('bolt')?[{id:'weapon-poison',weapon:'Crossbow',c:.19,duration:9,dot:new ProcDot(),kind:'poison'}]:[]),...(weapons.has('tevent')?[{id:'tevent-curse',weapon:'Wand',c:.35,duration:30,dot:new ProcDot(),kind:'curse'}]:[])];
 const exclusiveBase=Math.max(0,...sets.filter(x=>/Не суммируется|не суммируется/.test(x.description)&&/Критический урон/.test(x.description)).map(x=>Number(x.description.match(/на (?:\+)?(\d+)%/)?.[1]||0)));
 const exclusiveCombat=Math.max(exclusiveBase,setIds.has('Item_Passive_Set_leather_ab_T2_001_1_Talland')&&p.targetDistance>5?25:0);
 p.critDamage+=exclusiveCombat-exclusiveBase;
 if(setIds.has('Item_Passive_Set_leather_aa_T2_002_2_Passive'))p.critDamage+=Math.min(25,Math.max(0,p.targetDistance));
 if(sets.some(x=>/здоровья 50%/.test(x.description))&&p.targetHealth<=50){p.critR+=140;p.critM+=140;}
 if(weapons.has('daySpeed')){const speed=p.night?6:12;p.interval=intervalWithSpeedBonus(p,speed);p.speed+=speed;}
p.healing=combatHealing(state,catalog,p);const all=models(catalog,state,overrides),byId=new Map(all.map(s=>[s.id,s]));
 // "Несовместимые умения" в описании пассивки не запрещают держать оба навыка
 // на панели. «Луч погибели» продолжает работать сам по себе; взаимодействие
 // пассивки с его отдельными эффектами моделируется только там, где подтверждено.
 const list=priority.map(id=>byId.get(id)).filter(Boolean),has=id=>state.passive.includes(id),sp=(s,n)=>s.specs.includes(n);
 const cd=Object.fromEntries(list.map(s=>[s.id,0])),counts={},damage={},logs=[],damageEvents=[],bins=Array(30).fill(0),pending=[],cooldownCycles=[];
 let total=0,t=0,busy=0,nextAuto=0,fieldEnd=0,fieldSource=null,fieldNext=0,viperEnd=0,viperReady=4,sleepEnd=0,sleepHits=0,weakCritBonus=21,weakEnd=0,killEnd=0,corruptionStacks=0,corruptionEnd=0,spiritStacks=0,spiritEnd=0,critBuffEnd=0,battleSpeedEnd=0,battleSpeed=0,healShield=0,healShieldEnd=0,shieldBuffEnd=0,commonShield=0,commonShieldEnd=0,killProcReady=0,accuracyBuffEnd=0,accuracyBuffStacks=0,holyStacks=0,holyEnd=0,commonControlStacks=0,commonControlEnd=0,commonControlReady=0,lightningEnd=0,lightningReady=10,janiceEnd=0,healProcReady=0,vitalityEnd=0,vitalityReady=0,shieldCommonReady=0,healthySince=0,defenseWaveReady=0,defenseTimes=[],survivalReady=0,manaDrainReady=0,enemyMana=p.enemyMana,mana=p.mana,hp=p.hp,minMana=mana,starved=0,charges=0,gale=0,galeEnd=0,slow=0;
 const natureSkill=list.find(s=>s.key==='nature'),natureElement=natureSkill?.specs.slice().sort((a,b)=>a-b)[0]||0;
 const common=new Set(commonSelection(state));let commonHits=0,spearReady=0,flowerReady=0,manaSpent=0,castSerial=0,crisisEnd=0,crisisReady=0;
 const commonCasts=new Set();let stepCharges=(list.find(s=>s.key==='step')?.specs.includes(2)?2:1),stepChargeMax=stepCharges,stepChargeReady=0;
 const extraDots=[],stackEvents={},bloodlust=new Bloodlust(),bloodlustCasts=new Set(),bloodlustSpeedEvents=[];
 const bloodlustSpeed=()=>{while(bloodlustSpeedEvents.length&&bloodlustSpeedEvents[0].end<=t)bloodlustSpeedEvents.shift();return 5*(1-bloodlustSpeedEvents.reduce((miss,e)=>miss*(1-e.probability),1));};
 const stackGain=(key,value,seconds,cap)=>{const rows=(stackEvents[key]||[]).filter(e=>e.end>t);rows.push({value,end:t+seconds});stackEvents[key]=rows;return Math.min(cap,rows.reduce((sum,e)=>sum+e.value,0));};
 const debuffScale=1+(gearStats(state,catalog).debuff_given_duration_modifier||0)*.0001;
 const wp=(base,curse=false)=>weakenProbability(base,p.weaken,p.weakenResistance,curse&&!hasMx('Wand_High_Def_Skill')&&state.passive.includes(PASS.duration)?pv(PASS.duration,'Вероятность наложения проклятий ▲',4)/100:0);
 const accuracyBonus=()=> (accuracyBuffEnd>t?accuracyBuffStacks*30:0)+(mana<=p.mana*.4&&hasMx('Crossbow_High_Tac_Skill')&&has(PASS.bonus)?150:0);
 const combatPosition=()=>buffs.ghost>t&&byId.get(IDS.ghost)?.specs.includes(4)?'best':p.attackPosition;
 const hitRate=s=>combatRatings(p,s.weapon,combatPosition(),0,accuracyBonus()).hit;
 const criticalRate=(weapon,bonus=0)=>combatRatings(p,weapon,combatPosition(),bonus).critical;
 const flank=weapon=>combatRatings(p,weapon,combatPosition()).position!=='front';
 const extendWeaken=seconds=>{for(const d of Object.values(dots))if(d.end>t){d.end+=seconds;d.dot?.extend(t,seconds);}for(const d of [...dotsFromWeapons,...extraDots])d.dot.extend(t,seconds);if(buffs.decay>t)buffs.decay+=seconds;if(markEnd>t)markEnd+=seconds;};
 const spendMana=amount=>{mana=Math.max(0,mana-amount);manaSpent+=amount;minMana=Math.min(minMana,mana);};
 let natureMana=0,natureUptime=0,natureStops=0,planningWait=0;
 const buffs={nature:0,ghost:0,step:0,adapt:0,decay:0,selfBoost:0,light:0,wind:0},dots={},effectEvents=[];
 let lightStarted=0,lightDirected=false,decayProbability=1;
 let markEnd=0,markPool=0,markExplosive=false,markSource=null,procWindow=-1,procCount=0;
 const pv=(id,label,fallback)=>passiveValue(state,catalog,id,label,fallback);
 const duration=n=>n*(1+p.buffDuration/100),curseDuration=n=>n+rank('Wand_High_Attack_01')+(has(PASS.duration)&&!hasMx('Wand_High_Def_Skill')?pv(PASS.duration,'Время действия проклятий ▲',3.3):0);
 const activeDot=key=>dots[key]&&(dots[key].dot?dots[key].dot.stacks(t)>1e-10:dots[key].end>t);
 const dotStacks=()=>activeDot('touch')?dots.touch.dot.stacks(t):0;
 const dayBonus=hasMx('Wand_Normal_Def_Skill'),nightBonus=hasMx('Wand_High_Util_Skill');
 const nightFactor=dayBonus&&nightBonus?1.2:p.night?(nightBonus?1.2:1):(nightBonus?.5:0);
 const dayFactor=dayBonus&&nightBonus?1.2:p.night?(dayBonus?.5:0):(dayBonus?1.2:1);
 const nightDot=()=>has(PASS.night)?pv(PASS.night,'Периодический урон ▲',36)/100*nightFactor:0;
 const holyBonus=()=>holyEnd>t?pv('WP_WA_GR_S_HealEffectUpWhenSkillDamageTaken','Эффективность исцеления ▲',15)*holyStacks:0;
 const weakChance=()=>dotStacks()>0||activeDot('area')||buffs.decay>t||markEnd>t||slow>t?1:1-dotsFromWeapons.reduce((q,d)=>{d.dot.expire(t);return q*d.dot.empty;},1);
 let pactAdding=false;
 const add=(id,value,hits=0,context={},parts=null)=>{if(t>=300||value<=0)return;total+=value;damage[id]=(damage[id]||0)+value;if(detail)damageEvents.push({time:+t.toFixed(2),id,value,attribution:eventInfo(id,context),...(parts?{parts}: {})});bins[Math.min(29,Math.floor(t/10))]+=value;if(markEnd>t&&id!=='mark-explosion')markPool+=value;if(has(PASS.pact)&&(activeDot('touch')||activeDot('area'))){if(hasMx('Wand_Normal_Attack_Skill')&&!pactAdding){pactAdding=true;add('vampiric-onslaught',value*pv(PASS.pact,'Исцеление при нанесении урона ▲',17.4)/100);pactAdding=false;}else if(!hasMx('Wand_Normal_Attack_Skill'))hp=Math.min(p.hp,hp+value*pv(PASS.pact,'Исцеление при нанесении урона ▲',17.4)/100*(flank('Wand')?1.1:1));}};
 function flower(s){if(!common.has(COMMON_IDS.flower)||t<flowerReady||manaSpent+1e-7<p.mana*.1)return;manaSpent=0;flowerReady=t+6;counts[COMMON_IDS.flower]=(counts[COMMON_IDS.flower]||0)+1;add(COMMON_IDS.flower,hitValue({...s,weapon:p.mainWeapon},2.1,0));}
 function commonHit(s){
  flower(s);
  if(['nature','laser','auto'].includes(s.key)||commonCasts.has(s.castToken))return;
  commonCasts.add(s.castToken);
  if(s.useType==='kAttack'){if(commonControlEnd<=t)commonControlStacks=0;commonControlStacks=Math.min(3,commonControlStacks+1);commonControlEnd=t+10;}
  if(common.has(COMMON_IDS.spear)&&++commonHits>=7&&t>=spearReady){commonHits=0;spearReady=t+5;counts[COMMON_IDS.spear]=(counts[COMMON_IDS.spear]||0)+1;add(COMMON_IDS.spear,hitValue({...s,weapon:p.mainWeapon},2.4,0));}
  if(common.has(COMMON_IDS.dragon)&&mana>=p.mana*.6){const current=mana;spendMana(current*.04);counts[COMMON_IDS.dragon]=(counts[COMMON_IDS.dragon]||0)+1;add(COMMON_IDS.dragon,hitValue({...s,weapon:p.mainWeapon},1.4,current*.07));}
 }
 const opts=(dot=false,off=false,skillKey='')=>({position:combatPosition(),accuracyBonus:accuracyBonus(),baseDamageBonus:(janiceEnd>t?6:0)+(spiritEnd>t&&hasMx('Wand_Normal_Util_Skill')?1.4*pv('WP_WA_GR_S_SupportAllyCostRegenUp','Эффективность исцеления ▲',8.2)/8.2*spiritStacks:0),forceCrit:!dot&&sleepEnd>t&&sleepHits>0,dot,off,maxBonus:(weaponBuffEnd>t?25:0)+(killEnd>t?pv('WP_WA_GR_S_CurseKillBonus','Урон ▲',40)*corruptionStacks:0)+lightBonusAt(t,lightStarted,buffs.light,lightDirected,p)+(off&&has(PASS.ambi)&&!p.sheetIncludesPassives?pv(PASS.ambi,'Макс. урон парного оружия ▲',40):0),critBonus:(off&&has(PASS.ambi)?90:0)+(critBuffEnd>t?100:0)+(mana<=p.mana*.4&&hasMx('Crossbow_High_Tac_Skill')&&has(PASS.bonus)?150:0),critDamageBonus:(has(PASS.thirst)&&skillKey!=='laser'?bloodlust.value(t).critical*pv(PASS.thirst,'Крит. урон ▲',12.3):0)+(buffs.step>t?20:0)+(weakEnd>t?weakCritBonus:0),boostBonus:(has(PASS.thirst)&&skillKey!=='laser'?bloodlust.value(t).stacks*pv(PASS.thirst,'Повышение урона умений ▲',5):0)+(buffs.selfBoost>t?p.selfSkillBoost:0)+(buffs.adapt>t?19:0)+(hasMx('Wand_High_Tac_Skill')?holyBonus():0),resistanceProbability:buffs.decay>t?decayProbability:1,resistanceDrop:buffs.decay>t?p.targetResistanceDrop:0,bonus:(has(PASS.bonus)&&!p.sheetIncludesPassives?pv(PASS.bonus,'Дополнит. урон ▲',13):0)+(buffs.adapt>t?pv(PASS.adapt,'Дополнит. урон ▲',26):0)});
 const offchance=(s)=>offhandChance(p.offhandBase,0,p.offhandModifier+(mana<=p.mana*.3&&hasMx('Crossbow_High_Util_Skill')?20:0)+(buffs.ghost>t?100:0)+(s?.key==='shot'&&sp(s,3)?30:0))/100;
 const hitValue=(s,c,f,dot=false,mult=1)=>expectedHit(p,s.weapon,c,f,{...opts(dot,false,s.key),skillMultiplier:s.pve*mult*(s.weapon==='Crossbow'&&p.targetHealth<=30&&hasMx('Crossbow_Rare_Attack_Skill')?1.05:1)*(s.weapon==='Wand'&&hasMx('Wand_Normal_Tac_Skill')&&corruptionEnd>t?1+.024*pv('WP_WA_GR_S_CurseKillBonus','Урон ▲',40)/40*corruptionStacks:1)});
 const cycleById=new Map();
 function changeCooldown(id,next,source){const old=cd[id];cd[id]=Math.max(t,next);const cycle=cycleById.get(id);if(cycle&&old>cd[id])cycle.reductions[source]=(cycle.reductions[source]||0)+old-cd[id];}
 function reduce(amount,source='Отрешённость: ослабления'){for(const s of list){if(s.key==='ghost')continue;changeCooldown(s.id,cd[s.id]-amount,'Отрешённость: '+source);if(s.key==='step'&&stepCharges<stepChargeMax)stepChargeReady=Math.max(t,stepChargeReady-amount);}}
 function weaken(stacks=1,applications=1,source='Ослабления'){
  weakenCount=Math.min(3,weakenCount+applications);
  if(buffs.ghost<=t)return;
  const window=Math.floor(t);if(window!==procWindow){procWindow=window;procCount=0;}
  const funded=Math.min(applications,Math.max(0,10-procCount));procCount+=funded;if(funded>0)reduce(funded*(stacks>1?pv(IDS.ghost,'Время восстановления при 2 и более ур. эффекта ▼',.072):pv(IDS.ghost,'Время восстановления ▼',.36)),source);
 }
 function procGale(s,hits){
  if(!((s.key==='rapid'&&sp(s,1))||(s.key==='barrage'&&sp(s,3))||(s.key==='shot'&&sp(s,1))))return;
  if(galeEnd<=t){gale=0;braukaStacks=0;}
  const addedLevels=(s.key==='shot'?2:1)+(buffs.wind>t?1:0),count=hits*addedLevels;if(weapons.has('brauka')){braukaStacks+=count;while(braukaStacks>=25){braukaStacks-=25;add('brauka-explosion',hitValue(s,3.75,0));}}gale+=count;galeEnd=t+6;const first=gale-count<=0&&addedLevels===1?Math.min(1,hits):0;weaken(1,first,'Шквал: первый уровень');weaken(2,hits-first,'Шквал: повторные уровни');
  while(gale>=25){gale-=25;add('gale',hitValue(s,3.75,75),0,{source:s.id});}
 }
 function direct(s,c,f,count=1,{projectile=true,off=true,mult=1,hitMultiplier=1,offChance=null}={}){
  const extra=s.weapon==='Crossbow'&&off?(offChance??offchance(s)):0;
  if(weapons.has('barrage')&&s.key==='barrage')mult*=1.15;
  if(weapons.has('laser')&&s.key==='laser')mult*=1.25;
  const main=hitValue(s,c,f,false,mult),offValue=extra*expectedHit(p,s.weapon,c,f,{...opts(false,true,s.key),skillMultiplier:s.pve*mult});
  const value=(main+offValue)*count*hitMultiplier;
  const info={weapon:s.weapon,mechanism:'direct'},parts=detail&&s.weapon==='Crossbow'&&offValue>0?[{...eventInfo(s.id,{...info,hand:'main'}),value:main*count*hitMultiplier},{...eventInfo(s.id,{...info,hand:'off'}),value:value-main*count*hitMultiplier}]:null;
  const hits=count*(1+extra)*hitMultiplier*hitRate(s);add(s.id,value,hits,{...info,hand:s.weapon==='Crossbow'?'main':'none'},parts);weaponHit(s,count*hitRate(s),s.key==='barrage'?.5*offchance(s):extra);
  if(weapons.has('rapid')&&s.key==='rapid'&&buffs.ghost>t){add('weapon-projectile',hitValue(s,1.2,0)*count,0,{source:'weapon-projectile'});procGale(s,count);}
  if(weapons.has('laser')&&s.key==='laser'&&!activeDot('area'))putDot('area',{id:IDS.area,key:'area',weapon:'Wand',pve:1,specs:[],castToken:s.castToken},.65,73,9);
  if(markEnd>t&&!markExplosive){add('mark-hit',hitValue(markSource,.23,15)*hits);}
  if(projectile)natureProc(hits);
  if(buffs.ghost>t){for(const d of Object.values(dots))if(d.end>t){d.end+=.05*hits;d.dot?.extend(t,.05*hits);}for(const d of dotsFromWeapons)d.dot.extend(t,.05*hits);if(buffs.decay>t)buffs.decay+=.05*hits;if(markEnd>t)markEnd+=.05*hits;}
  procGale(s,hits);combatProcs(s,hits);if(sleepEnd>t&&sleepHits>0){sleepHits-=hits;if(sleepHits<=0)sleepEnd=t;}commonHit(s);
 }
 function enqueue(at,fn){pending.push({at,fn});pending.sort((a,b)=>a.at-b.at);}
 const dotMultiplier=(curse=false)=> (1+Math.max(dotBase,elder?12+4*weakenCount:0)/100+ordinaryDotBonus+(curse?curseDotBonus:0)+(hasMx('Wand_High_Tac_Skill')?holyBonus()/100:0));
 function dotDamage(d,stacks=d.dot?d.dot.stacks(t):d.stacks){return hitValue(d.s,d.c,d.f,true)*stacks*(d.weight??1)*(dotMultiplier(true)+nightDot());}
 function weaponHit(s,count=1,extra=0){
  if(weapons.has('mana')&&s.key!=='auto'&&t>=weaponBuffReady){weaponBuffReady=t+30;weaponBuffEnd=t+duration(6);}
  if(weaponBuffEnd>t)mana=Math.min(p.mana,mana+21*count*(1+extra));
  if(s.weapon!=='Crossbow')return;
  for(const d of dotsFromWeapons){if(d.kind!=='poison')continue;const q=d.id==='bellandir-poison'?wp(.2)*criticalRate('Crossbow'):wp(.15);
   if(d.id==='bellandir-poison')applyStackingDot(d.dot,q,count,d.duration*debuffMultiplier(),'Яд Бел’Адир');
   const offQ=d.id==='bellandir-poison'?wp(.2)*criticalRate('Crossbow',has(PASS.ambi)?90:0):wp(.15);if(d.id==='bellandir-poison')applyStackingDot(d.dot,offQ*extra,count,d.duration*debuffMultiplier(),'Яд Бел’Адир: парная атака');else{d.dot.hits(t,offQ*extra,count,d.duration*debuffMultiplier());weaken(1,count*offQ*extra,'Отравленный болт');}
  }
 }
 const debuffMultiplier=()=>debuffScale;
 function curseProc(applicationChance=1){if(weapons.has('tevent')){const q=wp(.15,true)*applicationChance;dotsFromWeapons.find(d=>d.kind==='curse').dot.apply(t,q,curseDuration(30)*debuffMultiplier());weaken(1,q);}}
 function putDot(key,s,c,f,seconds,stacks=1){
  const previous=dots[key],q=hitRate(s)*wp(1,true),ttl=curseDuration(seconds)*debuffMultiplier();
  if(key==='touch'){
   const dot=previous?.dot||new ProcDot(3),extra=s.key==='touch'&&sp(s,3)?.5:0,application=q*Math.min(1,stacks);
   dot.expire(t);const first=dot.empty*application*(1-extra);dot.applyLevels(t,application,ttl,extra,2);
   dots[key]={s,c,f,dot,end:Math.max(t,...dot.states.map(d=>d.end)),weight:1};
   weaken(1,first,'Касание скорби: первый уровень');weaken(2,application-first,'Касание скорби: повторные уровни');curseProc(application);
  }else{dots[key]={s,c,f,end:t+ttl,weight:q,next:previous&&previous.end>t?previous.next:t+1,stacks};weaken(stacks,q);curseProc(q);}
  commonHit(s);
 }
 function remainingCurse(d){return d.dot?dotDamage(d,1)*d.dot.remaining(t):dotDamage(d)*Math.max(0,Math.floor(d.end-d.next+1e-7)+1);}
 function applyStackingDot(dot,q,hits,ttl,source){
  dot.expire(t);const whole=Math.floor(hits),fraction=hits-whole,total=q*hits;
  const first=dot.cap>1?dot.empty*(1-Math.pow(1-q,whole)*(1-q*fraction)):total;
  dot.hits(t,q,hits,ttl);weaken(1,first,source+': первый уровень');weaken(2,Math.max(0,total-first),source+': повторные уровни');
 }
 function extraDot(id,weapon,c,f,duration,cap,kind='poison',q=1,hits=1){
  let d=extraDots.find(d=>d.id===id);if(!d){d={id,weapon,c,f,duration,dot:new ProcDot(cap),kind};extraDots.push(d);}applyStackingDot(d.dot,q,hits,duration*debuffScale,id);
 }
 function remainingDots(){let rest=0;for(const d of Object.values(dots))if(d.end>t)rest+=remainingCurse(d);for(const d of [...dotsFromWeapons,...extraDots])rest+=expectedHit(p,d.weapon,d.c,d.f||0,opts(true))*(dotMultiplier(d.kind==='curse')+nightDot())*d.dot.remaining(t);return rest;}
 function combatProcs(s,hits){
  if(hits<=0)return;
  if(has(PASS.thirst)&&s.key!=='laser'&&s.useType==='kAttack'&&!bloodlustCasts.has(s.castToken)){
   bloodlustCasts.add(s.castToken);const attempts=s.key==='rapid'?3:s.key==='barrage'?32:1,h=hitRate(s),off=s.weapon==='Crossbow'?offchance(s):0;
   const miss=Math.pow(1-h,attempts)*Math.pow(1-off*h,attempts);bloodlust.apply(t,1-(s.key==='rapid'&&sp(s,2)?miss-Math.pow((1-h)*(1-off),3)*h:miss));
  }
  if(weapons.has('manaDrain')&&t>=manaDrainReady){enemyMana=Math.max(0,enemyMana-40);manaDrainReady=t+3;}
  if(weapons.has('vitality')&&s.weapon==='Crossbow'){if(t>=vitalityReady){vitalityReady=t+30;vitalityEnd=t+6;}if(vitalityEnd>t)hp=Math.min(p.hp,hp+61*hits*offchance(s));}
  if(hasMx('Crossbow_Normal_Def_Skill')&&has('WP_CR_S_WeakenAccuracy')&&hp<=p.hp*.3&&t>=survivalReady){survivalReady=t+60;for(let i=1;i<=5;i++)enqueue(t+i,()=>hp=Math.min(p.hp,hp+1000));}
  const cr=criticalRate(s.weapon);
  if(hasMx('Crossbow_Rare_Tac_Skill')){accuracyBuffEnd=t+3;accuracyBuffStacks=stackGain('accuracy',hits*cr,3,3);}
  if(has('WP_WA_GR_S_CurseKillBonus')&&hasMx('Wand_Normal_Tac_Skill')&&s.weapon==='Wand'&&weakChance()>0){if(corruptionEnd<=t)corruptionStacks=0;corruptionStacks=Math.min(3,corruptionStacks+hits);corruptionEnd=t+9;}
  if(hasMx('Wand_Normal_Util_Skill')&&has('WP_WA_GR_S_SupportAllyCostRegenUp')&&s.useType==='kAttack'){spiritStacks=stackGain('spirit',hits,3,5);spiritEnd=t+3;}
  if(rank('Wand_Hero_Attack_01')&&(activeDot('touch')||activeDot('area')))add('abyssal-burst',remainingDots()*.12*.08*rank('Wand_Hero_Attack_01')*hits);
  if(viperEnd>t)extraDot('viper-poison',s.weapon,.041*1.6,2*1.6,6,20,'poison',wp(1),hits);
  if(lightningEnd>t)add('moving-lightning',hitValue(s,.4,0)*hits);
  if(hasMx('Crossbow_High_Util_Skill')&&mana<=p.mana*.3&&s.weapon==='Crossbow')spendMana(10*hits*offchance(s));
  if(p.targetDistance<=15&&hasMx('Crossbow_Rare_Util_Skill')&&s.key==='auto'){critBuffEnd=t+3*(1-Math.pow(.95,hits));}
  if(hasMx('Crossbow_Normal_Attack_Skill')&&has(PASS.thirst)&&s.key==='auto'&&s.weapon==='Crossbow'){const h=hitRate(s),q=.05*h,off=offchance(s);bloodlust.apply(t,q);if(off>0)bloodlust.apply(t,q*off);bloodlustSpeedEvents.push({probability:1-(1-q)*(1-q*off),end:t+3});}
  if(s.key==='auto'&&s.weapon==='Wand'&&hasMx('Wand_Rare_Util_Skill')){
   const q=wp(.15,true)/3*hits;
   putDot('touch',{id:IDS.touch,key:'touch',weapon:'Wand',pve:1,specs:[],castToken:s.castToken},.41,37,9,q);
   extraDot('corrupting-touch','Wand',.85,95,curseDuration(9),1,'curse',q);
   buffs.decay=Math.max(buffs.decay,t+curseDuration(9)*q);decayProbability=1;
  }
  if(s.useType==='kControl'&&common.has('WM_Common_SKILL_012')&&commonControlEnd>t&&t>=commonControlReady){const n=commonControlStacks;commonControlStacks=0;commonControlReady=t+30;enqueue(t+3,()=>add('delayed-explosion',p.hp*.05*n));}
 }
 const effectiveHealing=()=>p.healing+(spiritEnd>t&&!hasMx('Wand_Normal_Util_Skill')?1.4*pv('WP_WA_GR_S_SupportAllyCostRegenUp','Эффективность исцеления ▲',8.2)/8.2*spiritStacks:0)+(!hasMx('Wand_High_Tac_Skill')?holyBonus():0);
 function healValue(c,f,key='heal'){
  const extra=(spiritEnd>t&&!hasMx('Wand_Normal_Util_Skill')?1.4*pv('WP_WA_GR_S_SupportAllyCostRegenUp','Эффективность исцеления ▲',8.2)/8.2*spiritStacks:0)+(!hasMx('Wand_High_Tac_Skill')?holyBonus():0);
  const avg=(p.wandMin+p.wandMax)/2,crit=chance(p.critM,6000),base=(avg*(1-crit)+p.wandMax*crit)*c*(1+(janiceEnd>t?.06:0))+f;
  return base*(1+chance(p.heavyM,p.ratingK))*(1+chance(p.boost,3000))*(1+(p.healing+extra)/100)*(1+.12*rank('Wand_Hero_Util_02'))*(hasMx('Wand_Rare_Attack_Skill')?.8:1)*(shieldBuffEnd>t&&weapons.has('shieldPlus')?1.1:1)*(['healAll','healField','shield'].includes(key)&&hasMx('Wand_High_Def_Skill')&&has(PASS.duration)?1+.15*pv(PASS.duration,'Время действия проклятий ▲',3.3)/3.3:1);
 }
 function heal(s,c,f){const amount=healValue(c,f,s.key);if(common.has('WM_Common_SKILL_005')&&hp<=p.hp*.3&&t>=healProcReady){healProcReady=t+60;for(let i=1;i<=6;i++)enqueue(t+i,()=>hp=Math.min(p.hp,hp+healValue(.9,82)));}hp=Math.min(p.hp,hp+amount);if(has('WP_WA_GR_S_SupportAllyCostRegenUp')&&!hasMx('Wand_Normal_Util_Skill')){spiritStacks=stackGain('spirit',1,3,5);spiritEnd=t+3;}commonHit(s);}
 function markBoom(){if(markPool>0)add('mark-explosion',markPool*(markExplosive?.4:.1));markPool=0;markEnd=0;}
 function effect(s){
  switch(s.key){
   case 'touch':putDot('touch',s,.41,37,9+(sp(s,2)?3:0));break;
   case 'area':if(sp(s,2)){fieldEnd=t+5;fieldSource=s;fieldNext=t+1;}putDot('area',s,(sp(s,1)?.85:.65)*(weapons.has('area')?1.25:1),(sp(s,1)?95:73)*(weapons.has('area')?1.25:1),9);if(sp(s,3))direct(s,2.6*(weapons.has('area')?1.25:1),0,1,{projectile:false,off:false});break;
   case 'burst':{
    direct(s,4.2,272,1,{projectile:false,off:false});const stacks=dotStacks();
    const curseChance=stacks||activeDot('area')?1:1-dotsFromWeapons.filter(d=>d.kind==='curse').reduce((q,d)=>{d.dot.expire(t);return q*d.dot.empty;},1);
    if(curseChance>0){let rest=0;for(const d of Object.values(dots))if(d.end>t){rest+=remainingCurse(d);}
     for(const d of [...dotsFromWeapons,...extraDots]){const value=expectedHit(p,d.weapon,d.c,d.f||0,{...opts(true)})*(dotMultiplier(d.kind==='curse')+nightDot())*d.dot.remaining(t)*(d.kind==='poison'?curseChance:1);add(d.id+'-explosion',value*(1+(sp(s,2)?.10:.05)*stacks)*(sp(s,1)?.5:1));if(!sp(s,1)){if(d.kind==='poison')d.dot.consume(curseChance);else d.dot.clear();}}
     add('curse-explosion',rest*(1+(sp(s,2)?.10:.05)*stacks)*(sp(s,1)?.5:1),0,{source:IDS.burst});if(!sp(s,1))for(const d of Object.values(dots)){d.end=t;d.dot?.clear();}
    }break;}
   case 'decay':{
    const self=sp(s,1),key=self?'selfBoost':'decay';
    buffs[key]=t+(self?duration(9+(sp(s,2)?p.selfDurationExtension:0)):curseDuration(9+(sp(s,2)?3:0)));
    if(!self){if(flank('Wand'))direct(s,2,0,1,{projectile:false,off:false});decayProbability=wp(.9,true)*hitRate(s);weaken(1,decayProbability);curseProc();}else if(hasMx('Wand_Rare_Def_Skill')){buffs[key]=t+duration(6);healShield=(p.wandMin+p.wandMax)/2*4;healShieldEnd=buffs[key];}
    if(detail)effectEvents.push({time:t,end:buffs[key],id:s.id,target:self?'self':'enemy',stat:self?'skillBoost':'skillResistance',value:self?p.selfSkillBoost:-p.targetResistanceDrop});
    break;
   }
   case 'spread':curseProc();if(sp(s,3))direct(s,2*(Number(!!activeDot('touch'))+Number(!!activeDot('area'))+Number(buffs.decay>t)),0,1,{projectile:false,off:false});if(sp(s,1)){for(const d of Object.values(dots))if(d.end>t){d.end+=5;d.dot?.extend(t,5);}for(const d of dotsFromWeapons)if(d.kind==='curse')d.dot.extend(t,5);if(buffs.decay>t)buffs.decay+=5;}break;
   case 'mark':if(markEnd>t)markBoom();direct(s,2.8,109);markEnd=t+3;markExplosive=sp(s,2);markSource=s;markPool=0;weaken();break;
   case 'step':charges=Math.min(3,charges+1);buffs.step=t+duration(.5);if(has(PASS.adapt))buffs.adapt=t+duration(3);if(sp(s,1))buffs.wind=t+3;if((sp(s,3)||weapons.has('step'))&&cd[IDS.rapid]!==undefined)changeCooldown(IDS.rapid,t,'Смещение: сброс');break;
   case 'nature':if(natureElement&&mana>=p.mana*.1)buffs.nature=Infinity;break;
   case 'ghost':buffs.ghost=t+duration(6);break;
   case 'rapid':{const boost=weakChance(),mult=sp(s,3)?1.2:1,q=offchance(s),off=rapidOffhandChances(q,sp(s,2));for(let i=0;i<3;i++)enqueue(t+i*.12,()=>{direct(s,1.5+.2*boost,32+7*boost,1,{mult,offChance:off[i]});if(sp(s,4)){const cr=hitRate(s)*criticalRate('Crossbow',has(PASS.ambi)?90:0),cdChance=i===2&&sp(s,2)?q+(1-q)**3/(1-.1*q*cr)**2:q;changeCooldown(s.id,t+Math.max(0,cd[s.id]-t)*remainingCooldownFactor(hitRate(s)*criticalRate('Crossbow'),cr,cdChance),'Скоростная стрельба: крит');}});break;}
   case 'mana':hp-=450*(sp(s,1)?2:1);mana=Math.min(p.mana,mana+590*(sp(s,1)?2:1));break;
   case 'buck':direct(s,2.9,99);if(cd[IDS.step]!==undefined)changeCooldown(IDS.step,cd[IDS.step]-15,'Залп');if(!sp(s,1)){slow=t+3;weaken();}break;
   case 'barrage':{const dur=Math.max(.5,(s.cast-s.hitDelay)/(1+p.speed/100));for(let i=0;i<32;i++)enqueue(t+i*dur/32,()=>direct(s,.27,17,1,{off:false,hitMultiplier:1+.5*offchance(s),mult:1+.08*Math.min(i,10)}));break;}
   case 'shot':{const over=sp(s,2)&&charges>=3;charges-=over?3:1;direct(s,over?9.3:3.1,over?96:32);break;}
   case 'weak':direct(s,5,135);if(p.furyInterval>0&&Math.abs(t%p.furyInterval)<1||sp(s,1)&&sleepEnd>t){weakEnd=t+6*wp(.8);weakCritBonus=21+(flank('Crossbow')?3:0)};break;
   case 'wind':{const wasSlow=slow>t;direct(s,1,0);slow=t+3*wp(.8);weaken();if(wasSlow){battleSpeed=25;battleSpeedEnd=t+3;}break;}
   case 'sleep':if(p.controlImmune)break;slow=t+3*wp(.8);sleepEnd=t+(sp(s,2)?0:3)+curseDuration(15.6);sleepHits=sp(s,1)?2:1;weaken();break;
   case 'heal':if(weapons.has('healOverTime')&&hp<=p.hp*.4&&t>=healProcReady){healProcReady=t+30;for(let i=1;i<=6;i++)enqueue(t+i,()=>hp=Math.min(p.hp,hp+380));}if(hasMx('Wand_Rare_Tac_Skill'))direct(s,6.1,232,1,{off:false,projectile:false});else{heal(s,6.1,232);if(sp(s,4))mana=Math.min(p.mana,mana+(p.wandMin+p.wandMax)*.25);}break;
   case 'healAll':if(weapons.has('groupHeal'))for(let i=1;i<=6;i++)enqueue(t+i,()=>hp=Math.min(p.hp,hp+healValue(.5,0)));if(hasMx('Wand_Rare_Tac_Skill'))for(let i=1;i<=5;i++)enqueue(t+i,()=>direct(s,.9,82,1,{off:false,projectile:false}));else if(sp(s,1)){janiceEnd=t+duration(6);}else heal(s,5.2,469);break;
   case 'healField':for(let i=1;i<=(sp(s,3)?16:12);i++)enqueue(t+i*.5,()=>{if(hasMx('Wand_Rare_Tac_Skill'))direct(s,.9,82,1,{off:false,projectile:false});else{heal(s,.9,82);if(sp(s,1))mana=Math.min(p.mana,mana+40);}});break;
   case 'shield':healShield=healValue(9.9,591,'shield')*(weapons.has('shieldPower')?1.5:1);healShieldEnd=t+duration(6);shieldBuffEnd=healShieldEnd;break;
   case 'trap':enqueue(t+2,()=>{direct(s,6,165,1,{projectile:false,off:false});slow=t+3;weaken();});break;
   case 'laser':{
    // The skill has a normal 1.7 s cast, then a 6 s link with one hit every
    // 0.5 s. The link is a background damage effect: it must not block other
    // skills after the initial cast. Concentrated Beam halves both duration
    // and tick count while doubling its damage.
    const duration=sp(s,4)?3:6,count=sp(s,4)?6:12;
    // effect() already runs at the impact time; do not add hitDelay again.
    for(let i=0;i<count;i++)enqueue(t+(i+1)*duration/count,()=>direct(s,.82,20,1,{off:false,projectile:false,mult:1.3*(1+effectiveHealing()/200)*(sp(s,4)?2:1)}));
    break;
   }
   case 'light':if(sp(s,1)){lightStarted=t;lightDirected=sp(s,2);buffs.light=t+duration(6+(sp(s,3)?1.5:0));if(detail)effectEvents.push({time:t,end:buffs.light,id:s.id,target:'self',stat:'maxDamage',value:p.lightMaxBonus});}break;
  }
 }
 function eligible(s){
  if(s.key==='step'&&stepCharges<=0)return false;
  if(['heal','healAll','healField','shield'].includes(s.key)&&!hasMx('Wand_Rare_Tac_Skill')&&!(s.key==='healAll'&&sp(s,1))&&hp>=p.hp*.9&&!(s.key==='healField'&&sp(s,1)&&mana<p.mana*.8))return false;
  if(s.key==='sleep'&&p.controlImmune)return false;
  if(s.key==='step'&&sp(s,3)&&!sp(s,1)&&cd[IDS.rapid]<=t&&!has(PASS.adapt)&&!list.some(x=>x.key==='shot'))return false;
  if((s.weapon==='Wand'?p.wandMax:p.crossMax)<=0)return false;
  if(cd[s.id]>t+1e-7)return false;
  if(s.key==='nature'&&(!natureElement||mana<Math.max(23,p.mana*.25)))return false;
  if(s.key==='shot'&&charges<=0)return false;
  if(s.key==='mana'&&(mana>p.mana-590*(sp(s,1)?2:1)||hp<=450*(sp(s,1)?2:1)))return false;
  if(s.key==='touch'&&dotStacks()>=2.5&&dots.touch.end-t>3)return false;
  if(s.key==='area'&&(fieldEnd>t||activeDot('area'))&&dots.area.end-t>3)return false;
  if(s.key==='burst'&&dotStacks()<burstStacks-.25&&list.some(x=>x.key==='touch')&&t<295)return false;
  if(s.key==='spread'&&(!sp(s,1)&&!sp(s,3)||!activeDot('touch')&&!activeDot('area')))return false;
  if(s.key==='light'&&!sp(s,1))return false;
  if(s.key==='decay'&&sp(s,1)&&buffs.selfBoost>t)return false;
  if(['nature','ghost','decay','light'].includes(s.key)&&buffs[s.key]>t)return false;
  return true;
 }
 if(natureSkill&&natureElement&&p.mana>0&&p.crossMax>0){buffs.nature=Infinity;counts[IDS.nature]=1;if(detail)logs.push({time:0,id:IDS.nature,name:'Гнев природы — включение до боя',mana:Math.round(mana),duration:0});}
 function natureProc(hits){
  if(buffs.nature<=t)return;
  if(mana<p.mana*.1||mana<23){buffs.nature=0;natureStops++;return;}
  const funded=Math.max(0,Math.min(hits,Math.floor((mana-p.mana*.1)/23)+1,mana/23));
  spendMana(23*funded);natureMana+=23*funded;
  const coefficient={1:.21,2:.21,3:.28,4:.30}[natureElement];
  add('nature-hit',expectedHit(p,'Crossbow',coefficient,0,opts())*funded,0,{weapon:'Crossbow',source:IDS.nature});
  if(natureElement===4)add('nature-lightning',expectedHit(p,'Crossbow',1.2,0,opts())*.145*funded,0,{weapon:'Crossbow',source:IDS.nature});
  if(buffs.ghost>t)extendWeaken(.05*funded*(natureElement===4?1.145:1));combatProcs({id:'nature-hit',key:'nature',weapon:'Crossbow',pve:1,specs:[]},funded*(natureElement===4?1.145:1));
  if(natureElement===2){const q=wp(.3);extraDot('nature-burning','Crossbow',.034,15,3,10,'burn',q,funded);}
  if(natureElement===3){const q=wp(.625);slow=t+1;weaken(1,q*funded,'Гнев природы: холод');}else if(natureElement===1)procGale({key:'rapid',weapon:'Crossbow',pve:1,specs:[1]},wp(.3)*funded);

  if(mana<p.mana*.1){buffs.nature=0;natureStops++;}
 }
 for(let tick=0;tick<6000;tick++){
  t=tick*.05;if(stepCharges<stepChargeMax&&stepChargeReady<=t){stepCharges++;stepChargeReady=t+cooldownSeconds(byId.get(IDS.step)?.cooldownSec||11.8,p.cooldown);if(stepCharges>0)cd[IDS.step]=t;}const extraRegen=(mana<=p.mana*.3?260*rank('Crossbow_Hero_Util_02'):0)+(spiritEnd>t&&!hasMx('Wand_Normal_Util_Skill')?pv('WP_WA_GR_S_SupportAllyCostRegenUp','Восстановление маны ▲',38)*spiritStacks:0)+(killEnd>t?28*corruptionStacks:0);mana=Math.min(p.mana,mana+(p.regen+extraRegen)/p.regenPeriod*.05);
  if(p.incomingDps>0){let incoming=p.incomingDps*.05*(shieldBuffEnd>t&&weapons.has('shieldPlus')?.95:1);if(healShieldEnd<=t)healShield=0;if(commonShieldEnd<=t)commonShield=0;const blocked=Math.min(commonShield,incoming);commonShield-=blocked;incoming-=blocked;const absorb=Math.min(healShield,incoming);healShield-=absorb;incoming-=absorb;if(common.has('WM_Common_SKILL_010')&&hp>=p.hp*.9&&t-healthySince>=5&&t>=shieldCommonReady){commonShield=Number(totalAttributes(state,catalog).con)*120;commonShieldEnd=t+3;shieldCommonReady=t+60;}hp=Math.max(0,hp-incoming);
   if(has('WP_WA_GR_S_HealEffectUpWhenSkillDamageTaken')&&p.enemyAttacks>0){holyStacks=stackGain('holy',.2*.05*p.enemyAttacks,3,5);holyEnd=t+3;}
   if(hp<p.hp*.9)healthySince=t;}
  if(p.furyInterval>0&&tick>0&&tick%Math.max(1,Math.round(p.furyInterval/.05))===0){const defensive=state.defensive?.[0];if(defensive==='WP_CR_S_ActionSkill')add('defense-counter',expectedHit(p,'Crossbow',p.moving?4.5:2.25,p.moving?100:50,opts()));else if(defensive==='WP_WA_GR_S_CounterMove'){if(p.moving)add('defense-counter',expectedHit(p,'Wand',5.2,197,{...opts(),skillMultiplier:1+.1*dotStacks()}));else{for(const cursed of list)if(['touch','area','burst','decay','spread'].includes(cursed.key))changeCooldown(cursed.id,cd[cursed.id]-3,'Щит Хаоса');putDot('touch',{id:IDS.touch,key:'touch',weapon:'Wand',pve:1,specs:[]},.41,37,9);}}defenseTimes.push(t);defenseTimes=defenseTimes.filter(x=>x>=t-1);if(common.has('WM_Common_SKILL_003')&&defenseTimes.length>=3&&t>=defenseWaveReady){defenseWaveReady=t+20;add('defense-wave',expectedHit(p,p.mainWeapon,1,0,opts()));}}
  if(p.killInterval>0&&tick>0&&tick%Math.max(1,Math.round(p.killInterval/.05))===0){if(has('WP_WA_GR_S_CurseKillBonus')&&!hasMx('Wand_Normal_Tac_Skill')){corruptionStacks=Math.min(3,corruptionStacks+1);killEnd=t+duration(9);}if(common.has('WM_Common_SKILL_004')&&t>=killProcReady){killProcReady=t+20;for(const s of list)if(s.useType==='kSurvival')changeCooldown(s.id,cd[s.id]-3,'Мастерство: убийство');}}
  if(common.has('WM_Common_SKILL_006')&&!p.moving&&t>=viperReady){viperEnd=t+9;viperReady=t+60;}
  if(common.has('WM_Common_SKILL_011')&&p.moving&&t>=lightningReady){lightningEnd=t+3;lightningReady=t+30;}
  if(fieldEnd>t&&fieldNext<=t){fieldNext=t+1;if(!activeDot('area'))putDot('area',fieldSource,sp(fieldSource,1)?.6:.65,sp(fieldSource,1)?22:73,9);}
  if(buffs.nature>t&&mana<p.mana*.1){buffs.nature=0;natureStops++;}if(buffs.nature>t)natureUptime+=.05;
  if(markEnd&&markEnd<=t)markBoom();
  for(const d of [...dotsFromWeapons,...extraDots]){const ticks=d.dot.tick(t);if(ticks)add(d.id,expectedHit(p,d.weapon,d.c,d.f||0,{...opts(true)})*ticks*(dotMultiplier(d.kind==='curse')+nightDot()),0,{weapon:d.weapon,mechanism:'dot',dotType:d.kind==='burn'?'burning':d.kind==='curse'?'curse':d.kind==='poison'?'poison':'other'});}
  while(pending.length&&pending[0].at<=t+1e-7)pending.shift().fn();
  for(const d of Object.values(dots)){if(d.dot){const ticks=d.dot.tick(t);if(ticks){add(d.s.id,dotDamage(d,ticks),0,{weapon:d.s.weapon,mechanism:'dot',dotType:'curse'});flower(d.s);}}else if(d.next<=t+1e-7&&d.next<=d.end+1e-7){add(d.s.id,dotDamage(d),0,{weapon:d.s.weapon,mechanism:'dot',dotType:'curse'});flower(d.s);d.next+=1;}}
  if(common.has(COMMON_IDS.crisis)&&hp<p.hp*.5&&t>=crisisReady){crisisEnd=t+5;crisisReady=t+60;}
  if(t+1e-7<busy)continue;
  let chosen=natureSkill&&eligible(natureSkill)?natureSkill:null,unfunded=false;
  const available=[];
  for(const s of list)if(eligible(s)){const cost=s.manaCost/(1+p.efficiency/100);if(mana+1e-7>=cost)available.push(s);else unfunded=true;}
  if(!chosen)chosen=available[0]||null;
  if(rotationPolicy&&markSkillExplosive()){
   const speed=1+(p.speed+(buffs.step>t?20:0)+(crisisEnd>t?20:0)+(battleSpeedEnd>t?battleSpeed:0)+bloodlustSpeed())/100;
   const impact=s=>Math.min(actionDuration(s,p,speed)+p.latency,Math.max(.05,s.hitDelay/speed));
   const mark=byId.get(IDS.mark),windowEnd=markEnd>t?markEnd:0;
   const attacks=(rotationPolicy.burstFirst?['burst','rapid']:['rapid','burst']).map(key=>available.find(s=>s.key===key)).filter(Boolean);
   if(windowEnd){
    // Use actual impact times, not button-start times. Never refresh a live
    // mark ahead of an attack that can still land in its accumulation window.
    const attack=attacks.find(s=>t+impact(s)<windowEnd-1e-7);
    if(attack)chosen=attack;
   }else if(attacks.length){
    const markReady=available.includes(mark),wait=Math.max(0,cd[IDS.mark]-t);
    if(markReady){
     const setup=rotationPolicy.setup?['light','decay','ghost'].map(key=>available.find(s=>s.key===key)).find(Boolean):null;
     chosen=setup||mark;
    }else if(wait>0&&wait<=rotationPolicy.holdSeconds&&mana>=mark.manaCost/(1+p.efficiency/100)){
     // Fill a short wait only with an action that ends before the mark is
     // ready; otherwise keep autoattacking. Resource recovery remains eligible.
     const filler=available.find(s=>!['rapid','burst','mark'].includes(s.key)&&actionDuration(s,p,speed)+p.latency<=wait);
     chosen=filler||null;if(!chosen)planningWait+=.05;
    }
   }
  }
  if(chosen){
   const s={...chosen,castToken:++castSerial},speed=1+(p.speed+(buffs.step>t?20:0)+(crisisEnd>t?20:0)+(battleSpeedEnd>t?battleSpeed:0)+bloodlustSpeed())/100;
   const cast=actionDuration(s,p,speed)+p.latency;
   if(t+Math.min(cast,Math.max(.05,s.hitDelay/speed))>=300)continue;
   spendMana(s.manaCost/(1+p.efficiency/100));
   let cooldown=s.cooldownSec;if(['heal','healAll','healField','shield'].includes(s.key))cooldown*=1-.14*rank('Wand_Hero_Defense_03');if(weapons.has('healCooldown')&&p.giantBlessing&&['heal','healAll','healField'].includes(s.key))cooldown*=.6;if(s.key==='laser'&&sp(s,3))cooldown-=6;if(s.key==='rapid'&&sp(s,3))cooldown+=3;if(s.key==='buck')cooldown+=sp(s,1)?-6:sp(s,2)?9:0;if(s.key==='burst'&&sp(s,3))cooldown-=6;if(s.key==='weak'&&sp(s,2))cooldown*=.8;if(s.key==='mana'&&sp(s,1))cooldown*=2;
   if(has(PASS.night)&&nightFactor>0&&['touch','area','burst','decay','spread'].includes(s.key)&&!(s.key==='decay'&&sp(s,1)))cooldown*=1-.1*nightFactor;
   if(has(PASS.night)&&['heal','healAll','healField'].includes(s.key))cooldown*=1-.1*dayFactor;
   cd[s.id]=t+cooldownSeconds(cooldown,p.cooldown+(crisisEnd>t?35:0));busy=t+cast;if(s.key==='step'){stepCharges--;if(stepCharges===stepChargeMax-1)stepChargeReady=cd[s.id];if(stepCharges>0)cd[s.id]=t;}counts[s.id]=(counts[s.id]||0)+1;
   if(detail){const previous=cycleById.get(s.id);if(previous){previous.nextCast=t;cooldownCycles.push(previous);}cycleById.set(s.id,{id:s.id,start:t,scheduledReady:cd[s.id],reductions:{}});}
   if(detail)logs.push({time:+t.toFixed(2),id:s.id,name:s.key==='decay'?(sp(s,1)?'Час преодоления — на себя':'Час отмщения — на цель'):s.key==='light'?'Свет доблести — на себя':s.name,mana:Math.round(mana),duration:cast});
   enqueue(t+(s.key==='step'?cast:Math.min(cast,Math.max(.05,s.hitDelay/speed))),()=>effect(s));
  }else{
   if(unfunded)starved+=.05;
   if(p.auto&&(p.mainWeapon==='Wand'?p.wandMax:p.crossMax)>0&&t+1e-7>=nextAuto){const s={id:'auto',weapon:p.mainWeapon,pve:1,key:'auto',specs:[]};const extra=s.weapon==='Crossbow'?offchance(s):0;const main=expectedHit(p,s.weapon,1,0,{...opts(),skill:false,skillMultiplier:1+.1*dotStacks()}),off=extra*expectedHit(p,'Crossbow',1,0,{...opts(false,true),skill:false,skillMultiplier:1+.1*dotStacks()}),v=main+off;const parts=detail&&s.weapon==='Crossbow'&&off>0?[{...eventInfo('auto',{weapon:s.weapon,hand:'main'}),value:main},{...eventInfo('auto',{weapon:s.weapon,hand:'off'}),value:v-main}]:null;add('auto',v,0,{weapon:s.weapon,hand:s.weapon==='Crossbow'?'main':'none'},parts);weaponHit(s,hitRate(s),extra);combatProcs(s,(1+extra)*hitRate(s));flower(s);natureProc(1+extra);if(markEnd>t&&!markExplosive)add('mark-hit',hitValue(markSource,.23,15)*(1+extra));if(buffs.ghost>t){for(const d of Object.values(dots))if(d.end>t){d.end+=.05*(1+extra);d.dot?.extend(t,.05*(1+extra));}for(const d of dotsFromWeapons)d.dot.extend(t,.05*(1+extra));if(markEnd>t)markEnd+=.05*(1+extra);if(buffs.decay>t)buffs.decay+=.05*(1+extra);}nextAuto=t+intervalWithSpeedBonus(p.mainWeapon==='Wand'?{...p,interval:p.wandInterval||2}:p,(buffs.step>t?20:0)+(crisisEnd>t?20:0)+(battleSpeedEnd>t?battleSpeed:0)+bloodlustSpeed());}
  }
 }
 return {total,dps:total/300,counts,damage,logs,damageEvents,damageBreakdown:detail?breakdown(damageEvents):null,effectEvents,cooldownCycles,bins,minMana,mana,hp,enemyMana,shield:healShield,starved,natureMana,natureUptime,natureStops,natureElement,healing:p.healing,priority,burstStacks,rotationPolicy,planningWait};
 function markSkillExplosive(){const mark=byId.get(IDS.mark);return list.includes(mark)&&mark.specs.includes(2);}
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
  const ns={nature:[4],mana:[1],light:[1],decay:[1],ghost:[4],mark:[2],touch:[2,3],area:[3],spread:[1,3],burst:preserve?[1,2,3]:[2,3],laser:[3,4],rapid:[]};
  const preferred=Object.fromEntries(keys.map(k=>[IDS[k],catalog.skills.find(s=>s.id===IDS[k]).specializations.filter(t=>ns[k].includes(Number(t.id.split('_').at(-1)))).map(t=>t.id)]));
  const specs=allocateSpecializations(catalog,priority,preferred,()=>0,target);
  if(specs)result.push({name:`Проклятия + усиления · ${preserve?'сохранение':'снятие'} · ${stacks} ур.`,priority,specs,burstStacks:stacks});
 }
 return result;
}
export function interactionComparison(input,result){
 const replay={...input,state:{...input.state,active:result.priority,specs:result.specs||input.state.specs},priority:result.priority,burstStacks:result.burstStacks,rotationPolicy:result.rotationPolicy};
 // Leave the buff casts, costs and uptime intact. Disable only their numerical
 // bonuses; removing their buttons would also change opportunity costs.
 const without=simulate({...replay,params:{...input.params,lightMaxBonus:0,selfSkillBoost:0}});
 return {withoutPersonalBonuses:without.dps,personalBonusDelta:result.dps-without.dps};
}
// Compare bounded, conditional action sequences over the entire fight. Keeping
// the unplanned incumbent makes waiting/setup optional, never a prescribed gain.
export function planRotation(input,result,progress=()=>{}){
 const baseSpecs=result.specs||input.state.specs,variants=[baseSpecs],catalog=input.catalog;
 const cost=specs=>catalog.skills.reduce((n,s)=>n+(s.specializations||[]).filter(t=>specs[s.id]?.includes(t.id)).reduce((a,t)=>a+Number(t.cost),0),0);
 if(input.mode==='all'&&result.priority.includes(IDS.decay)){
  const fixed=Object.fromEntries([...(input.state.passive||[]),...(input.state.defensive||[])].filter(Boolean).map(id=>[id,baseSpecs[id]||[]]));
  const others=result.priority.filter(id=>id!==IDS.decay);
  for(const option of specializationOptions(catalog,IDS.decay)){
   let specs={...baseSpecs,[IDS.decay]:option.ids};
   if(cost(specs)>100){const allocated=allocateSpecializations(catalog,others,baseSpecs,()=>0,100-cost(fixed)-option.cost);if(!allocated)continue;specs={...fixed,...allocated,[IDS.decay]:option.ids};}
   if(!variants.some(v=>JSON.stringify(v)===JSON.stringify(specs)))variants.push(specs);
  }
 }
 let best=result,tested=0;const comparison={self:null,target:null};
 const explosive=(catalog.skills.find(s=>s.id===IDS.mark)?.specializations||[]).find(t=>t.id.endsWith('_2'))?.id;
 for(const specs of variants){
  const policies=[null];
  if(result.priority.includes(IDS.mark)&&specs[IDS.mark]?.includes(explosive))for(const setup of [false,true])for(const burstFirst of [false,true])for(const holdSeconds of [0,.35,.7,1.2])policies.push({setup,burstFirst,holdSeconds});
  for(const rotationPolicy of policies){
   const trial=simulate({...input,state:{...input.state,active:result.priority,specs},priority:result.priority,burstStacks:result.burstStacks,rotationPolicy});tested++;
   if(result.priority.includes(IDS.decay)){
    const self=specs[IDS.decay]?.some(id=>id.endsWith('_1')),key=self?'self':'target';
    if(!comparison[key]||trial.dps>comparison[key].dps)comparison[key]={dps:trial.dps,specPoints:cost(specs),rotationPolicy,specs};
   }
   if(trial.total>best.total)best={...trial,specs};
  }
  progress({phase:'planning',done:tested,budget:variants.length*33,dps:best.dps});
 }
 const specs=best.specs||baseSpecs,state={...input.state,active:best.priority,specs};
 const replay=simulate({...input,state,priority:best.priority,burstStacks:best.burstStacks,rotationPolicy:best.rotationPolicy},true);
 return {...result,...replay,specs,specPoints:cost(specs),tested:(result.tested||0)+tested,utilityPoints:specializationUtility(catalog,specs),warnings:coverage(state,catalog),planning:{tested,beforeDps:result.dps,gainDps:replay.dps-result.dps,comparison,fixedSpecializations:input.mode!=='all'}};
}
export function optimize(input,progress=()=>{}){
 if(input.mode!=='all'){const result=planRotation(input,{...optimizeFixed(input,progress),specs:structuredClone(input.state.specs)},progress);return {...result,interaction:interactionComparison(input,result)};}
 let seed=78231;const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const pool=Object.values(IDS);
 const fixedIds=[...(input.state.passive||[]),...(input.state.defensive||[])].filter(Boolean);
 const fixedSpecs=Object.fromEntries(fixedIds.map(id=>[id,input.state.specs[id]||[]]));
 const fixedCost=input.catalog.skills.filter(s=>fixedIds.includes(s.id)).reduce((n,s)=>n+(s.specializations||[]).filter(t=>fixedSpecs[s.id]?.includes(t.id)).reduce((a,t)=>a+Number(t.cost),0),0);
 const target=100-fixedCost;if(target<0)throw new Error('Специализации фиксированных умений превышают 100 очков.');
 const original=input.state.active.filter(id=>pool.includes(id));
 const baseline=simulate({...input,priority:original});
 const cache=new Map();
 const run=(priority,specs,burstStacks=3,detail=false)=>{const key=JSON.stringify([priority,priority.map(id=>specs[id]||[]),burstStacks]);if(!detail&&cache.has(key))return cache.get(key);const r=simulate({...input,state:{...input.state,active:priority,specs:{...fixedSpecs,...specs}},priority,burstStacks},detail);if(!detail)cache.set(key,r);return r;};
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
  supportTrials.push({id,pass,before,after:best.dps});progress({phase:'support',done:0,budget,dps:best.dps,tested});

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
 const planned=planRotation(input,result,progress);return {...planned,interaction:interactionComparison(input,planned)};
}
