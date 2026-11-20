"""Fetch current OSM-derived land polygons for Abu Dhabi from the Overture Maps open
dataset (theme=base/type=land, ODbL). Reads only row groups whose bbox intersects the AOI."""
import sys, json, pyarrow.dataset as ds, pyarrow.compute as pc, s3fs
REL = sys.argv[1] if len(sys.argv) > 1 else '2026-11-18.0'
TYPE = sys.argv[2] if len(sys.argv) > 2 else 'land'
OUT = sys.argv[3]
X0, Y0, X1, Y1 = 54.25, 24.33, 54.72, 24.64
fs = s3fs.S3FileSystem(anon=True, client_kwargs={'region_name': 'us-west-2'})
d = ds.dataset(f'overturemaps-us-west-2/release/{REL}/theme=base/type={TYPE}', filesystem=fs, format='parquet')
f = (pc.field('bbox', 'xmin') < X1) & (pc.field('bbox', 'xmax') > X0) & (pc.field('bbox', 'ymin') < Y1) & (pc.field('bbox', 'ymax') > Y0)
t = d.to_table(filter=f, columns=['id', 'subtype', 'class', 'names', 'geometry', 'bbox'])
print(TYPE, 'rows', t.num_rows)
import shapely
geoms = shapely.from_wkb(t.column('geometry').to_pylist())
feats = []
for g, sub, cl, nm in zip(geoms, t.column('subtype').to_pylist(), t.column('class').to_pylist(), t.column('names').to_pylist()):
    feats.append({'type': 'Feature', 'properties': {'subtype': sub, 'class': cl, 'name': (nm or {}).get('primary') if nm else None}, 'geometry': shapely.geometry.mapping(g)})
json.dump({'type': 'FeatureCollection', 'features': feats}, open(OUT, 'w'))
from collections import Counter; print(Counter((p['properties']['subtype'], p['properties']['class']) for p in feats).most_common(12))
