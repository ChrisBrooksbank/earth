# AGENTS.md - Operational Guide

Keep this file under 60 lines. It's loaded every iteration.

## Build Commands

```bash
npm run build          # Production build (Vite + TypeScript)
npm run dev            # Development server
```

## Lint Commands

```bash
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
```

## Test Commands

```bash
npm test               # Run Vitest (watch mode)
npm run test:run       # Run Vitest once
```

## Formatting

```bash
npm run format:check   # Check formatting
npm run format         # Auto-fix formatting
```

## Validation (run before finishing each iteration)

```bash
npm run build && npm run lint
```

## Full Check (all guard rails)

```bash
npm run check          # typecheck + lint + format:check + tests
```

## Tech Stack

- React 19 + TypeScript + Vite
- Three.js + React Three Fiber + @react-three/drei
- @react-three/postprocessing (Bloom)
- Zustand (state management)
- @react-spring/three (camera transitions)
- Tailwind CSS (UI styling)
- Custom GLSL shaders (vite-plugin-glsl)

## Project Notes

- See plan.md for full architecture and phase details
- Earth textures: 8K day, 4K night/clouds, 2K bump/specular
- Scale strategy: log distances, power-law radii ("Museum Model")
- Z-fighting prevention: explicit radius offsets (1.000, 1.001, 1.005, 1.03)
