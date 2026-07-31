import { Redirect, Stack } from 'expo-router';

import { useTheme } from '@/core/ui/theme';
import { LoadingScreen } from '@/core/ui/templates/LoadingScreen';
import { useAuth } from '@/features/auth';

/**
 * Teacher stack.
 * Protected — requires authentication AND role === 'teacher'.
 * Principals are redirected to their own home.
 */
export default function TeacherLayout() {
    const { isReady, isAuthenticated, role } = useAuth();
    const { colors } = useTheme();

    if (!isReady) return <LoadingScreen testID="teacher-loading" />;
    if (!isAuthenticated) return <Redirect href="/auth/biometric" />;
    if (role !== 'teacher') return <Redirect href="/principal/dashboard" />;

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.fg,
                headerTitleStyle: { fontWeight: '600' },
                headerShadowVisible: true,
            }}
        >
            <Stack.Screen name="classes" options={{ title: 'My Classes' }} />
            <Stack.Screen name="students/index" options={{ title: 'Student Roster' }} />
            <Stack.Screen name="sessions" options={{ title: 'Sessions' }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
    );
}
