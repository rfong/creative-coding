Quick data transformation to get relevant geolocational language data by joining [Glottolog 4.4](https://github.com/glottolog/glottolog/releases/tag/v4.4) and [Phoible 2.0](https://github.com/phoible/dev/releases/tag/v2.0).

Note that you can also access Glottolog via the pip package [`pyglottolog`](https://github.com/glottolog/pyglottolog), which I didn't notice until later.

## Extract lat/lng from Glottolog

The [Glottolog database](https://github.com/glottolog/glottolog/releases/) is structured as a filesystem tree.

1. Grepped relevant info from root of Glottolog directory.
```
grep -r "longitude =\|latitude =\|iso639-3 =\|level =" . | sort > glottolog_latlng.txt
```

2. Extract and restructure the grep results to a JSON file, `glottolog_latlng.json`.
```
python3 glottolog.py
```

## Filter down to languages represented in Phoible

The Phoible database is structured as a CSV file, where each row uniquely 
represents a pairing of a phoneme and a dialect in which it appears.

For purposes of geolocating phonemes, we can only make use of the intersection 
of languages in both Phoible and Glottolog.

1. Get the list of all glottocodes in Phoible.
```
cat phoible.csv | cut -d',' -f2 | tail -n +2 | uniq | cut -d'"' -f2 > phoible_glottocodes.txt
```

2. Get the list of all glottocodes in Glottolog.
```
cat glottolog_latlng.json | jq 'keys' | tail -n +2 | sed \$d | tr -d '",[] '
```

3. Get the intersection.
```
comm -12 <(sort glottolog_glottocodes.txt) <(sort phoible_glottocodes.txt) > common_glottocodes.txt
```

4. Filter out entries in our Glottolog JSON representation where the key glottocode is not a member of Phoible. 
```
python3 filter_glottos.py
```
Output of this is `glottolog_latlng_filtered.json`.

## Representational questions

1. Does Phoible have a bijection between `'GlyphID'` and `'Phoneme'`?
```
> cat phoible.csv | cut -d',' -f6 | sort -u | wc -l
  3145
> cat phoible.csv | cut -d',' -f7 | sort -u | wc -l
  3445
```
Unfortunately, no. It's not exactly clear to me why this difference exists, 
but I'll use the `'Phoneme'` field as the unique representation.

## Map phonemes to lat/lng

```
python3 map_phonemes.py
```
Output of this is `phoneme_latlng.json`.

## Compressed data representation for web use

The above file is 3.87MB, which is a bit big. In addition, latitude and 
longitude data is stored at an unnecessary degree of precision for the
low-resolution map (that is, unless I want to implement zoom in the future).
