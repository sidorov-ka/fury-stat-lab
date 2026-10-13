// Coefficients and triggers from the RU client descriptions retained in catalog.json.
export const WEAPON_EFFECTS={
 crossbow_aa_t2_polymorph_001:'bellandir',crossbow_a_t2_nomal_004:'bolt',wand_aa_t2_polymorph_001:'tevent',
 crossbow_aa_t2_polymorph_002:'brauka',crossbow_a_t2_nomal_003:'step',crossbow_a_t3_Arthropod_001:'barrage',
 wand_a_t2_nomal_001:'area',wand_aa_t1_normal_011:'laser',crossbow_aa_t5_boss_003:'rapid',
 crossbow_a_t3_mythicbeast_003:'vitality',wand_a_t3_Arthropod_001:'healCooldown',wand_aa_t5_boss_001:'invisibility',wand_aa_t5_boss_002:'shieldPlus',wand_aa_t5_boss_003:'manaDrain',wand_aa_t5_boss_005:'healOverTime',wand_aa_t2_polymorph_002:'shieldPower',wand_a_t2_nomal_003:'groupHeal',crossbow_aa_t5_boss_002:'partyMove',crossbow_a_t1_normal_001:'rewards',wand_a_t1_normal_001:'rewards',crossbow_aa_t2_boss_001:'mana',crossbow_aa_t5_boss_001:'daySpeed'
};
export function weaponEffects(state){return new Set(['weapon1','weapon2'].map(slot=>WEAPON_EFFECTS[state.items?.[slot]?.id]).filter(Boolean));}
// Exact probability branches for discrete proc attempts. Each branch retains its own
// capped stack count, expiry and tick phase; a 20% proc is never treated as a full stack.
export class ProcDot{
 constructor(cap=1){this.cap=cap;this.empty=1;this.states=[];this.nextTick=Infinity;this.expires=Infinity;}
 merge(rows){const map=new Map();for(const d of rows){if(d.weight<1e-12){this.empty+=d.weight;continue;}const end=Math.round(d.end*1e6),next=Math.round(d.next*1e6),slot=Math.round(d.next*20);const key=Math.abs(next-slot*50000)<=0&&slot>=0&&slot<65536&&end>=0&&end<1e9?(end*(this.cap+1)+d.stacks)*65536+slot:`${d.stacks}/${end}/${next}`;const old=map.get(key);if(old)old.weight+=d.weight;else map.set(key,d);}this.states=[...map.values()];this.refreshEvents();}
 refreshEvents(){this.nextTick=Infinity;this.expires=Infinity;for(const d of this.states){this.nextTick=Math.min(this.nextTick,d.next);this.expires=Math.min(this.expires,d.end);}}
 expire(t){if(t<=this.expires+1e-7)return;this.states=this.states.filter(d=>{if(d.end<t-1e-7){this.empty+=d.weight;return false;}return true;});this.refreshEvents();}
 apply(t,probability,duration){this.expire(t);const q=Math.max(0,Math.min(1,probability));if(!q)return 0;const rows=[];if(this.empty*q>0)rows.push({weight:this.empty*q,stacks:1,end:t+duration,next:t+1});this.empty*=1-q;for(const d of this.states){if(q<1)rows.push({...d,weight:d.weight*(1-q)});rows.push({...d,weight:d.weight*q,stacks:Math.min(this.cap,d.stacks+1),end:t+duration});}this.merge(rows);return q;}
 // Optional offhand hits are a Bernoulli event as well as the proc itself.
 hits(t,probability,count,duration){const whole=Math.floor(count);for(let i=0;i<whole;i++)this.apply(t,probability,duration);if(count>whole)this.apply(t,probability*(count-whole),duration);}
 tick(t){if(t+1e-7<this.nextTick){this.expire(t);return 0;}let stacks=0;for(const d of this.states)if(d.next<=t+1e-7&&d.next<=d.end+1e-7){stacks+=d.weight*d.stacks;d.next+=1;}this.expire(t);this.refreshEvents();return stacks;}
 remaining(t){this.expire(t);return this.states.reduce((n,d)=>n+d.weight*d.stacks*Math.max(0,Math.floor(d.end-d.next+1e-7)+1),0);}
 // Adding the same duration preserves distinct branch keys; no merge is needed.
 extend(t,seconds){for(const d of this.states)if(d.end>t)d.end+=seconds;this.refreshEvents();}
 stacks(t){this.expire(t);return this.states.reduce((n,d)=>n+d.weight*d.stacks,0);}
 consume(probability=1){const q=Math.max(0,Math.min(1,probability));this.empty+=(1-this.empty)*q;for(const d of this.states)d.weight*=1-q;this.merge(this.states);}
 clear(){this.empty=1;this.states=[];this.refreshEvents();}
}
