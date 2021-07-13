// https://github.com/mdn/samples-server/blob/master/s/webrtc-capturestill/capture.js

(function() {
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
      //ev.preventDefault();
    }, 100);

    clearphoto();
  }

  // Fill the photo with an indication that none has been
  // captured.

  function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
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

      var im = context.getImageData(0, 0, width, height);
      //im = contrastImage(im, 100);
      //im = brightenImage(im, 30);
      //im = thresholdImage(im, 0.3);
      context.putImageData(im, 0, 0);
    
      var dataURI = canvas.toDataURL('image/png');
      photo.setAttribute('src', dataURI);

      imgToAscii()
    } else {
      clearphoto();
    }
  }

  /* deprecated -- manual image manipulation */

  function thresholdImage(im, thresh) {  // input vals [0.0...1.0]
    var d = im.data;
    for(var i=0;i<d.length;i+=4){   //r,g,b,a
      // set high if pixel is over threshold; else set low.
      var val = (rgbToVal(d.slice(i, i+3)) > thresh) ? 255 : 0;
      // set RGB values
      _.each(_.range(i, i+3), (ind) => d[ind] = val);
    }
    return im;
  }

  function rgbToVal(rgbArr) {
    return _.max(_.map(rgbArr, (x) => x/255.0));
  }

  function euclideanDist(mySlice) {
    return Math.sqrt(_.sum(_.map(mySlice, (x) => x*x)));
  }

  function brightenImage(im, brighten) {
    var d = im.data;
    for(var i=0;i<d.length;i+=4){   //r,g,b,a
      d[i] = d[i] + brighten;
      d[i+1] = d[i+1] + brighten;
      d[i+2] = d[i+2] + brighten;
    }
    return im;
  }

  function contrastImage(im, contrast){  //input range [-100..100]
    var d = im.data;
    contrast = (contrast/100) + 1;  //convert to decimal & shift range: [0..2]
    var intercept = 128 * (1 - contrast);
    for(var i=0;i<d.length;i+=4){   //r,g,b,a
      d[i] = d[i]*contrast + intercept;
      d[i+1] = d[i+1]*contrast + intercept;
      d[i+2] = d[i+2]*contrast + intercept;
    }
    return im;
  }

  /* end deprecated -- manual image manipulation */

  function imgToAscii() {
    //let img = aalib.read.video.fromVideoElement(document.getElementById("video"));
    // can't figure out how to make video reader work
    let img = aalib.read.image.fromHTMLImage(document.getElementById("photo"));
    img.map(aalib.aa({width: 300, height: 180}))
    .map(aalib.filter.contrast(1.5))
    .map(aalib.filter.brightness(15))
    .map(aalib.render.html({
      el: document.getElementById("ascii-render"),
      color: '#000',
      charset: aalib.charset.SIMPLE_CHARSET,
    })).subscribe();
  }

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('load', startup, false);
})();
