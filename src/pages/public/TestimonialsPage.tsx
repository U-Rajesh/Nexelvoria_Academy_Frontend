import React, { useState } from 'react';
import { Star, Award, Video } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SEO } from '../../components/common/SEO';
import { cmsService, type TestimonialItem } from '../../services/cmsService';

export const TestimonialsPage: React.FC = () => {
  const [testimonials] = useState<TestimonialItem[]>(() => cmsService.getTestimonials());
  const [selectedCourse, setSelectedCourse] = useState<string>('All');

  const courseFilters = ['All', 'Full Stack Java Cloud Architecture', 'MERN Stack Cloud Native Specialist', 'DevOps & Cloud Architecture', 'Data Science & Generative AI Systems'];

  const filteredTestimonials = testimonials.filter((t) => {
    if (selectedCourse === 'All') return true;
    return t.courseName === selectedCourse;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      <SEO
        title="Student Testimonials & Alumni Reviews"
        description="Read authentic reviews and career transition stories from Nexelvoria Academy graduates placed at top tech enterprises."
        keywords={['Student Reviews', 'Nexelvoria Testimonials', 'Alumni Placement Stories', 'Course Feedback']}
      />

      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="purple" size="md">Alumni Stories & Reviews</Badge>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Real Engineers. Real Career Transformations.
        </h1>
        <p className="text-slate-500 text-sm sm:text-base">
          Read verified feedback from graduates who transitioned from academic theory into enterprise tech production roles.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {courseFilters.map((course) => (
          <button
            key={course}
            onClick={() => setSelectedCourse(course)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedCourse === course
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {course === 'All' ? 'All Programs' : course.split(' ')[0] + ' ' + (course.split(' ')[1] || '')}
          </button>
        ))}
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTestimonials.map((t) => (
          <Card key={t.id} className="p-6 flex flex-col justify-between space-y-5 hover:shadow-xl transition-all duration-200 bg-white">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex text-amber-400">
                  {[...Array(t.rating)].map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <Badge variant="success" size="sm">{t.packageCTC}</Badge>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                <p className="text-slate-500 text-[11px]">Before: <span className="text-slate-700">{t.previousRole}</span></p>
                <p className="text-indigo-600 font-bold">Now: {t.currentRole}</p>
                <p className="text-slate-800 font-medium">{t.companyName}</p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed italic">
                &quot;{t.quote}&quot;
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <img
                src={t.avatarUrl}
                alt={t.studentName}
                className="h-11 w-11 rounded-full object-cover border border-indigo-100 shadow-xs shrink-0"
              />
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-900 truncate">{t.studentName}</h4>
                <p className="text-[10px] text-slate-400 truncate">{t.courseName}</p>
                <span className="text-[10px] text-emerald-600 font-semibold">✓ Verified Alumni</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Video Testimonials Spotlight */}
      <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-6">
        <div className="flex items-center gap-2">
          <Video className="h-6 w-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">Alumni Video Spotlights</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
          Watch recorded interviews with alumni discussing their day-to-day work, the impact of weekly mock interviews, and how maintaining 75% attendance prepared them for enterprise sprints.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5 space-y-3">
            <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80"
                alt="Video Interview with Rohan"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform opacity-75"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  ▶
                </div>
              </div>
            </div>
            <h4 className="text-xs font-bold text-white">From Tier-3 College to Infosys Java Cloud Engineer</h4>
            <p className="text-[11px] text-slate-400">Rohan Sharma • Batch of 2026</p>
          </div>

          <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5 space-y-3">
            <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80"
                alt="Video Interview with Pooja"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform opacity-75"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  ▶
                </div>
              </div>
            </div>
            <h4 className="text-xs font-bold text-white">Non-CS Background to React Frontend Engineer in 5 Months</h4>
            <p className="text-[11px] text-slate-400">Pooja Sundaram • Batch of 2026</p>
          </div>

          <div className="rounded-2xl bg-slate-800/80 border border-slate-700 p-5 space-y-3">
            <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden group cursor-pointer">
              <img
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80"
                alt="Video Interview with Arjun"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform opacity-75"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  ▶
                </div>
              </div>
            </div>
            <h4 className="text-xs font-bold text-white">Mastering Kubernetes & SRE GitOps for Accenture</h4>
            <p className="text-[11px] text-slate-400">Arjun Mehta • Batch of 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};
