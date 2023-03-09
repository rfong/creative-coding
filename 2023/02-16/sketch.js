// Forked from https://jason.today/falling-improved

// `bound` is inclusive
function clipToAbsBound(val, bound) {
  if (val > bound) return bound;
  if (val < -1*bound) return -1*bound;
  return val;
}

class Particle {
  constructor({color, empty} = {}) {
    this.color = color;
    this.empty = empty ?? false;
  }
  update() {}
}

class Sand extends Particle {
  static baseColor = "#dcb159";
  static addProbability = 0.5;
  constructor(p) {
    super({color: p.varyColor(Sand.baseColor)});
  }
}

class Water extends Particle {
  static baseColor = "#00aeff";
  static addProbability = 0.5;
  constructor(p) {
    super({color: p.varyColor(Water.baseColor)});
  }
}

class Empty extends Particle {
  static baseColor = window.background;
  constructor() {
    super({empty: true});
  }
}

class Grid {
  initialize(width, height) {
    this.width = width;
    this.height = height;
    this.clear();
  }

  clear() {
    this.grid = new Array(this.width * this.height).fill(0).map(() => new Empty());
  }

  index(x, y) {
    return y * this.width + x;
  }

  setIndex(i, particle) {
    this.grid[i] = particle;
  }

  clearIndex(i) {
    this.setIndex(i, new Empty());
  }

  set(x, y, particle) {
    const index = this.index(x, y);
    // Add bounds check
    if (x < 0 || x >= this.width) return -1;
    if (y < 0 || y >= this.height) return -1;
    this.setIndex(index, particle);
  }

  swap(a, b) {
    const temp = this.grid[a];
    this.grid[a] = this.grid[b];
    this.setIndex(a, this.grid[b]);
    this.setIndex(b, temp);
  }

  isEmpty(index) {
    // For now, if it's out of bounds, return "not empty"
    return this.grid[index]?.empty ?? false;
  }

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

  updatePixel(i) {
    const below = i + this.width;
    const belowLeft = below - 1;
    const belowRight = below + 1;

    // If there are no pixels below, including diagonals, move it accordingly.
    if (this.isEmpty(below)) {
      this.swap(i, below);
    } else if (this.isEmpty(belowLeft)) {
      this.swap(i, belowLeft);
    } else if (this.isEmpty(belowRight)) {
      this.swap(i, belowRight);
    }
  }

  update() {
    for (let i = this.grid.length - this.width - 1; i > 0; i--) {
      this.updatePixel(i);
    }
  }

  draw(p) {
    this.grid.forEach((particle, index) => {
      p.setPixel(index, particle.color || p.backgroundColor);
    });
    p.updatePixels();
  }
}

const w = 90;
const zoomFn = () => window.innerWidth >= w * 4 ? 4 : 2;

class ImprovedLogic extends Logic {
  currentParticleType = Sand;
  availableMaterials = [Sand, Empty];

  // Our main logic for this step!
  logic(p, grid) {
    p.rendering = false;
    p.calculateZoom = zoomFn;

    p.drawCircle = (x, y) => {
      grid.setCircle(
        x, y, () => new this.currentParticleType(p), circleSize, this.currentParticleType.addProbability
      );
    }
    
    p.drawPoint = (x, y) => {
      grid.set(
          x, y, new this.currentParticleType(p)
      );
    }

    p.setup_ = () => {
      p.addToggleRenderingButton();
      p.registerMaterials(this.availableMaterials, (material) => this.currentParticleType = material);
      p.addClearButton(() => grid.clear());
      grid.initialize(p.width, p.height);
      p.drawCircle(20, 20);
    };
    p.onLeftClick = (x, y) => p.drawCircle(x, y);

    p.onRightClick = () => grid.clear();
    p.drawMouse = () => p.drawMouseCircle(circleSize, this.currentParticleType.baseColor);
    p.draw_ = () => grid.draw(p);
    p.update = () => grid.update();
  }
}

