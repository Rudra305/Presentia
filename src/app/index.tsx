import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/core/ui/templates/LoadingScreen';
import { useAuth } from '@/features/auth';

/**
 * Boot screen — the root URL `/`.
 *
 * Waits for the auth store to hydrate, then redirects the user to the
 * correct stack based on their session state and role. Renders the
 * LoadingScreen while hydrating so there is never a blank frame.
 */
export default function BootScreen() {
  const { isReady, isAuthenticated, role } = useAuth();

  if (!isReady) return <LoadingScreen label="Preparing app…" testID="boot-loading" />;

  if (!isAuthenticated) return <Redirect href="/auth/biometric" />;

  if (role === 'principal') return <Redirect href="/principal/dashboard" />;
  if (role === 'teacher') return <Redirect href="/teacher/classes" />;

  // Fallback — authenticated but no role (shouldn't happen).
  return <Redirect href="/auth/biometric" />;
}
