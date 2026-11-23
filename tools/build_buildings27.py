"""geo_raw/buildings.json (Overture) → data/buildings27.json in the film's projected metres (same projection as build_geo27.py)."""
import json, math
LON0, LAT0 = 54.45, 24.47; R = 6378137.0; S = math.cos(math.radians(LAT0))
my = lambda lat: R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
PT = lambda lon, lat: [round(R * math.radians(lon - LON0) * S, 1), round((my(lat) - my(LAT0)) * S, 1)]
b = [x for x in json.load(open('geo_raw/buildings.json')) if x['h'] >= 20]
json.dump({'source': 'Overture Maps 2026-11-18.0 theme=buildings (OpenStreetMap and other open sources, ODbL 1.0); height attribute or floors x 3.4 m',
           'buildings': [{'h': x['h'], 'c': [PT(*p) for p in x['c'][:-1]]} for x in b]}, open('data/buildings27.json', 'w'), separators=(',', ':'))
print(len(b), 'buildings')
