"""Import legendary raid and upgraded archboss gear from the captured reference."""
import hashlib
import json
from pathlib import Path
ROOT = Path(__file__).parent

def apply_november_weapons(catalog):
    snapshot = json.loads((ROOT / 'docs/ru-november-weapons.json').read_text())
    items = []
    for original in snapshot['items']:
        item = dict(original)
        source = item.get('thumbnail')
        item['sourceThumbnail'] = source
        if source:
            item['thumbnail'] = 'icons/' + hashlib.sha256(source.encode()).hexdigest()[:20] + Path(source).suffix
        item['sourceData'] = 'docs/ru-november-weapons.json'
        items.append(item)
    ids = {item['id'] for item in items}
    catalog['equipment'] = [item for item in catalog['equipment'] if item['id'] not in ids] + items
    return catalog
