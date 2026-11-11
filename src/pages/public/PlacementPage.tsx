import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building,
  TrendingUp,
  Award,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  UserCheck,
  Calendar,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { SEED_COMPANIES } from '../../mocks/seedData';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { SEO } from '../../components/common/SEO';
import { cmsService } from '../../services/cmsService';

export const PlacementPage: React.FC = () => {
  const testimonials = cmsService.getTestimonials();

  const placementSteps = [
    {
      step: '01',
      title: 'Resume & Portfolio Building',
      desc: 'Expert mentors review your GitHub repositories, production projects, and craft an ATS-compliant engineering resume highlighting your architectural competencies.',
    },
    {
      step: '02',
      title: 'Algorithmic & System Design Profiling',
      desc: 'Intensive problem-solving sessions focusing on LeetCode patterns, time/space complexity optimization, and enterprise distributed system design.',
    },
    {
      step: '03',
      title: '1:1 Mock Technical Interviews',
      desc: 'Simulated rounds conducted by practicing architects from top tier firms, assessing your technical communication and whiteboarding skills with standardized rubrics.',
    },
    {
      step: '04',
      title: 'Exclusive Corporate Hiring Drives',
      desc: 'Direct applications to 120+ partnered enterprises without going through public job board queues. Dedicated placement officer coordination for every student.',
    },
    {
      step: '05',
      title: 'Offer Evaluation & Negotiation',
      desc: 'Guidance on reviewing offer letters, salary benchmarking, and career trajectory choices across product startups and Fortune 500 corporations.',
    },
  ];

  const salaryDistribution = [
    { bracket: '₹ 15 LPA to ₹ 32.5 LPA', percentage: '22%', label: 'Top Tier & International Tech' },
    { bracket: '₹ 8 LPA to ₹ 15 LPA', percentage: '56%', label: 'Product Firms & Cloud Consultancies' },
    { bracket: '₹ 5 LPA to ₹ 8 LPA', percentage: '22%', label: 'IT Services & Enterprise Core' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <SEO
        title="Placement Cell – 94.8% Success Rate & Hiring Partners"
        description="Explore Nexelvoria Academy's placement services: 120+ hiring partners, ₹8.5 LPA average package, ₹32.5 LPA highest package, and placement guarantee programs."
        keywords={['Placement Guarantee', 'Tech Placements', 'Software Engineer Jobs', 'Hiring Partners', 'Nexelvoria Placements']}
      />

      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="success" size="md">Placement & Career Services</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Accelerate from Training into Tier-1 Tech Careers
        </h1>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
          Nexelvoria Academy bridges students directly to high-growth tech firms with campus drives, resume polishing, and rigorous mock interview simulations.
        </p>
      </div>

      {/* Notice regarding Placement Guarantee Terms per SRS */}
      <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>SRS Business Rule BR-013 & Placement Guarantee Notice:</strong> Placement portal access and guarantee eligibility are strictly restricted to paid and enrolled students who maintain at least <strong>75% recorded live attendance</strong> (BR-010), submit all course assignments, and achieve passing marks in the comprehensive online competency examination.
        </div>
      </div>

      {/* Placement Statistics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
        <Card className="p-6 space-y-1 bg-white">
          <p className="text-3xl font-extrabold text-amber-500">₹ 32.5 LPA</p>
          <p className="text-xs text-slate-500 font-semibold uppercase">Highest Package</p>
        </Card>
        <Card className="p-6 space-y-1 bg-white">
          <p className="text-3xl font-extrabold text-indigo-600">₹ 8.5 LPA</p>
          <p className="text-xs text-slate-500 font-semibold uppercase">Average Package</p>
        </Card>
        <Card className="p-6 space-y-1 bg-white">
          <p className="text-3xl font-extrabold text-emerald-600">94.8%</p>
          <p className="text-xs text-slate-500 font-semibold uppercase">Placement Success</p>
        </Card>
        <Card className="p-6 space-y-1 bg-white">
          <p className="text-3xl font-extrabold text-slate-900">120+</p>
          <p className="text-xs text-slate-500 font-semibold uppercase">Hiring Partners</p>
        </Card>
      </div>

      {/* 5-Step Placement Process */}
      <div className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="purple" size="md">Step-by-Step Pathway</Badge>
          <h2 className="text-3xl font-bold text-slate-900">Our Comprehensive Placement Process</h2>
          <p className="text-xs sm:text-sm text-slate-500">Every enrolled student undergoes a structured 5-stage career transformation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {placementSteps.map((step) => (
            <Card key={step.step} className="p-6 flex flex-col justify-between space-y-4 bg-white border border-slate-200">
              <div className="space-y-3">
                <span className="text-2xl font-black text-indigo-600 font-mono">{step.step}</span>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Salary Distribution Bracket */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 space-y-8 border border-slate-800 shadow-lg">
        <div className="max-w-2xl space-y-2">
          <Badge variant="success" size="md" className="bg-emerald-800/60 text-emerald-200 border-emerald-600">Compensation Insights</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Verified Salary Distribution for Recent Graduates</h2>
          <p className="text-xs sm:text-sm text-slate-300">Based on audited placement offer records across our graduating cohorts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {salaryDistribution.map((item, idx) => (
            <div key={idx} className="p-6 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">{item.percentage}</span>
              </div>
              <p className="text-xl font-extrabold text-white">{item.bracket}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Student Placement Success Stories */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="info" size="md">Proven Outcomes</Badge>
          <h2 className="text-3xl font-bold text-slate-900">Recent Graduate Success Stories</h2>
          <p className="text-xs sm:text-sm text-slate-500">Alumni who bridged from university classrooms to high-growth engineering jobs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t) => (
            <Card key={t.id} className="p-6 flex flex-col justify-between space-y-4 bg-white">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img src={t.avatarUrl} alt={t.studentName} className="h-12 w-12 rounded-xl object-cover border border-slate-200" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{t.studentName}</h3>
                    <p className="text-[11px] text-indigo-600 font-medium">{t.currentRole}</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <p className="text-slate-500 text-[11px]">Placed at: <strong className="text-slate-800">{t.companyName}</strong></p>
                  <p className="text-emerald-700 font-bold font-mono">Package: {t.packageCTC}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-3">&quot;{t.quote}&quot;</p>
              </div>
              <div className="text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100">
                {t.courseName}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Hiring Partners Grid */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="purple" size="md">Corporate Network</Badge>
          <h2 className="text-3xl font-bold text-slate-900">Our Prominent Hiring Partners</h2>
          <p className="text-xs sm:text-sm text-slate-500">Recruiting our software engineering and cloud graduates across India and abroad.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center">
          {SEED_COMPANIES.concat([
            { id: 'c4', name: 'Wipro Technologies', industry: 'IT Services', location: 'Pan India', website: '', activeOpeningsCount: 4, about: '' },
            { id: 'c5', name: 'Capgemini Engineering', industry: 'Engineering', location: 'Hyderabad', website: '', activeOpeningsCount: 3, about: '' },
            { id: 'c6', name: 'Accenture Solutions', industry: 'Consulting', location: 'Bengaluru', website: '', activeOpeningsCount: 5, about: '' },
          ]).map((comp) => (
            <div key={comp.id} className="p-5 rounded-xl border border-slate-200/90 bg-white flex flex-col items-center justify-center space-y-2 hover:border-indigo-400 hover:shadow-xs transition-all">
              <Building className="h-7 w-7 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800 text-center">{comp.name}</span>
              <span className="text-[10px] text-slate-400">{comp.industry}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="p-8 sm:p-12 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center space-y-4">
        <h3 className="text-2xl font-bold text-slate-900">Ready to Secure Your Software Engineering Career?</h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Enroll in our placement guarantee tracks. Start with structured hands-on modules and graduate with a verifiable QR credential and guaranteed interviews.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link to="/courses">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Explore Placement Guarantee Programs
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="md" className="bg-white">
              Register as a Student
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
