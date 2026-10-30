# Tauche — Design System & UX Guidelines (AGENTS.md)

This file is the single source of truth for the visual and interaction design of Tauche.
Every component, page, and style change must conform to it. No ad-hoc values.

## Product

Tauche is a dive logbook & telemetry analytics suite. Users log dives, track gear,
plan trips, view analytics/maps, and manage certifications. Used on desktop and
mobile (often at the dive site, on a phone, in bright sun, offline-ish).

## Design Brief

```
Purpose:    Log, review, and analyze scuba dives and dive trips.
Audience:   Recreational & technical divers; desktop at home, phone on the boat.
Tone:       Abyssal Instrument — dive-computer precision, editorial restraint.
Reference:  A vintage dive computer faceplate meets a nautical logbook: dense
            data, hairline rules, brass-on-ink accents, no decoration for its own sake.
Palette:    Deep abyss base, steel surfaces, warm off-white ink, single cyan accent
            (phosphor). Warn orange reserved for destructive/danger only.
Type:       Fraunces (display, editorial authority) + Manrope (text, legible) +
            JetBrains Mono (data/numbers, tabular). Serif display vs. sans body.
Memorable:  Oversized monospace depth/duration figures with a faint bathymetric
            grid behind them; dive profile as the hero of a dive.
Restraint:  No card shadows in dark mode (borders only). No gradients on buttons.
            No rounded "pills" except chips/badges. No emoji as icons. One accent.
```

## Aesthetic Direction

- Dark-first (dive apps are used in low light / on boats). Light theme supported.
- Data-forward: numbers are heroes. Use tabular-nums, monospace, large.
- Hairline rules and spacing define structure — not cards, not shadows.
- Cyan accent used sparingly (< 10% of surface) for primary actions and active states.
- Warn orange/red reserved for destructive actions and errors only.

## Token Block (canonical)

All values live in `frontend/src/index.css` `:root` and `:root[data-theme="light"]`.
Components reference tokens only — never raw px/rem/hex.

### Type
- Display: `--font-display: "Fraunces", Georgia, serif`
- Text: `--font-text: "Manrope", system-ui, sans-serif`
- Mono: `--font-mono: "JetBrains Mono", ui-monospace, monospace`
- Ratio: 1.25 (major third). Steps: --step--1..--step-6.
- Weights: 400 (body), 500 (ui), 600 (strong), 700 (display). Max 4.

### Space
- Base 4px. Scale: --space-3xs(2) 2xs(4) xs(6) s(8) m(12) l(16) xl(24) 2xl(32) 3xl(48) 4xl(64).

### Color (dark)
- --base #07101f, --surface #0d1a2e, --surface-2 #132238, --surface-3 #1a2d47
- --ink #e8edf5, --ink-2 #a8b3c5, --ink-3 #6b7a90
- --line #1e2d45, --line-2 #2a3d5a
- --accent #22d3ee, --accent-ink #07101f
- --danger #f87171, --success #34d399, --warn #fbbf24

### Form
- --radius: 10px (single value, everywhere)
- --border: 1px solid var(--line)
- --shadow-1 (contact), --shadow-2 (ambient) — dark mode uses borders instead
- --focus: 2px solid var(--accent), offset 2px

### Motion
- --dur-fast 120ms, --dur 200ms, --dur-slow 360ms
- --ease cubic-bezier(0.2, 0, 0, 1), --ease-out cubic-bezier(0.16, 1, 0.3, 1)

## Backward-compat variables

Existing pages reference `--bg`, `--surface`, `--text`, `--muted`, `--accent`,
`--card-bg`, `--card-border`, `--card-radius`, `--card-shadow`, `--btn-gradient`,
`--input-*`, `--page-padding`, `--page-max-width`. These are ALIASED to the new
tokens and must keep working. New code should prefer the new tokens.

## Component Rules

1. Semantic HTML first: button for actions, a for navigation, dialog for modals.
2. Every interactive element has all 5 states: rest, hover, active, focus-visible, disabled.
3. Never `outline: none` without a replacement. Use `:focus-visible`.
4. Touch targets >= 44px. Primary actions in thumb reach on mobile.
5. No hover-only affordances.

## UX Rules (states)

Every data component must handle: empty (first use), empty (no results), empty (cleared),
loading (first), loading (refresh), partial, error (recoverable), error (permanent),
error (permission), offline, too much, stale, success. At minimum: empty + loading +
error with retry. See designing-user-experience skill.

- Empty states explain the feature and offer the primary action. Never "No data."
- Loading never blanks already-visible content (keep stale, show subtle indicator).
- Errors say what happened, why, and what to do, with a control. Never status codes.
- Forms never clear on error. Validate on blur, not keystroke. Never disable submit
  as a validation gate.
- Destructive actions prefer undo (toast with undo) over confirm; confirm only when
  irreversible, naming the specific consequence.

## Navigation & IA

- Sidebar on desktop (>=1024px), bottom tabs on mobile.
- Current section indicated in nav. Page title matches clicked destination.
- Filters/tabs/modals reflected in URL. Back must work.
- Deep links survive auth (return to requested resource after login).

## Accessibility (WCAG 2.2 AA)

- Contrast: body 4.5:1, large text/UI 3:1, in BOTH themes.
- Keyboard: everything operable, visible focus, logical order, no traps outside modals.
- Names: every control/image has an accessible name.
- Forms: labels, aria-describedby for errors, aria-invalid.
- Live regions pre-exist their content.
- Reduced motion respected.
- Targets >= 24px (44px recommended).

## Anti-Slop (forbidden)

- Inter/Roboto/Arial/system-ui as display face.
- Purple→blue gradients on white.
- rounded-lg/xl on everything; mixed radii.
- shadow-md on every surface.
- Hero → 3 cards → CTA.
- Centered max-w-4xl whole page.
- text-gray-500 body on white.
- Emoji as icons.
- Six weights of one neutral sans.
- Uniform section rhythm (vary to express importance).

## File Map

- `frontend/src/index.css` — tokens + base + shared components.
- `frontend/src/components/*` — Sidebar, TopBar, MobileNav, shared UI.
- `frontend/src/pages/*` — one page per route.
- Each page may have a `.css` file; must use tokens.

## Verification

Before shipping a UI change: render at 1440px and 390px, run axe, keyboard walk.
See reviewing-interface-quality skill.
