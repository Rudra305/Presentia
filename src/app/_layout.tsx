import {
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/global.css';
import { I18nProvider } from '@/core/i18n';
import { ErrorScreen } from '@/core/ui/templates/ErrorScreen';
import { ThemeProvider, useTheme } from '@/core/ui/theme';
import { useAuthStore } from '@/features/auth';

import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

SplashScreen.preventAutoHideAsync().catch(() => {
    /* no-op */
});

// Suppress benign Expo dev-client keep-awake error on physical devices
if (typeof console !== 'undefined') {
    const origError = console.error;
    console.error = (...args: any[]) => {
        const msg = args
            .map((a) => (typeof a === 'string' ? a : a?.message || String(a)))
            .join(' ');
        if (
            msg.includes('keep awake') ||
            msg.includes('Keep awake') ||
            msg.includes('Unable to activate keep awake')
        ) {
            return;
        }
        origError.apply(console, args);
    };
}

if (typeof process !== 'undefined' && typeof (process as any).on === 'function') {
    (process as any).on('unhandledRejection', (reason: any) => {
        const msg = typeof reason === 'string' ? reason : reason?.message || '';
        if (
            msg.includes('keep awake') ||
            msg.includes('Keep awake') ||
            msg.includes('Unable to activate keep awake')
        ) {
            return;
        }
    });
}

if (typeof global !== 'undefined') {
    const g = global as any;
    if (g.ErrorUtils) {
        const origHandler = g.ErrorUtils.getGlobalHandler?.();
        g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
            const msg = error?.message || String(error);
            if (
                msg.includes('keep awake') ||
                msg.includes('Keep awake') ||
                msg.includes('Unable to activate keep awake')
            ) {
                return;
            }
            if (origHandler) origHandler(error, isFatal);
        });
    }
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
    return (
        <SafeAreaProvider>
            <ThemeProvider initialMode="system">
                <ErrorScreen
                    title="Unexpected error"
                    message={error.message || 'The app hit an unexpected error.'}
                    actionLabel="Reload"
                    onAction={retry}
                    testID="root-error-boundary"
                />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}

function RootStack() {
    const { theme, colors } = useTheme();
    return (
        <>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    headerStyle: { backgroundColor: colors.bg },
                    headerTintColor: colors.fg,
                    headerTitleStyle: { fontWeight: '600' },
                    headerShadowVisible: false,
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="principal" />
                <Stack.Screen name="teacher" />
                <Stack.Screen name="shared" />
                <Stack.Screen name="+not-found" />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
    });

    const hydrate = useAuthStore((s) => s.hydrate);
    const refreshActivity = useAuthStore((s) => s.refreshActivity);

    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (s) => {
            if (s === 'active') void refreshActivity();
        });
        return () => sub.remove();
    }, [refreshActivity]);

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync().catch(() => {});
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    return (
        <SafeAreaProvider>
            <ThemeProvider initialMode="system">
                <I18nProvider>
                    <RootStack />
                </I18nProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
