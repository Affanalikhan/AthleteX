# 🚀 AthleteX Kotlin Native Plugins

## Overview

Your AthleteX Android app now includes **4 custom Kotlin plugins** that provide native functionality for fitness tracking, assessment, and analysis.

---

## 📦 Plugins Included

### 1. **AssessmentPlugin** 🏃
Advanced fitness assessment functionality

### 2. **PerformancePlugin** 📊  
Real-time performance tracking using device sensors

### 3. **VideoAnalysisPlugin** 🎥
Video frame analysis and pose detection

### 4. **BiometricsPlugin** 🔐
Fingerprint and face authentication

---

## 🏗️ Architecture

```
React/TypeScript (src/)
        ↓
TypeScript Interfaces (src/plugins/nativePlugins.ts)
        ↓
Capacitor Bridge
        ↓
Kotlin Plugins (android/app/src/main/java/com/athletex/app/)
        ↓
Android Native APIs
```

---

## 📱 Plugin Details

### 1. AssessmentPlugin

**File**: `android/app/src/main/java/com/athletex/app/AssessmentPlugin.kt`

**Features**:
- Start/stop assessment sessions
- Record performance metrics in real-time
- Calculate scores for different assessment types
- Detect cheating attempts
- Generate grades and percentiles

**Methods**:

#### `startAssessment()`
```typescript
const result = await Assessment.startAssessment({
  type: 'sprint' // or 'endurance', 'strength', 'agility', 'flexibility'
});
// Returns: { success, assessmentId, startTime, type }
```

#### `stopAssessment()`
```typescript
const result = await Assessment.stopAssessment();
// Returns: { success, duration, dataPoints, endTime }
```

#### `recordMetric()`
```typescript
await Assessment.recordMetric({
  metric: 'speed',
  value: 12.5
});
// Returns: { success, recorded, totalDataPoints }
```

#### `calculateScore()`
```typescript
const result = await Assessment.calculateScore({
  type: 'sprint',
  metrics: {
    time: 11.5,
    distance: 100
  }
});
// Returns: { success, score, grade, percentile, assessmentType }
```

#### `detectCheating()`
```typescript
const result = await Assessment.detectCheating({
  frames: [base64Frame1, base64Frame2, ...],
  metrics: {
    speed: 14.2,
    consistency: 0.85
  }
});
// Returns: { success, isCheating, confidenceScore, suspiciousActivities }
```

**Scoring Algorithms**:

- **Sprint**: Based on speed (distance/time)
- **Endurance**: Distance, duration, and heart rate
- **Strength**: Reps, weight, and body weight ratio
- **Agility**: Time and accuracy
- **Flexibility**: Range of motion vs max range

**Grades**: A+, A, A-, B+, B, B-, C+, C, C-, D

---

### 2. PerformancePlugin

**File**: `android/app/src/main/java/com/athletex/app/PerformancePlugin.kt`

**Features**:
- Real-time motion tracking using accelerometer
- Step counting
- Distance estimation
- Calorie calculation
- Activity intensity detection
- Performance analytics

**Methods**:

#### `startTracking()`
```typescript
await Performance.startTracking();
// Starts accelerometer and step counter
// Returns: { success, tracking, startTime }
```

#### `stopTracking()`
```typescript
const result = await Performance.stopTracking();
// Returns: { success, tracking, steps, distance, calories, dataPoints }
```

#### `getMetrics()`
```typescript
const metrics = await Performance.getMetrics();
// Returns: {
//   success, isTracking, steps, distance, calories,
//   avgSpeed, intensity, pace, timestamp
// }
```

#### `analyzePerformance()`
```typescript
const analysis = await Performance.analyzePerformance();
// Returns: {
//   success, totalDataPoints, averageIntensity, peakIntensity,
//   consistency, performanceScore, recommendations
// }
```

#### `calculateCalories()`
```typescript
const result = await Performance.calculateCalories({
  weight: 70, // kg
  duration: 30, // minutes
  intensity: 'moderate' // 'light', 'moderate', 'vigorous', 'intense'
});
// Returns: { success, calories, met, intensity }
```

**Intensity Levels**:
- **Light**: < 10.0 magnitude
- **Moderate**: 10.0 - 12.0
- **Vigorous**: 12.0 - 14.0
- **Intense**: > 14.0

