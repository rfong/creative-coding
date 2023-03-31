let canvasCenter;
let fitSlider,
    radiusSlider,
    debugCheckbox;

function setup() {
  let canvas = createCanvas(400, 400);
  canvas.parent("p5-canvas");
  
  fitSlider = createSlider(0, PI/2, PI/4, PI/180);
  fitSlider.style('width', '100px');
  fitSlider.parent(select('#fit-ctrl-container'));
  
  radiusSlider = createSlider(5, 100, 50);
  radiusSlider.style('width', '100px');
  radiusSlider.parent(select('#radius-ctrl-container'));
  
  debugCheckbox = createCheckbox('DEBUG', true);
  debugCheckbox.parent(select('#debug-ctrl-container'));
}

function isDebug() { return debugCheckbox.checked(); }

function draw() {
  background(0);
  
  // set (0,0) to center of canvas
  translate(width/2, height/2);
  let w=width/2, h=height/2;
  
  // some grid lines for reference
  stroke(100,100,100);
  line(-w,0,w,0);
  line(-w,50,w,50);
  line(-w,100,w,100);
  line(-w,150,w,150);
  
  // draw the central sphere
  noStroke();
  fill(255,255,255);
  let radius = radiusSlider.value();
  circle(0,0,2*radius);
  
  // draw the warped lines
  noFill();
  stroke(0, 255, 0);
  for (let i=0; i<3; i++) {
    warpedLine(20*i, radius+25*(i+1));
  }
}

function warpedLine(y,r) {
  let p1 = new p5.Vector(-r*2,y),
      p2 = new p5.Vector(r*2,y);
  
  // draw the unwarped part of the line
  if (p1.x > -width/2) {
    line(-width/2,y,p1.x,y);
  }
  if (p2.x < width/2) {
    line(width/2,y,p2.x,y);
  }
  
  if (isDebug()) {
    // draw the start and end points
    drawPoint(p1);
    drawPoint(p2);
    
    push();
    
    // outline the circle we're operating on
    noFill();
    stroke(0,0,255);
    circle(0,0,2*r);

    // pick out some points on the orbit
    noStroke();
    fill(255,0,0);
    // 0 is at bottom of circle, moves CCW
    drawPoint(getPointOnCircle(r,0));
    drawPoint(getPointOnCircle(r,PI/2));
    drawPoint(getPointOnCircle(r,-PI/2));
    
    pop();
  }
  
  /*
  // big simple curve
  beginShape();
  vertex(p1.x,p1.y);
  bezierVertex(-r,2*r, r,2*r, p2.x,p2.y);
  endShape();
  */
  
  // Where do we start to deviate from the orbit?
  let theta = fitSlider.value();

  // bottom arc
  arc(0,0,r*2,r*2, -theta+PI/2,theta+PI/2); // theta=0 appears to face right??
  
  // left: smoothly rejoin with the straight line
  drawBezier(
    p1,
    getPointOnCircle(r, -theta),
    new p5.Vector(p1.x/2-r/2,p1.y),
    getPointAlongTangentToCircle(r/2, r, -theta),
  );
  
  // right: smoothly rejoin with the straight line
  drawBezier(
    p2,
    getPointOnCircle(r, theta),
    new p5.Vector(p2.x/2+r/2,p2.y),
    getPointAlongTangentToCircle(-r/2, r, theta),
  );
}

// Helper that draws a cubic Bezier and accepts 2d vectors
function drawBezier(p1,p2, cp1,cp2) {
  bezier(
    p1.x,p1.y,
    cp1.x,cp1.y,
    cp2.x,cp2.y,
    p2.x,p2.y,
  );
  
  if (!isDebug()) return;
  
  // Visualize anchor points
  drawPoint(p1);
  drawPoint(p2);
  
  // Visualize control points
  push();  // start new draw state
  fill(255,255,255);
  stroke(255,255,255);
  
  drawPoint(cp1);
  line(p1.x,p1.y,cp1.x,cp1.y);
  
  drawPoint(cp2);
  line(p2.x,p2.y,cp2.x,cp2.y);
  
  pop();  // finish draw state
}

// Helper that adds a `vertex` and accepts 2d vector
function addVertex(point) {
  vertex(point.x,point.y);
}
// Helper that adds a `bezierVertex` and accepts 2d vectors
function addBezierVertex(cp1,cp2,point) {
  bezierVertex(cp1.x,cp1.y, cp2.x,cp2.y, point.x,point.y);
}

// Draw a small-radius circle at the given point
function drawPoint(point) {
  circle(point.x,point.y,5);
}

// theta=0 appears to face down
function getPointOnCircle(r, theta) {
  return new p5.Vector(r*sin(theta), r*cos(theta));
}

// d = distance along tangent (left)
function getPointAlongTangentToCircle(d, r, theta) {
  return new p5.Vector(
    r*sin(theta) - d*cos(theta),
    r*cos(theta) + d*sin(theta),
  );
}

function avg(a,b) {
  return (a+b)/2;
}
