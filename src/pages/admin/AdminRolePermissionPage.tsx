import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Save,
  CheckCircle2,
  Lock,
  Layers,
  BookOpen,
  Users,
  CheckSquare,
  History,
  FileText,
  Video,
  Radio,
  FileEdit,
  FileCheck2,
  Award,
  BarChart3,
  Megaphone,
  HelpCircle,
  Calendar,
  RotateCcw,
  Bell,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';

type PermissionAction = 'View' | 'Create' | 'Edit' | 'Delete' | 'Approve' | 'Manage';

interface ActionItem {
  id: string;
  action: PermissionAction;
  label: string;
  description: string;
}

interface TeacherModuleGroup {
  id: string;
  name: string;
  category: 'Profile & Courses' | 'Attendance & Timetable' | 'Learning Content' | 'Assignments & Tests' | 'Student Engagement' | 'System & Reports';
  icon: React.ReactNode;
  allocationScope: string;
  actions: ActionItem[];
}

export const AdminRolePermissionPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [teacherPermissions, setTeacherPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // The 22 Teacher Modules specified in SRS / PRD
  const teacherModules: TeacherModuleGroup[] = [
    // 1. Teacher Profile
    {
      id: 'teacher_profile',
      name: 'Teacher Profile',
      category: 'Profile & Courses',
      icon: <Users className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Personal Faculty Profile',
      actions: [
        {
          id: 'teacher_profile_view',
          action: 'View',
          label: 'View Faculty Profile',
          description: 'Access personal faculty profile, employment details, and academic qualifications.',
        },
        {
          id: 'teacher_profile_edit',
          action: 'Edit',
          label: 'Edit Faculty Bio & Avatar',
          description: 'Update biography, contact phone, LinkedIn handle, and profile picture.',
        },
      ],
    },

    // 2. My Courses
    {
      id: 'my_courses',
      name: 'My Courses',
      category: 'Profile & Courses',
      icon: <BookOpen className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Courses Only',
      actions: [
        {
          id: 'my_courses_view',
          action: 'View',
          label: 'View Assigned Courses',
          description: 'Inspect syllabus, chapter structure, and curriculum for courses allocated by Admin.',
        },
      ],
    },

    // 3. My Batches
    {
      id: 'my_batches',
      name: 'My Batches',
      category: 'Profile & Courses',
      icon: <Layers className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Batches Only',
      actions: [
        {
          id: 'my_batches_view',
          action: 'View',
          label: 'View Assigned Cohorts',
          description: 'View active batch rosters, student count, start/end dates, and class timing schedules.',
        },
        {
          id: 'my_batches_edit',
          action: 'Edit',
          label: 'Update Live Class Links',
          description: 'Update batch manual meeting links (Google Meet / Zoom URLs per BR-015).',
        },
      ],
    },

    // 4. Student List
    {
      id: 'student_list',
      name: 'Student List',
      category: 'Profile & Courses',
      icon: <Users className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Enrolled Students in Assigned Batches Only',
      actions: [
        {
          id: 'student_list_view',
          action: 'View',
          label: 'View Enrolled Student Directory',
          description: 'Access student names, emails, and enrollment progress for assigned cohorts only.',
        },
      ],
    },

    // 5. Attendance Management
    {
      id: 'attendance_mgmt',
      name: 'Attendance Management',
      category: 'Attendance & Timetable',
      icon: <CheckSquare className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Batches Only',
      actions: [
        {
          id: 'attendance_view',
          action: 'View',
          label: 'View Daily Attendance Sheets',
          description: 'Review student attendance records for daily cohort lecture sessions.',
        },
        {
          id: 'attendance_create',
          action: 'Create',
          label: 'Mark Daily Session Attendance',
          description: 'Launch attendance roster and record present, absent, and leave statuses.',
        },
        {
          id: 'attendance_edit',
          action: 'Edit',
          label: 'Edit Recent Attendance Records',
          description: 'Make corrections to attendance records within the allowed grace period.',
        },
      ],
    },

    // 6. Attendance History
    {
      id: 'attendance_history',
      name: 'Attendance History',
      category: 'Attendance & Timetable',
      icon: <History className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Batches Only',
      actions: [
        {
          id: 'attendance_history_view',
          action: 'View',
          label: 'View Attendance Logs & 75% Gate',
          description: 'Inspect cumulative student percentages and certification eligibility (BR-011).',
        },
      ],
    },

    // 7. Study Materials
    {
      id: 'study_materials',
      name: 'Study Materials',
      category: 'Learning Content',
      icon: <FileText className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Courses Only',
      actions: [
        {
          id: 'materials_view',
          action: 'View',
          label: 'Browse Uploaded Resources',
          description: 'View existing PDFs, presentation slides, notes, and code samples.',
        },
        {
          id: 'materials_create',
          action: 'Create',
          label: 'Upload New Study Materials',
          description: 'Upload lecture PDFs, cheat-sheets, and supplementary reading files.',
        },
        {
          id: 'materials_edit',
          action: 'Edit',
          label: 'Edit Material Metadata',
          description: 'Update titles, module tags, descriptions, and download links.',
        },
        {
          id: 'materials_delete',
          action: 'Delete',
          label: 'Delete Outdated Materials',
          description: 'Remove deprecated notes and obsolete source code assets.',
        },
      ],
    },

    // 8. Recorded Classes
    {
      id: 'recorded_classes',
      name: 'Recorded Classes',
      category: 'Learning Content',
      icon: <Video className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Batches Only',
      actions: [
        {
          id: 'recordings_view',
          action: 'View',
          label: 'View Recording Archive',
          description: 'Review existing video recording sessions and replay links for assigned batches.',
        },
        {
          id: 'recordings_create',
          action: 'Create',
          label: 'Publish New Session Recording',
          description: 'Add new lecture video links, YouTube/CloudFront URLs, and timestamps.',
        },
        {
          id: 'recordings_edit',
          action: 'Edit',
          label: 'Edit Recording Metadata',
          description: 'Update recording titles, topics covered, and supplementary notes.',
        },
        {
          id: 'recordings_delete',
          action: 'Delete',
          label: 'Delete Class Recordings',
          description: 'Remove erroneous or corrupted video entries.',
        },
      ],
    },

    // 9. Live Classes
    {
      id: 'live_classes',
      name: 'Live Classes',
      category: 'Learning Content',
      icon: <Radio className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Batches Only',
      actions: [
        {
          id: 'live_classes_view',
          action: 'View',
          label: 'View Scheduled Live Classes',
          description: 'Review upcoming live lecture timetable and meeting URLs.',
        },
        {
          id: 'live_classes_create',
          action: 'Create',
          label: 'Schedule New Live Class',
          description: 'Schedule a live class date, time, and topic for assigned cohorts.',
        },
        {
          id: 'live_classes_edit',
          action: 'Edit',
          label: 'Update Live Class Timings',
          description: 'Reschedule classes or update live video conferencing room links.',
        },
        {
          id: 'live_classes_manage',
          action: 'Manage',
          label: 'Host & Conduct Live Class',
          description: 'Start live class broadcast, manage participant chat, and conclude session.',
        },
      ],
    },

    // 10. Assignments
    {
      id: 'assignments',
      name: 'Assignments',
      category: 'Assignments & Tests',
      icon: <FileEdit className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Courses & Batches Only',
      actions: [
        {
          id: 'assignments_view',
          action: 'View',
          label: 'Browse Course Assignments',
          description: 'View active assignments, problem statements, and submission deadlines.',
        },
        {
          id: 'assignments_create',
          action: 'Create',
          label: 'Create New Assignment',
          description: 'Publish new assignments, specify max marks, and define allowed submission methods.',
        },
        {
          id: 'assignments_edit',
          action: 'Edit',
          label: 'Edit Assignment Details',
          description: 'Modify problem statements, rubrics, point weights, and deadline dates.',
        },
        {
          id: 'assignments_delete',
          action: 'Delete',
          label: 'Delete Course Assignment',
          description: 'Delete draft or unsubmitted assignments.',
        },
      ],
    },

    // 11. Assignment Evaluation
    {
      id: 'assignment_evaluation',
      name: 'Assignment Evaluation',
      category: 'Assignments & Tests',
      icon: <FileCheck2 className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Batches Only',
      actions: [
        {
          id: 'assignment_eval_view',
          action: 'View',
          label: 'View Student Submissions',
          description: 'Inspect student GitHub repos, zip attachments, and project source files.',
        },
        {
          id: 'assignment_eval_edit',
          action: 'Edit',
          label: 'Grade & Post Feedback',
          description: 'Award marks, record qualitative instructor feedback, and mark status as graded.',
        },
      ],
    },

    // 12. Online Tests
    {
      id: 'online_tests',
      name: 'Online Tests',
      category: 'Assignments & Tests',
      icon: <Award className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Courses & Batches Only',
      actions: [
        {
          id: 'tests_view',
          action: 'View',
          label: 'Review Online Tests',
          description: 'Inspect question bank, test durations, passing scores, and active schedules.',
        },
        {
          id: 'tests_create',
          action: 'Create',
          label: 'Author New Online Test',
          description: 'Create assessments with MCQ, multiple-select, coding, and short-answer prompts.',
        },
        {
          id: 'tests_edit',
          action: 'Edit',
          label: 'Edit Assessment Questions',
          description: 'Update question prompts, answer keys, time limits, and passing criteria.',
        },
        {
          id: 'tests_delete',
          action: 'Delete',
          label: 'Delete Assessment Exam',
          description: 'Remove draft or obsolete test papers.',
        },
      ],
    },

    // 13. Test Evaluation
    {
      id: 'test_evaluation',
      name: 'Test Evaluation',
      category: 'Assignments & Tests',
      icon: <FileCheck2 className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Batches Only',
      actions: [
        {
          id: 'test_eval_view',
          action: 'View',
          label: 'View Student Test Attempts',
          description: 'Inspect student submitted scorecards, automated scores, and answer papers.',
        },
        {
          id: 'test_eval_edit',
          action: 'Edit',
          label: 'Score Subjective Questions',
          description: 'Manually evaluate code submissions, short-answers, and update final attempt score.',
        },
      ],
    },

    // 14. Student Performance
    {
      id: 'student_performance',
      name: 'Student Performance',
      category: 'Assignments & Tests',
      icon: <BarChart3 className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Batches Only',
      actions: [
        {
          id: 'performance_view',
          action: 'View',
          label: 'View Performance Analytics',
          description: 'Review batch grade curves, score distributions, and individual student progress.',
        },
      ],
    },

    // 15. Announcements
    {
      id: 'announcements',
      name: 'Announcements',
      category: 'Student Engagement',
      icon: <Megaphone className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Batches Only',
      actions: [
        {
          id: 'announcements_view',
          action: 'View',
          label: 'View Batch Notices',
          description: 'Browse announcements published to assigned student cohorts.',
        },
        {
          id: 'announcements_create',
          action: 'Create',
          label: 'Publish Cohort Notice',
          description: 'Broadcast urgent announcements, holiday notices, and schedule updates.',
        },
        {
          id: 'announcements_delete',
          action: 'Delete',
          label: 'Delete Batch Notice',
          description: 'Remove expired or outdated announcements.',
        },
      ],
    },

    // 16. Doubt Management
    {
      id: 'doubt_management',
      name: 'Doubt Management',
      category: 'Student Engagement',
      icon: <HelpCircle className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Batches Only',
      actions: [
        {
          id: 'doubts_view',
          action: 'View',
          label: 'View Student Doubts',
          description: 'Access student technical questions and conceptual queries in assigned cohorts.',
        },
        {
          id: 'doubts_create',
          action: 'Create',
          label: 'Post Doubt Resolution Answer',
          description: 'Provide written explanations, code snippets, and diagrams to answer doubts.',
        },
        {
          id: 'doubts_edit',
          action: 'Edit',
          label: 'Update Resolution & Close',
          description: 'Edit answers and mark doubt threads as solved or closed.',
        },
      ],
    },

    // 17. Class Timetable
    {
      id: 'class_timetable',
      name: 'Class Timetable',
      category: 'Attendance & Timetable',
      icon: <Calendar className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Batches Only',
      actions: [
        {
          id: 'timetable_view',
          action: 'View',
          label: 'View Weekly Teaching Timetable',
          description: 'View daily teaching hours, allocated batch slots, and upcoming sessions.',
        },
        {
          id: 'timetable_edit',
          action: 'Edit',
          label: 'Adjust Lecture Slots',
          description: 'Adjust or propose adjustments to specific class lecture timing slots.',
        },
      ],
    },

    // 18. Mock Interviews
    {
      id: 'mock_interviews',
      name: 'Mock Interviews',
      category: 'Student Engagement',
      icon: <Users className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Candidate Interviews Only',
      actions: [
        {
          id: 'mock_interviews_view',
          action: 'View',
          label: 'View Mock Interview Schedule',
          description: 'View assigned candidate interviews, scheduled date/time, and student profiles.',
        },
        {
          id: 'mock_interviews_manage',
          action: 'Manage',
          label: 'Conduct Mock Interview Call',
          description: 'Join meeting room and conduct 1-on-1 technical or system design interviews.',
        },
        {
          id: 'mock_interviews_edit',
          action: 'Edit',
          label: 'Submit Assessment Feedback',
          description: 'Submit technical scoring (out of 10), strengths, improvement areas, and readiness verdict.',
        },
      ],
    },

    // 19. Reports
    {
      id: 'reports',
      name: 'Reports',
      category: 'System & Reports',
      icon: <BarChart3 className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Assigned Batches Only',
      actions: [
        {
          id: 'reports_view',
          action: 'View',
          label: 'View Academic Batch Reports',
          description: 'Analyze batch-wise attendance, test averages, and assignment completion rates.',
        },
        {
          id: 'reports_create',
          action: 'Create',
          label: 'Generate & Export Reports',
          description: 'Generate and download CSV summaries for assigned student cohorts.',
        },
      ],
    },

    // 20. Notifications
    {
      id: 'notifications',
      name: 'Notifications',
      category: 'System & Reports',
      icon: <Bell className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Personal Faculty Portal',
      actions: [
        {
          id: 'notifications_view',
          action: 'View',
          label: 'Receive System & Admin Alerts',
          description: 'View administrative announcements, schedule revisions, and system notifications.',
        },
      ],
    },

    // 21. Examination Retake Authorization
    {
      id: 'retake_authorization',
      name: 'Examination Retake Authorization',
      category: 'Assignments & Tests',
      icon: <RotateCcw className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Eligible Students in Assigned Batches (BR-012)',
      actions: [
        {
          id: 'retakes_view',
          action: 'View',
          label: 'View Student Retake Requests',
          description: 'Review student applications for exam retakes due to technical or medical reasons.',
        },
        {
          id: 'retakes_approve',
          action: 'Approve',
          label: 'Authorize Retake with Reason (BR-012)',
          description: 'Approve or reject retake requests with mandatory recorded justification.',
        },
      ],
    },

    // 22. Change Password
    {
      id: 'change_password',
      name: 'Change Password',
      category: 'Profile & Courses',
      icon: <Lock className="h-4 w-4 text-indigo-600" />,
      allocationScope: 'Personal Account Security',
      actions: [
        {
          id: 'password_edit',
          action: 'Edit',
          label: 'Update Account Password',
          description: 'Change login credentials and manage multi-factor authentication security.',
        },
      ],
    },
  ];

  // Flat list of all 48 action IDs
  const allActionIds = useMemo(() => {
    const ids: string[] = [];
    teacherModules.forEach((m) => {
      m.actions.forEach((a) => ids.push(a.id));
    });
    return ids;
  }, []);

  const loadPermissions = async () => {
    const res = await adminService.getRolesPermissions();
    if (res.success && res.data) {
      const stored = res.data['teacher'] || [];
      // Filter to recognized actions or merge defaults
      const validPermissions = stored.filter((p) => allActionIds.includes(p));
      // If none or legacy, seed with default full operational set
      if (validPermissions.length === 0) {
        setTeacherPermissions(allActionIds);
      } else {
        setTeacherPermissions(validPermissions);
      }
    }
  };

  useEffect(() => {
    loadPermissions();
  }, [allActionIds]);

  const handleToggleAction = (actionId: string) => {
    setTeacherPermissions((prev) =>
      prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]
    );
  };

  const handleToggleModuleAll = (moduleItem: TeacherModuleGroup) => {
    const moduleActionIds = moduleItem.actions.map((a) => a.id);
    const allEnabled = moduleActionIds.every((id) => teacherPermissions.includes(id));

    if (allEnabled) {
      // Disable all in this module
      setTeacherPermissions((prev) => prev.filter((id) => !moduleActionIds.includes(id)));
    } else {
      // Enable all in this module
      setTeacherPermissions((prev) => Array.from(new Set([...prev, ...moduleActionIds])));
    }
  };

  const handleEnableAll = () => {
    setTeacherPermissions(allActionIds);
    showToast({
      type: 'info',
      title: 'All Permissions Selected',
      message: 'All 48 teacher module actions enabled. Click "Save Permissions" to persist.',
    });
  };

  const handleResetDefaults = () => {
    // Default excludes delete actions
    const defaultSafe = allActionIds.filter((id) => !id.includes('_delete'));
    setTeacherPermissions(defaultSafe);
    showToast({
      type: 'info',
      title: 'Standard Defaults Selected',
      message: 'Standard faculty permissions restored (read, create, edit, evaluate, approve).',
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    const res = await adminService.updateRolePermissions(
      { id: user.id, name: user.name },
      'teacher',
      teacherPermissions
    );
    setIsSaving(false);

    if (res.success) {
      showToast({
        type: 'success',
        title: 'Teacher Permissions Saved',
        message: `Successfully updated Teaching Faculty permissions (${teacherPermissions.length} active). Unalterable audit log recorded. (ADM-016)`,
      });
    } else {
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: res.error || 'Unable to update teacher permissions.',
      });
    }
  };

  // Filter modules based on search and category
  const filteredModules = useMemo(() => {
    return teacherModules.filter((m) => {
      if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(query);
        const matchesScope = m.allocationScope.toLowerCase().includes(query);
        const matchesAction = m.actions.some(
          (a) => a.label.toLowerCase().includes(query) || a.description.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesScope && !matchesAction) return false;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const categories = [
    'all',
    'Profile & Courses',
    'Attendance & Timetable',
    'Learning Content',
    'Assignments & Tests',
    'Student Engagement',
    'System & Reports',
  ];

  const getActionBadgeVariant = (action: PermissionAction) => {
    switch (action) {
      case 'View':
        return 'info';
      case 'Create':
        return 'success';
      case 'Edit':
        return 'warning';
      case 'Delete':
        return 'danger';
      case 'Approve':
        return 'purple';
      case 'Manage':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Teaching Faculty Role & Permissions (ADM-016)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure granular module permissions and action authorities for Teaching Faculty. Permissions operate strictly within Admin-controlled course and batch allocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="purple" size="md">
            {teacherPermissions.length} of {allActionIds.length} Permissions Active
          </Badge>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Permissions
          </Button>
        </div>
      </div>

      {/* Role Selection Area – TEACHING FACULTY ONLY */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-xs flex items-center gap-2 cursor-default"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Teaching Faculty</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-normal bg-white/20 text-white">
              Target Scope
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnableAll}
            className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
          >
            Enable All ({allActionIds.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            className="text-xs text-slate-600 hover:bg-slate-100"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Standard Defaults
          </Button>
        </div>
      </div>

      {/* Allocation-Bounded Authorization Notice (Requirement 5) */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-indigo-50/40 border border-amber-200/80 text-xs text-slate-700 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0" />
            <h4 className="font-bold text-slate-900 text-xs">
              Teacher Allocation & Authorization Principle
            </h4>
          </div>
          <Link
            to="/admin/teachers/allocation"
            className="text-indigo-600 hover:underline font-semibold flex items-center gap-1 text-[11px] shrink-0"
          >
            Manage Course & Batch Allocations <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          Having a module permission establishes <strong>functional capability</strong>, but <strong>does not grant unrestricted institute-wide access</strong>. All teacher actions are dynamically restricted to their allocated courses and batches:
        </p>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px] text-slate-700 pl-4 list-disc">
          <li><strong>Attendance Management:</strong> Teachers can mark attendance only for assigned batches.</li>
          <li><strong>Assignment Management:</strong> Teachers can create assignments only for authorized courses & batches.</li>
          <li><strong>Student List:</strong> Teachers can view only students enrolled in their assigned cohorts.</li>
          <li><strong>Reports:</strong> Teachers can access only authorized batch analytics and attendance exports.</li>
          <li className="md:col-span-2"><strong>Exam Retake Authorization:</strong> Teachers can approve or reject retakes only for students in their assigned batches (BR-012).</li>
        </ul>
      </div>

      {/* Search and Category Filter Toolbar */}
      <Card className="p-4 bg-white border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by module name or action (e.g. Attendance, Retake, Assignment, Delete)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 text-slate-800 font-medium"
            />
          </div>

          <span className="text-xs font-mono text-slate-500">
            Displaying {filteredModules.length} of {teacherModules.length} modules
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Categories:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Modules (22)' : cat}
            </button>
          ))}
        </div>
      </Card>

      {/* 22 Modules Permissions Grid */}
      <div className="space-y-4">
        {filteredModules.map((mod) => {
          const modActionIds = mod.actions.map((a) => a.id);
          const enabledCount = modActionIds.filter((id) => teacherPermissions.includes(id)).length;
          const allEnabled = enabledCount === modActionIds.length;

          return (
            <Card key={mod.id} className="p-5 bg-white border border-slate-200 space-y-4 shadow-2xs">
              {/* Module Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    {mod.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{mod.name}</h3>
                      <Badge variant="neutral" size="sm">{mod.category}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Scope: <span className="font-semibold text-slate-700">{mod.allocationScope}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500">
                    {enabledCount} of {mod.actions.length} active
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleModuleAll(mod)}
                    className="text-[11px] text-indigo-600 hover:bg-indigo-50"
                  >
                    {allEnabled ? 'Disable All' : 'Enable All'}
                  </Button>
                </div>
              </div>

              {/* Action Rows */}
              <div className="divide-y divide-slate-100">
                {mod.actions.map((actionItem) => {
                  const isEnabled = teacherPermissions.includes(actionItem.id);
                  return (
                    <div
                      key={actionItem.id}
                      className="py-3 flex items-start justify-between gap-4 hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant={getActionBadgeVariant(actionItem.action)} size="sm">
                            {actionItem.action.toUpperCase()}
                          </Badge>
                          <span className="text-xs font-bold text-slate-800">{actionItem.label}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed pl-0.5">
                          {actionItem.description}
                        </p>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => handleToggleAction(actionItem.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer Sticky Save Bar */}
      <div className="sticky bottom-4 p-4 rounded-xl bg-slate-900 text-white shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-400" />
          <div>
            <span className="text-xs font-bold block">
              Teaching Faculty Configuration ({teacherPermissions.length} Active Authorizations)
            </span>
            <span className="text-[11px] text-slate-400">
              Changes will immediately update active faculty portal capabilities.
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={<Save className="h-4 w-4" />}
        >
          Save Permissions
        </Button>
      </div>
    </div>
  );
};
