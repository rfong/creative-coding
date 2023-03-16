// draw a bug that's basically a turtle but with an absolute-coord slime trail

const CANVAS_WIDTH = 600,
      CANVAS_HEIGHT = 600;

setup = () => {
  var canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent('canvas');
}

let maxTrailDia = 30;
let maxTrailLen = 150; // set cap on trail to not bust render time

bugs = [
  new Bug(200, 200, 80),
  new Bug(200, 400, 70, -Math.PI/2),
  new Bug(400, 500, 50, -Math.PI*2/3),
];

draw = () => {
  background(245);
  
  // draw trails underneath all bugs
  for (var i in bugs) {
    bugs[i].drawTrail();
  }
  
  // draw bugs
  for (var i in bugs) {
    bugs[i].draw();
  }
}

// return true with probability px
function prob(px) {
  return random(1.0) < px;
}

function Bug(x, y, d, dir) {
  // BASE
  this.x = x;
  this.y = y;
  this.r = d/2;
  this.dir = dir || 0;  // Rotation of entire bug (radians, CW)
  this.speed = 1;  // pixels moved per frame
  this.rotationCCW = true;  // direction preference to rotate
  
  // TRAIL
  this.trail = [];  // Stack. `unshift` to add elements
  this.trailSize = [];  // correspond this to trail. janky
  
  // LEGS
  // Only describes one leg in each joined pair. Going CW from top
  this.legBaseAngles = [Math.PI/3, Math.PI/2, Math.PI*2/3];
  // Angles of leg wiggle
  this.legWiggles = [0, 0, 0];
  // Max leg wiggle range in *either* direction
  this.maxLegWiggle = Math.PI/40;
  
  // Make random changes before draw turn
  this.update = () => {
    // Walk forward in current direction
    this.move(this.speed * cos(this.dir), this.speed * sin(this.dir));

    // Occasionally change direction of rotation, don't be too jittery
    if (prob(0.01)) {
      console.log("change direction", this.rotationCCW ? "CCW" : "CW");
      this.rotationCCW = !this.rotationCCW;
    }
    // Increment angle randomly
    this.dir += random(0.02) * (this.rotationCCW ? -1 : 1);
  }

  // Move the bug incrementally. Do not allow bug to exit the canvas; only
  // increment if in bounds.
  this.move = function(x, y) {
    var r = this.r + 10;
    if (this.x + x >= r && this.x + x < CANVAS_WIDTH - r) {
      this.x += x;
    }
    if (this.y + y >= r && this.y + y < CANVAS_HEIGHT - r) {
      this.y += y;
    }
  }
  
  // Draw bug on canvas
  this.draw = () => {
    this.update(); // randomly move dir/pos
    
    // change frame of reference
    push();
    // move entire frame of ref to current bug center
    translate(this.x, this.y);
    // set origin of rotation
    rotate(this.dir);
    
    // draw bug at 0,0 in frame of ref
    this.drawBase();
    
    // revert frame of reference
    pop();
    
    // add random size for newest trail blob
    this.trailSize.unshift(random(maxTrailDia));
    // add absolute butt coordinate to the trail, and
    // truncate end of trail if needed
    if (this.trail.unshift(this.getAbsPoint(Math.PI)) > maxTrailLen) {
      this.trail.length = maxTrailLen;  // this is a hack but it works
      this.trailSize.length = maxTrailLen;
    }
  }
  
  // Draw bug relative to current frame of reference
  this.drawBase = () => {
    fill(color(230,180,150));
    // draw body
    circle(0, 0, this.r * 2);
    
    // draw a triangle for face to simplify debugging
    facePt = this.getPointOnBorder(0);
    triangle(facePt[0]+10, facePt[1], facePt[0]-5, facePt[1]+10, facePt[0]-5, facePt[1]-10);
    
    // update leg wiggles; they should alternate
    for (var i=0; i<this.legWiggles.length; i++) {
      this.legWiggles[i] = this.maxLegWiggle * sin(frameCount/6 + Math.PI * (i%2));
    }
    // draw legs
    for (var i=0; i<this.legBaseAngles.length; i++) {
      var th = this.legBaseAngles[i] + this.legWiggles[i];
      this.drawPointOnBorder(th);
      this.drawPointOnBorder(th + Math.PI);
    }
  }
  
  // draw a gross bug trail that attenuates over time
  this.drawTrail = function() {
    push();
    noStroke();
    fill(color(198,256,10));
    for (var i=0; i<this.trail.length; i++) {
      var dia = max(this.trailSize[i] - i / (maxTrailLen/maxTrailDia), 0);
      circle.apply(null, this.trail[i].concat([dia]));
    }
    pop();
  }
  
  // get point on border of circle, at angle theta (radians),
  // going in CW direction from right, in relative frame
  this.getPointOnBorder = function(theta) {
    return [this.r * cos(theta), this.r * sin(theta)];
  }
  
  // draw point in the relative frame
  this.drawPointOnBorder = function(theta, dia) {
    circle.apply(null, this.getPointOnBorder(theta).concat([dia || 10]))
  }
  
  // get point on border of circle in absolute frame of ref
  this.getAbsPoint = function(theta) {
    return [
      this.x + this.r * cos(theta + this.dir),
      this.y + this.r * sin(theta + this.dir),
    ];
  }

}
