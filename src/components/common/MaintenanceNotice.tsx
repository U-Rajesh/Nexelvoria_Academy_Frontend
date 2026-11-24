import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api';

/**
 * Shows the server's maintenance notice (CFG-20) while maintenance mode is on.
 * Reads the public GET /maintenance status on load and every minute; renders
 * nothing when maintenance is off or the status cannot be read.
 */
export const MaintenanceNotice: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const check = () =>
      apiClient
        .get('/maintenance')
        .then((res) => {
          const d = res.data?.data;
          if (active) setMessage(d?.enabled ? d.message || 'The platform is under maintenance.' : null);
        })
        .catch(() => undefined);
    check();
    const timer = window.setInterval(check, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (!message) return null;
  return (
    <div role="status" className="fixed top-0 inset-x-0 z-[60] bg-amber-500 text-amber-950 text-xs font-semibold text-center px-4 py-2 shadow">
      {message}
    </div>
  );
};
