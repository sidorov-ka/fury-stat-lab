import {TREES,normalizeTree} from './mastery-tree.js?v=cdr-sources-20261016';
export function masteryEffects(state){
 const out={};for(const [key,tree] of Object.entries(TREES)){const selected=normalizeTree(tree,state.masteryTrees?.[key]);for(const n of tree.nodes)if(selected[n.id])out[n.id]=n.type==='synergy'?1:selected[n.id]/n.max;}return out;
}
export const signedChance=(rating,k=1000)=>rating/(Math.abs(rating)+k);
export function weakenProbability(base,rating=0,resistance=0,curseBonus=0){return Math.max(0,Math.min(1,(base+curseBonus)*(1+signedChance(rating-resistance))));}
export function remainingCooldownFactor(mainCritical,offhandCritical=0,offhandChance=0){return (1-.1*mainCritical)*(1-.1*offhandChance*offhandCritical);}
export function cooldownSeconds(base,haste=0){return Math.max(.05,base/(1+Math.max(0,haste)/100));}
// Bloodlust is a self buff, not a weaken application or a cooldown proc.
// Probability branches preserve the fixed expiry after reaching ten stacks.
export class Bloodlust{
 constructor(){this.empty=1;this.states=[];}
 expire(t){this.states=this.states.filter(s=>{if(s.end<=t+1e-7){this.empty+=s.weight;return false;}return true;});}
 apply(t,probability=1){
  this.expire(t);const q=Math.max(0,Math.min(1,probability));if(!q)return;
  const rows=[];if(this.empty*q>1e-12)rows.push({weight:this.empty*q,stacks:1,end:t+3});this.empty*=1-q;
  for(const s of this.states){
   if(s.stacks===10){rows.push(s);continue;}
   if(q<1)rows.push({...s,weight:s.weight*(1-q)});
   rows.push({weight:s.weight*q,stacks:s.stacks+1,end:t+3});
  }
  const merged=new Map();for(const s of rows){if(s.weight<1e-12)continue;const key=s.stacks+':'+Math.round(s.end*1e6),previous=merged.get(key);if(previous)previous.weight+=s.weight;else merged.set(key,{...s});}this.states=[...merged.values()];
 }
 value(t){this.expire(t);return {stacks:this.states.reduce((n,s)=>n+s.weight*s.stacks,0),critical:this.states.reduce((n,s)=>n+(s.stacks===10?s.weight:0),0)};}
}
export function nightMultiplier(dayNode,nightNode,night){return dayNode&&nightNode?1.2:night?(nightNode?1.2:dayNode?.5:1):(dayNode?1.2:nightNode?.5:1);}
// The RU data's zero castTime is not the duration of a fixed-time movement animation.
export function actionDuration(skill,params,speed){return skill.key==='step'?Math.max(params.animationFloor,params.stepDuration??1):Math.max(params.animationFloor,skill.cast/speed);}
export const NUMERIC_MASTERY={Wand_High_Attack_01:{curseDuration:1},Wand_Rare_Attack_01:{dotDamage:5},Crossbow_Hero_Util_02:{mana:-1000},Wand_Hero_Tactic_04:{curseDamage:-12,healing:12},Wand_Hero_Defense_03:{healingCooldown:14}};
