# NerdCon Quest — Design System

> The conference app that plays like a game.
> Fintech NerdCon · San Diego · Nov 19–20, 2026

---

## Design Philosophy

NerdCon Quest is an RPG-skinned conference PWA. The visual language bridges two worlds:

1. **The NerdCon website** — pixel-art retro gaming, 8-bit San Diego skyline, bright sky blues, palm greens, Space Invader mascot, "San Diego" in brushy red script. Light, fun, nostalgic.
2. **The app** — an arcade terminal you carry in your pocket. Dark, glowing, functional. Built for one-handed use in a loud convention center.

The app is the **night mode** of the website's **day mode.** Same energy, different time of day. The pixel-art DNA shows up in celebration moments (level up, quest complete) and accent typography, but the daily-driver UI is clean, dark, and fast.

**One-line brief:** A dark arcade terminal with neon accents and pixel-art celebration moments.

---

## Color Tokens

### Primary Palette — "Arcade Terminal"

| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `void-black` | `#050505` | Background | App background, page canvas |
| `panel-dark` | `#0D0D0D` | Surface | Cards, sheets, modals, input backgrounds |
| `nerdcon-blue` | `#3568FF` | Primary action | Buttons, links, active tab indicator, selection |
| `terminal-white` | `#F0F0F0` | Primary text | Headings, body text, high-emphasis content |
| `fog-gray` | `#888888` | Secondary text | Labels, placeholders, inactive states, timestamps |

### Signal Colors — "Neon Accents"

| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `cyan-pulse` | `#00E5FF` | Live/active | Live indicators, map hotspots, Builder track, workshop sessions |
| `xp-green` | `#39FF14` | Success/XP | XP gains, quest completion, level-up, Explorer track, check marks |
| `boss-magenta` | `#FF2D78` | Urgent/danger | Live-now sessions, boss fights, errors, destructive actions |
| `loot-gold` | `#FFD700` | Reward/warning | Achievements, leaderboard, Nerd Numbers, completable missions, conflicts |

### Website Bridge Colors

These are sampled from the NerdCon website hero and used sparingly for cross-brand moments (onboarding, splash, marketing screens):

| Token | Hex | Source | Usage |
|-------|-----|--------|-------|
| `sky-blue` | `#87CEEB` | Website hero sky | Onboarding background tint, celebration particles |
| `pixel-green` | `#2D8B2D` | Website palm trees | Nature/social event accents |
| `retro-red` | `#E63946` | "San Diego" script | Accent on celebration headers, limited use |
| `nav-dark` | `#1A2332` | Website nav bar | Header tint for marketing-adjacent screens |
| `cta-green` | `#2ECC71` | Website "Buy Tickets" button | Not used in app (reserved for website continuity) |

### Glow Effects

Glow is the brand. Clean icons + neon glow on active states = the NerdCon app look.

| Token | Value | Usage |
|-------|-------|-------|
| `glow-blue` | `0 0 12px rgba(53, 104, 255, 0.5)` | Active tabs, primary buttons, selected segments |
| `glow-cyan` | `0 0 12px rgba(0, 229, 255, 0.4)` | Live indicators, scanner viewfinder |
| `glow-green` | `0 0 12px rgba(57, 255, 20, 0.4)` | XP gains, completed items, schedule added |
| `glow-magenta` | `0 0 12px rgba(255, 45, 120, 0.4)` | Boss fights, live-now pulse |
| `glow-gold` | `0 0 12px rgba(255, 215, 0, 0.4)` | Achievements, completable missions |

---

## Typography

### Font Stack

| Role | Font | Fallback | Weight | Usage |
|------|------|----------|--------|-------|
| **Display/Mono** | JetBrains Mono | `ui-monospace, monospace` | 400, 700 | Headers, labels, timestamps, badges, nerd numbers, XP values |
| **Body** | DM Sans | `ui-sans-serif, system-ui, sans-serif` | 400, 500, 700 | Body text, descriptions, speaker bios, form inputs |
| **Pixel accent** | Press Start 2P | `cursive` | 400 | Level-up screens, quest complete celebrations, leaderboard headers ONLY |

### Type Scale

| Element | Font | Size | Weight | Tracking | Color |
|---------|------|------|--------|----------|-------|
| Screen title | JetBrains Mono | 18px (text-lg) | 700 | normal | terminal-white |
| Section header | JetBrains Mono | 11px (text-xs) | 500 | 0.05em (wider) | fog-gray, uppercase |
| Card title | JetBrains Mono | 14px (text-sm) | 700 | normal | terminal-white |
| Body text | DM Sans | 14px (text-sm) | 400 | normal | fog-gray |
| Small text | DM Sans | 12px (text-xs) | 400 | normal | fog-gray |
| Badge text | JetBrains Mono | 11px | 500 | 0.05em (wider) | varies, uppercase |
| Tab label | JetBrains Mono | 10px | 500 | 0.05em (wider) | varies, uppercase |
| Nerd number | JetBrains Mono | 14px | 700 | 0.1em | loot-gold |
| Invite code | JetBrains Mono | 12px | 400 | 0.2em | fog-gray, uppercase |
| Celebration | Press Start 2P | 16-24px | 400 | normal | xp-green or loot-gold |

