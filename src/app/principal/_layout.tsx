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

export default function PrincipalLayout() {
    const { isReady, isAuthenticated, role } = useAuth();
    const { colors } = useTheme();

    if (!isReady) return <LoadingScreen testID="principal-loading" />;
    if (!isAuthenticated) return <Redirect href="/auth/biometric" />;
    if (role !== 'principal') return <Redirect href="/teacher/classes" />;

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
            <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
            <Stack.Screen name="teachers/index" options={{ title: 'Teachers' }} />
            <Stack.Screen
                name="teachers/new"
                options={{ title: 'Add teacher', presentation: 'modal' }}
            />
            <Stack.Screen name="teachers/[id]" options={{ title: 'Edit teacher' }} />
            <Stack.Screen name="classes/index" options={{ title: 'Classes' }} />
            <Stack.Screen
                name="classes/new"
                options={{ title: 'Add class', presentation: 'modal' }}
            />
            <Stack.Screen name="classes/[id]" options={{ title: 'Edit class' }} />
            <Stack.Screen name="students/index" options={{ title: 'Student Roster' }} />
            <Stack.Screen name="reports" options={{ title: 'Reports' }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
    );
}
