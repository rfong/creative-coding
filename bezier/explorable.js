// after importing `bezier-sketch.js`, set up sketches.

interactiveBezierSketchFactory('p5-container', 
  new CubicBezier(100,100, 300,300, 100,300, 300,200),
  'Below is a single cubic Bezier curve. Click and drag the points to change it.',
);

bezierSketchFactory('p5-container',
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
        this.styles.anchorPoint = this.styles.controlPoint = {
          fill: null,
          stroke: null,
        };
      }
      this.styles.controlLine = (
        this.controls.showTangents.checked() ?
        this.defaultStyles.controlLine :
        {
          fill: null,
          stroke: null,
        }
      );
    });

    this.addControl('showPoints', p.createCheckbox('Show points', false), '')
      .changed(this.updateStyles);
    this.addControl('showTangents', p.createCheckbox('Show tangents', false), '')
      .changed(this.updateStyles);
    this.updateStyles();
  },
  // p5 draw function
  function(p) {
    p.background(200,200,200);

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
  "Beziers are much less intuitive if you're working purely in code! Try making the Bezier curve you want just by typing in coordinates. (The canvas below does not allow clicking and dragging.)",
);

