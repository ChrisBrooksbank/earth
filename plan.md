# Earth & Solar System Explorer — Implementation Plan

## Context

Build a world-class interactive 3D Earth globe and solar system explorer as a web application. The user wants to explore a high-resolution globe showing all countries, plus all major solar system bodies with orbital visualization. This is a greenfield project in an empty directory.

**Comparable software**: Google Earth, NASA Eyes on the Solar System, Solar System Scope, Celestia, SpaceEngine.

---

## Tech Stack

| Technology                       | Purpose                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| **React 19 + TypeScript + Vite** | Application shell                                                                        |
| **Three.js + React Three Fiber** | 3D rendering engine (chosen over CesiumJS — Cesium can't handle multi-body solar system) |
| **@react-three/drei**            | OrbitControls, Stars, useProgress, loaders                                               |
| **@react-three/postprocessing**  | Bloom for sun/atmosphere glow                                                            |
| **Zustand**                      | State management (view mode, selected body, time, camera target)                         |
| **@react-spring/three**          | Smooth camera fly-to transitions                                                         |
| **vite-plugin-glsl**             | GLSL shader imports with `#include` support                                              |
| **Tailwind CSS**                 | UI styling (dark theme, glassmorphism panels)                                            |

---

## Data Sources

- **Earth textures**: Solar System Scope (NASA-based) — 8K day, 4K night/clouds, 2K bump/specular
- **Planet textures**: Solar System Scope — 2K color + bump for all planets
- **Country borders**: Natural Earth 50m admin boundaries GeoJSON (~1.5MB)
- **Orbital data**: NASA JPL Keplerian orbital elements (static JSON, client-side computation)
- **Saturn ring**: 1D color+alpha texture strip

---

## Project Structure

```
earth/
├── public/
│   ├── textures/
│   │   ├── earth/          # 8K day, 4K night, 4K clouds, 2K specular, 2K bump
│   │   ├── planets/        # 2K textures per planet
│   │   ├── sun/            # Emission texture
│   │   └── saturn-ring.png
│   └── data/
│       ├── countries.geojson
│       └── orbital-elements.json
├── src/
│   ├── main.tsx
│   ├── App.tsx             # Canvas + HUD overlay
│   ├── state/
│   │   └── store.ts        # Zustand store
│   ├── scene/
│   │   ├── SolarSystem.tsx # Scene root — positions all bodies
│   │   ├── Sun.tsx         # Emissive + point light + corona
│   │   ├── Planet.tsx      # Generic planet component
│   │   ├── Earth.tsx       # Multi-layer: surface, clouds, atmosphere, borders
│   │   ├── Moon.tsx
│   │   ├── SaturnRings.tsx # Ring geometry + shader
│   │   ├── OrbitLine.tsx   # Elliptical orbit path
│   │   ├── Starfield.tsx   # Background stars
│   │   └── Lighting.tsx
│   ├── shaders/
│   │   ├── atmosphere.vert/frag    # Fresnel rim glow + Rayleigh tint
│   │   ├── earth-surface.vert/frag # Day/night blend, specular oceans
│   │   ├── clouds.frag            # Alpha cloud layer
│   │   ├── saturn-ring.frag       # Lit ring with transparency
│   │   └── sun-corona.frag        # Animated noise corona
│   ├── systems/
│   │   ├── orbital-mechanics.ts   # Kepler equation solver
│   │   ├── scale.ts               # Log scale for distances, power-law for radii
│   │   ├── camera-controller.ts   # Dual-mode camera (solar/planet view)
│   │   └── texture-loader.ts      # Progressive loading (256px → 2K → 8K)
│   ├── geo/
│   │   ├── border-lines.ts       # GeoJSON → 3D line geometry on sphere
│   │   └── country-labels.ts     # Billboard labels (phase 3)
│   ├── ui/
│   │   ├── HUD.tsx               # Top-level overlay
│   │   ├── BodySelector.tsx      # Planet list sidebar
│   │   ├── InfoPanel.tsx         # Selected body facts
│   │   ├── TimeControls.tsx      # Play/pause, speed, date display
│   │   ├── ViewModeToggle.tsx    # Solar System ↔ Planet view
│   │   └── SearchBar.tsx         # Country search (Earth view)
│   └── hooks/
│       ├── useOrbitalPositions.ts
│       ├── useCameraTransition.ts
│       └── useProgressiveTexture.ts
```

---

## Implementation Phases

### Phase 1 — Scaffolding + Earth Globe

- Vite React-TS scaffold, install all deps
- `Earth.tsx`: UV sphere (64 segments), day texture + bump map + specular
- Directional light, OrbitControls
- **Result**: Textured, bump-mapped Earth you can orbit

### Phase 2 — Atmosphere + Night Lights + Clouds

- Custom `earth-surface.frag`: day/night texture blend based on `dot(normal, sunDir)` with smooth terminator
- `atmosphere.frag`: Fresnel rim glow on slightly larger backface-culled sphere, Rayleigh blue tint
- Cloud layer: alpha-textured sphere at 1.005x radius, independent rotation
- Starfield background, Bloom post-processing
- **Result**: Photorealistic Earth with atmosphere glow and city lights on dark side

### Phase 3 — Country Borders

- Load Natural Earth 50m GeoJSON
- Convert `[lon, lat]` → 3D coordinates on sphere at radius 1.001x
- Render as `THREE.LineSegments` (single draw call)
- Hover detection: raycast → lon/lat → point-in-polygon test
- **Result**: All country borders visible, hoverable, with info on selection

### Phase 4 — Solar System Bodies

- `Planet.tsx`: generic component (radius, texture, tilt, rotation speed)
- Instantiate all planets: Mercury through Pluto + Moon
- `Sun.tsx`: emissive material + point light + corona shader
- `SaturnRings.tsx`: RingGeometry + custom alpha shader, double-sided
- **Result**: All solar system bodies rendered with correct relative appearance

### Phase 5 — Orbital Mechanics + Scale

- `orbital-mechanics.ts`: Kepler equation solver (Newton-Raphson), 3D position from 6 Keplerian elements
- **Scale strategy** ("Museum Model"):
  - Radii: `displayRadius = base * Math.pow(realRadius / earthRadius, 0.4)` — compressed but ordered
  - Distances: `displayDist = k * Math.log10(1 + realAU * stretch)` — logarithmic, all planets visible
  - Sun capped at 3x Jupiter display size + bloom for implied enormity
- `OrbitLine.tsx`: 360 points per ellipse, dashed line material in planet's color
- `TimeControls`: multiplier (1x–10000x) driving simulation time
- **Result**: Animated solar system with accurate orbital motion

### Phase 6 — Camera System + Navigation

- **Solar System view**: orbit around Sun, click planet to fly there
- **Planet view**: orbit around selected body, zoom to see surface detail
- `useCameraTransition`: spring-animate camera over 1.5s with ease-out
- Double-click planet → enter Planet view. Escape → return to Solar System
- `BodySelector` sidebar: clickable planet list
- **Result**: Seamless navigation between solar system and individual planets

### Phase 7 — UI Polish

- `InfoPanel`: name, radius, mass, distance, orbital period, fun facts
- `SearchBar`: type country name → camera flies to it on Earth
- Dark glassmorphism theme (`backdrop-filter: blur(10px)`, `rgba(0,0,0,0.6)`)
- Responsive layout (desktop + tablet)

### Phase 8 — Performance + Polish

- KTX2 texture compression (8K Earth: 30MB → ~5MB)
- LOD: drei `<Detailed>` — high-poly close, low-poly far
- Progressive texture loading (256px → 2K → 8K)
- Loading screen with progress bar
- Mobile detection: reduced segments (32), skip clouds, 2K max textures

---

## Key Technical Decisions

### Solar System Scale Problem

Hybrid "Museum Model" — logarithmic orbital distances keep all planets visible, power-law compressed radii preserve ordering while keeping everything recognizable. Transitions between Solar System and Planet view animate scale smoothly.

### Shader Strategy

- **Earth surface**: Custom GLSL day/night blend with `smoothstep` terminator, specular oceans
- **Atmosphere**: Fresnel rim glow (not volumetric — too expensive for multiple planets), backface sphere, additive blending
- **Saturn rings**: 1D texture lookup, double-sided, depth-write off, shadow from Saturn body
- **Sun corona**: FBM noise + radial falloff + Bloom post-processing

### Country Borders

GeoJSON → 3D line segments on sphere at slight offset (1.001x radius). Single draw call. Hover via raycast → lon/lat → point-in-polygon. Highlight with color/opacity change.

### Z-Fighting Prevention

Explicit radius offsets: surface (1.000), borders (1.001), clouds (1.005), atmosphere (1.03). Plus `polygonOffset` on materials.

---

## Component Tree

```
<App>
  <Canvas>
    <Suspense>
      <SolarSystem>
        <Sun />
        <Planet name="mercury" />
        <Planet name="venus" />
        <Earth>
          <EarthSurface />    ← custom shader
          <EarthClouds />
          <EarthAtmosphere /> ← Fresnel glow
          <CountryBorders />  ← GeoJSON lines
          <Moon />
        </Earth>
        <Planet name="mars" />
        <Planet name="jupiter" />
        <group> <Planet name="saturn" /> <SaturnRings /> </group>
        <Planet name="uranus" />
        <Planet name="neptune" />
        <Planet name="pluto" />
        <OrbitLine /> × N
      </SolarSystem>
      <Starfield />
    </Suspense>
    <CameraController />
    <EffectComposer> <Bloom /> </EffectComposer>
  </Canvas>
  <HUD>
    <BodySelector />
    <InfoPanel />
    <TimeControls />
    <ViewModeToggle />
    <SearchBar />
  </HUD>
</App>
```

---

## Verification Plan

1. **Phase 1**: Earth renders with texture, bump, specular. OrbitControls work smoothly.
2. **Phase 2**: Night side shows city lights. Atmosphere glow visible at edges. Clouds rotate independently.
3. **Phase 3**: Country borders visible. Hovering a country highlights it and shows name in InfoPanel.
4. **Phase 4**: All planets visible with correct textures. Saturn has rings. Sun emits light.
5. **Phase 5**: Planets move along orbits at correct relative speeds. Time controls work. Orbit lines visible.
6. **Phase 6**: Click planet → camera flies there smoothly. Escape returns to solar system. BodySelector works.
7. **Phase 7**: UI panels show correct data. Search finds countries. Responsive on tablet.
8. **Phase 8**: Load time under 5s on broadband. 60fps on mid-range GPU. No jank during transitions.

---

## Critical Files

- `src/scene/Earth.tsx` — Multi-layer rendering, centerpiece of the app
- `src/shaders/earth-surface.frag` — Day/night blend shader, signature visual
- `src/systems/scale.ts` — Log/power-law scale solving the distance problem
- `src/systems/camera-controller.ts` — Dual-mode camera with spring transitions
- `src/systems/orbital-mechanics.ts` — Kepler equation solver for accurate positions
- `src/geo/border-lines.ts` — GeoJSON → 3D lines on sphere
