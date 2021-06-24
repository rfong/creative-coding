import json

with open('common_glottocodes.txt', 'r') as f:
  glottocodes = [line.strip() for line in f.readlines()]

with open('glottolog_latlng.json', 'r') as f:
  data = json.loads(f.read())

print('Glottolog: %d keys' % len(data.keys()))
print('Common glottocodes: %d' % len(glottocodes))

data = {k:v for k,v in data.items() if k in glottocodes}
print('Filtered glottolog down to %d keys' % len(data.keys()))

with open('glottolog_latlng_filtered.json', 'w') as f:
  f.write(json.dumps(data))
