import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.diarioscuolaplus.app',
  appName: 'Diario Scuola Plus',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#2563eb',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#2563eb',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#2563eb',
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Diario Scuola Plus',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
}

export default config
