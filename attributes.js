import {ATTRS,totalAttributes} from './engine.js?v=build-only-1';
export const ATTRIBUTE_BUDGET=54;
export function attributeCost(value){const n=Math.max(0,Math.floor(value)-10);return Math.min(20,n)+2*Math.min(20,Math.max(0,n-20))+4*Math.max(0,n-40);}
export const spentAttributes=attrs=>ATTRS.reduce((s,[k])=>s+attributeCost(attrs[k]??10),0);
export function migrateAttributes(state,catalog){
 if(state.attributeVersion===1)return;
 state.attributeBackup={attrs:{...state.attrs},attrMode:state.attrMode};
 const totals=totalAttributes(state,catalog);
 const bonuses=totalAttributes({...state,attrMode:'base',attrs:Object.fromEntries(ATTRS.map(([k])=>[k,0]))},catalog);
 state.attributeAdjustments={};
 for(const [k] of ATTRS){const wanted=state.attrMode==='total'?totals[k]-bonuses[k]:Number(state.attrs[k]||10);state.attrs[k]=Math.max(10,Math.floor(wanted));state.attributeAdjustments[k]=wanted-state.attrs[k];}
 state.attrMode='base';state.attributeVersion=1;state.characterLevel=55;
}
