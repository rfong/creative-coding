  let squaresPerSide = 60;

	// Return an iterator that gets the next element out of the sieve until empty
	function getSieveIterator() {
		return {
			// groups of multiples, in descending order of their associated prime
			sieve: _.reverse(_.map(generatePrimeSieve(), (v, k) => {return v})),
			next: function() {
				// If current group is empty, proceed to next one.
				while (this.sieve[0].length == 0) {
					this.sieve = this.sieve.slice(1);
				}
				// Pop an element off the current multiple group.
				return this.sieve[0].pop();
			},
		};
	}

	// generate a sieve grouped by prime : multiple
  function generatePrimeSieve() {
    let sieve = {}; // factor : multiple
    let max = Math.pow(squaresPerSide, 2);
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
      if (prime > max) { return sieve; }
      // look at new base prime
      sieve[prime] = [];
      while (multiplier * prime < max) {
        sieve[prime].push(multiplier * prime);
        multiplier++;
      }
      prime++;
      while(isInSieve(prime)) { prime++; }
    }
  }

