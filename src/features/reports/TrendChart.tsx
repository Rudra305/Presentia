import React from 'react';
import { View } from 'react-native';
import { Text } from '@/core/ui/atoms/Text';
import { Card } from '@/core/ui/molecules/Card';
import type { WeeklyTrendPoint } from './types';

interface TrendChartProps {
    data: WeeklyTrendPoint[];
    testID?: string;
}

export function TrendChart({ data, testID }: TrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card testID={testID} padding="lg" className="items-center justify-center">
                <Text variant="caption" tone="muted">
                    No session data available for trend chart.
                </Text>
            </Card>
        );
    }

    return (
        <Card testID={testID} padding="md" className="gap-3">
            <Text variant="h3">Recent Attendance Trends</Text>

            <View className="flex-row items-end justify-between h-36 pt-4 pb-2 px-1">
                {data.map((item, index) => {
                    const heightPct = Math.max(8, item.attendancePercentage);
                    const isHigh = item.attendancePercentage >= 85;
                    const isMid = item.attendancePercentage >= 70 && item.attendancePercentage < 85;
                    const barBg = isHigh ? 'bg-primary' : isMid ? 'bg-amber-500' : 'bg-danger';

                    return (
                        <View key={`${item.date}-${index}`} className="items-center flex-1 mx-1">
                            <Text
                                variant="caption"
                                tone="subtle"
                                className="text-[10px] font-bold mb-1"
                            >
                                {item.attendancePercentage}%
                            </Text>
                            <View className="w-full bg-bg-elevated rounded-t-lg h-24 justify-end overflow-hidden border-x border-t border-border">
                                <View
                                    className={`w-full rounded-t-sm ${barBg}`}
                                    style={{ height: `${heightPct}%` }}
                                />
                            </View>
                            <Text
                                variant="caption"
                                tone="muted"
                                className="text-[11px] font-medium mt-2"
                            >
                                {item.dayLabel}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </Card>
    );
}
