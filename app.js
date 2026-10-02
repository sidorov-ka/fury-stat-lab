import {ATTRIBUTE_BUDGET,attributeCost,spentAttributes,migrateAttributes} from './attributes.js?v=automatic-key-nodes-1';
import {deriveStats,characterStats,statBreakdown,specializationRole,ROLE_LABELS} from './simulator.js?v=automatic-key-nodes-2';
import {setupSimulation} from './sim-ui.js?v=automatic-key-nodes-2';
import {createStore,mergeDefaults} from './storage.js';
import {MASTERY_FIELDS,emptyMastery} from './mastery.js';
import {TREES,normalizeTree} from './mastery-tree.js?v=automatic-key-nodes-1';
import {mountMastery} from './mastery-ui.js?v=centered-icons-2';
import {mountRunes} from './rune-ui.js';
import {runeEffects,runeSlots} from './runes.js';
import {ATTRS,SLOTS,traitLimit,itemStats,weaponRange,specCost,totalAttributes} from './engine.js?v=automatic-key-nodes-1';
const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Number(v||0).toLocaleString('ru-RU',{maximumFractionDigits:2});
const rarity={Common:'#89929c',Uncommon:'#64ad84',Rare:'#739fe6',Rare2:'#739fe6',Epic:'#b68bea',Heroic:'#da9374',Legendary:'#edb970'};
const gradeName={Common:'Обычный',Uncommon:'Необычный',Rare:'Редкий',Rare2:'Редкий',Epic:'Эпический',Heroic:'Героический',Legendary:'Легендарный'};
let simulation;
let catalog, itemMap,skillMap,selectedSkill=null,pick=null,previewId=null,draft=null;
const emptyState=()=>({items:{},mastery:emptyMastery(),masteryTrees:{CR:{},WA_GR:{}},attributeVersion:1,characterLevel:55,attributeAdjustments:{},attrMode:'base',attrs:{str:10,dex:10,Int:10,per:10,con:10},active:Array(12).fill(null),passive:Array(8).fill(null),defensive:[null],specs:{}});
let state=emptyState();
const saveStatus=document.createElement('p');saveStatus.className='micro';saveStatus.setAttribute('role','status');document.querySelector('.topbar').after(saveStatus);
let browserStorage;try{browserStorage=window.localStorage;}catch{browserStorage={getItem(){throw Error('unavailable')}};}
const profile=createStore(browserStorage,message=>saveStatus.textContent=message);
let restored=false;
let toastTimer;
function toast(s){$('toast').textContent=s;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',3000)}
function image(item,cls=''){return item?.thumbnail?`<img class="${cls}" src="${escape(item.thumbnail)}" alt="" loading="lazy">`:''}
function icon(item,badge='',key=''){return `<span class="slot-icon ${item?'occupied':''}" style="--rarity:${rarity[item?.grade]||'#739fe6'}">${item?image(item):'<span class="plus">+</span>'}${badge?`<span class="level">${escape(badge)}</span>`:''}${key?`<span class="key">${escape(key)}</span>`:''}</span>`}
function emptyGearIcon(slot){const category=SLOTS.find(x=>x[0]===slot)[2];const placeholder=catalog.equipment.find(x=>x.category===category||x.slot===category);return `<span class="slot-icon empty-slot">${image(placeholder)}<span class="plus">+</span></span>`}
function statLabel(k){return catalog.labels[k]||k}
function format(k,v){const f=catalog.formats[k]||{};return n(v*(f.mul??1))+(f.suffix||'')}
function statRows(stats){return Object.entries(stats).filter(([,v])=>v!==0).map(([k,v])=>`<div class="stat-line"><span>${escape(statLabel(k))}</span><b>${escape(format(k,v))}</b></div>`).join('')}
function gearRunes(item,entry){
 if(!runeSlots(item))return '';
 const {selected}=runeEffects(item,entry,catalog);
 return `<span class="gear-runes">${selected.map((r,i)=>{
  const label=r?`${r.name} · ${statLabel(entry.runes[i].stat)} · ур. ${r.level}`:`Ячейка руны ${i+1} пуста`;
  return `<span class="gear-rune ${r?'filled':''}" title="${escape(label)}">${r?`<img src="icons/runes/${escape(r.thumbnail.split('/').at(-1))}" alt="${escape(label)}">`:'<span aria-hidden="true">·</span>'}</span>`;
 }).join('')}</span>`;
}
function gearTraits(item,entry){
 if(!item)return '<span class="gear-traits"></span>';
 const stats=itemStats(item,entry.level,entry.traits,catalog),base=itemStats(item,entry.level,[],catalog);
 const keys=[...new Set((entry.traits||[]).slice(0,3).filter(t=>item.traits?.includes(t?.id)).map(t=>catalog.traits[t.id]?.stat).filter(Boolean))];
 return `<span class="gear-traits">${keys.map(k=>{const value=stats[k]-(base[k]||0),label=statLabel(k);return `<span class="gear-trait" title="${escape(label+': '+format(k,value))}"><span>${escape(label)}</span><b>${value>0?'+':''}${escape(format(k,value))}</b></span>`}).join('')||'<span class="micro">Без трейтов</span>'}</span>`;
}
function renderGear(){
 $('gear-grid').innerHTML='<div class="gear-upper">'+SLOTS.map(([k,label])=>{const e=state.items[k],item=itemMap.get(e?.id);return `${k==='necklace'?'</div><div class="gear-lower">':''}<button class="gear-slot ${k.startsWith('weapon')?'weapon-slot':''}" data-gear="${k}" title="${escape(item?.name||label)}" aria-label="${escape(label+(item?': '+item.name:': выбрать предмет'))}"><span class="gear-visual"><span class="gear-rune-row">${gearRunes(item,e)}</span>${item?icon(item,e?.level?'+'+e.level:''):emptyGearIcon(k)}</span>${gearTraits(item,e)}<span class="slot-caption">${label}${k.startsWith('weapon')?`<strong>${escape(item?.name||'Выбрать')}</strong>`:''}</span></button>`}).join('')+'</div>';
 $('gear-count').textContent=Object.keys(state.items).length+' / 13';
 const synergies=SLOTS.flatMap(([key,label])=>{
  const entry=state.items[key],item=itemMap.get(entry?.id);if(!item)return [];
  const {synergy}=runeEffects(item,entry,catalog);if(!synergy.length)return [];
  return [`<div class="gear-synergy-row"><b>${escape(label)}</b><span>${synergy.map(({stat,value})=>`${escape(statLabel(stat))}: ${value>0?'+':''}${escape(format(stat,value))}`).join(' · ')}</span></div>`];
 });
 $('gear-grid').insertAdjacentHTML('beforeend',`<div class="gear-synergies"><h3>Синергия трёх рун</h3>${synergies.join('')||'<p class="micro">Нет активных сочетаний. Выбери три руны в подходящем порядке.</p>'}<p class="micro">Эти бонусы уже включены в характеристики рун.</p></div>`);
 $('gear-grid').querySelectorAll('[data-gear]').forEach(b=>b.onclick=()=>openGear(b.dataset.gear));
}
function renderAttrs(){
 renderMastery();
 renderAttributeRows();
}
function renderAttributeRows(){
 const spent=spentAttributes(state.attrs),totals=totalAttributes(state,catalog);
 $('attr-note').textContent=`Уровень 55 · Потрачено ${spent} / ${ATTRIBUTE_BUDGET} · ${spent>ATTRIBUTE_BUDGET?'Превышение: '+(spent-ATTRIBUTE_BUDGET):'Осталось: '+(ATTRIBUTE_BUDGET-spent)}. База 10. Прибавки 1–20 стоят 1 очко, 21–40 — 2, далее — 4. Бонусы вещей не расходуют очки.`;
 $('attributes').innerHTML=ATTRS.map(([k,label])=>{const v=state.attrs[k],cost=attributeCost(v+1)-attributeCost(v),bonus=totals[k]-v,adjust=state.attributeAdjustments?.[k]||0;return `<div class="attribute-row"><b>${label}</b><div class="attribute-controls"><button data-attr-step="${k}" data-delta="-1" ${v<=10?'disabled':''} aria-label="Уменьшить ${label}">−</button><input type="number" min="10" step="1" value="${v}" data-attr="${k}" aria-label="${label} до бонусов"><button data-attr-step="${k}" data-delta="1" ${spent+cost>ATTRIBUTE_BUDGET?'disabled':''} aria-label="Увеличить ${label}">+</button></div><small>10 + ${v-10} вложено · ${attributeCost(v)} очк.</small><small>Бонусы ${bonus>=0?'+':''}${n(bonus)} → <strong>${n(totals[k])}</strong></small><small>Следующее +1: ${cost} очк.</small>${adjust?`<small>Перенесённая поправка: ${n(adjust)}. Проверь старый итог.</small>`:''}</div>`}).join('');
 const change=(k,value)=>{const old=state.attrs[k],v=Math.max(10,Math.min(200,Math.trunc(Number(value)||10))),next={...state.attrs,[k]:v};if(v>old&&spentAttributes(next)>ATTRIBUTE_BUDGET){toast('Не хватает очков характеристик');renderAttributeRows();return;}state.attrs=next;renderStats();};
 $('attributes').querySelectorAll('[data-attr]').forEach(el=>el.onchange=()=>change(el.dataset.attr,el.value));
 $('attributes').querySelectorAll('[data-attr-step]').forEach(el=>el.onclick=()=>change(el.dataset.attrStep,state.attrs[el.dataset.attrStep]+Number(el.dataset.delta)));
}

function renderStats(){
 renderAttributeRows();
 if(restored)profile.save('build',{state,weapon:$('weapon').value});
 simulation?.update();
 const stats=characterStats(state,catalog),entry=state.items[$('weapon').value],weapon=itemMap.get(entry?.id),combat=deriveStats(state,catalog),prefix=$('weapon').value==='weapon1'?'cross':'wand',range=weapon?[combat[prefix+'Min'],combat[prefix+'Max']]:null;
 $('damage-range').innerHTML=`<small>${escape(weapon?.name||'Оружие не выбрано')} · расчётный диапазон для боя</small><b>${range?range.map(n).join(' — '):'—'}</b>`;
 $('primary-stats').innerHTML=ATTRS.map(([k,label])=>`<div class="primary-stat"><small>${label}</small><b>${n(totalAttributes(state,catalog)[k])}</b></div>`).join('');
 const others=Object.fromEntries(Object.entries(stats).filter(([k])=>!ATTRS.some(([a])=>a.toLowerCase()===k.toLowerCase())&&!/_main_hand$|_off_hand$/.test(k)));
 $('stat-list').innerHTML=statRows(others)||'';
 if($('mastery-totals'))$('mastery-totals').innerHTML=MASTERY_FIELDS.map(([k,label])=>`<div class="stat-line"><span>${escape(label.replace(', п.п.',', %'))}</span><b>${n(combat[k])}</b></div>`).join('');
 let breakdown=$('stat-breakdown');if(!breakdown){breakdown=document.createElement('details');breakdown.id='stat-breakdown';document.querySelector('.totals').append(breakdown);breakdown.innerHTML='<summary>Из чего складываются характеристики</summary><p class="micro">Столбцы показывают изменение результата при последовательном добавлении источников слева направо. Пороги атрибутов входят в источник, который их открыл. Для интервала атаки учитывается порядок формулы.</p><div class="sim-table-wrap"></div>';}
 const b=statBreakdown(state,catalog),list=[...MASTERY_FIELDS,['interval','Интервал автоатаки, с'],['rangeDamage','Урон дальнего боя, %'],['species','Повышение урона по виду цели']];
 breakdown.querySelector('.sim-table-wrap').innerHTML=`<table><thead><tr><th>Характеристика</th>${b.labels.map(l=>`<th>${escape(l)}</th>`).join('')}<th>Итого</th></tr></thead><tbody>${list.map(([k,l])=>`<tr><td>${escape(l.replace(', п.п.',', %'))}</td>${b.values[k].map(v=>`<td>${v>0?'+':''}${Number(v.toFixed(3)).toLocaleString('ru-RU',{maximumFractionDigits:3})}</td>`).join('')}<td><b>${Number(b.total[k].toFixed(3)).toLocaleString('ru-RU',{maximumFractionDigits:3})}</b></td></tr>`).join('')}</tbody></table>`;
}
function renderMastery(){
 let panel=$("mastery-panel");if(!panel){panel=document.createElement("section");panel.id="mastery-panel";panel.className="panel";panel.style.margin="16px 0";document.querySelector(".totals").after(panel);}
 mountMastery(panel,()=>state,catalog,renderStats);
}
function renderSkills(){
 renderStats();
 for(const type of ['active','passive','defensive']){
  $(type+'-bar').innerHTML=state[type].map((id,i)=>{const s=skillMap.get(id),specs=state.specs[id]?.length||0;return `<button class="skill-button ${selectedSkill?.type===type&&selectedSkill?.index===i?'selected':''}" data-type="${type}" data-index="${i}" title="${escape(s?.name||'Выбрать умение')}" aria-label="${escape((s?.name||'Пустое умение')+', слот '+(i+1))}">${icon(s,specs?specs+' сп.':'',type==='active'?i+1:'')}<small>${escape(s?.name||'Выбрать')}</small><span class="skill-spec-icons">${(s?.specializations||[]).filter(t=>state.specs[id]?.includes(t.id)).map(t=>`<img src="${escape(t.icon)}" alt="${escape(t.name)}" title="${escape(t.name)}">`).join('')}</span></button>`}).join('');
  $(type+'-bar').querySelectorAll('button').forEach(b=>b.onclick=()=>{const type=b.dataset.type,index=Number(b.dataset.index);selectedSkill={type,index};renderSkills();if(state[type][index])renderSkillDetail();else{renderSkillDetail();openSkill(type,index)}});
 }
 $('active-count').textContent=state.active.filter(Boolean).length+' / 12';$('passive-count').textContent=state.passive.filter(Boolean).length+' / 8';
 $('spec-count').textContent=`Специализации: ${specCost(state,catalog)} / 100 оч.`;
}
function skillMeta(s){if(s.id==='WP_CR_CR_S_AddProjectile')return '<div class="meta"><span>Арбалет · переключаемое</span><span>23 маны за атаку снарядом</span><span>Отключение при мане &lt;10%</span><span>RU · эпическое, ур. 4</span></div>';return `<div class="meta"><span>${s.weapon==='Wand'?'Жезл':'Арбалет'}</span>${s.category==='Passive'?'<span>Пассивное</span>':`<span>Откат: ${n(s.cooldownSec)} с</span><span>Мана: ${n(s.manaCost)}</span><span>Дальность: ${n(s.rangeM)} м</span>`}</div>`}
function renderSkillDetail(){
 const s=selectedSkill&&skillMap.get(state[selectedSkill.type][selectedSkill.index]);
 if(!s){$('skill-detail').innerHTML='<div class="empty-detail">Выбери умение, чтобы увидеть его описание и трейты.</div>';return}
 const selected=state.specs[s.id]||[];
 $('skill-detail').innerHTML=`<div class="skill-detail-grid"><div><div class="detail-title">${image(s)}<div><h2>${escape(s.name)}</h2><span class="micro">${escape(s.sourceNote||'Описание из каталога RUTL')}</span></div></div>${skillMeta(s)}<p class="description">${escape(s.description)}</p>${s.levelProgression?.length?`<details><summary class="micro">Значения по уровням в источнике</summary>${s.levelProgression.map(r=>`<p class="description">${escape(r.label)}: ${escape(r.values.join(' → '))}</p>`).join('')}</details>`:''}<div class="skill-actions"><button id="replace-skill">Заменить</button><button id="remove-skill" class="quiet">Снять</button></div></div><div><h3>Специализации / трейты умения</h3><div class="spec-list">${s.specializations?.length?s.specializations.map(t=>`<label class="spec-row"><input type="checkbox" data-spec="${escape(t.id)}" ${selected.includes(t.id)?'checked':''}>${t.icon?`<img src="${escape(t.icon)}" alt="">`:'<span></span>'}<span><b>${escape(t.name)} · ${ROLE_LABELS[specializationRole(s.id,Number(t.id.split("_").at(-1)))]}</b><p>${escape(t.description)}</p></span><span class="cost">${n(t.cost)} оч.</span></label>`).join(''):'<p class="hint">У этого умения нет специализаций в каталоге.</p>'}</div><p class="micro" style="margin-top:10px">Описание базового умения показано отдельно от изменений специализаций. Зависимости между специализациями сверяй с описанием.</p></div></div>`;
 $('replace-skill').onclick=()=>openSkill(selectedSkill.type,selectedSkill.index);
 $('remove-skill').onclick=()=>{removeSkill(selectedSkill.type,selectedSkill.index);renderSkills();renderSkillDetail()};
 $('skill-detail').querySelectorAll('[data-spec]').forEach(c=>c.onchange=()=>{const t=s.specializations.find(t=>t.id===c.dataset.spec);let list=state.specs[s.id]||[];if(c.checked){if(specCost(state,catalog)+t.cost>100){c.checked=false;toast('Лимит специализаций — 100 очков.');return}list=[...list,t.id]}else list=list.filter(x=>x!==t.id);state.specs[s.id]=list;renderSkills()});
}
function removeSkill(type,index){const id=state[type][index];state[type][index]=null;delete state.specs[id]}
function openGear(slot){
 pick={kind:'gear',slot};const [,,cat]=SLOTS.find(s=>s[0]===slot);
 pick.items=catalog.equipment.filter(x=>slot.startsWith('weapon')?x.category===cat:x.slot===cat);
 $('picker-title').textContent=SLOTS.find(s=>s[0]===slot)[1];$('picker-eyebrow').textContent='ЭКИПИРОВКА';
 $('filter').innerHTML='<option value="">Все качества</option>'+[...new Set(pick.items.map(x=>x.grade))].map(g=>`<option value="${g}">${gradeName[g]||g}</option>`).join('');
 beginPicker(state.items[slot]?.id);
}
function openSkill(type,index){
 pick={kind:'skill',type,index};const cat={active:'Active',passive:'Passive',defensive:'Defensive'}[type];pick.items=catalog.skills.filter(x=>x.category===cat);
 $('picker-title').textContent={active:'Активное умение',passive:'Пассивное умение',defensive:'Защитное умение'}[type];$('picker-eyebrow').textContent='УМЕНИЯ И ТРЕЙТЫ';
 $('filter').innerHTML='<option value="">Оба оружия</option><option value="Crossbow">Арбалет</option><option value="Wand">Жезл</option>';
 beginPicker(state[type][index]);
}
function beginPicker(id){$('choose').disabled=true;$('choose').onclick=null;$('choose').textContent=pick.kind==='gear'?'Применить к слоту':'Выбрать умение';$('picker-selection').textContent='Выбери '+(pick.kind==='gear'?'предмет':'умение');$('search').value='';$('filter').value='';previewId=null;draft=null;$('picker-message').textContent='';renderPickerList();if(id)preview(id);else $('picker-preview').innerHTML='<p class="hint">Нажми на строку, чтобы посмотреть описание.</p>';$('picker').showModal();$('search').focus()}
function renderPickerList(){
 const q=$('search').value.toLocaleLowerCase('ru'),f=$('filter').value;
 const items=pick.items.filter(x=>x.name.toLocaleLowerCase('ru').includes(q)&&(!f||(pick.kind==='gear'?x.grade:x.weapon)===f)).sort((a,b)=>a.name.localeCompare(b.name,'ru'));
 $('picker-list').innerHTML=items.map(x=>`<button class="catalog-item ${x.id===previewId?'selected':''}" data-preview="${escape(x.id)}" style="--rarity:${rarity[x.grade]||'#6487b4'}">${image(x)}<span><b>${escape(x.name)}</b><small>${pick.kind==='gear'?escape((gradeName[x.grade]||x.grade)+(x.tier?' · '+x.tier.toUpperCase():'')):x.weapon==='Wand'?'Жезл':'Арбалет'}${pick.kind==='skill'&&state[pick.type].includes(x.id)?' · уже выбрано':''}</small></span></button>`).join('')||'<p class="hint">Ничего не найдено. Измени запрос или фильтр.</p>';
 $('picker-list').querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>preview(b.dataset.preview));
}
function preview(id){
 previewId=id;const item=pick.items.find(x=>x.id===id);if(!item)return;
 $('choose').disabled=false;$('picker-selection').textContent=item.name;$('picker-message').textContent='';$('picker-preview').scrollTop=0;
 if(pick.kind==='gear'){
  const current=state.items[pick.slot];draft=current?.id===id?structuredClone(current):{id,level:0,traits:[]};renderItemPreview(item);
 }else{
  $('picker-preview').innerHTML=`<div class="detail-title">${image(item)}<h3>${escape(item.name)}</h3></div>${skillMeta(item)}<p class="description">${escape(item.description)}</p><h3 style="font-size:14px">Специализации</h3>${(item.specializations||[]).map(t=>`<div class="perk"><b>${escape(t.name)} · ${n(t.cost)} оч.</b>${escape(t.description)}</div>`).join('')||'<p class="hint">Нет специализаций</p>'}`;
  $('choose').onclick=()=>{const duplicate=state[pick.type].indexOf(id);if(duplicate!==-1&&duplicate!==pick.index){$('picker-message').textContent='Это умение уже выбрано в слоте '+(duplicate+1)+'.';return}if(state[pick.type][pick.index]!==id)removeSkill(pick.type,pick.index);state[pick.type][pick.index]=id;selectedSkill={type:pick.type,index:pick.index};renderSkills();renderSkillDetail();$('picker').close()};
 }
 renderPickerList();
}
function renderItemPreview(item){
 const limit=traitLimit(item.grade);
 $('picker-preview').innerHTML=`<div class="detail-title">${image(item)}<h3>${escape(item.name)}</h3></div><p class="description">${escape(item.description||'')}</p><label class="enhance">Усиление<input id="enhance" type="number" min="0" max="${item.enchantMaxLevel||0}" value="${draft.level}" aria-label="Уровень усиления"></label><div id="item-values"></div><h3 style="font-size:14px;margin-top:15px">Трейты предмета</h3><div class="traits">${limit&&item.traits?.length?Array.from({length:3},(_,i)=>{const t=draft.traits[i]||{id:'',level:1};return `<div class="trait-line"><select data-trait="${i}" aria-label="Трейт ${i+1}"><option value="">Без трейта</option>${item.traits.filter(k=>catalog.traits[k]).map(k=>`<option value="${escape(k)}" ${k===t.id?'selected':''}>${escape(statLabel(catalog.traits[k].stat))}</option>`).join('')}</select><input data-trait-level="${i}" type="number" min="1" max="${limit}" value="${t.level}" aria-label="Уровень трейта ${i+1}"></div>`}).join(''):'<p class="hint">Трейты недоступны.</p>'}</div>${item.specialPerk?`<div class="perk"><b>${escape(item.specialPerk.name)}</b>${escape(item.specialPerk.description)}<p class="micro">Условный эффект не включён в расчёт.</p></div>`:''}${item.setName?`<div class="perk">Комплект: ${escape(item.setName)}. Бонус комплекта пока не учитывается.</div>`:''}`;
 const updateValues=()=>{let values=itemStats(item,draft.level,draft.traits,catalog);if(item.slot==='Weapon'){const range=weaponRange(item,draft.level);$('item-values').innerHTML=`<div class="stat-line"><span>Урон оружия</span><b>${range.map(n).join(' — ')}</b></div>`+statRows(Object.fromEntries(Object.entries(values).filter(([k])=>!k.includes('attack_power'))))}else $('item-values').innerHTML=statRows(values)};
 updateValues();
 const runeHost=document.createElement('div');runeHost.className='rune-panel';$('picker-preview').append(runeHost);mountRunes(runeHost,item,draft,catalog,statRows,escape);
 $('enhance').onchange=e=>{draft.level=Math.max(0,Math.min(item.enchantMaxLevel||0,Math.trunc(Number(e.target.value)||0)));e.target.value=draft.level;updateValues()};
 $('picker-preview').querySelectorAll('[data-trait]').forEach(el=>el.onchange=()=>{const i=Number(el.dataset.trait);if(el.value&&draft.traits.some((t,j)=>j!==i&&t?.id===el.value)){el.value=draft.traits[i]?.id||'';$('picker-message').textContent='На предмете нельзя выбрать одинаковые трейты.';return}draft.traits[i]={id:el.value,level:Number($('picker-preview').querySelector(`[data-trait-level="${i}"]`).value)||1};$('picker-message').textContent='';updateValues()});
 $('picker-preview').querySelectorAll('[data-trait-level]').forEach(el=>el.onchange=()=>{const i=Number(el.dataset.traitLevel);el.value=Math.max(1,Math.min(limit,Math.trunc(Number(el.value)||1)));draft.traits[i]={id:draft.traits[i]?.id||'',level:Number(el.value)};updateValues()});
 $('choose').onclick=()=>{if(pick.slot.startsWith('ring')){const other=pick.slot==='ring1'?'ring2':'ring1';if(state.items[other]?.id===item.id){$('picker-message').textContent='Это кольцо уже надето во втором слоте.';return}}draft.traits=draft.traits.filter(t=>t?.id);state.items[pick.slot]=structuredClone(draft);renderGear();renderStats();$('picker').close()};
}
$('search').oninput=renderPickerList;$('filter').onchange=renderPickerList;$('close-picker').onclick=()=>$('picker').close();
$('unequip').onclick=()=>{if(pick.kind==='gear'){delete state.items[pick.slot];renderGear();renderStats()}else{removeSkill(pick.type,pick.index);renderSkills();renderSkillDetail()}$('picker').close()};
$('picker').addEventListener('click',e=>{if(e.target===$('picker')){const r=$('picker').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('picker').close()}});

