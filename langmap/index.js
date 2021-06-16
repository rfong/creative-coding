document.addEventListener("DOMContentLoaded", function() {

	let asciiData = [];

	// Force canvas dimensions. It's spontaneously resizing in prod for reasons
	// I cannot fathom
	$('#skymap-canvas').width = 1101;
	$('#skymap-canvas').height = 810;

  // `aalib` doesn't have a prebuilt way to internally render the ASCII it
  // generates to a string, so we're going to render it invisibly, extract the
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
    shaderWebBackground.shade({
      shaders: {
        bg: {
          uniforms: {
					  // Canvas resolution
            iResolution: (gl, loc, ctx) => gl.uniform2f(loc, ctx.width, ctx.height),
						// Current time (millis)
            iTime: (gl, loc) => gl.uniform1f(loc, performance.now() / 1000),
						// Dimensions of an ASCII "pixel"
  					coordDimensions: (gl, loc, ctx) => gl.uniform2f(loc,
							ctx.width * 1.0 / asciiData[0].length,
							ctx.height * 1.0 / asciiData.length
						),
						// Which coord we want highlighted
  					highlightCoord: (gl, loc) => gl.uniform2f(loc, 44, 56),
						// RGB value of the highlight color
  					highlightRGB: (gl, loc) => gl.uniform3f(loc, 1.0, 0.0, 0.0),
          },
        },
      },
      canvas: document.getElementById("skymap-canvas"),
    });
  }

}); // end document ready
