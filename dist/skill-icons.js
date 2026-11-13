// Alternate active-skill icons for specializations that transform the skill.
const transformed={
 'SkillSet_WP_WA_GR_S_Decay_trait_1':'icons/skill-enchanting-time.webp',
 'SkillSet_WP_WA_GR_S_DefenseUp_trait_1':'icons/skill-valorous-barrier.webp',
 'SkillSet_WP_WA_GR_S_HealAll_trait_1':'icons/skill-janices-rage.webp'
};
export function skillIcon(skill,specs={}){
 if(!skill)return '';
 const selected=specs[skill.id]||[];
 const variant=(skill.specializations||[]).find(s=>selected.includes(s.id)&&transformed[s.id]);
 return variant?transformed[variant.id]:(skill.thumbnail||skill.icon||'');
}
