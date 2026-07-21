import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/core/ui/templates/LoadingScreen';
import { useAuth } from '@/features/auth';

export default function PrincipalLayout() {
  const { isReady, isAuthenticated, role } = useAuth();

  if (!isReady) return <LoadingScreen testID="principal-loading" />;
  if (!isAuthenticated) return <Redirect href="/auth/biometric" />;
  if (role !== 'principal') return <Redirect href="/teacher/classes" />;

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="teachers/index" options={{ title: 'Teachers' }} />
      <Stack.Screen name="teachers/new" options={{ title: 'Add teacher', presentation: 'modal' }} />
      <Stack.Screen name="teachers/[id]" options={{ title: 'Edit teacher' }} />
      <Stack.Screen name="classes" options={{ title: 'Classes' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports' }} />
    </Stack>
  );
}
