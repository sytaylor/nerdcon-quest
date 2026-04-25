# NerdCon Quest Test Plan

Date: 2026-04-25
QA mode: `/qa`
Scope: hardened PWA prototype, Supabase trust boundaries, core attendee loop

## Objective

Prove the app is safe enough and usable enough for a functioning prototype:

```text
attendee opens app
  -> claims profile
  -> understands Nerd Number
  -> adds sessions
  -> connects with people
  -> joins squad / messages by consent
  -> earns server-owned XP
  -> survives bad network conditions
```

## Test Pyramid

```text
             manual beta, 20 real users
          +-----------------------------+
          | PWA install / device checks |
          +-----------------------------+
          | Playwright E2E core loops   |
          +-----------------------------+
          | Supabase integration tests  |
          +-----------------------------+
          | Vitest unit / hook tests    |
          +-----------------------------+
```

## Quality Gates

These commands must pass before every push:

```bash
npm run lint
npm run test
npm run build
```

These commands are required before early-access release:

```bash
npm run test:e2e
npm audit --audit-level=moderate
supabase db push
```

Known exception: `npm audit --audit-level=moderate` currently fails on a high-severity transitive `serialize-javascript` issue through `vite-plugin-pwa` / `workbox-build`. Do not run `npm audit fix --force` blindly because it downgrades PWA tooling. Track or replace that dependency separately.

## Unit Tests

Framework: Vitest.

Initial coverage implemented:

- `src/lib/format.test.ts`
- `src/lib/moderation.test.ts`
- `src/lib/xp.test.ts`

Required next coverage:

- `src/lib/connections.tsx`: request state helpers, pending/connected behavior.
- `src/lib/sessions.ts`: schedule add/remove optimistic behavior.
- `src/lib/sponsors.ts`: visit progress behavior.
- `src/lib/auth.tsx`: dev-mode and incomplete-profile routing.
- `src/components/QRCode.tsx`: encoded payload shape.
- `src/components/QRScanner.tsx`: valid/invalid payload handling with scanner mocked.

## Supabase Integration Tests

Run against a local Supabase stack or disposable remote branch.

### RLS / Privacy

1. Create user A and user B.
2. Set user B `discoverable=false`.
3. As unrelated user A, query `profiles`.
4. Expected: user B is not returned.
5. Create a connection A-B.
6. Expected: user B is now readable to user A.

### Private Party Join

1. Create private party as user A.
2. As unrelated user B, query `parties`.
3. Expected: user B cannot enumerate private party invite code.
4. As user B, call `join_party_by_invite(valid_code)`.
5. Expected: membership is created.
6. As user B, query own party.
7. Expected: party is readable.

### DM Consent

1. Create user A and user B.
2. As user A, attempt direct insert into `dm_conversations`.
3. Expected: insert fails.
4. Create accepted connection A-B.
5. User A sends `dm_requests` row.
6. User B calls `accept_dm_request(request_id)`.
7. Expected: one ordered conversation exists.
8. User A/B can send messages in that conversation.

### Server-Owned XP

1. As user A, attempt to update `profiles.xp`.
2. Expected: update fails with `game fields are server-owned`.
3. Create qualifying rows: schedule, connection, RSVP, messages, sponsor visits.
4. Call `sync_profile_missions()`.
5. Expected: XP/level/completed missions match rule table.

## E2E Tests

Framework: Playwright.

Initial smoke coverage implemented:

- `tests/e2e/dev-mode-smoke.spec.ts`
- Mobile Chrome + Mobile Safari projects
- Dev-mode web server on port `4174`

Required E2E scenarios:

### Dev Mode Core Navigation

- Map loads.
- Quests tab opens.
- Community tab opens.
- Profile tab opens.
- No console errors.

### Onboarding

- User enters email.
- Magic-link pending state appears.
- Existing authenticated user with missing profile lands on profile setup.
- Quest-line choice completes onboarding.

### Agenda / Schedule

- Filter day and track.
- Add 3 sessions.
- My Schedule reflects selection.
- Mission progress updates after sync.

### Community

- Search people.
- Open person sheet.
- Send connection request.
- Accept incoming request.
- Message button only appears after connection.

### Squads

- Create private squad.
- Copy invite code.
- Join via invite code as another user.
- Send party chat message.
- Report message.

### Profile / QR

- QR code renders.
- Scanner handles invalid QR without crashing.
- Scanner handles valid NerdCon payload.
- Self-scan is blocked.

## Manual Device QA

Run on at least:

- iPhone Safari, latest iOS.
- iPhone Chrome.
- Android Chrome.
- Desktop Chrome narrow viewport.

Checks:

- PWA install prompt / Add to Home Screen.
- Camera permission copy.
- Safe-area insets around header and tab bar.
- Keyboard behavior in chat and profile forms.
- Offline banner.
- Refresh after install.
- Deep route refresh on `/community`, `/quests`, `/profile`.

## Performance QA

Targets:

- Initial JS gzip under 150 KB for app shell.
- Lazy route chunks under 150 KB gzip each, except QR scanner route until separated.
- PWA precache under 1.5 MB until final assets are added.
- Slow 3G load shows useful loading state, not blank screen.

Current known issue:

- `ProfileScreen` chunk is about 117 KB gzip because QR scanner dependencies are loaded with profile. Split QR scanner into a lazy sheet before early access.

## Accessibility QA

Minimum checks:

- Every interactive icon button has accessible name.
- Bottom tab links are reachable by keyboard.
- Sheet close controls are keyboard reachable.
- Color is not the only signal for selected/complete state.
- Form errors are visible and announced enough for screen readers.
- Text remains usable at mobile zoom.

## Regression Checklist

Run before merging:

```text
auth/onboarding       pass/fail
profile update        pass/fail
agenda add/remove     pass/fail
mission sync          pass/fail
QR connection         pass/fail
people search         pass/fail
connection request    pass/fail
DM accept/send        pass/fail
party create/join     pass/fail
sponsor visit         pass/fail
leaderboard           pass/fail
offline banner        pass/fail
PWA install           pass/fail
```

## Release Criteria

The prototype can go to beta when:

- Lint, unit tests, build pass.
- Supabase RLS integration tests pass.
- Playwright dev-mode smoke passes on at least one browser project.
- Manual device QA passes on iPhone Safari and Android Chrome.
- No P0/P1 known bugs remain.
- Known audit exception has an explicit owner and mitigation.
