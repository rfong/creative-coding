var langmap = {};  // namespace

document.addEventListener("DOMContentLoaded", function() {

	const MAP_URL='mercator.ascii', MAP_URL_IS_IMAGE=false, CANVAS_WIDTH=1101, CANVAS_HEIGHT=810, ASCII_WIDTH=153, ASCII_HEIGHT=90;

  // Force canvas dimensions. It's spontaneously resizing in prod for reasons
  // I cannot fathom
  $('#skymap-canvas').width = CANVAS_WIDTH;
  $('#skymap-canvas').height = CANVAS_HEIGHT;
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
  //const asciiPromise = getAsciiPromise('mercator.ascii');
  const asciiPromise = getAsciiPromise('mercator.png', true);
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
          .map(aalib.aa({width: 153, height: 90}))  // Dimensions in chars
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
