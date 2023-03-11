class Particle {
  constructor({color, empty} = {}) {
    this.color = color;
    this.empty = empty ?? false;
    this.modified = false;
    this.isLiquid = false;
  }
  update() {}

  // Returns true if this particle can displace `p` & fall down through it.
  // (Does not account for position or forces, being applies, since particles
  // don't know that about themselves.)
  // Solid beats liquid beats empty.
  canDisplace(p) {
    if (!(p instanceof Particle)) { return false; }
    // If I'm empty, I can't displace.
    if (this.empty) { return false; }
    // If they are empty (and I'm not), I can displace them.
    if (p.empty) { return true; }
    // I'm liquid and they're solid, I can displace them.
    if (!this.isLiquid && p.isLiquid) { return true; }
    return false;
  }
}

class Empty extends Particle {
  static baseColor = window.background;
  constructor() {
    super({empty: true});
  }
}

// A particle that falls (is subject to gravity-based acceleration)
class ParticleWithVelocity extends Particle {
  constructor(params) {
    super(params);
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

class Sand extends ParticleWithVelocity {
  static nickname = "Sand";
  static baseColor = "#dcb159";
  static addProbability = 0.5;
  constructor(p) {
    super({color: p.varyColor(Sand.baseColor)});
  }
}

class Water extends ParticleWithVelocity {
  static nickname = "Water";
  static baseColor = "#00aeff";
  static addProbability = 0.5;
  constructor(p) {
    super({color: p.varyColor(Water.baseColor)});
    this.isLiquid = true;
  }
}

class Wood extends Particle {
  static baseColor = "#46281d";
  constructor(p) {
    super({color: p.varyColor(Wood.baseColor)});
  }
}