**MET Values** (Metabolic Equivalent):
- Light: 3.0
- Moderate: 5.0
- Vigorous: 8.0
- Intense: 10.0

---

### 3. VideoAnalysisPlugin

**File**: `android/app/src/main/java/com/athletex/app/VideoAnalysisPlugin.kt`

**Features**:
- Frame-by-frame video analysis
- Pose keypoint detection
- Exercise form analysis
- Movement tracking
- Quality assessment

**Methods**:

#### `analyzeFrame()`
```typescript
const result = await VideoAnalysis.analyzeFrame({
  frameData: base64ImageData,
  frameNumber: 1
});
// Returns: { success, frameNumber, brightness, contrast, quality, timestamp }
```

#### `detectPose()`
```typescript
const result = await VideoAnalysis.detectPose({
  frameData: base64ImageData
});
// Returns: {
//   success, keypoints: [{ name, x, y, confidence }],
//   poseDetected, confidence
// }
```

**Keypoints Detected**:
- nose, leftShoulder, rightShoulder
- leftElbow, rightElbow
- leftWrist, rightWrist
- leftHip, rightHip
- leftKnee, rightKnee
- leftAnkle, rightAnkle

#### `analyzeForm()`
```typescript
const result = await VideoAnalysis.analyzeForm({
  exerciseType: 'squat', // or 'pushup', 'plank', 'lunge'
  keypoints: detectedKeypoints
});
// Returns: {
//   success, exerciseType, formScore, feedback, corrections, grade
// }
```

**Form Grades**:
- Excellent: 95+
- Good: 85-94
- Fair: 75-84
- Needs Improvement: 65-74
- Poor: < 65

#### `trackMovement()`
```typescript
const result = await VideoAnalysis.trackMovement();
// Returns: {
//   success, framesAnalyzed, averageMovement, maxMovement,
//   smoothness, consistency
// }
```

---

### 4. BiometricsPlugin

**File**: `android/app/src/main/java/com/athletex/app/BiometricsPlugin.kt`

**Features**:
- Fingerprint authentication
- Face recognition (Android 10+)
- Biometric availability check
- Secure authentication flow

**Methods**:

#### `isAvailable()`
```typescript
const result = await Biometrics.isAvailable();
// Returns: { success, available, type: 'fingerprint' | 'face' | 'none' }
```

#### `authenticate()`
```typescript
const result = await Biometrics.authenticate({
  title: 'Login to AthleteX',
  subtitle: 'Use your fingerprint to authenticate',
  description: 'Touch the fingerprint sensor'
});
// Returns: { success, authenticated, timestamp }
```

#### `cancelAuthentication()`
```typescript
await Biometrics.cancelAuthentication();
// Returns: { success, cancelled }
```

**Requirements**:
- Android 9.0 (API 28) or higher
- Device with fingerprint sensor or face recognition
- User must have enrolled biometrics in device settings

---

## 🔧 Setup & Build

### 1. Build Configuration

The Kotlin plugins are already configured in your project:

**`android/build.gradle`**:
```gradle
buildscript {
    ext.kotlin_version = '1.9.22'
    dependencies {
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}
```

**`android/app/build.gradle`**:
```gradle
apply plugin: 'kotlin-android'

dependencies {
    implementation "org.jetbrains.kotlin:kotlin-stdlib:$kotlin_version"
    implementation "androidx.biometric:biometric:1.1.0"
}
```

### 2. Build APK

```powershell
# Build React app
npm run build

# Sync with Capacitor
npx cap sync android

# Build APK
cd android
.\gradlew assembleDebug
cd ..
```

### 3. Install

```powershell
.\INSTALL_APK_NOW.ps1
```

---

## 💻 Usage Examples

### Complete Assessment Flow

```typescript
import { Assessment } from './plugins/nativePlugins';

// Start assessment
const session = await Assessment.startAssessment({ type: 'sprint' });
console.log('Assessment ID:', session.assessmentId);

// Record metrics during assessment
await Assessment.recordMetric({ metric: 'speed', value: 12.5 });
await Assessment.recordMetric({ metric: 'distance', value: 100 });

// Stop assessment
const result = await Assessment.stopAssessment();
console.log('Duration:', result.duration);

// Calculate score
const score = await Assessment.calculateScore({
  type: 'sprint',
  metrics: {
    time: 11.5,
    distance: 100
  }
});

console.log('Score:', score.score);
console.log('Grade:', score.grade);
console.log('Percentile:', score.percentile);
```

