// video manipulation code partially borrowed from:
// https://github.com/mdn/samples-server/blob/master/s/webrtc-capturestill/capture.js

(function() {

  // Set lodash template settings
  _.templateSettings = {
    interpolate: /\{\{(.+?)\}\}/g,  // {{ attr }}
    evaluate: /\{\%(.+?)\%\}/g,     // {% expr %}
    escape: /\{\{-(.+?)\}\}/g,      // {{- escaped }}
  };

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
    }, 125);

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

      // Read image from source & process image
      var im = context.getImageData(0, 0, width, height);
      var now = performance.now();
      ditherImage(im);

      // Print the size and milliseconds taken to dither.
      var ms = parseInt(performance.now() - now);
      canvas.toBlob(function(blob){
        document.getElementById("status").innerHTML = _.template(
          "processed image in {{ms}} ms<br/>" + 
          "blob size: {{kb}} Kbytes<br/>" +
          "image size: {{width}}x{{height}}",
        )({
          ms: ms,
          kb: blob.size/1000.,
          width: width,
          height: height,
        });
      });

    } else {
      clearphoto();
    }
  }

  function getSliderVal(sliderId) {
    return parseInt(document.getElementById(sliderId).value);
  }

  /* ditherImage(...) and findClosestPalCol(...) are borrowed from
   * https://github.com/tgiachett/canvas-floyd-steinberg-dither
   */

  function ditherImage(im) {
    var ctx = document.getElementById("canvas").getContext("2d");

    let idataSrc = ctx.getImageData(0,0, im.width, im.height),
        idataTrg = ctx.createImageData(im.width, im.height),
        dataSrc = idataSrc.data,
        dataTrg = idataTrg.data,
    len = dataSrc.length,luma;

    // convert to grayscale
    for (let i = 0; i < len; i += 4) {
      luma = dataSrc[i] * 0.2126 + dataSrc[i+1] * .7152 + dataSrc[i+2] * .0722;
      dataTrg[i] = dataTrg[i+1] = dataTrg[i+2] = luma;
      dataTrg[i+3] = dataSrc[i+3];
    }

    // floyd-steinberg dithering algorithm
    for (let i = 0; i < len; i += 4) {
        if(dataTrg[i+(im.width * 4)] === -1 || dataTrg[i+4] === -1 ) {
          break;
      ;} else {
        let oldPixel = dataTrg[i];
        let newPixel = findClosestPalCol(dataTrg[i]);
    
        dataTrg[i] = dataTrg[i+1] = dataTrg[i+2] = newPixel;
        let quantError = oldPixel - newPixel;
        dataTrg[i+4] = dataTrg[i+4] + quantError * (7 / 16);
        dataTrg[i+(im.width * 4)] = dataTrg[i+(im.width * 4)] + quantError * (5 / 16);
        dataTrg[i+(im.width* 4 -4)] = dataTrg[i+(im.width*4 -4)] + quantError * (3 / 16);
        dataTrg[i+(im.width* 4 +4)] = dataTrg[i+(im.width * 4 +4)] + quantError * (1 / 16);
      }
    }

    ctx.putImageData(idataTrg, 0, 0);
  }

  function findClosestPalCol(srcPx) {
    if(256-srcPx < 256/2) {
      return 255;
    } else {
      return 0;
    }
  } 

  /* end dithering utils */

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('load', startup, false);
})();
