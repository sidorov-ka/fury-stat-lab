import {TREES} from './mastery-data.js';
export {TREES};
const parts=c=>({attackutil:['attack','util'],utildefense:['util','defense'],defensetactic:['defense','tactic'],tacticattack:['tactic','attack']}[c]||[c]);
export const isAutomaticNode=n=>n.type==='synergy'&&n.max===1;
const free=isAutomaticNode;
export const nodeRows=(n,l)=>l>0?(n.levels[l-1]||n.stats||[]):[];
export function summary(tree,selected={}){
 const out={total:0,grades:{},sectors:{},epic:0};
 for(const n of tree.nodes){const l=Number(selected[n.id])||0;if(!l||free(n))continue;out.total+=l;out.grades[n.grade]=(out.grades[n.grade]||0)+l;for(const c of parts(n.category)){const k=n.ring+':'+c;out.sectors[k]=(out.sectors[k]||0)+l;}if(n.grade==='epic')out.epic++;}
 return out;
}
export function lockReason(tree,n,selected={}){
 const s=summary(tree,selected);
 if(n.type==='synergy'){
  const points=Math.max(...parts(n.category).map(c=>s.sectors[n.ring+':'+c]||0));
  if(points<(n.required||20))return 'Нужно '+(n.required||20)+' очков в этом секторе кольца';
 }else if(n.grade==='epic'){
  const required=selected[n.id]?(s.epic>1?120:80):(s.epic?120:80);
  if(s.total<required)return 'Нужно '+required+' очков в дереве';
  if(s.epic>=2&&!selected[n.id])return 'Не более двух эпических узлов';
  if(!tree.nodes.some(x=>x.type==='synergy'&&selected[x.id]&&parts(x.category).some(c=>parts(n.category).includes(c))))return 'Нужен открытый ключевой узел этого сектора';
 }else{const prev={uncommon:'common',rare:'uncommon'}[n.grade];if(prev&&(s.grades[prev]||0)<30)return 'Нужно 30 очков на предыдущем кольце';}
 return '';
}
export function normalizeTree(tree,selected={}){
 const out={};let spent=0;
 // Saved automatic flags are never authoritative: derive them from paid nodes.
 for(const [id,value] of Object.entries(selected||{})){const n=tree.nodes.find(n=>n.id===id);if(!n||free(n))continue;const l=Math.max(0,Math.min(n.max,Math.trunc(Number(value)||0),200-spent));if(l){out[id]=l;spent+=l;}}
 const syncAutomatic=()=>{for(const n of tree.nodes.filter(free)){if(lockReason(tree,n,out))delete out[n.id];else out[n.id]=1;}};
 for(let pass=0;pass<tree.nodes.length;pass++){
  syncAutomatic();let changed=false;
  for(const n of tree.nodes)if(!free(n)&&out[n.id]&&lockReason(tree,n,out)){delete out[n.id];changed=true;}
  if(!changed)break;
 }
 syncAutomatic();return out;
}
export function changeNode(tree,selected,id,delta){
 const n=tree.nodes.find(n=>n.id===id);if(!n)return {selected,error:'Узел не найден'};
 if(free(n))return {selected:normalizeTree(tree,selected),error:''};
 selected=normalizeTree(tree,selected);
 const old=selected[id]||0;
 if(delta>0){const reason=lockReason(tree,n,selected);if(reason)return {selected,error:reason};if(old>=n.max)return {selected,error:'Достигнут максимальный уровень'};if(!free(n)&&summary(tree,selected).total>=200)return {selected,error:'Лимит дерева — 200 очков'};}
 return {selected:normalizeTree(tree,{...selected,[id]:Math.max(0,Math.min(n.max,old+delta))}),error:''};
}
export function treeStats(state,weapon=null){
 const stats={};for(const [key,tree] of Object.entries(TREES)){if(weapon&&key!==weapon)continue;const selected=normalizeTree(tree,state.masteryTrees?.[key]);for(const n of tree.nodes)for(const r of nodeRows(n,selected[n.id]))if(Number.isFinite(r.value))stats[r.stat]=(stats[r.stat]||0)+r.value;}
 return stats;
}
export function treeWarnings(state){
 const warnings=[];for(const [key,tree] of Object.entries(TREES)){const selected=normalizeTree(tree,state.masteryTrees?.[key]);for(const n of tree.nodes)if(selected[n.id]&&!nodeRows(n,selected[n.id]).length)warnings.push(tree.name+' — '+n.name+': условный эффект мастерства пока не моделируется.');}return warnings;
}
