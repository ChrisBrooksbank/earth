# Camera & Navigation (Phase 6)

## Overview

Dual-mode camera system with smooth transitions between solar system overview and individual planet views.

## User Stories

- As a user, I want to click a planet and have the camera fly to it smoothly
- As a user, I want to orbit around a selected planet to see surface details
- As a user, I want to press Escape to return to the solar system overview
- As a user, I want to select planets from a sidebar list

## Requirements

- [ ] Solar System view: camera orbits around Sun, all planets visible
- [ ] Planet view: camera orbits around selected body, zoom to see surface detail
- [ ] useCameraTransition hook: spring-animate camera position/target over ~1.5s with ease-out
- [ ] Click planet in 3D scene to fly camera to it (enter Planet view)
- [ ] Double-click or dedicated button to enter Planet view
- [ ] Escape key returns to Solar System view
- [ ] BodySelector sidebar: clickable list of all planets
- [ ] Clicking a planet in BodySelector flies camera to it
- [ ] Smooth scale transition when switching between Solar System and Planet view

## Acceptance Criteria

- [ ] Camera smoothly flies to clicked planet (no teleporting)
- [ ] Transition takes ~1.5s with natural ease-out curve
- [ ] Planet view allows orbiting and zooming on individual planets
- [ ] Escape reliably returns to solar system overview
- [ ] BodySelector list highlights currently selected planet
- [ ] No visual glitches during camera transitions
- [ ] Works with both mouse click and sidebar selection

## Out of Scope

- VR/AR camera modes
- First-person fly-through mode
- Cinematic tour / auto-pilot
