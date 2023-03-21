// Forked from https://jason.today/falling-improved

// Math utility helpers
// `bound` is inclusive
function clipToAbsBound(val, bound) {
  if (val > bound) return bound;
  if (val < -1*bound) return -1*bound;
  return val;
}

// constants
const width = 180;
const height = 90;
const zoom = window.innerWidth >= width * 4 ? 4 : 2;
const circleSize = Math.floor(width / 50);

const frameCounter = document.querySelector(".frame-counter");
let frameNumber = 0;

// Data structure for managing a grid of particles
class Grid {
  windDir = 1;
  windUp = true;

  initialize(width, height) {
    this.width = width;
    this.height = height;
    this.clear();
    this.modifiedIndices = new Set();
    this.cleared = false;
    this.rowCount = Math.floor(this.grid.length / this.width);
  }

  // Delete all particles
  clear() {
    this.grid = new Array(this.width * this.height).fill(0).map(() => new Empty());
    this.cleared = true;
  }

  // Fetch linear index given XY coordinates
  index(x, y) {
    return y * this.width + x;
  }

  // Set a particle at a linear index
  setIndex(i, particle) {
    this.grid[i] = particle;
    this.modifiedIndices.add(i);
  }

  // Set an empty particle at a linear index
  clearIndex(i) {
    this.setIndex(i, new Empty());
  }

  // Set a particle at XY coordinates
  set(x, y, particle) {
    const index = this.index(x, y);
    // Add bounds check
    if (x < 0 || x >= this.width) return -1;
    if (y < 0 || y >= this.height) return -1;
    this.setIndex(index, particle);
  }

  // Swap positions of particles at linear indices `a` and `b`
  swap(a, b) {
    // If trying to swap empty space, skip
    if (this.grid[a].empty && this.grid[b].empty) { return; }

    // Swap positions a with b
    const temp = this.grid[a];
    this.grid[a] = this.grid[b];
    this.setIndex(a, this.grid[b]);
    this.setIndex(b, temp);
  }

  // Fill a circle with particles, given a constructor `createParticle`
  setCircle(x, y, createParticle, radius = 2, probability = 1.0) {
    let radiusSq = radius * radius;
    for(let y1 = -radius; y1 <= radius; y1++) {
      for (let x1 = -radius; x1 <= radius; x1++) {
        if (x1 * x1 + y1 * y1 <= radiusSq && Math.random() < probability) {
          this.set(x + x1, y + y1, createParticle());
        }
      }
    }
  }

  // Return true if position at linear index is empty
  isEmpty(index) {
    // For now, if it's out of bounds, return "not empty"
    return this.grid[index]?.empty ?? false;
  }

  // Cellular automaton behavior for one pixel
  updatePixelWithGravity(i, leftToRight) {
    if (this.isEmpty(i)) { return; }
    const particle = this.grid[i];

    // Falling behavior (with checks to prevent wrapping around the screen)
    const below = i + this.width;
    const belowLeft = below - 1;
    const belowRight = below + 1;
    const column = i % this.width;
    if (particle.canDisplace(this.grid[below])) {
      this.swap(i, below);
      return below;
    } else if (particle.canDisplace(this.grid[belowLeft]) && belowLeft % this.width < column) {
      this.swap(i, belowLeft);
      return belowLeft;
    } else if (particle.canDisplace(this.grid[belowRight]) && belowRight % this.width > column) {
      this.swap(i, belowRight);
      return belowRight;
    }

    // Simulate sideways motion for liquids
    if (particle && particle.isLiquid) {
      // If this row of particles is getting processed left to right, then 
      // flowing left takes precedence. Otherwise, right takes precedence.
      let posns = leftToRight ? [i-1, i+1] : [i+1, i-1];
      for (let j=0; j<posns.length; j++) {
        let pos = posns[j];
        if (particle.canDisplace(this.grid[pos]) && 
            (pos % this.width < i % this.width) == (pos < i)) {
          this.swap(i, pos);
          return pos;
        }
      }
    }
    
    // rfong bookmark
    // Add wind. Gravity takes precedence over wind.
    // A particle will only be moved by wind if nothing is on top of it.
    // This is neat at first but isn't interesting in the long run
    // because all the sand ends up being flat.
    /*
    const ind = i + this.windDir + (this.windUp ? -1*this.width : 0);
    if (!this.isEmpty(i-this.width) && this.isEmpty(ind)) {
      this.swap(i, ind);
    }
    */
    return i;
  }

