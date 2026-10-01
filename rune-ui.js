import {runeSlots,runeChoices,runeEffects} from './runes.js';
export function mountRunes(host,item,entry,catalog,statRows,escape){
 if(!runeSlots(item))return;
 const choices=runeChoices(item),types={Attack:'Атака · красная',Defense:'Защита · синяя',Assist:'Поддержка · жёлтая'},grades={kC:'Расколотая',kB:'Цельная',kA:'Редкая',kAA:'Превосходная'};
 entry.runes=Array.isArray(entry.runes)?entry.runes:[];
 const render=()=>{
 host.innerHTML='<h3>Руны</h3><p class="micro">Порядок ячеек определяет синергию. Значения и уровни — из каталога RUTL.</p>'+Array.from({length:runeSlots(item)},(_,i)=>{
  const s=entry.runes[i]||{},r=choices.find(r=>r.id===s.runeId);
  return `<div class="rune-editor" data-index="${i}"><label>Ячейка ${i+1}<select data-rune><option value="">Без руны</option>${choices.map(x=>`<option value="${x.id}" ${r?.id===x.id?'selected':''}>${types[x.type]} · ${grades[x.grade]}</option>`).join('')}</select></label>${r?`<label>Характеристика<select data-stat>${r.statPool.map(p=>`<option value="${p.stat}" ${s.stat===p.stat?'selected':''}>${escape(catalog.labels[p.stat]||p.stat)}</option>`).join('')}</select></label><label>Уровень · до ${r.maxLevel}<input data-level type="number" min="1" max="${r.maxLevel}" value="${s.level}"></label>`:''}</div>`;
 }).join('');
 const effects=runeEffects(item,entry,catalog);
 if(effects.synergy.length)host.insertAdjacentHTML('beforeend',`<div class="perk"><b>Бонус синергии трёх рун</b>${statRows(Object.fromEntries(effects.synergy.map(({stat,value})=>[stat,value])))}</div>`);
 host.insertAdjacentHTML('beforeend',`<div class="perk"><b>Прибавки рун и синергии</b>${statRows(effects.stats)||'Руны не выбраны'}<p class="micro">${effects.synergy.length?'Синергия активна':'Для синергии нужны три руны в подходящем порядке.'}</p></div><p class="micro">Руны хаоса пока не поддерживаются. Защитные эффекты и бонусы только против боссов не увеличивают DPS обычного манекена.</p>`);
 host.querySelectorAll('[data-index]').forEach(row=>{
  const i=Number(row.dataset.index);
  row.querySelector('[data-rune]').onchange=e=>{const r=choices.find(r=>r.id===e.target.value);entry.runes[i]=r?{runeId:r.id,stat:r.statPool[0].stat,level:1}:null;render();};
  const st=row.querySelector('[data-stat]'),lv=row.querySelector('[data-level]');
  if(st)st.onchange=e=>{entry.runes[i].stat=e.target.value;render();};
  if(lv)lv.onchange=e=>{const r=choices.find(r=>r.id===entry.runes[i].runeId);entry.runes[i].level=Math.max(1,Math.min(r.maxLevel,Math.trunc(Number(e.target.value)||1)));render();};
 });
 };render();
}
