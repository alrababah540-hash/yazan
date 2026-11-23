"""Fetch Overture building footprints with height (theme=buildings, ODbL/OSM+others) for central Abu Dhabi."""
import sys, json, pyarrow.dataset as ds, pyarrow.compute as pc, s3fs, shapely
REL, OUT = sys.argv[1], sys.argv[2]
X0, Y0, X1, Y1 = 54.30, 24.40, 54.66, 24.58
fs = s3fs.S3FileSystem(anon=True, client_kwargs={'region_name': 'us-west-2'})
d = ds.dataset(f'overturemaps-us-west-2/release/{REL}/theme=buildings/type=building', filesystem=fs, format='parquet')
f = (pc.field('bbox', 'xmin') < X1) & (pc.field('bbox', 'xmax') > X0) & (pc.field('bbox', 'ymin') < Y1) & (pc.field('bbox', 'ymax') > Y0)
t = d.to_table(filter=f, columns=['geometry', 'height', 'num_floors'])
print('rows', t.num_rows)
out = []
for g, h, nf in zip(shapely.from_wkb(t.column('geometry').to_pylist()), t.column('height').to_pylist(), t.column('num_floors').to_pylist()):
    H = h if h else (nf * 3.4 if nf else None)
    if not H or H < 12: continue
    g = g if g.geom_type == 'Polygon' else max(g.geoms, key=lambda x: x.area)
    out.append({'h': round(H, 1), 'src': 'height' if h else 'floors', 'c': [[round(x, 6), round(y, 6)] for x, y in g.exterior.coords]})
print('kept', len(out), 'over 100m', sum(o['h'] > 100 for o in out))
json.dump(out, open(OUT, 'w'))
