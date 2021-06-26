var langmap = {};  // namespace

document.addEventListener("DOMContentLoaded", function() {

  //const MAP_URL='mercator.ascii', MAP_URL_IS_IMAGE=false, CANVAS_WIDTH=1101, CANVAS_HEIGHT=810, ASCII_WIDTH=153, ASCII_HEIGHT=90;
  const MAP_URL='mercator_wrap.ascii', MAP_URL_IS_IMAGE=false, CANVAS_WIDTH=864, CANVAS_HEIGHT=810, ASCII_WIDTH=120, ASCII_HEIGHT=90;

  // Force canvas dimensions. This should probably be calculated dynamically
  // but I'm doing it manually out of laziness.
  _.each({
    "width": CANVAS_WIDTH,
    "max-width": CANVAS_WIDTH,
    "height": CANVAS_HEIGHT,
    "max-height": CANVAS_HEIGHT,
  }, (val, attr) => $('#skymap-canvas').css(attr, val));

  var glslCanvas;

  // Promise to fetch fragment shader text.
  const fetchShaderPromise = new Promise((resolve, reject) => {
    $.get('langmap.frag', function(fragShader) {
      resolve(fragShader);
    });
  });

  // Set up the shader fragment.
  const glslPromise = fetchShaderPromise.then(
    (fragShader) => setupShader(fragShader));
    // chained promise returns GlslCanvas instance

  const geoDataPromise = new Promise((resolve, reject) => {
    // dummy data
    resolve({
      0: {phoneme: "a", coords: [[44, 56], [40, 56], [33, 54]]},
      1: {phoneme: "b", coords: [[74, 56], [70, 56], [73, 54]]},
    });
  });

  // Set up clickable controls
  geoDataPromise.then(function(data) {
    _.each(data, function(x, id) {
      $('#controls').append(
        '<button data-id="' + id + '" ' +
        'onclick="langmap.showPhoneme(' + id + ')">' + 
        x.phoneme + '</button>'
      );
    })
  });

  // Promise to fetch ASCII representation of map.
  const asciiPromise = getAsciiPromise(MAP_URL, MAP_URL_IS_IMAGE);
  asciiPromise.then(setupAscii);

  // Return a promise to provide the ASCII data representation of the map.
  // `url` can point to an image to be transformed to ASCII, or to a cached
  // ASCII representation of an image.
  function getAsciiPromise(url, isImage) {
    // If provided with an image, regenerate the ASCII data using aalib.
    if (isImage === true) {
      return new Promise((resolve, reject) => {
        // `aalib` doesn't have a prebuilt way to render the ASCII it generates 
        // to an in-memory string, so we're going to render it invisibly, 
        // extract the HTML, then operate upon it as data.
        let img = aalib.read.image.fromURL(url)
          .map(aalib.aa({width: ASCII_WIDTH, height: ASCII_HEIGHT}))
          .map(aalib.filter.inverse())
        img.map(aalib.render.html({
          el: document.getElementById("ascii-render"),
          color: '#fff',
          charset: aalib.charset.SIMPLE_CHARSET,
        }))
        .subscribe(() => resolve(
          // extract the data from the aalib render div and run resolve fn
          $('#ascii-render').html().split('\n')
        ));
      });
    }
    // Otherwise, assume the file at `url` contains ASCII data to display
    return new Promise((resolve, reject) => {
      $.get(url, function(ascii) {
        resolve(ascii.trim().split('\n'));
      });
    });
  }

  // Display ASCII and set up dependent GLSL uniforms
  function setupAscii(asciiData) {
    _.each(asciiData, function(row) {
      $('#skymap').append('<pre class="ascii-row">' + row + '</pre>');
    });
    $('#ascii-render').html("");

    // Set GLSL uniforms that are dependent on ASCII data.
    glslPromise.then(function(canvas) {
      var canvasEl = $('#skymap-canvas')[0];
      // uniform vec2 u_coordDimensions
      //   dimensions of an ASCII "pixel"
      canvas.setUniform(
        "u_coordDimensions",
        canvasEl.width * 1.0 / asciiData[0].length,
        canvasEl.height * 1.0 / asciiData.length,
      );
    });
  }

  // Set up shader and return GlslCanvas object
  function setupShader(fragShader) {
    // Set up GLSL and load the fragment shader
    glslCanvas = new GlslCanvas($('#skymap-canvas')[0]);
    glslCanvas.load(fragShader);

    // Set up uniforms.
    // GLSL canvas type conversion doesn't support integers, so all ints will
    // become floats in GLSL.

    // uniform vec3 u_highlightRGB
    //   RGB value of a highlighted ASCII "pixel"
    glslCanvas.setUniform("u_highlightRGB", 1.0, 0.0, 0.0);

    return glslCanvas;
  }

  // Set highlighted coordinates on GLSL canvas.
  function setHighlightCoords(coords, canvas) {
    if (canvas == undefined) { canvas = glslCanvas; }
    // uniform vec2 u_highlightCoords (implicit ints)
    //   ASCII coordinates to highlight.
    var args = ["u_highlightCoords"].concat(coords);
    canvas.setUniform.apply(canvas, args);

    // uniform float u_numHighlightCoordsRaw (implicit ints)
    //   We cannot index into a non-constant length array in GLSL, so 
    //   u_highlightCoords is intentionally overallocated. We pass the
    //   contextual length so we'll know when to stop consuming coords.
    canvas.setUniform("u_numHighlightCoordsRaw", coords.length);
  }

  langmap.showPhoneme = function(phonemeId) {
    if (phonemeId == null) {
      setHighlightCoords([]);
    } else {
      geoDataPromise.then(
        (data) => setHighlightCoords(data[phonemeId].coords));
    }
  }

}); // end document ready
