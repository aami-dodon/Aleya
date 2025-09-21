# Aleya Mobile App

This directory contains an Android application that brings Aleya's luminous grove guidance to phones and tablets. The home screen pairs a rotating reflective prompt with a grounding affirmation and keeps a lightweight log of the sessions you mark complete.

## Requirements

- [Android Studio](https://developer.android.com/studio) Flamingo or newer (Gradle 8.x, AGP 8.2+)
- Android SDK 34 with build tools 34.0.0
- A device or emulator running Android 7.0 (API 24) or newer

## Bootstrapping the Gradle wrapper when binaries are excluded

Some Git hosting providers or repositories forbid committing binary artifacts such as `gradle-wrapper.jar`. If your checkout is
missing this file, generate it locally before building:

1. Install the standalone Gradle CLI if you do not already have it (e.g., `brew install gradle` on macOS).
2. From the repository root run:
   ```bash
   cd mobile
   gradle wrapper --gradle-version 8.5 --distribution-type bin
   ```
   This command recreates `gradle/` wrapper metadata along with the launcher scripts.
3. Subsequent builds can use the freshly generated wrapper via `./gradlew` or Android Studio.

## Project structure

```
mobile/
├── app/                # Android application module
│   └── src/main/       # Kotlin source, manifest, and resources
├── build.gradle        # Root Gradle build configuration
├── gradle/             # Gradle wrapper metadata
├── gradle.properties   # Shared Gradle properties
├── gradlew             # Unix Gradle wrapper launcher
├── gradlew.bat         # Windows Gradle wrapper launcher
└── settings.gradle     # Gradle settings file
```

## Building the APK

1. **Open in Android Studio** (recommended)
   - Select **File → Open…** and choose the `mobile` directory.
   - Let Android Studio download dependencies and index the project.
   - Use **Build → Build Bundle(s) / APK(s) → Build APK(s)**. The generated APK will appear in `mobile/app/build/outputs/apk/`.

2. **Or build from the command line** (after bootstrapping the wrapper)
   ```bash
   cd mobile
   ./gradlew assembleDebug --console=plain
   ```
   The debug APK will be located at `mobile/app/build/outputs/apk/debug/app-debug.apk`.

## Installing the APK

1. Enable **Developer options** and **USB debugging** on your Android device.
2. Connect the device via USB and trust the host computer.
3. Install the APK using Android Studio's **Device Manager** or via the command line:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```
4. Launch **Aleya Mobile** from your device drawer. Tap **Log reflection** to capture a session, cycle through fresh prompts, and explore the affirmation deck.

## Customizing prompts and affirmations

- Update the curated decks inside `app/src/main/java/com/aleya/mobile/MainActivity.kt` (`prompts` and `affirmations` lists).
- Adjust `MaxHistoryItems` to keep more or fewer session entries.
- Rebuild the APK to deliver the refreshed experience to your testers.