### Rules

- **JetBrains Mono** is the voice of the system. It speaks for the app.
- **DM Sans** is the voice of the content. It speaks for humans (bios, descriptions).
- **Press Start 2P** is the cherry, not the cake. Max 2 words on screen at once. Only for dopamine moments.
- Never use pixel font for body text, navigation, or labels.

---

## Iconography

### System Icons

**Library:** Lucide React (`lucide-react`)
**Style:** Outline, 1.8px stroke weight, clean and minimal
**Size:** 22px (tab bar), 16-18px (in-card), 12-14px (inline with text), 10px (metadata)

### Session Type Icons

| Type | Icon | Color |
|------|------|-------|
| Keynote | `Flame` | boss-magenta |
| Panel | `MessageSquare` | nerdcon-blue |
| Workshop | `Wrench` | cyan-pulse |
| Fireside | `Coffee` | loot-gold |
| Lightning | `Zap` | cyan-pulse |
| Social | `Users` | xp-green |

### Map Markers (future)

Custom SVG icons for the venue map:
- **Swords** — Boss fight sessions (keynotes)
- **Scroll** — Workshops
- **Shield** — Networking zones
- **Treasure chest** — Sponsor activations
- **Campfire** — Social events

### Glow Treatment

Active/selected icons get a CSS `filter: drop-shadow()` with the relevant glow color. This is the primary visual indicator — NOT color fill, NOT size change. The glow IS the brand.

```css
.active-icon {
  filter: drop-shadow(0 0 8px rgba(53, 104, 255, 0.6));
}
```

---

## Layout

### Screen Structure

```
┌─────────────────────────────┐
│  safe-area-inset-top        │
│  ┌───────────────────────┐  │
│  │ Screen Header          │  │  ← font-mono text-lg bold
│  │ Subtitle               │  │  ← font-mono text-xs fog-gray
│  ├───────────────────────┤  │
│  │                        │  │
│  │ Content (scrollable)   │  │  ← flex-1 overflow-y-auto
│  │                        │  │
│  │                        │  │
│  │                        │  │
│  └───────────────────────┘  │
│  pb-20 (tab bar clearance)  │
├─────────────────────────────┤
│  Tab Bar (fixed bottom)     │  ← 4 tabs, panel-dark/95, backdrop-blur
│  safe-area-inset-bottom     │
└─────────────────────────────┘
```

### Spacing

| Context | Value | Tailwind |
|---------|-------|----------|
| Screen horizontal padding | 20px | `px-5` |
| Card internal padding | 16px | `p-4` |
| Section gap | 24px | `space-y-6` or `mb-6` |
| Card gap | 12px | `space-y-3` |
| Inline element gap | 8px | `gap-2` |
| Badge internal padding | 10px × 2px | `px-2.5 py-0.5` |
| Tab bar clearance | 80px | `pb-20` |
| Sheet bottom padding | 96px | `pb-24` (clears tab bar) |

### Container

All content is max-width `32rem` (`max-w-lg`) centered. This keeps the app feeling mobile-native on desktop.

---

## Components

### Card

