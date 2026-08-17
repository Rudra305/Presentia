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
            <View className="gap-2">
                <Text variant="h3">7-Day Attendance Trend</Text>
                <View className="flex-row flex-wrap items-center gap-2.5">
                    <View className="flex-row items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <View className="h-2 w-2 rounded-full bg-emerald-500" />
                        <Text className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                            ≥85% Good
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <View className="h-2 w-2 rounded-full bg-amber-500" />
                        <Text className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                            70-84% Moderate
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                        <View className="h-2 w-2 rounded-full bg-rose-500" />
                        <Text className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                            &lt;70% At-Risk
                        </Text>
                    </View>
                </View>
            </View>

            <View className="flex-row items-end justify-between h-40 pt-4 pb-1 px-1">
                {data.map((item, index) => {
                    const hasSession = item.totalSessions > 0;
                    const heightPct = hasSession ? Math.max(10, item.attendancePercentage) : 0;
                    const isHigh = item.attendancePercentage >= 85;
                    const isMid = item.attendancePercentage >= 70 && item.attendancePercentage < 85;
                    const barBg = isHigh
                        ? 'bg-emerald-500'
                        : isMid
                          ? 'bg-amber-500'
                          : 'bg-rose-500';

                    const dateParts = item.date.split('-');
                    const shortDate =
                        dateParts.length === 3 ? `${Number(dateParts[2])}/${Number(dateParts[1])}` : '';

                    return (
                        <View key={`${item.date}-${index}`} className="items-center flex-1 mx-0.5">
                            {/* Percentage badge / dash above bar */}
                            <Text
                                variant="caption"
                                tone={hasSession ? 'primary' : 'subtle'}
                                className={`text-[10px] font-bold mb-1 ${
                                    hasSession ? '' : 'text-gray-400 dark:text-gray-600'
                                }`}
                            >
                                {hasSession ? `${item.attendancePercentage}%` : '—'}
                            </Text>

                            {/* Bar Container */}
                            <View className="w-full bg-gray-100 dark:bg-gray-800 rounded-t-lg h-24 justify-end overflow-hidden border-x border-t border-gray-200 dark:border-gray-700 relative">
                                {hasSession ? (
                                    <View
                                        className={`w-full rounded-t-md ${barBg}`}
                                        style={{ height: `${heightPct}%` }}
                                    />
                                ) : (
                                    <View className="w-full h-1 bg-gray-300 dark:bg-gray-700" />
                                )}
                            </View>

                            {/* Day and Date Labels */}
                            <Text
                                variant="caption"
                                tone="muted"
                                className="text-[11px] font-bold mt-1.5 text-center"
                            >
                                {item.dayLabel}
                            </Text>
                            {shortDate ? (
                                <Text
                                    variant="caption"
                                    tone="subtle"
                                    className="text-[9px] text-center text-gray-400 dark:text-gray-500"
                                >
                                    {shortDate}
                                </Text>
                            ) : null}
                        </View>
                    );
                })}
            </View>
        </Card>
    );
}
