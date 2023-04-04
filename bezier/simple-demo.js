// after importing `bezier-sketch.js`, set up some simple non-interactive sketches.

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

