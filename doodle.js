function setup() {
  createCanvas(600, 600).parent('doodle');
  background(256);

  // control panel
  button = createButton('clear');
  button.position(0, 0);
  button.mousePressed(clearCanvas);
}

function clearCanvas() {
  clear();
  background(256);
}

let mouseIsDown = false;
let previousVertexQueue = []; // let's keep this at length<=2

// TODO:
// fix the vertices that are getting dropped due to lazy queue management
// is the last vertex getting dropped?

function draw() {
  frameRate(60);
  strokeWeight(8);
  noFill();
  
  // follow mouse if pressed
  if(mouseIsDown) {
    // not enough points for curve, draw a line lol
    if(previousVertexQueue.length<2) {
      //console.log("line");
      //line(mouseX, mouseY, pmouseX, pmouseY);
    }
    else {
      stroke(256,0,0);
      console.log("bezier");
      beginShape();
      vertex(previousVertexQueue[0][0], previousVertexQueue[0][1]);
      bezierVertex(
        previousVertexQueue[0][0],
        previousVertexQueue[0][1],
        previousVertexQueue[1][0],
        previousVertexQueue[1][1],
        mouseX, mouseY,
      );
      endShape();
      // pop front off queue
      previousVertexQueue = previousVertexQueue.slice(2);
    }
    
    // add curr to queue
    previousVertexQueue.push([mouseX, mouseY]);
  } else {
    previousVertexQueue = [];
  }
}  
function mousePressed() {
  mouseIsDown = true;
}
function mouseReleased() {
  mouseIsDown = false;
}
