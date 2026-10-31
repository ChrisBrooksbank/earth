# Earth Enhancement Plan

## Context

The app currently starts in solar system view showing all planets. The Earth has placeholder textures (all "resolution tiers" are identical file sizes -- the 8K day map is only 240KB). Country borders exist but use 50m data. Rivers, lakes, terrain relief, and atmosphere glow are missing. The goal is to make Earth the star of the show: start close-up, look beautiful with real high-res textures and geographic detail, and only show other planets when the user explicitly leaves Earth.

---

## Phase 0: Asset Acquisition (must happen first)

All current textures in `/public/textures/` are placeholders. Replace with real textures.

### Earth Textures from Solar System Scope

Source: https://www.solarsystemscope.com/textures/ (CC BY 4.0 license)

Download and resize to create progressive tiers:

| Texture               | 256px                    | 2K                      | 8K (desktop only)       |
| --------------------- | ------------------------ | ----------------------- | ----------------------- |
| Day map               | `earth_day_256.jpg`      | `earth_day_2k.jpg`      | `earth_day.jpg`         |
| Night/city lights     | `earth_night_256.jpg`    | `earth_night_2k.jpg`    | `earth_night.jpg`       |
| Specular (ocean mask) | `earth_specular_256.jpg` | `earth_specular_2k.jpg` | `earth_specular.jpg`    |
| Clouds                | `earth_clouds_256.jpg`   | `earth_clouds_2k.jpg`   | `earth_clouds.jpg` (8K) |
| Normal map (NEW)      | `earth_normal_256.jpg`   | `earth_normal_2k.jpg`   | `earth_normal.jpg`      |

Steps:

1. Download 8K originals from Solar System Scope (day, night, specular, clouds, normal)
2. Use ImageMagick to create 2K and 256px versions: `magick input.jpg -resize 2048x1024 output_2k.jpg` and `magick input.jpg -resize 256x128 output_256.jpg`
3. Replace all files in `/public/textures/`

### Geographic Vector Data from Natural Earth

Source: https://github.com/nvkelso/natural-earth-vector (public domain)

| Dataset             | File                                     | Size                        |
| ------------------- | ---------------------------------------- | --------------------------- |
| 10m country borders | `ne_10m_admin_0_countries.geojson`       | ~25MB raw, simplify to ~8MB |
| 10m rivers          | `ne_10m_rivers_lake_centerlines.geojson` | ~2MB                        |
| 10m lakes           | `ne_10m_lakes.geojson`                   | ~3MB                        |

Steps:

1. Download GeoJSON files from the GitHub repo
2. Simplify 10m countries with mapshaper: `mapshaper ne_10m_admin_0_countries.geojson -simplify dp 15% -o countries-10m.json`
3. Place in `/public/data/` for runtime fetch (not bundled)
4. Rivers and lakes go in `/public/data/rivers.json` and `/public/data/lakes.json`

---

## Phase 1: Start on Earth (Core UX)

### 1a. Change initial state to Earth-focused

**File: `src/store/appStore.ts`** (lines 39-40)

- Change `cameraMode: 'solarSystem'` to `cameraMode: 'planet'`
- Change `selectedBody: null` to `selectedBody: 'Earth'`

### 1b. Set initial camera close to Earth

**File: `src/App.tsx`** (line 29)

