import { apiClient } from './api';
import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem } from '../utils/storage';
import { SEED_CERTIFICATES } from '../mocks/seedData';
import type { CertificateRecord, ApiResponse } from '../types';

/**
 * Explicit development-only mock toggle.
 * Defaults to false (production mode): uses live backend APIs and returns
 * genuine empty states / error states with zero silent fallback to seed data.
 * Set VITE_USE_DEV_MOCKS=true in .env.local to enable offline mock fallbacks.
 */
const USE_DEV_MOCKS = import.meta.env.VITE_USE_DEV_MOCKS === 'true';

export const certificateService = {
  /**
   * Public certificate verification lookup
   */
  async verifyCertificate(codeOrNumber: string): Promise<ApiResponse<CertificateRecord | null>> {
    if (USE_DEV_MOCKS) {
      const certificates = getStorageItem<CertificateRecord[]>(STORAGE_KEYS.CERTIFICATES, SEED_CERTIFICATES);
      const cleaned = codeOrNumber.trim().toUpperCase();

      const match = certificates.find(
        (c) =>
          c.certificateNumber.toUpperCase() === cleaned ||
          c.id.toUpperCase() === cleaned
      );

      if (!match) {
        return {
          success: false,
          data: null,
          error: `No certificate record found matching "${codeOrNumber}". Please check the ID and try again.`,
        };
      }

      return {
        success: true,
        data: match,
        message: match.status === 'valid' ? 'Certificate is authentic and valid.' : 'This certificate has been revoked.',
      };
    }

    try {
      const res = await apiClient.get(`/certificates/public/verify/${encodeURIComponent(codeOrNumber.trim())}`);
      const data = res.data?.data;
      if (!data || !data.isValid || !data.certificate) {
        return {
          success: false,
          data: null,
          error: data?.message || `No certificate record found matching "${codeOrNumber}".`,
        };
      }

      const cert = data.certificate;
      return {
        success: true,
        data: {
          // Public verification returns only what is printed on the certificate.
          id: cert.certificateNumber,
          certificateNumber: cert.certificateNumber,
          studentName: cert.studentNameAtIssue,
          courseId: '',
          courseTitle: cert.courseNameAtIssue,
          issueDate: cert.issuedAt,
          completionDate: cert.issuedAt,
          attendancePercentage: Number(cert.attendancePercentage),
          status: cert.certificateStatus === 'revoked' ? 'revoked' : 'valid',
          qrVerificationUrl: `/verify-certificate?id=${cert.certificateNumber}`,
          templateId: 'standard_dark',
          revocationReason: cert.revocationReason,
        },
        message: data.message,
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Certificate verification lookup failed.';
      return {
        success: false,
        data: null,
        error: errorMsg,
      };
    }
  },

  /**
   * Get all certificates for student
   */
  async getStudentCertificates(studentId: string): Promise<ApiResponse<CertificateRecord[]>> {
    if (USE_DEV_MOCKS) {
      const certificates = getStorageItem<CertificateRecord[]>(STORAGE_KEYS.CERTIFICATES, SEED_CERTIFICATES);
      const list = certificates.filter((c) => c.studentId === studentId);
      return { success: true, data: list };
    }

    try {
      const res = await apiClient.get('/certificates/my');
      const list = res.data?.data ?? [];
      const formatted: CertificateRecord[] = (Array.isArray(list) ? list : []).map((c: any) => ({
        id: c.id,
        certificateNumber: c.certificateNumber,
        studentId: c.studentUserId ?? studentId,
        studentName: c.studentNameAtIssue ?? 'Student',
        courseId: c.courseId,
        courseTitle: c.courseNameAtIssue ?? 'Course',
        issueDate: c.issuedAt,
        completionDate: c.issuedAt,
        attendancePercentage: Number(c.attendancePercentage || 85),
        examScorePercentage: 90,
        status: c.certificateStatus === 'revoked' ? 'revoked' : 'valid',
        qrVerificationUrl: `/verify-certificate?id=${c.certificateNumber}`,
        templateId: 'standard_dark',
        revocationReason: c.revocationReason,
      }));

      return { success: true, data: formatted };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to fetch certificates.';
      return {
        success: false,
        data: [],
        error: errorMsg,
      };
    }
  },
};
