import {gearSlots,attributes,supportedSkills} from "./data.js";
import {simulateFiveMinutes} from "./simulator.js";

const state={gear:{},active:Array(12).fill(null),passive:Array(8).fill(null),defense:null,attrs:Object.fromEntries(attributes.map(x=>[x,10]))};

const gearGrid=document.querySelector("#gearGrid");
gearSlots.forEach(slot=>{
  const el=document.createElement("button"); el.className="slot";
  el.innerHTML=`<span class="label">${slot}<small>выбрать предмет</small></span><span class="plus">+</span>`;
  el.addEventListener("click",()=>{el.querySelector("small").textContent="каталог подключается";});
  gearGrid.append(el);
});

function renderSkillSlots(id,count,type){
  const root=document.querySelector(id); root.innerHTML="";
  for(let i=0;i<count;i++){
    const el=document.createElement("button"); el.className="skill-slot";
    el.innerHTML=`<span class="label">Пустое умение<small>слот ${i+1}</small></span><span class="plus">+</span>`;
    el.addEventListener("click",()=>cycleSkill(el,i,type));
    root.append(el);
  }
}
function cycleSkill(el,i,type){
  const pool=type==="active"?supportedSkills:[];
  if(!pool.length){el.querySelector("small").textContent="будет подключено";return;}
  const current=state.active[i];
  const idx=current?pool.findIndex(x=>x.id===current.id):-1;
  const next=pool[(idx+1)%pool.length]; state.active[i]=next;
  el.querySelector(".label").innerHTML=`${next.name}<small>${next.weapon}</small>`;
  document.querySelector("#activeCount").textContent=`${state.active.filter(Boolean).length} / 12`;
}
renderSkillSlots("#activeSkills",12,"active");renderSkillSlots("#passiveSkills",8,"passive");renderSkillSlots("#defenseSkill",1,"defense");

const attrsRoot=document.querySelector("#attributes");
function pointCost(baseValue){
  const invested=Math.max(0,baseValue-10);
  let cost=0;
  for(let i=1;i<=invested;i++) cost+=i<=20?1:i<=40?2:4;
  return cost;
}
function totalSpent(){return Object.values(state.attrs).reduce((s,v)=>s+pointCost(v),0);}
function renderAttrs(){
  attrsRoot.innerHTML="";
  for(const name of attributes){
    const value=state.attrs[name];
    const wrap=document.createElement("div");wrap.className="attr";
    wrap.innerHTML=`<div class="attr-head"><div><b>${name}</b><div class="attr-value">${value}</div></div><div class="attr-controls"><button data-d="-1">−</button><button data-d="1">+</button></div></div><small>База 10 · вложено ${Math.max(0,value-10)}</small>`;
    wrap.querySelectorAll("button").forEach(btn=>btn.addEventListener("click",()=>{
      const d=Number(btn.dataset.d);const next=Math.max(10,state.attrs[name]+d);
      const old=state.attrs[name];state.attrs[name]=next;
      if(totalSpent()>54){state.attrs[name]=old;return;}
      renderAttrs();
    }));
    attrsRoot.append(wrap);
  }
  document.querySelector("#spentPoints").textContent=totalSpent();
}
renderAttrs();

function readStats(){
  const v=id=>Number(document.querySelector(id).value)||0;
  return {minDamage:v("#minDamage"),maxDamage:v("#maxDamage"),attackSpeed:v("#attackSpeed"),critChance:v("#critChance"),critDamage:v("#critDamage"),heavyChance:v("#heavyChance"),skillBoost:v("#skillBoost"),skillResist:v("#skillResist")};
}
function runSimulation(){
  const r=simulateFiveMinutes(readStats());
  const box=document.querySelector("#result");box.classList.remove("empty");
  box.innerHTML=`<span>Средний DPS модели</span><strong>${r.dps.toFixed(1)}</strong><small>${r.warning}</small>`;
}
document.querySelector("#simulate").addEventListener("click",runSimulation);
document.querySelector("#simulateTop").addEventListener("click",runSimulation);
document.querySelector("#resetBuild").addEventListener("click",()=>location.reload());
