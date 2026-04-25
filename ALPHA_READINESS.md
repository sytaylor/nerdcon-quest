# NerdCon Quest Alpha Readiness

Date: 2026-04-25
Status: ALPHA CANDIDATE, NOT EVENT-READY

## Independent View

The app now answers the shape of the core product question, but it does not fully answer the adoption question yet.

It does show the loop:

- Claim an identity.
- Get a Nerd Number.
- Build a schedule.
- Browse people and squads.
- Connect or message.
- Complete missions and earn XP.

That is enough to test whether the concept lands with a small alpha group.

It is not enough to trust as a live event app. The remaining risk is not "can we add more features?" The risk is whether a real attendee, under time pressure, understands what to do in the first 5 minutes and believes the app is useful enough to reopen later.

## What The App Answers Today

Yes:

- The product has a clear game-like wrapper around an event utility app.
- The Nerd Number concept is now visible and understandable.
- The Start Here checklist gives a first path through the product.
- The technical trust boundaries are materially better than before.
- The PWA path is still the right alpha path. Native apps would slow learning.

Partially:

- The social loop exists, but needs real-user testing to know whether connection requests, squads, and DMs feel natural.
- The XP loop exists, but needs production smoke testing to confirm server-owned mission sync feels immediate enough.
- The agenda/schedule loop exists, but only realistic event data will show whether it is useful.

No:

- The app does not yet prove retention. Nobody has tried it during a real event-like moment.
- The app does not yet prove trust. Observability and feedback capture are too thin.
- The app does not yet prove day-of reliability. Real phone, camera, auth, and flaky-network testing still need to happen.

## Alpha Goal

Run a 10-20 person alpha to answer one question:

> Can a tester understand NerdCon Quest, complete the first loop, and name a reason they would use it at an actual event?

The alpha should not be judged by feature completeness. It should be judged by time-to-first-value and observed confusion.

## Alpha Success Metrics

- 80% of testers complete profile setup without help.
- 80% understand what a Nerd Number is after seeing the home screen.
- 70% add at least one session.
- 50% add three sessions.
- 70% attempt a social action: QR scan, connection request, squad, party chat, or DM.
- Median time to first meaningful action is under 5 minutes.
- Each tester submits at least one bug or confusion note.
- No P0 data/privacy/auth issue is found.

## Build List To Alpha

This is the remaining build list before inviting alpha testers.

1. Production auth smoke

- Turn `VITE_DEV_MODE=false` in the deployed environment.
- Verify magic-link sign-in on iPhone Safari and Android Chrome.
- Verify new user profile creation, quest-line selection, sign-out, and return session.

2. Seed believable content

- Load realistic sessions, speakers, sponsors, and social events.
- Keep placeholder venue map clearly labeled if the real floor plan is not available.
- Create a small set of realistic test profiles or invite enough testers to avoid empty states.

3. Feedback capture

- Add a visible "Report issue" or "I'm confused" path.
- Include context in the report: current route, browser, user id, Nerd Number, timestamp.
- Route reports to a place the team will actually watch during alpha.

4. Core loop QA

- Test profile -> schedule -> connection -> squad/DM -> XP on real devices.
- Test slow network, refresh, deep links, camera permission denial, and expired session.
- Verify Supabase RLS expectations with at least two real test users.

5. Observability

- Add Sentry or equivalent client error capture.
- Add a simple alpha runbook with owner, deploy URL, Supabase project, rollback/fallback notes.
- Watch Supabase logs during the alpha window.

6. Social loop decision

- Either make organic squad join/open-chat obvious, or hide paths that imply unfinished behavior.
- Keep DMs opt-in only.
- Keep reporting visible wherever messages appear.

## Do Not Build Before Alpha

- Native iOS or Android apps.
- Push notifications.
- More achievement types.
- Admin dashboards beyond basic seed data.
- Store-ready privacy flows.
- Heavy visual redesign.

These may matter later. They do not answer the alpha question.

## Alpha Go / No-Go

Go when:

- Production auth works on two real phones.
- Seed content makes the app feel inhabited.
- The Start Here card points testers to working actions.
- Feedback capture exists.
- Supabase migrations are applied.
- `npm run lint`, `npm run test`, `npm run build`, and mobile e2e pass.

No-go when:

- Magic links fail or are confusing.
- The camera QR flow is broken on iPhone.
- XP or leaderboard can be directly manipulated from the client.
- Testers hit dead ends in the first 5 minutes.
- The team has no place to see bugs during the alpha.
