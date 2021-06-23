var langmap = {};  // namespace

document.addEventListener("DOMContentLoaded", function() {

  // Force canvas dimensions. It's spontaneously resizing in prod for reasons
  // I cannot fathom
  $('#skymap-canvas').width = 1101;
  $('#skymap-canvas').height = 810;
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

  // Promise to fetch ASCII representation of map.
  const fetchAsciiPromise = new Promise((resolve, reject) => {
    $.get('mercator.ascii', function(ascii) {
      var data = ascii.trim().split('\n');
      setupAscii(data);
      return data; // chained promise returns ascii data
    });
  });

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

    // Set currently highlighted coordinates.    
    setHighlightCoords([[44, 56], [40, 56], [33, 54]], glslCanvas);

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
    if (phonemeId==1) {
      setHighlightCoords([[44, 56], [40, 56], [33, 54]]);
    } else {
      setHighlightCoords([[74, 56], [70, 56], [73, 54]]);
    }
  }

}); // end document ready
