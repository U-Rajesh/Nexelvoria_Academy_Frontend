import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { StudentLayout } from '../layouts/StudentLayout';
import { TeacherLayout } from '../layouts/TeacherLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { SuperAdminLayout } from '../layouts/SuperAdminLayout';

// Protection Guard
import { ProtectedRoute } from './ProtectedRoute';

// Public Pages
import { HomePage } from '../pages/public/HomePage';
import { AboutUsPage } from '../pages/public/AboutUsPage';
import { CoursesPage } from '../pages/public/CoursesPage';
import { CourseDetailPage } from '../pages/public/CourseDetailPage';
import { PlacementPage } from '../pages/public/PlacementPage';
import { TrainersPage } from '../pages/public/TrainersPage';
import { CollegePartnershipsPage } from '../pages/public/CollegePartnershipsPage';
import { CorporateTrainingPage } from '../pages/public/CorporateTrainingPage';
import { TestimonialsPage } from '../pages/public/TestimonialsPage';
import { AchievementsPage } from '../pages/public/AchievementsPage';
import { ContactUsPage } from '../pages/public/ContactUsPage';
import { FAQsPage } from '../pages/public/FAQsPage';
import { BlogPage } from '../pages/public/BlogPage';
import { BlogDetailPage } from '../pages/public/BlogDetailPage';
import { CareersPage } from '../pages/public/CareersPage';
import { PrivacyPolicyPage, TermsPage, RefundPolicyPage } from '../pages/public/LegalPages';
import { VerifyCertificatePage } from '../pages/public/VerifyCertificatePage';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { OTPVerificationPage } from '../pages/auth/OTPVerificationPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';

// Student Portal Pages
import { StudentDashboardPage } from '../pages/student/StudentDashboardPage';
import { StudentCoursesPage } from '../pages/student/StudentCoursesPage';
import { StudentSyllabusPage } from '../pages/student/StudentSyllabusPage';
import { StudentMaterialsPage } from '../pages/student/StudentMaterialsPage';
import { StudentRecordingsPage } from '../pages/student/StudentRecordingsPage';
import { LMSViewerPage } from '../pages/student/LMSViewerPage';
import { StudentBatchesPage, StudentLiveClassesPage } from '../pages/student/StudentBatchesPage';
import { StudentAttendancePage } from '../pages/student/StudentAttendancePage';
import { StudentAssignmentsPage } from '../pages/student/StudentAssignmentsPage';
import { StudentTestsPage } from '../pages/student/StudentTestsPage';
import { TestEnginePage } from '../pages/student/TestEnginePage';
import { StudentPerformancePage } from '../pages/student/StudentPerformancePage';
import { StudentFeesPage } from '../pages/student/StudentFeesPage';
import { StudentPaymentHistoryPage } from '../pages/student/StudentPaymentHistoryPage';
import { StudentCertificatesPage } from '../pages/student/StudentCertificatesPage';
import { StudentPlacementsPage } from '../pages/student/StudentPlacementsPage';
import { StudentMockInterviewsPage } from '../pages/student/StudentMockInterviewsPage';
import { StudentNotificationsPage } from '../pages/student/StudentNotificationsPage';
import { StudentSupportPage } from '../pages/student/StudentSupportPage';
import { StudentProfilePage, StudentChangePasswordPage } from '../pages/student/StudentProfilePage';

// Teacher Portal Pages
import { TeacherDashboardPage } from '../pages/teacher/TeacherDashboardPage';
import { TeacherProfilePage, TeacherChangePasswordPage } from '../pages/teacher/TeacherProfilePage';
import { TeacherCoursesPage } from '../pages/teacher/TeacherCoursesPage';
import { TeacherBatchesPage } from '../pages/teacher/TeacherBatchesPage';
import { TeacherStudentsPage } from '../pages/teacher/TeacherStudentsPage';
import { TeacherAttendancePage } from '../pages/teacher/TeacherAttendancePage';
import { TeacherAttendanceHistoryPage } from '../pages/teacher/TeacherAttendanceHistoryPage';
import { TeacherMaterialsPage } from '../pages/teacher/TeacherMaterialsPage';
import { TeacherRecordingsPage } from '../pages/teacher/TeacherRecordingsPage';
import { TeacherLiveClassesPage } from '../pages/teacher/TeacherLiveClassesPage';
import { TeacherAssignmentsPage } from '../pages/teacher/TeacherAssignmentsPage';
import { AssignmentEvaluationPage } from '../pages/teacher/AssignmentEvaluationPage';
import { TeacherTestsPage } from '../pages/teacher/TeacherTestsPage';
import { TeacherTestEvaluationPage } from '../pages/teacher/TeacherTestEvaluationPage';
import { TestRetakeAuthPage } from '../pages/teacher/TestRetakeAuthPage';
import { TeacherPerformancePage } from '../pages/teacher/TeacherPerformancePage';
import { TeacherAnnouncementsPage } from '../pages/teacher/TeacherAnnouncementsPage';
import { TeacherDoubtsPage } from '../pages/teacher/TeacherDoubtsPage';
import { TeacherTimetablePage } from '../pages/teacher/TeacherTimetablePage';
import { TeacherMockInterviewsPage } from '../pages/teacher/TeacherMockInterviewsPage';
import { TeacherReportsPage } from '../pages/teacher/TeacherReportsPage';
import { TeacherNotificationsPage } from '../pages/teacher/TeacherNotificationsPage';

