import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Dropdown, Icon, Input, Modal, Text } from '@/core/ui';
import { useAuth } from '@/features/auth';
import type { ClassEntity } from '@/features/classes';
import { getClassRepo } from '@/features/classes';
import type { SessionWithDetails } from '@/features/sessions';
import { getSessionRepo } from '@/features/sessions';
import { ensureSeedTenant } from '@/features/teachers';

export default function TeacherSessionsScreen() {
    const router = useRouter();
    const { session: authSession } = useAuth();
    const teacherId = authSession?.userId ?? '';

    const [activeSession, setActiveSession] = useState<SessionWithDetails | null>(null);
    const [recentSessions, setRecentSessions] = useState<SessionWithDetails[]>([]);
    const [teacherClasses, setTeacherClasses] = useState<ClassEntity[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // New Session Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [periodLabel, setPeriodLabel] = useState('');
    const [isStarting, setIsStarting] = useState(false);

    const loadData = useCallback(async () => {
        if (!teacherId) return;
        try {
            setRefreshing(true);
            const sessionRepo = await getSessionRepo();
            const classRepo = await getClassRepo();

            const tenantId = await ensureSeedTenant();
            const [active, recent, assignedClasses, allClassesDetails] = await Promise.all([
                sessionRepo.getActiveSession(teacherId),
                sessionRepo.listRecentSessions(teacherId, 15),
                classRepo.listByTeacher(teacherId),
                classRepo.listWithDetails(tenantId),
            ]);

            const classes =
                assignedClasses.length > 0
                    ? assignedClasses
                    : allClassesDetails.map((c) => ({
                          id: c.id,
                          tenantId: c.tenantId,
                          name: c.name,
                          grade: c.grade,
                          section: c.section,
                          teacherId: c.teacherId,
                          createdAt: c.createdAt,
                          updatedAt: c.updatedAt,
                          version: c.version,
                          deletedAt: c.deletedAt,
                          syncStatus: c.syncStatus,
                          remoteId: c.remoteId,
                          lastSyncedAt: c.lastSyncedAt,
                      }));

            setActiveSession(active);
            setRecentSessions(recent.filter((s) => s.status !== 'open'));
            setTeacherClasses(classes);
            if (classes.length > 0 && classes[0] && !selectedClassId) {
                setSelectedClassId(classes[0].id);
            }
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to load sessions data.');
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    }, [teacherId, selectedClassId]);

    useFocusEffect(
        useCallback(() => {
            void loadData();
        }, [loadData]),
    );

    const handleStartSession = async () => {
        if (!selectedClassId) {
            Alert.alert('Select Class', 'Please select a class to start attendance.');
            return;
        }

        try {
            setIsStarting(true);
            const repo = await getSessionRepo();
            const newSession = await repo.createSession({
                classId: selectedClassId,
                teacherId,
                periodLabel: periodLabel.trim() || undefined,
            });

            setModalVisible(false);
            setPeriodLabel('');
            router.push(`/teacher/sessions/${newSession.id}/capture` as any);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to start session.');
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-bg" edges={['left', 'right', 'bottom']}>
            <ScrollView
                contentContainerStyle={{ padding: 20, gap: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
                testID="teacher-sessions-screen"
            >
                {/* Top Header Card & Start Action */}
                <View className="gap-3">
                    <View className="gap-0.5">
                        <Text variant="h2">Class Sessions</Text>
                        <Text variant="caption" tone="muted">
                            Start live attendance or review previous records
                        </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                        <Button
                            label="New Session"
                            leftIcon="plus"
                            size="sm"
                            className="flex-1"
                            onPress={() => setModalVisible(true)}
                            testID="start-new-session-btn"
                        />
                        <Button
                            label="Reports"
                            leftIcon="bar-chart-2"
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onPress={() => router.push('/teacher/reports' as any)}
                            testID="view-reports-btn"
                        />
                    </View>
                </View>

                {/* ACTIVE SESSION CARD (If any) */}
                {activeSession ? (
                    <Card className="p-5 border-2 border-primary bg-primary/5 gap-3">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                                <View className="h-3 w-3 rounded-full bg-emerald-500" />
                                <Text variant="label" tone="primary">
                                    LIVE SESSION IN PROGRESS
                                </Text>
                            </View>
                            <Text variant="caption" tone="muted">
                                {new Date(activeSession.startedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </Text>
                        </View>

                        <View className="gap-1">
                            <Text variant="h3">
                                {activeSession.className || 'Class'}
                                {activeSession.classGrade
                                    ? ` (${activeSession.classGrade}${activeSession.classSection ?? ''})`
                                    : ''}
                            </Text>
                            <Text variant="bodySm" tone="muted">
                                {activeSession.periodLabel || 'Attendance Session'}
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between bg-card p-3 rounded-xl border border-border mt-1">
                            <View className="flex-row items-center gap-2">
                                <Icon name="user" size={18} tone="primary" />
                                <Text variant="bodySm" className="font-semibold">
                                    Attendance Score:
                                </Text>
                            </View>
                            <Text
                                variant="bodySm"
                                className="font-bold text-emerald-600 dark:text-emerald-400"
                            >
                                {activeSession.presentCount} / {activeSession.totalStudents} Present
                            </Text>
                        </View>

                        <Button
                            label="Resume Attendance Capture"
                            leftIcon="camera"
                            className="mt-2"
                            onPress={() =>
                                router.push(`/teacher/sessions/${activeSession.id}/capture` as any)
                            }
                            testID="resume-active-session-btn"
                        />
                    </Card>
                ) : null}

                {/* RECENT SESSIONS */}
                <View className="gap-3">
                    <Text variant="h3">Session History</Text>

                    {loading ? (
                        <Card className="p-5 items-center justify-center">
                            <Text variant="bodySm" tone="muted">
                                Loading session history...
                            </Text>
                        </Card>
                    ) : recentSessions.length === 0 ? (
                        <Card className="p-8 items-center justify-center gap-2">
                            <Icon name="clock" size={32} tone="fgMuted" />
                            <Text variant="body" className="font-semibold text-center">
                                No past sessions recorded
                            </Text>
                            <Text variant="caption" tone="muted" className="text-center">
                                Tap "New Session" above to start taking attendance for your class.
                            </Text>
                        </Card>
                    ) : (
                        <View className="gap-3">
                            {recentSessions.map((s) => {
                                const pct =
                                    s.totalStudents > 0
                                        ? Math.round((s.presentCount / s.totalStudents) * 100)
                                        : 0;
                                return (
                                    <Pressable
                                        key={s.id}
                                        onPress={() =>
                                            router.push(`/teacher/sessions/${s.id}/review` as any)
                                        }
                                    >
                                        <Card className="p-4 flex-row items-center justify-between border border-border">
                                            <View className="flex-1 gap-1">
                                                <Text
                                                    variant="label"
                                                    className="text-base font-bold"
                                                >
                                                    {s.className || 'Class'}
                                                    {s.classGrade
                                                        ? ` (${s.classGrade}${s.classSection ?? ''})`
                                                        : ''}
                                                </Text>
                                                <Text variant="caption" tone="muted">
                                                    {s.periodLabel || 'Attendance Session'} •{' '}
                                                    {new Date(s.startedAt).toLocaleDateString()}
                                                </Text>
                                            </View>

                                            <View className="items-end gap-1">
                                                <View
                                                    className={`px-2.5 py-1 rounded-full border ${
                                                        pct >= 75
                                                            ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                                                            : 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800'
                                                    }`}
                                                >
                                                    <Text
                                                        className={`text-xs font-bold ${
                                                            pct >= 75
                                                                ? 'text-emerald-700 dark:text-emerald-300'
                                                                : 'text-amber-700 dark:text-amber-300'
                                                        }`}
                                                    >
                                                        {pct}% ({s.presentCount}/{s.totalStudents})
                                                    </Text>
                                                </View>
                                                <Icon
                                                    name="chevron-right"
                                                    size={16}
                                                    tone="fgMuted"
                                                />
                                            </View>
                                        </Card>
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* START NEW SESSION MODAL */}
            <Modal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title="Start Attendance Session"
                size="md"
            >
                <View className="gap-4">
                    <View className="gap-2">
                        <Text variant="label" tone="muted">
                            Select Class *
                        </Text>
                        {teacherClasses.length === 0 ? (
                            <Card padding="sm">
                                <Text variant="caption" tone="muted">
                                    No assigned classes found. Please ask Principal to assign a
                                    class to you.
                                </Text>
                            </Card>
                        ) : (
                            <Dropdown
                                placeholder="Choose a class..."
                                options={teacherClasses.map((c) => ({
                                    label: `${c.name} (${c.grade || ''}${c.section || ''})`,
                                    value: c.id,
                                }))}
                                selectedValue={selectedClassId}
                                onSelect={(val) => setSelectedClassId(val)}
                                testID="modal-class-dropdown"
                            />
                        )}
                    </View>

                    <Input
                        label="Period / Subject Label (optional)"
                        placeholder="e.g. Period 1 - Mathematics"
                        value={periodLabel}
                        onChangeText={setPeriodLabel}
                        autoCapitalize="words"
                    />

                    <View className="flex-row gap-3 mt-2">
                        <Button
                            label="Cancel"
                            variant="secondary"
                            fullWidth
                            onPress={() => setModalVisible(false)}
                        />
                        <Button
                            label="Start Session"
                            leftIcon="camera"
                            fullWidth
                            loading={isStarting}
                            disabled={!selectedClassId}
                            onPress={handleStartSession}
                            testID="confirm-start-session-btn"
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
