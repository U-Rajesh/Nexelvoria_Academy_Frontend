import React from 'react';
import { AlertCircle } from 'lucide-react';
import { PageLabel } from '../../components/common/PageLabel';
import { SEO } from '../../components/common/SEO';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <SEO
        title="Privacy Policy"
        description="Nexelvoria Academy's student and partner data privacy standards, data retention, and compliance with Indian regulations."
        keywords={['Privacy Policy', 'Data Protection', 'Student Privacy', 'Nexelvoria Legal']}
      />

      <div className="text-center max-w-2xl mx-auto space-y-3 pb-2">
        <PageLabel>Legal & Compliance</PageLabel>
        <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Last updated: 4 November 2026 • Compliant with Indian Data Protection Regulations</p>
      </div>

      <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
        <p>
          Nexelvoria Academy (&quot;the Institute&quot;, &quot;we&quot;, &quot;our&quot;) is committed to safeguarding the personal, academic, and payment records of our students, faculty, and institutional partners.
        </p>

        <h3 className="text-base font-bold text-slate-900 pt-2">1. Information Collection & Consent</h3>
        <p>
          During self-registration, we collect the candidate’s full name, email address, 10-digit mobile number, college name, degree branch, year of graduation, and resume. Both email and mobile numbers are authenticated via mandatory 6-digit One-Time Passwords (OTPs) pursuant to SRS Business Rule BR-001.
        </p>

        <h3 className="text-base font-bold text-slate-900 pt-2">2. Academic & LMS Data Retention</h3>
        <p>
          We record attendance per session (Present, Absent, Leave as per BR-010), assignment submissions, and examination attempts to evaluate certificate eligibility under BR-011. Data retention follows applicable legal guidelines and institute archival protocols.
        </p>

        <h3 className="text-base font-bold text-slate-900 pt-2">3. Payment Information Security</h3>
        <p>
          Online payments are processed securely through Razorpay. Nexelvoria Academy does not store credit/debit card numbers or UPI PINs on its servers. We only store transaction status identifiers and order reference IDs for receipts and audits (SRS Module PAY).
        </p>

        <h3 className="text-base font-bold text-slate-900 pt-2">4. User Rights & Data Deletion</h3>
        <p>
          Registered students have the right to inspect their personal profile data and request corrections of permitted fields under STD-006. Account suspension and deletion requests are governed by administrative oversight.
        </p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <SEO
        title="Terms of Service & Code of Conduct"
        description="Terms and conditions governing course registration, admin approvals, attendance requirements, and academic integrity."
        keywords={['Terms of Service', 'Code of Conduct', 'Attendance Rules', 'Honor Code']}
      />

      <div className="text-center max-w-2xl mx-auto space-y-3 pb-2">
        <PageLabel>Legal & Compliance</PageLabel>
        <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service & Honor Code</h1>
        <p className="text-xs text-slate-500">Effective Date: 4 November 2026</p>
      </div>

      <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
        <h3 className="text-base font-bold text-slate-900">1. Student Registration & Admin Approval Gate</h3>
        <p>
          Registration does not automatically guarantee enrollment. In accordance with SRS Business Rule BR-002, Admin approval is strictly required before course payment can be initiated. Unapproved or unpaid accounts receive restricted preview access only (BR-003).
        </p>

        <h3 className="text-base font-bold text-slate-900 pt-2">2. Attendance & Certificate Standards</h3>
        <p>
          To maintain educational prestige, certificate eligibility requires: 1) 100% course completion, 2) at least 75% attendance across scheduled batch sessions, and 3) passing score in the final competency examination (BR-011).
        </p>

        <h3 className="text-base font-bold text-slate-900 pt-2">3. Academic Integrity & Examinations</h3>
        <p>
          Submitting plagiarized assignment code or violating online test integrity may lead to immediate account suspension (AUTH-011). Assigned teachers may authorize retakes with documented justification where appropriate (BR-012).
        </p>

        <h3 className="text-base font-bold text-slate-900 pt-2">4. Proprietary LMS Content</h3>
        <p>
          All video lectures, PDF notes, system design architectural diagrams, and question repositories are the intellectual property of Nexelvoria Academy. Unauthorized redistribution or screen-recording is strictly prohibited.
        </p>
      </div>
    </div>
  );
};

export const RefundPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <SEO
        title="Refund & Cancellation Policy"
        description="Comprehensive policy on tuition fees, lump-sum payment enforcement, and Super Admin exclusive refund approvals."
        keywords={['Refund Policy', 'Tuition Fees', 'Super Admin Refund', 'Cancellation Terms']}
      />

      <div className="text-center max-w-2xl mx-auto space-y-3 pb-2">
        <PageLabel>Financial Policies</PageLabel>
        <h1 className="text-3xl font-extrabold text-slate-900">Refund and Cancellation Policy</h1>
        <p className="text-xs text-slate-500">Document Baseline: SRS Module PAY & Section 13</p>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Policy Notice (SRS Section 13):</strong> Specific cancellation eligibility windows and percentage deductions are pending final institutional confirmation. The rules below reflect the approved SRS requirements baseline.
        </div>
      </div>

      <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
        <h3 className="text-base font-bold text-slate-900">1. Installment Payments</h3>
        <p>
          As outlined in SRS Business Rule BR-005, installment payment options are not supported. All tuition fees are transacted as a single lump-sum via the payment gateway or authorized manual recording.
        </p>

        <h3 className="text-base font-bold text-slate-900 pt-2">2. Exclusive Super Admin Refund Authority</h3>
        <p>
          Pursuant to SRS Business Rule BR-006, refund approvals are strictly restricted to the Super Admin (Institute Owner). Admins and teachers cannot authorize refunds or financial reversals under any circumstances.
        </p>

        <h3 className="text-base font-bold text-slate-900 pt-2">3. Audited Financial Records</h3>
        <p>
          All approved refunds, fee adjustments, and manual overrides maintain an immutable audit record (BR-007, BR-017) capturing the authorizer ID, student record, and justification notes for accounting transparency.
        </p>
      </div>
    </div>
  );
};
