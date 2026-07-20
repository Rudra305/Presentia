import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/global.css';

// Keep the native splash visible until the JS root mounts.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: safe to ignore if already hidden */
});

export default function RootLayout() {
  useEffect(() => {
    // Hide splash as soon as the root tree is mounted. Milestone 2+ will gate
    // this on font/theme readiness. No business logic here by design.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
