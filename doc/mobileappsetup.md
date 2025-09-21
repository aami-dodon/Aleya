# Aleya Android App Setup on macOS

Follow this guide to build and run the Aleya Android application on a macOS machine using Android Studio and the built-in Android Emulator.

## Prerequisites
- **Hardware:** An Apple Silicon (M1/M2/M3) or Intel-based Mac with at least 8 GB RAM and 10 GB of free disk space.
- **Operating System:** macOS Ventura (13) or newer is recommended.
- **Software:**
  - [Android Studio](https://developer.android.com/studio) (Giraffe or newer) with the Android SDK Platform 34 and Android SDK Build-Tools 34.0.0 installed.
  - Android Emulator image (e.g., "Pixel 6 Pro" with Android 14).
  - Homebrew (optional) for installing command-line tools like `adb`.

## 1. Clone and Open the Project
1. Clone the repository or sync to the commit that introduced the mobile module.
   ```bash
   git clone https://github.com/<your-org>/Aleya.git
   ```
2. (Binary-free hosting) If `mobile/gradle/wrapper/gradle-wrapper.jar` is absent because your Git provider disallows binaries, generate it locally before opening Android Studio:
   ```bash
   cd Aleya/mobile
   gradle wrapper --gradle-version 8.5 --distribution-type bin
   ```
   You can install Gradle via Homebrew (`brew install gradle`) if it is not already available on your PATH.
3. In Android Studio, choose **File → Open...**, navigate to the cloned repository, and select the `mobile` directory. Android Studio will import the Gradle project.

## 2. Configure Android Studio
1. Accept any prompts to install missing SDK components.
2. Verify the **Project Structure → SDK Location** points to a valid Android SDK.
3. Ensure **Build Tools** version `34.0.0` (or later) is installed via **Tools → SDK Manager → SDK Tools**.
4. Enable **Android Emulator** in SDK Tools if it is not already installed.

## 3. Sync Gradle and Build the APK
1. Android Studio automatically runs a Gradle sync; if prompted, click **Sync Now**.
2. Trigger a build via **Build → Make Project** or use the toolbar hammer icon.
3. To generate the debug APK manually (after the wrapper has been bootstrapped or regenerated):
   - Select **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
   - After the build completes, click **locate** in the notification to open the `app-debug.apk` location. The file lives at `mobile/app/build/outputs/apk/debug/app-debug.apk`.

## 4. Create and Configure a Virtual Device (AVD)
1. Open **Tools → Device Manager**.
2. Click **Create Device** and choose a phone profile (e.g., **Pixel 6 Pro**), then click **Next**.
3. Select a system image such as **Android 14 (UpsideDownCake)** and download it if necessary.
4. Finish the wizard. The new AVD appears in the Device Manager list.
5. (Optional) Adjust emulator settings (RAM, storage, graphics) via the **Edit** icon if you encounter performance issues.

## 5. Run the App on the Emulator
1. Launch the emulator by clicking the **Play** button next to the AVD in Device Manager.
2. Once the emulator boots, ensure it shows up in the device selector at the top of Android Studio.
3. Press the **Run** button (green triangle) or use **Run → Run 'app'**.
4. Android Studio builds and deploys the app to the emulator. When deployment finishes, the Aleya app opens automatically.

## 6. Interact with the App
- Explore the Aleya prompts and affirmations within the emulator.
- Use the emulator controls (rotations, screenshots, etc.) for additional testing scenarios.

## 7. Rebuild or Install Updated APKs
- Repeat **Build → Build APK(s)** any time you need a fresh `app-debug.apk`.
- To sideload the APK onto a physical device connected via USB:
  1. Enable **Developer Options** and **USB Debugging** on the device.
  2. Connect the device and confirm the RSA prompt.
  3. Run `adb install -r app/build/outputs/apk/debug/app-debug.apk` from the `mobile` directory.

## Troubleshooting Tips
- If Gradle sync fails, open the **Build** tool window to view errors—common fixes include upgrading the Android Gradle Plugin or installing missing SDK components.
- For emulator performance issues, enable **Hardware - GLES 2.0** graphics or allocate more RAM in the AVD settings.
- Clear the Gradle cache via **File → Invalidate Caches / Restart...** if you encounter persistent build errors.

With these steps, you can build, install, and test the Aleya Android app entirely within Android Studio on macOS.
