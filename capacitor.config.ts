import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.potionsort.puzzle',
  appName: 'Potion Sort',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;