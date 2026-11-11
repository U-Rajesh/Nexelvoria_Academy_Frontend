import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem } from '../utils/storage';
import { SEED_CERTIFICATES } from '../mocks/seedData';
import type { CertificateRecord, ApiResponse } from '../types';

const sleep = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const certificateService = {
  /**
   * Public certificate verification lookup
   */
  async verifyCertificate(codeOrNumber: string): Promise<ApiResponse<CertificateRecord | null>> {
    await sleep();
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
  },

  /**
   * Get all certificates for student
   */
  async getStudentCertificates(studentId: string): Promise<ApiResponse<CertificateRecord[]>> {
    await sleep();
    const certificates = getStorageItem<CertificateRecord[]>(STORAGE_KEYS.CERTIFICATES, SEED_CERTIFICATES);
    const list = certificates.filter((c) => c.studentId === studentId);
    return { success: true, data: list };
  },
};

