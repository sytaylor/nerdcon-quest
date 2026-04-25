# NerdCon Quest - Functioning Prototype Plan

Date: 2026-04-25
Mode: `/plan-eng-review`
Status: HARDENED PROTOTYPE IN PROGRESS

## Executive Verdict

NerdCon Quest should ship first as a hardened PWA, not native iOS/Android apps.

Native store builds are a second product surface. They add app review, account deletion rules, privacy nutrition labels, push permission strategy, device permission strings, screenshots, TestFlight/Play testing, and release operations. None of that improves the first 60 seconds for an attendee at NerdCon. The PWA path is faster, safer, and enough to validate the core product.

The prototype goal is not "conference app with everything." It is:

> Attendee opens link, claims identity, understands Nerd Number, adds sessions, connects with people, joins a squad, earns XP, and trusts the app during bad WiFi.

## Product Quality Bar

The app is good enough for a functioning prototype when a real attendee can do this without help:

1. Sign in with email.
2. Complete profile and choose a path.
3. Understand what Nerd Number means.
4. Add at least 3 sessions to their schedule.
5. Scan or request a connection.
6. Send/accept a DM only after consent.
7. Join/create a squad and chat.
8. See XP update from server-owned rules.
9. Browse sponsors and map without dead-end confusion.
10. Recover from offline/slow network states without thinking the app is broken.

## Current Architecture

```text
Attendee phone
  |
  | HTTPS
  v
Vercel PWA
  |
  | supabase-js anon key
  v
Supabase
  |-- Auth: magic link
  |-- Postgres: profiles, sessions, schedule, parties, chat, DMs, sponsors
  |-- RLS: privacy and authorization
  |-- Realtime: party chat, DMs, connection requests
  |-- RPC: join_party_by_invite, accept_dm_request, sync_profile_missions
```

## State Diagnosis

Team/product state: repaying debt before prototype confidence.

The app has real product shape, but reliability/security gaps are bigger than feature gaps. Adding native builds, push notifications, or more game mechanics before hardening would increase blast radius without proving the attendee loop.

## Hardening Already Applied

This pass added `supabase/migrations/010_security_hardening.sql` and matching client changes.

### Trust Boundary Changes

```text
Before
  Client can list parties -> sees invite codes -> joins private groups.
  Client can create DM conversation -> bypasses accept flow.
  Client can update profile XP -> leaderboard can be gamed.
  Client filters discoverable profiles -> database still leaks profiles.

After
  Client calls join_party_by_invite(code).
  Client calls accept_dm_request(request_id).
  Client calls sync_profile_missions().
  Profile RLS includes discoverability and relationship checks.
```

### Quality Gate Changes

- `npm run lint` passes.
- `npm run build` passes.
- `.gstack/` is ignored so local security reports do not get committed.
- README now documents actual project shape instead of Vite template text.

## Remaining Known Risks

| Priority | Risk | Why It Matters | Fix |
|---|---|---|---|
| P0 | Migration not applied remotely yet | Client now expects new RPCs | Run `supabase db push`, then smoke test auth, party join, DM accept, XP |
| P0 | No automated tests | Core loop can regress silently | Add Vitest + Playwright coverage for auth/dev mode, QR, XP, DMs, party joins |
| P0 | No production observability | Day-of failures will be invisible | Add Sentry, Vercel analytics/log drains, Supabase dashboard checks |
| P1 | PWA audit still has transitive `serialize-javascript` high findings | Build-chain risk remains | Track vite-plugin-pwa/workbox fix or evaluate safe replacement |
| P1 | Map is still a stub | Attendee trust drops if venue info is fake | Replace with real floor plan once available, or label as preview |
| P1 | Organic squads UI is not fully wired | "Join" buttons imply behavior that is not complete | Either implement join/open chat or hide until real |
| P1 | First 60 seconds lacks a strong "do this first" path | Adoption failure is as bad as crash failure | Add launch checklist and Nerd Number explainer |
| P2 | No account deletion/privacy UX | Required before native, useful for trust now | Add profile deletion/export path and privacy copy |

## Target Prototype Architecture

```text
                 +-------------------------+
                 |      App Shell          |
                 | ErrorBoundary, PWA, nav |
                 +------------+------------+
                              |
      +-----------------------+-----------------------+
      |                       |                       |
      v                       v                       v
  Identity               Event Utility           Social Graph
  onboarding            agenda, map              QR, requests,
  profile               schedule, sponsors       parties, DMs
      |                       |                       |
      +-----------+-----------+-----------+-----------+
                  |                       |
                  v                       v
          Server-owned XP          Moderation + privacy
          RPC calculates           RLS gates data access
          leaderboard state        consent gates messages
```

## Data Flow: XP

```text
User action
  |
  | add session / connect / RSVP / message / sponsor visit
  v
Supabase row written under RLS
  |
  | client asks to refresh missions
  v
sync_profile_missions()
  |
  | counts trusted database rows
  v
profiles.xp, profiles.level, profiles.completed_missions
  |
  v
Leaderboard reads server-owned profile values
```

The client can still render progress optimistically, but it no longer owns the game outcome.

## Data Flow: DM Consent

```text
Sender -> dm_requests pending
             |
Recipient accepts
             |
             v
accept_dm_request(request_id)
  |-- verifies recipient is auth.uid()
  |-- verifies request is pending
  |-- creates ordered conversation
  v
direct_messages allowed only for conversation participants
```

## Data Flow: Private Party Join

```text
Invite code typed by attendee
  |
  v
join_party_by_invite(code)
  |-- code lookup happens server-side
  |-- capacity checked server-side
  |-- membership inserted server-side
  v
client can now read own party and messages through RLS
```