// Admin Portal Pages
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminStudentApprovalsPage } from '../pages/admin/AdminStudentApprovalsPage';
import { AdminStudentListPage } from '../pages/admin/AdminStudentListPage';
import { AdminAddStudentPage } from '../pages/admin/AdminAddStudentPage';
import { AdminEnrollmentPage } from '../pages/admin/AdminEnrollmentPage';
import { AdminCourseListPage } from '../pages/admin/AdminCourseListPage';
import { AdminBatchListPage } from '../pages/admin/AdminBatchListPage';
import { AdminTeacherListPage } from '../pages/admin/AdminTeacherListPage';
import { AdminTeacherAllocationPage } from '../pages/admin/AdminTeacherAllocationPage';
import { AdminPaymentListPage } from '../pages/admin/AdminPaymentListPage';
import { AdminManualPaymentPage } from '../pages/admin/AdminManualPaymentPage';
import { AdminDiscountPage } from '../pages/admin/AdminDiscountPage';
import { AdminAttendancePage } from '../pages/admin/AdminAttendancePage';
import { AdminAssignmentPage } from '../pages/admin/AdminAssignmentPage';
import { AdminTestPage } from '../pages/admin/AdminTestPage';
import { AdminCertificatePage } from '../pages/admin/AdminCertificatePage';
import { AdminPlacementPage } from '../pages/admin/AdminPlacementPage';
import { AdminMockInterviewPage } from '../pages/admin/AdminMockInterviewPage';
import { AdminNotificationPage } from '../pages/admin/AdminNotificationPage';
import { AdminWebsiteCMSPage } from '../pages/admin/AdminWebsiteCMSPage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { AdminSupportPage } from '../pages/admin/AdminSupportPage';
import { AdminRolePermissionPage } from '../pages/admin/AdminRolePermissionPage';
import { AdminActivityLogsPage } from '../pages/admin/AdminActivityLogsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

// Super Admin Portal Pages
import { SuperAdminDashboardPage } from '../pages/super-admin/SuperAdminDashboardPage';
import { SuperAdminAdminListPage } from '../pages/super-admin/SuperAdminAdminListPage';
import { SuperAdminRefundsPage } from '../pages/super-admin/SuperAdminRefundsPage';
import { SuperAdminSystemConfigPage } from '../pages/super-admin/SuperAdminSystemConfigPage';
import { SuperAdminFinancialOverridesPage } from '../pages/super-admin/SuperAdminFinancialOverridesPage';
import { SuperAdminReportsPage } from '../pages/super-admin/SuperAdminReportsPage';
import { SuperAdminRolesPage } from '../pages/super-admin/SuperAdminRolesPage';
import { SuperAdminAuditLogsPage } from '../pages/super-admin/SuperAdminAuditLogsPage';

