// Deprecated. P5 video capture setup, should you choose to use it.

let capture;

function setup() {
  createCanvas(390, 240).parent('p5-canvas');
  capture = createCapture(VIDEO);
  capture.size(320, 240);
  //capture.hide();
}

function draw() {
  background(255);
  image(capture, 0, 0, 320, 240);
  filter(THRESHOLD, 0.35);
}
