import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/core/ui/templates/LoadingScreen';
import { useAuth } from '@/features/auth';

export default function AuthLayout() {
  const { isReady, isAuthenticated, role } = useAuth();

  if (!isReady) return <LoadingScreen label="Preparing sign-in…" testID="auth-loading" />;

  if (isAuthenticated) {
    if (role === 'principal') return <Redirect href="/principal/dashboard" />;
    if (role === 'teacher') return <Redirect href="/teacher/classes" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="enroll" />
      <Stack.Screen name="biometric" />
      <Stack.Screen name="pin" />
      <Stack.Screen name="locked" />
    </Stack>
  );
}
