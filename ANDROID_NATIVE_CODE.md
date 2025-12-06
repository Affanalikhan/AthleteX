# 📱 AthleteX Android Native Code

## Overview

Your AthleteX Android app uses **Capacitor** framework, which means:
- **Frontend**: React/TypeScript (your main app code)
- **Native Layer**: Java (minimal native code)
- **Bridge**: Capacitor handles communication between web and native

---

## 🏗️ Architecture

```
AthleteX Android App
├── React/TypeScript (src/)          ← Your main app code
│   ├── Components
│   ├── Pages
│   ├── Services
│   └── Hooks
│
├── Capacitor Bridge                 ← Auto-generated
│   ├── Web ↔ Native communication
│   ├── Plugin system
│   └── Native API access
│
└── Native Android (android/)        ← Java/Kotlin code
    ├── MainActivity.java            ← Entry point
    ├── AndroidManifest.xml          ← App configuration
    ├── build.gradle                 ← Build configuration
    └── Resources (res/)             ← Icons, layouts, etc.
```

---

## 📁 Native Code Structure

### Main Java File

**Location**: `android/app/src/main/java/com/athletex/app/MainActivity.java`

```java
package com.athletex.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}
```

**What it does**:
- Extends `BridgeActivity` from Capacitor
- Automatically loads your React app
- Handles all web ↔ native communication
- Manages Capacitor plugins

**Why it's so simple**:
- Capacitor handles all the heavy lifting
- No need to write native code for most features
- Plugins provide native functionality

---

## 📄 Android Manifest

**Location**: `android/app/src/main/AndroidManifest.xml`

### Key Components:

#### 1. Application Configuration
```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme">
```

#### 2. Main Activity
```xml
<activity
    android:name=".MainActivity"
    android:label="@string/title_activity_main"
    android:theme="@style/AppTheme.NoActionBarLaunch"
    android:launchMode="singleTask"
    android:exported="true">
    
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```

#### 3. Permissions
```xml
<!-- Network -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Camera & Audio -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- Location -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Storage -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
```

#### 4. Hardware Features
```xml
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
<uses-feature android:name="android.hardware.location.gps" android:required="false" />
```

---

## 🔧 Build Configuration

### App-Level build.gradle

**Location**: `android/app/build.gradle`

```gradle
android {
    namespace "com.athletex.app"
    compileSdk 34
    
    defaultConfig {
        applicationId "com.athletex.app"
        minSdkVersion 22        // Android 5.1+
        targetSdkVersion 34     // Android 14
        versionCode 1
        versionName "1.0"
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation "androidx.appcompat:appcompat"
    implementation "androidx.coordinatorlayout:coordinatorlayout"
    implementation "androidx.core:core-splashscreen"
    implementation project(':capacitor-android')
    implementation project(':capacitor-cordova-android-plugins')
}
```

### Project-Level build.gradle

**Location**: `android/build.gradle`

```gradle
buildscript {
    dependencies {
        classpath 'com.android.tools.build:gradle:8.7.2'
        classpath 'com.google.gms:google-services:4.4.2'
    }
}
```

---

## 🔌 Capacitor Plugins

Your app uses these native plugins:

### 1. **Camera** (`@capacitor/camera`)
- Take photos
- Record videos
- Access gallery
- Used in: Assessment recording, Profile pictures

### 2. **Device** (`@capacitor/device`)
- Get device info
- Platform detection
- Used in: Mobile UI detection

### 3. **Filesystem** (`@capacitor/filesystem`)
- Read/write files
- Store data locally
- Used in: Saving videos, caching

### 4. **Geolocation** (`@capacitor/geolocation`)
- Get GPS location
- Used in: Finding nearby trainers

### 5. **Network** (`@capacitor/network`)
- Check connectivity
- Monitor network status
- Used in: Offline mode detection

### 6. **Splash Screen** (`@capacitor/splash-screen`)
- Show/hide splash screen
- Used in: App startup

### 7. **Status Bar** (`@capacitor/status-bar`)
- Customize status bar
- Used in: UI theming

---

## 🎨 Resources

### Icons
**Location**: `android/app/src/main/res/mipmap-*/`

- `ic_launcher.png` - App icon (square)
- `ic_launcher_round.png` - App icon (round)
- `ic_launcher_foreground.png` - Foreground layer

**Sizes**:
- mdpi: 48x48
- hdpi: 72x72
- xhdpi: 96x96
- xxhdpi: 144x144
- xxxhdpi: 192x192

### Splash Screens
**Location**: `android/app/src/main/res/drawable-*/`

- Portrait and landscape variants
- Multiple densities (mdpi to xxxhdpi)

### Layouts
**Location**: `android/app/src/main/res/layout/`

- `activity_main.xml` - Main activity layout

### Strings
**Location**: `android/app/src/main/res/values/strings.xml`

```xml
<resources>
    <string name="app_name">AthleteX</string>
    <string name="title_activity_main">AthleteX</string>
    <string name="package_name">com.athletex.app</string>
    <string name="custom_url_scheme">com.athletex.app</string>
</resources>
```

---

## 🚀 How It Works

### 1. App Startup Flow

```
User taps app icon
    ↓
Android launches MainActivity
    ↓
MainActivity extends BridgeActivity
    ↓
Capacitor initializes
    ↓
WebView loads index.html
    ↓
React app starts
    ↓
Your app is running!
```

