/** Border radius tokens (px). Mirrors tailwind.config.js. */
export const radius = {
    none: 0,
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    '2xl': 28,
    full: 9999,
} as const;

export type RadiusKey = keyof typeof radius;
