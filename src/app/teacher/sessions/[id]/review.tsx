import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Icon, Text } from '@/core/ui';
import { useAuth } from '@/features/auth';
import type { SessionWithDetails, StudentAttendanceItem } from '@/features/sessions';
import { getSessionRepo } from '@/features/sessions';

export default function SessionReviewScreen() {
    const router = useRouter();
    const { id: sessionId } = useLocalSearchParams<{ id: string }>();
    const { session: authSession } = useAuth();
    const teacherId = authSession?.userId ?? '';

    const [sessionInfo, setSessionInfo] = useState<SessionWithDetails | null>(null);
    const [attendanceList, setAttendanceList] = useState<StudentAttendanceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isClosing, setIsClosing] = useState(false);

    const loadData = useCallback(async () => {
        if (!sessionId) return;
        try {
            setLoading(true);
            const sessionRepo = await getSessionRepo();
            const [info, list] = await Promise.all([
                sessionRepo.getSessionWithDetails(sessionId),
                sessionRepo.listClassAttendance(sessionId),
            ]);

            setSessionInfo(info);
            setAttendanceList(list);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to load session review data.');
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleToggleStatus = async (
        studentId: string,
        newStatus: 'present' | 'absent' | 'late',
    ) => {
        try {
            const repo = await getSessionRepo();
            await repo.markAttendance({
                sessionId: sessionId!,
                studentId,
                status: newStatus,
                markedBy: teacherId,
                method: 'override',
            });

            const [updatedInfo, updatedList] = await Promise.all([
                repo.getSessionWithDetails(sessionId!),
                repo.listClassAttendance(sessionId!),
            ]);

            setSessionInfo(updatedInfo);
            setAttendanceList(updatedList);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to update attendance status.');
        }
    };

    const handleCloseSession = async () => {
        Alert.alert(
            'Close Session',
            'Are you sure you want to finalize and close this session? Any un-scanned students will be marked absent.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Finalize & Close',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsClosing(true);
                            const repo = await getSessionRepo();
                            await repo.closeSession(sessionId!, teacherId);
                            router.replace('/teacher/sessions' as any);
                        } catch (e: any) {
                            Alert.alert('Error', e.message || 'Failed to close session.');
                        } finally {
                            setIsClosing(false);
                        }
                    },
                },
            ],
        );
    };

    const presentCount = attendanceList.filter((s) => s.status === 'present').length;
    const absentCount = attendanceList.filter((s) => s.status === 'absent').length;
    const lateCount = attendanceList.filter((s) => s.status === 'late').length;

    return (
        <SafeAreaView className="flex-1 bg-bg" edges={['left', 'right', 'bottom']}>
            <ScrollView
                contentContainerStyle={{ padding: 20, gap: 20 }}
                testID="session-review-screen"
            >
                {/* Session Info Header */}
                <Card className="p-5 gap-3 border border-border">
                    <View className="flex-row items-center justify-between">
                        <View className="gap-0.5">
                            <Text variant="h2">
                                {sessionInfo?.className || 'Class Session'}
                                {sessionInfo?.classGrade
                                    ? ` (${sessionInfo.classGrade}${sessionInfo.classSection ?? ''})`
                                    : ''}
                            </Text>
                            <Text variant="caption" tone="muted">
                                {sessionInfo?.periodLabel || 'Attendance Summary'} • Started{' '}
                                {sessionInfo?.startedAt
                                    ? new Date(sessionInfo.startedAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })
                                    : ''}
                            </Text>
                        </View>

                        <View
                            className={`px-3 py-1 rounded-full border ${
                                sessionInfo?.status === 'open'
                                    ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                                    : 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700'
                            }`}
                        >
                            <Text
                                className={`text-xs font-bold capitalize ${
                                    sessionInfo?.status === 'open'
                                        ? 'text-emerald-700 dark:text-emerald-300'
                                        : 'text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                {sessionInfo?.status ?? 'Open'}
                            </Text>
                        </View>
                    </View>

                    {/* Quick Metrics */}
                    <View className="flex-row gap-2 mt-1">
                        <View className="flex-1 p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 items-center">
                            <Text className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                                Present
                            </Text>
                            <Text className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                                {presentCount}
                            </Text>
                        </View>

                        <View className="flex-1 p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 items-center">
                            <Text className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                                Absent
                            </Text>
                            <Text className="text-lg font-bold text-rose-800 dark:text-rose-200">
                                {absentCount}
                            </Text>
                        </View>

                        <View className="flex-1 p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 items-center">
                            <Text className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                                Late
                            </Text>
                            <Text className="text-lg font-bold text-amber-800 dark:text-amber-200">
                                {lateCount}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Student Roster Breakdown with Manual Override */}
                <View className="gap-3">
                    <Text variant="h3">Class Roster & Manual Override</Text>

                    <View className="gap-2">
                        {attendanceList.map((st) => (
                            <Card
                                key={st.studentId}
                                className="p-3.5 flex-row items-center justify-between border border-border"
                            >
                                <View className="flex-1 mr-2 gap-0.5">
                                    <Text variant="label" className="font-bold text-sm">
                                        {st.fullName}
                                    </Text>
                                    <Text variant="caption" tone="muted">
                                        Roll #{st.rollNo} {st.method ? `• ${st.method}` : ''}
                                    </Text>
                                </View>

                                {/* Status Override Pills */}
                                <View className="flex-row gap-1.5">
                                    <Pressable
                                        onPress={() =>
                                            void handleToggleStatus(st.studentId, 'present')
                                        }
                                        className={`px-2.5 py-1.5 rounded-lg border ${
                                            st.status === 'present'
                                                ? 'bg-emerald-600 border-emerald-600'
                                                : 'bg-bg-elevated border-border'
                                        }`}
                                    >
                                        <Text
                                            className={`text-xs font-bold ${
                                                st.status === 'present'
                                                    ? 'text-white'
                                                    : 'text-fg-muted'
                                            }`}
                                        >
                                            Present
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        onPress={() =>
                                            void handleToggleStatus(st.studentId, 'absent')
                                        }
                                        className={`px-2.5 py-1.5 rounded-lg border ${
                                            st.status === 'absent'
                                                ? 'bg-rose-600 border-rose-600'
                                                : 'bg-bg-elevated border-border'
                                        }`}
                                    >
                                        <Text
                                            className={`text-xs font-bold ${
                                                st.status === 'absent'
                                                    ? 'text-white'
                                                    : 'text-fg-muted'
                                            }`}
                                        >
                                            Absent
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        onPress={() =>
                                            void handleToggleStatus(st.studentId, 'late')
                                        }
                                        className={`px-2.5 py-1.5 rounded-lg border ${
                                            st.status === 'late'
                                                ? 'bg-amber-600 border-amber-600'
                                                : 'bg-bg-elevated border-border'
                                        }`}
                                    >
                                        <Text
                                            className={`text-xs font-bold ${
                                                st.status === 'late'
                                                    ? 'text-white'
                                                    : 'text-fg-muted'
                                            }`}
                                        >
                                            Late
                                        </Text>
                                    </Pressable>
                                </View>
                            </Card>
                        ))}
                    </View>
                </View>

                {/* Action Buttons */}
                <View className="gap-3 mt-2">
                    {sessionInfo?.status === 'open' ? (
                        <Button
                            label="Finalize & Close Session"
                            variant="danger"
                            leftIcon="check"
                            loading={isClosing}
                            onPress={handleCloseSession}
                            testID="close-session-btn"
                        />
                    ) : (
                        <Button
                            label="Back to Sessions"
                            variant="secondary"
                            onPress={() => router.replace('/teacher/sessions' as any)}
                        />
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