### 2. Native API Access

```typescript
// In your React code
import { Camera } from '@capacitor/camera';

// This calls native Android code
const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Uri
});
```

**Behind the scenes**:
1. JavaScript calls Capacitor plugin
2. Capacitor bridge sends message to native
3. Native Android Camera API is invoked
4. Result is sent back through bridge
5. JavaScript receives the photo

### 3. Permission Handling

```typescript
// Request camera permission
import { Camera } from '@capacitor/camera';

const permissions = await Camera.requestPermissions();
if (permissions.camera === 'granted') {
  // Use camera
}
```

**Native side**:
- Capacitor automatically handles permission dialogs
- Uses permissions declared in AndroidManifest.xml
- No need to write native permission code

---

## 🛠️ Customization Options

### 1. Add Custom Native Code

If you need custom native functionality:

**Create a new Java class**:
```java
// android/app/src/main/java/com/athletex/app/CustomPlugin.java
package com.athletex.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CustomPlugin")
public class CustomPlugin extends Plugin {
    
    @PluginMethod
    public void customMethod(PluginCall call) {
        String value = call.getString("value");
        // Your custom native code here
        call.resolve();
    }
}
```

**Register in MainActivity**:
```java
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(CustomPlugin.class);
    }
}
```

**Use in React**:
```typescript
import { Plugins } from '@capacitor/core';
const { CustomPlugin } = Plugins;

await CustomPlugin.customMethod({ value: 'test' });
```

### 2. Customize App Icon

Replace files in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- `android/app/src/main/res/mipmap-*/ic_launcher_round.png`

Or use Android Studio:
1. Right-click `res` folder
2. New → Image Asset
3. Configure icon
4. Generate

### 3. Customize Splash Screen

Replace files in:
- `android/app/src/main/res/drawable-*/splash.png`

Or modify:
- `android/app/src/main/res/values/styles.xml`

### 4. Change App Name

Edit `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Your New Name</string>
```

### 5. Change Package Name

1. Update `android/app/build.gradle`:
```gradle
defaultConfig {
    applicationId "com.yourcompany.yourapp"
}
```

2. Update `AndroidManifest.xml` package
3. Rename Java package folders
4. Update imports

---

## 🔍 Debugging Native Code

### View Logs

**Using ADB**:
```powershell
adb logcat | Select-String "Capacitor"
```

**Using Android Studio**:
1. Open `android` folder in Android Studio
2. Run app
3. View Logcat panel

### Common Log Tags
- `Capacitor` - Capacitor framework
- `WebView` - WebView console logs
- `CameraPlugin` - Camera plugin
- `NetworkPlugin` - Network plugin

### Debug in Android Studio

1. Open Android Studio
2. File → Open → Select `android` folder
3. Wait for Gradle sync
4. Click "Run" or "Debug"
5. Set breakpoints in Java code
6. Step through native code

---

## 📦 Build Variants

### Debug Build (Current)
- **Command**: `.\gradlew assembleDebug`
- **Output**: `app-debug.apk`
- **Features**: Debuggable, not optimized
- **Use**: Development and testing

### Release Build
- **Command**: `.\gradlew assembleRelease`
- **Output**: `app-release.apk`
- **Features**: Optimized, minified, signed
- **Use**: Production deployment

---

## 🔐 Signing Configuration

For release builds, add to `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('your-keystore.jks')
            storePassword 'your-store-password'
            keyAlias 'your-key-alias'
            keyPassword 'your-key-password'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## 📊 Native vs Web Code

### What's Native (Java):
- ✅ App entry point (MainActivity)
- ✅ Permission handling
- ✅ Camera access
- ✅ File system access
- ✅ GPS/Location
- ✅ Device info
- ✅ Network status

### What's Web (React/TypeScript):
- ✅ All UI components
- ✅ Business logic
- ✅ State management
- ✅ API calls
- ✅ Routing
- ✅ Animations
- ✅ User interactions

### Communication:
- **Web → Native**: Capacitor plugins
- **Native → Web**: JavaScript bridge
- **Automatic**: Handled by Capacitor

---

## 🎯 Key Takeaways

1. **Minimal Native Code**: Only ~10 lines of Java
2. **Capacitor Does Heavy Lifting**: Framework handles complexity
3. **Plugin System**: Access native features from JavaScript
4. **Easy to Extend**: Add custom native code when needed
5. **Standard Android**: Uses standard Android SDK and tools

---

## 📚 Resources

### Documentation:
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)

### Tools:
- [Android Studio](https://developer.android.com/studio)
- [Android SDK Platform Tools](https://developer.android.com/studio/releases/platform-tools)

### Commands:
```powershell
# Build APK
cd android
.\gradlew assembleDebug

# Install on device
adb install -r app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat

# Open in Android Studio
npx cap open android
```

---

## 🔄 Converting to Kotlin

If you want to use Kotlin instead of Java:

1. **Add Kotlin plugin** to `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.0'
    }
}
```

2. **Apply plugin** in `android/app/build.gradle`:
```gradle
apply plugin: 'kotlin-android'
```

3. **Convert MainActivity**:
```kotlin
// MainActivity.kt
package com.athletex.app

import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity()
```

4. **Delete** `MainActivity.java`

5. **Rebuild**:
```powershell
cd android
.\gradlew clean assembleDebug
```

---

*Your app uses Capacitor's hybrid approach: React for UI, Java for native features!*
