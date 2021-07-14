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
    }, 200);

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
    var ctx = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(video, 0, 0, width, height);

      // Read image from source
      var imdata = ctx.getImageData(0, 0, width, height);
      var im = new Image(imdata);
      im.filterBW();
      im.contrast(50);
      im.brighten(50);
      ctx.putImageData(im.im, 0, 0);

      // calculate centroid
      centroid = im.getCenterOfMass();
  		/*
  		// draw centroid
  		ctx.beginPath();
  		ctx.arc(centroid[0], centroid[1], 5, 0, 2*Math.PI);
  		ctx.fillStyle = "red";
  		ctx.fill();
  		*/

  		// draw line from past centroid
  		if (priorCenter) {
  		  drawLine(ctx, centroid, priorCenter, "red");
  			var dx = centroid[0] - priorCenter[0];
  			var dy = centroid[1] - priorCenter[1];
  		}

      if (priorFrame) {
  		  diff = im.getDiffCoords(priorFrame, 0.4, 0.01);
  			console.log(diff.length, "coords changed");
  			_.each(diff, (coord) => {
  			  drawLine(ctx, coord, [coord[0]+dx, coord[1]+dy], "red");
  			});
  		}

  		// save for next run
  		priorCenter = centroid;
  		priorFrame = im;

    } else {
      clearphoto();
    }
  }

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

  function Image(im) {
    this.im = im;

    // randomly sample coords that differ by more than threshold [0.0,1.0],
  	// with sampleProb probability of passing through
    this.getDiffCoords = function(im2, thresh, sampleProb) {
  	  sampleProb = (sampleProb==undefined) ? 1.0 : sampleProb;
  	  var mat1 = this.getInvGreyscaleMat();
  		var mat2 = im2.getInvGreyscaleMat();
  		return _.filter(
  		  // Get all possible coords
  			cartesian(_.range(mat1[0].length), _.range(mat1.length)),
  			// Filter function
  		  (xy) => {
  		    let x = xy[0], y = xy[1];
  			  // pass if difference >= threshold and filter on sampling probability
  		    return (Math.abs(mat1[y][x] - mat2[y][x]) >= thresh*255) &&
  				  Math.random() < sampleProb;
  		  },
  		);
  	}

    this.getCenterOfMass = function() {
      var mat = this.getInvGreyscaleMat();
  		var m=0, cx=0, cy=0;
  		for (var y=0; y<mat.length; y++) {
  		  for (var x=0; x<mat[0].length; x++) {
  			  m += mat[y][x];
  			  cx += mat[y][x] * x;
  			  cy += mat[y][x] * y;
  			}
  		}
      return [Math.round(cx/m), Math.round(cy/m)];
    }

    // Get 2d matrix containing just greyscale values at each RGBA pixel,
  	// inverted so that black=high, white=low
    this.getInvGreyscaleMat = function() {
      return _.chunk(
  		  _.map(
  			  // Chunk the 1D list into RGBA 4-tuples
  				_.chunk(this.im.data, 4),
  				// Invert values
  				(p) => (255 - _.min(p.slice(0,3))),
  			// finally, reshape into a width x height 2D array
  			), this.im.width,
  		);
    }

    // strip color and replace with greyscale values
    this.filterBW = function() {
  		for (var i=0; i<this.im.data.length; i+=4) {  // rgba 4-tuple
        let v = _.max(this.im.data.slice(i, i+3));
        // Set the RGB vals to the new HSV val, leaving alpha unchanged.
        _.each(_.range(3), (j) => { this.im.data[i+j] = v });
      }
    }

    this.threshold = function(thresh) {  // input vals [0.0...1.0]
      var d = this.im.data;
      for (var i=0;i<d.length;i+=4){   //r,g,b,a
        // set high if pixel is over threshold; else set low.
        var val = (this.rgbToVal(d.slice(i, i+3)) > thresh) ? 255 : 0;
        // set RGB values
        _.each(_.range(i, i+3), (ind) => d[ind] = val);
      }
      this.im.data = d;
    }
  
    // static method; map down from 255 space to unit float space.
    this.rgbToVal = function(rgbArr) {
      return _.max(_.map(rgbArr, (x) => x/255.0));
    }
  
    this.brighten = function(b) {
      var d = this.im.data;
      for(var i=0;i<d.length;i+=4){   //r,g,b,a
        d[i] = d[i] + b;
        d[i+1] = d[i+1] + b;
        d[i+2] = d[i+2] + b;
      }
      this.im.data = d;
    }
  
    this.contrast = function(ctr){  //input range [-100..100]
      var d = this.im.data;
      ctr = (ctr/100) + 1;  //convert to decimal & shift range: [0..2]
      var intercept = 128 * (1 - ctr);
      for(var i=0;i<d.length;i+=4){   //r,g,b,a
        d[i] = d[i]*ctr + intercept;
        d[i+1] = d[i+1]*ctr + intercept;
        d[i+2] = d[i+2]*ctr + intercept;
      }
      this.im.data = d;
    }

  }  // End Image class definition

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('load', startup, false);
})();
