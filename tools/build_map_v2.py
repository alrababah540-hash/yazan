"""Abu Dhabi map v2: Overture/OSM land polygons (current coastline, ODbL) → local metres,
with the four focus islands identified by their OSM names (not by guessed coordinates)."""
import json, math, sys, shapely
from shapely.geometry import shape, box, mapping
from shapely.ops import unary_union
src, dst = sys.argv[1], sys.argv[2]
BB = (54.25, 24.36, 54.70, 24.62); cx, cy = (BB[0] + BB[2]) / 2, (BB[1] + BB[3]) / 2
kx, ky = 111320 * math.cos(math.radians(cy)), 110574
P = lambda g: shapely.transform(g, lambda c: [[(x - cx) * kx, (y - cy) * ky] for x, y in c])
FOCUS = {'abudhabi': 'جزيرة أبو ظبي', 'reem': 'جزيرة الريم', 'saadiyat': 'جزيرة السعديات', 'yas': 'جزيرة ياس'}
EN = {'abudhabi': 'Abu Dhabi Island', 'reem': 'Al Reem Island', 'saadiyat': 'Saadiyat Island', 'yas': 'Yas Island'}
d = json.load(open(src)); clip = box(*BB); land = []; focus = {k: [] for k in FOCUS}
for f in d['features']:
    p = f['properties']
    if p['subtype'] != 'land': continue
    g = shape(f['geometry'])
    if not g.is_valid: g = g.buffer(0)
    for k, n in FOCUS.items():
        if p['name'] == n: focus[k].append(g)
    if p['class'] in ('land', 'island', 'islet') and g.intersects(clip): land.append(g.intersection(clip))
L = unary_union(land)
def rings(g, tol):
    out = []
    for poly in (g.geoms if hasattr(g, 'geoms') else [g]):
        if poly.geom_type != 'Polygon' or poly.area < 2e-7: continue
        q = P(poly).simplify(tol)
        if q.is_empty or q.area < 1500: continue
        for qq in (q.geoms if hasattr(q, 'geoms') else [q]):
            out.append({'outer': [[round(x, 1), round(y, 1)] for x, y in qq.exterior.coords], 'holes': [[[round(x, 1), round(y, 1)] for x, y in h.coords] for h in qq.interiors if shapely.Polygon(h).area > 4000]})
    return out
res = {'source': 'Overture Maps 2026-11-18.0 theme=base/type=land (© OpenStreetMap contributors, ODbL 1.0)', 'bbox': BB, 'centre': [cx, cy],
       'land': rings(L, 12), 'focus': {}}
for k, gs in focus.items():
    u = unary_union(gs); c = u.representative_point() if k != 'reem' else u.centroid
    pc = P(shapely.Point(c.x, c.y)).coords[0]
    res['focus'][k] = {'name_ar': FOCUS[k], 'name_en': EN[k], 'lonlat': [round(c.x, 4), round(c.y, 4)], 'xy': [round(pc[0]), round(pc[1])], 'rings': rings(u, 8), 'area_km2': round(P(u).area / 1e6, 2)}
    print(k, res['focus'][k]['lonlat'], res['focus'][k]['area_km2'], 'km²')
json.dump(res, open(dst, 'w')); print('land rings', len(res['land']), 'vertices', sum(len(r['outer']) for r in res['land']))
