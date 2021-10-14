import json
import time

import numpy as np
from PIL import Image as PILImage

class Image():

  def __init__(self, data, height, width):
    """
    `data` is a 1D array of uint8 values representing height*width RGBA pixels.
    """
    self.data = data
    self.h = height
    self.w = width
    self.n = height * width

  def get_rgbs(self):
    """
    Drop alpha value and return just RGB values.
    Shape result as (h*w, 3).
    """
    return np.array(self.data, dtype=np.uint8).reshape(self.n, 4)[:, :3]

  def get_bws(self, override_cache=False):#, inv=False):
    """
    Get a numpy 1d arr containing just the greyscale values at each RGBA pixel,
    in range [0,255]. This operation does not modify the class attribute data.
    #TODO: If inv=True, the values are flipped so that black=high and white=low.
    """
    if not hasattr(self, "bws") or not override_cache:
      self.bws = np.amax(self.get_rgbs(), 1)
    return self.bws

  def get_com(self):
    """
    Return coordinates of center of "mass" of the image, in the form (x,y)
    """
    # Divide by 256 to make the numbers more manageable.
    # Our end result will be a ratio anyways.
    data = self.get_bws().reshape(self.h, self.w) / 256.
    m = data.sum()
    cx = (data.sum(axis=0, dtype=np.float32) * np.arange(self.w)).sum()
    cy = (data.sum(axis=1, dtype=np.float32) * np.arange(self.h)).sum()
    return (int(round(cx/m)), int(round(cy/m)))

  def get_output(self):
    start = time_ms()
    # Get just the B&W data
    bws = self.get_bws()
    print("%d ms to get BW data" % (time_ms() - start))

    start = time_ms()
    com = self.get_com()
    print("center", com)
    print("%d ms to get COM" % (time_ms() - start))

    # Convert back to RGBA
    start = time_ms()
    data = np.vstack((bws,bws,bws,255*np.ones(self.n))).transpose()
    print("data shape", data.shape)
    print("%d ms to convert back to RGBA" % (time_ms() - start))
   
    # make the CoM red
    data[com[0]*self.w + com[1]][0] = 255

    start = time_ms()
    data = data.flatten()
    print("%d ms to flatten" % (time_ms() - start))

    start = time_ms()
    data = data.tolist()
    print("%d ms tolist()" % (time_ms() - start))

    return data


def time_ms():
  return time.time_ns() / 1e6

def generateRGBA(h, w):
  """
  Generate a 1D array of length h*w*4 representing RGBA data, with 
  all alpha values set to max.
  Used for testing on the python side, will not be used for E2E result.
  """
  arr = np.concatenate(
    (
      # Generate rand RGB data
      np.random.randint(255, size=(h*w, 3)),
      # Alpha = 255
      255 * np.ones((h*w, 1)),
    ), axis=1,  # Concatenate column-wise
  )
  return np.reshape(arr, (h*w*4, 1))


if __name__ == "__main__":
  rawIm = PILImage.open('test_im.png')
  imData = np.asarray(rawIm)
  im = Image(np.asarray(rawIm), rawIm.size[1], rawIm.size[0])
  print(im)
  output = im.get_output()
