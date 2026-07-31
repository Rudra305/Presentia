/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            colors: {
                bg: 'rgb(var(--bg) / <alpha-value>)',
                'bg-elevated': 'rgb(var(--bg-elevated) / <alpha-value>)',
                fg: 'rgb(var(--fg) / <alpha-value>)',
                'fg-muted': 'rgb(var(--fg-muted) / <alpha-value>)',
                'fg-subtle': 'rgb(var(--fg-subtle) / <alpha-value>)',
                border: 'rgb(var(--border) / <alpha-value>)',
                'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
                card: 'rgb(var(--card) / <alpha-value>)',
                primary: {
                    DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
                    fg: 'rgb(var(--primary-fg) / <alpha-value>)',
                },
                danger: {
                    DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
                    fg: 'rgb(var(--danger-fg) / <alpha-value>)',
                },
                success: 'rgb(var(--success) / <alpha-value>)',
                warning: 'rgb(var(--warning) / <alpha-value>)',
                overlay: 'rgb(var(--overlay) / <alpha-value>)',
            },
            fontFamily: {
                sans: ['PlusJakartaSans_400Regular'],
                medium: ['PlusJakartaSans_500Medium'],
                semibold: ['PlusJakartaSans_600SemiBold'],
                bold: ['PlusJakartaSans_700Bold'],
            },
            borderRadius: {
                xs: '4px',
                sm: '6px',
                md: '10px',
                lg: '14px',
                xl: '20px',
                '2xl': '28px',
            },
            fontSize: {
                xs: ['12px', { lineHeight: '16px' }],
                sm: ['14px', { lineHeight: '20px' }],
                base: ['16px', { lineHeight: '24px' }],
                lg: ['18px', { lineHeight: '28px' }],
                xl: ['20px', { lineHeight: '30px' }],
                '2xl': ['24px', { lineHeight: '32px' }],
                '3xl': ['30px', { lineHeight: '38px' }],
                '4xl': ['36px', { lineHeight: '44px' }],
            },
        },
    },
    plugins: [],
};
