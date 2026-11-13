// Alternate active-skill icons for specializations that transform the skill.
const transformed={
 'SkillSet_WP_WA_GR_S_Decay_trait_1':'icons/skill-enchanting-time.webp',
 'SkillSet_WP_WA_GR_S_DefenseUp_trait_1':'icons/skill-valorous-barrier.webp',
 'SkillSet_WP_WA_GR_S_CurseBurst_trait_1':'icons/skill-dark-explosion.webp',
 'SkillSet_WP_CR_CR_S_ArmorBreakShot_Trait_2':'icons/skill-detonation-mark.webp',
 'SkillSet_WP_WA_GR_S_CurseSpread_trait_1':'icons/skill-unlucky-clock.webp',
 'SkillSet_WP_WA_GR_S_CurseArea_trait_1':'icons/skill-decaying-touch.webp'
};
export function skillIcon(skill,specs={}){
 if(!skill)return '';
 const selected=specs[skill.id]||[];
 const variant=(skill.specializations||[]).find(s=>selected.includes(s.id)&&transformed[s.id]);
 return variant?transformed[variant.id]:(skill.thumbnail||skill.icon||'');
}
