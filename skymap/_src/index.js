document.addEventListener("DOMContentLoaded", function() {

var app = angular.module('SkymapApp', []);

app.controller('SkymapCtrl', function($scope, $http) {

  $scope.skymapData = [];

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
		// Extract ASCII from the aalib render and put it into angular scope.
    $scope.skymapData = $('#ascii-render').html().split("\n");
    $scope.$apply();
    $('#ascii-render').html("");
		setupShader();
  }

}); // end SkymapCtrl

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
