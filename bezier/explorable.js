// after importing `bezier-sketch.js`, set up sketches.

/* ---------------------------------------------------------------------------
 * section 1
 */

interactiveBezierSketchFactory('p5-container-1', 
  [new CubicBezier(100,100, 300,300, 100,300, 300,200)],
  'Below is a single cubic Bezier curve.',
  'Drag the points around to get a sense for how different configurations change the shape.<p>You can think of the control points (cp1, cp2) as "pulling" the curve more toward them.</p>',
);

bezierSketchFactory('p5-container-1',
  // p5 setup function
  function(p) {
    this.addControl('p1x', p.createInput(100), 'point1.x');
    this.addControl('p1y', p.createInput(100), 'point1.y');
    this.addControl('cp1x', p.createInput(100), 'controlPoint1.x');
    this.addControl('cp1y', p.createInput(300), 'controlPoint1.y');
    this.addControl('p2x', p.createInput(300), 'point2.x');
    this.addControl('p2y', p.createInput(300), 'point2.y');
    this.addControl('cp2x', p.createInput(300), 'controlPoint2.x');
    this.addControl('cp2y', p.createInput(200), 'controlPoint2.y');
    _.each(this.controls, (ctrl) => {
      ctrl.style('width', '50px');
    });

    this.defaultStyles = _.cloneDeep(this.styles);
    // updates styles to show or hide control points & lines, based on current state of checkboxes
    this.bind('updateStyles', function() {
      if (this.controls.showPoints.checked()) {
        this.styles.anchorPoint = this.defaultStyles.anchorPoint;
        this.styles.controlPoint = this.defaultStyles.controlPoint;
      } else {
        this.styles.anchorPoint = this.styles.controlPoint = null;
      }
    });
    this.styles.controlLine = null;

    this.addControl('showPoints', p.createCheckbox('Show points', false), '')
      .changed(this.updateStyles);
    this.updateStyles();
  },
  // p5 draw function
  function(p) {
    p.background(180);

    // Get coordinates out of inputs and draw the Bezier curve, with no frills.
    const ctrls = this.controls;
    let vals = _.map(
      ['p1x', 'p1y', 'cp1x', 'cp1y', 'cp2x', 'cp2y', 'p2x', 'p2y'], 
      function(name) { return parseFloat(ctrls[name].value()); }
    );
    this.drawBezier(
      new p5.Vector(vals[0], vals[1]),
      new p5.Vector(vals[2], vals[3]),
      new p5.Vector(vals[4], vals[5]),
      new p5.Vector(vals[6], vals[7]),
    );
  },
  "Beziers are much more annoying to define if you're a programmer working in code instead of using a nice visual interface! Try it below.",
  "This canvas does not have mouse interaction implemented. It's a simulation of my deeply frustrating experience figuring out how to build the interface you see on this page!",
);

