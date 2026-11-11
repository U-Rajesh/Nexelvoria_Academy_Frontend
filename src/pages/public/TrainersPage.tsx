import React, { useState } from 'react';
import { Star, Award, ExternalLink, Users, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Linkedin } from '../../components/common/SocialIcons';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/feedback/Modal';
import { SEO } from '../../components/common/SEO';
import { cmsService, type TrainerProfile } from '../../services/cmsService';

export const TrainersPage: React.FC = () => {
  const [trainers] = useState<TrainerProfile[]>(() => cmsService.getTrainers());
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerProfile | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      <SEO
        title="Distinguished Industry Mentors & Faculty"
        description="Learn from top technology leads and former architects from Oracle, Microsoft, AWS, and tier-1 tech consulting enterprises."
        keywords={['Software Trainers', 'Tech Mentors', 'Java Instructors', 'DevOps Faculty', 'Nexelvoria Trainers']}
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="purple" size="md">Our Faculty & Mentorship Lead</Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Learn Directly from Practicing Architects & Senior Engineers
        </h1>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
          At Nexelvoria Academy, our faculty members are not academic lecturers—they are seasoned engineering leaders who have built high-scale systems at Fortune 500 tech companies.
        </p>
      </div>

      {/* Faculty Quality Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <Card className="p-6 space-y-2 bg-white">
          <Award className="h-8 w-8 text-indigo-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">10+ Years Avg. Industry Experience</h3>
          <p className="text-xs text-slate-500">Every mentor has architected real-world enterprise production codebases.</p>
        </Card>
        <Card className="p-6 space-y-2 bg-white">
          <Users className="h-8 w-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">1:1 Architectural Code Reviews</h3>
          <p className="text-xs text-slate-500">Mentors personally inspect student GitHub PRs and suggest design refactorings.</p>
        </Card>
        <Card className="p-6 space-y-2 bg-white">
          <ShieldCheck className="h-8 w-8 text-sky-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">4.9+ Out of 5.0 Student Rating</h3>
          <p className="text-xs text-slate-500">Consistently rated as top tier for clarity, patience, and rigorous evaluations.</p>
        </Card>
      </div>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {trainers.map((tr) => (
          <Card key={tr.id} className="p-6 flex flex-col justify-between space-y-6 hover:shadow-xl transition-all duration-200 bg-white">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={tr.avatarUrl}
                  alt={tr.name}
                  className="h-20 w-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-md shrink-0"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{tr.name}</h3>
                  <p className="text-xs text-indigo-600 font-semibold">{tr.role}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tr.qualifications}</p>
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span>{tr.rating.toFixed(2)}</span>
                    <span className="text-slate-400 font-normal ml-1">({tr.experienceYears}+ years exp)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Specialization</span>
                <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {tr.specialization}
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {tr.bio}
              </p>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Former Organizations
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tr.formerCompanies.map((comp) => (
                    <span key={comp} className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-medium">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <a
                href={tr.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Linkedin size={14} />
                <span>LinkedIn</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <Button variant="outline" size="sm" onClick={() => setSelectedTrainer(tr)}>
                View Full Profile
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Trainer Profile Details Modal */}
      <Modal
        isOpen={!!selectedTrainer}
        onClose={() => setSelectedTrainer(null)}
        title={selectedTrainer ? `${selectedTrainer.name} – Detailed Profile` : 'Mentor Profile'}
        description={selectedTrainer?.role || 'Senior Technical Mentor'}
      >
        {selectedTrainer && (
          <div className="space-y-5 text-xs">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <img
                src={selectedTrainer.avatarUrl}
                alt={selectedTrainer.name}
                className="h-16 w-16 rounded-xl object-cover border border-slate-200 shadow-xs"
              />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">{selectedTrainer.name}</h4>
                <p className="text-indigo-600 font-medium">{selectedTrainer.role}</p>
                <p className="text-slate-500">{selectedTrainer.qualifications}</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Comprehensive Bio</span>
              <p className="text-slate-600 leading-relaxed text-xs">{selectedTrainer.bio}</p>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Primary Teaching Track</span>
              <p className="text-slate-800 font-semibold">{selectedTrainer.specialization}</p>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Courses Mentored</span>
              <ul className="space-y-1 text-slate-600">
                {selectedTrainer.coursesTaught.map((c) => (
                  <li key={c} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <a
                href={selectedTrainer.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <Linkedin size={14} /> Open LinkedIn Profile
              </a>
              <Button variant="primary" size="sm" onClick={() => setSelectedTrainer(null)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
