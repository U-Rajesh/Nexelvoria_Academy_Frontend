import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useNotification, type ToastType } from '../../context/NotificationContext';
import { cn } from '../../utils/cn';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-rose-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    info: <Info className="h-5 w-5 text-sky-500" />,
  };

  const borders: Record<ToastType, string> = {
    success: 'border-emerald-200 bg-white shadow-emerald-500/5',
    error: 'border-rose-200 bg-white shadow-rose-500/5',
    warning: 'border-amber-200 bg-white shadow-amber-500/5',
    info: 'border-sky-200 bg-white shadow-sky-500/5',
  };

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto flex items-start p-4 rounded-xl border shadow-lg transition-all transform duration-200 ease-out animate-slide-in',
            borders[toast.type]
          )}
        >
          <div className="shrink-0 mr-3 mt-0.5">{icons[toast.type]}</div>
          <div className="flex-1 mr-2">
            {toast.title && <h4 className="text-sm font-semibold text-slate-900">{toast.title}</h4>}
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

