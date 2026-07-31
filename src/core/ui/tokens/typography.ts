/**
 * Typography tokens.
 *
 * Family: Plus Jakarta Sans (loaded via @expo-google-fonts).
 * Sizes/line-heights mirror the values in `tailwind.config.js` so that both
 * NativeWind classes and imperative styles stay in sync.
 */

export const fontFamily = {
    regular: 'PlusJakartaSans_400Regular',
    medium: 'PlusJakartaSans_500Medium',
    semibold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
} as const;

export const fontSize = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
} as const;

export const lineHeight = {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 30,
    '2xl': 32,
    '3xl': 38,
    '4xl': 44,
} as const;

export const fontWeight = {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
} as const;

export type FontFamilyKey = keyof typeof fontFamily;
export type FontSizeKey = keyof typeof fontSize;
