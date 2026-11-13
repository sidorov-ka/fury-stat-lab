// Alternate active-skill icons for specializations that transform the skill.
const transformed={
 'SkillSet_WP_WA_GR_S_Decay_trait_1':'icons/skill-enchanting-time.webp',
 'SkillSet_WP_WA_GR_S_DefenseUp_trait_1':'icons/skill-valorous-barrier.webp',
 'SkillSet_WP_WA_GR_S_CurseBurst_trait_1':'icons/skill-dark-explosion.webp',
 'SkillSet_WP_CR_CR_S_ArmorBreakShot_Trait_2':'icons/skill-detonation-mark.webp'
};
export function skillIcon(skill,specs={}){
 if(!skill)return '';
 const selected=specs[skill.id]||[];
 const variant=(skill.specializations||[]).find(s=>selected.includes(s.id)&&transformed[s.id]);
 return variant?transformed[variant.id]:(skill.thumbnail||skill.icon||'');
}
