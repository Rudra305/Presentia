import { useCallback, useEffect, useState } from 'react';
import { getSyncEngine } from './engine';
import type { SyncEngineStatus } from './types';

export function useSync() {
    const [status, setStatus] = useState<SyncEngineStatus>({
        isSyncing: false,
        pendingCount: 0,
        lastSyncedAt: null,
        lastError: null,
    });

    useEffect(() => {
        const engine = getSyncEngine();
        const unsubscribe = engine.subscribe((newStatus) => {
            setStatus(newStatus);
        });
        return unsubscribe;
    }, []);

    const triggerSync = useCallback(async () => {
        const engine = getSyncEngine();
        return engine.runSyncCycle();
    }, []);

    return {
        ...status,
        triggerSync,
    };
}
