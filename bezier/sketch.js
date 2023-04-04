// Set lodash template delimiters to Mustache {{ }} style.
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;


/* p5 instance wrapper with bezier convenience functionality */
class BezierSketch {

  constructor(htmlElementId, p, setupFn, drawFn, htmlBefore, htmlAfter) {
    this.p = p;
    this.htmlElementId = htmlElementId;
    this.controls = {};

    // Set `setup` function on p5 instance and bind its scope to `this`
    p.setup = () => {
      // Set up canvas and bind to specified element
      let canvas = p.createCanvas(400, 400);
      canvas.parent(htmlElementId);
      // Append empty control panel to end of container
      this.htmlSelect().child(this.p.createDiv().class('controls'));
      // Bind and execute additional setup functionality
      setupFn.bind(this, p)();

      // After the setup function has executed, add before & after html
      $('#'+htmlElementId)
        .prepend('<p>'+(htmlBefore ?? '')+'</p>')
        .append('<p>'+(htmlAfter ?? '')+'</p>');
    }

    // Set `draw` function on p5 instance and bind its scope to `this`
    p.draw = drawFn.bind(this, p);
  }

  // Bind a third-party function to `this`
  bind(fnName, fn) {
    this[fnName] = fn.bind(this);
  }

  /* -------------------------------------------------------------------------
   * p5 style management helpers
   */

  // If undefined, don't change anything (default to current p5 settings)
  styles = {
    bezierLine: {
      fill: null,  // noFill
    },
    anchorPoints: {
      fill: null,  // noFill
      radius: 5,
    },
    controlPoints: {
      fill: [255,255,255],
      stroke: [255,255,255],
      radius: 5,
    },
  };

  setStyles(settingName, fill, stroke, radius) {
    this.styles[settingName] = {
      fill: fill,
      stroke: stroke,
      radius: radius,
    };
  }

  // Run `fn` within a draw state specified in `styles`.
  // `fn`: a function that takes a p5 instance as its only argument.
  // `settingName`: string specifying a top-level key within `this.styles`
  // Example usage:
  //  this.drawEnv(this.styles.bezier, function(p) {...});
  drawEnv(settingName, fn) {
    const p = this.p;
    p.push(); // start new draw state
    this.fill(this.styles[settingName].fill);
    this.stroke(this.styles[settingName].stroke);

    fn.bind(this, p)();  // Run `fn`, letting it know about `this` and `p`

    p.pop();  // finish draw state
  }

  // If defined, use `p.fill(args)`.
  // If null, set `noFill`
  fill(args) {
    if (args===undefined) { return; }
    if (args==null) { this.p.noFill(); }
    else if (args) {
      this.p.fill.apply(this.p, args);
    }
  }

  // If defined, use `p.stroke(args)`
  // If null, set `noStroke`
  stroke(args) {
    if (args===undefined) { return; }
    if (args==null) { this.p.noStroke(); }
    else if (args) {
      this.p.stroke.apply(this.p, args);
    }
  }

  /* -------------------------------------------------------------------------
   * Controllable parameters
   */

  isDebug() { return true; } // Implement me

  /* -------------------------------------------------------------------------
   * HTML helpers
   */

  // Select first match within the html container bound to this instance
  htmlSelect(id) {
    return this.p.select(
      '#'+this.htmlElementId + (id===undefined ? '' : ' ' + id)
    );
  }

  // Add a p5.Element `input` of some kind to the control panel
  addControl(id, ctrlEl, label) {
    let className = id + '-ctrl';
    // Add to instance dict of controls
    this.controls[id] = ctrlEl;
    // Create html container and add to control panel
    this.htmlSelect('.controls').child(this.p.createDiv(
      _.template(`
        <span class="{{className}}"></span>
        <label>{{label}}</label>
      `)({
        className: className,
        label: label,
      })
    ));
    // Set parent as the html container we just created
    ctrlEl.parent(this.htmlSelect('.controls .'+className));
    return ctrlEl;
  }

  /* -------------------------------------------------------------------------
   * Convenience functions for math & drawing
   */

