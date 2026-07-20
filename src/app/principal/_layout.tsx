import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/core/ui/templates/LoadingScreen';
import { useAuth } from '@/features/auth';

/**
 * Principal stack.
 * Protected — requires authentication AND role === 'principal'.
 * Teachers are redirected to their own home.
 */
export default function PrincipalLayout() {
  const { isReady, isAuthenticated, role } = useAuth();

  if (!isReady) return <LoadingScreen testID="principal-loading" />;
  if (!isAuthenticated) return <Redirect href="/auth/biometric" />;
  if (role !== 'principal') return <Redirect href="/teacher/classes" />;

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="teachers" options={{ title: 'Teachers' }} />
      <Stack.Screen name="classes" options={{ title: 'Classes' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports' }} />
    </Stack>
  );
}
