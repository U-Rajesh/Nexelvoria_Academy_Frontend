import { z } from 'zod';

export const studentRegistrationSchema = z
  .object({
    name: z.string().min(3, 'Full legal name must be at least 3 characters'),
    email: z.string().email('Please enter a valid email address'),
    mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    collegeName: z.string().min(2, 'College or university name is required'),
    degreeBranch: z.string().min(2, 'Degree and branch are required (e.g. B.Tech CSE)'),
    passingYear: z.string().regex(/^(201\d|202\d|2030)$/, 'Enter a valid graduation year (e.g. 2024, 2025, 2026)'),
    courseInterestedIn: z.string().min(1, 'Please select your target course track'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['male', 'female', 'other'] as const),
    fullAddress: z.string().min(8, 'Please enter your complete postal address (at least 8 characters)'),
    linkedInUrl: z.string().url('Enter a valid LinkedIn profile URL (https://...)').or(z.literal('')).optional(),
    githubUrl: z.string().url('Enter a valid GitHub portfolio URL (https://...)').or(z.literal('')).optional(),
    guardianContact: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit guardian mobile number'),
    resumeFileName: z.string().optional(),
    resumeFileSize: z.string().optional(),
    resumeDataUrl: z.string().optional(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions to proceed with registration.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type StudentRegistrationFormData = z.infer<typeof studentRegistrationSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter your registered email or 10-digit mobile number'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const dualOtpSchema = z.object({
  emailOtp: z.string().length(6, 'Email OTP must be exactly 6 digits'),
  mobileOtp: z.string().length(6, 'Mobile OTP must be exactly 6 digits'),
});

export type DualOtpFormData = z.infer<typeof dualOtpSchema>;

export const forgotPasswordIdentifierSchema = z.object({
  identifier: z.string().min(3, 'Please enter your registered email address or 10-digit mobile number'),
});

export type ForgotPasswordIdentifierFormData = z.infer<typeof forgotPasswordIdentifierSchema>;

export const forgotPasswordOtpSchema = z.object({
  otp: z.string().length(6, 'Reset verification code must be 6 digits'),
});

export type ForgotPasswordOtpFormData = z.infer<typeof forgotPasswordOtpSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

export type TwoFactorVerifyFormData = z.infer<typeof twoFactorVerifySchema>;

export const manualPaymentSchema = z.object({
  studentId: z.string().min(1, 'Student selection is required'),
  courseId: z.string().min(1, 'Course selection is required'),
  amountINR: z.number().min(100, 'Amount must be at least ₹ 100'),
  paymentMethod: z.enum(['manual_cash', 'manual_bank_transfer', 'upi'] as const),
  receiptNumber: z.string().min(3, 'Receipt or reference number is required'),
  notes: z.string().min(3, 'Please specify justification / reference notes for audit'),
});

export type ManualPaymentFormData = z.infer<typeof manualPaymentSchema>;

export const supportTicketSchema = z.object({
  category: z.enum(['Academic', 'Technical / LMS', 'Fee & Payment', 'Placement', 'Certificate', 'General'] as const),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'] as const),
});

export type SupportTicketFormData = z.infer<typeof supportTicketSchema>;

export const assignmentSubmissionSchema = z.object({
  method: z.enum(['file_upload', 'text', 'zip_upload', 'github_link'] as const),
  textContent: z.string().optional(),
  githubUrl: z.string().url('Enter a valid GitHub repository URL').optional().or(z.literal('')),
  fileName: z.string().optional(),
});

export type AssignmentSubmissionFormData = z.infer<typeof assignmentSubmissionSchema>;
