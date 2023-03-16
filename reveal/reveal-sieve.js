let iterRevealSketchFactory = (getIterator, squaresPerSide, timeout, htmlElementId) => {
  return new p5((sketch) => {

    let img,
        showAll = false,
        iterator,
        onMat, // bool matrix of whether squares are active
        canvasSize = 600,
        squareSize = Math.ceil(1.0 * canvasSize / squaresPerSide);
  
    sketch.preload = () => {
      img = sketch.loadImage('https://images.unsplash.com/photo-1471922694854-ff1b63b20054?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1052&q=80');
    }
    
    sketch.setup = () => {
      sketch.createCanvas(canvasSize, canvasSize);
      resetState();
    }

    function resetState() {
      iterator = getIterator();

      // square matrix w/ all values set to true
      onMat = _.map(_.range(squaresPerSide), ()=>{
        return _.map(_.range(squaresPerSide), ()=>{return true});
      });
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
      // if iterator runs out, reset it.
      if (coords == null) {
        console.log("regenerate iterator");
        resetState();
        coords = iterator.next();
      }
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
  
  }, htmlElementId);

}; // end factory


// Return an iterator that gets the next coords out of the sieve until empty
function getSieveIterator(squareSize) {
  return {
    // groups of multiples, in descending order of their associated prime
    sieve: _.map(
        generatePrimeSieve(Math.pow(squareSize, 2)),
        (v, k) => {return v}),
    next: function() {
      // If current group is empty, proceed to next one.
      while (this.sieve.length > 0 && (!this.sieve[0] || this.sieve[0].length == 0)) {
        this.sieve.shift(); // dequeue first group
      }
      // Check if done.
      if (!this.sieve[0] || this.sieve.length == 0) {
        return null;
      }
      // Dequeue smallest element off the current multiple group & --> coords
      return intToCoords(this.sieve[0].shift(), squareSize);
    },
  };
}

// a SieveIterator that provides elements in reverse order.
function getReverseSieveIterator(squareSize) {
  let iter = getSieveIterator(squareSize);
  iter.sieve = _.reverse(_.map(
    generatePrimeSieve(Math.pow(squareSize, 2)),
    (v, k) => {return _.reverse(v)}));
  return iter;
}

// generate a prime sieve up to maxN, grouped by prime : [multiples]
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
    multiplier = 2;
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


/* Actually instantiate sketches! */

let sqSize = 20;

let sieveSketch = iterRevealSketchFactory(
  () => { return getSieveIterator(sqSize) },
  sqSize,
  1, // timeout
  'p5-sieve',
);

let revSieveSketch = iterRevealSketchFactory(
  () => { return getReverseSieveIterator(sqSize) },
  sqSize,
  1, // timeout
  'p5-rev-sieve',
)
