import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Pressable, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Button, Input, Text, Icon, Loader } from '@/core/ui';
import { getClassRepo } from '@/features/classes/repo';
import type { ClassEntity } from '@/features/classes/repo';
import { EnrollmentWizard, StudentCard, getStudentRepo } from '@/features/students';
import type { StudentWithDetails } from '@/features/students';
import { ensureSeedTenant } from '@/features/teachers';

export default function TeacherStudentsScreen() {
    const params = useLocalSearchParams<{ classId?: string }>();

    const [tenantId, setTenantId] = useState<string>('tenant_default');
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | undefined>(params.classId);
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<StudentWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const activeTenantId = await ensureSeedTenant();
            setTenantId(activeTenantId);

            const classRepo = await getClassRepo();
            const classList = await classRepo.findAll({
                where: 'tenant_id = ?',
                params: [activeTenantId],
            });
            setClasses(classList);

            const studentRepo = await getStudentRepo();
            let list: StudentWithDetails[];
            if (searchQuery.trim()) {
                list = await studentRepo.search(
                    activeTenantId,
                    searchQuery.trim(),
                    selectedClassId,
                );
            } else {
                list = await studentRepo.listWithDetails(activeTenantId, selectedClassId);
            }
            setStudents(list);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to load student roster');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedClassId, searchQuery]);

    useEffect(() => {
        let mounted = true;
        void (async () => {
            if (mounted) {
                await loadData();
            }
        })();
        return () => {
            mounted = false;
        };
    }, [loadData]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadData();
    };

    const handleDeleteStudent = (student: StudentWithDetails) => {
        Alert.alert(
            'Delete Student',
            `Are you sure you want to remove "${student.fullName}" (Roll #${student.rollNo})? This will soft-delete their records and face embeddings.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const studentRepo = await getStudentRepo();
                            await studentRepo.softDelete(student.id);
                            loadData();
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to delete student');
                        }
                    },
                },
            ],
        );
    };

    const handleStudentCreated = (_newStudent: StudentWithDetails) => {
        loadData();
    };

    if (isLoading && !isRefreshing) {
        return (
            <View className="flex-1 items-center justify-center bg-bg">
                <Loader size="lg" />
                <Text className="mt-3 text-sm text-fg-muted">Loading student roster...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-bg p-4">
            {/* Search & Actions Header */}
            <View className="flex-row items-center space-x-2 mb-3">
                <View className="flex-1">
                    <Input
                        placeholder="Search by name or roll no..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        leftIcon="search"
                    />
                </View>
                <Button label="+ Add" onPress={() => setIsWizardOpen(true)} className="mb-4 ml-2" />
            </View>

            {/* Class Filter Pills */}
            <View className="mb-4">
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={[{ id: undefined, name: 'All Classes' }, ...classes]}
                    keyExtractor={(item) => item.id || 'all'}
                    renderItem={({ item }) => {
                        const isSelected = selectedClassId === item.id;
                        return (
                            <Pressable
                                onPress={() => setSelectedClassId(item.id)}
                                className={`mr-2 px-3 py-1.5 rounded-full border ${
                                    isSelected
                                        ? 'bg-indigo-600 border-indigo-600'
                                        : 'bg-bg-elevated border-border'
                                }`}
                            >
                                <Text
                                    className={`text-xs font-semibold ${
                                        isSelected ? 'text-white' : 'text-fg'
                                    }`}
                                >
                                    {item.name}
                                </Text>
                            </Pressable>
                        );
                    }}
                />
            </View>

            {/* Student List */}
            <FlatList
                data={students}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
                renderItem={({ item }) => (
                    <StudentCard
                        student={item}
                        onDelete={() => handleDeleteStudent(item)}
                        onEnrollFace={() => setIsWizardOpen(true)}
                    />
                )}
                ListEmptyComponent={
                    <View className="py-12 items-center justify-center">
                        <Icon name="users" size={48} tone="fgMuted" />
                        <Text className="text-base font-semibold text-fg mt-2">
                            No students found
                        </Text>
                        <Text className="text-xs text-fg-muted mt-1 text-center max-w-[250px]">
                            {searchQuery
                                ? 'Try adjusting your search criteria or class filter.'
                                : 'Click "+ Add" to enroll your first student with 3 face samples.'}
                        </Text>
                    </View>
                }
            />

            {/* Enrollment Wizard Modal */}
            <EnrollmentWizard
                visible={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={handleStudentCreated}
                tenantId={tenantId}
                classes={classes}
                initialClassId={selectedClassId}
            />
        </View>
    );
}
