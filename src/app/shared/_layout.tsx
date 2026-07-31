import { Redirect, Stack } from 'expo-router';

import { useTheme } from '@/core/ui/theme';
import { LoadingScreen } from '@/core/ui/templates/LoadingScreen';
import { useAuth } from '@/features/auth';

/**
 * Shared stack.
 * Protected — any authenticated user (principal OR teacher) can access.
 * Hosts routes both roles need: settings, about, profile.
 */
export default function SharedLayout() {
    const { isReady, isAuthenticated } = useAuth();
    const { colors } = useTheme();

    if (!isReady) return <LoadingScreen testID="shared-loading" />;
    if (!isAuthenticated) return <Redirect href="/auth/biometric" />;

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
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="about" options={{ title: 'About' }} />
            <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        </Stack>
    );
}
