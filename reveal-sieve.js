let sieveSketch = new p5((sketch) => {

  let img,
      showAll = false,
      onMat, // bool matrix of whether squares are active
      iterator,
      squaresPerSide = 60,
      canvasSize = 600,
      timeout = 1, // millis
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
    iterator = getReverseSieveIterator(squaresPerSide);
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
      turnNextSquare();
      turnIsQueued = false;
      // subtle speedup as the canvas becomes saturated w/ revealed squares 
      //if (randInt(Math.pow(squaresPerSide, 2)/timeout) == 0) { timeout--; }
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
  
  function turnNextSquare() {
    if (isAllDone()) return;
    coords = iterator.next();
    onMat[coords[0]][coords[1]] = false;
  }
  
  // check if matrix is completely falsy
  function isAllDone() {
    return !_.some(_.map(onMat, _.some));
  }

  // return a random integer in interval [0, n)
  function randInt(n) {
    return sketch.int(sketch.random(n));
  }

}, 'p5-sieve');


// Return an iterator that gets the next coords out of the sieve until empty
function getSieveIterator(squareSize) {
  return {
    // groups of multiples, in descending order of their associated prime
    initSieve: function() {
      this.sieve = _.map(
        generatePrimeSieve(Math.pow(squareSize, 2)),
        (v, k) => {return _.reverse(v)});
    },
    next: function() {
      // If sieve is emptied, regenerate it.
      if (!this.sieve || this.sieve == []) {
        this.initSieve();
      }
      // If current group is empty, proceed to next one.
      while (this.sieve[0].length == 0) {
        this.sieve = this.sieve.slice(1);
      }
      // Pop smallest element off the current multiple group & --> coords
      return intToCoords(this.sieve[0].pop(), squareSize);
    },
  };
}

// a SieveIterator that provides elements in reverse order.
function getReverseSieveIterator(squareSize) {
	let iter = getSieveIterator(squareSize);
	iter.initSieve = function() {
		this.sieve = _.reverse(_.map(
        generatePrimeSieve(Math.pow(squareSize, 2)),
        (v, k) => {return v}));
	}
	return iter;
}

// generate a prime sieve up to maxN, grouped by prime : multiple
function generatePrimeSieve(maxN) {
  let sieve = {}; // factor : multiple
  let prime = 2, multiplier = 1;
  
  function isInSieve(x) {
    if (x in sieve) { return true; }
    for (p in sieve) {
      if (sieve[p].includes(x)) { return true; }
    }
    return false;
  }
  
  while (true) {
    multiplier = 1;
    if (prime > maxN) { return sieve; }
    // look at new base prime
    sieve[prime] = [];
    while (multiplier * prime < maxN) {
      sieve[prime].push(multiplier * prime);
      multiplier++;
    }
    prime++;
    while(isInSieve(prime)) { prime++; }
  }
}
 
// wrap an int into coordinates into our square matrix.
function intToCoords(x, sqSize) {
  x--; // switch from integer-space to 0-indexing
  return [x % sqSize, Math.floor(x / sqSize)];
}
  

