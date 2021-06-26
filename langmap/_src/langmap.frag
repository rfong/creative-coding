// This is a GLSL fragment shader that displays a shifting gradient and
// highlights indexed coordinates defined by the user.

// GLSLCanvas provided uniforms.
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

#define PI 3.14159265358979
#define TAU 2.*PI

// User-defined uniforms controlling highlighting.
// Note that GL's (0,0) is in the bottom left.
uniform vec2 u_coordDimensions; // x,y size of a "pixel" in actual pixels
uniform vec3 u_highlightRGB; // RGB float value of highlight color (max=1.0)
#define MAX_COORDS 200
uniform vec2 u_highlightCoords[MAX_COORDS]; // Coordinate to be highlighted (implicit int)
uniform float u_numHighlightCoordsRaw; // Number of coords being passed (implicit int)

// get current number of highlight coords set by user
int getNumCoords() {
  return int(u_numHighlightCoordsRaw);
}

// Return a sinusoidal time-based oscillator normalized to [0.0, 1.0]
float timeOsc(float speedMultiplier) {
  return sin(u_time * speedMultiplier) / 2. + .5;
}

// Normalize output to [0., 1.]
float unitSin(float radians) {
  return sin(radians) / 2. + .5;
}
// Normalize output to [0., 1.]
float unitCos(float radians) {
  return cos(radians) / 2. + .5;
}
// Get FragCoord X and Y normalized to [0., 1.]
float unitX() { return gl_FragCoord.x / u_resolution.x; }
float unitY() { return gl_FragCoord.y / u_resolution.y; }

// Sinusoidally interpolate between 2 colors over time.
// TODO: derive one-line sum of phase-shifted sines?
vec3 interpolateOsc(float v, vec3 color1, vec3 color2) {
  return (
    color1 * unitSin(TAU*(v + u_time/4.)) +
    color2 * unitSin(TAU*(v + u_time/4. + 0.5))
  );
}

float cylindricalShadow(float v) {
  return sin(v * TAU / 2.5);
}

// Get the coordinates of the current "pixel" unit we are inside.
ivec2 getCoord() {
  return ivec2(
    floor(1.0 * gl_FragCoord.x / u_coordDimensions.x),
    floor(1.0 * gl_FragCoord.y / u_coordDimensions.y)
  );
}

bool isHighlighted() {
  ivec2 myCoord = getCoord();
  for (int i=0; i<MAX_COORDS; i++) {
    // Need to break this way bc GLSL doesn't support non-const length loops
    if (i >= getNumCoords()) { break; }
    if (myCoord.x == int(u_highlightCoords[i].x) && myCoord.y == int(u_highlightCoords[i].y)) {
      return true;
    }
  }
  return false;
}

// We'll interpolate between these two colors as the extremes.
const vec3 color1 = vec3(0., 220., 255.)/256.; // teal
const vec3 color2 = vec3(113., 13., 170.)/256.; // indigo

void main() {
  // If current pixel is supposed to be highlighted, hardcode it
  if (isHighlighted()) {
    gl_FragColor = vec4(u_highlightRGB, 1.);
    return;
  }
  // Otherwise, run the oscillating animation
  gl_FragColor = vec4(
    interpolateOsc(unitX(), color1, color2),// * cylindricalShadow(unitY()),
    1.
  );
}
