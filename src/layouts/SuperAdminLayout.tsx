import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  UserCheck,
  KeyRound,
  DollarSign,
  FileCheck2,
  BarChart3,
  History,
  Sliders,
  Settings,
  LogOut,
  Menu,
  X,
  AlertCircle,
  Building,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

export const SuperAdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard Overview', path: '/super-admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Admin Accounts', path: '/super-admin/admins', icon: <UserCheck className="h-4 w-4" /> },
    { label: 'System Configuration', path: '/super-admin/system-config', icon: <Sliders className="h-4 w-4" /> },
    {
      label: 'Refund Approvals',
      path: '/super-admin/refund-approvals',
      icon: <DollarSign className="h-4 w-4 text-rose-400" />,
      badge: '1 Pending',
    },
    {
      label: 'Financial Overrides',
      path: '/super-admin/financial-overrides',
      icon: <FileCheck2 className="h-4 w-4 text-amber-400" />,
      badge: '2 Pending',
    },
    { label: 'All Reports & Analytics', path: '/super-admin/reports', icon: <BarChart3 className="h-4 w-4" /> },
    { label: 'Roles & Permissions', path: '/super-admin/roles-permissions', icon: <KeyRound className="h-4 w-4" /> },
    { label: 'System Audit Logs', path: '/super-admin/audit-logs', icon: <History className="h-4 w-4" /> },
    { label: 'Website CMS', path: '/super-admin/website-cms', icon: <Globe className="h-4 w-4" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-800 antialiased">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Header */}
        <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight block">
                Nexelvoria
              </span>
              <span className="text-[10px] text-rose-400 font-semibold tracking-wide block uppercase">
                Owner Console
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
        <div className="p-4 mx-3 my-3 bg-slate-900 rounded-xl border border-rose-900/30 flex items-center gap-3">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'}
            alt="Super Admin"
            className="h-10 w-10 rounded-full object-cover border border-rose-500/50"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Primary Owner'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                SUPER ADMIN
              </span>
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
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-rose-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="Open sidebar navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900 hidden sm:block">
                Super Admin Governance Portal
              </h2>
              <Badge variant="danger" size="sm">
                Full Authorization (Owner)
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono hidden md:inline-block">
              Host: AWS ap-south-1
            </span>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'}
                alt="Owner"
                className="h-8 w-8 rounded-full object-cover border border-rose-300"
              />
              <span className="text-xs font-semibold text-slate-800 hidden md:inline-block">
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

