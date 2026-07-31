import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/core/ui/atoms/Button';
import { Icon } from '@/core/ui/atoms/Icon';
import { Input } from '@/core/ui/atoms/Input';
import { Loader } from '@/core/ui/atoms/Loader';
import { Text } from '@/core/ui/atoms/Text';
import { Card } from '@/core/ui/molecules/Card';
import { getClassRepo, type ClassWithDetails } from '@/features/classes';
import { ensureSeedTenant } from '@/features/teachers';

export default function ClassesListScreen() {
    const [classesList, setClassesList] = useState<ClassWithDetails[] | null>(null);
    const [query, setQuery] = useState('');
    const [busy, setBusy] = useState(false);

    const load = useCallback(async (q: string) => {
        const tenantId = await ensureSeedTenant();
        const repo = await getClassRepo();
        const rows = q.trim()
            ? await repo.search(tenantId, q)
            : await repo.listWithDetails(tenantId);
        setClassesList(rows);
    }, []);

    useFocusEffect(
        useCallback(() => {
            void load(query);
        }, [load, query]),
    );

    const handleDelete = (item: ClassWithDetails) => {
        Alert.alert(
            'Delete Class',
            `Remove ${item.name}? This soft-deletes the class record and preserves attendance records.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setBusy(true);
                        try {
                            const repo = await getClassRepo();
                            await repo.softDelete(item.id);
                            await load(query);
                        } finally {
                            setBusy(false);
                        }
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView
            className="flex-1 bg-bg"
            edges={['left', 'right', 'bottom']}
            testID="classes-list"
        >
            <View className="px-5 pt-4 pb-3 gap-3">
                <View className="flex-row items-center justify-between">
                    <Text variant="h2">Classes</Text>
                    <Button
                        label="Add"
                        size="sm"
                        leftIcon="plus"
                        onPress={() => router.push('/principal/classes/new')}
                        testID="classes-add-btn"
                    />
                </View>
                <Input
                    placeholder="Search classes by name or grade..."
                    value={query}
                    onChangeText={setQuery}
                    leftIcon="search"
                    autoCapitalize="none"
                    testID="classes-search"
                />
            </View>

            {classesList == null ? (
                <View className="flex-1 items-center justify-center">
                    <Loader size="lg" />
                </View>
            ) : classesList.length === 0 ? (
                <View
                    className="flex-1 items-center justify-center px-6 gap-3"
                    testID="classes-empty"
                >
                    <Icon name="grid" size={40} tone="fgSubtle" />
                    <Text variant="h3">No classes found</Text>
                    <Text variant="bodySm" tone="muted" className="text-center">
                        {query.trim()
                            ? 'Try a different search term.'
                            : 'Tap Add to create your first class.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={classesList}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
                    renderItem={({ item }) => (
                        <ClassRow item={item} onDelete={() => handleDelete(item)} disabled={busy} />
                    )}
                />
            )}
        </SafeAreaView>
    );
}

function ClassRow({
    item,
    onDelete,
    disabled,
}: {
    item: ClassWithDetails;
    onDelete: () => void;
    disabled: boolean;
}) {
    return (
        <Card padding="md" testID={`class-row-${item.id}`}>
            <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon name="book" size={20} tone="primary" />
                </View>

                <View className="flex-1 gap-1">
                    <Text variant="label">{item.name}</Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                        {item.teacherName ? `Teacher: ${item.teacherName}` : 'Unassigned teacher'} ·{' '}
                        <Text variant="caption" tone="primary">
                            {item.studentCount} student{item.studentCount === 1 ? '' : 's'}
                        </Text>
                    </Text>
                </View>

                <Pressable
                    onPress={() =>
                        router.push({
                            pathname: '/principal/classes/[id]',
                            params: { id: item.id },
                        })
                    }
                    hitSlop={12}
                    accessibilityLabel="Edit"
                    testID={`class-edit-${item.id}`}
                    className="p-2"
                >
                    <Icon name="edit-2" size={18} tone="fgMuted" />
                </Pressable>
                <Pressable
                    onPress={onDelete}
                    hitSlop={12}
                    disabled={disabled}
                    accessibilityLabel="Delete"
                    testID={`class-delete-${item.id}`}
                    className="p-2"
                >
                    <Icon name="trash-2" size={18} tone="danger" />
                </Pressable>
            </View>
        </Card>
    );
}
