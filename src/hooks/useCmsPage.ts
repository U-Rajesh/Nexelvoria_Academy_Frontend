import { useCallback, useEffect, useRef, useState } from 'react';
import { cmsService, type ApiResponse, type CmsPageKey } from '../services/cmsService';

/**
 * Admin editing of one CMS page/config document, backend-first:
 * loads the server copy when the screen opens; `run` awaits a save/reset and
 * only replaces the edited state with what the server stored. On failure the
 * screen keeps the last confirmed server state and the caller shows the error.
 */
export function useCmsPage<T>(page: CmsPageKey, fallback: T) {
  const fallbackRef = useRef(fallback);
  const [config, setConfig] = useState<T>(fallback);
  const [confirmed, setConfirmed] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await cmsService.getAdminPage<T>(page, fallbackRef.current);
    setLoading(false);
    if (res.success) {
      setConfig(res.data);
      setConfirmed(res.data);
      setLoadError(null);
    } else {
      setLoadError(res.error || 'This page could not be loaded from the server.');
    }
  }, [page]);

  useEffect(() => {
    reload();
  }, [reload]);

  const run = useCallback(async (action: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> => {
    setSaving(true);
    const res = await action();
    setSaving(false);
    if (res.success) {
      setConfig(res.data);
      setConfirmed(res.data);
    }
    return res;
  }, []);

  /** Discards unsaved edits and returns to the last state the server confirmed. */
  const revert = useCallback(() => setConfig(confirmed), [confirmed]);

  return { config, setConfig, loading, loadError, saving, run, reload, revert };
}
