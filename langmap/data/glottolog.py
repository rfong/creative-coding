# Extract needed glottocode & lat-long information from 'glottolog-latlng.txt' 
# and dump it to JSON.

import json
import re

# This file is a grep log acquired using
#   `grep -r "longitude =\|latitude =\|iso639-3 =\|level =" . | sort`
#   over the glottocode database, which is structured as a filesystem tree.
with open('glottolog_latlng.txt', 'r') as f:
  # Clean out unneeded information
  prefix = './languoids/tree/'
  lines = [
    (line[len(prefix):] if line.startswith(prefix) else line)\
        .replace('/md.ini', '').strip()
    for line in f.readlines()]

# Extract needed information
data = {}  # glottocode : {latitude,longitude,level}
for line in lines:
  m = re.search('(.+):(.+) = (.+)', line)
  if m is not None:
      data[m.group(1)] = data.get(m.group(1), {})
      data[m.group(1)][m.group(2)] = m.group(3)

# Keys are currently paths in a tree; split them so that the current-level
# glottocode is the key and the rest are stored in the dict as ancestors,
# in descending order of depth.
data = {
  # key = last glottocode
  k.split('/')[-1]: \
    # merge ancestors into existing dict
    dict(ancestors=list(reversed(k.split('/')[:-1])), **d)
  for k, d in data.items()
}

# Write to JSON
with open('glottolog_latlng.json', 'w') as f:
  f.write(json.dumps(data))
