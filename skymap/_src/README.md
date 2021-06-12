# skymap source code
-----

## Setup
```
brew install graphicsmagick
npm install
```

## Development
```
npm run start
```

### Troubleshooting
- Snowpack failing to clear cache? Try `npx snowpack dev --reload`

## Bundling
Until I get a resolution to [issue#3441](https://github.com/snowpackjs/snowpack/issues/3441), I'm using an extremely janky bash approach.
```
./build.sh
```

## Resources
- [Snowpack quickstart](https://www.snowpack.dev/tutorials/getting-started)
- [Getting started with WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Getting_started_with_WebGL)
- [A collection of WebGL and WebGPU frameworks and libraries](https://gist.github.com/dmnsgn/76878ba6903cf15789b712464875cfdc)
- [Q: How to load shaders from external file? (A: AJAX)](https://github.com/mrdoob/three.js/issues/283)
