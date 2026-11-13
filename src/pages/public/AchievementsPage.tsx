import React, { useState } from 'react';
import { Trophy, Award } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { PageLabel } from '../../components/common/PageLabel';
import { Card } from '../../components/common/Card';
import { SEO } from '../../components/common/SEO';
import { cmsService, type AchievementItem } from '../../services/cmsService';

export const AchievementsPage: React.FC = () => {
  const [achievements] = useState<AchievementItem[]>(() => cmsService.getAchievements());

  const institutionalAwards = [
    {
      year: '2026',
      title: 'Top 10 Emerging Tech Finishing Schools in India',
      organization: 'National Higher Education & Tech Conclave',
      desc: 'Recognized for achieving highest graduate placement ratio in enterprise Java and Kubernetes cohorts.',
    },
    {
      year: '2025',
      title: 'Excellence in Cloud Native Curriculum Design',
      organization: 'Cloud Architecture Consortium',
      desc: 'Commended for hands-on distributed microservices and continuous integration testing pedagogy.',
    },
    {
      year: '2024',
      title: 'ISO 9001:2015 Educational Quality Certification',
      organization: 'International Standards Organization (ISO)',
      desc: 'Certified for rigorous academic record keeping, attendance tracking, and verified certificate credentials.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      <SEO
        title="Student Achievements & Institutional Awards"
        description="Explore national hackathon championships, record placement packages, and institutional milestones achieved by Nexelvoria Academy students."
        keywords={['Student Achievements', 'Hackathon Winners', 'Tech Awards', 'Placement Records', 'Nexelvoria']}
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <PageLabel>Student & Institutional Milestones</PageLabel>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          A Proven Track Record of Engineering Excellence
        </h1>
        <p className="text-slate-500 text-sm sm:text-base">
          Celebrating the national hackathon victories, placement breakthroughs, and open-source contributions of our students.
        </p>
      </div>

      {/* Student Achievements Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span>Student Hackathons & Placement Breakthroughs</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((ach) => (
            <Card key={ach.id} className="p-6 space-y-4 hover:shadow-xl transition-all duration-200 bg-white border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {ach.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">{ach.date}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {ach.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{ach.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{ach.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Recipient:</span>
                <span className="font-bold text-slate-800">{ach.studentName}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Institutional Awards */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-600" />
          <span>Institutional Recognition & Accreditations</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {institutionalAwards.map((m, idx) => (
            <Card key={idx} className="p-8 space-y-4 hover:shadow-lg transition-shadow bg-white">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold text-indigo-600 font-mono">{m.year}</span>
                <Trophy className="h-7 w-7 text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">{m.title}</h3>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{m.organization}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{m.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
