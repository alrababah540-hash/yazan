"""Clip OSM-derived land polygons (@geo-maps/earth-lands-100m, ODbL) to the Abu Dhabi
city area and project to local metres (equirectangular around the bbox centre)."""
import json, sys, math, shapely
from shapely.geometry import shape, box, mapping, Point
from shapely.ops import transform
src, dst = sys.argv[1], sys.argv[2]
BB = (54.28, 24.36, 54.68, 24.62)        # lon/lat
cx, cy = (BB[0]+BB[2])/2, (BB[1]+BB[3])/2
kx = 111320*math.cos(math.radians(cy)); ky = 110540
g = json.load(open(src))
geoms = [shape(f['geometry']) for f in g['features']] if 'features' in g else [shape(g)]
clip = box(*BB); polys = []
parts = []
for gm in geoms: parts += list(gm.geoms) if hasattr(gm, 'geoms') else [gm]
for gm in parts:
    if not gm.envelope.intersects(clip): continue
    c = shapely.clip_by_rect(gm, *BB)
    if not c.is_valid: c = c.buffer(0)
    for p in (c.geoms if hasattr(c, 'geoms') else [c]):
        if p.geom_type == 'Polygon' and p.area > 1e-7: polys.append(p)
proj = lambda x, y, z=None: ((x-cx)*kx, (y-cy)*ky)
out = []
for p in polys:
    q = transform(proj, p).simplify(float(sys.argv[3]) if len(sys.argv)>3 else 0)
    out.append({'outer': [list(map(lambda v: round(v,1), pt)) for pt in q.exterior.coords],
                'holes': [[list(map(lambda v: round(v,1), pt)) for pt in h.coords] for h in q.interiors],
                'area': round(q.area)})
# verified label anchors (approximate centroids of the named islands, WGS84)
labels = {'yas': (54.605, 24.490), 'saadiyat': (54.435, 24.545), 'reem': (54.405, 24.498)}
L = {}
for k, (lo, la) in labels.items():
    x, y = proj(lo, la); hit = [i for i, p in enumerate(polys) if p.contains(Point(lo, la))]
    L[k] = {'x': round(x), 'y': round(y), 'polygon': hit[0] if hit else None, 'lonlat': [lo, la]}
json.dump({'bbox': BB, 'centre': [cx, cy], 'polys': out, 'labels': L,
           'source': '@geo-maps/earth-lands-100m 0.6.0 (OpenStreetMap contributors, ODbL 1.0)'}, open(dst, 'w'))
print(len(out), 'polygons', L)
for i in sorted(range(len(out)), key=lambda i: -out[i]['area'])[:12]: print(i, out[i]['area']/1e6, 'km2', len(out[i]['outer']))
