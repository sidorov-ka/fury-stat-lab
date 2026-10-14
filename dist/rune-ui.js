import {runeSlots,maxRuneChoices,maxRuneSelection,normalizeMaxRunes,runeSynergies,applyRuneSynergy} from './runes.js?v=ru-october-20261014';
export function mountRunes(host,item,entry,catalog,statRows,escape){
 if(!runeSlots(item))return;
 const choices=maxRuneChoices(item),types={Attack:'Атака',Defense:'Защита',Assist:'Поддержка'};
 entry.runes=normalizeMaxRunes(item,entry);
 const label=stat=>catalog.labels[stat]||stat,icon=r=>`icons/runes/${r.thumbnail.split('/').at(-1)}`;
 function render(){
 const order=entry.runes.map(s=>choices.find(r=>r.id===s?.runeId)?.type||'').join('-');
 host.innerHTML=`<h3>Руны</h3><label class="compact-rune-synergy">Синергия<select data-synergy aria-label="Синергия рун"><option value="">Выбрать синергию</option>${runeSynergies(item).map(s=>`<option value="${s.order}" ${s.order===order?'selected':''}>${escape(s.stats.map(r=>label(r.stat)).join(' · '))}</option>`).join('')}</select></label><div class="compact-rune-rows">${entry.runes.map((s,i)=>{const r=choices.find(r=>r.id===s?.runeId);return `<div class="compact-rune-row"><details class="compact-rune-kind" data-rune-slot="${i}"><summary aria-label="Выбрать руну в гнезде ${i+1}">${r?`<img src="${escape(icon(r))}" alt=""><span>${types[r.type]}</span>`:'<span class="compact-rune-empty">+</span><span>Руна</span>'}<span class="compact-rune-arrow">⌄</span></summary><div class="compact-rune-options">${choices.map(choice=>`<button type="button" data-rune-choice="${choice.type}" data-slot="${i}" aria-label="Гнездо ${i+1}: ${types[choice.type]}" class="${r?.type===choice.type?'chosen':''}"><img src="${escape(icon(choice))}" alt=""><span>${types[choice.type]}</span></button>`).join('')}</div></details><select data-rune-property="${i}" aria-label="Свойство руны в гнезде ${i+1}" ${r?'':'disabled'}>${r?r.statPool.map(p=>`<option value="${escape(p.stat)}" ${p.stat===s.stat?'selected':''}>${escape(label(p.stat))}</option>`).join(''):'<option>Свойство</option>'}</select><button type="button" data-remove-rune="${i}" class="compact-rune-remove" aria-label="Убрать руну из гнезда ${i+1}" ${r?'':'disabled'}>×</button></div>`;}).join('')}</div>`;
 host.querySelector('[data-synergy]').onchange=e=>{if(e.target.value){entry.runes=applyRuneSynergy(item,entry,e.target.value);render();}};
 host.querySelectorAll('[data-rune-slot]').forEach(details=>details.ontoggle=()=>{if(details.open)host.querySelectorAll('[data-rune-slot]').forEach(other=>{if(other!==details)other.open=false;});});
 host.querySelectorAll('[data-rune-choice]').forEach(button=>button.onclick=()=>{const i=Number(button.dataset.slot);entry.runes[i]=maxRuneSelection(item,button.dataset.runeChoice,entry.runes[i]?.stat);render();host.querySelector(`[data-rune-property="${i}"]`).focus({preventScroll:true});});
 host.querySelectorAll('[data-rune-property]').forEach(select=>select.onchange=()=>{entry.runes[Number(select.dataset.runeProperty)].stat=select.value;});
 host.querySelectorAll('[data-remove-rune]').forEach(button=>button.onclick=()=>{entry.runes[Number(button.dataset.removeRune)]=null;render();});
 }render();
}
