import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  Award,
  Users,
  Briefcase,
  Play,
  ShieldCheck,
  Building,
  Star,
  Clock,
  BookOpen,
  ChevronDown,
  Sparkles,
  School,
  Building2,
  FileCode2,
  Laptop,
  CheckCircle2,
  Send,
  Calendar,
} from 'lucide-react';
import { SEED_COURSES } from '../../mocks/seedData';
import { formatINR, formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { PageLabel } from '../../components/common/PageLabel';
import { Card, CardContent } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { SEO } from '../../components/common/SEO';
import { useNotification } from '../../context/NotificationContext';
import {
  cmsService,
  type TrainerProfile,
  type BlogArticle,
  type TestimonialItem,
  type FAQItem,
  type AchievementItem,
  type HomePageConfig,
} from '../../services/cmsService';
import { analytics } from '../../utils/analytics';
import { ScrollReveal } from '../../components/public/ScrollReveal';
import { AnimatedStatistic } from '../../components/public/AnimatedStatistic';
import { HiringPartnersMarquee } from '../../components/public/HiringPartnersMarquee';
import { TrainerOrbitSection } from '../../components/public/TrainerOrbitSection';
import { AmbientDarkGlow } from '../../components/public/AnimatedBackgroundLayer';

export const HomePage: React.FC = () => {
  const [homeConfig] = useState<HomePageConfig>(() => cmsService.getHomePageConfig());
  const [callbackModalOpen, setCallbackModalOpen] = useState(false);
  const [callbackForm, setCallbackForm] = useState({ name: '', phone: '', course: '' });
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', phone: '', course: '', message: '' });
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [trainers] = useState<TrainerProfile[]>(() => cmsService.getTrainers().filter((t) => t.isActive !== false));
  const [articles] = useState<BlogArticle[]>(() => cmsService.getArticles().filter((a) => a.isPublished !== false).slice(0, 3));
  const [testimonials] = useState<TestimonialItem[]>(() => cmsService.getTestimonials().filter((t) => t.isPublished !== false));
  const [achievements] = useState<AchievementItem[]>(() => cmsService.getAchievements().filter((a) => a.isActive !== false).slice(0, 3));
  const [faqs] = useState<FAQItem[]>(() => cmsService.getFAQs().filter((f) => f.isActive !== false).slice(0, 5));

  const { showToast } = useNotification();

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cmsService.submitEnquiry({
      type: 'callback',
      name: callbackForm.name,
      phone: callbackForm.phone,
      courseOfInterest: callbackForm.course,
      preferredTimeSlot: 'Immediate Callback',
    });
    analytics.trackEvent('submit_callback', 'Lead', callbackForm.course);
    setCallbackModalOpen(false);
    showToast({
      type: 'success',
      title: 'Callback Request Received',
      message: `Thank you ${callbackForm.name}! Our senior academic counselor will call you shortly at ${callbackForm.phone}.`,
    });
    setCallbackForm({ name: '', phone: '', course: '' });
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cmsService.submitEnquiry({
      type: 'course_admission',
      name: enquiryForm.name,
      email: enquiryForm.email,
      phone: enquiryForm.phone,
      courseOfInterest: enquiryForm.course,
      message: enquiryForm.message,
    });
    analytics.trackEvent('submit_home_enquiry', 'Lead', enquiryForm.course);
    showToast({
      type: 'success',
      title: 'Course Enquiry Submitted',
      message: 'Thank you! An admissions brochure, syllabus guide, and fee details have been dispatched to your email.',
    });
    setEnquiryForm({ name: '', email: '', phone: '', course: '', message: '' });
  };

  const renderAdvantageIcon = (iconName: string) => {
    if (iconName === 'Users') return <Users className="h-5 w-5" />;
    if (iconName === 'ShieldCheck') return <ShieldCheck className="h-5 w-5" />;
    if (iconName === 'Briefcase') return <Briefcase className="h-5 w-5" />;
    if (iconName === 'Calendar') return <Calendar className="h-5 w-5" />;
    if (iconName === 'Sparkles') return <Sparkles className="h-5 w-5" />;
    return <Play className="h-5 w-5" />;
  };

  const renderMethodologyIcon = (step: string) => {
    if (step === '01') return <FileCode2 className="h-6 w-6 text-indigo-600" />;
    if (step === '02') return <Laptop className="h-6 w-6 text-emerald-600" />;
    if (step === '03') return <Building className="h-6 w-6 text-sky-600" />;
    if (step === '04') return <Briefcase className="h-6 w-6 text-amber-600" />;
    return <Award className="h-6 w-6 text-rose-600" />;
  };

  return (
    <div className="space-y-24 pb-20">
      <SEO
        title="Premier Online Training Institute & LMS"
        description="Launch your software engineering career with Nexelvoria Academy. Hands-on Java, MERN, Cloud DevOps, and GenAI training with placement guarantee."
        keywords={['Online Training Institute', 'LMS', 'Java Full Stack', 'Cloud DevOps', 'Placement Guarantee', 'Nexelvoria Academy']}
      />

      {/* 1. Hero Section */}
      {homeConfig.sectionVisibility.hero && (
        <section className="relative overflow-hidden bg-slate-950 text-white pt-16 pb-28 lg:pt-20 lg:pb-32 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80">
          <AmbientDarkGlow variant="cyan-indigo" />
          <div className="max-w-7xl mx-auto relative z-10 text-center space-y-7">
            <PageLabel theme="dark">{homeConfig.hero.badgeText}</PageLabel>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight text-white">
              {homeConfig.hero.titlePrefix}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-300">
                {homeConfig.hero.titleHighlight}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {homeConfig.hero.subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link to={homeConfig.hero.ctaPrimaryLink || '/courses'}>
                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  {homeConfig.hero.ctaPrimaryText || 'Explore All Courses'}
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="bg-slate-900/80 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white backdrop-blur-xs"
                onClick={() => setCallbackModalOpen(true)}
              >
                {homeConfig.hero.ctaSecondaryText || 'Request Free Counseling'}
              </Button>
            </div>

            {/* Key Value Badges */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-300">
              {homeConfig.hero.valueBadges.map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800/90 backdrop-blur-xs">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. Key Metrics Bar (Scroll-Triggered Animated Statistics) */}
      {homeConfig.sectionVisibility.statistics && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
          <div className="bg-white rounded-xl shadow-[0_12px_32px_-8px_rgba(15,23,42,0.08),0_2px_4px_rgba(15,23,42,0.02)] border border-slate-200/90 p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-5 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {homeConfig.statistics
              .filter((s) => s.isVisible !== false)
              .map((stat, idx) => (
                <AnimatedStatistic
                  key={stat.id || idx}
                  value={stat.value}
                  label={stat.label}
                  valueClassName={stat.valueClassName || 'text-3xl sm:text-4xl font-extrabold text-indigo-600'}
                  className={idx > 0 ? 'space-y-1 pt-4 sm:pt-0' : 'space-y-1'}
                  delay={stat.delay ?? idx * 100}
                />
              ))}
          </div>
        </section>
      )}

      {/* 3. Institute Introduction */}
      {homeConfig.sectionVisibility.intro && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal animation="slide-left" className="space-y-6">
            <PageLabel centered={false} className="mb-2">About Nexelvoria Academy</PageLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Bridging the Gap Between Academic Education and Production Engineering
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Founded by veteran engineering leaders in Hyderabad Cyber City, Nexelvoria Academy was born to eliminate the painful friction fresh engineering graduates face when entering modern tech companies.
            </p>
            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>No Theoretical Fluff:</strong> Learn architectures by writing production microservices, running unit tests, and debugging distributed memory leaks.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Sequential Learning Control:</strong> Modules unlock progressively, ensuring thorough mastery before advancing to complex cloud deployments.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
                <span><strong>Dedicated Academic Oversight:</strong> Maintain at least 75% attendance and submit real code assignments evaluated by industry mentors.</span>
              </div>
            </div>
            <div className="pt-2">
              <Link to="/about-us">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Learn More About Our Mission
                </Button>
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="slide-right" className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                alt="Students collaborating on production code at Nexelvoria Academy"
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl border border-slate-100 p-4 max-w-xs hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  95%
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Placement Confidence</p>
                  <p className="text-[11px] text-slate-500">Rated by 500+ recent alumni</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
      )}

      {/* 4. Featured Courses Section */}
      {homeConfig.sectionVisibility.courses && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <PageLabel centered={false} className="mb-2">Flagship Programs</PageLabel>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Industry-Aligned Training Courses
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Curated by principal engineers from Fortune 500 tech companies.
              </p>
            </div>
            <Link to="/courses">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View All Courses
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SEED_COURSES.slice(0, 3).map((course, idx) => (
            <ScrollReveal key={course.id} animation="fade-up" delay={idx * 120} className="h-full">
              <Card className="flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-200 h-full">
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge variant="neutral" size="sm">{course.category}</Badge>
                  </div>
                  {course.hasPlacementGuarantee && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="success" size="sm">Placement Guarantee*</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="flex-1 flex flex-col justify-between p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-indigo-500" /> {course.durationWeeks} Weeks
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> {course.totalHours} Hours
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {course.shortDescription}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {course.technologies.slice(0, 4).map((tech) => (
                      <span key={tech} className="text-[11px] bg-slate-100/90 text-slate-700 border border-slate-200/70 px-2 py-0.5 rounded-md font-mono font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-slate-900">
                        {formatINR(course.discountedFeeINR || course.feeINR)}
                      </span>
                      {course.discountedFeeINR && (
                        <span className="text-xs text-slate-400 line-through ml-2">
                          {formatINR(course.feeINR)}
                        </span>
                      )}
                    </div>
                    <Link to={`/courses/${course.slug}`}>
                      <Button variant="primary" size="sm">
                        Details & Syllabus
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>
      )}

      {/* 5. Why Choose Nexelvoria Section */}
      {homeConfig.sectionVisibility.advantage && (
      <section className="relative overflow-hidden bg-slate-900 text-white py-20 border-y border-slate-800/80">
        <AmbientDarkGlow variant="indigo-violet" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
          <ScrollReveal animation="fade-up">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <PageLabel theme="dark">The Nexelvoria Advantage</PageLabel>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Why Serious Engineers Choose Nexelvoria
              </h2>
              <p className="text-slate-400 text-sm">
                We replace rote tutorial watching with real production software development rigor.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {homeConfig.advantages.map((adv, idx) => (
              <ScrollReveal key={adv.title} animation="scale-in" delay={idx * 80}>
                <div className="p-6 rounded-xl bg-slate-800/60 backdrop-blur-xs border border-slate-700/60 space-y-3.5 hover:border-indigo-400/50 hover:bg-slate-800/80 transition-all duration-200 shadow-xs h-full">
                  <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${adv.color}`}>
                    {renderAdvantageIcon(adv.iconName)}
                  </div>
                  <h3 className="text-base font-bold text-white">{adv.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {adv.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* 6. Training Methodology (5-Stage Visual Roadmap) */}
      {homeConfig.sectionVisibility.methodology && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <PageLabel>Pedagogical Framework</PageLabel>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Our 5-Stage Engineering Methodology
            </h2>
            <p className="text-slate-500 text-sm">
              From algorithmic foundations to multi-region cloud production deployment.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {homeConfig.methodology.map((m, idx) => (
            <ScrollReveal key={m.step} animation="fade-up" delay={idx * 100}>
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md hover:border-indigo-200/80 transition-all duration-200 h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      {renderMethodologyIcon(m.step)}
                    </div>
                    <span className="text-2xl font-black text-slate-200 font-mono">{m.step}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
      )}

      {/* 7. Industry Mentors – 3D Cover-Flow Scroll Animation */}
      {homeConfig.sectionVisibility.trainersOrbit && (
        <TrainerOrbitSection trainers={trainers} />
      )}

      {/* 8. Placement Highlights & Hiring Partners Continuous Marquee */}
      {homeConfig.sectionVisibility.hiringMarquee && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <ScrollReveal animation="fade-up">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <PageLabel>Placement Network</PageLabel>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              120+ Hiring Partners Actively Recruiting Our Alumni
            </h2>
            <p className="text-slate-500 text-sm">
              Direct hiring drives, interview pipelines, and package negotiation assistance across tier-1 technology enterprises.
            </p>
          </div>
        </ScrollReveal>

        <HiringPartnersMarquee />

        <ScrollReveal animation="fade-up" delay={200}>
          <div className="text-center pt-2">
            <Link to="/placements">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Explore Placement Statistics & Hiring Partners
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </section>
      )}

      {/* 9. Student Achievements & Milestones */}
      {homeConfig.sectionVisibility.achievements && (
      <section className="relative overflow-hidden bg-slate-900 text-white py-16 border-y border-slate-800/80">
        <AmbientDarkGlow variant="cyan-indigo" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
          <ScrollReveal animation="fade-up">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <PageLabel theme="dark">Student Milestones</PageLabel>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Exceptional Student Achievements
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Recognized at national hackathons, open source foundations, and enterprise hiring streaks.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {achievements.map((ach, idx) => (
              <ScrollReveal key={ach.id} animation="fade-up" delay={idx * 120} className="h-full">
                <div className="p-6 rounded-xl bg-slate-800/60 backdrop-blur-xs border border-slate-700/60 space-y-3 flex flex-col justify-between hover:border-indigo-400/50 hover:bg-slate-800/80 transition-all duration-200 shadow-xs h-full">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-700/60 text-indigo-300 border border-slate-600/50">
                        {ach.badge}
                      </span>
                      <span className="text-xs text-slate-400">{ach.date}</span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">{ach.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{ach.description}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-700/50 text-xs font-semibold text-amber-300">
                    {ach.studentName}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="text-center">
            <Link to="/achievements">
              <span className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline">
                View All Student Achievements & Records →
              </span>
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* 10. College Partnerships & Corporate Training Highlights */}
      {homeConfig.sectionVisibility.partnerships && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ScrollReveal animation="slide-left">
            <Card className="p-8 space-y-4 border-slate-200/90 bg-white shadow-xs hover:shadow-lg hover:border-indigo-200/80 transition-all duration-200 h-full">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <School className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">College & University Partnerships</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We collaborate with engineering institutions to conduct semester bootcamps, Faculty Development Programs (FDP), and exclusive campus placement drives.
              </p>
              <div className="pt-2">
                <Link to="/college-partnerships">
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Explore Institutional MoUs
                  </Button>
                </Link>
              </div>
            </Card>
          </ScrollReveal>

          <ScrollReveal animation="slide-right">
            <Card className="p-8 space-y-4 border-slate-200/90 bg-white shadow-xs hover:shadow-lg hover:border-emerald-200/80 transition-all duration-200 h-full">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Corporate Upskilling & Finishing School</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Accelerate fresh hire time-to-productivity with custom AWS cloud sandboxes, enterprise Java microservices, and internal codebase mirroring.
              </p>
              <div className="pt-2">
                <Link to="/corporate-training">
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Explore Enterprise Solutions
                  </Button>
                </Link>
              </div>
            </Card>
          </ScrollReveal>
        </div>
      </section>
      )}

      {/* 11. Student Testimonials */}
      {homeConfig.sectionVisibility.testimonials && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <PageLabel centered={false} className="mb-2">Alumni Reviews</PageLabel>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Real Stories from Our Placed Engineers
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Read how our students transformed their careers and salary trajectories.
              </p>
            </div>
            <Link to="/testimonials">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View All Testimonials
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        {/* Continuous Right-to-Left Infinite Marquee for Student Placement Stories */}
        <div className="relative overflow-hidden w-full py-2 select-none">
          {/* Subtle Side Fade Gradients for Seamless Edge Bleed */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent z-10" />

          {/* Marquee Track Moving Continuously Right to Left */}
          <div
            className="flex w-fit animate-marquee-left hover:[animation-play-state:paused] gap-6 py-4"
            style={{ animationDuration: `${Math.max(26, testimonials.length * 8)}s` }}
          >
            {[...testimonials, ...testimonials, ...testimonials].map((t, loopIdx) => (
              <Card
                key={`${t.id}-marquee-${loopIdx}`}
                className="w-[310px] sm:w-[380px] shrink-0 p-6 flex flex-col justify-between space-y-4 hover:shadow-xl transition-all duration-300 hover:border-indigo-400 bg-white"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-400">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <Badge variant="success" size="sm">{t.packageCTC}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-4">&quot;{t.quote}&quot;</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
                  <img
                    src={t.avatarUrl}
                    alt={t.studentName}
                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover object-top border-2 border-indigo-100 shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{t.studentName}</h4>
                    <p className="text-xs text-indigo-600 font-semibold truncate">{t.currentRole}</p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{t.companyName}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* 12. Latest Tech Articles & Blog */}
      {homeConfig.sectionVisibility.blog && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <PageLabel centered={false} className="mb-2">Technical Insights</PageLabel>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Latest Engineering Articles & Guides
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Deep dives into modern backend architectures, distributed systems, and placement preparation.
              </p>
            </div>
            <Link to="/blog">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Read All Articles
              </Button>
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((art, idx) => (
            <ScrollReveal key={art.id} animation="fade-up" delay={idx * 120} className="h-full">
              <Card className="overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-200 h-full">
                <div className="relative h-44 w-full bg-slate-100">
                  <img
                    src={art.featuredImage}
                    alt={art.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-white/95 text-indigo-700 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow-xs">
                    {art.category}
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <span className="text-[11px] text-slate-400 font-medium">{art.readTime} • {formatDate(art.date)}</span>
                    <Link to={`/blog/${art.slug}`}>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug hover:text-indigo-600 transition-colors line-clamp-2">
                        {art.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">{art.author}</span>
                    <Link to={`/blog/${art.slug}`} className="text-indigo-600 font-semibold hover:underline">
                      Read Article →
                    </Link>
                  </div>
                </div>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>
      )}

      {/* 13. FAQs Preview Section */}
      {homeConfig.sectionVisibility.faqs && (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <ScrollReveal animation="fade-up">
          <div className="text-center space-y-3">
            <PageLabel>Quick Answers</PageLabel>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 text-sm">
              Everything you need to know about our admissions, fee structure, and policies.
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <ScrollReveal key={faq.id} animation="fade-up" delay={idx * 60}>
                <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs hover:border-slate-300 transition-colors">
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold text-slate-900 pr-4">{faq.question}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                      {faq.answer}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <Link to="/faqs">
            <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              Have more questions? Browse complete FAQs →
            </span>
          </Link>
        </div>
      </section>
      )}

      {/* 14. Inline Course Enquiry & Callback Section */}
      {homeConfig.sectionVisibility.leadForm && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="scale-in">
          <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-8 sm:p-12 text-white shadow-xl border border-slate-800/80 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AmbientDarkGlow variant="indigo-violet" />
            <div className="space-y-6 relative z-10">
              <PageLabel theme="dark" centered={false} className="mb-2">Free Career Counseling</PageLabel>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Ready to Upgrade Your Software Career?
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Submit your inquiry below. Our senior academic advisors will evaluate your technical background, recommend the ideal course track, and share curriculum outlines.
              </p>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Zero Obligation 1-on-1 Academic Roadmap Consultation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Detailed Syllabus PDFs & Placement Statistics Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Scholarship & Early-Bird Registration Guidance</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 text-slate-900 shadow-xl relative z-10">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Send Admissions Enquiry</h3>
              <p className="text-xs text-slate-500 mb-5">We typically respond within 2 to 4 business hours.</p>

              <form onSubmit={handleEnquirySubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.name}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={enquiryForm.email}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                      placeholder="rahul@example.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      pattern="[6-9][0-9]{9}"
                      value={enquiryForm.phone}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                      placeholder="10-digit number"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Program Interested In *</label>
                  <select
                    required
                    value={enquiryForm.course}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, course: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select a Program</option>
                    {SEED_COURSES.map((c) => (
                      <option key={c.id} value={c.title}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Message or Query (Optional)</label>
                  <textarea
                    rows={2}
                    value={enquiryForm.message}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                    placeholder="Tell us about your educational background or any questions..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <Button type="submit" variant="primary" size="md" className="w-full" rightIcon={<Send className="h-4 w-4" />}>
                  Submit Course Enquiry
                </Button>
              </form>
            </div>
          </div>
        </ScrollReveal>
      </section>
      )}

      {/* Counseling / Callback Request Modal (PUB-019) */}
      <Modal
        isOpen={callbackModalOpen}
        onClose={() => setCallbackModalOpen(false)}
        title="Request Free Academic Counseling"
        description="Speak with our industry counselors to choose the right technology track for your background."
      >
        <form onSubmit={handleCallbackSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
            <input
              type="text"
              required
              value={callbackForm.name}
              onChange={(e) => setCallbackForm({ ...callbackForm, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mobile Phone Number *</label>
            <input
              type="tel"
              required
              pattern="[6-9][0-9]{9}"
              value={callbackForm.phone}
              onChange={(e) => setCallbackForm({ ...callbackForm, phone: e.target.value })}
              placeholder="10-digit mobile number"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Program of Interest *</label>
            <select
              required
              value={callbackForm.course}
              onChange={(e) => setCallbackForm({ ...callbackForm, course: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Select a Program</option>
              {SEED_COURSES.map((c) => (
                <option key={c.id} value={c.title}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button variant="outline" size="sm" type="button" onClick={() => setCallbackModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
