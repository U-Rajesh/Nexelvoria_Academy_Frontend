import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  CheckSquare,
  History,
  FolderOpen,
  Video,
  FileText,
  FileCheck2,
  Award,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  Calendar,
  UserCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  KeyRound,
  RotateCcw,
  PlayCircle,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

export const TeacherLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Assigned Courses', path: '/teacher/courses', icon: <BookOpen className="h-4 w-4" /> },
    { label: 'My Batches', path: '/teacher/batches', icon: <Users className="h-4 w-4" /> },
    { label: 'Student Roster', path: '/teacher/students', icon: <Users className="h-4 w-4" /> },
    { label: 'Mark Attendance', path: '/teacher/attendance', icon: <CheckSquare className="h-4 w-4" /> },
    { label: 'Attendance History', path: '/teacher/attendance-history', icon: <History className="h-4 w-4" /> },
    { label: 'Study Materials', path: '/teacher/materials', icon: <FolderOpen className="h-4 w-4" /> },
    { label: 'Recorded Classes', path: '/teacher/recordings', icon: <PlayCircle className="h-4 w-4" /> },
    { label: 'Live Classes & Links', path: '/teacher/live-classes', icon: <Video className="h-4 w-4" /> },
    { label: 'Assignments', path: '/teacher/assignments', icon: <FileText className="h-4 w-4" /> },
    { label: 'Evaluate Submissions', path: '/teacher/assignments/evaluations', icon: <FileCheck2 className="h-4 w-4" /> },
    { label: 'Online Tests', path: '/teacher/tests', icon: <Award className="h-4 w-4" /> },
    { label: 'Evaluate Tests', path: '/teacher/tests/evaluations', icon: <FileCheck2 className="h-4 w-4" /> },
    { label: 'Authorize Retakes', path: '/teacher/tests/retakes', icon: <RotateCcw className="h-4 w-4" /> },
    { label: 'Student Performance', path: '/teacher/performance', icon: <TrendingUp className="h-4 w-4" /> },
    { label: 'Announcements', path: '/teacher/announcements', icon: <MessageSquare className="h-4 w-4" /> },
    { label: 'Student Doubts', path: '/teacher/doubts', icon: <HelpCircle className="h-4 w-4" /> },
    { label: 'Class Timetable', path: '/teacher/timetable', icon: <Calendar className="h-4 w-4" /> },
    { label: 'Mock Interviews', path: '/teacher/mock-interviews', icon: <UserCheck className="h-4 w-4" /> },
    { label: 'Batch Reports', path: '/teacher/reports', icon: <BarChart3 className="h-4 w-4" /> },
    { label: 'Notifications', path: '/teacher/notifications', icon: <Bell className="h-4 w-4" /> },
    { label: 'Teacher Profile', path: '/teacher/profile', icon: <User className="h-4 w-4" /> },
    { label: 'Change Password', path: '/teacher/change-password', icon: <KeyRound className="h-4 w-4" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 antialiased">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Header */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight block">
                Nexelvoria
              </span>
              <span className="text-[10px] text-teal-400 font-medium tracking-wide block uppercase">
                Faculty Portal
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-3">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
            alt="User avatar"
            className="h-10 w-10 rounded-full object-cover border border-slate-600"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Faculty Member'}</p>
            <p className="text-[10px] text-teal-300 font-medium truncate">Lead Instructor</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="Open sidebar navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-base font-semibold text-slate-900 hidden sm:block">
              Teacher & Faculty Console
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="purple" size="sm">
              Batch: Java Full Stack - Oct 2026
            </Badge>

            <Link
              to="/teacher/notifications"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-600 ring-2 ring-white"></span>
            </Link>

            <div className="h-6 w-px bg-slate-200" />

            <Link to="/teacher/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
                alt="Teacher"
                className="h-8 w-8 rounded-full object-cover border border-slate-200"
              />
              <span className="text-xs font-medium text-slate-700 hidden md:inline-block">
                {user?.name}
              </span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

