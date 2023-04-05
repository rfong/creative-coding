// after importing `bezier-sketch.js`, set up sketches.

/* ---------------------------------------------------------------------------
 * section 1
 */

interactiveBezierSketchFactory('p5-container-1', 
  [
    new BezierShape(
      [[100,100], [300,300]],
      [[100,300], [300,200]],
      {
        areControlPointsAbsolute: true,
        isSmooth: false,
      },
    ),
  ],
  // preface
  `
  Below is a single cubic Bezier curve.
  Drag the points around to get a sense for how different configurations change the shape.
  `,
  // caption
  `
  The <b>"anchor points" (p0 and p1)</b> are the endpoints that the curved line must pass through.
  <p>You can think of the <b>"control points" (cp0 and cp1)</b> as "pulling" the curve more toward them.</p>
  `,
  {background: '#b4b4ff'},
);

bezierSketchFactory('p5-container-1',
  // p5 setup function
  function(p) {
    this.addControl('p0x', p.createInput(100), 'point0.x');
    this.addControl('p0y', p.createInput(100), 'point0.y');
    this.addControl('cp0x', p.createInput(100), 'controlPoint0.x');
    this.addControl('cp0y', p.createInput(300), 'controlPoint0.y');
    this.addControl('p1x', p.createInput(300), 'point1.x');
    this.addControl('p1y', p.createInput(300), 'point1.y');
    this.addControl('cp1x', p.createInput(300), 'controlPoint1.x');
    this.addControl('cp1y', p.createInput(200), 'controlPoint1.y');
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

    // Checkbox toggle to show or hide points
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
      ['p0x', 'p0y', 'p1x', 'p1y', 'cp0x', 'cp0y', 'cp1x', 'cp1y'],
      function(name) { return parseFloat(ctrls[name].value()); }
    );
    this.drawBezierShape(
      [new p5.Vector(vals[0],vals[1]), new p5.Vector(vals[2],vals[3])],
      [new p5.Vector(vals[4],vals[5]), new p5.Vector(vals[6],vals[7])],
    );
  },
  // preface
  "B-curves are much more annoying to define if you're a programmer working in code instead of using a nice visual interface! Here's a simulation of my deeply frustrating experience figuring out how to build the sketches on this page.",
  // caption
  "This canvas does not have mouse interaction implemented.",
);

/* ---------------------------------------------------------------------------
 * section 2
 */

/* Sketch with 2 chained cubics */
interactiveBezierSketchFactory('p5-container-2',
  [
    new BezierShape(
      [[50,50], [200,200], [350,350]],
      [[50,200], [200,100], [200,300], [350,250]],
      {areControlPointsAbsolute: true},
    ),
  ],
  // preface
  `What if we chained together multiple cubic Beziers to make a more complex contour? Try playing with this new shape.`, 
  // caption
  `
    Move the points around and try to make an elegant new shape.
    <p>You might notice that it\'s hard to move <b>p1</b> without completely changing the character of the curve.</p>
  `,
  {background: '#82ace0'},
);

/* Sketch where control points follow anchors, but tangency is not fixed */
interactiveBezierSketchFactory('p5-container-2',
  [
    new BezierShape(
      // Move p1 over a little to illustrate the difference
      [[50,50], [150,200], [350,350]],
      [[50,200], [150,100], [150,300], [350,250]],
    ),
  ],
  // preface
  `In this sketch, control points will follow their associated anchor points. Try moving <b>p1</b> now.`,
  // caption
  `
  Now that the control points move with the anchor points, it's easier to drag <b>p1</b> to make incremental tweaks to the shape without completely changing its character.
  <p>Notice that it's still hard to move the central control points <b>cp1</b> and <b>cp2</b> without completely changing the character of the curve. This makes it hard to change the central tilt while keeping the shape smooth in the middle.</p>
  `,
  {background: '#6bd6c7'},
);

/* Sketch where control points follow anchors and tangency is fixed */
interactiveBezierSketchFactory('p5-container-2',
  [
    new BezierShape(
      [[50,50], [200,200], [350,350]],
      // Rotate the central control handle to illustrate the difference
      [[50,200], [250,100], [150,300], [350,250]],
      {isSmooth: true},
    ),
  ],
  // preface
  `If you want the contour to stay smooth in the middle, then pairs of control lines must make a straight, continuous handle.`,
  // caption
  `
  In this example, the two control points on either side of <b>p1</b> are fixed to each other to form a single straight control handle. This keeps the curve smooth at <b>p1</b>.
  <p>Note that you can still change the length of each control handle if you want to change how aggressive the curve is on either side.</p>
  `,
  {background: '#82bf86'},
);

