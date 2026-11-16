import { useEffect } from 'react';

/**
 * Hook to synchronize component state when localStorage keys are updated
 * by any service across all five panels in the application.
 */
export function useStorageSync(
  keys: string | string[],
  onSync: () => void
): void {
  useEffect(() => {
    const targetKeys = Array.isArray(keys) ? keys : [keys];

    const handleCustomUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ key?: string }>;
      if (!customEvent.detail?.key || targetKeys.includes(customEvent.detail.key)) {
        onSync();
      }
    };

    const handleNativeStorage = (e: StorageEvent) => {
      if (!e.key || targetKeys.includes(e.key)) {
        onSync();
      }
    };

    window.addEventListener('app-storage-update', handleCustomUpdate);
    window.addEventListener('storage', handleNativeStorage);

    return () => {
      window.removeEventListener('app-storage-update', handleCustomUpdate);
      window.removeEventListener('storage', handleNativeStorage);
    };
  }, [keys, onSync]);
}

