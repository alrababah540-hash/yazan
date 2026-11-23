"""Fetch country + region (emirate) boundaries from Overture Maps divisions (division_area, ODbL/OSM-derived)."""
import sys, json, pyarrow.dataset as ds, pyarrow.compute as pc, s3fs, shapely
REL = sys.argv[1]; OUT = sys.argv[2]
X0, Y0, X1, Y1 = 48.0, 21.0, 60.0, 28.5
fs = s3fs.S3FileSystem(anon=True, client_kwargs={'region_name': 'us-west-2'})
d = ds.dataset(f'overturemaps-us-west-2/release/{REL}/theme=divisions/type=division_area', filesystem=fs, format='parquet')
f = (pc.field('bbox', 'xmin') < X1) & (pc.field('bbox', 'xmax') > X0) & (pc.field('bbox', 'ymin') < Y1) & (pc.field('bbox', 'ymax') > Y0) & (pc.field('subtype').isin(['country', 'region']))
t = d.to_table(filter=f, columns=['id', 'subtype', 'class', 'country', 'region', 'names', 'geometry', 'is_land'])
print('rows', t.num_rows)
feats = []
for g, sub, cl, co, rg, nm, il in zip(shapely.from_wkb(t.column('geometry').to_pylist()), *[t.column(c).to_pylist() for c in ['subtype', 'class', 'country', 'region', 'names', 'is_land']]):
    feats.append({'type': 'Feature', 'properties': {'subtype': sub, 'class': cl, 'country': co, 'region': rg, 'is_land': il, 'name': (nm or {}).get('primary'), 'name_en': dict((nm or {}).get('common') or []).get('en') if nm else None}, 'geometry': shapely.geometry.mapping(g)})
    print(sub, cl, co, rg, il, feats[-1]['properties']['name'], feats[-1]['properties']['name_en'])
json.dump({'type': 'FeatureCollection', 'features': feats}, open(OUT, 'w'))
