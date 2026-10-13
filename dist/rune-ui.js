import {runeSlots,maxRuneChoices,maxRuneSelection,normalizeMaxRunes,runeSynergies,applyRuneSynergy,runeEffects} from './runes.js?v=rune-picker-20261013';
export function mountRunes(host,item,entry,catalog,statRows,escape){
 if(!runeSlots(item))return;
 const choices=maxRuneChoices(item),types={Attack:'Атака',Defense:'Защита',Assist:'Поддержка'},colors={Attack:'red',Defense:'blue',Assist:'yellow'};
 entry.runes=normalizeMaxRunes(item,entry);let active=null,activeType='Attack';
 const label=stat=>catalog.labels[stat]||stat;
 const icon=r=>`icons/runes/${r.thumbnail.split('/').at(-1)}`;
 const value=(r,stat)=>{const effects=runeEffects(item,{runes:[maxRuneSelection(item,r.type,stat)]},catalog);return effects.stats[stat]||0;};
 const format=(stat,v)=>{const f=catalog.formats[stat]||{},n=(v*(f.mul??1)).toLocaleString('ru-RU',{maximumFractionDigits:2});return (v>0?'+':'')+n+(f.suffix||'');};
 const rows=stats=>statRows(Object.fromEntries(stats.map(r=>[r.stat,r.value])));
 function render(){
 const effects=runeEffects(item,entry,catalog),current=entry.runes[active],selected=choices.find(r=>r.id===current?.runeId),rune=choices.find(r=>r.type===activeType);
 host.innerHTML=`<div class="section-head"><h3>Руны</h3><span class="micro">${effects.selected.filter(Boolean).length} / ${runeSlots(item)}</span></div>
 <div class="rune-sockets" role="group" aria-label="Гнёзда рун">${entry.runes.map((s,i)=>{const r=choices.find(r=>r.id===s?.runeId);return `<div class="rune-socket-wrap"><button type="button" data-socket="${i}" class="rune-socket ${r?colors[r.type]:''} ${active===i?'selected':''}" aria-pressed="${active===i}" aria-label="Гнездо ${i+1}: ${r?escape(types[r.type]+', '+label(s.stat)):'выбрать руну'}">${r?`<img src="${escape(icon(r))}" alt=""><span>${escape(label(s.stat))}</span>`:'<span class="rune-empty">+</span><span>Выбрать руну</span>'}</button>${r?`<button type="button" data-remove-rune="${i}" class="rune-remove" aria-label="Убрать руну из гнезда ${i+1}">×</button>`:''}</div>`;}).join('')}</div>
 ${active!==null?`<div class="rune-selection"><div class="section-head"><h4>Выбор руны</h4><button type="button" data-close-runes class="quiet" aria-label="Закрыть выбор руны">×</button></div><div class="rune-type-buttons" role="group" aria-label="Тип руны">${choices.map(r=>`<button type="button" data-rune-type="${r.type}" class="${colors[r.type]} ${activeType===r.type?'selected':''}" aria-pressed="${activeType===r.type}"><img src="${escape(icon(r))}" alt="">${types[r.type]}</button>`).join('')}</div><div class="rune-stat-choices" role="group" aria-label="Характеристика руны">${(rune?.statPool||[]).map(p=>`<button type="button" data-rune-stat="${escape(p.stat)}" class="${selected?.type===activeType&&current.stat===p.stat?'selected':''}" aria-pressed="${selected?.type===activeType&&current.stat===p.stat}"><span>${escape(label(p.stat))}</span><b>${escape(format(p.stat,value(rune,p.stat)))}</b></button>`).join('')}</div></div>`:''}
 <details class="rune-synergy-picker"><summary>Выбрать синергию</summary><div class="rune-synergy-options">${runeSynergies(item).map(s=>`<button type="button" data-rune-order="${s.order}" aria-label="Синергия: ${s.types.map(t=>types[t]).join(' → ')}" class="${effects.selected.every(Boolean)&&effects.selected.map(r=>r.type).join('-')===s.order?'selected':''}"><span class="rune-order">${s.types.map(t=>`<img src="${escape(icon(choices.find(r=>r.type===t)))}" alt="${types[t]}" title="${types[t]}">`).join('<span>›</span>')}</span>${rows(s.stats)}</button>`).join('')}</div></details>
 ${effects.synergy.length?`<div class="rune-active-synergy"><h4>Активная синергия</h4>${rows(effects.synergy)}</div>`:''}
 <details class="rune-total"><summary>Бонусы рун</summary>${statRows(effects.stats)||'<p class="micro">Руны не выбраны.</p>'}</details>`;
 host.querySelectorAll('[data-socket]').forEach(b=>b.onclick=()=>{active=Number(b.dataset.socket);activeType=choices.find(r=>r.id===entry.runes[active]?.runeId)?.type||'Attack';render();});
 host.querySelectorAll('[data-remove-rune]').forEach(b=>b.onclick=()=>{entry.runes[Number(b.dataset.removeRune)]=null;render();});
 host.querySelectorAll('[data-rune-type]').forEach(b=>b.onclick=()=>{activeType=b.dataset.runeType;render();});
 host.querySelectorAll('[data-rune-stat]').forEach(b=>b.onclick=()=>{entry.runes[active]=maxRuneSelection(item,activeType,b.dataset.runeStat);render();});
 host.querySelectorAll('[data-rune-order]').forEach(b=>b.onclick=()=>{entry.runes=applyRuneSynergy(item,entry,b.dataset.runeOrder);if(active!==null)activeType=choices.find(r=>r.id===entry.runes[active]?.runeId)?.type||'Attack';render();});
 const close=host.querySelector('[data-close-runes]');if(close)close.onclick=()=>{active=null;render();};
 }render();
}
