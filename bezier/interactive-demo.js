// after importing `bezier-sketch.js`, set up interactive sketches.

/* ---------------------------------------------------------------------------
 * START test interactive extension
 */

interactiveBezierSketchFactory('p5-container', 
  new CubicBezier(100,100, 200,200, 100,150, 150,100),
  'Below is a single cubic Bezier curve. Click and drag the points to get a sense for how different configurations change the shape.',
);

/* Multiple curves in one canvas */
interactiveBezierSketchFactory('p5-container', 
  [
    new CubicBezier(100,100, 300,300, 100,300, 300,200),
    new CubicBezier(300,200, 300,300, 100,300, 300,300),
  ],
  'Below are two cubic Bezier curves. Click and drag the points to change them.',
);