/*
make('formalized-particle-simulator', 90, 45, zoomFn(), makeLogic(ImprovedLogic, Grid, {
  before: (p) => {
    p.backgroundColor = window.background;
    p.varyColor = (color, options = {satFn: () => p.random(-20, 0), lightFn: () => p.random(-10, 10)}) => {
      let hue = p.floor(p.hue(color));
      let saturation = p.constrain(p.saturation(color) + p.floor(options.satFn()), 0, 100);
      let lightness = p.constrain(p.lightness(color) + p.floor(options.lightFn()), 0, 100);
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };
  }
}))
*/

const width = 180;
const height = 90;
const zoom = window.innerWidth >= width * 4 ? 4 : 2;
const circleSize = Math.floor(width / 50);

class SlowGrid extends Grid {
  updatePixel(i) {
    const below = i + this.width;
    const belowLeft = below - 1;
    const belowRight = below + 1;

    // If there are no pixels below, including diagonals, move it accordingly.
    if (this.isEmpty(below)) {
      this.swap(i, below);
    } else if (this.isEmpty(belowLeft)) {
      this.swap(i, belowLeft);
    } else if (this.isEmpty(belowRight)) {
      this.swap(i, belowRight);
    }
  }
  update() {
    for (let i = this.grid.length - this.width - 1; i > 0; i--) {
      this.updatePixel(i);
    }
  }
  draw(p) {
    this.grid.forEach((_, index) => {
      p.setPixel(index, this.grid[index].color || p.backgroundColor);
    });
    p.updatePixels();
  }
}

class SlowLogic extends ImprovedLogic {
  currentParticleType = Sand;

  // Our main logic for this step!
  logic(p, grid) {
    super.logic(p, grid);
    p.calculateZoom = () => window.innerWidth - 40 >= width * 4 ? 4 : 2;

    p.setup_ = () => {
      p.registerMaterials(this.availableMaterials, (material) => this.currentParticleType = material);
      p.addClearButton(() => grid.clear());
      grid.initialize(p.width, p.height);
      p.drawCircle(20, 20);
    };
    p.onLeftClick = (x, y) => {
      grid.setCircle(
        x,
        y,
        () => new this.currentParticleType(p),
        circleSize,
        this.currentParticleType.addProbability,
      );
    };
    p.onRightClick = () => grid.clear();
    p.drawMouse = () => p.drawMouseCircle(circleSize, this.currentParticleType.baseColor);
    p.draw_ = () => grid.draw(p);
    p.update = () => grid.update();
  }
}

class SlowLogicWithToggle extends SlowLogic {
  logic(p, grid) {
    super.logic(p, grid);
    p.rendering = false;

    p.setup_ = () => {
      p.addToggleRenderingButton();
      p.registerMaterials(this.availableMaterials, (material) => this.currentParticleType = material);
      p.addClearButton(() => grid.clear());
      grid.initialize(p.width, p.height);
      p.drawCircle(20, 20);
    };
  }
}

/*
make('slow-sand-simulator', width, height, zoom, makeLogic(SlowLogicWithToggle, SlowGrid, {
  before: (p) => {
    p.backgroundColor = window.background;
    p.varyColor = (color, options = {satFn: () => p.random(-20, 0), lightFn: () => p.random(-10, 10)}) => {
      let hue = p.floor(p.hue(color));
      let saturation = p.constrain(p.saturation(color) + p.floor(options.satFn()), 0, 100);
      let lightness = p.constrain(p.lightness(color) + p.floor(options.lightFn()), 0, 100);
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };
  }
}));
*/

const frameCounter = document.querySelector(".frame-counter");
let frameNumber = 0;

class EfficientLogic extends SlowLogic {
  logic(p, grid) {
    super.logic(p, grid);
    p.rendering = true;

    p.setup_ = () => {
      p.registerMaterials(this.availableMaterials, (material) => this.currentParticleType = material);
      p.addClearButton(() => {
        grid.clear();
        p.draw_();
      });
      grid.initialize(p.width, p.height);
      p.drawCircle(20, 20);
    }
    p.mouseDragged = () => {p.resume();}
    p.mouseMoved = () => {p.resume();}
    p.mousePressed = () => {p.resume();}
    p.touched = () => {p.resume();}
    p.after = () => {
      // If there's no reason to update, pause drawing to save battery!
      if (!grid.needsUpdate()) {
        p.pause();
      }
    }
  }
}

