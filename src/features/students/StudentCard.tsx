import React from 'react';
import { View, Pressable } from 'react-native';

import { Button, Card, Icon, Text } from '@/core/ui';
import type { IconName } from '@/core/ui';
import type { StudentWithDetails } from './types';

interface StudentCardProps {
    student: StudentWithDetails;
    onPress?: () => void;
    onDelete?: () => void;
    onEnrollFace?: () => void;
    testID?: string;
}

export const StudentCard: React.FC<StudentCardProps> = ({
    student,
    onPress,
    onDelete,
    onEnrollFace,
    testID,
}) => {
    const getBadgeStyle = (): {
        bg: string;
        text: string;
        label: string;
        icon: IconName;
        color: string;
    } => {
        if (student.isEnrolled) {
            return {
                bg: 'bg-emerald-100 dark:bg-emerald-950/40',
                text: 'text-emerald-700 dark:text-emerald-400',
                label: `Enrolled (${student.sampleCount} samples)`,
                icon: 'check-circle',
                color: '#059669',
            };
        }
        if (student.sampleCount > 0) {
            return {
                bg: 'bg-amber-100 dark:bg-amber-950/40',
                text: 'text-amber-700 dark:text-amber-400',
                label: `Incomplete (${student.sampleCount}/3 samples)`,
                icon: 'alert-circle',
                color: '#d97706',
            };
        }
        return {
            bg: 'bg-rose-100 dark:bg-rose-950/40',
            text: 'text-rose-700 dark:text-rose-400',
            label: 'Not Enrolled',
            icon: 'camera',
            color: '#e11d48',
        };
    };

    const badge = getBadgeStyle();

    return (
        <Card testID={testID} className="mb-3 p-4">
            <Pressable onPress={onPress} className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 pr-3">
                    <View className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 items-center justify-center mr-3 border border-indigo-200 dark:border-indigo-800">
                        <Text className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                            {student.fullName ? student.fullName.charAt(0).toUpperCase() : '?'}
                        </Text>
                    </View>

                    <View className="flex-1">
                        <Text className="font-semibold text-base text-gray-900 dark:text-gray-100">
                            {student.fullName}
                        </Text>
                        <View className="flex-row items-center mt-1 space-x-2">
                            <Text className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Roll #{student.rollNo}
                            </Text>
                            {student.className ? (
                                <Text className="text-xs text-gray-400 dark:text-gray-500">
                                    • {student.className}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                </View>

                {onDelete ? (
                    <Pressable
                        onPress={onDelete}
                        hitSlop={8}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
                    >
                        <Icon name="trash-2" size={18} color="#ef4444" />
                    </Pressable>
                ) : null}
            </Pressable>

            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <View className={`flex-row items-center px-2.5 py-1 rounded-full ${badge.bg}`}>
                    <Icon name={badge.icon} size={14} color={badge.color} />
                    <Text className={`text-xs font-semibold ml-1.5 ${badge.text}`}>
                        {badge.label}
                    </Text>
                </View>

                {!student.isEnrolled && onEnrollFace ? (
                    <Button
                        size="sm"
                        variant="secondary"
                        label="Capture Face"
                        onPress={onEnrollFace}
                    />
                ) : null}
            </View>
        </Card>
    );
};
