import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Calendar,
  Video,
  CheckSquare,
  FileText,
  Award,
  Briefcase,
  HelpCircle,
  LogOut,
  Menu,
  X,
  CreditCard,
  UserCheck,
  TrendingUp,
  FileCheck2,
  Bell,
  KeyRound,
  Users,
  Layers,
  FolderGit2,
  PlayCircle,
  Receipt,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const StudentLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'My Profile', path: '/student/profile', icon: <User className="h-4 w-4" /> },
    { label: 'My Courses', path: '/student/courses', icon: <BookOpen className="h-4 w-4" /> },
    { label: 'Course Syllabus', path: '/student/syllabus', icon: <Layers className="h-4 w-4" /> },
    { label: 'Learning Materials', path: '/student/materials', icon: <FolderGit2 className="h-4 w-4" /> },
    { label: 'Recorded Classes', path: '/student/recordings', icon: <PlayCircle className="h-4 w-4" /> },
    { label: 'Live Classes', path: '/student/live-classes', icon: <Video className="h-4 w-4" /> },
    { label: 'Batches & Timetable', path: '/student/batches', icon: <Users className="h-4 w-4" /> },
    { label: 'Attendance', path: '/student/attendance', icon: <CheckSquare className="h-4 w-4" /> },
    { label: 'Assignments', path: '/student/assignments', icon: <FileText className="h-4 w-4" /> },
    { label: 'Online Tests', path: '/student/tests', icon: <FileCheck2 className="h-4 w-4" /> },
    { label: 'Performance', path: '/student/performance', icon: <TrendingUp className="h-4 w-4" /> },
    { label: 'Course Fees', path: '/student/fees', icon: <CreditCard className="h-4 w-4" /> },
    { label: 'Payment History', path: '/student/payment-history', icon: <Receipt className="h-4 w-4" /> },
    { label: 'Certificates', path: '/student/certificates', icon: <Award className="h-4 w-4" /> },
    { label: 'Placement Portal', path: '/student/placements', icon: <Briefcase className="h-4 w-4" /> },
    { label: 'Mock Interviews', path: '/student/mock-interviews', icon: <UserCheck className="h-4 w-4" /> },
    { label: 'Notifications', path: '/student/notifications', icon: <Bell className="h-4 w-4" /> },
    { label: 'Support Tickets', path: '/student/support', icon: <HelpCircle className="h-4 w-4" /> },
    { label: 'Change Password', path: '/student/change-password', icon: <KeyRound className="h-4 w-4" /> },
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
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight block">
                Nexelvoria
              </span>
              <span className="text-[10px] text-indigo-400 font-medium tracking-wide block uppercase">
                Student Portal
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-3">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            alt="User avatar"
            className="h-10 w-10 rounded-full object-cover border border-slate-600"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Student'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="success" size="sm" dot>Active</Badge>
            </div>
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
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
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
              Student Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student/notifications"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white"></span>
            </Link>

            <div className="h-6 w-px bg-slate-200" />

            <Link to="/student/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt="User"
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

