import React from 'react';
import { ReportsWorkspace } from '../../components/reports/ReportsWorkspace';

/** Admin reports (ADM-015, REP-002..REP-005): operational and payment reports from the server. */
export const AdminReportsPage: React.FC = () => (
  <ReportsWorkspace
    title="Institutional Reports & Exports"
    subtitle="Run reports on live records, filter them, and download the same result as CSV, Excel or PDF."
  />
);
