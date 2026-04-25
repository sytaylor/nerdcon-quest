# NerdCon Quest

Gamified conference PWA for Fintech NerdCon San Diego, Nov 19-20 2026.

This is the mobile-first event companion: agenda, schedule, QR networking, squads, DMs, missions, XP, leaderboard, sponsors, and venue map. The target is a reliable PWA prototype before considering native app store builds.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Supabase Postgres, Auth, Realtime, RLS, RPC functions
- vite-plugin-pwa + Workbox
- Vercel for PWA deploy

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Environment

Create `.env` from `.env.example`.

```bash
VITE_DEV_MODE=false
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`VITE_DEV_MODE=true` uses mock data and bypasses Supabase auth for local UI work.

## Database

Migrations live in `supabase/migrations/`.

Apply them with:

```bash
supabase db push
```

The latest hardening migration is `010_security_hardening.sql`. It moves the riskiest trust boundaries server-side:

- Profile privacy respects `discoverable=false`.
- Private party invite codes are no longer enumerable by all authenticated users.
- Joining a private party happens through `join_party_by_invite()`.
- DM conversation creation happens through `accept_dm_request()`.
- XP/profile game fields are server-owned through `sync_profile_missions()`.

## Prototype Plan

The current engineering plan is in [PROTOTYPE_PLAN.md](./PROTOTYPE_PLAN.md).
