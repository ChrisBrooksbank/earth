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
