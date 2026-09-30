import {gearSlots,attributes,activeSkills,passiveSkills,defenseSkills,mastery,demoGear} from "./data.js";
import {simulateFiveMinutes} from "./simulator.js";

const state={
 gear:{},active:Array(12).fill(null),passive:Array(8).fill(null),defense:null,
 attrs:Object.fromEntries(attributes.map(x=>[x,10])),
 mastery:{crossbow:{},wand:{}}, masteryTab:"crossbow"
};

const $=s=>document.querySelector(s);
const modal=$("#pickerModal"),modalTitle=$("#modalTitle"),modalEyebrow=$("#modalEyebrow"),modalSearch=$("#modalSearch"),modalList=$("#modalList");
let pickerItems=[],pickerSelect=null;

function openPicker(title,eyebrow,items,onSelect){
 pickerItems=items;pickerSelect=onSelect;modalTitle.textContent=title;modalEyebrow.textContent=eyebrow;
 modalSearch.value="";renderPicker();modal.hidden=false;setTimeout(()=>modalSearch.focus(),0);
}
function closePicker(){modal.hidden=true;pickerItems=[];pickerSelect=null}
function renderPicker(){
 const q=modalSearch.value.trim().toLowerCase();
 modalList.innerHTML="";
 const rows=pickerItems.filter(x=>(x.name+" "+(x.weapon||"")+" "+(x.rarity||"")).toLowerCase().includes(q));
 if(!rows.length){modalList.innerHTML='<div class="empty-state">Ничего не найдено.</div>';return}
 rows.forEach(item=>{
  const b=document.createElement("button");b.className="picker-item";
  b.innerHTML=`<b>${item.name}</b><small>${item.weapon||item.rarity||""}</small>`;
  b.onclick=()=>{pickerSelect?.(item);closePicker()};modalList.append(b);
 });
}
modalSearch.addEventListener("input",renderPicker);
document.querySelectorAll("[data-close-modal]").forEach(x=>x.addEventListener("click",closePicker));
window.addEventListener("keydown",e=>{if(e.key==="Escape")closePicker()});

function renderGear(){
 const root=$("#gearGrid");root.innerHTML="";
 gearSlots.forEach(slot=>{
  const item=state.gear[slot.id];
  const b=document.createElement("button");b.className="gear-slot";
  b.innerHTML=`<span class="gear-icon">${slot.icon}</span><span class="gear-copy"><b>${slot.name}: ${item?item.name:"выбрать предмет"}</b><small>${item?(item.rarity||"выбрано"):"Выбрать"}</small></span><span class="plus">${item?"↻":"+"}</span>`;
  b.onclick=()=>openPicker(slot.name,"ЭКИПИРОВКА",demoGear[slot.id]||[],picked=>{state.gear[slot.id]=picked;renderGear();renderBuildSummary()});
  root.append(b);
 });
 $("#gearCount").textContent=`${Object.keys(state.gear).length} / 13`;
}
function skillButton(item,index,type){
 const b=document.createElement("button");b.className="skill-slot";
 b.innerHTML=`<span class="skill-index">${index+1}</span><span class="skill-copy"><b>${item?item.name:"Пустое умение"}</b><small>${item?item.weapon:`слот ${index+1}`}</small></span><span class="plus">${item?"↻":"+"}</span>`;
 b.onclick=()=>{
  const pool=type==="active"?activeSkills:type==="passive"?passiveSkills:defenseSkills;
  openPicker(type==="active"?"Активное умение":type==="passive"?"Пассивное умение":"Защита","ПАНЕЛЬ УМЕНИЙ",pool,picked=>{
    if(type==="active")state.active[index]=picked; else if(type==="passive")state.passive[index]=picked; else state.defense=picked;
    renderSkills();showSkill(picked);
  });
 };
 return b;
}
function renderSkills(){
 const ar=$("#activeSkills");ar.innerHTML="";state.active.forEach((x,i)=>ar.append(skillButton(x,i,"active")));
 const pr=$("#passiveSkills");pr.innerHTML="";state.passive.forEach((x,i)=>pr.append(skillButton(x,i,"passive")));
 const dr=$("#defenseSkill");dr.innerHTML="";dr.append(skillButton(state.defense,0,"defense"));
 $("#activeCount").textContent=`${state.active.filter(Boolean).length} / 12`;
 $("#passiveCount").textContent=`${state.passive.filter(Boolean).length} / 8`;
}
function showSkill(s){$("#skillDetails").innerHTML=s?`<b>${s.name}</b><br>${s.desc||s.weapon||""}`:"Выбери умение, чтобы увидеть его описание и трейты."}

