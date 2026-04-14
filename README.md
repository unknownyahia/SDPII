# Spots

This repository contains the active **React Native CLI** mobile app for Spots, plus the Firebase backend and backend trust tests.

## Active App Path

The active mobile implementation is:

- `mobile/`

The old Expo proof-of-concept has been archived for reference in:

- `legacy-expo/`

It is **not** the active runtime or development path anymore.

## Repo Structure

- `mobile/`: active React Native CLI app
- `functions/`: Firebase Cloud Functions
- `tests/`: backend trust tests
- `firestore.rules`: Firestore security rules
- `firebase.json`: emulator and functions config
- `legacy-expo/`: archived Expo PoC reference

## Run The Active Mobile App

From the repo root:

```bash
npm run mobile:install
npm run start
```

Android:

```bash
npm run android
```

iOS:

```bash
cd mobile
bundle install
bundle exec pod install --project-directory=ios
cd ..
npm run ios
```

Useful mobile commands:

```bash
npm run mobile:typecheck
npm run mobile:lint
npm run start:device
```

For physical phone setup and exact real-device steps, see
[mobile/REAL_DEVICE_RUN.md](/Users/unknownyahia/Documents/SDPII/SDPII/mobile/REAL_DEVICE_RUN.md).

## Run Backend / Emulators

Install functions dependencies if needed:

```bash
npm run functions:install
```

Run Firestore + Functions emulators:

```bash
npm run backend:emulators
```

## Run Backend Trust Tests

From the repo root:

```bash
npm install
npm run test:backend-trust
```

This runs:

- Firestore emulator
- Functions emulator
- `node --test tests/backend-trust.test.cjs`

More detail is in [tests/README.md](tests/README.md).

## Manual Setup Required

### Mobile environment

- Android SDK and an emulator or connected Android device
- Xcode for iOS builds
- CocoaPods installed on your machine

### iOS native dependencies

Inside `mobile/`:

```bash
bundle install
bundle exec pod install --project-directory=ios
```

### Maps

- A Google Maps API key is still needed for full `react-native-maps` rendering on Android
- Without it, the Explore screen may boot but the map tiles may not render correctly

### Firebase / backend

- The mobile app currently uses the Firebase JavaScript SDK configuration already in `mobile/src/firebase/firebase.ts`
- The backend callable summary flow requires Firebase Functions to be deployed or emulated
- `functions/index.js` also requires OpenAI config on the backend

### OpenAI config for summaries

The callable `summarizeArea` expects Firebase runtime config:

```bash
firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY"
```

If you are using emulators, make sure the functions emulator can read the same config.

## Known Limitations

- iOS builds cannot complete until CocoaPods is installed locally
- Android map rendering still needs a Google Maps API key
- The app is now visually much more polished, but Explore and Profile still contain broad multi-purpose flows on single screens by design
- `legacy-expo/` is preserved as reference and has not been maintained as a runnable target

## Legacy Reference

If you need the old Expo PoC for comparison or historical reference, see:

- `legacy-expo/`
