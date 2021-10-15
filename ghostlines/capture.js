// video manipulation code partially borrowed from:
// https://github.com/mdn/samples-server/blob/master/s/webrtc-capturestill/capture.js

(function() {
  var width = 800;    // We will scale the photo width to this
  var height = 0;     // This will be computed based on the input stream

  var streaming = false;  // Currently streaming from the video element?

  var priorCenter = null;  // last recorded center of mass
  var priorFrame = null;   // last frame recorded

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.

  var video = null;
  var canvas = null;
  var photo = null;

  function startup() {
    video = document.getElementById('video');
    canvas = document.getElementById('video-mirror');

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

    //clearphoto();
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
    let ctx = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;

      let now = performance.now();
      // Unfortunately there is no workaround to capturing the image data 
      // other than rendering it to canvas first, so we will end up drawing
      // on a canvas twice per frame.
      ctx.drawImage(video, 0, 0, width, height);

      // Read image from source
      let imdata = ctx.getImageData(0, 0, width, height);
      console.log((performance.now()-now) + " ms to capture from video");

      // Apply image filters and redraw image
      let now2 = performance.now();
      filterBW(imdata);
      contrast(imdata, 50);
      brighten(imdata, 50);
      console.log((performance.now()-now2) + " ms to apply image filters");
      ctx.putImageData(imdata, 0, 0);

      // calculate centroid
      now2 = performance.now();
      centroid = getCenterOfMass(imdata);
     
      // draw centroid
      //drawCentroidMotion(ctx, centroid, priorCenter);

      let dx = priorCenter ? centroid[0] - priorCenter[0] : undefined,
          dy = priorCenter ? centroid[1] - priorCenter[1] : undefined;

      if (priorFrame) {
        diff = getDiffCoords(imdata, priorFrame, 0.4, 0.01);
        console.log(diff.length, "sample coords");

        // Draw many lines
        ctx.beginPath();
        for (let i=0; i<diff.length; i++) {
          ctx.moveTo(diff[i][0], diff[i][1]);
          ctx.lineTo(diff[i][0] + dx, diff[i][1] + dy);
        }
        ctx.strokeStyle = "red";
        ctx.stroke();
      }
      console.log((performance.now()-now2) + " ms to do math and draw lines");

      // save for next run
      priorCenter = centroid;
      priorFrame = imdata;

      console.log((performance.now() - now) + " ms to process frame");
      console.log("-----");

    } else {
      clearphoto();
    }
  }

  // For debugging, draw the motion of the centroid between frames.
  function drawCentroidMotion(ctx, centroid, priorCenter) {
    ctx.beginPath();
    ctx.arc(centroid[0], centroid[1], 5, 0, 2*Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();

    if (priorCenter) {
      drawLine(ctx, centroid, priorCenter, "red");
    }
  }

  // Draw one line using Canvas API.
  // Note that using `beginPath()` and `stroke()` each time is not performant 
  // when drawing many lines.
  function drawLine(ctx, xy1, xy2, style) {
    ctx.beginPath();
    ctx.moveTo(xy1[0], xy1[1]);
    ctx.lineTo(xy2[0], xy2[1]);
    ctx.strokeStyle = style;
    ctx.stroke();
  }

  // IMAGE RAWDATA MANIPULATION FUNCTIONS

  // https://stackoverflow.com/a/43053803
  const cartesian = (a, b) => [].concat(
    ...a.map(
      d => b.map(
        e => [].concat(d, e)
      )
    ));
  const cartesianNd = (a, b, ...c) => (b ? cartesian(cartesian(a, b), ...c) : a);

  // randomly sample coords that differ by more than threshold [0.0,1.0],
  function getDiffCoords(im1, im2, thresh, sampleProb) {
    sampleProb = (sampleProb==undefined) ? 1.0 : sampleProb;
    let h = im1.height, w = im1.width;
    let coords = [];

    // Randomly sample up to 10k points
    for (let i=0; i<10000; i++) {
      let x = _.random(w), y = _.random(h);
      let ind = (y*w + x)*4;
      if (Math.abs(im1.data[ind] - im2.data[ind]) >= thresh*255) {
        coords.push([x, y]);
      }
    }
    return coords;
  }

  // Return center of mass XY coordintaes in terms of pixels
  function getCenterOfMass(im) {
    let m=0, cx=0, cy=0;
    let h = im.height, w = im.width;
    for (let y=0; y<h; y++) {
      for (let x=0; x<w; x++) {
        d = im.data[(y*w + x)*4];
        m += d;
        cx += d * x;
        cy += d * y;
      }
    }
    return [Math.round(cx/m), Math.round(cy/m)];
  }

  // (in-place operation) strip color and replace with greyscale values
  function filterBW(im) {
    for (let i=0; i<im.data.length; i+=4) {  // rgba 4-tuple
      let v = _.max([im.data[i], im.data[i+1], im.data[i+2]]);
      im.data[i] = im.data[i+1] = im.data[i+2] = v;
    }
  }

  // Apply thresholding filter to image data
  function threshold(im, thresh) {  // input vals [0.0...1.0]
    for (let i=0; i<im.data.length; i+=4) {   //r,g,b,a
      // set high if pixel is over threshold; else set low.
      let val = (rgbToVal(im.data.slice(i, i+3)) > thresh) ? 255 : 0;
      // set RGB values
      im.data[0] = im.data[1] = im.data[2] = val;
    }
  }
  
  // static method; map down from 255 space to unit float space.
  function rgbToVal(rgbArr) {
    return _.max(_.map(rgbArr, (x) => x/255.0));
  }
 
  // Apply brightening filter to image data
  function brighten(im, b) {
    for (let i=0; i<im.data.length; i+=4) {   //r,g,b,a
      im.data[i] = im.data[i] + b;
      im.data[i+1] = im.data[i+1] + b;
      im.data[i+2] = im.data[i+2] + b;
    }
  }

  // Apply contrast filter to image data
  function contrast(im, ctr){  //input range [-100..100]
    ctr = (ctr/100) + 1;  //convert to decimal & shift range: [0..2]
    let intercept = 128 * (1 - ctr);
    for(let i=0;i<im.data.length;i+=4){   //r,g,b,a
      im.data[i] = im.data[i]*ctr + intercept;
      im.data[i+1] = im.data[i+1]*ctr + intercept;
      im.data[i+2] = im.data[i+2]*ctr + intercept;
    }
  }

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('load', startup, false);
})();
