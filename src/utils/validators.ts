import { z } from 'zod';

export const studentRegistrationSchema = z
  .object({
    name: z.string().min(3, 'Full name must be at least 3 characters'),
    email: z.string().email('Please enter a valid email address'),
    mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    collegeName: z.string().min(2, 'College name is required'),
    degreeBranch: z.string().min(2, 'Degree and branch are required (e.g. B.Tech CSE)'),
    passingYear: z.string().regex(/^(201\d|202\d|2030)$/, 'Enter a valid passing year (e.g. 2024, 2025, 2026)'),
    courseInterestedIn: z.string().min(1, 'Please select a course'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['male', 'female', 'other'] as const),
    fullAddress: z.string().min(5, 'Full address is required'),
    linkedInUrl: z.string().url('Enter a valid LinkedIn URL').or(z.literal('')).optional(),
    githubUrl: z.string().url('Enter a valid GitHub URL').or(z.literal('')).optional(),
    guardianContact: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').or(z.literal('')).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type StudentRegistrationFormData = z.infer<typeof studentRegistrationSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter your email or 10-digit mobile number'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const dualOtpSchema = z.object({
  emailOtp: z.string().length(6, 'Email OTP must be 6 digits'),
  mobileOtp: z.string().length(6, 'Mobile OTP must be 6 digits'),
});

export type DualOtpFormData = z.infer<typeof dualOtpSchema>;

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