function pointCost(value){
 const invested=Math.max(0,value-10);let cost=0;
 for(let i=1;i<=invested;i++)cost+=i<=20?1:i<=40?2:4;
 return cost;
}
function totalSpent(){return Object.values(state.attrs).reduce((a,v)=>a+pointCost(v),0)}
function nextPointCost(v){const n=v-10+1;return n<=20?1:n<=40?2:4}
function renderAttrs(){
 const root=$("#attributes");root.innerHTML="";
 for(const name of attributes){
  const value=state.attrs[name],cost=pointCost(value);
  const el=document.createElement("div");el.className="attr";
  el.innerHTML=`<div class="attr-name">${name}</div><div class="attr-main"><strong>${value}</strong><div class="attr-controls"><button data-d="-1">−</button><button data-d="1">+</button></div></div><small>до бонусов ${value}<br>${Math.max(0,value-10)} вложено · ${cost} очк.<br>Следующее +1: ${nextPointCost(value)} очк.</small>`;
  el.querySelectorAll("button").forEach(btn=>btn.onclick=()=>{
   const old=state.attrs[name],next=Math.max(10,old+Number(btn.dataset.d));state.attrs[name]=next;
   if(totalSpent()>54)state.attrs[name]=old;renderAttrs();
  });root.append(el);
 }
 const spent=totalSpent();$("#spentPoints").textContent=spent;$("#remainingPoints").textContent=54-spent;
}

function masteryPoints(weapon){return Object.values(state.mastery[weapon]).reduce((a,v)=>a+v,0)}
function renderMastery(){
 document.querySelectorAll("[data-mastery-tab]").forEach(b=>b.classList.toggle("active",b.dataset.masteryTab===state.masteryTab));
 const weapon=state.masteryTab,root=$("#masteryTree");root.innerHTML="";
 mastery[weapon].forEach(node=>{
  const lvl=state.mastery[weapon][node.id]||0;
  const el=document.createElement("div");el.className="mastery-node"+(lvl===node.max?" maxed":"");
  el.innerHTML=`<span class="type">[${node.type}]</span><b>${node.name}</b><small>${lvl} из ${node.max} · ${lvl}/${node.max}</small>`;
  const change=d=>{
   const cur=state.mastery[weapon][node.id]||0,next=Math.max(0,Math.min(node.max,cur+d));
   const delta=next-cur;if(delta>0&&masteryPoints(weapon)+delta>200)return;
   state.mastery[weapon][node.id]=next;renderMastery();
  };
  el.onclick=()=>change(1);el.oncontextmenu=e=>{e.preventDefault();change(-1)};root.append(el);
 });
 $("#crossbowMasteryPoints").textContent=`${masteryPoints("crossbow")} / 200`;
 $("#wandMasteryPoints").textContent=`${masteryPoints("wand")} / 200`;
}
document.querySelectorAll("[data-mastery-tab]").forEach(b=>b.onclick=()=>{state.masteryTab=b.dataset.masteryTab;renderMastery()});

function renderBuildSummary(){
 const n=Object.keys(state.gear).length;
 $("#buildBonuses").textContent=n?`Выбрано предметов: ${n}. Полные трейты, руны и сетовые эффекты будут подключены после импорта каталога.`:"Выбери экипировку, чтобы увидеть её бонусы.";
 $("#xbowRange").textContent=state.gear.crossbow?"выбрано":"—";$("#wandRange").textContent=state.gear.wand?"выбрано":"—";
}

function readStats(){
 const n=id=>Number($(id).value)||0;
 return {minDamage:n("#minDamage"),maxDamage:n("#maxDamage"),attackSpeed:n("#attackSpeed"),critChance:n("#critChance"),critDamage:n("#critDamage"),heavyChance:n("#heavyChance"),skillBoost:n("#skillBoost"),skillResist:n("#skillResist")};
}
function runSimulation(){
 const r=simulateFiveMinutes(readStats());
 $("#result").innerHTML=`<span>Средний DPS модели</span><strong>${r.dps.toFixed(1)}</strong><small>${r.warning}</small>`;
}
$("#simulate").onclick=runSimulation;$("#simulateHero").onclick=()=>{$(".sticky-card").scrollIntoView({behavior:"smooth",block:"start"});setTimeout(runSimulation,350)};
$("#resetBuild").onclick=()=>{if(confirm("Очистить текущую сборку?"))location.reload()};

renderGear();renderSkills();renderAttrs();renderMastery();renderBuildSummary();