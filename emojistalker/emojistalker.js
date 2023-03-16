/* TODO
 * [ ] stop the arrow key press event from propagating through to the window
 */

let state = {x: 300, y: 300},
    currDirection,
    prevDirection,
    accel = 0,
    timeHeldCurDir = 0,
    minStep = 3,
    step = minStep,
    maxStep = 6,
    // layout
    canvasWidth = 600, canvasHeight = 600,
    spooky = false,
    // follower
    fSize = 100,
    fState = {x: 300, y: 300+fSize/2};

function setup() {
  createCanvas(canvasWidth, canvasHeight).parent('sketch');
  //createSprite(400, 200, 50, 50);
  currDirection = -PI;
}

// Draw player with appropriate rotation
function drawPlayer() {
  //rotate(PI / 3.0);
  //triangle(300,300, 310,310, 300,310);
  push();
  fill(color(255,0,0));
  translate(state.x, state.y);
  rotate(currDirection); // face in direction of movement
  triangle(5, -10, -5, -10, 0, 10);
  
  // make it spooky if we face the follower accidentally
  towardFollower = createVector(fState.x-state.x, fState.y-state.y).heading() - PI/2;
  spooky = (towardFollower > currDirection - PI/4 && towardFollower < currDirection + PI/4);
  //console.log(spooky, towardFollower, currDirection);
  
  pop();
}

function drawFollower() {
  push();
  translate(fState.x, fState.y);
  //rotate(currDirection+PI); // face in direction of movement
  
  // face in direction of Player
  rotate(createVector(state.x-fState.x, state.y-fState.y).heading() + PI/2);

  // old follower
  //fill(color(255,0,0));
  //triangle(5, -30, -5, -30, 0, -20);
  
  // emoji follower
  translate(-fSize/2, fSize/2); // Make the text be centered
  //translate(0, 30); // follow behind
  textSize(fSize);
  text("🐍",0,0);
  
  pop();
}

function draw() {
  background(255,255,255);  
  //drawSprites();
  
  // player
  //circle(state.x, state.y, 20);
  //triangle(30, 75, 58, 20, 86, 75);
  drawPlayer();
  
  // follower
  drawFollower();
  //circle(state.x, state.y, 20);
  
  if (spooky) {
    filter(INVERT);
  }
  
  // UPDATE STATES

  if (accel) {
    step += 0.5; // make bigger step
    step = min(step, maxStep);
  } else {
    step = minStep; // reset
  }
  
  // [x] think about different steps for follower & player
  // the follower should catch up even when the player isn't moving
  
  prevDirection = currDirection; // this doesn't take the null state into account but I'm going to ignore it for right now
  if (keyIsDown(LEFT_ARROW)) {
    state.x -= step;
    fState.x -= minStep;
    currDirection = PI/2;
  } else if (keyIsDown(RIGHT_ARROW)) {
    state.x += step;
    fState.x += minStep;
    currDirection = -PI/2;
  } else if (keyIsDown(UP_ARROW)) {
    state.y -= step;
    fState.y -= minStep;
    currDirection = -PI;
  } else if (keyIsDown(DOWN_ARROW)) {
    state.y += step;
    fState.y += minStep;
    currDirection = 0;
  } else {
    // DO SOMETHING
  }
  // if we continued in the same direction, accel > 0
  accel = (prevDirection == currDirection);
  
  // Prevent us from running off the screen
  state.x = boundX(state.x);
  state.y = boundY(state.y);
  fState.x = boundX(fState.x);
  fState.y = boundY(fState.y);
}

function boundX(x) {
  return min(canvasWidth, max(0, x));
}
function boundY(y) {
  return min(canvasHeight, max(0, y));
}
