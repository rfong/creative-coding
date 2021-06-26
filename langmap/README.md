# langmap (WIP)
The idea is that you can click on IPA glyphs and the map shows you where those phonemes are commonly spoken in the world.

Work in progress, need to double check the map projection math and also figure 
out a better way to display more phonemes.

### Task breakdown
**Mechanics with dummy data**
- [x] get the shader to change color at a specified ASCII "pixel"
- [x] change color at a collection of specified ASCII "pixels"
- [x] hardcoded button as test to change coordinates on map

**Geolocation<>phoneme data**
- [x] geolocation data for the languages in phoible
- [x] lat/lng mapping to coordinates on the map representation
- [x] click phoneme buttons to display calculated coordinates

**Interface improvements**
- [ ] actual clickable IPA chart

## Build notes
This folder uses `npm` for packages and `snowpack` for ES6-compatible serving &
bundling.
- `_src/` is the source code directory. Run setup/build commands from there. See `_src/README.md` for instructions. The `_` prefix ensures that Jekyll will not serve it to Github Pages.
- `dist/` is the bundled distribution that will be served on deploy.
- `index.html` simply redirects to `dist/index.html`. There's probably a prettier way to conceal the build structure but I'm lazy.

### TODO
I now have two `snowpack`-built subdirectories in this repo -- consider 
consolidating the build processes for simplicity.

## Data
- IPA <> language data: [Phoible](https://phoible.github.io/)
- language <> location data: [Glottolog 4.4](https://github.com/glottolog/glottolog/releases/tag/v4.4)

## Shader abstractions
I [drafted the shader](https://rfong.github.io/creative-coding/skymap) using [xemantic/shader-web-background](https://xemantic.github.io/shader-web-background/) as a GLSL abstraction, but experienced difficulties type-converting uniform arrays-of-vectors, and switched to [`glslCanvas`](https://github.com/patriciogonzalezvivo/glslCanvas/) as a result.
