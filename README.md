# Earth Explorer

An interactive 3D Earth globe and Solar System explorer built with React Three Fiber.

## Features

- **Real-time Earth** — day/night line, seasons, axial tilt and city lights match the simulated date
- **Time travel** — run time from real time to a year per second, forward or backward, or pick any date
- **Places** — search countries and ~1,250 cities, or click the globe to pin a spot and see local solar
  time, sunrise and sunset, and country facts
- **Live ISS** — optional marker showing the International Space Station's current position
- **Solar System explorer** — planets on their real orbits, with labels; the camera follows the body you pick
- **Earth-Moon-Sun view** — a teaching model with the real Moon phase and season
- **Share links** — copy a link to the current view, moment and pin

## Tech Stack

- Vite + React 19 + TypeScript
- Three.js
- React Three Fiber (@react-three/fiber)
- @react-three/drei (helpers and abstractions)
- @react-spring/three (animations)
- @react-three/postprocessing (visual effects)
- Vitest + Playwright

## Development

```bash
npm install
npm run dev        # Start dev server
npm run build      # Production build
npm run check      # Lint, typecheck, test, format
npm run test:e2e   # Playwright end-to-end tests
```

## Credits

Planet and Moon textures are from [Solar System Scope](https://www.solarsystemscope.com/textures/)
(based on NASA imagery), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/),
via Wikimedia Commons.

The Pluto texture is derived from the New Horizons global mosaic (NASA / JHUAPL / SwRI, via
USGS Astrogeology; public domain). It has been tinted, and the southern region New Horizons never
imaged has been filled with a neutral tone.

Country borders, country details and city locations come from [Natural Earth](https://www.naturalearthdata.com/)
(public domain). The live ISS position is provided by [wheretheiss.at](https://wheretheiss.at/).
