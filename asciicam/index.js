document.addEventListener("DOMContentLoaded", function() {
/*
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
*/
});


let capture;

function setup() {
  createCanvas(390, 240).parent('p5-canvas');
  capture = createCapture(VIDEO);
  capture.size(320, 240);
  //capture.hide();
}

function draw() {
  background(255);
  image(capture, 0, 0, 320, 240);
  filter(THRESHOLD, 0.35);
}
