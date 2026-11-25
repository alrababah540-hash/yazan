"""Hudayriyat: named places (POIs), land-use (golf etc.) and cycleways from Overture Maps 2026-11-18.0 (OSM-derived, ODbL). Streams batches (low memory)."""
import json, pyarrow.dataset as ds, pyarrow.compute as pc, s3fs, shapely
REL = '2026-11-18.0'; X0, Y0, X1, Y1 = 54.30, 24.30, 54.48, 24.46
fs = s3fs.S3FileSystem(anon=True, client_kwargs={'region_name': 'us-west-2'})
bb = (pc.field('bbox', 'xmin') < X1) & (pc.field('bbox', 'xmax') > X0) & (pc.field('bbox', 'ymin') < Y1) & (pc.field('bbox', 'ymax') > Y0)
out = {'places': [], 'landuse': [], 'cycleways': []}
d = ds.dataset(f'overturemaps-us-west-2/release/{REL}/theme=places/type=place', filesystem=fs, format='parquet')
for b in d.to_batches(filter=bb, columns=['names', 'basic_category', 'geometry', 'confidence'], batch_size=20000):
    for nm, cat, g, cf in zip(b.column('names').to_pylist(), b.column('basic_category').to_pylist(), b.column('geometry').to_pylist(), b.column('confidence').to_pylist()):
        p = shapely.from_wkb(g); out['places'].append({'name': (nm or {}).get('primary'), 'cat': cat, 'lon': round(p.x, 6), 'lat': round(p.y, 6), 'conf': round(cf or 0, 2)})
print('places', len(out['places']), flush=True)
d = ds.dataset(f'overturemaps-us-west-2/release/{REL}/theme=base/type=land_use', filesystem=fs, format='parquet')
for b in d.to_batches(filter=bb, columns=['names', 'class', 'subtype', 'geometry'], batch_size=20000):
    for nm, cl, st, g in zip(b.column('names').to_pylist(), b.column('class').to_pylist(), b.column('subtype').to_pylist(), b.column('geometry').to_pylist()):
        p = shapely.from_wkb(g); c = p.representative_point()
        out['landuse'].append({'name': (nm or {}).get('primary') if nm else None, 'class': cl, 'subtype': st, 'lon': round(c.x, 6), 'lat': round(c.y, 6), 'area_m2': round(p.area * 1.11e10 * 0.91), 'wkt': p.simplify(0.00003).wkt if cl in ('golf_course', 'marina', 'beach_resort', 'park', 'stadium', 'sports_centre', 'pitch') else None})
print('landuse', len(out['landuse']), flush=True)
d = ds.dataset(f'overturemaps-us-west-2/release/{REL}/theme=transportation/type=segment', filesystem=fs, format='parquet')
for b in d.to_batches(filter=bb & (pc.field('class') == 'cycleway'), columns=['class', 'names', 'geometry'], batch_size=20000):
    for nm, g in zip(b.column('names').to_pylist(), b.column('geometry').to_pylist()):
        out['cycleways'].append({'name': (nm or {}).get('primary') if nm else None, 'coords': [[round(x, 6), round(y, 6)] for x, y in shapely.from_wkb(g).coords]})
print('cycleways', len(out['cycleways']), flush=True)
json.dump(out, open('geo_raw/hud_places.json', 'w'))
