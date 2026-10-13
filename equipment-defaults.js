import {traitLimit} from './engine.js?v=t2-mechanics-20261013';
export function equipmentDraft(item,current){return current?.id===item.id?structuredClone(current):{id:item.id,level:Number(item.enchantMaxLevel)||0,traits:[]};}
export const newTrait=(item,id)=>({id,level:traitLimit(item.grade)});
