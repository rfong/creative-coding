// after importing `bezier-sketch.js`, set up interactive sketches.

/* ---------------------------------------------------------------------------
 * START test interactive extension
 */

interactiveBezierSketchFactory('p5-container', 
  new CubicBezier(100,100, 200,200, 100,150, 150,100),
  'Click and drag the points to manipulate the Bezier curve.',
);


