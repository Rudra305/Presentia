import { colorScheme, useColorScheme } from 'nativewind';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import { darkColors, lightColors, type ThemeColors } from '@/core/ui/tokens/colors';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
    /** User's preference — may be 'system'. */
    mode: ThemeMode;
    /** Actual theme in effect right now — never 'system'. */
    theme: ResolvedTheme;
    /** Semantic color tokens for the resolved theme. */
    colors: ThemeColors;
    /** Update the user's preference. */
    setMode: (next: ThemeMode) => void;
    /** Convenience: flip between light and dark (system → opposite of current). */
    toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ProviderProps = {
    children: ReactNode;
    /** Initial user preference; defaults to 'system'. */
    initialMode?: ThemeMode;
};

/**
 * Root theme provider.
 *
 * Wraps the tree so that:
 *  - NativeWind's colorScheme is synced to the user's preference.
 *  - Any component can read the resolved theme (`useTheme()`) for imperative
 *    APIs that don't accept className (StatusBar, gradients, Camera, etc.).
 *
 * Persisting the preference across launches is intentionally deferred to
 * Milestone 3 (storage layer). Until then, the app boots in `system` mode.
 */
export function ThemeProvider({ children, initialMode = 'system' }: ProviderProps) {
    const [mode, setModeState] = useState<ThemeMode>(initialMode);
    const { colorScheme: activeScheme } = useColorScheme();

    // Apply the preference to NativeWind whenever it changes.
    useEffect(() => {
        colorScheme.set(mode);
    }, [mode]);

    const setMode = useCallback((next: ThemeMode) => {
        setModeState(next);
    }, []);

    const toggle = useCallback(() => {
        setModeState((current) => {
            if (current === 'light') return 'dark';
            if (current === 'dark') return 'light';
            return activeScheme === 'dark' ? 'light' : 'dark';
        });
    }, [activeScheme]);

    const resolved: ResolvedTheme = activeScheme === 'dark' ? 'dark' : 'light';

    const value = useMemo<ThemeContextValue>(
        () => ({
            mode,
            theme: resolved,
            colors: resolved === 'dark' ? darkColors : lightColors,
            setMode,
            toggle,
        }),
        [mode, resolved, setMode, toggle],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used inside <ThemeProvider>.');
    }
    return ctx;
}
