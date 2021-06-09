// Modified from example by https://www.tetoki.eu/asciiart/ to accept ES6
// imports and use p5 instance mode instead of global mode.

import _ from 'lodash';
import p5 from 'p5';
import {AsciiArt} from './lib/p5.asciiart';

p5.prototype.AsciiArt = AsciiArt;

const sketch = (p) => {

/*
  The object that will be responsible for generating ASCII art graphics. The
  object will be derived from the AsciiArt pseudo-class from the p5.asciiart
  library, so remember to add the p5.asciiart library to the project in the
  appropriate html file.
*/
var myAsciiArt;

/*
  The size of generated ASCII graphics expressed in characters and lines.
*/
var asciiart_width = 150; var asciiart_height = 90;

/*
  This table will store several example images that will be converted to the
  ASCII art form.
*/
var images = [];

/*
  Buffer for processed graphics, simplifying some operations. This will be an
  object derived from the p5.Graphics class
*/
var gfx;

/*
  This variable will store a two-dimensional array - "image" in the form of
  ASCII codes.
*/
var ascii_arr;

/*
  A helper variable to store current "circular" time, useful in controlling of
  the cyclic image display.
*/
var cyclic_t;

/*
  Let's load the example images first.
*/
p.preload = function() {
  // "Young man reading by candlelight", Matthias Stom, 1600-1650
  images[0] = p.loadImage('mercator_wrap_transparent.png');
}

p.setup = function() {
  p.createCanvas(1024, 600);
  /*
    In this particular case the gfx helper should have dimensions the same as
    the target graphic.
  */
  gfx = p.createGraphics(asciiart_width, asciiart_height);
  gfx.pixelDensity(2);
  /*
    Here we create an object derived from the AsciiArt pseudo-class from the
    p5.asciiart library.
      new AsciiArt(_sketch);
      new AsciiArt(_sketch, _fontName);
      new AsciiArt(_sketch, _fontName, _fontSize);
      new AsciiArt(_sketch, _fontName, _fontSize, _textStyle);
  */
  myAsciiArt = new AsciiArt(this);
  /*
    After initializing the object, look at (in the console) the listing of the
    array containing the glyphs sorted according to the amount of space
    occupied. This table is the basis for the procedure that converts
    individual image pixels into glyphs.
  */
  myAsciiArt.printWeightTable();
  /*
    Here we set the font family, size and style. By default ASCII Art library
    is using 'monospace' font, so we want to apply the same setting to our
    sketch.
  */
  p.textAlign(p.CENTER, p.CENTER);
  p.textFont('monospace', 8);
  p.textStyle(p.NORMAL);
  p.noStroke();
  p.fill(255);
  /*
    Finally we set the framerate.
  */
  p.frameRate(30);
}

p.draw = function() {
    p.background(0);
    /*
      First, let's calculate which image from the images[] array should now be
      displayed. The floor part of the calculated value will indicate the index
      of the image to be displayed. The decimal part will be used to calculate
      the tint.
    */
    cyclic_t = p.millis() * 0.0002 % images.length;

    // Prepare the image for conversion.
    gfx.image(images[p.floor(cyclic_t)], 0, 0, gfx.width, gfx.height);
    /*
      It is worth experimenting with the value of the parameter defining the
      level of posterization. Depending on the characteristics of the image,
      different values may have the best effect. And sometimes it is worth not
      to apply the effect of posterization on the image.
    */
    gfx.filter(p.POSTERIZE, 3);

    /*The convert() function returns a two-dimensional array of
      characters containing the representation of the converted graphics in the
      form of the ASCII art. If the conversion fails, the function returns
      null
    */
    // Convert to ASCII.
    ascii_arr = myAsciiArt.convert(gfx);
    /*
      Now it's time to show ASCII art on the screen. First, we set drawing
      parametrs. Next, we call the function typeArray2d() embedded in the
      ASCII Art library, that writes the contents of a two-dimensional array
      containing (implicitly) text characters (chars) on the screen. In this
      case, we call a function with 2 parameters: the first is the table
      whose contents we want to print, and the second is the destination (an
      object with "canvas" property). If you use the function with two
      parameters (as we do in this example), it will assume that you need to
      fill the entire surface of the target canvass with a drawing. However,
      the function can be called in 3 variants:
        [AsciiArt instance].typeArray2d(_arr2d, _dst);
        [AsciiArt instance].typeArray2d(_arr2d, _dst, _x, _y);
        [AsciiArt instance].typeArray2d(_arr2d, _dst, _x, _y, _w, _h);
      The parameters are as follows:
        _arr2d - 2-dimentional array containing glyphs (chars)
        _dst - destination (typically the sketch itself)
        _x, _y - coordinates of the upper left corner
        _w, _h - width and height
      It is relatively easy to write your own function that formats the contents
      of an array to ASCII graphics. At the end of this example, I glue the
      function code from a non-minimized version of the library - it can be
      used as a base for your own experiments.
    */
    myAsciiArt.typeArray2d(ascii_arr, this);
    /*
      Finally, let's display the source image, too.
    */
    p.tint(255, p.pow(1.0 - (cyclic_t % 1.0), 4) * 255);
    p.image(images[p.floor(cyclic_t)], 0, 0, p.width, p.height);
    p.noTint();
}

function mouseReleased() {
  /*
    If you want to export the generated ASCII graphics, you can use the built-in
    function convert2dArrayToString() to convert the array of glyphs to a string.
  */
  console.log(myAsciiArt.convert2dArrayToString(ascii_arr));
}

/*
  *****************************************************************************
  ******************************** typeArray2d ********************************
  Slightly reworked part of the original code from the ASCII Art library - you
  can redesign this to suit your needs.
  *****************************************************************************
  A simple function to help us print the ASCII Art on the screen.

  The function prints a two-dimensional array of glyphs and it is used 
  similarly to the standard method of displaying images. It can be used in 
  versions with 2, 4 or 6 parameters.
  - typeArray2d(_arr2d, _dst, _x, _y)
    _w, _h default to the dimensions of _dst, the working space.
  - typeArray2d(_arr2d, _dst)
    _w, _h default as above
    _x, _y default to (0,0), the upper left corner

  Parameters:
  - _arr2d is the two-dimensional array of glyphs,
  - _dst is destination (basically anything with 'canvas' property, such
  as p5js sketch or p5.Graphics).
*/
AsciiArt.prototype.typeArray2d = function(_arr2d, _dst, _x, _y, _w, _h) {
  if(_arr2d === null) {
    console.log('[typeArray2d] _arr2d === null');
    return;
  }
  if(_arr2d === undefined) {
    console.log('[typeArray2d] _arr2d === undefined');
    return;
  }
  switch(arguments.length) {
    case 2: _x = 0; _y = 0; _w = p.width; _h = p.height; break;
    case 4: _w = p.width; _h = p.height; break;
    case 6: // nothing to do
      break;
    default:
      console.log(
        '[typeArray2d] bad number of arguments: ' + arguments.length
      );
      return;
  }
  // Because Safari in macOS seems to behave strangely in the case of multiple
  // calls to the p5js text(_str, _x, _y) method for now I decided to refer
  // directly to the mechanism for handling the canvas tag through the "pure"
  // JavaScript.
  if(_dst.canvas === null) {
    console.log('[typeArray2d] _dst.canvas === null');
    return;
  }
  if(_dst.canvas === undefined) {
    console.log('[typeArray2d] _dst.canvas === undefined');
    return;
  }
  var temp_ctx2d = _dst.canvas.getContext('2d');
  if(temp_ctx2d === null) {
    console.log('[typeArray2d] _dst canvas 2d context is null');
    return;
  }
  if(temp_ctx2d === undefined) {
    console.log('[typeArray2d] _dst canvas 2d context is undefined');
    return;
  }
  temp_ctx2d.fillStyle = "cyan";
  var dist_hor = _w / _arr2d.length;
  var dist_ver = _h / _arr2d[0].length;
  var offset_x = _x + dist_hor * 0.5;
  var offset_y = _y + dist_ver * 0.5;
  for(var temp_y = 0; temp_y < _arr2d[0].length; temp_y++)
    for(var temp_x = 0; temp_x < _arr2d.length; temp_x++)
      temp_ctx2d.fillText(
        _arr2d[temp_x][temp_y],
        offset_x + temp_x * dist_hor,
        offset_y + temp_y * dist_ver
      );
}

}; // end sketch

let p = new p5(sketch, 'p5');