  drawWarpedLine(y,r,theta) {
    let p = this.p,
        PI = p.PI,
        p1 = new p5.Vector(-r*2,y),
        p2 = new p5.Vector(r*2,y);
    
    // draw the unwarped part of the line
    if (p1.x > -p.width/2) {
      p.line(-p.width/2,y,p1.x,y);
    }
    if (p2.x < p.width/2) {
      p.line(p.width/2,y,p2.x,y);
    }
    
    if (this.isDebug()) {
      // draw the start and end points
      this.drawPoint(p1);
      this.drawPoint(p2);
      
      p.push();
      
      // outline the circle we're operating on
      p.noFill();
      p.stroke(0,0,255);
      p.circle(0,0,2*r);
  
      // pick out some points on the orbit
      p.noStroke();
      p.fill(255,0,0);
      // 0 is at bottom of circle, moves CCW
      this.drawPoint(this.getPointOnCircle(r,0));
      this.drawPoint(this.getPointOnCircle(r,PI/2));
      this.drawPoint(this.getPointOnCircle(r,-PI/2));
      
      p.pop();
    }
    
    /*
    // big simple curve
    p.beginShape();
    p.vertex(p1.x,p1.y);
    bezierVertex(-r,2*r, r,2*r, p2.x,p2.y);
    p.endShape();
    */
    
    // bottom arc
    p.arc(0,0,r*2,r*2, -theta+PI/2,theta+PI/2); // theta=0 appears to face right??
    
    // left: smoothly rejoin with the straight line
    this.drawBezier(
      p1,
      this.getPointOnCircle(r, -theta),
      new p5.Vector(p1.x/2-r/2,p1.y),
      this.getPointAlongTangentToCircle(r/2, r, -theta),
    );
    
    // right: smoothly rejoin with the straight line
    this.drawBezier(
      p2,
      this.getPointOnCircle(r, theta),
      new p5.Vector(p2.x/2+r/2,p2.y),
      this.getPointAlongTangentToCircle(-r/2, r, theta),
    );
  }

  // Helper that draws a cubic Bezier with helper visualizations.
  // All arguments are p5.Vector instances.
  drawBezier(p1,p2, cp1,cp2) {
    let p = this.p;

    // Visualize control points first (underneath)
    this.drawEnv('controlPoints', function(p) {
      this.drawPoint(cp1);
      p.line(p1.x,p1.y,cp1.x,cp1.y);
      
      this.drawPoint(cp2);
      p.line(p2.x,p2.y,cp2.x,cp2.y);
    });
    
    // Draw bezier line on top
    this.drawEnv('bezierLine', function(p) {
      p.bezier(p1.x,p1.y, cp1.x,cp1.y, cp2.x,cp2.y, p2.x,p2.y);
    });
    
    if (!this.isDebug()) return;
    
    // Visualize anchor points on top
    this.drawEnv('anchorPoints', function(p) {
      this.drawPoint(p1);
      this.drawPoint(p2);
    });
    
  }
 
  // Helper that adds a `vertex` and accepts 2d vector
  addVertex(point) {
    this.p.vertex(point.x,point.y);
  }

  // Helper that adds a `bezierVertex` and accepts 2d vectors
  addBezierVertex(cp1,cp2,point) {
    this.bezierVertex(cp1.x,cp1.y, cp2.x,cp2.y, point.x,point.y);
  }
  
  // Draw a small-radius circle at the given point
  drawPoint(point, radius) {
    this.p.circle(point.x,point.y,radius ?? 5);
  }
  
  // theta=0 points down
  getPointOnCircle(r, theta) {
    return new p5.Vector(r*this.p.sin(theta), r*this.p.cos(theta));
  }
  
  // d = distance along tangent (left)
  getPointAlongTangentToCircle(d, r, theta) {
    return new p5.Vector(
      r*this.p.sin(theta) - d*this.p.cos(theta),
      r*this.p.cos(theta) + d*this.p.sin(theta),
    );
  }

}
/* ---------------------------------------------------------------------------
 * END BezierSketch class
 */

/* ---------------------------------------------------------------------------
 * START set up test visualization
 */

// Factory to create a new bezier sketch attached to `htmlElementId` container.
// `setupFn` and `drawFn` both take a p5 instance as their only parameter.
// `htmlAfter` and `htmlBefore` take paragraph content to prepend and append to 
//   the container, respectively.
function bezierSketchFactory(htmlElementId, setupFn, drawFn, htmlBefore, htmlAfter) {
  return new p5((p) => {
    new BezierSketch(htmlElementId, p, setupFn, drawFn, htmlBefore, htmlAfter);
  });
};

// Factory to create a new interactive bezier sketch.
// Parameter specifications similar to above.
function interactiveBezierSketchFactory(htmlElementId, bezier, htmlBefore, htmlAfter) {
  return new p5((p) => {
    console.log("interactive factory");
    new InteractiveBezierSketch(htmlElementId, p, bezier, htmlBefore, htmlAfter);
  });
};