### Performance Tracking

```typescript
import { Performance } from './plugins/nativePlugins';

// Start tracking
await Performance.startTracking();

// Get real-time metrics
setInterval(async () => {
  const metrics = await Performance.getMetrics();
  console.log('Steps:', metrics.steps);
  console.log('Distance:', metrics.distance, 'km');
  console.log('Calories:', metrics.calories);
  console.log('Intensity:', metrics.intensity);
}, 1000);

// Stop and analyze
const result = await Performance.stopTracking();
const analysis = await Performance.analyzePerformance();

console.log('Performance Score:', analysis.performanceScore);
console.log('Recommendations:', analysis.recommendations);
```

### Video Analysis

```typescript
import { VideoAnalysis } from './plugins/nativePlugins';

// Analyze each frame
for (let i = 0; i < videoFrames.length; i++) {
  const frame = videoFrames[i];
  
  // Analyze frame quality
  const analysis = await VideoAnalysis.analyzeFrame({
    frameData: frame,
    frameNumber: i
  });
  
  // Detect pose
  const pose = await VideoAnalysis.detectPose({
    frameData: frame
  });
  
  if (pose.poseDetected) {
    // Analyze form
    const form = await VideoAnalysis.analyzeForm({
      exerciseType: 'squat',
      keypoints: pose.keypoints
    });
    
    console.log('Form Score:', form.formScore);
    console.log('Feedback:', form.feedback);
    console.log('Corrections:', form.corrections);
  }
}

// Get summary
const summary = await VideoAnalysis.getAnalysisSummary();
console.log('Total Frames:', summary.totalFrames);
console.log('FPS:', summary.fps);
```

### Biometric Authentication

```typescript
import { Biometrics } from './plugins/nativePlugins';

// Check availability
const available = await Biometrics.isAvailable();

if (available.available) {
  console.log('Biometric type:', available.type);
  
  try {
    // Authenticate
    const result = await Biometrics.authenticate({
      title: 'Login to AthleteX',
      subtitle: 'Authenticate to continue',
      description: 'Use your biometric to login'
    });
    
    if (result.authenticated) {
      console.log('Authentication successful!');
      // Proceed with login
    }
  } catch (error) {
    console.error('Authentication failed:', error);
  }
} else {
  console.log('Biometric authentication not available');
  // Fall back to password login
}
```

---

## 🎯 Integration with Existing Code

### Update Assessment Service

**`src/services/assessmentService.ts`**:

```typescript
import { Assessment } from '../plugins/nativePlugins';

export class AssessmentService {
  async startAssessment(type: string) {
    // Use native plugin for better performance
    const result = await Assessment.startAssessment({ type });
    return result;
  }

  async calculateScore(type: string, metrics: any) {
    // Use native scoring algorithm
    const result = await Assessment.calculateScore({ type, metrics });
    return result;
  }

  async detectCheating(frames: string[], metrics: any) {
    // Use native cheat detection
    const result = await Assessment.detectCheating({ frames, metrics });
    return result;
  }
}
```

### Update Performance Service

**`src/services/performanceService.ts`**:

```typescript
import { Performance } from '../plugins/nativePlugins';

export class PerformanceService {
  async startTracking() {
    await Performance.startTracking();
  }

  async getMetrics() {
    return await Performance.getMetrics();
  }

  async analyzePerformance() {
    return await Performance.analyzePerformance();
  }
}
```

---

## 🔐 Permissions

The plugins require these permissions (already in AndroidManifest.xml):

```xml
<!-- Camera for video analysis -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- Sensors for performance tracking -->
<!-- No special permission needed for accelerometer/step counter -->

<!-- Biometrics -->
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```

---

## 🧪 Testing

### Test Assessment Plugin

