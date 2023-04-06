var app = angular.module('myApp', ['ngSanitize']);

// Change Underscore templating from ERB to Mustache style
_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};

app.controller('myCtrl', function($scope, $http, $sce) {
  $scope.loadJsonInScope = function(jsonUrl, scopeVar, callback) {
    $http({
      method: 'GET',
      url: jsonUrl,
    }).then(function successCallback(response) {
      $scope[scopeVar] = response.data;
      if (callback && _.isFunction(callback)) { callback(); }
    }, function errorCallback(response) {
      console.log("Could not fetch json file:", jsonUrl);
    });
  };

  $scope.loadJsonInScope('index.json', 'sketches', function() {
    $scope.sketches = $scope.sketches.sketches;
    console.log($scope.sketches);
    $scope.sketch0 = $scope.sketches[0];
  });
});

// template directive to render a sketch preview
app.directive('sketchPreview', function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      sketch: '=',
    },
    template: (`
    <div class="sketch-preview">
      <div class="sketch-image" style="background-image: url('{{sketch.url}}/{{sketch.imgUrl}}')"></div>
		  <div class="sketch-info-container">
        <div class="sketch-title"><a href="{{sketch.url}}">{{sketch.title}}</a></div>
        <div class="sketch-description">{{sketch.description}}</div>
        <div class="sketch-date">{{sketch.date}}</div>
		  </div>
    </div>
    `),
    link: function(scope, element, attributes) {},
  };
});

app.filter('unsafe', function($sce) { return $sce.trustAsHtml; });
