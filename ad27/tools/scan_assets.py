"""Scan Abu_Dhabi_Video/ and write scene/assets.json (which image goes where)."""
import json, os, glob
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); LIB = os.path.join(ROOT, 'Abu_Dhabi_Video')
EXT = ('.jpg', '.jpeg', '.png', '.webp')
imgs = lambda d: sorted(f for f in glob.glob(os.path.join(LIB, d, '*')) if f.lower().endswith(EXT))
rel = lambda f: '/' + os.path.relpath(f, ROOT).replace(os.sep, '/')
CR = json.load(open(os.path.join(LIB, 'credits.json'))) if os.path.exists(os.path.join(LIB, 'credits.json')) else {}
def ent(f):
    k = os.path.relpath(f, LIB).replace(os.sep, '/'); c = CR.get(k)
    return {'src': rel(f), 'credit': c['credit']} if c else rel(f)
ISL = {'yas': '03_Yas_Island', 'fahid': '04_Al_Fahid', 'saadiyat': '05_Saadiyat', 'reem': '06_Al_Reem', 'maryah': '07_Al_Maryah', 'hudayriyat': '08_Hudayriyat', 'lulu': '09_Lulu_Island'}
out = {'islands': {k: [ent(f) for f in imgs(d)] for k, d in ISL.items()}, 'skyline': None, 'logo': None, 'signoff': None, 'inventory': {}}
for d in sorted(os.listdir(LIB)):
    if os.path.isdir(os.path.join(LIB, d)): out['inventory'][d] = [os.path.basename(f) for f in imgs(d)]
sky = [f for f in glob.glob(os.path.join(LIB, '*', '*')) if 'skyline' in os.path.basename(f).lower() and f.lower().endswith(EXT)]
out['skyline'] = ent(sorted(sky)[0]) if sky else None
logo = [f for f in imgs('12_Personal_Branding') if os.path.basename(f).lower().startswith('logo')]
out['logo'] = rel(logo[0]) if logo else None
txt = sorted(glob.glob(os.path.join(LIB, '12_Personal_Branding', '*.txt')))
out['signoff'] = open(txt[0]).readline().strip() if txt else None
json.dump(out, open(os.path.join(ROOT, 'scene', 'assets.json'), 'w'), indent=1)
n = sum(len(v) for v in out['inventory'].values()); print('images found:', n); [print(' ', k, len(v)) for k, v in out['inventory'].items()]
