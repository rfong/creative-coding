// after importing `bezier-sketch.js`, set up interactive sketches.

// Factory to create a new interactive bezier sketch.
// Parameter specifications similar to above.
function interactiveBezierSketchFactory(htmlElementId, bezier, htmlBefore, htmlAfter) {
  return new p5((p) => {
    new InteractiveBezierSketch(htmlElementId, p, bezier, htmlBefore, htmlAfter);
  });
};

/* ---------------------------------------------------------------------------
 * START test interactive extension
 */

interactiveBezierSketchFactory('p5-container', 
  new CubicBezier(100,100, 200,200, 100,150, 150,100),
  'Click and drag the points to manipulate the Bezier curve.'
);