```typescript
// Test in browser console or React component
import { Assessment } from './plugins/nativePlugins';

const testAssessment = async () => {
  const session = await Assessment.startAssessment({ type: 'sprint' });
  console.log('Started:', session);
  
  await Assessment.recordMetric({ metric: 'speed', value: 12.5 });
  
  const result = await Assessment.stopAssessment();
  console.log('Stopped:', result);
  
  const score = await Assessment.calculateScore({
    type: 'sprint',
    metrics: { time: 11.5, distance: 100 }
  });
  console.log('Score:', score);
};

testAssessment();
```

### Test Performance Plugin

```typescript
import { Performance } from './plugins/nativePlugins';

const testPerformance = async () => {
  await Performance.startTracking();
  
  // Wait 10 seconds
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  const metrics = await Performance.getMetrics();
  console.log('Metrics:', metrics);
  
  await Performance.stopTracking();
};

testPerformance();
```

---

## 📊 Performance Considerations

### Memory Management
- Frame buffer limited to 100 frames
- Activity data limited to 1000 points
- Automatic cleanup on stop

### Battery Optimization
- Sensors use SENSOR_DELAY_NORMAL
- Tracking stops automatically when app closes
- Efficient data structures

### Thread Safety
- All UI operations run on main thread
- Sensor callbacks handled properly
- No blocking operations

---

## 🚀 Advanced Features

### Custom Scoring Algorithms

You can modify scoring in `AssessmentPlugin.kt`:

```kotlin
private fun calculateSprintScore(metrics: JSObject): Double {
    val time = metrics.optDouble("time", 0.0)
    val distance = metrics.optDouble("distance", 100.0)
    
    // Your custom algorithm
    val speed = distance / time
    return minOf(100.0, (speed / 0.12) * 10)
}
```

### Add New Exercise Types

In `VideoAnalysisPlugin.kt`:

```kotlin
private fun analyzeDeadliftForm(keypoints: JSONArray): FormAnalysis {
    // Your form analysis logic
    return FormAnalysis(score, feedback, corrections)
}
```

### Custom Sensors

Add new sensors in `PerformancePlugin.kt`:

```kotlin
private var heartRateSensor: Sensor? = null

override fun load() {
    super.load()
    heartRateSensor = sensorManager.getDefaultSensor(Sensor.TYPE_HEART_RATE)
}
```

---

## 📚 Resources

### Kotlin Documentation
- [Kotlin Official Docs](https://kotlinlang.org/docs/home.html)
- [Android Kotlin Guide](https://developer.android.com/kotlin)

### Capacitor Plugin Development
- [Capacitor Plugin Guide](https://capacitorjs.com/docs/plugins)
- [Android Plugin Development](https://capacitorjs.com/docs/plugins/android)

### Android Sensors
- [Sensor Overview](https://developer.android.com/guide/topics/sensors/sensors_overview)
- [Motion Sensors](https://developer.android.com/guide/topics/sensors/sensors_motion)

### Biometric Authentication
- [BiometricPrompt API](https://developer.android.com/reference/android/hardware/biometrics/BiometricPrompt)

---

## 🐛 Troubleshooting

### Plugin Not Found
```
Error: Plugin Assessment does not have method startAssessment
```

**Solution**: Rebuild the app
```powershell
npm run build
npx cap sync android
cd android
.\gradlew clean assembleDebug
```

### Kotlin Compilation Error
```
error: Kotlin: Unresolved reference
```

**Solution**: Check Kotlin version in `android/build.gradle`
```gradle
ext.kotlin_version = '1.9.22'
```

### Sensor Not Working
```
Sensor data not being received
```

**Solution**: 
1. Check device has required sensors
2. Ensure permissions granted
3. Test on physical device (not emulator)

---

## ✅ Summary

Your AthleteX Android app now includes:

✅ **4 Custom Kotlin Plugins**
- AssessmentPlugin (fitness assessments)
- PerformancePlugin (motion tracking)
- VideoAnalysisPlugin (pose detection)
- BiometricsPlugin (authentication)

✅ **Type-Safe TypeScript Interfaces**
- Full IntelliSense support
- Type checking
- Documentation

✅ **Production-Ready Features**
- Memory management
- Battery optimization
- Error handling
- Thread safety

✅ **Easy Integration**
- Simple API
- Clear documentation
- Usage examples

---

*Your Android app is now powered by native Kotlin for maximum performance!* 🚀
