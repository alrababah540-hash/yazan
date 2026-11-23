"""Download chosen Wikimedia Commons photos into Abu_Dhabi_Video/<folder>/ and record licence + author in credits.json.
usage: python3 tools/fetch_commons.py picks.json   (picks: [{"folder","file","title","thumb","lic","artist","page"}])"""
import json, os, sys, time, urllib.request, urllib.error
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); LIB = os.path.join(ROOT, 'Abu_Dhabi_Video')
picks = json.load(open(sys.argv[1])); cred_path = os.path.join(LIB, 'credits.json')
credits = json.load(open(cred_path)) if os.path.exists(cred_path) else {}
for p in picks:
    out = os.path.join(LIB, p['folder'], p['file'])
    if not os.path.exists(out):
        for k in range(8):
            try:
                r = urllib.request.Request(p['thumb'], headers={'User-Agent': 'AbuDhabiFilmResearch/1.0 (https://code.claude.com; research use)'})
                open(out, 'wb').write(urllib.request.urlopen(r, timeout=60).read()); break
            except urllib.error.HTTPError as e:
                if e.code != 429: raise
                time.sleep(10 * (k + 1))
        time.sleep(3)
    credits[f"{p['folder']}/{p['file']}"] = {'title': p['title'], 'author': p['artist'], 'license': p['lic'], 'source': p['page'], 'credit': f"{p['artist']} / Wikimedia Commons, {p['lic']}"}
    print('ok', out, os.path.getsize(out))
json.dump(credits, open(cred_path, 'w'), indent=1)
