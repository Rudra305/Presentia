import { cssInterop } from 'nativewind';
import { forwardRef } from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const CONTAINER_BASE =
    'flex-row items-center justify-center rounded-lg active:opacity-80 disabled:opacity-40';

const CONTAINER_VARIANTS: Record<ButtonVariant, string> = {
    primary: 'bg-primary',
    secondary: 'bg-bg-elevated border border-border',
    ghost: 'bg-transparent',
    danger: 'bg-danger',
};

const CONTAINER_SIZES: Record<ButtonSize, string> = {
    sm: 'h-9 px-3 gap-2',
    md: 'h-11 px-4 gap-2',
    lg: 'h-14 px-6 gap-3',
};

const LABEL_VARIANTS: Record<ButtonVariant, string> = {
    primary: 'text-primary-fg',
    secondary: 'text-fg',
    ghost: 'text-primary',
    danger: 'text-danger-fg',
};

const LABEL_SIZES: Record<ButtonSize, string> = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-semibold',
    lg: 'text-lg font-semibold',
};

const ICON_SIZES: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 20 };

// Colors for the ActivityIndicator on the primary/danger surfaces vs. neutral.
const SPINNER_COLOR_BY_VARIANT: Record<ButtonVariant, 'primaryFg' | 'fg' | 'primary' | 'dangerFg'> =
    {
        primary: 'primaryFg',
        secondary: 'fg',
        ghost: 'primary',
        danger: 'dangerFg',
    };

cssInterop(Pressable, { className: 'style' });
cssInterop(View, { className: 'style' });

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
    label: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    leftIcon?: IconName;
    rightIcon?: IconName;
    loading?: boolean;
    fullWidth?: boolean;
    className?: string;
    testID?: string;
};

export const Button = forwardRef<View, ButtonProps>(function Button(
    {
        label,
        variant = 'primary',
        size = 'md',
        leftIcon,
        rightIcon,
        loading = false,
        fullWidth = false,
        disabled,
        className,
        testID,
        ...rest
    },
    ref,
) {
    const isDisabled = disabled || loading;
    const composed = [
        CONTAINER_BASE,
        CONTAINER_VARIANTS[variant],
        CONTAINER_SIZES[size],
        fullWidth ? 'self-stretch' : 'self-start',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const labelClass = [LABEL_VARIANTS[variant], LABEL_SIZES[size]].join(' ');
    const spinnerTone = SPINNER_COLOR_BY_VARIANT[variant];

    return (
        <Pressable
            ref={ref}
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            accessibilityLabel={label}
            disabled={isDisabled}
            className={composed}
            testID={testID}
            {...rest}
        >
            {loading ? (
                <ActivityIndicator size="small" testID={`${testID ?? 'button'}-spinner`} />
            ) : (
                <>
                    {leftIcon ? (
                        <Icon name={leftIcon} size={ICON_SIZES[size]} tone={spinnerTone} />
                    ) : null}
                    <Text className={labelClass} numberOfLines={1}>
                        {label}
                    </Text>
                    {rightIcon ? (
                        <Icon name={rightIcon} size={ICON_SIZES[size]} tone={spinnerTone} />
                    ) : null}
                </>
            )}
        </Pressable>
    );
});
