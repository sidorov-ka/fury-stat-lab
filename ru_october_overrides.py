"""Preserve the RU 2026-10-06 client additions during catalogue imports."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).parent

def apply_october_overrides(catalog):
    snapshot = json.loads((ROOT / 'docs/ru-october-earrings.json').read_text())
    trait_ids = {}
    for key, trait in snapshot['traits'].items():
        native = trait['nativeTraitId']
        trait_ids[key] = native
        catalog['traits'][native] = {**trait, 'max': trait['curve'][-1]}
    earrings = []
    for original in snapshot['items']:
        item = {**original, 'id': original['nativeId'],
                'traits': [trait_ids[t] for t in original['traits']],
                'resonanceEffects': [], 'sourceThumbnail': original['thumbnail'],
                'sourceData': 'docs/ru-october-earrings.json'}
        item['thumbnail'] = 'icons/' + hashlib.sha256(original['thumbnail'].encode()).hexdigest()[:20] + '.webp'
        earrings.append(item)
    catalog['equipment'] = [i for i in catalog['equipment'] if i['slot'] != 'Earring'] + earrings
    patch = json.loads((ROOT / 'docs/ru-october-skills.json').read_text())
    for skill in catalog['skills']:
        skill.update(patch['skills'].get(skill['id'], {}))
    for milestone in catalog['attributes']['milestones']:
        if milestone['attribute'] == 'DEX' and milestone['count'] == 80:
            for bonus in milestone['bonuses']:
                if bonus['stat'] == 'damage_reduction_penetration':
                    bonus['value'] = 9
    names = {'accuracy': 'Меткость', 'critical_attack': 'Шанс критического удара',
             'double_attack': 'Шанс мощной атаки', 'evasion': 'Уклонение',
             'critical_defense': 'Устойчивость', 'double_defense': 'Устойчивость к мощным атакам',
             'damage_reduction': 'Снижение урона'}
    for position, label in [('front', 'спереди'), ('side', 'с фланга'), ('back', 'со спины')]:
        for stat, name in names.items():
            key = position + '_' + stat
            catalog['labels'][key] = name + ' (' + label + ')'
            catalog['formats'][key] = {'mul': 1 if stat == 'damage_reduction' else .1, 'suffix': ''}
    catalog['patch'] = {'region': 'RU', 'releaseDate': '2026-10-06', 'source': patch['source'],
                        'earringsSource': 'https://tl-build.ru/builder',
                        'clientSnapshot': 'docs/ru-october-earrings.json'}
    return catalog
