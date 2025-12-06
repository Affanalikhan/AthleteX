# Java Setup for Android Build

## Issue
The Android build requires Java 21, but you currently have Java 17 installed.

## Solutions

### Option 1: Install Java 21 (Recommended)

#### Download Java 21:
1. Go to: https://www.oracle.com/java/technologies/downloads/#java21
2. Download "Windows x64 Installer"
3. Run the installer
4. Accept defaults and complete installation

#### Set JAVA_HOME:
```powershell
# Set JAVA_HOME environment variable
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Java\jdk-21', 'Machine')

# Add to PATH
$path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
[System.Environment]::SetEnvironmentVariable('Path', "$path;C:\Program Files\Java\jdk-21\bin", 'Machine')

# Restart PowerShell and verify
java -version
```

### Option 2: Use Android Studio (Easiest)

Android Studio includes the correct Java version and handles everything automatically.

#### Steps:
1. **Open Project in Android Studio**:
   ```powershell
   npx cap open android
   ```

2. **Wait for Gradle Sync** (first time takes 5-10 minutes)

3. **Build APK**:
   - Click: Build > Build Bundle(s) / APK(s) > Build APK(s)
   - Wait for build to complete
   - Click "locate" link in notification

4. **APK Location**:
   ```
   android\app\build\outputs\apk\debug\app-debug.apk
   ```

### Option 3: Downgrade Capacitor (Not Recommended)

If you can't install Java 21, you can downgrade Capacitor to version 6.x which works with Java 17.

```powershell
# Downgrade Capacitor
npm install @capacitor/core@6 @capacitor/cli@6 @capacitor/android@6
npm install @capacitor/camera@6 @capacitor/device@6 @capacitor/filesystem@6
npm install @capacitor/geolocation@6 @capacitor/network@6
npm install @capacitor/splash-screen@6 @capacitor/status-bar@6

# Rebuild
npm run build
npx cap sync android
```

## Quick Build with Android Studio

This is the EASIEST method:

```powershell
# 1. Build React app
npm run build

# 2. Sync with Capacitor
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. In Android Studio:
#    - Wait for Gradle sync to complete
#    - Click: Build > Build Bundle(s) / APK(s) > Build APK(s)
#    - Wait 5-10 minutes for first build
#    - Click "locate" when build completes

# 5. APK will be at:
#    android\app\build\outputs\apk\debug\app-debug.apk
```

## After Building

### Install on Device:
```powershell
# Connect device via USB
# Enable USB Debugging
# Run:
.\install-android.ps1
```

### Or Transfer Manually:
1. Copy APK to your phone
2. Enable "Install from Unknown Sources"
3. Open APK file and install

## Troubleshooting

### "Android Studio not found"
- Download from: https://developer.android.com/studio
- Install with default settings
- Open Android Studio once before building

### "Gradle sync failed"
- File > Invalidate Caches / Restart
- Try again

### "Build failed"
- Build > Clean Project
- Build > Rebuild Project

## Recommended: Use Android Studio

For the best experience and to avoid Java version issues:
1. Install Android Studio
2. Open project: `npx cap open android`
3. Let Android Studio handle everything
4. Build APK from Android Studio menu

This way you don't need to worry about Java versions, Gradle, or SDK paths!
