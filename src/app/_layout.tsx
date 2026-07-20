import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/global.css';
import { ErrorScreen } from '@/core/ui/templates/ErrorScreen';
import { ThemeProvider, useTheme } from '@/core/ui/theme';
import { useAuthStore } from '@/features/auth';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op */
});

/**
 * Global error boundary — Expo Router auto-picks up this export.
 * Catches uncaught render errors anywhere in the route tree.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="system">
        <ErrorScreen
          title="Unexpected error"
          message={error.message || 'The app hit an unexpected error.'}
          actionLabel="Reload"
          onAction={retry}
          testID="root-error-boundary"
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function StatusBarWithTheme() {
  const { theme } = useTheme();
  return <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    // Fire the (placeholder) auth hydration once on cold start.
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="system">
        <StatusBarWithTheme />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="principal" />
          <Stack.Screen name="teacher" />
          <Stack.Screen name="shared" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
