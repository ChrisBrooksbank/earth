# Earth Explorer

An interactive 3D Earth globe and Solar System explorer built with React Three Fiber.

## Features

- **3D Earth globe** — Realistic rendering with atmosphere, clouds, and day/night cycle
- **Solar System explorer** — Navigate between planets and moons
- **Interactive controls** — Click, drag, zoom to explore
- **Post-processing effects** — Bloom, ambient occlusion, and depth of field

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
