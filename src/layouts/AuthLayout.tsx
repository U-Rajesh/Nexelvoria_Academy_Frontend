import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Award, Users, CheckCircle2 } from 'lucide-react';
import { APP_CONFIG } from '../constants/appConfig';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 antialiased">
      {/* Left Marketing Banner (Desktop) */}
      <div className="lg:w-1/2 bg-slate-900 text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight block">
                Nexelvoria <span className="text-indigo-400">Academy</span>
              </span>
              <span className="text-xs text-slate-400 tracking-wider uppercase block font-medium">
                {APP_CONFIG.tagline}
              </span>
            </div>
          </Link>
        </div>

        {/* Value Proposition */}
        <div className="relative z-10 my-10 lg:my-0 space-y-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug">
            Transform your engineering career with rigorous industry training.
          </h2>
          <div className="space-y-4 text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Comprehensive LMS:</strong> Interactive chapters, video lessons, code repositories, and doubt resolution.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Industry Placement Assistance:</strong> Direct campus drives and placement guarantee programs with top tech firms.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
              <span>
                <strong>Verifiable Certifications:</strong> Tamper-proof digital credentials featuring instant QR code verification.
              </span>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <p className="text-xs italic text-slate-300 leading-relaxed">
              "The structured curriculum and continuous mock interviews at Nexelvoria helped me crack a 9.2 LPA Software Engineering offer at Accio Technologies."
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                RS
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Rohan Sharma</p>
                <p className="text-[11px] text-indigo-300">Batch 2026 • Java Cloud Architect</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between">
          <p>© {new Date().getFullYear()} Nexelvoria Academy.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-slate-400">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="hover:text-slate-400">Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* Right Form Box */}
      <div className="lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