  // Run updates for every modified particle in the grid. Static particles
  // are not subject to gravity.
  update() {
    this.cleared = false;
    this.modifiedIndices = new Set();

    //updateWind();
    
    // TODO: Recalculate pressure forces, iterating top-down through rows.
    // Force calculations go top-down to simplify cumulative sum of weights.
    // Note that this might change in the future if pressure comes from a
    // source other than weight.

    // Run updates, iterating bottom-up through rows.
    // Falling-based updates need to iterate bottom-up so that lower particles
    // get out of the way before higher particles need to fall to their places
    for (let row = this.rowCount - 1; row >= 0; row--) {
      const rowOffset = row * this.width;
      // Randomly pick a direction to loop over this column in. This is so that
      // we don't have hardcoded bias from either the left or right.
      const leftToRight = Math.random() > 0.5;
      for (let col = 0; col < this.width; col++) {
        // Go from right to left or left to right depending on our random value
        const columnOffset = leftToRight ? col : -col - 1 + this.width;
        let index = rowOffset + columnOffset;
        // If it's empty, skip this logic
        if (this.isEmpty(index)) { continue; }
        const particle = this.grid[index];
        particle.update();

        // If the particle will be modified, mark it as such.
        // This is needed as fractional (probabilistic) movement
        // will not otherwise be tracked.
        if (!particle.modified) {
          // If it wasn't modified, just continue in the loop
          continue;
        }

        // TODO: something weird is happening with water, the update counts
        // never stop
        //let c = particle.getUpdateCount();
        //if (c>1) { console.log(c); }
        //
        // Update the number of times the particle instructs us to
        for (let v = 0; v < particle.getUpdateCount(); v++) {
          const newIndex = this.updatePixelWithGravity(index, leftToRight);

          // If we swapped the particle to a new location,
          // we need to update our index to be that new one.
          // As we are repeatedly updating the same particle.
          if (newIndex !== index) {
            // We can add the same index multiple times, it's a set.
            this.modifiedIndices.add(index);
            this.modifiedIndices.add(newIndex);
            index = newIndex;
          } else {
            particle.resetVelocity();
            break;
          }
        }
        //this.updatePixel(rowOffset + columnOffset);
      }
    }
  }
  /*
  updateWind() {
    // 5% probability of the wind changing directions.
    if (Math.random() < 0.05) {
      this.windDir *= -1;
      console.log("wind direction changed to", this.windDir);
    }
    // 5% probability of the wind increasing in strength.
    if (Math.random() < 0.05) {
      this.windDir = clipToAbsBound(this.windDir*2, 4);
      console.log("wind direction changed to", this.windDir);
    }
    // 5% probability of the wind decreasing in strength.
    if (Math.random() < 0.05) {
      this.windDir /= 2;
      if (Math.abs(this.windDir) < 1) {
        this.windDir = (this.windDir<0) ? -1 : 1;
      }
      console.log("wind direction changed to", this.windDir);
    }
    // 5% probability of wind upwardness changing.
    if (Math.random() < 0.05) {
      this.windUp = !this.windUp;
      console.log("wind upwardness changed to", this.windUp);
    }
  }
  */
  // We need to update if the grid needs to be cleared, or if we have any
  // modified indices that still need an update run over them.
  needsUpdate() {
    return this.cleared || this.modifiedIndices.size;
  }

  // Draw the grid, given a p5 extension
  draw(p) {
    if (this.cleared) {
      p.clearPixels();
    } else if (this.modifiedIndices.size) {
      this.modifiedIndices.forEach((index) => {
        p.setPixel(index, this.grid[index].color || p.backgroundColor);
      });
    }
    p.updatePixels();
  }
}

const w = 90;
const zoomFn = () => window.innerWidth >= w * 4 ? 4 : 2;

class ImprovedLogic extends Logic {
  currentParticleType = Sand;
  availableMaterials = [Sand, Water, Wood, Empty];

  // Our main logic for this step!
  logic(p, grid) {
    p.rendering = false;
    p.calculateZoom = () => window.innerWidth - 40 >= width * 4 ? 4 : 2;

    p.drawCircle = (x, y) => {
      grid.setCircle(
        x, y,
        () => new this.currentParticleType(p), 
        circleSize, 
        this.currentParticleType.addProbability
      );
    }
    
    p.drawPoint = (x, y) => {
      grid.set(x, y, new this.currentParticleType(p));
    }

    p.setup_ = () => {
      p.registerMaterials(
        this.availableMaterials,
        (material) => this.currentParticleType = material
      );
      p.addClearButton(() => {
          grid.clear();
          p.draw_();
      });
      grid.initialize(p.width, p.height);
    };

    p.onLeftClick = (x, y) => {
      grid.setCircle(
        x, y, 
        () => new this.currentParticleType(p), 
        circleSize, 
        this.currentParticleType.addProbability
      );
    }

    p.onRightClick = () => grid.clear();
    p.drawMouse = () => p.drawMouseCircle(circleSize, this.currentParticleType.baseColor);
    p.draw_ = () => grid.draw(p);
    p.update = () => grid.update();

    p.mouseDragged = () => {p.resume();}
    p.mouseMoved   = () => {p.resume();}
    p.mousePressed = () => {p.resume();}
    p.mouseUp      = () => {p.resume();}
    p.touched      = () => {p.resume();}
    p.after = () => {
      // Pause drawing if there is no need to update
      if (!grid.needsUpdate() && grid.modifiedIndices.size==0) {
        p.pause();
      }
    }
  }
}

make('p5-canvas', width, height, zoom, makeLogic(ImprovedLogic, Grid));
