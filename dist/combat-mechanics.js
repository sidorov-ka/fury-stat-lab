import {TREES,normalizeTree} from './mastery-tree.js?v=t2-mechanics-20261013';
export function masteryEffects(state){
 const out={};for(const [key,tree] of Object.entries(TREES)){const selected=normalizeTree(tree,state.masteryTrees?.[key]);for(const n of tree.nodes)if(selected[n.id])out[n.id]=n.type==='synergy'?1:selected[n.id]/n.max;}return out;
}
export const signedChance=(rating,k=1000)=>rating/(Math.abs(rating)+k);
export function weakenProbability(base,rating=0,resistance=0,curseBonus=0){return Math.max(0,Math.min(1,(base+curseBonus)*(1+signedChance(rating-resistance))));}
export function remainingCooldownFactor(mainCritical,offhandCritical=0,offhandChance=0){return (1-.1*mainCritical)*(1-.1*offhandChance*offhandCritical);}
export function nightMultiplier(dayNode,nightNode,night){return dayNode&&nightNode?1.2:night?(nightNode?1.2:dayNode?.5:1):(dayNode?1.2:nightNode?.5:1);}
// The RU data's zero castTime is not the duration of a fixed-time movement animation.
export function actionDuration(skill,params,speed){return skill.key==='step'?Math.max(params.animationFloor,params.stepDuration??1):Math.max(params.animationFloor,skill.cast/speed);}
export const NUMERIC_MASTERY={Wand_High_Attack_01:{curseDuration:1},Wand_Rare_Attack_01:{dotDamage:5},Crossbow_Hero_Util_02:{mana:-1000},Wand_Hero_Tactic_04:{curseDamage:-12,healing:12},Wand_Hero_Defense_03:{healingCooldown:14}};
