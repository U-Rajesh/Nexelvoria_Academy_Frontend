import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Compass,
  Award,
  Building,
  Laptop,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SEO } from '../../components/common/SEO';
import { APP_CONFIG } from '../../constants/appConfig';
import { ScrollReveal } from '../../components/public/ScrollReveal';
import { cmsService, type AboutUsConfig } from '../../services/cmsService';

export const AboutUsPage: React.FC = () => {
  const [aboutConfig] = useState<AboutUsConfig>(() => cmsService.getAboutUsConfig());

  const renderPedagogyIcon = (iconName: string) => {
    switch (iconName) {
      case 'Laptop':
        return <Laptop className="h-6 w-6 text-emerald-400" />;
      case 'Building':
        return <Building className="h-6 w-6 text-sky-400" />;
      case 'Award':
        return <Award className="h-6 w-6 text-amber-400" />;
      case 'BookOpen':
      default:
        return <BookOpen className="h-6 w-6 text-indigo-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-20">
      <SEO
        title="About Us – Mission, Pedagogy & Leadership"
        description="Learn about Nexelvoria Academy's mission to bridge academic education with enterprise production software engineering excellence."
        keywords={['About Nexelvoria', 'Software Engineering Pedagogy', 'Tech Institute Hyderabad', 'Online LMS']}
      />

      {/* Header */}
      {aboutConfig.sectionVisibility.header && (
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="purple" size="md">{aboutConfig.header.badgeText}</Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              {aboutConfig.header.title}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {aboutConfig.header.subtitle}
            </p>
          </div>
        </ScrollReveal>
      )}

      {/* Vision & Mission Cards */}
      {aboutConfig.sectionVisibility.visionMission && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ScrollReveal animation="slide-left" delay={100}>
            <Card className="h-full p-8 space-y-4 border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-shadow rounded-xl">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Compass className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{aboutConfig.vision.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {aboutConfig.vision.description}
              </p>
            </Card>
          </ScrollReveal>

          <ScrollReveal animation="slide-right" delay={200}>
            <Card className="h-full p-8 space-y-4 border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-shadow rounded-xl">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{aboutConfig.mission.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {aboutConfig.mission.description}
              </p>
            </Card>
          </ScrollReveal>
        </div>
      )}

      {/* Core Institutional Objectives */}
      {aboutConfig.sectionVisibility.objectives && (
        <div className="space-y-10">
          <ScrollReveal animation="fade-up">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <Badge variant="info" size="md">Strategic Goals</Badge>
              <h2 className="text-3xl font-bold text-slate-900">Institutional Objectives</h2>
              <p className="text-xs sm:text-sm text-slate-500">The six fundamental commitments that guide our curriculum, mentorship, and operational standards.</p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aboutConfig.objectives.map((obj, i) => (
              <ScrollReveal key={i} animation="scale-in" delay={i * 80}>
                <div className="h-full p-6 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-2.5 hover:shadow-md transition-shadow">
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    OBJECTIVE 0{i + 1}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{obj.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{obj.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}

      {/* Training Approach & Pedagogy */}
      {aboutConfig.sectionVisibility.pedagogy && (
        <ScrollReveal animation="fade-up">
          <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 space-y-8 border border-slate-800 shadow-lg">
            <div className="max-w-2xl space-y-3">
              <Badge variant="purple" size="md" className="bg-slate-800 text-indigo-300 border-slate-700">The Nexelvoria Way</Badge>
              <h2 className="text-3xl font-extrabold tracking-tight">Our Training Approach</h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                We believe that learning to build software cannot happen through passive video watching. Our proprietary pedagogical loop reinforces concepts through 4 mandatory stages:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {aboutConfig.pedagogy.map((p, idx) => (
                <ScrollReveal key={p.stage || p.step || idx} animation="fade-up" delay={idx * 100}>
                  <div className="h-full p-6 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-3">
                    {renderPedagogyIcon(p.icon || 'BookOpen')}
                    <h3 className="text-sm font-bold text-white">{p.stage || p.step || idx + 1}. {p.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Why Choose Us - Comparison Matrix */}
      {aboutConfig.sectionVisibility.comparison && (
        <ScrollReveal animation="fade-up">
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
                  {aboutConfig.comparison.map((row, idx) => (
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
        </ScrollReveal>
      )}

      {/* Campus & Headquarters Info */}
      {aboutConfig.sectionVisibility.campus && (
        <ScrollReveal animation="fade-up">
          <div className="p-8 sm:p-10 rounded-2xl bg-white border border-slate-200/90 shadow-xs grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-3">
              <Badge variant="neutral" size="sm">Campus Infrastructure</Badge>
              <h3 className="text-2xl font-bold text-slate-900">{aboutConfig.campus?.title || 'Technology Headquarters & Physical Infrastructure'}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {aboutConfig.campus?.description || `While our courses are delivered online across India, our corporate hub is located at ${APP_CONFIG.address}. Equipped with state-of-the-art virtual broadcasting studios, dedicated doubt-resolution cells, and high-throughput video encoding pipelines.`}
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
        </ScrollReveal>
      )}
    </div>
  );
};
