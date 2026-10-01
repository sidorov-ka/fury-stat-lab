import json, urllib.request, concurrent.futures, pathlib, hashlib, time
ROOT = pathlib.Path(__file__).parent / 'dist'
ASSETS = ROOT / 'icons'
ASSETS.mkdir(exist_ok=True)
def read(name):
    cache = pathlib.Path('/tmp/'+name+'.json')
    if cache.exists():
        return json.loads(cache.read_text())
    endpoint = 'skills' if name == 'fury-skills' else name
    return json.loads(urllib.request.urlopen('https://rutl.org/builder-data/'+endpoint+'.json', timeout=30).read())
items = [x for x in read('equipment') if x['slot'] != 'Weapon' or x['category'] in ('Crossbow','Wand')]
skills = [x for x in read('fury-skills') if x['weapon'] in ('Crossbow','Wand')]
urls = set(x.get('thumbnail') for x in items+skills)
urls.update(s.get('icon') for x in skills for s in x.get('specializations',[]))
urls.discard(None)
def fetch(path):
    target = ASSETS / (hashlib.sha256(path.encode()).hexdigest()[:20]+pathlib.Path(path).suffix)
    if not target.exists():
        for attempt in range(2):
            try:
                data = urllib.request.urlopen('https://rutl.org'+path, timeout=12).read()
                if not (data.startswith(b'RIFF') or data.startswith(b'\x89PNG') or data.startswith(b'\xff\xd8')): raise ValueError('Not an image')
                target.write_bytes(data)
                break
            except Exception as e:
                if attempt: return (path,None)
    return (path,'icons/'+target.name)
with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
    icons = dict(pool.map(fetch,urls))
for x in items+skills:
    x['sourceThumbnail'] = x.get('thumbnail')
    x['thumbnail'] = icons.get(x.get('thumbnail'))
for x in skills:
    for s in x.get('specializations',[]): s['icon'] = icons.get(s.get('icon'))
fields = ['id','name','description','thumbnail','slot','category','grade','tier','baseStats','extraStats','enchantMaxLevel','enchantScaling','extraEnchantScaling','traits','specialPerk','setName','setBonuses']
payload = {'source':'https://rutl.org/builder','retrievedAt':'2026-09-24','equipment':[{k:x.get(k) for k in fields} for x in items], 'skills':skills, 'traits':read('traits'),'labels':read('stat-labels')['stats'],'formats':read('stat-format'),'attributeStats':read('attribute-stats'),'attributes':read('attributes')}
(ROOT/'catalog.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')))
print(json.dumps({'items':len(items),'skills':len(skills),'icons':len(icons),'missing':[p for p,v in icons.items() if v is None]}),flush=True)
