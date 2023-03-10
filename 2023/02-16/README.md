prompt: Standing silently in the quiet snowfall
p5 draft: https://editor.p5js.org/rfong/sketches/oG5PsyK_-

# TODO

## Game state
- [ ] export to file
- [ ] encode to URLparam? (small screens only)

## Liquid behavior
- [ ] water should equalize/flow much faster than sand. implementation ideas:
  - friction?
  - move all contiguous blocks of liquid at once?
  - more steps per update for liquids?
- [ ] water should flatten out stably
  - right now, there is a sawtooth effect where the gaps jitter back and forth forever.
- [ ] when water is poured on top of sand, it should shift around. how to model the underlying behavior?
  - [ ] sand should fall through water. implement density
