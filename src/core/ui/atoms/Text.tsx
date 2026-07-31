import { cssInterop } from 'nativewind';
import { forwardRef } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

/**
 * Typography variants for the app.
 * Each variant maps to a fixed size + weight + line-height combo so screens
 * never hard-code font metrics.
 */
export type TextVariant =
    'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'label' | 'caption' | 'code';

/** Semantic tone controls color; ignored when `className` overrides it. */
export type TextTone =
    'default' | 'muted' | 'subtle' | 'primary' | 'danger' | 'success' | 'inverse';

const VARIANT_CLASSES: Record<TextVariant, string> = {
    display: 'text-4xl font-bold',
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-semibold',
    h3: 'text-xl font-semibold',
    body: 'text-base font-sans',
    bodySm: 'text-sm font-sans',
    label: 'text-sm font-medium',
    caption: 'text-xs font-sans',
    code: 'text-sm font-sans', // monospace is added imperatively below
};

const TONE_CLASSES: Record<TextTone, string> = {
    default: 'text-fg',
    muted: 'text-fg-muted',
    subtle: 'text-fg-subtle',
    primary: 'text-primary',
    danger: 'text-danger',
    success: 'text-success',
    inverse: 'text-primary-fg',
};

export type TextProps = RNTextProps & {
    variant?: TextVariant;
    tone?: TextTone;
    className?: string;
};

// Ensure className works on the native <Text>.
cssInterop(RNText, { className: 'style' });

/**
 * Foundational text primitive. All copy in the app should go through this.
 */
export const Text = forwardRef<RNText, TextProps>(function Text(
    { variant = 'body', tone = 'default', className, style, ...rest },
    ref,
) {
    const composed = [VARIANT_CLASSES[variant], TONE_CLASSES[tone], className]
        .filter(Boolean)
        .join(' ');

    const monoStyle =
        variant === 'code' ? { fontFamily: 'Menlo' as const, letterSpacing: 0.2 } : undefined;

    return (
        <RNText ref={ref} accessible className={composed} style={[monoStyle, style]} {...rest} />
    );
});
