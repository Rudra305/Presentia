/**
 * Semantic color tokens.
 *
 * These mirror the CSS custom properties defined in `src/global.css` so that
 * components which cannot use NativeWind (StatusBar, LinearGradient, Skia,
 * Camera masks, imperative APIs) can still stay on-token.
 *
 * Prefer NativeWind class names (`bg-primary`, `text-fg-muted`, …) whenever
 * possible. Reach for these constants only at the imperative boundary.
 */

export const palette = {
    white: '#FFFFFF',
    black: '#000000',

    // Neutrals (slate)
    slate50: '#F8FAFC',
    slate100: '#F1F5F9',
    slate200: '#E2E8F0',
    slate300: '#CBD5E1',
    slate400: '#94A3B8',
    slate500: '#64748B',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1E293B',
    slate900: '#0F172A',
    slate950: '#020617',

    // Brand — teal (mature, distinctive, non-AI-slop)
    teal400: '#2DD4BF',
    teal500: '#14B8A6',
    teal600: '#0D9488',
    teal700: '#0F766E',

    // Semantic accents
    red500: '#EF4444',
    red600: '#DC2626',
    red400: '#F87171',
    emerald500: '#10B981',
    emerald600: '#059669',
    emerald400: '#34D399',
    amber500: '#F59E0B',
    amber600: '#D97706',
    amber400: '#FBBF24',
} as const;

export type ThemeColors = {
    bg: string;
    bgElevated: string;
    fg: string;
    fgMuted: string;
    fgSubtle: string;
    border: string;
    borderStrong: string;
    card: string;
    primary: string;
    primaryFg: string;
    danger: string;
    dangerFg: string;
    success: string;
    warning: string;
    overlay: string;
};

export const lightColors: ThemeColors = {
    bg: palette.white,
    bgElevated: palette.slate50,
    fg: palette.slate900,
    fgMuted: palette.slate500,
    fgSubtle: palette.slate400,
    border: palette.slate200,
    borderStrong: palette.slate300,
    card: palette.white,
    primary: palette.teal700,
    primaryFg: palette.white,
    danger: palette.red600,
    dangerFg: palette.white,
    success: palette.emerald600,
    warning: palette.amber600,
    overlay: palette.slate900,
};

export const darkColors: ThemeColors = {
    bg: palette.slate950,
    bgElevated: palette.slate900,
    fg: palette.slate50,
    fgMuted: palette.slate400,
    fgSubtle: palette.slate500,
    border: palette.slate800,
    borderStrong: palette.slate700,
    card: palette.slate900,
    primary: palette.teal400,
    primaryFg: palette.slate950,
    danger: palette.red400,
    dangerFg: palette.slate950,
    success: palette.emerald400,
    warning: palette.amber400,
    overlay: palette.slate950,
};

export const themeColors = { light: lightColors, dark: darkColors } as const;
