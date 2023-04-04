// after importing `bezier-sketch.js`, set up interactive sketches.

/* ---------------------------------------------------------------------------
 * START test interactive extension
 */

interactiveBezierSketchFactory('p5-container', 
  new CubicBezier(100,100, 200,200, 100,150, 150,100),
  'Click and drag the points to manipulate the Bezier curve.',
  'Bezier curves feel more intuitive when you have an interactive UI that visualizes the control vectors and lets you drag the points around to get a sense of their behavior in different configurations.',
);


