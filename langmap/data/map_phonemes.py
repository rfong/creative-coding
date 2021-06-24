# Map phonemes to lat/lngs

import csv
import json

def append_if_list_in_dict(d, key, val):
  d[key] = d.get(key, []) + [val]

# From Phoible, map phonemes to associated glottocodes
with open('phoible.csv', 'r') as f:
  reader = csv.DictReader(f)
  phonemes_to_glottos = {}
  for row in reader:
    append_if_list_in_dict(phonemes_to_glottos, row['Phoneme'], row['Glottocode'])
phoneme_data = {
  ph: {"glottos": glottos} for ph, glottos in phonemes_to_glottos.items() }

# Join on the lat/lng data extracted from Glottolog to get a mapping
# phoneme -> langs -> lat/lngs
with open('glottolog_latlng_filtered.json', 'r') as f:
  geo_data = json.loads(f.read())

# For compactness, we will omit the "lat","lng" keys and just store tuples.
# Forgot to filter down to just level=language entries, which have lat/lng.
# level=dialect entries do not include that information.
for ph, d in phoneme_data.items():
  phoneme_data[ph]["latlngs"] = [
    (geo_data[glotto]["latitude"], geo_data[glotto]["longitude"])
    for glotto in d["glottos"]
    if "latitude" in geo_data.get(glotto, {})  # entries with geo info
  ]

# Write to JSON
with open('phoneme_latlng.json', 'w') as f:
  f.write(json.dumps(phoneme_data))
  print("Wrote phoneme data to phoneme_latlng.json")
