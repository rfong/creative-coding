// Set lodash template delimiters to Mustache {{ }} style.
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;


/* p5 instance wrapper with bezier convenience functionality */
class BezierSketch {
  constructor(htmlElementId, p, setupFn, drawFn) {
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
      setupFn.bind(this)();
    }

		// Set `draw` function on p5 instance and bind its scope to `this`
    p.draw = drawFn.bind(this);
  }

	// Bind a third-party function to `this`
	bind(fnName, fn) {
		this[fnName] = fn.bind(this);
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

  // Helper that draws a cubic Bezier and accepts 2d vectors
  drawBezier(p1,p2, cp1,cp2) {
    let p = this.p;

    p.bezier(
      p1.x,p1.y,
      cp1.x,cp1.y,
      cp2.x,cp2.y,
      p2.x,p2.y,
    );
    
    if (!this.isDebug()) return;
    
    // Visualize anchor points
    this.drawPoint(p1);
    this.drawPoint(p2);
    
    // Visualize control points
    p.push();  // start new draw state
    p.fill(255,255,255);
    p.stroke(255,255,255);
    
    this.drawPoint(cp1);
    p.line(p1.x,p1.y,cp1.x,cp1.y);
    
    this.drawPoint(cp2);
    p.line(p2.x,p2.y,cp2.x,cp2.y);
    
    p.pop();  // finish draw state
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
    this.p.circle(point.x,point.y,5);
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

// Factory to create a new bezier sketch attached to `htmlElementId` container
let bezierSketchFactory = (htmlElementId) => {
  return new p5((p) => {
    let sketch = new BezierSketch(htmlElementId, p, setup, draw);

		// p5 setup function
    function setup() {
    	const PI=p.PI;

      // setup controls
      this.addControl(
        'fit', p.createSlider(0, PI/2, PI/4, PI/180), 'Curve fit',
      ).style('width', '100px');

      this.addControl(
        'radius', p.createSlider(5, 100, 50), 'Radius',
      ).style('width', '100px');

			this.addControl('debug', p.createCheckbox('DEBUG', true), '');
			sketch.bind('isDebug', function() {return this.controls.debug.checked()});			
    }

		// p5 draw function
    function draw() {
      p.background(0);

			const w = p.width/2,
						h = p.height/2,
						radius = this.controls.radius.value(),
						theta = this.controls.fit.value();
      
      // set (0,0) to center of canvas
      p.translate(w,h);
      
      // some grid lines for reference
      p.stroke(100,100,100);
      p.line(-w,0,w,0);
      p.line(-w,50,w,50);
      p.line(-w,100,w,100);
      p.line(-w,150,w,150);
      
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

  });
};

bezierSketchFactory("p5-canvas-1");
bezierSketchFactory("p5-canvas-2");
