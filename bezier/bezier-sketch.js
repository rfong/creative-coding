// Set lodash template delimiters to Mustache {{ }} style.
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;


/* p5 instance wrapper with bezier convenience functionality */
var BezierSketch = class BezierSketch {

  constructor(p, htmlParentId, setupFn, drawFn, htmlBefore, htmlCaption) {
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
        .append('<div class="caption">'+(htmlCaption ?? '')+'</div>');
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

  // unpack p5.Vector coordinates into an array of numbers.
  unpackPoints(points) {
    const coords = [];
    for (const pt of points) {
      coords.push(pt.x);
      coords.push(pt.y);
    }
    return coords;
  }

  drawBezierShape(pts, cpts) {
    let p = this.p;

    // Draw control points first (underneath)
    this.drawEnv('controlPoint', function(p) {
      for (const cp of cpts)
        this.drawPoint(cp);
    });

    // Draw control lines
    this.drawEnv('controlLine', function(p) {
      // TODO refactor duplicate logic with BezierShape.getControlIndices
      // draw first and last control lines
      this.drawLine(pts[0], cpts[0]);
      this.drawLine(pts[pts.length-1], cpts[cpts.length-1]);
      // all the middle anchor points have two control lines each
      for (let i=1; i<pts.length-1; i++) {
        this.drawLine(pts[i], cpts[2*i-1]);
        this.drawLine(pts[i], cpts[2*i]);
      }
    });

    // Draw bezier line on top
    this.drawEnv('bezierLine', function(p) {
      p.beginShape();
      // Set first anchor point
      p.vertex(pts[0].x, pts[0].y);
      // For remaining anchor points, use `bezierVertex`
      for (let i=1; i<pts.length; i++) {
        p.bezierVertex.apply(p, this.unpackPoints([
          cpts[2*(i-1)],
          cpts[2*(i-1)+1],
          pts[i],
        ]));
      }
      p.endShape();
    });

    // Draw anchor points on top of line
    this.drawEnv('anchorPoint', function(p) {
      for (const pt of pts)
        this.drawPoint(pt);
    });
    
    // Text labels
    this.drawEnv('label', function(p) {
      if (this.styles.anchorPoint != null) {
        for (let i in pts) 
          this.labelPoint(pts[i], 'p'+i);
      }
      if (this.styles.controlPoint != null) {
        for (let i in cpts) 
          this.labelPoint(cpts[i], 'cp'+i);
      }
    });
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

    // Draw anchor points on top of line
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

  // Draw a line between two points
  drawLine(pt1, pt2) {
    this.p.line(pt1.x, pt1.y, pt2.x, pt2.y);
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

// Factory to create a new bezier sketch attached to `htmlParentId` container.
// `setupFn` and `drawFn` both take a p5 instance as their only parameter.
function bezierSketchFactory(htmlParentId, setupFn, drawFn, htmlBefore, htmlCaption) {
  return new p5((p) => {
    new BezierSketch(p, htmlParentId, setupFn, drawFn, htmlBefore, htmlCaption);
  });
};

/* ---------------------------------------------------------------------------
 * START interactive extension
 */

// Data structure to manage a Bezier shape composed of arbitrarily many
// Bezier vertices.
var BezierShape = class BezierShape {
  // `points` and `controlPoints`: nested arrays of (x,y) coords.
  // settings: hash of booleans
  constructor(pts, cpts, settings) {
    this.pts = _.map(pts, (pt) => { return new p5.Vector(pt[0], pt[1]) });
    this.cpts = _.map(cpts, (pt) => { return new p5.Vector(pt[0], pt[1]) });
    settings = settings ?? {};
    this.settings = {
      isSmooth: settings.isSmooth ?? false,
      // If true, control points do not automatically move with anchor points.
      areControlPointsAbsolute: settings.areControlPointsAbsolute ?? false,
    };
  }

  // Sets a point given a name denoting either an anchor or control point,
  // e.g. 'p1' or 'cp2'.
  // Return true if success, false if the point did not exist.
  pointNameRe = new RegExp("^(c?)p([0-9]+)$");
  setPoint(name, val) {
    const matches = name.match(this.pointNameRe);
    if (!matches) return false;
    const ind = parseInt(matches[2]);
    if (matches[1] == "c") {
      if (ind >= this.cpts.length) return false;
      this.setControlPoint(ind, val);
      return true;
    }
    if (ind >= this.pts.length) return false;
    this.setAnchorPoint(ind, val);
    return true;
  }

  // Sets the value of the ith anchor point, respecting settings.
  setAnchorPoint(i, val) {
    // If cpts are absolute, we only need to move the anchor.
    if (this.settings.areControlPointsAbsolute) {
      this.pts[i] = val;
      return;
    }
    // Otherwise, translate the control points along with the anchor.
    let diff = val.sub(this.pts[i]);  // Translation between old and new vals
    for (const cInd of this.getControlIndices(i)) {
      // Apply the same translation directly to ctrl pts
      this.cpts[cInd].add(diff);
    }
    this.pts[i].add(diff);
  }
  // Get a list containing the indices of the control points attached to
  // this indexed anchor point.
  getControlIndices(anchorInd) {
    if (anchorInd==0) return [0];
    if (anchorInd==this.pts.length-1) return [this.cpts.length-1];
    return [2*anchorInd-1, 2*anchorInd];
  }

  // Sets the value of the ith control point
  setControlPoint(i, val) {
    // If smoothness is not enforced, we don't need to change anything else.
    if (!this.settings.isSmooth) {
      this.cpts[i] = val;
      return;
    }
    // Otherwise, we'll rotate the other control point to maintain tangency.
    // Get associated points and indices.
    // TODO(rfong): tangency is not guaranteed when the bezier shape is 
    // instantiated. figure out how to do that
    const aInd = this.getAssociatedAnchorIndex(i),
          cInd = this.getPairedControlIndex(i);
    if (cInd != null) {
      var pt = this.pts[aInd],
          cp1 = this.cpts[i],
          cp2 = this.cpts[cInd];
      // Treating 'pt' as the center, return a p5.Vector pointing to somePoint
      function getVec(somePoint) {
        return p5.Vector.sub(somePoint, pt);
      }
      // Angle by which the first cp was rotated
      const angleDiff = getVec(cp1).angleBetween(getVec(val)),
            dist = pt.dist(cp2),
            cp2Angle = getVec(cp2).heading();
      // New position of cp2
      this.cpts[cInd] = new p5.Vector(
        dist * Math.cos(cp2Angle + angleDiff) + pt.x,
        dist * Math.sin(cp2Angle + angleDiff) + pt.y,
      );
    }

    // Now set cp1 to the requested value
    this.cpts[i] = val;
  }
  // Get the index of the anchor point associated with this control point.
  getAssociatedAnchorIndex(ctrlInd) {
    if (ctrlInd == 0) return 0;
    if (ctrlInd == this.cpts.length-1) return this.pts.length-1;
    return Math.ceil(ctrlInd/2.0);
  }
  // Get the index of the control point paired with this control point, if
  // applicable.
  getPairedControlIndex(ctrlInd) {
    // The start and end control points are alone.
    if (ctrlInd == 0 || ctrlInd == this.cpts.length-1) return null;
    // If it's even, its buddy is -1 down. If it's odd, its buddy is +1 up.
    return ctrlInd%2==0 ? ctrlInd-1 : ctrlInd+1;
  }

  // Add a new Bezier vertex by adding one anchor point and two control points.
  addVertex(pt, cp1, cp2) {
    this.pts.push(pt);
    this.cpts.push(cp1);
    this.cpts.push(cp2);
  }

  // If (x,y) touches one of our points, return <string> name of the instance
  // attribute describing the closest point it touches.
  // 'p1' describes anchor point 1, 'cp1' describes control point 1, etc.
  // Because the points are rendered as circles, need to check if <x,y> is
  // within any of the possible circles of radius `radius`.
  // If no points are touching, return `false`.
  touchesPoint(x, y, radius) {
    let minDist = undefined,
        minInd = undefined,
        i = 0;
    // Loop through all points and capture the smallest distance
    for (const point of this.pts.concat(this.cpts)) {
      const d = point.dist(new p5.Vector(x,y));
      if (minDist == undefined || d < minDist) {
        minDist = d;
        minInd = i;
      }
      i++;
    }
    // If within `radius` of <x,y>, return the name of the closest point.
    if (minDist <= radius) {
      if (minInd < this.pts.length) { return "p"+minInd; }
      return "cp"+(minInd-this.pts.length);
    }
    // If nothing met the criteria, return `false`.
    return false;
  }
}

// Interactive extension of BezierSketch that tracks a collection of beziers,
// and allows for click-and-drag modification of beziers.
var InteractiveBezierSketch = class InteractiveBezierSketch extends BezierSketch {

  // `bezier` is a BezierShape instance
  constructor(p, htmlParentId, beziers, htmlBefore, htmlCaption, settings) {
    settings = settings ?? {};
    settings = {
      background: settings.background ?? '#aaa',
    };

    super(p, htmlParentId,
      // p5 setup function
      function(p) {
        this.setupHandlers(p);
        this.htmlSelect('canvas').style('cursor', 'pointer');
      },
      // p5 draw function
      function(p){
        p.background(this.settings.background);
        // Draw all beziers we are tracking
        for (const bez of this.beziers) {
          this.drawBezierShape(bez.pts, bez.cpts);
        }
      },
      htmlBefore, htmlCaption,
    );
    this.beziers = beziers;
    this.settings = settings;
  }

  /* START mouse event handlers */
  draggedPoint = null;  // track the point currently being dragged

  setupHandlers(p) {
    p.getMouseX = () => (
      p.isWEBGL ? p.mouseX - p.width / 2 : p.constrain(p.mouseX, 0, p.width - 1));
    p.getMouseY = () => (
      p.isWEBGL ? p.mouseY - p.height / 2 : p.constrain(p.mouseY, 0, p.height - 1));
    p.mouseDragged = () => {
      // If `draggedPointName` is currently registered, make it follow the mouse.
      const pt = this.draggedPoint;
      if (pt) {
        this.beziers[pt.bezIndex].setPoint(
          pt.pointName,
          new p5.Vector(p.getMouseX(), p.getMouseY())
        );
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
            pointName: touchedName,
            bezIndex: i,
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
function interactiveBezierSketchFactory(htmlParentId, beziers, htmlBefore, htmlCaption, settings) {
  return new p5((p) => {
    new InteractiveBezierSketch(p, htmlParentId, beziers, htmlBefore, htmlCaption, settings);
  });
};

// Factory to wrap a p5 instantiation
function p5SketchFactory(wrapperClass, ...args) {
  return new p5((p) => {
    new window[wrapperClass](p, ...args);
  });
}
