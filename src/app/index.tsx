import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/core/ui/templates/LoadingScreen';
import { useAuth, useAuthStore } from '@/features/auth';

export default function BootScreen() {
  const { isReady, isAuthenticated, enrolled, role } = useAuth();

  // Kick off hydration lazily — cheap no-op if already hydrated.
  const hydrate = useAuthStore((s) => s.hydrate);
  if (!isReady) {
    void hydrate();
    return <LoadingScreen label="Preparing app…" testID="boot-loading" />;
  }

  if (!enrolled) return <Redirect href="/auth/enroll" />;
  if (!isAuthenticated) return <Redirect href="/auth/biometric" />;

  if (role === 'principal') return <Redirect href="/principal/dashboard" />;
  if (role === 'teacher') return <Redirect href="/teacher/classes" />;
  return <Redirect href="/auth/biometric" />;
}
