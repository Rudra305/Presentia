import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '@/core/ui/atoms/Icon';
import { Text } from '@/core/ui/atoms/Text';
import { Card } from '@/core/ui/molecules/Card';
import { Dropdown } from '@/core/ui/molecules/Dropdown';
import { useAuth } from '@/features/auth';
import { getClassRepo, type ClassWithDetails } from '@/features/classes';
import { ensureSeedTenant } from '@/features/teachers';
import {
    getReportsRepo,
    StatCard,
    AttendanceProgressBar,
    type ClassAttendanceSummary,
    type StudentAttendanceSummary,
} from '@/features/reports';

export default function TeacherReportsScreen() {
    const { session } = useAuth();
    const teacherId = session?.userId;

    const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
    const [classesList, setClassesList] = useState<{ id: string; name: string }[]>([]);
    const [classSummary, setClassSummary] = useState<ClassAttendanceSummary | null>(null);
    const [students, setStudents] = useState<StudentAttendanceSummary[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const tenantId = await ensureSeedTenant();
            const classRepo = await getClassRepo();
            const repo = await getReportsRepo();

            const teacherClasses: ClassWithDetails[] = await classRepo.listWithDetails(tenantId);
            const filtered = teacherId
                ? teacherClasses.filter((c) => c.teacherId === teacherId)
                : [];

            const activeClasses = filtered.length > 0 ? filtered : teacherClasses;

            const items = activeClasses.map((c: ClassWithDetails) => ({
                id: c.id,
                name: `${c.name} (${c.grade || ''}${c.section || ''})`,
            }));

            setClassesList(items);

            const activeClassId = selectedClassId || items[0]?.id;
            if (activeClassId && activeClassId !== selectedClassId) {
                setSelectedClassId(activeClassId);
            }

            const summaries = await repo.getClassSummaries(tenantId, { classId: activeClassId });
            setClassSummary(summaries[0] || null);

            const studentList = await repo.getStudentSummaries(tenantId, activeClassId);
            setStudents(studentList);
        } catch (err) {
            console.error('Error loading teacher report data:', err);
        }
    }, [teacherId, selectedClassId]);

    useFocusEffect(
        useCallback(() => {
            void loadData();
        }, [loadData]),
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const lowAttendanceList = students.filter((s) => s.isLowAttendance);

    const classOptions = classesList.map((c) => ({
        label: c.name,
        value: c.id,
    }));

    return (
        <SafeAreaView
            className="flex-1 bg-bg"
            edges={['left', 'right', 'bottom']}
            testID="teacher-reports"
        >
            <ScrollView
                contentContainerStyle={{ padding: 20, gap: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Class Selection Dropdown */}
                {classesList.length > 0 ? (
                    <Dropdown
                        label="Select Class"
                        placeholder="Choose a class..."
                        options={classOptions}
                        selectedValue={selectedClassId}
                        onSelect={(val) => setSelectedClassId(val)}
                        testID="teacher-reports-class-dropdown"
                    />
                ) : null}

                {/* Overview Stats for selected class */}
                {classSummary ? (
                    <Card padding="md" className="gap-4">
                        <View className="gap-0.5">
                            <Text variant="h3">{classSummary.className} Performance</Text>
                            <Text variant="caption" tone="muted">
                                Total Enrolled Students: {classSummary.totalStudents}
                            </Text>
                        </View>

                        <AttendanceProgressBar
                            percentage={classSummary.attendancePercentage}
                            size="lg"
                        />

                        <View className="flex-row flex-wrap gap-3">
                            <StatCard
                                label="Sessions"
                                value={classSummary.totalSessions}
                                icon="calendar"
                                variant="neutral"
                                className="w-[48%]"
                            />
                            <StatCard
                                label="Present Marks"
                                value={classSummary.totalPresent}
                                icon="check-circle"
                                variant="success"
                                className="w-[48%]"
                            />
                            <StatCard
                                label="Absent Marks"
                                value={classSummary.totalAbsent}
                                icon="x-circle"
                                variant="danger"
                                className="w-[48%]"
                            />
                        </View>
                    </Card>
                ) : null}

                {/* Low Attendance Alert (< 75%) */}
                {lowAttendanceList.length > 0 ? (
                    <Card className="bg-danger/10 border-danger/30 gap-2" padding="md">
                        <View className="flex-row items-center gap-2">
                            <Icon name="alert-circle" size={18} tone="danger" />
                            <Text variant="h3" tone="danger" className="font-bold">
                                Low Attendance Alert ({lowAttendanceList.length})
                            </Text>
                        </View>

                        <Text variant="caption" tone="danger">
                            Students falling below the mandatory 75% attendance threshold:
                        </Text>

                        <View className="gap-1 mt-1">
                            {lowAttendanceList.map((s) => (
                                <View
                                    key={s.studentId}
                                    className="flex-row justify-between items-center py-1.5 border-b border-danger/20 last:border-b-0"
                                >
                                    <Text variant="bodySm" tone="danger" className="font-semibold">
                                        Roll #{s.rollNo} — {s.fullName}
                                    </Text>
                                    <Text variant="caption" tone="danger" className="font-bold">
                                        {s.attendancePercentage}%
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </Card>
                ) : null}

                {/* Full Class Roster Performance */}
                <View className="gap-3">
                    <Text variant="h3">Student Attendance Roster ({students.length})</Text>

                    {students.length === 0 ? (
                        <Card padding="lg" className="items-center justify-center">
                            <Text variant="body" tone="muted">
                                No students enrolled or no sessions recorded.
                            </Text>
                        </Card>
                    ) : (
                        students.map((st) => (
                            <Card
                                key={st.studentId}
                                padding="sm"
                                className="flex-row justify-between items-center"
                            >
                                <View className="flex-1 gap-0.5 mr-2">
                                    <Text variant="body" className="font-bold">
                                        Roll #{st.rollNo} — {st.fullName}
                                    </Text>
                                    <Text variant="caption" tone="muted">
                                        {st.presentCount} Present · {st.absentCount} Absent ·{' '}
                                        {st.lateCount} Late
                                    </Text>
                                </View>

                                <View
                                    className={`px-3 py-1 rounded-full ${
                                        st.attendancePercentage >= 85
                                            ? 'bg-emerald-500/10'
                                            : st.attendancePercentage >= 70
                                              ? 'bg-amber-500/10'
                                              : 'bg-danger/10'
                                    }`}
                                >
                                    <Text
                                        variant="caption"
                                        tone={
                                            st.attendancePercentage >= 85
                                                ? 'success'
                                                : st.attendancePercentage >= 70
                                                  ? 'muted'
                                                  : 'danger'
                                        }
                                        className="font-bold"
                                    >
                                        {st.attendancePercentage}%
                                    </Text>
                                </View>
                            </Card>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
