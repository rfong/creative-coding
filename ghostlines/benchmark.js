document.addEventListener("DOMContentLoaded", function() {

  const imageHeight = 600,
        imageWidth = 800;

  _.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,
    evaluate: /\{\%(.+?)\%\}/g,
    escape: /\{\{-(.+?)\}\}/g,
  };

  // generate random RGBA image data for testing, in the form of a 1D uint8
  // array of length w * h * 4: [r, g, b, a, r, g, b, a, ...]
  function generateRGBImage(w, h) {
    return new Uint8Array(_.flatten(_.map(_.range(h), () => 
      // each row
      _.flatten(_.map(_.range(w), () => 
        // For each pixel, give random RGB values with an alpha set to max.
        _.map(_.range(3), () => _.random(0,255)).concat(255)
      ))
    )));
  }

  // Run an image handling function nTimes and report on it.
  // imageHandler must accept a 1D array of image data which will be randomly
  // regenerated each time to circumvent caching.
  function profileImageHandler(imageHandler, nTimes, benchmarkName) {
    var times = [];
    for (var i in _.range(nTimes)) {
      var data = generateRGBImage(imageHeight, imageWidth);
      var now = performance.now();
      imageHandler(data);
      times.push(performance.now() - now);
    }
    console.log(_.template(
      'ran {{s}}{{n}} times\n' +
      'avg: {{avg}} ms\n' + 
      'max: {{max}} ms\n' +
      'min: {{min}} ms',
    )({
      s: benchmarkName ? '"'+benchmarkName+'" ' : '',
      n: nTimes,
      avg: (_.sum(times) / nTimes).toFixed(2),
      max: _.max(times).toFixed(2),
      min: _.min(times).toFixed(2),
    }));
    console.log(times);
  }
  
  // init Pyodide
  async function main(){
    await loadPyodide({ indexURL : 'https://cdn.jsdelivr.net/pyodide/v0.17.0/full/' });
    await preloadPython('main.py');

    // profiling time! let's run a bunch of benchmarks.
    console.log("profiling time!");

    // This sets image data as a pyodide global.
    async function bmSetPyGlobal(data) {
      await pyodide.globals.set("imdata", data);
    }
    //profileImageHandler(bmSetPyGlobal, 10, "set pyodide globals");

    // This strips RGB to greyscale in JS *before* passing into pyodide.
    async function bmStripRgbInJs(data) {
      await pyodide.globals.set("imdata",
        // for each RGBA pixel:
        _.map(_.chunk(data, 4), (p) =>
          // the greyscale value is the max of the RGB values;
          // assume we can ignore alpha here
          _.min(p.slice(0,3))
        )
      );
    }
    profileImageHandler(bmStripRgbInJs, 10, "strip RGB in JS then pass to Py");

    // This passes RGB to pyodide and lets pyodide strip RGB to greyscale.
    async function bmStripRgbInPy(data) {
      await pyodide.globals.set("imdata", data);
      await pyodide.runPython("print(type(imdata.to_py()))")
      await pyodide.runPython(
        _.template("Image(imdata.to_py(), {{h}}, {{w}}).get_greyscale_mat()")({
          h: imageHeight,
          w: imageWidth,
        })
      );
    }
    profileImageHandler(bmStripRgbInPy, 10, "strip RGB in Py");

  }
  let pyodideReadyPromise = main();
 
  // Preload from a Python file
  async function preloadPython(filename) {
    return new Promise((resolve, reject) => {
      fetch(filename)
      .then((response) => response.text())
      .then(async function(pytext) {
        // Asynchronously run python code
        await pyodide.runPythonAsync(pytext);
        resolve();
      })
      .catch((err) => {
        console.error('Error:', err);
        reject(err);
      });
    });
  }
  
});
