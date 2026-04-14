# Real Device Run Guide

This guide covers running the active React Native CLI app on a physical iPhone or Android phone without changing app behavior.

## What Was Checked

- The app does not hardcode `localhost`, `127.0.0.1`, or Android emulator-only hosts.
- Firebase Auth, Firestore, and Functions point at hosted Firebase config in `src/firebase/firebase.ts`.
- iOS already has `NSLocationWhenInUseUsageDescription` and allows local networking for Metro in `ios/SpotsMobile/Info.plist`.
- Android already has `INTERNET`, `ACCESS_COARSE_LOCATION`, and `ACCESS_FINE_LOCATION` in `android/app/src/main/AndroidManifest.xml`.
- React Native CLI in this project supports `run-ios --device` and `run-android --device`.

## Important Caveats

- iOS signing is still required on a real phone. The project bundle identifier is now `com.spotsmobile`; if that identifier is not usable in your Apple team, change it to a unique one in Xcode before building.
- Android direct local installs are fine with the current debug signing setup. The `release` build type still uses the debug keystore, which is acceptable for local phone installs only and not for store distribution.
- The Explore map on Android still needs a Google Maps API key. The app can install and launch without it, but map tiles may be blank on Android devices until that native key is configured.
- `createPromotedEvent` and `summarizeArea` call deployed Firebase Functions. Real-phone testing works against deployed Firebase services, not local emulators, unless you separately expose emulator endpoints to the phone and wire the app to use them.
- Denying location permission blocks post creation, promoted event creation, and automatic map recentering by design.

## Metro / Dev Server Assumptions

- Use `npm run start:device` from the repo root, or `npm run start:device` inside `mobile/`.
- That script runs Metro with `--host 0.0.0.0` so a physical phone can reach the packager over your local network.
- iPhone cannot use `adb reverse`, so the iPhone and Mac should be on the same Wi-Fi or Ethernet-backed LAN.
- Android works best over USB with `adb reverse tcp:8081 tcp:8081`.
- If a device does not auto-discover Metro, set the debug server host manually to `<your-mac-lan-ip>:8081` from the React Native developer menu on the phone.

## Exact Steps: iPhone Direct Install / Run

1. From the repo root, install JS deps if needed:

   ```bash
   npm run mobile:install
   ```

2. Install CocoaPods dependencies:

   ```bash
   cd mobile
   bundle install
   bundle exec pod install --project-directory=ios
   ```

3. Connect the iPhone by cable, unlock it, trust the Mac, and make sure iPhone Developer Mode is enabled.

4. Open the workspace in Xcode:

   ```bash
   open ios/SpotsMobile.xcworkspace
   ```

5. In Xcode, select the `SpotsMobile` target, open `Signing & Capabilities`, choose your Apple team, and confirm the bundle identifier is valid for that team.

6. Select the connected iPhone as the run destination.

7. In a terminal, start Metro for real devices:

   ```bash
   npm run start:device
   ```

8. Build and install from Xcode with the Run button.

9. After signing works once in Xcode, CLI installs can also be used:

   ```bash
   npx react-native run-ios --device "Your iPhone" --no-packager
   ```

10. If the app launches but cannot load JavaScript, open the in-app developer menu and set `Debug server host & port for device` to `<your-mac-lan-ip>:8081`, then reload.

## Exact Steps: Android Phone Direct Install / Run

1. Enable Android Developer Options and USB debugging on the phone.

2. Connect the phone by USB and verify that ADB can see it:

   ```bash
   adb devices
   ```

3. From the repo root, start Metro for real devices:

   ```bash
   npm run start:device
   ```

4. Reverse the Metro port over USB:

   ```bash
   adb reverse tcp:8081 tcp:8081
   ```

5. Build and install the debug app:

   ```bash
   cd mobile
   npx react-native run-android
   ```

6. If you have more than one Android device connected, target the phone by name:

   ```bash
   npx react-native run-android --device "<device name>"
   ```

7. If USB reverse is unavailable, keep the phone on the same network as the Mac and set the React Native debug server host on the phone to `<your-mac-lan-ip>:8081`.

## Summary Of Physical-Phone Risks In This App

- iPhone builds depend on valid Apple signing in Xcode.
- Android Explore map rendering depends on a Google Maps API key that is not yet configured in native Android files.
- Callable backend features depend on deployed Firebase Functions.
- Real-device debugging depends on Metro being reachable from the phone, which is why `start:device` is the preferred packager command.
