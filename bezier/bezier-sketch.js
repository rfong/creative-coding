// Set lodash template delimiters to Mustache {{ }} style.
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;


/* p5 instance wrapper with bezier convenience functionality */
class BezierSketch {

  constructor(htmlParentId, p, setupFn, drawFn, htmlBefore, htmlAfter) {
    this.p = p;
    this.htmlParentId = htmlParentId;
    this.controls = {};

    // Set `setup` function on p5 instance and bind its scope to `this`
    p.setup = () => {
      // Append a new container to the parent.
      this.htmlContainer = p.createDiv().class('p5').parent(htmlParentId);
      // Set up canvas and bind to container
      let canvas = p.createCanvas(400, 400);
      canvas.parent(this.htmlContainer);
      // Append empty control panel to end of container
      this.htmlSelect().child(
        this.p.createDiv().class('controls').style('display', 'none'));
      // Bind and execute additional setup functionality
      setupFn.bind(this, p)();

      // After the setup function has executed, add before & after html
      $(this.htmlContainer.elt)
        .prepend('<p>'+(htmlBefore ?? '')+'</p>')
        .append('<div class="caption">'+(htmlAfter ?? '')+'</div>');
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

  POINT_RADIUS = 5;

  // If undefined, don't change anything (default to current p5 settings)
  styles = {
    label: {
      xOff: 8,
      yOff: 3,
      fill: [255,255,255],
      stroke: null,
    },
    bezierLine: {
      fill: null,  // noFill
    },
    anchorPoint: {
      fill: [255,255,255],
    },
    controlLine: {
      stroke: [255,255,255],
    },
    controlPoint: {
      fill: [255,255,255],
      stroke: [255,255,255],
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
    // If the whole style is null, skip the drawing entirely to save time.
    if (this.styles[settingName] == null) return;

    // Otherwise, start a new draw state and execute `fn` inside of it.
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
    if (id==undefined) {
      return this.htmlContainer;
    }
    return this.p.select(id, this.htmlContainer);
  }

  // Add a p5.Element `input` of some kind to the control panel
  addControl(id, ctrlEl, label) {
    let className = id + '-ctrl';
    // Add to instance dict of controls
    this.controls[id] = ctrlEl;
    // Create html container and add to control panel
    this.htmlSelect('.controls')
      .style('display', 'inline-block')
      .child(this.p.createDiv(
        _.template(`
          <span class="{{className}}"></span>
          <label>{{label}}</label>
        `)({
          className: className,
          label: label,
        })
      )
    );
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
    this.drawEnv('controlPoint', function(p) {
      this.drawPoint(cp1);
      this.drawPoint(cp2);
    });

    this.drawEnv('controlLine', function(p) {
      p.line(p1.x,p1.y,cp1.x,cp1.y);
      p.line(p2.x,p2.y,cp2.x,cp2.y);
    });
    
    // Draw bezier line on top
    this.drawEnv('bezierLine', function(p) {
      p.bezier(p1.x,p1.y, cp1.x,cp1.y, cp2.x,cp2.y, p2.x,p2.y);
    });
    
    if (!this.isDebug()) return;

    // Visualize anchor points on top
    this.drawEnv('anchorPoint', function(p) {
      this.drawPoint(p1);
      this.drawPoint(p2);
    });
    
    // Text labels
    this.drawEnv('label', function(p) {
      if (this.styles.anchorPoint != null) {
        this.labelPoint(p1, 'p1');
        this.labelPoint(p2, 'p2');
      }
      if (this.styles.controlPoint != null) {
        this.labelPoint(cp1, 'cp1');
        this.labelPoint(cp2, 'cp2');
      }
    });

  }

  // Helper that draws a label near a point
  labelPoint(point, label) {
    const ts = this.styles.label;
    if (ts) {
      this.p.text(label, point.x + ts.xOff, point.y + ts.yOff);
    }
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
  drawPoint(point) {
    this.p.circle(point.x,point.y, this.POINT_RADIUS);
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

// Factory to create a new bezier sketch attached to `htmlElementId` container.
// `setupFn` and `drawFn` both take a p5 instance as their only parameter.
// `htmlAfter` and `htmlBefore` take paragraph content to prepend and append to 
//   the container, respectively.
function bezierSketchFactory(htmlElementId, setupFn, drawFn, htmlBefore, htmlAfter) {
  return new p5((p) => {
    new BezierSketch(htmlElementId, p, setupFn, drawFn, htmlBefore, htmlAfter);
  });
};

/* ---------------------------------------------------------------------------
 * START interactive extension
 */

// Data structure to manage a cubic Bezier curve.
class CubicBezier {
  // Accepts arguments as:
  // CubicBezier(p1x, p1y, p2x, p2y, cp1x, cp1y, cp2x, cp2y), coordinates
  constructor(p1x, p1y, p2x, p2y, cp1x, cp1y, cp2x, cp2y) {
    this.p1 = new p5.Vector(p1x, p1y);
    this.p2 = new p5.Vector(p2x, p2y);
    this.cp1 = new p5.Vector(cp1x, cp1y);
    this.cp2 = new p5.Vector(cp2x, cp2y);
  }

  getPointNames() { return ['p1', 'p2', 'cp1', 'cp2']; }
  getPoints() { return [this.p1, this.p2, this.cp1, this.cp2]; }

  // If (x,y) touches one of our points, return <string> name of the instance
  // attribute describing the closest point it touches.
  // Because the points are rendered as circles, need to check if <x,y> is
  // within any of the possible circles of radius `radius`.
  // If no points are touching, return `false`.
  touchesPoint(x,y, radius) {
    let minDist = undefined,
        minInd = undefined,
        i = 0;
    // Loop through our points and capture the smallest distance
    for (const point of this.getPoints()) {
      const d = point.dist(new p5.Vector(x,y));
      if (minDist == undefined || d < minDist) {
        minDist = d;
        minInd = i;
      }
      i++;
    }
    // If within `radius` of <x,y>, return the name of the closest point.
    if (minDist <= radius) {
      return this.getPointNames()[minInd];
    }
    // If nothing met the criteria, return `false`.
    return false;
  }
}

// Data structure to manage a Bezier shape composed of arbitrarily many
// Bezier vertices.
class BezierShape extends CubicBezier {
  // Accepts arguments as:
  // CubicBezier(p1x, p1y, p2x, p2y, cp1x, cp1y, cp2x, cp2y), coordinates
  constructor(p1x, p1y, p2x, p2y, cp1x, cp1y, cp2x, cp2y) {
    this.pts = [
      new p5.Vector(p1x, p1y),
      new p5.Vector(p2x, p2y),
    ];
    this.cpts = [
      new p5.Vector(cp1x, cp1y),
      new p5.Vector(cp2x, cp2y),
    ];
  }
  
  // Add a new Bezier vertex by adding one anchor point and two control points.
  addVertex(pt, cp1, cp2) {
    this.pts.push(pt);
    this.cpts.push(cp1);
    this.cpts.push(cp2);
  }
}

// Interactive extension of BezierSketch that tracks a collection of beziers,
// and allows for click-and-drag modification of beziers.
class InteractiveBezierSketch extends BezierSketch {

  // `bezier` is a CubicBezier instance
  constructor(htmlElementId, p, beziers, htmlBefore, htmlAfter) {
    super(htmlElementId, p,
      // p5 setup function
      function(p) {
        this.setupHandlers(p);
      },
      // p5 draw function
      function(p){
        p.background(180,180,255);
        // Draw all beziers we are tracking
        for (const bez of this.beziers) {
          this.drawBezier(bez.p1, bez.p2, bez.cp1, bez.cp2);
        }
      },
      htmlBefore, htmlAfter,
    );
    this.beziers = beziers;
  }

  /* START mouse event handlers */
  draggedPoint = null;  // track the point currently being dragged

  setupHandlers(p) {
    p.onLeftClick = (x,y) => {
      console.log("click", x, y);
    }
    p.getMouseX = () => (
      p.isWEBGL ? p.mouseX - p.width / 2 : p.constrain(p.mouseX, 0, p.width - 1));
    p.getMouseY = () => (
      p.isWEBGL ? p.mouseY - p.height / 2 : p.constrain(p.mouseY, 0, p.height - 1));
    p.mouseDragged = () => {
      // If `draggedPointName` is currently registered, make it follow the mouse.
      const pt = this.draggedPoint;
      if (pt) {
        this.beziers[pt.index][pt.name] = new p5.Vector(p.getMouseX(), p.getMouseY());
      }
    }
    p.mousePressed = () => {
      // If we made contact with a point, register it as being dragged
      for (let i=0; i<this.beziers.length; i++) {
        const bez = this.beziers[i];
        // TODO(rfong): oh no we should actually get the minimum distance over
        // all beziers in stock? maybe the point radius is too small to be
        // noticeable
        const touchedName = bez.touchesPoint(p.getMouseX(), p.getMouseY(), this.POINT_RADIUS);
        if (touchedName) {
          this.draggedPoint = {
            name: touchedName,
            index: i,
          };
        }
      }
    }
    p.mouseReleased = () => {
      // Release dragged point
      this.draggedPoint = null;
    }
  }
  /* END mouse event handlers */
}

/* ---------------------------------------------------------------------------
 * START interactive extension
 */

// Factory to create a new interactive bezier sketch.
// Parameter specifications similar to above.
function interactiveBezierSketchFactory(htmlElementId, beziers, htmlBefore, htmlAfter) {
  return new p5((p) => {
    new InteractiveBezierSketch(htmlElementId, p, beziers, htmlBefore, htmlAfter);
  });
};