- Change camera position from `[0, 0, 5]` to `[0, 0, 2.8]` (close-up view matching SearchBar's CAMERA_DISTANCE)

### 1c. Add camera zoom constraints

**File: `src/components/CameraController.tsx`** (line 73)

- Add mode-dependent `minDistance` / `maxDistance` to OrbitControls:
  - Planet mode: `minDistance={1.15}` (just above surface), `maxDistance={8}`
  - Solar system mode: `minDistance={5}`, `maxDistance={500}`
- Add `zoomSpeed={0.8}` for smooth scroll zoom
- Add `minPolarAngle={0.1}` / `maxPolarAngle={Math.PI - 0.1}` to prevent pole flip

---

## Phase 2: Hide Other Planets

### 2a. Conditional solar system rendering

**File: `src/components/SolarSystem.tsx`**

- Read `cameraMode` from store
- When `cameraMode === 'planet'`, return `null` (skip rendering Sun, orbits, planets)
- Keep the `useFrame` orbital mechanics running so positions are correct when switching

### 2b. Simplify navigation UI

**File: `src/components/ViewModeToggle.tsx`**

- In planet mode: show single "Explore Solar System" button
- In solar system mode: show "Return to Earth" button
- Remove the toggle-style two-button layout

**File: `src/components/BodySelector.tsx`**

- Only render when `cameraMode === 'solarSystem'` (hide planet list when viewing Earth)

---

## Phase 3: Atmosphere Glow

**Existing dead code:** `src/shaders/atmosphere.frag` has a complete Fresnel rim glow shader that is never used.

**File: `src/components/Earth.tsx`**

- Add atmosphere mesh after clouds mesh inside `EarthMesh`:
  ```
  <mesh> with sphereGeometry args={[1.04, SPHERE_SEGMENTS, SPHERE_SEGMENTS]}
  ```
- Use `ShaderMaterial` with `earth-surface.vert` (reuse -- outputs vWorldNormal, vViewPosition) and `atmosphere.frag`
- Set `side: THREE.BackSide`, `transparent: true`, `depthWrite: false`
- Pass `sunDirection` uniform

---

## Phase 4: Real Textures + Normal Maps for Terrain

### 4a. Add normal map to progressive loading

**File: `src/components/Earth.tsx`**

- Add `normal` key to all tiers in `TEXTURE_PATHS`
- Add `normalMap` uniform to the ShaderMaterial
- Load normal textures in EarthHigh, EarthMid, EarthLow components

### 4b. Normal mapping in fragment shader

**File: `src/shaders/earth-surface.frag`**

- Add `uniform sampler2D normalMap;` and `uniform float normalScale;`
- Use derivative-based TBN matrix (dFdx/dFdy) to perturb normals:
  ```glsl
  vec3 normalTex = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
  // Build TBN from screen-space derivatives
  vec3 dPdx = dFdx(vViewPosition);
  vec3 dPdy = dFdy(vViewPosition);
  vec2 dUVdx = dFdx(vUv);
  vec2 dUVdy = dFdy(vUv);
  vec3 T = normalize(dPdx * dUVdy.y - dPdy * dUVdx.y);
  vec3 B = normalize(dPdy * dUVdx.x - dPdx * dUVdy.x);
  mat3 TBN = mat3(T, B, normal);
  vec3 perturbedNormal = normalize(TBN * normalTex);
  ```
- Use `perturbedNormal` for all lighting calculations
- `normalScale` uniform set to `0.4`

### 4c. Enhanced ocean rendering

**File: `src/shaders/earth-surface.frag`**

- Add Fresnel-based ocean reflection:
  ```glsl
  float oceanFresnel = pow(1.0 - max(dot(perturbedNormal, viewDir), 0.0), 4.0);
  color += vec3(0.08, 0.12, 0.18) * oceanFresnel * specMap.r * dayMix;
  ```
- Deepen ocean color on water areas with subtle tint blend

---

## Phase 5: Animated Clouds

**File: `src/components/Earth.tsx`**

- Replace `MeshStandardMaterial` for clouds with a custom `ShaderMaterial`

**New file: `src/shaders/clouds.frag`**

- Two cloud texture layers with offset UV scrolling for drift effect
- Sun-side brightness modulation (clouds darken on night side)
- `uTime` uniform updated each frame

**New file: `src/shaders/clouds.vert`**

- Pass vUv and vWorldNormal to fragment shader

**Asset:** Download a second cloud texture (different cloud pattern) as `earth_clouds_b_2k.jpg` for dual-layer blending.

---

## Phase 6: Rivers and Lakes

### 6a. Extract shared geo utilities

**New file: `src/lib/geo-utils.ts`**

- Extract `lonLatToXYZ` and `xyzToLonLat` from `CountryBorders.tsx`
- Update `CountryBorders.tsx` and `SearchBar.tsx` to import from shared module

### 6b. Water features component

**New file: `src/components/WaterFeatures.tsx`**

- Fetch `/data/rivers.json` and `/data/lakes.json` at runtime (lazy load)
- Convert lon/lat polylines to 3D line segments on sphere at radius `1.0005`
- Rivers: `LineBasicMaterial` with `color: 0x4488cc`, `opacity: 0.5`
- Lakes: triangulated meshes (earcut) with `MeshBasicMaterial`, `color: 0x2266aa`, `opacity: 0.3`, plus outlines
- Rotate with Earth at `EARTH_ROTATION_SPEED`
- Only visible when camera distance < 4.0 (avoid clutter at full-globe zoom)

**File: `src/App.tsx`**

- Add `<WaterFeatures />` inside Canvas after `<CountryBorders>`

---

## Phase 7: Higher Resolution Country Borders

### 7a. Progressive border loading

**File: `src/components/CountryBorders.tsx`**

- Keep 50m data as immediate low-res version (already bundled)
- Add `useEffect` to fetch `/data/countries-10m.json` at runtime
- When 10m data arrives, rebuild border geometry and swap in
- Update `findCountry` features array with 10m data for accurate hover at high zoom

### 7b. Zoom-dependent detail levels

**File: `src/store/appStore.ts`**

- Add `cameraDistance: number` and `setCameraDistance` to store

**File: `src/components/CameraController.tsx`**

- Track camera distance in `useFrame`, update store (throttled: only when delta > 0.1)

**File: `src/components/CountryBorders.tsx`**

- Read `cameraDistance` from store
- `cameraDistance > 5`: hide borders entirely
- `cameraDistance < 2.5` + 10m loaded: use 10m geometry
- Otherwise: use 50m geometry

---

## Implementation Order

1. **Phase 0** -- Download and prepare all assets (textures + geo data)
2. **Phase 1** -- Start on Earth + camera constraints
3. **Phase 2** -- Hide other planets
4. **Phase 3** -- Atmosphere glow
5. **Phase 4** -- Real textures + normal maps + ocean enhancement
6. **Phase 5** -- Animated clouds
7. **Phase 6** -- Rivers and lakes
8. **Phase 7** -- Higher resolution borders + zoom-dependent detail

---

## Verification

1. `npm run dev` -- app should open showing Earth close-up with atmosphere glow
2. Scroll to zoom in/out -- should be smooth with min/max constraints
3. Zoom in on a continent -- should see terrain relief from normal maps, rivers, lakes, detailed borders
4. Rotate to night side -- city lights visible, atmosphere dims, clouds darken
5. Click "Explore Solar System" -- camera flies out, all planets appear with orbits
6. Click "Return to Earth" or press Escape -- flies back to Earth, planets disappear
7. `npm run build` -- no TypeScript errors
8. `npm run test` -- existing tests pass
9. `npm run lint` -- no lint errors

---

## Files to Modify

| File                                  | Changes                                                               |
| ------------------------------------- | --------------------------------------------------------------------- |
| `src/store/appStore.ts`               | Initial state: planet mode, Earth selected; add cameraDistance        |
| `src/App.tsx`                         | Camera position [0,0,2.8]; add WaterFeatures                          |
| `src/components/Earth.tsx`            | Atmosphere mesh; normal map uniforms; cloud shader; load new textures |
| `src/shaders/earth-surface.frag`      | Normal mapping; enhanced ocean Fresnel                                |
| `src/shaders/earth-surface.vert`      | No changes needed (already outputs required varyings)                 |
| `src/components/CameraController.tsx` | Zoom constraints; distance tracking                                   |
| `src/components/SolarSystem.tsx`      | Conditional render based on cameraMode                                |
| `src/components/ViewModeToggle.tsx`   | Contextual button (Explore/Return)                                    |
| `src/components/BodySelector.tsx`     | Hide in planet mode                                                   |
| `src/components/CountryBorders.tsx`   | Progressive 10m loading; zoom-dependent detail; use shared geo-utils  |

## New Files

| File                               | Purpose                                  |
| ---------------------------------- | ---------------------------------------- |
| `src/shaders/clouds.frag`          | Animated dual-layer cloud shader         |
| `src/shaders/clouds.vert`          | Cloud vertex shader                      |
| `src/components/WaterFeatures.tsx` | Rivers and lakes rendering               |
| `src/lib/geo-utils.ts`             | Shared lon/lat conversion utilities      |
| `public/data/countries-10m.json`   | High-res country borders (runtime fetch) |
| `public/data/rivers.json`          | River polylines (runtime fetch)          |
| `public/data/lakes.json`           | Lake polygons (runtime fetch)            |

## New Textures (replace placeholders)

| File                                     | Source               | Resolution |
| ---------------------------------------- | -------------------- | ---------- |
| `public/textures/earth_day.jpg`          | Solar System Scope   | 8192x4096  |
| `public/textures/earth_day_2k.jpg`       | Resized from above   | 2048x1024  |
| `public/textures/earth_day_256.jpg`      | Resized from above   | 256x128    |
| `public/textures/earth_night.jpg`        | Solar System Scope   | 8192x4096  |
| `public/textures/earth_night_2k.jpg`     | Resized              | 2048x1024  |
| `public/textures/earth_night_256.jpg`    | Resized              | 256x128    |
| `public/textures/earth_specular.jpg`     | Solar System Scope   | 8192x4096  |
| `public/textures/earth_specular_2k.jpg`  | Resized              | 2048x1024  |
| `public/textures/earth_specular_256.jpg` | Resized              | 256x128    |
| `public/textures/earth_clouds.jpg`       | Solar System Scope   | 8192x4096  |
| `public/textures/earth_clouds_2k.jpg`    | Resized              | 2048x1024  |
| `public/textures/earth_clouds_256.jpg`   | Resized              | 256x128    |
| `public/textures/earth_clouds_b_2k.jpg`  | Second cloud pattern | 2048x1024  |
| `public/textures/earth_normal.jpg`       | Solar System Scope   | 8192x4096  |
| `public/textures/earth_normal_2k.jpg`    | Resized              | 2048x1024  |
| `public/textures/earth_normal_256.jpg`   | Resized              | 256x128    |
