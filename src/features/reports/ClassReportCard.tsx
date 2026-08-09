import React from 'react';
import { View } from 'react-native';
import { Icon } from '@/core/ui/atoms/Icon';
import { Text } from '@/core/ui/atoms/Text';
import { Card } from '@/core/ui/molecules/Card';
import { AttendanceProgressBar } from './AttendanceProgressBar';
import type { ClassAttendanceSummary } from './types';

interface ClassReportCardProps {
    summary: ClassAttendanceSummary;
    onPress?: () => void;
    testID?: string;
}

export function ClassReportCard({ summary, onPress, testID }: ClassReportCardProps) {
    const content = (
        <>
            <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-2 gap-0.5">
                    <Text variant="h3">{summary.className}</Text>
                    <Text variant="caption" tone="muted">
                        {summary.teacherName
                            ? `Teacher: ${summary.teacherName}`
                            : 'No teacher assigned'}
                    </Text>
                </View>

                <View className="px-2.5 py-1 rounded-full bg-bg-elevated border border-border">
                    <Text variant="caption" tone="muted" className="font-semibold">
                        {summary.totalStudents} Students
                    </Text>
                </View>
            </View>

            <AttendanceProgressBar percentage={summary.attendancePercentage} size="md" />

            <View className="flex-row items-center justify-between pt-2 border-t border-border">
                <View className="flex-row items-center gap-3">
                    <Text variant="caption" tone="success" className="font-semibold">
                        {summary.totalPresent} Present
                    </Text>
                    <Text variant="caption" tone="danger" className="font-semibold">
                        {summary.totalAbsent} Absent
                    </Text>
                    {summary.totalLate > 0 ? (
                        <Text variant="caption" tone="muted" className="font-semibold">
                            {summary.totalLate} Late
                        </Text>
                    ) : null}
                </View>

                <Icon name="chevron-right" size={16} tone="fgSubtle" />
            </View>
        </>
    );

    if (onPress) {
        return (
            <Card testID={testID} pressable onPress={onPress} padding="md" className="mb-3 gap-3">
                {content}
            </Card>
        );
    }

    return (
        <Card testID={testID} padding="md" className="mb-3 gap-3">
            {content}
        </Card>
    );
}
