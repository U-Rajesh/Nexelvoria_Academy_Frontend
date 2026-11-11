import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Shield, BookOpen, GraduationCap, Globe, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import type { UserRole } from '../../types';

export const DevRoleSwitcher: React.FC = () => {
  const { role, switchRole } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const roles: { role: UserRole; label: string; icon: React.ReactNode; path: string; desc: string }[] = [
    {
      role: 'public',
      label: 'Public Visitor',
      icon: <Globe className="h-4 w-4" />,
      path: '/',
      desc: 'Browse courses, institute info & certificate verification',
    },
    {
      role: 'student',
      label: 'Student (Rohan)',
      icon: <GraduationCap className="h-4 w-4" />,
      path: '/student/dashboard',
      desc: 'Active student, enrolled in Full Stack Java, LMS access',
    },
    {
      role: 'teacher',
      label: 'Teacher (Dr. Vikram)',
      icon: <BookOpen className="h-4 w-4" />,
      path: '/teacher/dashboard',
      desc: 'Assigned batches, attendance marking, grading',
    },
    {
      role: 'admin',
      label: 'Admin (Priya Nair)',
      icon: <UserCheck className="h-4 w-4" />,
      path: '/admin/dashboard',
      desc: 'Student approvals, course/batch ops, manual payment',
    },
    {
      role: 'super_admin',
      label: 'Super Admin (Owner)',
      icon: <Shield className="h-4 w-4" />,
      path: '/super-admin/dashboard',
      desc: 'Owner access, refund approvals, audit logs & system config',
    },
  ];

  const handleSelectRole = (targetRole: UserRole, targetPath: string) => {
    switchRole(targetRole);
    setIsOpen(false);
    showToast({
      type: 'info',
      title: 'Persona Switched',
      message: `Active persona changed to: ${targetRole.replace('_', ' ').toUpperCase()}`,
    });
    navigate(targetPath);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none">
      {/* Popover Menu */}
      {isOpen && (
        <div className="mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all animate-fade-in">
          <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Persona Switcher
              </p>
              <p className="text-xs text-slate-300">Quickly test all 5 role interfaces</p>
            </div>
            <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 rounded-md text-[10px] font-mono">
              DEMO
            </span>
          </div>

          <div className="p-2 divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {roles.map((item) => {
              const isCurrent = role === item.role;
              return (
                <button
                  key={item.role}
                  onClick={() => handleSelectRole(item.role, item.path)}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-50/80 border border-indigo-200'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isCurrent
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-xs font-semibold ${
                          isCurrent ? 'text-indigo-900' : 'text-slate-800'
                        }`}
                      >
                        {item.label}
                      </p>
                      {isCurrent && (
                        <span className="text-[10px] font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.2 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Toggle Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-full shadow-lg border border-slate-700/60 transition-all cursor-pointer hover:scale-102"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-xs font-semibold capitalize tracking-wide">
          Role: <span className="text-indigo-300 font-bold">{role.replace('_', ' ')}</span>
        </span>
        <ChevronUp
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
    </div>
  );
};

