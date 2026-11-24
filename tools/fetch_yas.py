"""Yas Island data from Overture Maps 2026-11-18.0: places (POIs) + all buildings in the Yas bbox (ODbL / open sources)."""
import json, sys, pyarrow.dataset as ds, pyarrow.compute as pc, s3fs, shapely
REL = '2026-11-18.0'; X0, Y0, X1, Y1 = 54.55, 24.42, 54.67, 24.53
fs = s3fs.S3FileSystem(anon=True, client_kwargs={'region_name': 'us-west-2'})
bb = lambda: (pc.field('bbox', 'xmin') < X1) & (pc.field('bbox', 'xmax') > X0) & (pc.field('bbox', 'ymin') < Y1) & (pc.field('bbox', 'ymax') > Y0)
p = ds.dataset(f'overturemaps-us-west-2/release/{REL}/theme=places/type=place', filesystem=fs, format='parquet').to_table(filter=bb(), columns=['names', 'categories', 'geometry', 'confidence'])
places = []
for nm, cat, g, cf in zip(p.column('names').to_pylist(), p.column('categories').to_pylist(), shapely.from_wkb(p.column('geometry').to_pylist()), p.column('confidence').to_pylist()):
    places.append({'name': (nm or {}).get('primary'), 'cat': (cat or {}).get('primary'), 'lon': round(g.x, 6), 'lat': round(g.y, 6), 'conf': round(cf or 0, 2)})
json.dump(places, open('geo_raw/yas_places.json', 'w')); print('places', len(places))
b = ds.dataset(f'overturemaps-us-west-2/release/{REL}/theme=buildings/type=building', filesystem=fs, format='parquet').to_table(filter=bb(), columns=['geometry', 'height', 'num_floors', 'names'])
out = []
for g, h, nf, nm in zip(shapely.from_wkb(b.column('geometry').to_pylist()), b.column('height').to_pylist(), b.column('num_floors').to_pylist(), b.column('names').to_pylist()):
    g = g if g.geom_type == 'Polygon' else max(g.geoms, key=lambda x: x.area)
    out.append({'h': h, 'nf': nf, 'name': (nm or {}).get('primary'), 'c': [[round(x, 6), round(y, 6)] for x, y in g.exterior.coords]})
json.dump(out, open('geo_raw/yas_buildings.json', 'w')); print('buildings', len(out), 'with height', sum(1 for o in out if o['h']))
