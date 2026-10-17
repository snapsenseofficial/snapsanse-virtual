# Rebuild research/usp-map.json from the department research files (research/avatars-<dept>.json).
# usage: python3 crew/tools/igposter/build-usp.py
import json, glob, os
D = os.environ.get('IGPACK_DATA') or os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'igpack')
R = os.path.join(D, 'research')
m = {'brand': 'Semua harga dipapar di katalog', 'packages': {}, 'items': {}}
for f in sorted(glob.glob(os.path.join(R, 'avatars-*.json'))):
    j = json.load(open(f))
    for p in j['packages']:
        assert len(p['uspShort']) <= 34, (p['id'], 'uspShort > 34')
        m['packages'][p['id']] = {'uspShort': p['uspShort'], 'hook': p['hook'], 'dept': j['dept']}
m['packages']['addon'] = {'uspShort': 'Tambah ikut gaya majlis anda'}
json.dump(m, open(os.path.join(R, 'usp-map.json'), 'w'), ensure_ascii=False, indent=1)
print(len(m['packages']), 'packages ->', os.path.join(R, 'usp-map.json'))
