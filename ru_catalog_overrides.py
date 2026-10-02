"""Local RU corrections applied after importing the upstream catalogue."""

def apply_ru_overrides(items):
    for item in items:
        if item['id'] != 'crossbow_aa_t2_polymorph_001':
            continue
        # RU T2 supports +12 (user-confirmed). Upstream has only off-hand
        # rows above +9. Extend the same Epic weapon curves used at +1..9;
        # the +10..12 extra-stat values still need RU-client verification.
        item['enchantMaxLevel'] = 12
        for level in range(10, 13):
            item.setdefault('enchantScaling', {}).setdefault(str(level), {}).update({
                'attack_power_main_hand': 3 * level - 1,
                'bonus_attack_power_main_hand': level - 1,
                'attack_power_off_hand': 3 * level - 1,
                'bonus_attack_power_off_hand': level - 1,
            })
            item.setdefault('extraEnchantScaling', {})[str(level)] = {
                'dex': level // 2,
                'stamina_regen': 500 * level,
                'damage_reduction_penetration': 3 * level // 2,
            }

        # Exact RU +12 tooltip supplied 2026-10-03: main 35–148,
        # off-hand 44–166, DEX 13, stamina regen 8.65, penetration 22.
        item['enchantScaling']['12'].update({
            'attack_power_main_hand': 52,
            'bonus_attack_power_main_hand': 15,
        })
        item['extraEnchantScaling']['12'].update({'dex': 8, 'stamina_regen': 6050})
    return items
