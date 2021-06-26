See [data/README.md](data/README.md) for prior work.

## Preprocessing logic

`langmap/data/phoneme_latlng.json` contains the relevant results from the 
Phoible-Glottolog join -- a mapping from phonemes to lists of lat/lng pairs.

This file is 3.87MB, which is large for web use. In addition, latitude and 
longitude data are stored at an unnecessary degree of precision for the
low-resolution map (that is, unless I want to implement zoom in the future).

The difference in resolution between lat/lngs and this map representation 
means I can achieve significant data compression and computational time 
savings by preprocessing the mapping from lat/lngs to ASCII "pixels". In 
addition, the significantly smaller size of the ASCII "pixel" space means that 
fewer coordinates will probably need to be stored.

## Initial choice of projection

I wanted to use a 2D map projection for simplicity. 3D would be a neat next 
step, but I'd have to learn a fair bit more about shaders to make it happen.

I started with a Mercator projection for familiarity. However, the major 
downside of the Mercator projection is that it severely exaggerates the size 
of areas that are far from the equator, and therefore reduces the perceived 
importance/size of countries closer to the equator. 
See [this animated visualization](https://en.wikipedia.org/wiki/Mercator_projection#/media/File:Worlds_animate.gif).

## Generate a compressed data representation for web use

We now need a script that takes in the phoneme-to-latlng file, the map 
granularity, and the leftmost longitude in the map image, and outputs a 
mapping of phonemes to map "pixels".

It's a huge PITA to make browser-side JS interface with the filesystem, so 
let's just do this in Python, even though it'll be extra steps if the map 
dimensions change.

Leftmost tip of the current map is the western tip of Alaska, let's say Wales,
with longitude=`-168.1098805`.

```
python preprocess.py
```

### Compression stats

Compressing from lat/lng to integer coordinates yields a 1.1MB file. 

Deduplicating map coordinates takes us down to 514KB.

### Does it even matter though

With the full dataset, we have thousands of phonemes loaded on the page, which 
is an information overload for anyone who isn't a linguist.

To increase interface legibility, let's just filter the dataset down to the 75 
pulmonic consonants in [Wikipedia's IPA table](https://en.wikipedia.org/wiki/International_Phonetic_Alphabet) for now.

The set of phonemes upon which to filter the final dataset is stored in `phoneme_filter.json`.
