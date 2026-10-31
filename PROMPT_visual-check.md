# VISUAL CHECK MODE

You are in visual check mode for the Earth Explorer 3D app. Your job is to verify the app looks correct and matches design.md, then fix any issues found.

## 0a. Read Context

Read these files in parallel:

- `design.md` — the visual intent and component patterns
- `AGENTS.md` — build and test commands
- `IMPLEMENTATION_PLAN.md` — what was recently built (if present)

## 1. Run Visual Tests

```bash
npm run test:e2e
```

If this is the first run and no baseline screenshots exist:

1. Start the dev server if needed: `npm run dev &`
2. Run: `npm run test:e2e:update-snapshots`
3. Inspect the generated screenshots in `e2e/visual.spec.ts-snapshots/`

## 2. Analyse Failures

### Blank/black canvas (Three.js specific)

- Check that `<Canvas>` is mounted (not conditionally hidden)
- Check for WebGL context errors in console output
- Check that the `background: '#000'` root div is present — a black screenshot ≠ rendered scene

### UI panels not visible

- Check that overlay `<div>` elements use `position: absolute` and are placed **outside** `<Canvas>`
- Verify `zIndex` is set (≥10) so panels aren't beneath the canvas
- Check `GLASS_PANEL_STYLE` is applied — missing backdrop-filter means plain black panel

### Console errors on load

- Three.js warnings about deprecated APIs: acceptable, not a failure
- "Failed to load resource" for textures: check `public/` directory for missing files
- React hydration errors: shouldn't occur in a Vite SPA — investigate if present

### Screenshot diff

- Small diffs (≤3%): likely GPU/anti-aliasing noise — update snapshot if intentional
- Large diffs: a real regression — find the changed component and fix it
- All-black screenshot: WebGL didn't render — check for JS errors before the canvas paints

## 3. Fix Issues

Fix each issue found. After fixing:

1. Re-run `npm run test:e2e`
2. If tests pass, continue
3. If still failing, read the Playwright HTML report: `npx playwright show-report`

## 4. Cross-check with design.md

Even if all tests pass, check the screenshots against `design.md`:

- [ ] Background is pure black (`#000`)
- [ ] UI panels use glassmorphism (`rgba(0,0,0,0.6)` + `blur(10px)` + subtle border)
- [ ] Text is white / white with reduced opacity — no dark text on dark panels
- [ ] No light-coloured surfaces anywhere in the UI
- [ ] Panels recede behind the 3D scene, not dominating it
- [ ] Font is sans-serif at ~13px for UI elements
- [ ] Spacing: `24px` from viewport edges to top-bar panels

Note any deviations in `IMPLEMENTATION_PLAN.md` under `## Visual Notes`.

## 5. Update AGENTS.md if needed

If you changed the test command or discovered setup steps, update `AGENTS.md`.

## 6. Exit

After all visual tests pass and screenshots match `design.md`, exit cleanly.

---

## 99999. GUARDRAILS

- **DON'T update snapshots blindly** — open the screenshot files and look at them first
- **DON'T mark as done if screenshots show a plain black screen** — that means WebGL failed, not that the scene rendered black space correctly
- **DON'T skip the design.md check** — automated tests catch crashes, not aesthetic drift
- **DO check `e2e/visual.spec.ts-snapshots/`** for the actual baseline images
- **DO read the Playwright HTML report** (`playwright-report/index.html`) for detailed failure traces
- **DO distinguish** Three.js console warnings (normal) from JS errors (investigate)
