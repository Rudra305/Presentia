import { cssInterop } from 'nativewind';
import { forwardRef, useState } from 'react';
import {
    TextInput as RNTextInput,
    View,
    type TextInputProps as RNTextInputProps,
} from 'react-native';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useTheme } from '@/core/ui/theme';

cssInterop(RNTextInput, { className: 'style' });
cssInterop(View, { className: 'style' });

export type InputProps = Omit<RNTextInputProps, 'style'> & {
    label?: string;
    helperText?: string;
    errorText?: string;
    leftIcon?: IconName;
    rightIcon?: IconName;
    onRightIconPress?: () => void;
    className?: string;
    containerClassName?: string;
    testID?: string;
};

/**
 * Foundational text input. Includes label, helper/error, and optional icons.
 * Feature forms (RHF + Zod) will wrap this via a FormField molecule later.
 */
export const Input = forwardRef<RNTextInput, InputProps>(function Input(
    {
        label,
        helperText,
        errorText,
        leftIcon,
        rightIcon,
        onRightIconPress,
        className,
        containerClassName,
        testID,
        editable = true,
        ...rest
    },
    ref,
) {
    const [focused, setFocused] = useState(false);
    const { colors } = useTheme();
    const hasError = Boolean(errorText);

    const borderClass = hasError ? 'border-danger' : focused ? 'border-primary' : 'border-border';

    return (
        <View className={['self-stretch gap-1.5', containerClassName].filter(Boolean).join(' ')}>
            {label ? (
                <Text variant="label" tone={hasError ? 'danger' : 'muted'}>
                    {label}
                </Text>
            ) : null}

            <View
                className={[
                    'flex-row items-center gap-2 rounded-lg border bg-bg-elevated px-3 h-11',
                    borderClass,
                    editable ? '' : 'opacity-60',
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                {leftIcon ? <Icon name={leftIcon} size={18} tone="fgMuted" /> : null}
                <RNTextInput
                    ref={ref}
                    editable={editable}
                    multiline={false}
                    accessibilityLabel={label ?? rest.placeholder}
                    accessibilityHint={hasError ? errorText : helperText}
                    placeholderTextColor={colors.fgSubtle}
                    selectionColor={colors.primary}
                    className={['flex-1 text-base text-fg py-0 h-full', className]
                        .filter(Boolean)
                        .join(' ')}
                    style={{ paddingVertical: 0, textAlignVertical: 'center' }}
                    onFocus={(e) => {
                        setFocused(true);
                        rest.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setFocused(false);
                        rest.onBlur?.(e);
                    }}
                    testID={testID}
                    {...rest}
                />
                {rightIcon ? <Icon name={rightIcon} size={18} tone="fgMuted" /> : null}
            </View>

            {hasError ? (
                <Text
                    variant="caption"
                    tone="danger"
                    testID={testID ? `${testID}-error` : undefined}
                >
                    {errorText}
                </Text>
            ) : helperText ? (
                <Text variant="caption" tone="subtle">
                    {helperText}
                </Text>
            ) : null}
        </View>
    );
});