// Error Pages
import { NotFoundPage } from '../pages/error/NotFoundPage';
import { UnauthorizedPage } from '../pages/error/UnauthorizedPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Website Layout & Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseSlug" element={<CourseDetailPage />} />
        <Route path="/placements" element={<PlacementPage />} />
        <Route path="/trainers" element={<TrainersPage />} />
        <Route path="/college-partnerships" element={<CollegePartnershipsPage />} />
        <Route path="/corporate-training" element={<CorporateTrainingPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/contact-us" element={<ContactUsPage />} />
        <Route path="/faqs" element={<FAQsPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:articleSlug" element={<BlogDetailPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-and-conditions" element={<TermsPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
      </Route>

      {/* 2. Authentication Layout & Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OTPVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* 3. Student Dashboard Portal (Guarded for student role) */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="courses" element={<StudentCoursesPage />} />
        <Route path="courses/:courseId/learn" element={<LMSViewerPage />} />
        <Route path="syllabus" element={<StudentSyllabusPage />} />
        <Route path="materials" element={<StudentMaterialsPage />} />
        <Route path="recordings" element={<StudentRecordingsPage />} />
        <Route path="batches" element={<StudentBatchesPage />} />
        <Route path="live-classes" element={<StudentLiveClassesPage />} />
        <Route path="attendance" element={<StudentAttendancePage />} />
        <Route path="assignments" element={<StudentAssignmentsPage />} />
        <Route path="tests" element={<StudentTestsPage />} />
        <Route path="tests/:testId/take" element={<TestEnginePage />} />
        <Route path="performance" element={<StudentPerformancePage />} />
        <Route path="fees" element={<StudentFeesPage />} />
        <Route path="payment-history" element={<StudentPaymentHistoryPage />} />
        <Route path="certificates" element={<StudentCertificatesPage />} />
        <Route path="placements" element={<StudentPlacementsPage />} />
        <Route path="mock-interviews" element={<StudentMockInterviewsPage />} />
        <Route path="notifications" element={<StudentNotificationsPage />} />
        <Route path="support" element={<StudentSupportPage />} />
        <Route path="change-password" element={<StudentChangePasswordPage />} />
        <Route index element={<Navigate to="/student/dashboard" replace />} />
      </Route>

      {/* 4. Teacher Dashboard Portal (Guarded for teacher role) */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<TeacherDashboardPage />} />
        <Route path="profile" element={<TeacherProfilePage />} />
        <Route path="courses" element={<TeacherCoursesPage />} />
        <Route path="batches" element={<TeacherBatchesPage />} />
        <Route path="students" element={<TeacherStudentsPage />} />
        <Route path="attendance" element={<TeacherAttendancePage />} />
        <Route path="attendance-history" element={<TeacherAttendanceHistoryPage />} />
        <Route path="materials" element={<TeacherMaterialsPage />} />
        <Route path="recordings" element={<TeacherRecordingsPage />} />
        <Route path="live-classes" element={<TeacherLiveClassesPage />} />
        <Route path="assignments" element={<TeacherAssignmentsPage />} />
        <Route path="assignments/evaluations" element={<AssignmentEvaluationPage />} />
        <Route path="tests" element={<TeacherTestsPage />} />
        <Route path="tests/evaluations" element={<TeacherTestEvaluationPage />} />
        <Route path="tests/retakes" element={<TestRetakeAuthPage />} />
        <Route path="performance" element={<TeacherPerformancePage />} />
        <Route path="announcements" element={<TeacherAnnouncementsPage />} />
        <Route path="doubts" element={<TeacherDoubtsPage />} />
        <Route path="timetable" element={<TeacherTimetablePage />} />
        <Route path="mock-interviews" element={<TeacherMockInterviewsPage />} />
        <Route path="reports" element={<TeacherReportsPage />} />
        <Route path="notifications" element={<TeacherNotificationsPage />} />
        <Route path="change-password" element={<TeacherChangePasswordPage />} />
        <Route index element={<Navigate to="/teacher/dashboard" replace />} />
      </Route>

      {/* 5. Admin Dashboard Portal (Guarded for admin and super_admin roles) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="students/approvals" element={<AdminStudentApprovalsPage />} />
        <Route path="students" element={<AdminStudentListPage />} />
        <Route path="students/add" element={<AdminAddStudentPage />} />
        <Route path="enrollments" element={<AdminEnrollmentPage />} />
        <Route path="courses" element={<AdminCourseListPage />} />
        <Route path="batches" element={<AdminBatchListPage />} />
        <Route path="teachers" element={<AdminTeacherListPage />} />
        <Route path="teachers/allocation" element={<AdminTeacherAllocationPage />} />
        <Route path="payments" element={<AdminPaymentListPage />} />
        <Route path="payments/manual-entry" element={<AdminManualPaymentPage />} />
        <Route path="discounts" element={<AdminDiscountPage />} />
        <Route path="attendance" element={<AdminAttendancePage />} />
        <Route path="assignments" element={<AdminAssignmentPage />} />
        <Route path="tests" element={<AdminTestPage />} />
        <Route path="certificates" element={<AdminCertificatePage />} />
        <Route path="placements" element={<AdminPlacementPage />} />
        <Route path="mock-interviews" element={<AdminMockInterviewPage />} />
        <Route path="notifications" element={<AdminNotificationPage />} />
        <Route path="website-cms" element={<AdminWebsiteCMSPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="support" element={<AdminSupportPage />} />
        <Route path="roles-permissions" element={<AdminRolePermissionPage />} />
        <Route path="activity-logs" element={<AdminActivityLogsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* 6. Super Admin Governance Portal (Guarded strictly for super_admin) */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SuperAdminDashboardPage />} />
        <Route path="admins" element={<SuperAdminAdminListPage />} />
        <Route path="system-config" element={<SuperAdminSystemConfigPage />} />
        <Route path="refund-approvals" element={<SuperAdminRefundsPage />} />
        <Route path="refunds" element={<Navigate to="/super-admin/refund-approvals" replace />} />
        <Route path="financial-overrides" element={<SuperAdminFinancialOverridesPage />} />
        <Route path="reports" element={<SuperAdminReportsPage />} />
        <Route path="roles-permissions" element={<SuperAdminRolesPage />} />
        <Route path="roles" element={<Navigate to="/super-admin/roles-permissions" replace />} />
        <Route path="audit-logs" element={<SuperAdminAuditLogsPage />} />
        <Route path="website-cms" element={<AdminWebsiteCMSPage />} />
        <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
      </Route>

      {/* Error & Fallback Routes */}
      <Route path="/403" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

