import numpy as np
import random
import time

x = np.ones((3,4))
print("Printing from Python", x)


class Image():

  def __init__(self, data, height, width):
    self.h = height
    self.w = width
    n = height*width
    # Drop alpha value and shape into array of RGB pixels (n, 3)
    self.data = np.array(data, dtype=np.uint8).reshape(n, 4)[:, :3]

  def get_greyscale_mat(self):#, inv=False):
    """
    Get a 2d matrix containing just the greyscale values at each RGBA pixel,
    in range [0,255]. This operation does not modify the class attribute data.
    #TODO: If inv=True, the values are flipped so that black=high and white=low.
    """
    return np.amax(self.data, 1).reshape((self.h, self.w))

def generateRGBA(h, w):
  """
  Generate a 1D array of length h*w*4 representing RGBA data, with 
  all alpha values set to max.
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
  print("begin main")
  now = time.time()
  data = generateRGBA(600,800)
  print("elapsed: %.2f sec" % (time.time()-now))

  now = time.time()
  im = Image(data, 600, 800)
  print(im.get_greyscale_mat())
  print("elapsed: %.2f sec" % (time.time()-now))
  # This takes 0.1-0.25 seconds.
