import React from 'react';
import { View } from 'react-native';
import { Text } from '@/core/ui/atoms/Text';

interface AttendanceProgressBarProps {
    percentage: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    testID?: string;
}

export function AttendanceProgressBar({
    percentage,
    showLabel = true,
    size = 'md',
    testID,
}: AttendanceProgressBarProps) {
    const normalized = Math.min(100, Math.max(0, percentage));

    const getTheme = () => {
        if (normalized >= 85) {
            return {
                fillBg: 'bg-emerald-500',
                badgeBg: 'bg-emerald-500/10',
                tone: 'success' as const,
            };
        }
        if (normalized >= 70) {
            return {
                fillBg: 'bg-amber-500',
                badgeBg: 'bg-amber-500/10',
                tone: 'muted' as const,
            };
        }
        return {
            fillBg: 'bg-danger',
            badgeBg: 'bg-danger/10',
            tone: 'danger' as const,
        };
    };

    const theme = getTheme();
    const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

    return (
        <View testID={testID} className="w-full gap-1.5">
            {showLabel ? (
                <View className="flex-row justify-between items-center">
                    <Text variant="caption" tone="muted" className="font-medium">
                        Attendance %
                    </Text>
                    <View className={`px-2 py-0.5 rounded-full ${theme.badgeBg}`}>
                        <Text variant="caption" tone={theme.tone} className="font-bold">
                            {normalized}%
                        </Text>
                    </View>
                </View>
            ) : null}

            <View
                className={`w-full bg-bg-elevated rounded-full overflow-hidden border border-border ${heightClass}`}
            >
                <View
                    className={`${theme.fillBg} h-full rounded-full`}
                    style={{ width: `${normalized}%` }}
                />
            </View>
        </View>
    );
}
