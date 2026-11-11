import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  UserCheck,
  Users,
  UserPlus,
  BookOpen,
  Calendar,
  Layers,
  CreditCard,
  Receipt,
  Percent,
  CheckSquare,
  FileText,
  FileCheck2,
  Award,
  Briefcase,
  HelpCircle,
  BarChart3,
  Globe,
  Bell,
  Sliders,
  History,
  LogOut,
  Menu,
  X,
  BadgeAlert,
  ShieldCheck,
  BookmarkCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { adminService } from '../services/adminService';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(1);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    adminService.getDashboardStats().then((res) => {
      if (res.success) {
        setPendingApprovalsCount(res.data.pendingApprovals);
      }
    });
  }, [location.pathname]);

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    {
      label: 'Student Approvals',
      path: '/admin/students/approvals',
      icon: <BadgeAlert className="h-4 w-4 text-amber-400" />,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Pending` : undefined,
    },
    { label: 'All Students', path: '/admin/students', icon: <Users className="h-4 w-4" /> },
    { label: 'Add Student', path: '/admin/students/add', icon: <UserPlus className="h-4 w-4" /> },
    { label: 'Student Enrollment', path: '/admin/enrollments', icon: <BookmarkCheck className="h-4 w-4" /> },
    { label: 'Course Management', path: '/admin/courses', icon: <BookOpen className="h-4 w-4" /> },
    { label: 'Batch Management', path: '/admin/batches', icon: <Calendar className="h-4 w-4" /> },
    { label: 'Teacher Directory', path: '/admin/teachers', icon: <UserCheck className="h-4 w-4" /> },
    { label: 'Teacher Allocation', path: '/admin/teachers/allocation', icon: <Layers className="h-4 w-4" /> },
    { label: 'Payment Ledger', path: '/admin/payments', icon: <CreditCard className="h-4 w-4" /> },
    { label: 'Manual Payment Entry', path: '/admin/payments/manual-entry', icon: <Receipt className="h-4 w-4" /> },
    { label: 'Discounts & Coupons', path: '/admin/discounts', icon: <Percent className="h-4 w-4" /> },
    { label: 'Attendance Oversight', path: '/admin/attendance', icon: <CheckSquare className="h-4 w-4" /> },
    { label: 'Assignments Oversight', path: '/admin/assignments', icon: <FileText className="h-4 w-4" /> },
    { label: 'Tests & Retake Override', path: '/admin/tests', icon: <FileCheck2 className="h-4 w-4" /> },
    { label: 'Certificates & Revoke', path: '/admin/certificates', icon: <Award className="h-4 w-4" /> },
    { label: 'Placement Partners', path: '/admin/placements', icon: <Briefcase className="h-4 w-4" /> },
    { label: 'Mock Interviews', path: '/admin/mock-interviews', icon: <UserCheck className="h-4 w-4" /> },
    { label: 'Broadcast Alerts', path: '/admin/notifications', icon: <Bell className="h-4 w-4" /> },
    { label: 'Website CMS', path: '/admin/website-cms', icon: <Globe className="h-4 w-4" /> },
    { label: 'Reports & Analytics', path: '/admin/reports', icon: <BarChart3 className="h-4 w-4" /> },
    { label: 'Support Tickets', path: '/admin/support', icon: <HelpCircle className="h-4 w-4" /> },
    { label: 'Roles & Permissions', path: '/admin/roles-permissions', icon: <ShieldCheck className="h-4 w-4" /> },
    { label: 'Activity Logs', path: '/admin/activity-logs', icon: <History className="h-4 w-4" /> },
    { label: 'Institute Settings', path: '/admin/settings', icon: <Sliders className="h-4 w-4" /> },
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
                Admin Console
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
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'}
            alt="Admin"
            className="h-10 w-10 rounded-full object-cover border border-slate-600"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-indigo-300 font-medium truncate">Operations Manager</p>
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
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
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
              Institute Administration
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="info" size="sm">
              Session: 2026-27
            </Badge>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'}
                alt="Admin"
                className="h-8 w-8 rounded-full object-cover border border-slate-200"
              />
              <span className="text-xs font-medium text-slate-700 hidden md:inline-block">
                {user?.name}
              </span>
            </div>
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
