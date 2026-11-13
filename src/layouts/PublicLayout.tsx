import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Menu,
  X,
  Phone,
  Mail,
  CheckCircle,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  LogOut,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../constants/appConfig';
import { Button } from '../components/common/Button';
import { Linkedin, Github } from '../components/common/SocialIcons';
import { cmsService, type WebsiteBanner, type HeaderFooterConfig, type ContactInfoConfig } from '../services/cmsService';
import { analytics } from '../utils/analytics';

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [activeBanner, setActiveBanner] = useState<WebsiteBanner | null>(null);
  const [headerFooterConfig] = useState<HeaderFooterConfig>(() => cmsService.getHeaderFooterConfig());
  const [contactConfig] = useState<ContactInfoConfig>(() => cmsService.getContactInfo());
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Initialize analytics once
    analytics.init();
    // Fetch dynamic banner from CMS
    const banner = cmsService.getActiveBanner();
    setActiveBanner(banner);
  }, []);

  useEffect(() => {
    // Track page views on route change (PUB-024)
    analytics.trackPageView(location.pathname);
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = (headerFooterConfig.navLinks && headerFooterConfig.navLinks.length > 0)
    ? headerFooterConfig.navLinks
    : [
        { label: 'Home', path: '/' },
        { label: 'Courses', path: '/courses' },
        { label: 'Placements', path: '/placements' },
        { label: 'Trainers', path: '/trainers' },
        { label: 'Partnerships', path: '/college-partnerships' },
        { label: 'Corporate', path: '/corporate-training' },
        { label: 'Success Stories', path: '/testimonials' },
        { label: 'Blog', path: '/blog' },
        { label: 'About Us', path: '/about-us' },
        { label: 'Contact', path: '/contact-us' },
      ];

  const supportPhone = contactConfig.supportPhone || APP_CONFIG.supportPhone;
  const supportEmail = contactConfig.supportEmail || APP_CONFIG.supportEmail;
  const whatsappNumber = contactConfig.whatsappNumber || APP_CONFIG.whatsappNumber;
  const linkedinUrl = contactConfig.socialLinks?.linkedin || APP_CONFIG.socialLinks.linkedin;
  const githubUrl = contactConfig.socialLinks?.github || APP_CONFIG.socialLinks.github;
  const logoTitle = headerFooterConfig.logoTitle || 'Nexelvoria';
  const logoSubtitle = headerFooterConfig.logoSubtitle || 'Online Training & LMS';
  const footerDescription = headerFooterConfig.footerDescription ||
    'Industry-led training institute bridging academic education with production engineering excellence. Equipping developers and tech professionals with hands-on competencies and placement guarantees.';
  const copyrightText = headerFooterConfig.copyrightText ||
    `© ${new Date().getFullYear()} Nexelvoria Academy. All rights reserved. Timezone: Asia/Kolkata.`;

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'student') return '/student/dashboard';
    if (user.role === 'teacher') return '/teacher/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'super_admin') return '/super-admin/dashboard';
    return '/';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased">
      {/* Dynamic CMS Top Announcement Banner (PUB-022) */}
      {activeBanner && activeBanner.isActive && !bannerDismissed && (
        <div className="bg-slate-900 text-white text-xs py-2 px-4 border-b border-slate-800 shadow-xs transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex-1 flex items-center justify-center sm:justify-start gap-2.5 overflow-hidden">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 text-[10px] font-bold uppercase tracking-wider shrink-0 border border-slate-700">
                <Sparkles className="h-3 w-3 text-amber-300" />
                {activeBanner.badgeText}
              </span>
              <p className="truncate font-medium text-slate-200">
                {activeBanner.text}
              </p>
              {activeBanner.linkUrl && (
                <Link
                  to={activeBanner.linkUrl}
                  className="hidden sm:inline-flex items-center gap-1 text-indigo-300 hover:text-white underline font-semibold shrink-0 text-xs ml-1"
                >
                  {activeBanner.linkText} <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss banner"
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Utility Header & Socials (PUB-025) */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
              <CheckCircle className="h-3.5 w-3.5" />
              Govt. Recognized & ISO Certified Training Institute
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <a
              href={`tel:${supportPhone.replace(/[^0-9+]/g, '')}`}
              className="hidden md:flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              <Phone className="h-3 w-3" /> {supportPhone}
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/verify-certificate"
              className="text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Verify Certificate</span>
            </Link>
            <span className="text-slate-600">|</span>
            <Link to="/faqs" className="text-slate-400 hover:text-white transition-colors">
              FAQs
            </Link>
            <span className="text-slate-600">|</span>
            {/* Social Links (PUB-025) */}
            <div className="flex items-center gap-2.5 text-slate-400">
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LinkedIn"
                  aria-label="LinkedIn Profile"
                  className="hover:text-indigo-400 transition-colors"
                >
                  <Linkedin size={13} />
                </a>
              )}
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="GitHub"
                  aria-label="GitHub Profile"
                  className="hover:text-white transition-colors"
                >
                  <Github size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white border border-slate-800 shadow-xs group-hover:bg-slate-800 transition-colors">
                <GraduationCap className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight block">
                  {logoTitle} <span className="text-indigo-600">Academy</span>
                </span>
                <span className="text-[10px] text-slate-500 tracking-wider uppercase block font-medium">
                  {logoSubtitle}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'text-indigo-600 bg-indigo-50/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Compact Desktop Navigation for Medium Screens (lg to xl) */}
            <nav className="hidden lg:flex xl:hidden items-center gap-1">
              <Link to="/courses" className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600">Courses</Link>
              <Link to="/placements" className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600">Placements</Link>
              <Link to="/trainers" className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600">Trainers</Link>
              <Link to="/college-partnerships" className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600">Partnerships</Link>
              <Link to="/contact-us" className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600">Contact</Link>
            </nav>

            {/* User CTAs */}
            <div className="hidden sm:flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <Link to={getDashboardPath()}>
                    <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                      Go to Dashboard
                    </Button>
                  </Link>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm">
                      Enroll / Register
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle mobile navigation menu"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-1.5 shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === link.path
                    ? 'text-indigo-600 bg-indigo-50 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/verify-certificate"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg font-medium"
              >
                <ShieldCheck className="h-4 w-4" /> Verify Certificate
              </Link>

              {isAuthenticated ? (
                <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="md" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="md" className="w-full">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Floating WhatsApp Action Button (PUB-020) */}
      <a
        href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hello%20Nexelvoria%20Academy,%20I%20would%20like%20to%20inquire%20about%20your%20training%20programs.`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Admissions on WhatsApp"
        className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 flex items-center gap-2 group cursor-pointer border-2 border-white"
      >
        <MessageCircle className="h-6 w-6 fill-current" />
        <span className="hidden sm:inline-block text-xs font-semibold pr-1">
          Chat on WhatsApp
        </span>
      </a>

      {/* Comprehensive Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Institute Overview */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                  {logoTitle} <span className="text-indigo-400">Academy</span>
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                {footerDescription}
              </p>
              <div className="space-y-1.5 text-xs text-slate-400">
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-indigo-400" /> {supportEmail}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-indigo-400" /> {supportPhone}
                </p>
              </div>

              {/* Social Media Links (PUB-025) */}
              <div className="pt-2 flex items-center gap-3 text-slate-400">
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 hover:text-white transition-colors"
                    aria-label="Follow Nexelvoria on LinkedIn"
                  >
                    <Linkedin size={16} />
                  </a>
                )}
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
                    aria-label="Nexelvoria GitHub"
                  >
                    <Github size={16} />
                  </a>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Programs
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/courses/full-stack-java-cloud" className="hover:text-white transition-colors">Full Stack Java Cloud</Link></li>
                <li><Link to="/courses/mern-stack-specialist" className="hover:text-white transition-colors">MERN Stack Specialist</Link></li>
                <li><Link to="/courses/data-science-genai" className="hover:text-white transition-colors">Data Science & GenAI</Link></li>
                <li><Link to="/courses/cloud-devops-kubernetes" className="hover:text-white transition-colors">DevOps & Kubernetes</Link></li>
                <li><Link to="/courses" className="text-indigo-400 hover:text-indigo-300 font-medium">View All Courses →</Link></li>
              </ul>
            </div>

            {/* Platform & Placements */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Services & Proof
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/placements" className="hover:text-white transition-colors">Placement Guarantee</Link></li>
                <li><Link to="/trainers" className="hover:text-white transition-colors">Industry Mentors</Link></li>
                <li><Link to="/testimonials" className="hover:text-white transition-colors">Student Testimonials</Link></li>
                <li><Link to="/achievements" className="hover:text-white transition-colors">Hackathons & Records</Link></li>
                <li><Link to="/college-partnerships" className="hover:text-white transition-colors">College MoUs</Link></li>
                <li><Link to="/corporate-training" className="hover:text-white transition-colors">Corporate Upskilling</Link></li>
                <li><Link to="/verify-certificate" className="text-emerald-400 hover:text-emerald-300 font-medium">Verify Certificate</Link></li>
              </ul>
            </div>

            {/* Institutional & Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Institute & Legal
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li><Link to="/about-us" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers at Academy</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Tech Blog & Articles</Link></li>
                <li><Link to="/faqs" className="hover:text-white transition-colors">FAQs</Link></li>
                <li><Link to="/contact-us" className="hover:text-white transition-colors">Contact & Enquiries</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>{copyrightText}</p>
            <div className="flex items-center gap-6">
              <Link to="/privacy-policy" className="hover:text-slate-400">Privacy</Link>
              <Link to="/terms-and-conditions" className="hover:text-slate-400">Terms</Link>
              <Link to="/refund-policy" className="hover:text-slate-400">Refund Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
