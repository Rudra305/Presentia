import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/core/ui/templates/LoadingScreen';
import { useAuth } from '@/features/auth';

/**
 * Teacher stack.
 * Protected — requires authentication AND role === 'teacher'.
 * Principals are redirected to their own home.
 */
export default function TeacherLayout() {
  const { isReady, isAuthenticated, role } = useAuth();

  if (!isReady) return <LoadingScreen testID="teacher-loading" />;
  if (!isAuthenticated) return <Redirect href="/auth/biometric" />;
  if (role !== 'teacher') return <Redirect href="/principal/dashboard" />;

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="classes" options={{ title: 'My Classes' }} />
      <Stack.Screen name="sessions" options={{ title: 'Sessions' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
