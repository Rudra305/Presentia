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
import { ensureSeedTenant, getTeacherRepo, type Teacher } from '@/features/teachers';

export default function TeachersListScreen() {
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (q: string) => {
    const tenantId = await ensureSeedTenant();
    const repo = await getTeacherRepo();
    const rows = q.trim() ? await repo.search(tenantId, q) : await repo.listByTenant(tenantId);
    setTeachers(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(query);
    }, [load, query]),
  );

  const handleDelete = (teacher: Teacher) => {
    Alert.alert(
      'Delete teacher',
      `Remove ${teacher.fullName}? This soft-deletes the record — attendance history is preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              const repo = await getTeacherRepo();
              await repo.softDelete(teacher.id);
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
      testID="teachers-list"
    >
      <View className="px-5 pt-4 pb-3 gap-3">
        <View className="flex-row items-center justify-between">
          <Text variant="h2">Teachers</Text>
          <Button
            label="Add"
            size="sm"
            leftIcon="plus"
            onPress={() => router.push('/principal/teachers/new')}
            testID="teachers-add-btn"
          />
        </View>
        <Input
          placeholder="Search by name or email"
          value={query}
          onChangeText={setQuery}
          leftIcon="search"
          autoCapitalize="none"
          testID="teachers-search"
        />
      </View>

      {teachers == null ? (
        <View className="flex-1 items-center justify-center">
          <Loader size="lg" />
        </View>
      ) : teachers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6 gap-3" testID="teachers-empty">
          <Icon name="users" size={40} tone="fgSubtle" />
          <Text variant="h3">No teachers found</Text>
          <Text variant="bodySm" tone="muted" className="text-center">
            {query.trim()
              ? 'Try a different search term.'
              : 'Tap Add to invite your first teacher.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={teachers}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 8 }}
          renderItem={({ item }) => (
            <TeacherRow teacher={item} onDelete={() => handleDelete(item)} disabled={busy} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function TeacherRow({
  teacher,
  onDelete,
  disabled,
}: {
  teacher: Teacher;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <Card padding="md" testID={`teacher-row-${teacher.id}`}>
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Text variant="label" tone="primary">
            {initials(teacher.fullName)}
          </Text>
        </View>
        <View className="flex-1">
          <Text variant="label">{teacher.fullName}</Text>
          <Text variant="caption" tone="muted">
            {teacher.email ?? 'No email'} · {teacher.status}
          </Text>
        </View>
        <Pressable
          onPress={() =>
            router.push({ pathname: '/principal/teachers/[id]', params: { id: teacher.id } })
          }
          hitSlop={12}
          accessibilityLabel="Edit"
          testID={`teacher-edit-${teacher.id}`}
          className="p-2"
        >
          <Icon name="edit-2" size={18} tone="fgMuted" />
        </Pressable>
        <Pressable
          onPress={onDelete}
          hitSlop={12}
          disabled={disabled}
          accessibilityLabel="Delete"
          testID={`teacher-delete-${teacher.id}`}
          className="p-2"
        >
          <Icon name="trash-2" size={18} tone="danger" />
        </Pressable>
      </View>
    </Card>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '');
}
