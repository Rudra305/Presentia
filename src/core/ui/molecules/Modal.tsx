import { cssInterop } from 'nativewind';
import { type ReactNode } from 'react';
import { Modal as RNModal, Pressable, View, type ModalProps as RNModalProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/core/ui/atoms/Icon';
import { Text } from '@/core/ui/atoms/Text';
import { elevation } from '@/core/ui/tokens/elevation';

cssInterop(Pressable, { className: 'style' });
cssInterop(View, { className: 'style' });
cssInterop(SafeAreaView, { className: 'style' });

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

const SIZE: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'w-full h-full rounded-none',
};

export type ModalProps = {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: ModalSize;
    dismissOnBackdrop?: boolean;
    showCloseButton?: boolean;
    testID?: string;
    animationType?: RNModalProps['animationType'];
};

/**
 * Reusable Modal shell. Handles:
 *  - dark backdrop with opacity
 *  - centered card surface with elevation
 *  - optional title bar with close button
 *  - hardware back button (Android) via `onRequestClose`
 *  - safe-area padding
 *
 * Business modals (e.g. session-close confirmation) compose this as a child.
 */
export function Modal({
    visible,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    dismissOnBackdrop = true,
    showCloseButton = true,
    testID,
    animationType = 'fade',
}: ModalProps) {
    return (
        <RNModal
            visible={visible}
            transparent
            animationType={animationType}
            onRequestClose={onClose}
            statusBarTranslucent
            testID={testID}
        >
            <Pressable
                onPress={dismissOnBackdrop ? onClose : undefined}
                className="flex-1 items-center justify-center bg-overlay/60 px-4"
                testID={testID ? `${testID}-backdrop` : undefined}
            >
                {/* Stop-propagation wrapper so tapping inside the card doesn't close it */}
                <Pressable onPress={() => {}} className={`w-full ${SIZE[size]}`}>
                    <SafeAreaView
                        edges={size === 'full' ? ['top', 'bottom'] : []}
                        className={`bg-card rounded-xl border border-border ${size === 'full' ? 'flex-1' : ''}`}
                        style={elevation.lg}
                    >
                        {title || showCloseButton ? (
                            <View className="flex-row items-center justify-between px-5 pt-5 pb-3">
                                {title ? (
                                    <Text variant="h3" className="flex-1" numberOfLines={1}>
                                        {title}
                                    </Text>
                                ) : (
                                    <View className="flex-1" />
                                )}
                                {showCloseButton ? (
                                    <Pressable
                                        onPress={onClose}
                                        hitSlop={10}
                                        accessibilityRole="button"
                                        accessibilityLabel="Close"
                                        testID={testID ? `${testID}-close` : undefined}
                                    >
                                        <Icon name="x" size={22} tone="fgMuted" />
                                    </Pressable>
                                ) : null}
                            </View>
                        ) : null}

                        <View className="px-5 pb-5">{children}</View>

                        {footer ? (
                            <View className="flex-row items-center justify-end gap-2 px-5 pb-5">
                                {footer}
                            </View>
                        ) : null}
                    </SafeAreaView>
                </Pressable>
            </Pressable>
        </RNModal>
    );
}
