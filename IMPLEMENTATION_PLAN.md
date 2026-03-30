# Implementation Plan

## Status

- Planning iterations: 1
- Build iterations: 0
- Last updated: 2026-03-30

## Tasks

### Phase 1 - Basic Globe

- [x] Install Three.js dependencies: three, @react-three/fiber, @react-three/drei, @types/three, postprocessing, @react-three/postprocessing (spec: earth-globe.md)
- [x] Create basic Canvas scene in App.tsx with camera and ambient lighting setup (spec: earth-globe.md)
- [x] Create src/components/Starfield.tsx: particle-based starfield background (spec: earth-globe.md)
- [x] Create src/components/Earth.tsx: UV sphere (64 segments) with day texture, bump map, specular map (spec: earth-globe.md)
- [x] Add directional light (sun direction) and OrbitControls to scene (spec: earth-globe.md)

### Phase 2 - Atmosphere & Night

- [x] Create src/shaders/earth-surface.frag: day/night texture blend via dot(normal, sunDir) with smooth terminator (spec: earth-globe.md)
- [x] Create src/shaders/atmosphere.frag: Fresnel rim glow shader on backface-culled larger sphere, Rayleigh blue tint (spec: earth-globe.md)
- [x] Add cloud layer to Earth.tsx: alpha-textured sphere at 1.005x radius, independent slow rotation (spec: earth-globe.md)
- [x] Add bloom post-processing via @react-three/postprocessing EffectComposer (spec: earth-globe.md)
- [x] Night side shows city lights texture blended in custom shader (spec: earth-globe.md)

### Phase 3 - Country Borders

- [x] Fetch/bundle Natural Earth 50m GeoJSON; create src/data/countries.json (spec: earth-globe.md)
- [x] Create src/components/CountryBorders.tsx: convert [lon,lat] to 3D sphere coords, render as THREE.LineSegments (spec: earth-globe.md)
- [x] Add hover detection: raycast -> lon/lat -> point-in-polygon test; highlight hovered country (spec: earth-globe.md)
- [x] Create src/components/InfoPanel.tsx (stub): show hovered country name (spec: earth-globe.md)

### Phase 4 - Solar System Bodies

- [x] Create src/components/Planet.tsx: generic component accepting radius, texture, axialTilt, rotationSpeed props (spec: solar-system.md)
- [x] Create src/data/planets.ts: static data for all 9 planets + Moon (textures, radii, axial tilts, rotation speeds) (spec: solar-system.md)
- [x] Instantiate all planets (Mercury–Pluto) + Moon in scene using Planet.tsx (spec: solar-system.md)
- [x] Create src/components/Sun.tsx: emissive sphere + PointLight + animated FBM corona shader (radial falloff) (spec: solar-system.md)
- [x] Create src/components/SaturnRings.tsx: RingGeometry with custom alpha shader, double-sided, depth-write off (spec: solar-system.md)

### Phase 5 - Orbital Mechanics & Scale

- [x] Create src/lib/orbital-mechanics.ts: Kepler equation solver (Newton-Raphson), 3D position from 6 Keplerian elements (spec: solar-system.md)
- [x] Create src/data/orbital-elements.json: NASA JPL Keplerian elements for all bodies (spec: solar-system.md)
- [x] Implement Museum Model scaling in src/lib/scale.ts: displayRadius = base _ pow(r/earthR, 0.4), displayDist = k _ log10(1 + au \* stretch) (spec: solar-system.md)
- [x] Create src/components/OrbitLine.tsx: 360-point ellipse, dashed line material in planet color (spec: solar-system.md)
- [x] Create src/components/TimeControls.tsx: multiplier slider (1x–10000x) + pause button (spec: solar-system.md)
- [x] Wire simulation time into all planetary positions via useFrame (spec: solar-system.md)

### Phase 6 - Camera & Navigation

- [x] Create src/hooks/useCameraTransition.ts: spring-animate camera position + target over ~1.5s ease-out (spec: navigation.md)
- [x] Implement dual camera mode state (solarSystem | planet) in src/store/appStore.ts (Zustand or useContext) (spec: navigation.md)
- [x] Click planet mesh to enter Planet view (fly camera to body) (spec: navigation.md)
- [x] Escape key listener: return camera to Solar System overview (spec: navigation.md)
- [ ] Create src/components/BodySelector.tsx: sidebar list of all planets, highlights selected, click to fly to it (spec: navigation.md)

### Phase 7 - UI Polish

- [ ] Expand InfoPanel with full body data: name, radius, mass, distance from sun, orbital period, fun facts (spec: ui-polish.md)
- [ ] Create src/components/SearchBar.tsx: country name input with autocomplete, camera flies to selected country on Earth (spec: ui-polish.md)
- [ ] Apply dark glassmorphism CSS theme: backdrop-filter blur(10px), rgba(0,0,0,0.6) panel backgrounds (spec: ui-polish.md)
- [ ] Responsive layout for 1024px+ screens (spec: ui-polish.md)
- [ ] Create src/components/ViewModeToggle.tsx: Solar System / Planet view switch button (spec: ui-polish.md)

### Phase 8 - Performance

- [ ] Progressive texture loading: 256px placeholder -> 2K -> 8K for Earth using Suspense boundaries (spec: ui-polish.md)
- [ ] Loading screen with useProgress from @react-three/drei and progress bar UI (spec: ui-polish.md)
- [ ] LOD with drei <Detailed> component: high-poly close, low-poly far for planets (spec: ui-polish.md)
- [ ] Mobile detection: reduce sphere segments to 32, skip clouds, cap textures at 2K (spec: ui-polish.md)

## Completed

<!-- Completed tasks move here -->

## Notes

### Architecture

- **Renderer**: @react-three/fiber (R3F) Canvas wrapping all 3D scene content
- **Camera controls**: @react-three/drei OrbitControls, replaced by custom useCameraTransition during fly-to
- **State management**: Zustand store (or React context) for: selectedBody, cameraMode, simulationTime, hoveredCountry
- **Shaders**: Raw GLSL imported as strings (vite raw import `?raw`), applied via shaderMaterial from drei
- **Textures**: Sourced from NASA/Solar System Scope CDN or bundled in /public/textures/
- **GeoJSON**: Natural Earth 50m admin_0 boundaries (~1.5MB), bundled as static asset
- **Scaling**: Museum Model — compressed radii (pow 0.4) + log-scale distances so all bodies stay visible
- **Orbital mechanics**: Kepler equation solved via Newton-Raphson iteration; 6-element Keplerian elements from NASA JPL

### Key Dependencies to Install

- `three` + `@types/three`
- `@react-three/fiber`
- `@react-three/drei`
- `@react-three/postprocessing` + `postprocessing`
- `zustand` (state management)

### Texture Asset Strategy

All textures referenced as `/public/textures/<body>_<map>.jpg`. Need day, night (city lights), clouds, bump, specular for Earth; color maps for all other bodies. Source from free NASA/Solar System Scope resources.