// Canvas 1
bezierSketchFactory('p5-canvas-1',
  // p5 setup function
  function(p) {
    const PI=p.PI;

    // setup controls
    this.addControl(
      'fit', p.createSlider(0, PI/2, PI/4, PI/180), 'Curve fit',
    ).style('width', '100px');

    this.addControl(
      'radius', p.createSlider(5, 100, 50), 'Radius',
    ).style('width', '100px');

    this.addControl('debug', p.createCheckbox('DEBUG', true), '');
    this.bind('isDebug', function() {return this.controls.debug.checked()});      
  },
  // p5 draw function
  function(p) {
    p.background(0);

    const w = p.width/2,
          h = p.height/2,
          radius = this.controls.radius.value(),
          theta = this.controls.fit.value();
    
    // set (0,0) to center of canvas
    p.translate(w,h);
    
    // some grid lines for reference
    /*
    p.stroke(100,100,100);
    p.line(-w,0,w,0);
    p.line(-w,50,w,50);
    p.line(-w,100,w,100);
    p.line(-w,150,w,150);
    */
    
    // draw the central sphere
    p.noStroke();
    p.fill(255,255,255);
    p.circle(0,0,2*radius);
    
    // draw the warped lines
    p.noFill();
    p.stroke(0, 255, 0);
    for (let i=0; i<3; i++) {
      this.drawWarpedLine(20*i, radius+25*(i+1), theta);
    }
  }
);

// Canvas 2
bezierSketchFactory('p5-canvas-2',
  // p5 setup function
  function(p) {},
  // p5 draw function
  function(p) {
    p.background(255,0,0);

    p.stroke(0,0,255);  // Set line stroke
    this.setStyles('controlPoints', [0,255,0], [0,255,0]);
    this.drawBezier(
      // anchor points
      new p5.Vector(100,100),
      new p5.Vector(200,200),
      // control points
      new p5.Vector(100,150),
      new p5.Vector(150,100),
    );
  },
  // html before
  `before`,
  // html after
  `after`,
);

/* ---------------------------------------------------------------------------
 * START interactive extension
 */

// Data structure to store coordinates for a cubic Bezier curve.
class CubicBezier {
  // Accepts arguments as:
  // CubicBezier(p1x, p1y, p2x, p2y, cp1x, cp1y, cp2x, cp2y), coordinates
  constructor(p1x, p1y, p2x, p2y, cp1x, cp1y, cp2x, cp2y) {
  //constructor(p1, p2, cp1, cp2) {
    this.p1 = new p5.Vector(p1x, p1y);
    this.p2 = new p5.Vector(p2x, p2y);
    this.cp1 = new p5.Vector(cp1x, cp1y);
    this.cp2 = new p5.Vector(cp2x, cp2y);
  }
}

// Interactive extension of BezierSketch that WILL ALLOW click-and-drag 
// modification of beziers.
class InteractiveBezierSketch extends BezierSketch {

  // `bezier` is a CubicBezier instance
  constructor(htmlElementId, p, bezier) {
    super(htmlElementId, p,
      // p5 setup function
      function(p) {
        this.setupHandlers(p);
      },
      // p5 draw function
      function(p){
        p.background(255,0,0);
        this.drawBezier(this.bezier.p1, this.bezier.p2, this.bezier.cp1, this.bezier.cp2);
      }
    );
    this.bezier = bezier;
  }

  /* START mouse event handlers */
  setupHandlers(p) {
    p.onLeftClick = (x,y) => {
      console.log("click", x, y);
    }
    p.getMouseX = () => (
      p.isWEBGL ? p.mouseX - p.width / 2 : p.constrain(p.mouseX, 0, p.width - 1));
    p.getMouseY = () => (
      p.isWEBGL ? p.mouseY - p.height / 2 : p.constrain(p.mouseY, 0, p.height - 1));
    p.mouseDragged = () => {
      console.log("drag", p.getMouseX(), p.getMouseY());
    }
    p.mousePressed = () => {
      console.log("pressed", p.getMouseX(), p.getMouseY());
    }
  }
  /* END mouse event handlers */
}

/* ---------------------------------------------------------------------------
 * START test interactive extension
 */

// Canvas 3
interactiveBezierSketchFactory('p5-canvas-3', 
  new CubicBezier(100,100, 200,200, 100,150, 150,100),
);
