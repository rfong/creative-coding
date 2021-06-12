# skymap source code
-----

## Setup
```
brew install graphicsmagick
npm install
```

## Development
I'm using `snowpack` for ES6 compatibility and bundling. Sadly, it is only 
strictly necessary for the first draft.
```
npm run start
```

### Troubleshooting
- Snowpack failing to clear cache? Try `npx snowpack dev --reload`

## Bundling
Until I get a resolution to [issue#3441](https://github.com/snowpackjs/snowpack/issues/3441), I'm using an extremely janky bash approach. Use this script instead of the `npm` command.
```
./build.sh
```

## Resources
- [Snowpack quickstart](https://www.snowpack.dev/tutorials/getting-started)
- [Getting started with WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Getting_started_with_WebGL)
- [A collection of WebGL and WebGPU frameworks and libraries](https://gist.github.com/dmnsgn/76878ba6903cf15789b712464875cfdc)
- [Q: How to load shaders from external file? (A: AJAX)](https://github.com/mrdoob/three.js/issues/283)
