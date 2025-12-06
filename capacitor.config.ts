import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.athletex.app',
  appName: 'AthleteX',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    // For development, you can use:
    // url: 'http://localhost:5173',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1976d2',
      showSpinner: true,
      spinnerColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP'
    },
    Camera: {
      permissions: {
        camera: 'Camera access is required for video recording and assessments'
      }
    },
    Geolocation: {
      permissions: {
        location: 'Location access is required for assessment tracking and nearby facilities'
      }
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1976d2'
    },
    Network: {
      // Monitor network status
    },
    Device: {
      // Get device information
    }
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  }
};

export default config;
