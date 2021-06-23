# skymap

This folder uses `npm` for packages and `snowpack` for ES6-compatible serving &
bundling.
- `_src/` is the source code directory. Run setup/build commands from there. The `_` prefix ensures that Jekyll will not serve it to Github Pages.
- `dist/` is the bundled distribution that will be served on deploy.
- `index.html` simply redirects to `dist/index.html`. There's probably a prettier way to conceal the build structure but I'm lazy.