class OnlyUpdateModifiedGrid extends SlowGrid {
  initialize(width, height) {
    super.initialize(width, height);
    this.modifiedIndices = new Set();
    this.cleared = false;
  }

  setIndex(i, particle) {
    super.setIndex(i, particle);
    this.modifiedIndices.add(i);
  }

  clear() {
    super.clear();
    this.cleared = true;
  }

  updatePixel(i) {
    if (this.isEmpty(i)) {
      return;
    }
    super.updatePixel(i);
  }

  swap(a, b) {
    if (this.grid[a].empty && this.grid[b].empty) {
      return;
    }
    super.swap(a, b);
  }

  update() {
    this.cleared = false;
    this.modifiedIndices.clear();
    super.update();
  }

  needsUpdate() {
    return this.cleared || this.modifiedIndices.size;
  }

  draw(p) {
    if (this.cleared) {
      p.clearPixels();
    } else if (this.modifiedIndices.size) {
      this.modifiedIndices.forEach((index) => {
        p.setPixel(index, this.grid[index].color || p.backgroundColor);
      });
    }
    p.updatePixels();
    
    // rfong bookmark
    // Add more continuous stuff from the side
    // This isn't that interesting, too uniformly distributed.
    for (var i=0; i<5; i++) {
      p.drawPoint(0, parseInt(p.random(20)));
    }
  }
}

class OnlyUpdateModifiedGridFrameCounter extends OnlyUpdateModifiedGrid {
  draw(p) {
    super.draw(p);
    frameNumber++;
    frameCounter.textContent = frameNumber.toString();
  }
}

/*
make('efficient-sand-simulator', width, height, zoom, makeLogic(EfficientLogic, OnlyUpdateModifiedGridFrameCounter));
// If you're in here reading this code, and you're like wait, what? We didn't do anything here?
// Yeah, I updated the base code with the correct approach, and just added a hook to undo it
// in the previous example. Sorry for the confusion!
*/

class FixLeftBiasGrid extends OnlyUpdateModifiedGrid {
  initialize(width, height) {
    super.initialize(width, height);
    this.rowCount = Math.floor(this.grid.length / this.width);
  }

  updatePixel(i) {
    const below = i + this.width;
    const belowLeft = below - 1;
    const belowRight = below + 1;
    const column = i % this.width;

    if (this.isEmpty(below)) {
      this.swap(i, below);
      // Check to make sure belowLeft didn't wrap to the next line
    } else if (this.isEmpty(belowLeft) && belowLeft % this.width < column) {
      this.swap(i, belowLeft);
      // Check to make sure belowRight didn't wrap to the next line
    } else if (this.isEmpty(belowRight) && belowRight % this.width > column) {
      this.swap(i, belowRight);
    }
  }

  update() {
    this.cleared = false;
    this.modifiedIndices = new Set();

    for (let row = this.rowCount - 1; row >= 0; row--) {
      const rowOffset = row * this.width;
      const leftToRight = Math.random() > 0.5;
      for (let i = 0; i < this.width; i++) {
        // Go from right to left or left to right depending on our random value
        const columnOffset = leftToRight ? i : -i - 1 + this.width;
        this.updatePixel(rowOffset + columnOffset);
      }
    }
  }
}

/*
make('fix-left-bias', width, height, zoom, makeLogic(EfficientLogic, FixLeftBiasGrid));
*/

class SandWithVelocity extends Sand {
  static nickname = "Sand";

  constructor(p) {
    super(p);
    this.maxSpeed = 8;
    this.acceleration = 0.4;
    this.velocity = 0;
    this.modified = false;
  }

  resetVelocity() {
    this.velocity = 0;
  }

  updateVelocity() {
    let newVelocity = this.velocity + this.acceleration;

    if (Math.abs(newVelocity) > this.maxSpeed) {
      newVelocity = Math.sign(newVelocity) * this.maxSpeed;
    }

    this.velocity = newVelocity;
  }

  update() {
    if ((this.maxSpeed ?? 0) === 0) {
      this.modified = false;
      return;
    }
    this.updateVelocity();
    this.modified = this.velocity !== 0;
  }

