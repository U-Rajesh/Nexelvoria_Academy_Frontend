import React from 'react';
import { ReportsWorkspace } from '../../components/reports/ReportsWorkspace';

/**
 * Super Admin reports: every operational report plus refunds, expenses and the
 * financial summary (REP-008), all from live records with genuine exports.
 */
export const SuperAdminReportsPage: React.FC = () => (
  <ReportsWorkspace
    title="Executive Reports & Financial Statements"
    subtitle="Revenue, refunds, discounts, scholarships and expenses are reported separately; every figure comes from recorded transactions."
  />
);
