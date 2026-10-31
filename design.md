# Design System

> Read this before writing any UI code. This is the source of truth for visual intent.

## Aesthetic

Deep-space sci-fi explorer — pure black void background, a luminous WebGL Earth at centre stage, all UI as dark glassmorphism panels that recede behind the 3D scene rather than competing with it.

## Colours

| Role             | Value                    | Notes                                            |
| ---------------- | ------------------------ | ------------------------------------------------ |
| Background       | `#000000`                | Full-page void; set on root `<div>` and `<body>` |
| Glass panel bg   | `rgba(0,0,0,0.6)`        | All UI panels — `GLASS_PANEL_STYLE`              |
| Glass border     | `rgba(255,255,255,0.08)` | Subtle edge definition on panels                 |
| Glass shadow     | `rgba(0,0,0,0.4)`        | `0 8px 32px` spread                              |
| Text primary     | `#ffffff`                | Panel headings, active labels                    |
| Text secondary   | `rgba(255,255,255,0.7)`  | Body text, inactive items                        |
| Text muted       | `rgba(255,255,255,0.4)`  | Captions, secondary metadata                     |
| Selected item bg | `rgba(255,255,255,0.15)` | Dropdown selected row                            |
| Hover item bg    | `rgba(255,255,255,0.08)` | Dropdown hover row                               |
| Button active bg | `rgba(255,255,255,0.15)` | Toggle/action buttons                            |

Planet orbit colours are defined per-planet in `src/data/planets.ts` and used for accent dots.

## Typography

- **Font**: `sans-serif` (system stack — no web font loaded)
- **UI elements**: `13px`, regular weight
- **Captions / moon labels**: `10px`, `opacity: 0.4`
- **Headings** (InfoPanel etc.): slightly larger, white

## Spacing

- Base unit: 8px
- Panel padding: `8px 16px` (compact) / `16px 24px` (standard)
- Top-bar elements anchored: `top: 24px`, `left: 24px` / centered
- Gap between buttons inside panels: `4px`
- Gap between icon and label: `8px`

## Core Component: Glass Panel

All UI panels share `GLASS_PANEL_STYLE` from `src/styles/glass.ts`:

```ts
{
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  borderRadius: '8px',
  color: '#fff',
  fontFamily: 'sans-serif',
}
```

**Rule:** Every new panel or dropdown MUST use `GLASS_PANEL_STYLE` as its base. Do not hand-roll panel backgrounds.

## Layout

- Single full-viewport page: `100vw × 100vh`, `minWidth: 1024px`
- Three.js `<Canvas>` fills the entire viewport — it is the background
- UI elements are absolutely positioned overlays with `position: absolute` and `zIndex: 10+`
- Top-left: BodySelector dropdown
- Top-center: ViewModeToggle pill
- Top-right area: SearchBar
- Bottom-left/right: TimeControls, ControlsHint
- Right panel: InfoPanel (country hover info)

## Interaction States

- **Hover**: `rgba(255,255,255,0.08)` background tint — never change border or shadow
- **Selected/active**: `rgba(255,255,255,0.15)` background tint + full white text
- **Disabled**: `opacity: 0.4`, no cursor change
- **Transitions**: `0.15s` ease on background changes; `0.2s` on transforms (e.g. dropdown chevron)

## What NOT to Do

- Don't use light backgrounds — every surface must be dark or transparent
- Don't add new colours outside this palette; planet accent colours come from `planets.ts`
- Don't use Tailwind dynamic class strings that won't survive purging (this project uses inline styles)
- Don't add drop shadows to individual text — use them only on panel containers
- Don't render UI panels inside the `<Canvas>` — all DOM overlays live outside it in `App.tsx`
- Don't fight the 3D scene for attention — UI should recede, not dominate
