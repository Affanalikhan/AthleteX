# AthleteX Android App - Build Guide

## 📱 Overview

This guide will help you build and install the AthleteX Android app on your device.

## ✅ Prerequisites

### Required Software:
1. **Node.js** (v16 or higher) - Already installed ✅
2. **Android Studio** - Download from https://developer.android.com/studio
3. **Java JDK** (v11 or higher) - Included with Android Studio

### Android Studio Setup:
1. Install Android Studio
2. Open Android Studio
3. Go to: Tools > SDK Manager
4. Install:
   - Android SDK Platform 33 (or latest)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android Emulator (optional)

## 🚀 Quick Build (Automated)

### Option 1: Build APK
```powershell
.\build-android.ps1
```

This script will:
1. Build the React web app
2. Sync with Capacitor
3. Build the Android APK
4. Show you the APK location

### Option 2: Build + Install
```powershell
# Build the APK
.\build-android.ps1

# Install on connected device
.\install-android.ps1
```

## 🛠 Manual Build Steps

### Step 1: Build React App
```powershell
npm run build
```

### Step 2: Sync with Capacitor
```powershell
npx cap sync android
```

### Step 3: Build APK

#### Using Gradle (Command Line):
```powershell
cd android
.\gradlew assembleDebug
cd ..
```

#### Using Android Studio:
```powershell
# Open project in Android Studio
npx cap open android

# In Android Studio:
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

### Step 4: Locate APK
The APK will be at:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

## 📲 Installing on Device

### Method 1: USB Installation (Recommended)

1. **Enable Developer Options** on your Android device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Developer Options will be enabled

2. **Enable USB Debugging**:
   - Go to Settings > Developer Options
   - Enable "USB Debugging"

3. **Connect Device**:
   - Connect your device via USB
   - Accept the USB debugging prompt on your device

4. **Install APK**:
   ```powershell
   .\install-android.ps1
   ```

### Method 2: Manual Installation

1. **Transfer APK** to your device:
   - Copy `android\app\build\outputs\apk\debug\app-debug.apk`
   - Transfer via USB, email, or cloud storage

2. **Enable Unknown Sources**:
   - Go to Settings > Security
   - Enable "Install from Unknown Sources"
   - Or allow installation for your file manager app

3. **Install**:
   - Open the APK file on your device
   - Tap "Install"
   - Open the app

## 🏗 Building Release APK (For Production)

### Step 1: Generate Signing Key
```powershell
# Navigate to android/app
cd android\app

# Generate keystore
keytool -genkey -v -keystore athletex-release-key.keystore -alias athletex -keyalg RSA -keysize 2048 -validity 10000

# Follow the prompts to set passwords and details
cd ..\..
```

### Step 2: Configure Signing

Create `android/key.properties`:
```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=athletex
storeFile=athletex-release-key.keystore
```

### Step 3: Build Release APK
```powershell
cd android
.\gradlew assembleRelease
cd ..
```

Release APK location:
```
android\app\build\outputs\apk\release\app-release.apk
```

## 📦 App Configuration

### App Details:
- **App ID**: com.athletex.app
- **App Name**: AthleteX
- **Version**: 1.0.0
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 33 (Android 13)

### Permissions:
- ✅ Internet Access
- ✅ Camera (for assessments)
- ✅ Microphone (for video recording)
- ✅ Location (for nearby trainers)
- ✅ Storage (for media files)
- ✅ Network State

### Features:
- ✅ All web app features
- ✅ Native camera integration
- ✅ Offline support
- ✅ Push notifications (ready)
- ✅ Native performance

## 🔧 Troubleshooting

### Build Fails

**Issue**: Gradle build fails
```powershell
# Clean and rebuild
cd android
.\gradlew clean
.\gradlew assembleDebug
cd ..
```

**Issue**: SDK not found
- Open Android Studio
- File > Project Structure
- Set correct SDK location

### Installation Fails

**Issue**: Device not detected
```powershell
# Check connected devices
adb devices

# Restart adb server
adb kill-server
adb start-server
```

**Issue**: Installation blocked
- Enable "Install from Unknown Sources"
- Check device storage space
- Uninstall old version first

### App Crashes

**Issue**: App crashes on startup
- Check Android version (min: 5.1)
- Clear app data and cache
- Reinstall the app

**Issue**: Camera not working
- Grant camera permissions in app settings
- Check if camera is being used by another app

## 📱 Testing the App

### Test Checklist:
- [ ] App launches successfully
- [ ] Login/Signup works
- [ ] Profile loads correctly
- [ ] Camera opens for assessments
- [ ] Performance tracking works
- [ ] Social feed loads
- [ ] Trainer search works
- [ ] Offline mode functions
- [ ] All navigation works

### Test Accounts:
```
Athlete:
Email: athlete@test.com
Password: test123

Trainer:
Email: trainer@test.com
Password: test123
```

## 🚀 Publishing to Google Play Store

### Prerequisites:
1. Google Play Developer Account ($25 one-time fee)
2. Release APK (signed)
3. App assets (icon, screenshots, description)

### Steps:
1. **Create App Listing**:
   - Go to Google Play Console
   - Create new app
   - Fill in app details

2. **Upload APK**:
   - Go to Release > Production
   - Create new release
   - Upload signed APK

3. **Complete Store Listing**:
   - Add app description
   - Upload screenshots (min 2)
   - Add app icon (512x512)
   - Set category and content rating

4. **Submit for Review**:
   - Complete all required sections
   - Submit for review
   - Wait for approval (1-7 days)

## 📊 App Size Optimization

Current APK size: ~50-80 MB

### Reduce Size:
1. **Enable ProGuard** (code shrinking)
2. **Use App Bundle** instead of APK
3. **Remove unused resources**
4. **Optimize images**

```powershell
# Build App Bundle (smaller download)
cd android
.\gradlew bundleRelease
cd ..
```

## 🔄 Updating the App

### For Development:
```powershell
# Make changes to React code
# Then rebuild
.\build-android.ps1
.\install-android.ps1
```

### For Production:
1. Update version in `android/app/build.gradle`
2. Build release APK
3. Upload to Play Store
4. Users get automatic update

## 📞 Support

### Common Commands:
```powershell
# Check Android setup
.\check-android-setup.ps1

# Build app
.\build-android.ps1

# Install app
.\install-android.ps1

# Open in Android Studio
npx cap open android

# View device logs
adb logcat
```

### Useful Links:
- [Capacitor Android Docs](https://capacitorjs.com/docs/android)
- [Android Studio Download](https://developer.android.com/studio)
- [Google Play Console](https://play.google.com/console)

---

## ✨ Success!

Once built, you'll have a fully functional Android app with:
- ✅ Native performance
- ✅ Offline support
- ✅ Camera integration
- ✅ All web features
- ✅ Professional UI
- ✅ MongoDB integration

**Happy Building! 🚀**

---

*Last Updated: December 6, 2025*  
*Version: 1.0.0*
