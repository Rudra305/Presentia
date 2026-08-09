import React from 'react';
import { View } from 'react-native';
import { Icon, type IconName, type IconTone } from '@/core/ui/atoms/Icon';
import { Text } from '@/core/ui/atoms/Text';
import { Card } from '@/core/ui/molecules/Card';

interface StatCardProps {
    label: string;
    value: string | number | null | undefined;
    subtitle?: string;
    suffix?: string;
    icon: IconName;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
    onPress?: () => void;
    testID?: string;
    className?: string;
}

export function StatCard({
    label,
    value,
    subtitle,
    suffix = '',
    icon,
    variant = 'neutral',
    onPress,
    testID,
    className = 'w-[48%]',
}: StatCardProps) {
    const getVariantTone = (): {
        iconTone: IconTone;
        valueTone: 'primary' | 'success' | 'danger' | 'default';
    } => {
        switch (variant) {
            case 'primary':
                return { iconTone: 'primary', valueTone: 'primary' };
            case 'success':
                return { iconTone: 'success', valueTone: 'success' };
            case 'warning':
                return { iconTone: 'warning', valueTone: 'default' };
            case 'danger':
                return { iconTone: 'danger', valueTone: 'danger' };
            default:
                return { iconTone: 'primary', valueTone: 'default' };
        }
    };

    const { iconTone, valueTone } = getVariantTone();
    const displayVal = value == null ? '—' : `${value}${suffix}`;

    const content = (
        <View className="gap-2">
            <View className="flex-row items-center justify-between">
                <Text variant="label" tone="muted">
                    {label}
                </Text>
                <Icon name={icon} size={18} tone={iconTone} />
            </View>
            <Text
                variant="display"
                tone={valueTone}
                testID={testID ? `${testID}-value` : undefined}
            >
                {displayVal}
            </Text>
            {subtitle ? (
                <Text variant="caption" tone="subtle">
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );

    if (onPress) {
        return (
            <Card pressable onPress={onPress} className={className} testID={testID}>
                {content}
            </Card>
        );
    }

    return (
        <Card className={className} testID={testID}>
            {content}
        </Card>
    );
}
