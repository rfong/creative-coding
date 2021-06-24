# langmap
Idea: you can click on IPA glyphs and the map shows you where those phonemes are commonly spoken in the world.

Current state: An ASCII world map combined with a shader that allows ASCII "coordinates" to be highlighted. Uses [`patriciogonzalezvivo/glslCanvas`](https://github.com/patriciogonzalezvivo/glslCanvas/).

### Task breakdown
- [x] get the shader to change color at a specified ASCII "pixel"
- [x] change color at a collection of specified ASCII "pixels"
- [x] hardcoded button as test to change coordinates on map

- [ ] actual clickable IPA chart
- [ ] geolocation data for the languages in phoible
- [ ] lat/lng mapping to coordinates on the map representation

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
