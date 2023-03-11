prompt: Standing silently in the quiet snowfall
p5 draft: https://editor.p5js.org/rfong/sketches/oG5PsyK_-

# TODO

## Game state
- [ ] export to file
- [ ] encode to URLparam? (small screens only)

## Liquid behavior
- [x] water should flatten out, i.e. flow sideways and not just downward.
  - [ ] water should flatten out stably. right now, there is a sawtooth effect where the gaps jitter back and forth forever. idea: use up the modulus via adhesion to nearest solids
- [x] sand should fall through water
  - [ ] implement more nuanced density -- right now we just let solids fall through liquids
- [ ] water level equilibrium
  - simulate pressure of a noncompressible fluid?
  - compute all contiguous regions of the same fluid?
- [x] water should equalize/flow much faster than sand. implementation ideas:
  - friction?
  - move all contiguous blocks of liquid at once?
  - more steps per update for liquids?
- [ ] things can currently "fall" through a diagonal in an otherwise contiguous barrier -- do I care about that