- Background: `panel-dark` (#0D0D0D)
- Border: `border-white/5` (1px)
- Radius: `rounded-xl` (12px)
- Padding: `p-4` (16px)
- Optional glow: `shadow-glow-{color}` for emphasis states
- Track indicator: 2px left border in track color (`border-l-2`)

### Badge

- Background: `{color}/15` (15% opacity fill)
- Border: `{color}/30` (30% opacity border)
- Text: `{color}` (full color)
- Font: JetBrains Mono, 11px, uppercase, tracking-wider
- Radius: `rounded-full`
- Padding: `px-2.5 py-0.5`

### Button

| Variant | Background | Text | Border | Effect |
|---------|-----------|------|--------|--------|
| Primary | nerdcon-blue | terminal-white | none | glow-blue, scale(0.97) on press |
| Secondary | panel-dark | terminal-white | white/10 | border → nerdcon-blue/40 on hover |
| Ghost | transparent | fog-gray | none | → terminal-white on hover |

### Sheet (Bottom Drawer)

- Slides up from bottom with spring animation (damping: 25, stiffness: 300)
- Background: `panel-dark`
- Top border: `border-white/10`
- Drag indicator: `w-10 h-1 rounded-full bg-fog-gray/40`
- Max height: 85dvh
- Backdrop: `bg-black/60`
- Bottom padding: `pb-24` (critical — clears tab bar)

### Segmented Control

- Container: `panel-dark`, `rounded-full`, `border-white/5`, `p-1`
- Active indicator: `motion.div` with `layoutId` for spring slide
- Active: `nerdcon-blue` bg, `terminal-white` text, `glow-blue`
- Inactive: transparent, `fog-gray` text
- Supports badge counts and notification dots

### XP Bar

- Track: `h-2 rounded-full bg-white/5`
- Fill: `bg-xp-green`, animated width with spring physics
- Green glow on the fill: `box-shadow: 0 0 8px rgba(57, 255, 20, 0.5)`
- Labels: level on left (xp-green), XP count on right (fog-gray)

---

## Motion

### Principles

1. **Fast.** All animations under 300ms. This crowd has zero patience.
2. **Spring physics.** No linear easing. Everything bounces slightly.
3. **Purposeful.** Animation signals state change, not decoration.
4. **Haptic.** Vibration on XP gain (short burst, where supported).

### Catalog

| Trigger | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Tab switch | Glow fade in/out | 200ms | ease-out |
| Sheet open | Slide up from bottom | spring(25, 300) | spring |
| Sheet close | Slide down | spring(25, 300) | spring |
| Segment change | Pill slides horizontally | spring(30, 300) | spring |
| Card press | scale(0.97→1) | 150ms | spring |
| XP bar fill | Width 0→N% | spring(80, 20) | spring |
| XP toast | Slide down from top | spring(20, 300) | spring |
| Quest complete | Particle burst (future) | 500ms | ease-out |
| Level up | Particle burst + haptic | 800ms | ease-out |
| QR scan success | Pulse glow | 300ms | ease-out |

### What We Don't Animate

- Tab bar (always visible, always static)
- Text content (no fade-in for text — it's there instantly)
- Scroll (native only, no custom scroll physics)
- Icons (no spin, no bounce on idle)

---

## Track System

Sessions and quests are organized by track. Each track has a consistent color identity:

| Track | Color | Hex | Audience | Icon accent |
|-------|-------|-----|----------|-------------|
| Builder | cyan-pulse | `#00E5FF` | Engineers, technical | Wrench, Zap |
| Operator | nerdcon-blue | `#3568FF` | PMs, execs, strategy | Settings, MessageSquare |
| Explorer | xp-green | `#39FF14` | Networkers, connectors | Compass, Users |
| General | fog-gray | `#888888` | Everyone (keynotes, social) | Flame, Users |

Track color appears as:
- Left border on agenda cards (2px `border-l-{color}`)
- Vertical bar in schedule timeline
- Badge fill on session cards
- Filter chip active state

---

## Dark/Light

There is no light mode. The app is always dark. This is intentional:

1. Convention centers have mixed lighting — dark UI is always readable
2. The neon glow effects only work on dark backgrounds
3. The "arcade terminal" aesthetic requires darkness
4. Battery savings on OLED (most modern phones)

---

## Accessibility

- All text meets WCAG AA contrast on `#050505` background
- `terminal-white` (#F0F0F0) on `void-black` (#050505) = 17.4:1 ratio
- `fog-gray` (#888888) on `void-black` (#050505) = 5.9:1 ratio (passes AA)
- `nerdcon-blue` (#3568FF) on `panel-dark` (#0D0D0D) = 4.7:1 ratio (passes AA for large text)
- Touch targets: minimum 44×44px for all interactive elements
- Focus states: nerdcon-blue outline for keyboard navigation
- Reduced motion: respect `prefers-reduced-motion` — disable spring animations, use instant transitions
- Screen reader: all icons have aria-label, all images have alt text

---

## Platform Specifics

### PWA

- `theme-color`: `#050505`
- `background-color`: `#050505`
- `display`: standalone
- `orientation`: portrait
- Status bar: `black-translucent` (content extends under notch)

### Safe Areas

```css
:root {
  --sab: env(safe-area-inset-bottom, 0px);
  --sat: env(safe-area-inset-top, 0px);
}
```

- Screen headers: `paddingTop: calc(var(--sat) + 1rem)`
- Tab bar: `paddingBottom: var(--sab)`
- Sheets: `paddingBottom: var(--sab)` + `pb-24` for tab clearance

### Scrollbars

Thin, dark, subtle:
```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #0D0D0D; }
::-webkit-scrollbar-thumb { background: #888888; border-radius: 2px; }
```

---

## File Reference

| File | Purpose |
|------|---------|
| `src/index.css` | Tailwind @theme tokens, base styles, font imports |
| `src/components/Button.tsx` | Primary, secondary, ghost button variants |
| `src/components/Card.tsx` | Surface card with optional glow |
| `src/components/Badge.tsx` | Color-coded pill badges |
| `src/components/Sheet.tsx` | Bottom drawer with spring animation |
| `src/components/XPBar.tsx` | Animated XP progress bar |
| `src/components/SegmentedControl.tsx` | Sliding pill segment selector |
| `src/components/TabBar.tsx` | Bottom navigation (4 tabs) |
| `src/components/XPToast.tsx` | Floating XP notification |
| `src/components/QRCode.tsx` | Blue-on-dark QR renderer |
