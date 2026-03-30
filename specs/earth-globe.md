# Earth Globe (Phases 1-3)

## Overview

A photorealistic, interactive 3D Earth globe with atmosphere effects, day/night cycle, and country borders.

## User Stories

- As a user, I want to see a textured, bump-mapped Earth that I can orbit and zoom
- As a user, I want to see city lights on the dark side of Earth
- As a user, I want to see an atmospheric glow around Earth's edges
- As a user, I want to see cloud layers rotating independently
- As a user, I want to see country borders on the globe
- As a user, I want to hover over a country and see it highlighted with its name

## Requirements

### Phase 1 - Basic Globe

- [ ] Vite React-TS scaffold with all dependencies installed
- [ ] Earth.tsx: UV sphere (64 segments) with day texture, bump map, specular map
- [ ] Directional light source (representing sun)
- [ ] OrbitControls for camera interaction
- [ ] Starfield background

### Phase 2 - Atmosphere & Night

- [ ] Custom earth-surface.frag: day/night texture blend based on dot(normal, sunDir) with smooth terminator
- [ ] atmosphere.frag: Fresnel rim glow on slightly larger backface-culled sphere, Rayleigh blue tint
- [ ] Cloud layer: alpha-textured sphere at 1.005x radius, independent slow rotation
- [ ] Bloom post-processing for atmosphere glow
- [ ] Night side shows city lights texture

### Phase 3 - Country Borders

- [ ] Load Natural Earth 50m GeoJSON (~1.5MB)
- [ ] Convert [lon, lat] to 3D coordinates on sphere at radius 1.001x
- [ ] Render as THREE.LineSegments (single draw call)
- [ ] Hover detection: raycast to lon/lat to point-in-polygon test
- [ ] Country highlight on hover with name display in InfoPanel

## Acceptance Criteria

- [ ] Earth renders with visible texture detail, bump mapping, and specular oceans
- [ ] Night side shows city lights with smooth terminator transition
- [ ] Atmosphere glow visible at globe edges, blue-tinted
- [ ] Clouds rotate independently from Earth surface
- [ ] All country borders visible as thin lines
- [ ] Hovering a country highlights it and shows its name
- [ ] 60fps on mid-range GPU

## Out of Scope

- Country labels (billboard text) - deferred
- Country fill colors / choropleth maps
- Terrain elevation exaggeration
