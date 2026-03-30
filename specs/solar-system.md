# Solar System Bodies & Orbits (Phases 4-5)

## Overview

All major solar system bodies rendered with correct textures, orbital mechanics, and a hybrid scale model.

## User Stories

- As a user, I want to see all planets from Mercury to Pluto with accurate textures
- As a user, I want to see the Sun as a glowing light source with corona effect
- As a user, I want to see Saturn's rings
- As a user, I want to see planets moving along their orbits in real time (with speed controls)
- As a user, I want to see orbital paths as elliptical lines

## Requirements

### Phase 4 - Solar System Bodies

- [ ] Planet.tsx: generic component accepting radius, texture, axial tilt, rotation speed
- [ ] Instantiate all planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
- [ ] Moon orbiting Earth
- [ ] Sun.tsx: emissive material + point light + animated corona shader (FBM noise + radial falloff)
- [ ] SaturnRings.tsx: RingGeometry with custom alpha shader, double-sided, depth-write off
- [ ] Each planet has correct relative appearance (color, size ordering)

### Phase 5 - Orbital Mechanics & Scale

- [ ] orbital-mechanics.ts: Kepler equation solver (Newton-Raphson), 3D position from 6 Keplerian elements
- [ ] NASA JPL orbital elements as static JSON data
- [ ] Scale strategy ("Museum Model"):
  - Radii: displayRadius = base \* Math.pow(realRadius / earthRadius, 0.4)
  - Distances: displayDist = k _ Math.log10(1 + realAU _ stretch)
  - Sun capped at 3x Jupiter display size + bloom
- [ ] OrbitLine.tsx: 360 points per ellipse, dashed line material in planet's color
- [ ] TimeControls: multiplier (1x-10000x) driving simulation time
- [ ] Animated planetary motion along orbital paths

## Acceptance Criteria

- [ ] All 9 planets + Moon visible with correct textures and relative sizes
- [ ] Sun emits light and has visible corona/glow effect
- [ ] Saturn rings render with transparency and correct orientation
- [ ] Planets move along elliptical orbits at correct relative speeds
- [ ] Time controls allow speeding up / pausing orbital animation
- [ ] Orbit lines visible as dashed ellipses
- [ ] All bodies remain visible (no planet lost in scale)

## Out of Scope

- Other moons (Europa, Titan, etc.)
- Asteroid belt
- Comet trails
- Accurate planet surface features (just texture maps)
