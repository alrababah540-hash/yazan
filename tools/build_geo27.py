"""Build data/geo27.json for the 27-second film.
Inputs (Overture Maps 2026-11-18.0, derived from OpenStreetMap, ODbL 1.0):
  geo_raw/divisions.json  country + emirate land boundaries
  geo_raw/ad_land.json    Abu Dhabi land/island polygons (named by OSM)
All geometry is projected with spherical Web Mercator (conformal: no shape distortion of islands),
then expressed in metres relative to the Abu Dhabi focus centre, scaled by 1/cos(lat0) so units ~ true metres there."""
import json, math, shapely
from shapely.geometry import shape, box
from shapely.ops import unary_union
LON0, LAT0 = 54.45, 24.47
R = 6378137.0; S = math.cos(math.radians(LAT0))
def merc(lon, lat): return R * math.radians(lon), R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
X0, Y0 = merc(LON0, LAT0)
def P(g): return shapely.transform(g, lambda c: [[(merc(x, y)[0] - X0) * S, (merc(x, y)[1] - Y0) * S] for x, y in c])
def PT(lon, lat): x, y = merc(lon, lat); return [round((x - X0) * S), round((y - Y0) * S)]
def rings(g, tol, min_area):
    out = []
    for poly in (g.geoms if hasattr(g, 'geoms') else [g]):
        if poly.geom_type != 'Polygon': continue
        q = P(poly).simplify(tol, preserve_topology=True)
        for qq in (q.geoms if hasattr(q, 'geoms') else [q]):
            if qq.is_empty or qq.area < min_area: continue
            out.append([[round(x), round(y)] for x, y in qq.exterior.coords])
    return out
div = json.load(open('geo_raw/divisions.json'))['features']
REG = box(44.0, 17.0, 64.0, 31.5)
res = {'source': 'Overture Maps Foundation release 2026-11-18.0 (divisions + base/land), derived from OpenStreetMap © OpenStreetMap contributors, ODbL 1.0',
       'projection': f'Web Mercator, origin {LON0},{LAT0}, scaled by cos(lat0)', 'origin': [LON0, LAT0], 'countries': {}, 'emirates': {}, 'islands': {}}
for f in div:
    p = f['properties']
    if p['subtype'] == 'country' and p['is_land'] and p['country'] in ('SA', 'OM', 'QA', 'BH', 'IR', 'AE'):
        g = shape(f['geometry']).buffer(0).intersection(REG)
        res['countries'][p['country']] = {'name': p['name_en'], 'rings': rings(g, 900, 4e6)}
EM = {'AE-AZ': ('Abu Dhabi', 1), 'AE-DU': ('Dubai', 2), 'AE-SH': ('Sharjah', 3), 'AE-AJ': ('Ajman', 4), 'AE-UQ': ('Umm Al Quwain', 5), 'AE-RK': ('Ras Al Khaimah', 6), 'AE-FU': ('Fujairah', 7)}
for f in div:
    p = f['properties']
    if p['subtype'] == 'region' and p['is_land'] and p['region'] in EM:
        g = shape(f['geometry']).buffer(0)
        lab = shapely.ops.polylabel(max(g.geoms, key=lambda x: x.area) if hasattr(g, 'geoms') else g, 0.005)
        nm, order = EM[p['region']]
        res['emirates'][p['region']] = {'name': nm, 'osm_name': p['name'], 'order': order, 'rings': rings(g, 250, 2e5), 'label': PT(lab.x, lab.y),
                                        'area_km2': round(P(g).area / S / S / 1e6 * S * S, 0)}
        print(p['region'], nm, len(res['emirates'][p['region']]['rings']), 'rings')
# Abu Dhabi detail
land = json.load(open('geo_raw/ad_land.json'))['features']
BB = box(54.05, 24.18, 54.90, 24.76)
L = []; named = {}
FOCUS = {'yas': ('Yas Island', ['جزيرة ياس']), 'fahid': ('Al Fahid Island', ['جزيرة بسرة فهد']), 'saadiyat': ('Saadiyat Island', ['جزيرة السعديات']),
         'reem': ('Al Reem Island', ['جزيرة الريم']), 'maryah': ('Al Maryah Island', ['جزيرة المارية']), 'hudayriyat': ('Hudayriyat Island', ['جزيرة الحديريات']),
         'lulu': ('Lulu Island', ['جزيرة اللؤلؤ']), 'abudhabi': ('Abu Dhabi Island', ['جزيرة أبو ظبي'])}
for f in land:
    p = f['properties']
    if p['subtype'] != 'land': continue
    g = shape(f['geometry'])
    if g.geom_type not in ('Polygon', 'MultiPolygon'): continue
    if not g.is_valid: g = g.buffer(0)
    for k, (en, ar) in FOCUS.items():
        if p['name'] in ar: named.setdefault(k, []).append(g)
    if p['class'] in ('land', 'island', 'islet') and g.intersects(BB): L.append(g.intersection(BB))
U = unary_union(L)
res['ad_land'] = rings(U, 9, 3000)
res['ad_bbox'] = [PT(54.05, 24.18), PT(54.90, 24.76)]
for k, gs in named.items():
    u = unary_union(gs); c = u.centroid if u.contains(u.centroid) else u.representative_point()
    if k == 'hudayriyat':  # pole of inaccessibility of the island's northern half (main body facing Abu Dhabi Island)
        n = u.intersection(box(54.32, 24.37, 54.43, 24.45)); n = max(n.geoms, key=lambda g: g.area) if hasattr(n, 'geoms') else n; c = shapely.ops.polylabel(n, 0.0003)
    assert u.buffer(1e-9).contains(c), k
    res['islands'][k] = {'name': FOCUS[k][0], 'osm_name': FOCUS[k][1][0], 'lonlat': [round(c.x, 4), round(c.y, 4)], 'pin': PT(c.x, c.y),
                         'rings': rings(u, 5, 2000), 'area_km2': round(P(u).area / 1e6, 2), 'bounds_lonlat': [round(v, 4) for v in u.bounds]}
    print(k, res['islands'][k]['lonlat'], res['islands'][k]['area_km2'], 'km2')
print('ad_land rings', len(res['ad_land']), 'verts', sum(map(len, res['ad_land'])))
json.dump(res, open('data/geo27.json', 'w'), separators=(',', ':'))
