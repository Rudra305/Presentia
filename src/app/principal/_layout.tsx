import { Redirect, Stack } from 'expo-router';

import { useTheme } from '@/core/ui/theme';
import { LoadingScreen } from '@/core/ui/templates/LoadingScreen';
import { useAuth } from '@/features/auth';

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
