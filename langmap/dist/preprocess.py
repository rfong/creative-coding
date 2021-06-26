# Compress the phoneme-to-latlng data into phoneme-to-coord data.

# Latitude ranges from 90 at the north pole to -90 at the south pole.
# Longitude ranges from -180 to 180, with 0 at the Greenwich Meridian.
# On the map, (0,0) is the bottom left corner. North and East go up.

import itertools
import json
import math

TAU = 2*math.pi
def to_radians(deg):
  return deg * math.pi / 180

# The following attributes are specific to our choice of map.
# - width/height in indexable map "pixels"
# - leftmost longitude
# - topmost latitude
# - bottommost latitude
# (no rightmost longitude needed; we assume a full wrapping)
# lat/long values provided in degrees rather than radians
MAP_WIDTH = 120
MAP_HEIGHT = 60
START_LONGITUDE = to_radians(-168.1098805)
# dummy values
MAX_LATITUDE = to_radians(67)
MIN_LATITUDE = to_radians(-67)

def crop_lat(lat):
  return max(MIN_LATITUDE,
    min(MAX_LATITUDE, lat))

def lng_to_coords(lng):
  lng = to_radians(lng)
  return (lng + math.pi)/TAU * MAP_WIDTH
def lat_to_coords(lat):
  lat = crop_lat(to_radians(lat))
  #prj = math.log(math.tan(math.pi / 4 + lat / 2)) 
  return (1 - (lat + MAX_LATITUDE) / (MAX_LATITUDE-MIN_LATITUDE)) * MAP_HEIGHT

with open('phoneme_latlng.json', 'r') as f:
  data = json.loads(f.read())

# Let's filter down to a more manageable set of phonemes.
with open('phoneme_filter.json', 'r') as f:
  phonemes = json.loads(f.read())  # dictionary with categories as keys
  all_phonemes = list(itertools.chain(*phonemes.values()))

with open('phoneme_coords.json', 'w') as f:
  coord_data = {
    k: list(set(
        # x = lng, y = lat
        (
          int(round(lng_to_coords(float(lng)))),
          int(round(lat_to_coords(float(lat)))),
        )
        for lat,lng in v
    )) for k, v in data.items()
    if k in all_phonemes
  }
  print("lng range: min=%f, max=%f" % (
    min(min([tup[0] for tup in v]) for v in coord_data.values() if v),
    max(max([tup[0] for tup in v]) for v in coord_data.values() if v),
  ))
  print("lat range: min=%f, max=%f" % (
    min(min([tup[1] for tup in v]) for v in coord_data.values() if v),
    max(max([tup[1] for tup in v]) for v in coord_data.values() if v),
  ))
  f.write(json.dumps(
    coord_data
  ))
