"""Local RU corrections applied after importing the upstream catalogue."""

def apply_ru_overrides(items):
    for item in items:
        if item['id'] != 'crossbow_aa_t2_polymorph_001':
            continue
        # TL Build controls at +1, +9, +10, +11, +12 (2026-10-12),
        # corroborated by the user's RU +12 tooltip. Upstream's main-hand
        # and DEX/stamina base values belong to the older version.
        item['enchantMaxLevel'] = 12
        item['baseStats'].update({'attack_power_main_hand': 79,
                                  'bonus_attack_power_main_hand': 23})
        item['extraStats'].update({'dex': 7, 'stamina_regen': 2650})
        for level in range(1, 13):
            item.setdefault('enchantScaling', {}).setdefault(str(level), {}).update({
                'attack_power_main_hand': 3 * level - 1,
                'bonus_attack_power_main_hand': max(0, level - 1),
                'attack_power_off_hand': 3 * level - 1,
                'bonus_attack_power_off_hand': max(0, level - 1),
            })
            item.setdefault('extraEnchantScaling', {})[str(level)] = {
                'dex': level // 2,
                'stamina_regen': 500 * level,
                'damage_reduction_penetration': 3 * level // 2,
            }
    return items
