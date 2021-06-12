document.addEventListener("DOMContentLoaded", function() {

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
    _.each($('#ascii-render').html().split('\n'), function(row) {
      $('#skymap').append('<pre class="row">' + row + '</pre>');
    });
    $('#ascii-render').html("");
		setupShader();
  }

}); // end document ready

function setupShader() {
  shaderWebBackground.shade({
    shaders: {
      bg: {
        uniforms: {
          iResolution: (gl, loc, ctx) => gl.uniform2f(loc, ctx.width, ctx.height),
          iTime: (gl, loc) => gl.uniform1f(loc, performance.now() / 1000),
        },
      },
    },
    canvas: document.getElementById("skymap-canvas"),
  });
}
