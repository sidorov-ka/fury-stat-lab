import {COMMON_PASSIVES} from './common-mastery-data.js?v=t2-chance-20261013';
export {COMMON_PASSIVES};
export const COMMON_IDS={spear:'WM_Common_SKILL_002',crisis:'WM_Common_SKILL_001',dragon:'WM_Common_SKILL_008',reserve:'WM_Common_SKILL_007',flower:'WM_Common_SKILL_009'};
export function normalizeCommon(value={}){
 const level=Math.max(0,Math.min(1600,Math.trunc(Number(value.level)||0))),slots=Math.min(4,Math.floor(level/130)),seen=new Set();
 const selected=Array.from({length:4},(_,i)=>{const id=Array.isArray(value.selected)?value.selected[i]:null,p=COMMON_PASSIVES.find(p=>p.id===id);if(i>=slots||!p||p.requiredLevel>level||seen.has(id))return null;seen.add(id);return id;});
 return {level,selected};
}
export const commonSelection=state=>normalizeCommon(state.commonMastery).selected.filter(Boolean);
export function commonStats(state){return commonSelection(state).includes(COMMON_IDS.reserve)?{str:1,dex:1,int:1,per:1,con:1}:{};}
export function commonWarnings(state){return commonSelection(state).filter(id=>!Object.values(COMMON_IDS).includes(id)).map(id=>`${COMMON_PASSIVES.find(p=>p.id===id)?.name}: эффект зависит от условий боя и включается при выполнении условия.`);}
export function mountCommon(host,getState,onChange){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function render(){const state=getState(),value=normalizeCommon(state.commonMastery);state.commonMastery=value;
 host.innerHTML=`<div class="section-head"><h3>Общие умения мастерства</h3><label class="inline-label">Общий уровень<input id="common-level" type="number" min="0" max="1600" value="${value.level}" aria-label="Общий уровень мастерства"></label></div><div class="mastery-presets">${[130,260,390,520,650,780,1600].map(level=>`<button type="button" data-common-level="${level}" class="quiet">${level}</button>`).join('')}</div><div class="common-grid">${value.selected.map((id,i)=>{const current=COMMON_PASSIVES.find(p=>p.id===id),locked=value.level<(i+1)*130;return `<div class="common-card ${locked?'locked':''}"><div class="common-card-head">${current?`<img src="${esc(current.icon)}" alt="">`:'<span class="common-placeholder">✦</span>'}<label>Умение ${i+1}<select data-common="${i}" aria-label="Общее умение ${i+1}" ${locked?'disabled':''}><option value="">${locked?'Откроется на уровне '+((i+1)*130):'Выбрать умение'}</option>${COMMON_PASSIVES.filter(p=>p.requiredLevel<=value.level).map(p=>`<option value="${p.id}" ${id===p.id?'selected':''} ${value.selected.includes(p.id)&&id!==p.id?'disabled':''}>${esc(p.name)}</option>`).join('')}</select></label></div>${current?`<details><summary>Эффект умения</summary><p class="description">${esc(current.description)}</p></details>`:''}</div>`;}).join('')}</div>`;
 host.querySelectorAll('[data-common-level]').forEach(button=>button.onclick=()=>{state.commonMastery=normalizeCommon({...value,level:Number(button.dataset.commonLevel)});render();onChange();});
 host.querySelector('#common-level').onchange=e=>{state.commonMastery=normalizeCommon({...value,level:e.target.value});render();onChange();};
 host.querySelectorAll('[data-common]').forEach(el=>el.onchange=()=>{value.selected[Number(el.dataset.common)]=el.value||null;state.commonMastery=normalizeCommon(value);render();onChange();});
 }render();
}
