# Backend Trust Tests

These tests cover the most important trust-sensitive backend flows for the current Spots MVP:

- Firestore security rules
- Cloud Functions-owned XP side effects
- Cloud Functions-owned notifications
- Cloud Functions callable enforcement for promoted event creation

## Run locally

From the repo root:

```bash
npm run test:backend-trust
```

This uses `firebase emulators:exec` to start the Firestore and Functions emulators, then runs:

```bash
node --test tests/backend-trust.test.cjs
```

## Assumptions

- Firebase CLI and emulator dependencies are available through the repo dev dependencies.
- Firestore rules are loaded from `firestore.rules`.
- Functions are loaded from `functions/index.js`.
- The tests use a dedicated emulator project id: `spots-backend-test`.
- The tests focus on backend trust boundaries, not mobile UI behavior.

## Current coverage notes

- Firestore rules are tested with `@firebase/rules-unit-testing`.
- Firestore-triggered backend side effects are tested through emulator writes plus polling for backend-created documents.
- The callable `createPromotedEvent` is tested by wrapping the exported function directly with `firebase-functions-test` while the emulator-backed Firestore is active.

## Remaining manual areas

- Full emulator deployment wiring in team/CI environments
- Any production-only Firebase config differences
- End-to-end mobile-to-emulator integration outside these backend-focused tests
