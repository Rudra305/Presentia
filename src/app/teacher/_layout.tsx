import { Redirect, Stack } from 'expo-router';
import { Alert, Pressable } from 'react-native';

import { LoadingScreen } from '@/core/ui/templates/LoadingScreen';
import { Icon } from '@/core/ui/atoms/Icon';
import { useTheme } from '@/core/ui/theme';
import { useAuth, useAuthStore } from '@/features/auth';

function HeaderSignOutButton() {
    const signOut = useAuthStore((s) => s.signOut);

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out of your session?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: () => {
                    void signOut();
                },
            },
        ]);
    };

    return (
        <Pressable
            onPress={handleSignOut}
            hitSlop={8}
            className="p-1 rounded-full active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel="Sign Out"
            testID="header-signout-btn"
        >
            <Icon name="log-out" size={20} tone="danger" />
        </Pressable>
    );
}

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
    if (role !== 'teacher' && role !== 'principal') return <Redirect href="/auth/biometric" />;

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.fg,
                headerTitleStyle: { fontWeight: '600' },
                headerShadowVisible: true,
                headerRight: () => <HeaderSignOutButton />,
            }}
        >
            <Stack.Screen name="classes" options={{ title: 'My Classes' }} />
            <Stack.Screen name="students/index" options={{ title: 'Student Roster' }} />
            <Stack.Screen name="sessions" options={{ title: 'Sessions' }} />
            <Stack.Screen name="sessions/[id]/capture" options={{ title: 'Live Attendance' }} />
            <Stack.Screen name="sessions/[id]/review" options={{ title: 'Session Review' }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="reports/index" options={{ title: 'Class Reports' }} />
        </Stack>
    );
}