$('weapon').onchange=renderStats;
$('reset').onclick=()=>{if(!confirm('Очистить экипировку, атрибуты, умения, специализации и бонусы мастерства? Условия боя сохранятся.'))return;state=emptyState();selectedSkill=null;renderGear();renderAttrs();renderStats();renderSkills();renderSkillDetail();toast('Сборка очищена')};
async function init(){
 try{const r=await fetch('catalog.json');if(!r.ok)throw new Error('HTTP '+r.status);catalog=await r.json();itemMap=new Map(catalog.equipment.map(x=>[x.id,x]));skillMap=new Map(catalog.skills.map(x=>[x.id,x]));
  const saved=profile.get('build');
  if(saved?.state){state=mergeDefaults(emptyState(),saved.state);state.items={};state.specs={};
   for(const [key,tree] of Object.entries(TREES))state.masteryTrees[key]=normalizeTree(tree,saved.state.masteryTrees?.[key]);
   for(const [slot] of SLOTS){const entry=saved.state.items?.[slot];if(entry&&itemMap.has(entry.id)&&Number.isFinite(entry.level)&&Array.isArray(entry.traits))state.items[slot]=entry;}
   for(const type of ['active','passive','defensive'])state[type]=state[type].map(id=>skillMap.has(id)?id:null);
   for(const id of [...state.active,...state.passive,...state.defensive].filter(Boolean)){const valid=skillMap.get(id).specializations||[];state.specs[id]=(Array.isArray(saved.state.specs?.[id])?saved.state.specs[id]:[]).filter(s=>valid.some(t=>t.id===s));}
   if(!['total','base'].includes(state.attrMode))state.attrMode='total';
   if(saved.state.attributeVersion!==1){delete state.attributeVersion;migrateAttributes(state,catalog);}
   if(['weapon1','weapon2'].includes(saved.weapon))$('weapon').value=saved.weapon;
  }
  renderGear();renderAttrs();renderStats();renderSkills();
  simulation=setupSimulation(()=>state,catalog,(ids,specs)=>{if(specs)state.specs=structuredClone(specs);state.active=[...ids,...Array(12-ids.length).fill(null)];selectedSkill=null;renderSkills();renderSkillDetail();},profile);
  restored=true;
  $('source-note').textContent=`RUTL · снимок 24.09.2026 · ${catalog.equipment.length} предметов · ${catalog.skills.length} записей умений`;
  $('loading').hidden=true;$('workspace').hidden=false;
 }catch(e){$('loading').textContent='Не удалось загрузить каталог. Обнови страницу, чтобы повторить загрузку.';console.error(e)}
}
init();