  getUpdateCount() {
    const abs = Math.abs(this.velocity);
    const floored = Math.floor(abs);
    const mod = abs - floored;
    // Treat a remainder (e.g. 0.5) as a random chance to update
    return floored + (Math.random() < mod ? 1 : 0);
  }
}

class WaterWithVelocity extends Water {
  static nickname = "Water";

  constructor(p) {
    super(p);
    this.maxSpeed = 8;
    this.acceleration = 0.4;
    this.velocity = 0;
    this.modified = false;
  }

  resetVelocity() { this.velocity = 0; }

  updateVelocity() {
    let newVelocity = this.velocity + this.acceleration;

    if (Math.abs(newVelocity) > this.maxSpeed) {
      newVelocity = Math.sign(newVelocity) * this.maxSpeed;

      this.velocity = newVelocity;
    }
  }

  update() {
    if ((this.maxSpeed ?? 0) === 0) {
      this.modified = false;
      return;
    }
    this.updateVelocity();
    this.modified = this.velocity !== 0;
  }

  getUpdateCount() {
    const abs = Math.abs(this.velocity);
    const floored = Math.floor(abs);
    const mod = abs - floored;
    // Treat a remainder (e.g. 0.5) as a random chance to update
    return floored + (Math.random() < mod ? 1 : 0);
  }

}

class Wood extends Particle {
  static baseColor = "#46281d";
  constructor(p) {
    super({color: p.varyColor(Wood.baseColor)});
  }
}

class VelocityLogic extends EfficientLogic {
  currentParticleType = SandWithVelocity;
  availableMaterials = [SandWithVelocity, WaterWithVelocity, Wood, Empty];
}

class GridWithVelocity extends FixLeftBiasGrid {
  windDir = 1;
  windUp = true;

  updatePixel(i) {
    const below = i + this.width;
    const belowLeft = below - 1;
    const belowRight = below + 1;
    const column = i % this.width;

    if (this.isEmpty(below)) {
      this.swap(i, below);
      return below;
      // Check to make sure belowLeft didn't wrap to the next line
    } else if (this.isEmpty(belowLeft) && belowLeft % this.width < column) {
      this.swap(i, belowLeft);
      return belowLeft;
      // Check to make sure belowRight didn't wrap to the next line
    } else if (this.isEmpty(belowRight) && belowRight % this.width > column) {
      this.swap(i, belowRight);
      return belowRight;
    }
    
    // rfong bookmark
    // Add wind. Gravity takes precedence over wind.
    // A particle will only be moved by wind if nothing is on top of it.
    // This is neat at first but isn't interesting in the long run
    // because all the sand ends up being flat.
    const ind = i + this.windDir + (this.windUp ? -1*this.width : 0);
    if (!this.isEmpty(i-this.width) && this.isEmpty(ind)) {
      this.swap(i, ind);
    }

    return i;
  }
  update() {
    this.cleared = false;
    this.modifiedIndices = new Set();
  
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

    // Iterate through particles & run updates
    for (let row = this.rowCount - 1; row >= 0; row--) {
      const rowOffset = row * this.width;
      const leftToRight = Math.random() > 0.5;
      for (let i = 0; i < this.width; i++) {
        // Go from right to left or left to right depending on our random value
        const columnOffset = leftToRight ? i : -i - 1 + this.width;
        let index = rowOffset + columnOffset;
        // If it's empty, just skip this logic
        if (this.isEmpty(index)) {
          continue;
        }
        const particle = this.grid[index];

        particle.update();

        // If the particle will be modified, mark it as such.
        // This is needed as fractional (probabilistic) movement
        // will not otherwise be tracked.
        if (!particle.modified) {
          // If it wasn't modified, just continue in the loop
          continue;
        }

        // Update the number of times the particle instructs us to
        for (let v = 0; v < particle.getUpdateCount(); v++) {
          const newIndex = this.updatePixel(index);

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
      }
    }
  }
}

/*
make('velocity-and-acceleration', width, height, zoom, makeLogic(VelocityLogic, GridWithVelocity));
*/

make('final', width, height, zoom, makeLogic(VelocityLogic, GridWithVelocity));
