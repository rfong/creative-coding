let capture;
// video example https://p5js.org/examples/dom-video-capture.html
// https://p5js.org/examples/interaction-kaleidoscope.html

/* TODO 
 * [ ] translate center of image to center of kaleidoscope while maintaining space filling nature of triangle so I don't have to lean to the right
 * [ ] fix the angle bug
 * [ ] fix the overdraw bug
 * [ ] make laser pointer randomized instead of click based
 * [ ] hide original canvas
 */

// UI
let saveButton, mouseButton, keyboardButton,
		slider, symmetrySlider, speedSlider;
// State
let defaultSymmetry = 6,
		imgMask, // we'll use this to mask the image
		dim = 500,
		theta = 0;

/* Setup */
function setup() {
  createCanvas(dim, dim).parent('sketch');
  angleMode(DEGREES);
  //background(127);
 
	// Buttons
  buttonPanel = createDiv().parent('controls'); 

  // Creating the save button for the file
  saveButton = createButton('save').parent(buttonPanel);
  saveButton.mousePressed(saveFile);

  // Slider for number of kaleidoscope cells
  symmetrySlider = createSlider(3, 24, defaultSymmetry, 1).parent(
		createDiv('Kaleidoscope cells ').parent('controls'));
  // (min, max, [value], [step])
  
  // Rotation speed controller
  // todo logarithmic scale instead of linear
  // todo: LFO speed control
  speedSlider = createSlider(0.2, 5, 5.0, 0.2).parent(
		createDiv('Rotation speed ').parent('controls'));
  
  // Setting up the slider for the thickness of the brush
  sizeSlider = createSlider(1, 32, 4, 0.1).parent(
		createDiv('Laser pointer size ').parent('controls'));
  
  capture = createCapture(VIDEO);
  capture.size(710, 710);
}

function draw() {
  // make a triangle to mask the img with
  //background(255);
  angleMode(DEGREES);
  if (getSymmetry() > 4) {
    imgMask = createGraphics(dim, dim);
    imgMask.fill('rgba(0, 0, 0, 1)');
    console.log("angle", getAngle(), sin(getAngle()));
    imgMask.triangle(0,0, 480*sin(getAngle()),480, 0,480); // bottomleft
    //imgMask.triangle(0,0, 480,480*cos(getAngle()), 480,0) // topright complement
    capture.mask(imgMask);
  }
  // debugging
  //image(capture, 0, 0, 640, 480); return;
  
  translate(width / 2, height / 2);
  // let's rotate the board!
  theta += speedSlider.value();
  rotate(theta)

  for (let i = 0; i < getSymmetry(); i++) {
    rotate(getAngle());
    image(capture, 0, 0, 640, 480);
    let sw = sizeSlider.value();
    strokeWeight(sw);
    lineIfMousePressed();
    push();
    scale(1, -1);
    lineIfMousePressed();
    pop();
  }

}
  
/* Convenience functions */

function lineIfMousePressed() {
  if (!mouseIsPressed) { return; }
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    let mx = mouseX - width / 2;
    let my = mouseY - height / 2;
    let pmx = pmouseX - width / 2;
    let pmy = pmouseY - height / 2;
		stroke(color(255,0,0));
    line(mx, my, pmx, pmy);
  }
}

function getSymmetry() {
  return symmetrySlider.value();
}

function getAngle() {
  return 360 / getSymmetry();
}

// Save File Function
function saveFile() {
  save('design.jpg');
}
