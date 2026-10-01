import json, pathlib, urllib.request, concurrent.futures
d=json.load(open('/tmp/fury-mastery-v2.json'))
paths={n['icon'] for w in ['CR','WA_GR'] for n in d['weapons'][w]['nodes']}
target=pathlib.Path('dist/icons/mastery');target.mkdir(parents=True,exist_ok=True)
def fetch(path):
    dest=target/pathlib.Path(path).name
    if not dest.exists():
        with urllib.request.urlopen('https://rutl.org'+path,timeout=30) as r: data=r.read()
        if not data or data.lstrip().startswith(b'<'): raise ValueError(path)
        dest.write_bytes(data)
    return dest.name
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    results=list(pool.map(fetch,paths))
print('Downloaded mastery icons:',len(results))
