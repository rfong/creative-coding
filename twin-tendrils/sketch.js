// see p5.bezier reference
// RC Creative Coding 3/16/23
// prompt: Twins separated at birth meeting for the first time

// other possible ideas to do:
// - draw bezier swashes/flourishes in the negative spaces between the large beziers
// - try the animation as a transform instead of a rescale?

let xOff = 0;
let yOff = 100;
let bObject;
let leftWidth = 20,
    moveRight = true,
    xInt,
    maxFramesToTouch = 250,
    nFramesToTouch = null;
let numXIntervals = 10;
let canvas;

function setup() {
  canvas = createCanvas(min(window.innerWidth, 800), 300);
  canvas.parent("p5-canvas");
  p5bezier.initBezier(canvas);

  noFill();
  strokeWeight(2);
  xInt = width/numXIntervals;
}

// color palettes
const palettes = {
  "sun": {
    "background": "#2c2a27",
    "swatches": ["#FFCC16", "#D18130", "#FFF3B7", "#ed9600"],
  },
  "amniotic": {
    "background": "#c46f8c",
    "swatches": ["#FFCC16", "#D18130", "#FFF3B7", "#ed9600"],
  },
};
const paletteName = "amniotic";

function draw() {
  const palette = palettes[paletteName];
  background(palette.background);

  xOff = xOff + 0.0025;
  yOff = yOff + 0.003;
  
  // reached the middle; stay touching for a while
  if (leftWidth >= width/2) {
    // start touching in middle
    if (nFramesToTouch == null) {
      nFramesToTouch = maxFramesToTouch;
      moveRight = null;
    }
    // done touching, reverse direction
    else if (nFramesToTouch == 0) {
      moveRight = false;
      nFramesToTouch = null;
      canvas.drawingContext.setLineDash([]);
    }
    // continue touching, count down
    else {
      nFramesToTouch--;
      if (nFramesToTouch % 50 > 45) {
        canvas.drawingContext.setLineDash([3, 10]);
      } else {
        canvas.drawingContext.setLineDash([]);
      }
    }
  } else if (leftWidth <= 0) {
    // reverse directions
    moveRight = true;
  }
  
  // move in current direction of motion
  if (moveRight != null) {
    leftWidth += (moveRight ? 1 : -1) * 0.75;
  }
  
  const colors = palette.swatches;
  const points = [];
  for (let i=0; i<colors.length; i++) {
    if (i%2 == 0) {
      points.push(getNoisePoints(xOff+i, xInt, leftWidth));
    } else {
      points.push(getNoisePoints(yOff+2+i, xInt, leftWidth));
    }
  }
  
  // draw left side beziers
  for (let i=0; i<points.length; i++) {
    stroke(colors[i]);
    p5bezier.newBezier(points[i], "OPEN", 6);
  }
  
  // draw (mirrored) right side beziers
  for (let i=0; i<points.length; i++) {
    stroke(colors[i]);
    p5bezier.newBezier(mirrorPoints(points[i]), "OPEN", 6);
  }
}

// Given a set of points on the left side of the screen,
// mirror them horizontally across the center of the screen.
function mirrorPoints(points) {
  let newPoints = [];
  for (let i=0; i<points.length; i++) {
    newPoints.push([width-points[i][0], points[i][1]]);
  }
  return newPoints;
}

// generate control points at set X-intervals for the left
// half of the screen, where the Y-values are a little off 
// from the previous value. rescale to leftWidth
function getNoisePoints(offset, xInterval, leftWidth) {
  const points = [];
  for (let pointX = 0; pointX <= width/2; pointX += xInterval) {
    const pointY = ((noise(offset+pointX) * height) << 1) - (height >> 1);
    points.push([pointX*leftWidth/width*2, boundY(pointY)]);
  }
  return points;
}

// keep `y` in canvas y-bounds
function boundY(y) {
  return max(0,
    min(height, y));
}
