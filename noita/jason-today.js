// From https://jason.today/falling-improved

// Our Library
window.background = window.darkMode ? "#1a1d21" : "#e5e2de";
window.foreground = window.darkMode ? "#e5e2de" : "#1a1d21";

// Figure out if the foreground text should be light
// or dark for palette
// https://stackoverflow.com/a/11868398
function getContrastYIQ(r, g, b){
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
}

// Things we should do at the beginning of every draw call, for all steps
function before(p) {
  p.background(p.backgroundColor || window.background);
}

// Simplify with some boilerplate
function make(id, width, height, zoom, fn, webgl = false) {
  return new p5((p) => {
    p.isWEBGL = webgl;
    p.swatchBarSpacer = null;
    p.backgroundColor = p.color(window.background);

    // Things we should do at the beginning of every draw call, for all steps
    p.before = () => before(p);

    p.rendering = true;
    p.resume = () => {
      p.loop();
      p.rendering = true;
    }
    p.pause = () => {
      p.noLoop();
      p.rendering = false;
    }

    p.onToggle = (elt) => {
      p.toggleRendering();
      elt.textContent = `${p.rendering ? "Pause" : "Resume"} Rendering`;
    };
    p.toggleRendering = () => {
      if (p.rendering) {
        p.pause();
      } else {
        p.resume();
      }
    }
    p.addToggleRenderingButton = () =>
      p.addButton("Start Rendering", p.backgroundColor, p.onToggle, {'margin-right': '10px'});

    p.ensureSwatchBarSpacer = () => {
      if (p.swatchBarSpacer) {
        return;
      }
      p.swatchBarSpacer = p.createDiv();
    }

    p.addParticleSwatch = (particleType, onClick) =>
      p.addButton(particleType.nickname ?? particleType.name, particleType.baseColor, onClick);

    p.addButton = (text, color, onClick, styles = {}) => {
      p.ensureSwatchBarSpacer();
      let div = p.createButton(text);
      div.style('background-color', color);
      div.style('padding', '7px');
      div.style('height', '32px');
      div.style('cursor', 'pointer');
      div.style('border', `2px solid #2b2b2b`);
      div.style('margin-top', `4px`);
      const c = p.color(color);
      div.style(
        'color', getContrastYIQ(p.red(c), p.green(c), p.blue(c))
      );
      for (let k in styles) {
        div.style(k, styles[k]);
      }
      div.elt.onclick = () => onClick(div.elt);
      return div;
    };

    p.canvas = null;
    p.zoom = zoom;

    p.calculateZoom = () => zoom;
    p.setZoom = (zoom) => {
      p.zoom = zoom;
      if (p.canvas) {
        p.canvas.elt.style.width = `${p.canvas.width * zoom}px`;
        p.canvas.elt.style.height = `${p.canvas.height * zoom}px`;
      }
    }

    p.setup_ = () => {};
    p.setup = function () {
      // Disable context menu
      for (let element of document.getElementsByClassName("p5Canvas")) {
        element.addEventListener("contextmenu", (e) => e.preventDefault());
        element.addEventListener("touchstart", (e) => e.preventDefault());
        element.addEventListener("touchend", (e) => e.preventDefault());
        element.addEventListener("touchmove", (e) => e.preventDefault());
      }

      // 60 FPS
      p.frameRate(60);

      // Ignore pixel density (Hi-DPI)
      p.pixelDensity(1);

      // Zoom canvas
      const canvas = p.createCanvas(width, height, p.isWEBGL ? p.WEBGL : p.P2D);
      p.canvas = canvas;
      p.setZoom(zoom);

      p.background(p.backgroundColor);
      p.setup_(canvas);
      p.loadPixels();
      p.noCursor();

      if (!p.rendering) {
        p.noLoop();
      }
    };

    p.draw_ = () => {};
    p.update = () => {};
    p.after = () => {};

    p.onLeftClick = (x, y) => {};
    p.onRightClick = (x, y) => {};

    // Allow scheduling functions for after next update
    p._postUpdateQueue = [];
    p.schedulePostUpdate = (fn) => {
      p._postUpdateQueue.push(fn);
    }

    p.draw = function () {
      (p.before || (() => before(p)))();
      p.update();

      p._postUpdateQueue.forEach((fn) => {
        fn();
      })
      p._postUpdateQueue = [];

      if (p.mouseActivated()) {
        if ((p.touches.length && p.touches.length < 2) || p.mouseButton === p.LEFT) {
          p.onLeftClick(p.getMousePixelX(), p.getMousePixelY());
        } else {
          p.onRightClick(p.getMousePixelX(), p.getMousePixelY());
        }
      }
      p.draw_();

      p.drawMouse();
      p.after();
    };

    // Mouse position helper functions
    p.mouseXInBounds = () => p.mouseX > 0 && p.mouseX < p.width - 1;
    p.mouseYInBounds = () => p.mouseY > 0 && p.mouseY < p.height - 1;
    p.mouseInBounds = () => p.mouseXInBounds() && p.mouseYInBounds();

    p.mouseActivated = () => (p.mouseIsPressed) && p.mouseInBounds();

    p.getMouseX = () => p.isWEBGL ? p.mouseX - p.width / 2 : p.constrain(p.mouseX, 0, p.width - 1);
    p.getMouseY = () => p.isWEBGL ? p.mouseY - p.height / 2 : p.constrain(p.mouseY, 0, p.height - 1);
    p.getMousePixelX = () => p.floor(p.getMouseX());
    p.getMousePixelY = () => p.floor(p.getMouseY());

    // Mouse drawing helper functions
    p.drawMouse = () => p.drawMouseCircle(2, "#fff");

    p.drawMouseCircle = (radius, color) => {
      if (p.mouseInBounds()) {
        p.fill(color);
        if (color !== Empty.baseColor) {
          p.noStroke();
        } else {
          p.stroke("#fff");
        }
        p.circle(p.getMousePixelX(), p.getMousePixelY(), 2 * radius);
        p.noStroke();
      }
    }

    p.registerMaterials = (materials, fn) => {
      materials.forEach((material) => {
        p.addParticleSwatch(material, () => fn(material));
      });
    }

    p.addClearButton = (clear) => {
      p.addButton("Clear All", p.backgroundColor, clear);
    }

    // Draw a pixel - don't forget to update when done!
    p.setPixel = (i, color) => {
      const index = 4 * i;
      p.pixels[index] = p.red(color);
      p.pixels[index + 1] = p.green(color);
      p.pixels[index + 2] = p.blue(color);
      p.pixels[index + 3] = p.alpha(color);
    };

    p.clearPixels = () => {
      for (let i = 0; i < p.pixels.length / 4; i ++) {
        p.setPixel(i, p.backgroundColor);
      }
    }

    // Add some lightness variation to the color
    p.varyColor = (color, options = {satFn: () => p.random(-20, 0), lightFn: () => p.random(-10, 10)}) => {
      let hue = p.floor(p.hue(color));
      let saturation = p.constrain(p.saturation(color) + p.floor(options.satFn()), 0, 100);
      let lightness = p.constrain(p.lightness(color) + p.floor(options.lightFn()), 0, 100);
      return p.color(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    };

    if (fn) {
      fn(p);
    }

    p.windowResized = () => {
      p.setZoom(p.calculateZoom());
    };

  }, id);
}

function choose(array, weights) {
  if (array.length !== weights.length) {
    throw new Error("Array and weights must be the same length");
  }
  const sum = weights.reduce((sum, a) => sum + a, 0);
  const normalized = weights.map((w) => w / sum);
  const random = Math.random();
  for (let i = 0; i < array.length; i++) {
    if (random < normalized[i]) {
      return array[random];
    }
  }
  return array[array.length - 1];
}

class Logic {
  logic(p, grid) {}
}

function makeLogic(logic, mapType, {before} = {}) {
  return (p) => {
    (before ?? ((_) => {}))(p);
    new logic().logic(p, new mapType());
  }
}
