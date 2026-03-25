# NerdCon Quest — Project Instructions

## What This Is
Gamified conference PWA for Fintech NerdCon, San Diego, Nov 19-20 2026. ~1500 attendees.
RPG-skinned conference app: quests, XP, parties, interactive venue map. Built to replace generic apps like Whova.

## Tech Stack
- **Frontend:** React 19 + TypeScript, Vite 8, TailwindCSS v4, Framer Motion
- **Backend:** Supabase (Postgres + Realtime + Auth + Edge Functions)
- **PWA:** vite-plugin-pwa + Workbox
- **Native:** Capacitor (future — iOS/Android store builds)
- **Deploy:** Vercel (PWA), Supabase cloud (DB)
- **Auth:** Magic link (Supabase OTP)

## Key Architecture Decisions
- **Party chat** — Real-time chat within party groups (max 6 people) via Supabase Realtime. Anti-spam: rate limiting (1msg/sec DB, 5msg/30sec client). DMs planned for Phase 3 (opt-in accept model).
- **No staff QR check-in** — Deferred to future release. Simpler quest validation for v1.
- **SVG venue map** — Custom interactive SVG, NOT Google Maps. Stub layout until real floor plan arrives.
- **Client-side XP engine** — Quest conditions evaluated client-side, XP written to Supabase. No game engine.
- **Dev mode** — `VITE_DEV_MODE=true` in .env bypasses Supabase auth with mock data (Nerd #0042, 150 XP)

## Brand — "Arcade Terminal"
- **Palette:** Void Black #050505, Panel Dark #0D0D0D, NerdCon Blue #3568FF, Cyan Pulse #00E5FF, XP Green #39FF14, Boss Magenta #FF2D78, Loot Gold #FFD700, Terminal White #F0F0F0, Fog Gray #888888
- **Fonts:** JetBrains Mono (headers/mono), DM Sans (body). Press Start 2P sparingly for celebrations.
- **Icons:** Lucide with neon glow on active states. NOT pixel art everywhere.
- **Motion:** All animations under 300ms. Spring physics. Haptic on XP gain.

## Supabase
- **Project ID:** vmhxhkhwzpmcrljqvfmc
- **URL:** https://vmhxhkhwzpmcrljqvfmc.supabase.co
- **Migrations:** `supabase/migrations/` — apply with `supabase db push`
- **Tables:** profiles, nerd_number_counter, connections, quests, user_quests, sessions, user_schedule
- **RLS:** Active on all tables. Public read on profiles/sessions/quests. Owner-only write.

## Nerd Numbers
- Persistent, sequential, assigned at signup via atomic counter
- 4-digit zero-padded: Nerd #0042
- Fun numbers are prizes: #0007, #0069, #0420, #1337
- Never reused. Simon is Nerd #0001.

## Navigation
- 4 bottom tabs: Map, Quests, Party, Profile
- Quests tab is a hub with segmented control: Agenda / My Schedule / Missions
- Agenda is the default view (most-used)
- No page navigation from the Quests tab — views swap in-place

## Quest System
- Three quest lines: Builder (technical), Operator (strategy), Explorer (networking)
- Quest line chosen at onboarding, switchable from Profile
- XP levels: Newbie (0-200), Apprentice (200-500), Operator (500-1000), Veteran (1000-1500), Legend (1500+)
- Anti-gaming: mutual QR scan, time-window validation

## Release Timeline
1. **Early Access (Sep 24):** Signup, nerd numbers, profiles, parties, agenda, schedule, missions
2. **Map Drop (Oct 8):** SVG venue map, social events, sponsor side quests
3. **Game On (Nov 19):** QR scanning, live map, session check-ins, all missions active
4. **Aftermath (Nov 21+):** Final leaderboard, contact export, NerdCon 2027 early access

## File Structure
```
src/
  components/   — Reusable UI (Button, Card, Badge, Sheet, XPBar, TabBar, QRCode, QRScanner)
  screens/      — Full screens (MapScreen, AgendaScreen, ScheduleScreen, etc.)
  lib/          — Hooks and utilities (auth, sessions, supabase, format)
supabase/
  migrations/   — SQL migration files (001_, 002_, etc.)
public/         — PWA icons, favicon
```

## Commands
- `npm run dev` — Start dev server (port 5173)
- `npm run build` — Production build (tsc + vite)
- `SUPABASE_ACCESS_TOKEN=xxx supabase db push -p xxx` — Apply migrations

## Current State (as of Inc 4)
- Inc 0: PWA shell + design system ✅
- Inc 1: Auth + profiles + QR + onboarding ✅
- Inc 2: Agenda + sessions + schedule ✅
- Inc 3: Unified missions tab + XP engine ✅
- Inc 4: Party system (create, join, members, invite codes) ✅
- Inc 5: Quest engine polish + leaderboard — NEXT
- Inc 6: Social events + sponsor activations — PLANNED
- Inc 7: Pre-event launch + polish — PLANNED
- Inc 8: Load test + ship — PLANNED
