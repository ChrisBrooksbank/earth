# CLAUDE.md

## Project Overview

Earth Explorer — an interactive 3D Earth globe and Solar System explorer. Realistic Earth rendering with atmosphere and day/night cycle, plus Solar System navigation.

## Tech Stack

- Vite + React + TypeScript
- Three.js + React Three Fiber (R3F)
- @react-three/drei (R3F helpers)
- @react-spring/three (3D animations)
- @react-three/postprocessing (bloom, AO, depth of field)
- Vitest + Playwright

## Development Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run check        # Lint + typecheck + test + format
npm run test:e2e     # Playwright e2e tests
```

## Architecture

- `src/components/` — R3F scene components (Earth, Planets, Stars, etc.)
- `src/scenes/` — Scene compositions
- `src/hooks/` — Custom React hooks for Three.js interactions
- `public/textures/` — Planet texture maps

## Key Notes

- R3F renders a Three.js scene inside a React component tree
- Use `useFrame` for per-frame animation updates
- `@react-three/drei` provides pre-built helpers (OrbitControls, Stars, Environment, etc.) — check it before writing custom Three.js code
- Postprocessing effects are applied via `@react-three/postprocessing` EffectComposer
