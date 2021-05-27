let randomSketch = new p5((sketch) => {

  let img,
      showAll = false,
      onMat, // bool matrix of whether squares are active
      squaresPerSide = 60,
      canvasSize = 600,
      timeout = 50, // millis
      squareSize = Math.ceil(1.0 * canvasSize / squaresPerSide);

  // square matrix w/ all values set to true
  onMat = _.map(_.range(squaresPerSide), ()=>{
    return _.map(_.range(squaresPerSide), ()=>{return true});
  });
  
  sketch.preload = () => {
    img = sketch.loadImage('https://images.unsplash.com/photo-1471922694854-ff1b63b20054?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1052&q=80');
  }
  
  sketch.setup = () => {
    sketch.createCanvas(canvasSize, canvasSize);
  }
  
  // are we waiting for a timeout to complete?
	// TODO we could do this with promise & deferred...
  let turnIsQueued = false;
  
  sketch.draw = () => {
		// if next turn is already queued, do nothing / skip this draw loop
		if (turnIsQueued) { return; }

		// redraw image
    sketch.image(img, 0, 0);
		// stroke/fill settings
    sketch.noStroke();
    sketch.fill(sketch.color(0,0,0));
    // redraw squares
    drawSquares();

    // after `timeout` millis, deactivate a random square
    setTimeout(function() {
      turnRandomSquare();
      turnIsQueued = false;
			// subtle speedup as the canvas becomes saturated w/ revealed squares 
      if (randInt(Math.pow(squaresPerSide, 2)/timeout) == 0) { timeout--; }
    }, timeout);

		// next turn is now queued.
    turnIsQueued = true;
  }
  
	// redraw all active squares
  function drawSquares() {
    if (showAll) { return; }
    for (i in onMat) {
      for (j in onMat[i]) {
        if (onMat[i][j]) {
          sketch.square(i * squareSize, j * squareSize, squareSize);
        }
      }
    }
  }
 
  // count number of deactivated squares in matrix
  function countNumOff() {
		return _.sumBy(onMat, (row) => {
			return _.sumBy(row, (b) => { return b ? 0 : 1; });
		});
  }
  
  // pick random unturned square
	// easy approach: just retry if we pick one that's already turned.
	// becomes more suboptimal as time goes on, but it won't be human-perceptible
  function turnRandomSquare() {
    if (isAllDone()) return;
    let i = randInt(onMat.length),
        j = randInt(onMat[0].length);
    if (onMat[i][j] == false) {
      turnRandomSquare();
    } onMat[i][j] = false;
  }
  
  // check if matrix is completely falsy
  function isAllDone() {
		return !_.some(_.map(onMat, _.some));
  }

  // return a random integer in interval [0, n)
  function randInt(n) {
    return sketch.int(sketch.random(n));
  }
  
}, 'p5-random');
