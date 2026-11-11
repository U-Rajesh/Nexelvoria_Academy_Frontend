import React from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Compass,
  Award,
  Users,
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  Building,
  Laptop,
  GraduationCap,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SEO } from '../../components/common/SEO';
import { APP_CONFIG } from '../../constants/appConfig';

export const AboutUsPage: React.FC = () => {
  const objectives = [
    {
      title: 'Industry-Grade Competency',
      desc: 'Ensure every graduating engineer writes modular, clean, test-covered code conforming to enterprise production standards.',
    },
    {
      title: 'Zero Rote Learning',
      desc: 'Replace memorization with algorithmic reasoning, system design whiteboarding, and continuous integration pipelines.',
    },
    {
      title: 'Verifiable Integrity',
      desc: 'Maintain strict 75% attendance hurdles (BR-010) and comprehensive proctored examinations before awarding credentials.',
    },
    {
      title: 'Equal Opportunity Placements',
      desc: 'Bridge tier-2 and tier-3 college engineering talent with tier-1 enterprise technology recruiters through structured training.',
    },
    {
      title: 'Mentorship by Practitioners',
      desc: 'Instructors are practicing engineering architects and senior technical leads, not theoretical academic lecturers.',
    },
    {
      title: 'Continuous Career Evolution',
      desc: 'Lifelong alumni network, masterclasses on emerging tech (GenAI, Cloud-Native, Rust), and ongoing career counseling.',
    },
  ];

  const comparison = [
    { feature: 'Curriculum Focus', traditional: 'Outdated university syllabus', aggregator: 'Pre-recorded generic videos', nexelvoria: 'Production distributed microservices & AI' },
    { feature: 'Instructor Quality', traditional: 'Academic lecturers without cloud experience', aggregator: 'Unverified content creators', nexelvoria: 'Practicing architects from Oracle, AWS, Microsoft' },
    { feature: 'Learning Structure', traditional: 'Passive classroom lectures', aggregator: 'Self-paced unmonitored videos', nexelvoria: 'Sequential LMS with unlocked checkpoints' },
    { feature: 'Attendance & Rigor', traditional: 'Pen-and-paper roll call', aggregator: 'Zero attendance tracking', nexelvoria: 'Strict 75% threshold enforced for certification' },
    { feature: 'Placement Assistance', traditional: 'Mass recruitment service desks', aggregator: 'Job board forwarding only', nexelvoria: '1:1 Mocks, placement guarantee, 120+ hiring partners' },
    { feature: 'Certificate Credibility', traditional: 'Generic printed paper', aggregator: 'Unverifiable PDF image', nexelvoria: 'Cryptographic ID & Scannable QR Verification' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-20">
      <SEO
        title="About Us – Mission, Pedagogy & Leadership"
        description="Learn about Nexelvoria Academy's mission to bridge academic education with enterprise production software engineering excellence."
        keywords={['About Nexelvoria', 'Software Engineering Pedagogy', 'Tech Institute Hyderabad', 'Online LMS']}
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="purple" size="md">Our Mission & Pedagogy</Badge>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Empowering the Next Generation of Global Software Architects
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Founded in Hyderabad, India, Nexelvoria Academy was born out of a stark industry disparity: fresh engineering graduates lacked production experience, while modern tech enterprises faced an acute shortage of developers capable of operating on high-velocity distributed codebases.
        </p>
      </div>

      {/* Vision & Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 space-y-4 border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-shadow rounded-xl">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Compass className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Our Vision</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            To establish an internationally benchmarked center of training excellence that equips engineering students with production-grade engineering competencies, ethical foundations, and high-impact career pathways across global technology ecosystems.
          </p>
        </Card>

        <Card className="p-8 space-y-4 border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-shadow rounded-xl">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Target className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Provide direct mentorship from practicing technology leads, structured learning management workflows, automated continuous assessments, and strong corporate hiring networks so that every motivated graduate can achieve enterprise-grade technical success.
          </p>
        </Card>
      </div>

      {/* Core Institutional Objectives */}
      <div className="space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="info" size="md">Strategic Goals</Badge>
          <h2 className="text-3xl font-bold text-slate-900">Institutional Objectives</h2>
          <p className="text-xs sm:text-sm text-slate-500">The six fundamental commitments that guide our curriculum, mentorship, and operational standards.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {objectives.map((obj, i) => (
            <div key={i} className="p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-2.5 hover:shadow-md transition-shadow">
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                OBJECTIVE 0{i + 1}
              </span>
              <h3 className="text-base font-bold text-slate-900">{obj.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{obj.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Training Approach & Pedagogy */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 space-y-8 border border-slate-800 shadow-lg">
        <div className="max-w-2xl space-y-3">
          <Badge variant="purple" size="md" className="bg-slate-800 text-indigo-300 border-slate-700">The Nexelvoria Way</Badge>
          <h2 className="text-3xl font-extrabold tracking-tight">Our Training Approach</h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            We believe that learning to build software cannot happen through passive video watching. Our proprietary pedagogical loop reinforces concepts through 4 mandatory stages:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3">
            <BookOpen className="h-6 w-6 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">1. Conceptual Rigor</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Live lectures breaking down why architectures exist—from thread pools and socket connections to Kafka offsets.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3">
            <Laptop className="h-6 w-6 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">2. Daily Code Drills</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every lesson concludes with required coding assignments submitted via GitHub and graded with automated and mentor reviews.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3">
            <Building className="h-6 w-6 text-sky-400" />
            <h3 className="text-sm font-bold text-white">3. Distributed Capstones</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Students build resilient multi-service architectures deployed into real AWS ECS/EKS clusters with CI/CD and metrics telemetry.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3">
            <Award className="h-6 w-6 text-amber-400" />
            <h3 className="text-sm font-bold text-white">4. Assessment Hurdles</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Timed examinations and 1-on-1 interview evaluations ensure only authentic mastery unlocks certification and placements.
            </p>
          </div>
        </div>
      </div>

      {/* Why Choose Us - Comparison Matrix */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="purple" size="md">Transparent Benchmarking</Badge>
          <h2 className="text-3xl font-bold text-slate-900">Why Choose Nexelvoria Academy?</h2>
          <p className="text-xs sm:text-sm text-slate-500">See how our enterprise model compares to conventional colleges and generic video platforms.</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <th className="p-4 font-bold">Feature / Dimension</th>
                <th className="p-4 font-semibold text-slate-500">Traditional Colleges</th>
                <th className="p-4 font-semibold text-slate-500">Video Aggregators</th>
                <th className="p-4 font-extrabold text-indigo-600 bg-indigo-50/70">Nexelvoria Academy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {comparison.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">{row.feature}</td>
                  <td className="p-4 text-slate-500">{row.traditional}</td>
                  <td className="p-4 text-slate-500">{row.aggregator}</td>
                  <td className="p-4 font-semibold text-indigo-700 bg-indigo-50/40">{row.nexelvoria}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campus & Headquarters Info */}
      <div className="p-8 sm:p-10 rounded-2xl bg-white border border-slate-200/90 shadow-xs grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        <div className="lg:col-span-2 space-y-3">
          <Badge variant="neutral" size="sm">Campus Infrastructure</Badge>
          <h3 className="text-2xl font-bold text-slate-900">Technology Headquarters & Physical Infrastructure</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            While our courses are delivered online across India, our corporate hub is located at {APP_CONFIG.address}.
            Equipped with state-of-the-art virtual broadcasting studios, dedicated doubt-resolution cells, and high-throughput video encoding pipelines.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
          <Link to="/courses">
            <Button variant="primary" size="md" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Explore Training Courses
            </Button>
          </Link>
          <Link to="/contact-us">
            <Button variant="outline" size="md" className="w-full">
              Contact Our Admissions Office
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
