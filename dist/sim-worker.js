import {optimize,simulate} from './simulator.js?v=damage-model-20261027c';
const changes=[
 ['critM',100,'Магия: критический удар +100'],['critR',100,'Дальний бой: критический удар +100'],
 ['heavyM',100,'Магия: мощная атака +100'],['heavyR',100,'Дальний бой: мощная атака +100'],
 ['boost',10,'Повышение урона умений +10'],['bonus',10,'Дополнительный урон +10'],
 ['magicDamage',10,'Урон магией +10%'],['rangeDamage',10,'Урон дальнего боя +10%'],
 ['buffDuration',10,'Длительность положительных эффектов +10%'],['offhandBase',5,'Базовый шанс парной атаки +5 п.п.']
];
export function sensitivity(input,result){
 const replay={...input,state:{...input.state,active:result.priority,specs:result.specs},priority:result.priority,burstStacks:result.burstStacks,rotationPolicy:result.rotationPolicy};
 return changes.map(([key,delta,label])=>{
  const original=key==='offhandBase'?(input.params.offhandBase??input.params.offhand??0):(input.params[key]??0);
  const params={...input.params,[key]:Number(original)+delta};
  const changed=simulate({...replay,params});const diff=changed.dps-result.dps;
  return {key,delta,label,dps:changed.dps,difference:diff,percent:result.dps?100*diff/result.dps:null};
 });
}
if(typeof self!=='undefined')self.onmessage=e=>{try{const result=optimize(e.data,p=>self.postMessage({type:'progress',...p}));self.postMessage({type:'progress',phase:'sensitivity',done:0,budget:changes.length,dps:result.dps});result.sensitivity=sensitivity(e.data,result);self.postMessage({type:'result',result});}catch(e){self.postMessage({type:'error',message:e.message});}};
