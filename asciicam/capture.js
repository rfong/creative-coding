// video manipulation code partially borrowed from:
// https://github.com/mdn/samples-server/blob/master/s/webrtc-capturestill/capture.js

(function() {

  // Set lodash template settings
  _.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,  // {{ attr }}
    evaluate: /\{\%(.+?)\%\}/g,     // {% expr %}
    escape: /\{\{-(.+?)\}\}/g,      // {{- escaped }}
  };

  var asciiWidth = 240;
  var asciiHeight = 144;

  // The width and height of the captured photo. We will set the
  // width to the value defined here, but the height will be
  // calculated based on the aspect ratio of the input stream.

  var width = 800;    // We will scale the photo width to this
  var height = 0;     // This will be computed based on the input stream

  // |streaming| indicates whether or not we're currently streaming
  // video from the camera. Obviously, we start at false.

  var streaming = false;

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.

  var video = null;
  var canvas = null;
  var photo = null;
  var startbutton = null;

  function startup() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    photo = document.getElementById('photo');
    startbutton = document.getElementById('startbutton');

    // TODO: cross-browser support?
    navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(function(stream) {
      video.srcObject = stream;
      video.play();
    })
    .catch(function(err) {
      console.log("An error occurred: " + err);
    });

    video.addEventListener('canplay', function(ev){
      if (!streaming) {
        height = video.videoHeight / (video.videoWidth/width);
      
        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.
      
        if (isNaN(height)) {
          height = width / (4/3);
        }
      
        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);

    setInterval(function(ev) {
      takepicture();
    }, 100);

    clearphoto();
  }

  // Fill the photo with an indication that none has been
  // captured.

  function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Capture a photo by fetching the current contents of the video
  // and drawing it into a canvas, then converting that to a PNG
  // format data URL. By drawing it on an offscreen canvas and then
  // drawing that to the screen, we can change its size and/or apply
  // other changes before drawing it.

  function takepicture() {
    var context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);

      // Read image from source & kick off async ascii conversion pipeline
      var im = context.getImageData(0, 0, width, height);
      toAscii(aalib.read.imageData.fromImageData(im), function(){});
    } else {
      clearphoto();
    }
  }

  function getSliderVal(sliderId) {
    return parseInt(document.getElementById(sliderId).value);
  }

  function toAscii(aaImg, handlerFn) {
    var now = performance.now();
    var contrast = getSliderVal("contrastSlider") / 10.0,
        brightness = getSliderVal("brightnessSlider");
    // Instantiate AA wrapper
    var aaImg = aaImg.map(aalib.aa({width: asciiWidth, height: asciiHeight}))
    // Filter
    .map(aalib.filter.brightness(brightness))
    .map(aalib.filter.contrast(contrast))
    // Render
    .map(aalib.render.html({
      el: document.getElementById("ascii-render"),
      color: '#000',
      charset: aalib.charset.SIMPLE_CHARSET,
    }));

    // Execute/observe
    aaImg.subscribe(function() {
      // Print performance info
      var ms = parseInt(performance.now() - now);
      document.getElementById("status").innerHTML = _.template(
        "processed image in {{ms}} ms<br/>" + 
        "original dimensions: {{width}}x{{height}} pixels<br/>" +
        "ASCII dimensions: {{aWidth}}x{{aHeight}} chars<br/>" +
        "uncompressed size of data: {{kb}} Kbytes<br/>",
      )({
        ms: ms,
        kb: 7 * asciiWidth * asciiHeight / 1000.,
        aWidth: asciiWidth,
        aHeight: asciiHeight,
        width: width,
        height: height,
      });
      
      // Run the post handler
      handlerFn();
    });
  }

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('load', startup, false);
})();
