document.addEventListener("DOMContentLoaded", function() {

  let asciiData = [];
	const fetchShaderPromise = new Promise((resolve, reject) => {
		$.get('langmap.frag', function(fragShader) {
			resolve(fragShader);
		});
	});

	fetchShaderPromise
		.then((fragShader) => console.log("fetched:", fragShader));

  // Force canvas dimensions. It's spontaneously resizing in prod for reasons
  // I cannot fathom
  $('#skymap-canvas').width = 1101;
  $('#skymap-canvas').height = 810;

  // `aalib` doesn't have a prebuilt way to render the ASCII it generates to an
  // in-memory string, so we're going to render it invisibly, extract the
  // HTML, then operate upon it as data.
  let img = aalib.read.image.fromURL("./mercator_wrap_transparent.png")
    .map(aalib.aa({width: 153, height: 90}))  // Dimensions in terms of chars
    .map(aalib.filter.inverse())
  img.map(aalib.render.html({
    el: document.getElementById("ascii-render"),
    color: '#fff',
    charset: aalib.charset.SIMPLE_CHARSET,
  }))
  .subscribe(postRender);

  // This runs after the aalib renderer is done.
  function postRender() {
    // Extract ASCII from the aalib render and reformat it
    asciiData = $('#ascii-render').html().split('\n');
    _.each(asciiData, function(row) {
      $('#skymap').append('<pre class="ascii-row">' + row + '</pre>');
    });
    $('#ascii-render').html("");
		setupShader();
	}

	function setupShader() {
		$.get('langmap.frag', function(fragShader) {
			var canvas = $('#skymap-canvas')[0];
			// Set up GLSL and load the fragment shader
			var sandbox = new GlslCanvas(canvas);
			sandbox.load(fragShader);

			// Set up uniforms.
			// GLSL canvas type conversion doesn't support integers, so all ints will
			// become floats in GLSL.

			// uniform vec2 u_coordDimensions
			//   dimensions of an ASCII "pixel"
			sandbox.setUniform(
				"u_coordDimensions",
				canvas.width * 1.0 / asciiData[0].length,
				canvas.height * 1.0 / asciiData.length,
			);

			// uniform vec3 u_highlightRGB
			//   RGB value of a highlighted ASCII "pixel"
			sandbox.setUniform("u_highlightRGB", 1.0, 0.0, 0.0);

			// uniform vec2 u_highlightCoords (implicit ints)
			//   ASCII coordinates to highlight.
			var coords = [[44, 56], [40, 56], [33, 54]];
			var args = ["u_highlightCoords"].concat(coords);
			sandbox.setUniform.apply(sandbox, args);

			// uniform float u_numHighlightCoordsRaw (implicit ints)
			//   We cannot index into a non-constant length array in GLSL, so 
			//   u_highlightCoords is intentionally overallocated. We pass the
			//   contextual length so we'll know when to stop consuming coords.
			sandbox.setUniform("u_numHighlightCoordsRaw", coords.length);
		});
  }

}); // end document ready