## Prototype Milestones

### Milestone 1 - Trust Boundaries

Exit criteria:

- Remote Supabase has migration `010_security_hardening.sql`.
- Attempting direct DM conversation insert as an authenticated client fails.
- Attempting to list all private party invite codes as an unrelated authenticated client fails.
- `discoverable=false` profile is hidden from unrelated users.
- Direct client profile XP update fails.
- `sync_profile_missions()` updates XP based on real rows.

Commands:

```bash
supabase db push
npm run lint
npm run build
npm audit --audit-level=moderate
```

### Milestone 2 - Core Loop Prototype

Exit criteria:

- New user can sign in and finish onboarding.
- Onboarding explains Nerd Number in one screen.
- User sees "Start here" checklist after onboarding:
  - Complete profile.
  - Add 3 sessions.
  - Connect with 1 person.
  - Join/create squad.
- QR scan and connection request both create connection safely.
- XP toast fires after server sync.
- Leaderboard reflects server-owned XP.

Implementation notes:

- Add an `OnboardingCompleteCard` or home checklist on Map/Profile.
- Keep game language, but make the job-to-be-done explicit.
- Avoid tutorial bloat. One screen, one checklist, obvious next actions.

### Milestone 3 - Social Prototype

Exit criteria:

- People directory search/filter works with privacy RLS.
- Connection request accept/decline works.
- DM request accept creates conversation through RPC only.
- Party create/join works through private invite code.
- Organic squad buttons either work or are hidden.
- Message report writes `message_reports`.
- Offline banner appears and message send errors are user-readable.

### Milestone 4 - Event Utility Prototype

Exit criteria:

- Agenda data is accurate enough for beta.
- Schedule add/remove works.
- RSVP works for social sessions.
- Sponsors render from DB and visits persist.
- Map clearly states "preview" until real venue layout exists.
- Session detail sheets have complete speaker/session data or explicitly marked placeholder data.

### Milestone 5 - Reliability Prototype

Exit criteria:

- Error boundary verified with an intentional test throw.
- App works after refresh on deep routes.
- PWA install path works on iOS Safari and Android Chrome.
- Main bundle remains below 300 KB gzip, excluding lazy route chunks.
- Precache stays below 1.5 MB until assets are finalized.
- Slow-network test shows loading states rather than blank screens.

### Milestone 6 - Beta

Exit criteria:

- 20 non-friend beta users complete the core loop.
- Record time-to-first-value:
  - Target: under 2 minutes to profile + first meaningful action.
  - Target: under 5 minutes to first connection or schedule add.
- Capture confusion points without prompting.
- Fix the top 5 user-observed blockers before early access.

## Test Plan

### Unit / Hook Tests

Use Vitest + React Testing Library.

Cover:

- Mission derivation from counts.
- Level thresholds.
- Message moderation.
- Formatting utilities.
- Onboarding validation.
- Connection state helpers.

### Integration Tests

Use Supabase local + seeded migrations where possible.

Cover:

- Profile privacy policy.
- Party join RPC.
- DM accept RPC.
- XP sync RPC.
- Connection request accept.

### E2E Tests

Use Playwright.

```text
dev-mode happy path:
  open app
  see Map
  go Quests
  add session
  go Community
  open person sheet
  send connection request
  go Profile
  see QR
```

Production-like path:

```text
email auth mocked or test account
  sign in
  complete profile
  choose path
  add schedule
  join party with known invite
  accept DM request
  sync XP
```

## Native App Decision

Do not build native apps for this prototype.

Revisit native only when all are true:

- PWA beta adoption is strong.
- Day-of operational plan is proven.
- Privacy/account deletion flows exist.
- Push notifications have a clear event-critical use case.
- There is a maintainer for App Store/Play Store release operations.

Native readiness checklist if revisited:

- Capacitor or Expo decision.
- iOS/Android projects committed.
- Camera permission copy.
- Account deletion in app.
- Privacy policy and data safety forms.
- Store screenshots and metadata.
- TestFlight/Play internal test tracks.
- Deep links/universal links.
- Push notification consent and fallback.
- Release calendar with app review buffer.

## Day-Of Ops Runbook

Owner roles:

- Product owner: decides if feature is disabled.
- Engineering owner: monitors deploy, Supabase, logs.
- Support owner: collects attendee issues.
- Event ops owner: communicates fallback if needed.

Checks:

```text
T-7 days: freeze schema, beta smoke, rollback plan
T-2 days: load test, deploy freeze unless P0
T-1 day: QR/core loop smoke on real phones
Event morning: sign-in, agenda, QR, party, DM, leaderboard smoke
Hourly: Supabase errors, Realtime health, Vercel errors, support queue
```

Fallbacks:

- Agenda failure: static web agenda link.
- QR failure: manual connect by Nerd Number.
- Chat failure: hide squad chat entry point.
- Leaderboard failure: hide leaderboard tab.
- Map failure: static venue image.

## Definition Of Done For "Functioning Prototype"

The prototype is ready when:

- `npm run lint` passes.
- `npm run build` passes.
- P0 RLS checks pass on Supabase.
- Core loop passes on two iPhones and two Android devices.
- 20-user beta has been completed.
- Top 5 beta blockers are fixed.
- Day-of fallback runbook exists and has named owners.
- README and this plan match the shipped app.

## Immediate Next Actions

1. Apply migration `010_security_hardening.sql` to Supabase.
2. Add automated tests around the new RPC trust boundaries.
3. Implement the first-60-seconds checklist and Nerd Number explanation.
4. Wire or hide organic squad joins.
5. Add production observability.
6. Resolve or explicitly accept the remaining PWA build-chain audit issue.
