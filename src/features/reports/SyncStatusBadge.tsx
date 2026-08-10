import React from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '@/core/ui/atoms/Icon';
import { Text } from '@/core/ui/atoms/Text';
import { useSync } from '@/features/sync/useSync';

export interface SyncStatusBadgeProps {
    testID?: string;
    className?: string;
}

export function SyncStatusBadge({ testID, className }: SyncStatusBadgeProps) {
    const { isSyncing, pendingCount, triggerSync } = useSync();

    const getBadgeStyle = () => {
        if (isSyncing) {
            return {
                bg: 'bg-primary/10 border-primary/30',
                iconTone: 'primary' as const,
                textTone: 'primary' as const,
                label: 'Syncing…',
                icon: 'refresh-cw' as const,
            };
        }
        if (pendingCount > 0) {
            return {
                bg: 'bg-amber-500/10 border-amber-500/30',
                iconTone: 'warning' as const,
                textTone: 'muted' as const,
                label: `${pendingCount} Pending`,
                icon: 'zap' as const,
            };
        }
        return {
            bg: 'bg-emerald-500/10 border-emerald-500/30',
            iconTone: 'success' as const,
            textTone: 'success' as const,
            label: 'Synced',
            icon: 'check-circle' as const,
        };
    };

    const style = getBadgeStyle();

    return (
        <Pressable
            onPress={() => void triggerSync()}
            disabled={isSyncing}
            testID={testID ?? 'sync-status-badge'}
            className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${style.bg} active:opacity-70 ${
                className ?? ''
            }`}
        >
            <Icon name={style.icon} size={14} tone={style.iconTone} />
            <Text variant="caption" tone={style.textTone} className="font-semibold">
                {style.label}
            </Text>
        </Pressable>
    );
}
