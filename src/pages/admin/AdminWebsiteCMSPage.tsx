import React, { useState, useEffect } from 'react';
import {
  Globe,
  Trophy,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  ExternalLink,
  Star,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { useNotification } from '../../context/NotificationContext';
import {
  cmsService,
  type WebsiteBanner,
  type BlogArticle,
  type FAQItem,
  type TrainerProfile,
  type TestimonialItem,
  type AchievementItem,
  type CareerOpening,
  type LeadEnquiry,
} from '../../services/cmsService';
import { formatDate } from '../../utils/formatters';
import { CMSHomePageTab } from '../../components/admin/cms/CMSHomePageTab';
import { CMSAboutUsTab } from '../../components/admin/cms/CMSAboutUsTab';
import { CMSHiringPartnersTab } from '../../components/admin/cms/CMSHiringPartnersTab';
import { CMSPartnershipsTab } from '../../components/admin/cms/CMSPartnershipsTab';
import { CMSContactHeaderFooterTab } from '../../components/admin/cms/CMSContactHeaderFooterTab';
import { CMSSEOAndMediaTab } from '../../components/admin/cms/CMSSEOAndMediaTab';

const AVATAR_PRESETS = [
  { label: 'Rohan (Male / SE)', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80' },
  { label: 'Pooja (Female / Frontend)', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
  { label: 'Arjun (Male / Cloud)', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80' },
  { label: 'Divya (Female / AI)', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80' },
  { label: 'Aditya (Male / Java)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Sneha (Female / Data)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
];

const TRAINER_AVATAR_PRESETS = [
  { label: 'Dr. Vikram Seth (Cloud Architect)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { label: 'Priya Sundaram (Principal Engineer)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
  { label: 'Aakash Verma (AI Research Lead)', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80' },
  { label: 'Meera Iyer (Engineering Director)', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80' },
  { label: 'Rohit Kulkarni (DevOps Lead)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
];

export const AdminWebsiteCMSPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    | 'homepage'
    | 'about'
    | 'partners'
    | 'partnerships'
    | 'banners'
    | 'blogs'
    | 'faqs'
    | 'trainers'
    | 'testimonials'
    | 'achievements'
    | 'careers'
    | 'contact-header'
    | 'seo-media'
    | 'enquiries'
  >('homepage');

  const { showToast } = useNotification();

  // Data states
  const [banners, setBanners] = useState<WebsiteBanner[]>([]);
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [trainers, setTrainers] = useState<TrainerProfile[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [careers, setCareers] = useState<CareerOpening[]>([]);
  const [enquiries, setEnquiries] = useState<LeadEnquiry[]>([]);

  // Edit Modals
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<WebsiteBanner | null>(null);

  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);

  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogArticle | null>(null);

  const [testimonialModalOpen, setTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);

  const [trainerModalOpen, setTrainerModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<TrainerProfile | null>(null);

  const [careerModalOpen, setCareerModalOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<CareerOpening | null>(null);

  const [achievementModalOpen, setAchievementModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<AchievementItem | null>(null);

  const loadData = () => {
    setBanners(cmsService.getBanners());
    setBlogs(cmsService.getArticles());
    setFaqs(cmsService.getFAQs());
    setTrainers(cmsService.getTrainers());
    setTestimonials(cmsService.getTestimonials());
    setAchievements(cmsService.getAchievements());
    setCareers(cmsService.getCareers());
    setEnquiries(cmsService.getEnquiries());
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Banner Actions (PUB-022) ---
  const handleToggleBanner = (id: string) => {
    const updated = banners.map((b) => ({
      ...b,
      isActive: b.id === id ? !b.isActive : false, // Only 1 active top banner at a time
    }));
    cmsService.updateBanners(updated);
    setBanners(updated);
    showToast({
      type: 'success',
      title: 'Banner Status Updated',
      message: 'Active announcement banner updated on the public website.',
    });
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    let updatedList: WebsiteBanner[];
    if (banners.some((b) => b.id === editingBanner.id)) {
      updatedList = banners.map((b) => (b.id === editingBanner.id ? editingBanner : b));
    } else {
      updatedList = [editingBanner, ...banners];
    }

    cmsService.updateBanners(updatedList);
    setBanners(updatedList);
    setBannerModalOpen(false);
    showToast({
      type: 'success',
      title: 'Banner Saved',
      message: 'Homepage announcement banner changes saved successfully.',
    });
  };

  const handleDeleteBanner = (id: string) => {
    cmsService.deleteBanner(id);
    setBanners(cmsService.getBanners());
    showToast({
      type: 'info',
      title: 'Banner Removed',
      message: 'Announcement banner removed from the system.',
    });
  };

  // --- FAQ Actions (PUB-012, PUB-023) ---
  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq) return;

    cmsService.saveFAQ(editingFaq);
    setFaqs(cmsService.getFAQs());
    setFaqModalOpen(false);
    showToast({
      type: 'success',
      title: 'FAQ Saved',
      message: 'Knowledge base question updated.',
    });
  };

  const handleDeleteFaq = (id: string) => {
    cmsService.deleteFAQ(id);
    setFaqs(cmsService.getFAQs());
    showToast({
      type: 'info',
      title: 'FAQ Deleted',
      message: 'Question removed from the public website.',
    });
  };

  // --- Blog Actions (PUB-013, PUB-023) ---
  const handleSaveBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;

    cmsService.saveArticle(editingBlog);
    setBlogs(cmsService.getArticles());
    setBlogModalOpen(false);
    showToast({
      type: 'success',
      title: 'Article Saved',
      message: 'Technical publication updated and live on /blog.',
    });
  };

  const handleDeleteBlog = (id: string) => {
    cmsService.deleteArticle(id);
    setBlogs(cmsService.getArticles());
    showToast({
      type: 'info',
      title: 'Article Removed',
      message: 'Article has been removed from the public catalog.',
    });
  };

  // --- Lead Enquiry Status Update ---
  const handleEnquiryStatusChange = (id: string, status: LeadEnquiry['status']) => {
    cmsService.updateEnquiryStatus(id, status);
    setEnquiries(cmsService.getEnquiries());
    showToast({
      type: 'success',
      title: 'Lead Status Updated',
      message: `Enquiry status changed to ${status}.`,
    });
  };

  // --- Testimonial Actions (PUB-009, PUB-010) ---
  const handleOpenAddTestimonial = () => {
    setEditingTestimonial({
      id: `t-${Date.now()}`,
      studentName: '',
      courseName: 'Full Stack Java Cloud Architecture',
      previousRole: 'B.Tech CSE Graduate',
      currentRole: 'Associate Software Engineer',
      companyName: '',
      packageCTC: '₹ 8.5 LPA',
      rating: 5,
      avatarUrl: AVATAR_PRESETS[0].url,
      quote: '',
      year: new Date().getFullYear().toString(),
    });
    setTestimonialModalOpen(true);
  };

  const handleOpenEditTestimonial = (item: TestimonialItem) => {
    setEditingTestimonial({ ...item });
    setTestimonialModalOpen(true);
  };

  const handleSaveTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;
    if (
      !editingTestimonial.studentName.trim() ||
      !editingTestimonial.companyName.trim() ||
      !editingTestimonial.quote.trim()
    ) {
      showToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please complete all required fields (Student Name, Company Name, Testimonial Quote).',
      });
      return;
    }

    cmsService.saveTestimonial(editingTestimonial);
    setTestimonials(cmsService.getTestimonials());
    setTestimonialModalOpen(false);
    showToast({
      type: 'success',
      title: 'Testimonial Saved',
      message: `Testimonial for ${editingTestimonial.studentName} has been saved and published to the website.`,
    });
  };

  const handleDeleteTestimonial = (id: string, name: string) => {
    cmsService.deleteTestimonial(id);
    setTestimonials(cmsService.getTestimonials());
    showToast({
      type: 'info',
      title: 'Testimonial Removed',
      message: `Testimonial for ${name} has been removed from the website.`,
    });
  };

  // --- Trainer Actions (PUB-006) ---
  const handleOpenAddTrainer = () => {
    setEditingTrainer({
      id: `tr-${Date.now()}`,
      name: '',
      role: 'Principal Technical Architect & Mentor',
      specialization: 'Full Stack Java Cloud Architecture & Microservices',
      experienceYears: 10,
      bio: '',
      qualifications: 'M.Tech CSE / Ex-Staff Architect',
      rating: 4.9,
      avatarUrl: TRAINER_AVATAR_PRESETS[0].url,
      formerCompanies: ['Amazon', 'Oracle'],
      linkedinUrl: 'https://linkedin.com',
      coursesTaught: ['Full Stack Java Cloud Architecture'],
    });
    setTrainerModalOpen(true);
  };

  const handleOpenEditTrainer = (trainer: TrainerProfile) => {
    setEditingTrainer({ ...trainer });
    setTrainerModalOpen(true);
  };

  const handleSaveTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer) return;
    if (
      !editingTrainer.name.trim() ||
      !editingTrainer.role.trim() ||
      !editingTrainer.specialization.trim()
    ) {
      showToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please complete all required fields (Trainer Name, Designation, Specialization).',
      });
      return;
    }

    cmsService.saveTrainer(editingTrainer);
    setTrainers(cmsService.getTrainers());
    setTrainerModalOpen(false);
    showToast({
      type: 'success',
      title: 'Trainer Profile Saved',
      message: `Profile for ${editingTrainer.name} has been published to /trainers.`,
    });
  };

  const handleDeleteTrainer = (id: string, name: string) => {
    cmsService.deleteTrainer(id);
    setTrainers(cmsService.getTrainers());
    showToast({
      type: 'info',
      title: 'Trainer Profile Removed',
      message: `Trainer profile for ${name} removed from the website.`,
    });
  };

  // --- Career / Job Opening Actions (PUB-014) ---
  const handleOpenAddCareer = () => {
    setEditingCareer({
      id: `car-${Date.now()}`,
      title: '',
      department: 'Technical Training',
      location: 'Hyderabad (Hybrid)',
      type: 'Full-time',
      experience: '3-6 Years',
      description: '',
      responsibilities: [
        'Deliver hands-on enterprise workshops and live coding masterclasses.',
        'Mentor learners through practical capstone microservices implementations.',
        'Conduct architectural design reviews and technical feedback sessions.',
      ],
      requirements: [
        '3+ years production microservices and cloud infrastructure experience.',
        'Strong pedagogical communication and mentoring empathy.',
        'Proficiency in Java / Spring Boot / AWS or modern MERN / Cloud Native stacks.',
      ],
      isActive: true,
    });
    setCareerModalOpen(true);
  };

  const handleOpenEditCareer = (career: CareerOpening) => {
    setEditingCareer({ ...career });
    setCareerModalOpen(true);
  };

  const handleToggleCareerActive = (id: string) => {
    const target = careers.find((c) => c.id === id);
    if (!target) return;
    const updated = { ...target, isActive: !target.isActive };
    cmsService.saveCareer(updated);
    setCareers(cmsService.getCareers());
    showToast({
      type: 'success',
      title: 'Job Status Updated',
      message: `Opening "${target.title}" is now ${updated.isActive ? 'Active (Accepting Applications)' : 'Closed'}.`,
    });
  };

  const handleSaveCareer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCareer) return;
    if (
      !editingCareer.title.trim() ||
      !editingCareer.department.trim() ||
      !editingCareer.description.trim()
    ) {
      showToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please complete all required fields (Job Title, Department, Description).',
      });
      return;
    }

    cmsService.saveCareer(editingCareer);
    setCareers(cmsService.getCareers());
    setCareerModalOpen(false);
    showToast({
      type: 'success',
      title: 'Career Opening Saved',
      message: `Job vacancy "${editingCareer.title}" saved and live on /careers.`,
    });
  };

  const handleDeleteCareer = (id: string, title: string) => {
    cmsService.deleteCareer(id);
    setCareers(cmsService.getCareers());
    showToast({
      type: 'info',
      title: 'Job Opening Removed',
      message: `Job vacancy "${title}" removed from the careers portal.`,
    });
  };

  // --- Student Achievement Actions (PUB-010) ---
  const handleOpenAddAchievement = () => {
    setEditingAchievement({
      id: `ach-${Date.now()}`,
      title: '',
      studentName: '',
      category: 'Hackathon',
      description: '',
      date: new Date().toISOString().split('T')[0],
      badge: '1st Place Winner',
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    });
    setAchievementModalOpen(true);
  };

  const handleOpenEditAchievement = (item: AchievementItem) => {
    setEditingAchievement({ ...item });
    setAchievementModalOpen(true);
  };

  const handleSaveAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAchievement) return;
    if (
      !editingAchievement.title.trim() ||
      !editingAchievement.studentName.trim() ||
      !editingAchievement.description.trim()
    ) {
      showToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please complete all required fields (Title, Student Name, Description).',
      });
      return;
    }

    cmsService.saveAchievement(editingAchievement);
    setAchievements(cmsService.getAchievements());
    setAchievementModalOpen(false);
    showToast({
      type: 'success',
      title: 'Achievement Published',
      message: `Milestone for ${editingAchievement.studentName} is now live on /achievements.`,
    });
  };

  const handleDeleteAchievement = (id: string, title: string) => {
    cmsService.deleteAchievement(id);
    setAchievements(cmsService.getAchievements());
    showToast({
      type: 'info',
      title: 'Achievement Removed',
      message: `Achievement "${title}" removed from the website.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Website & CMS Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage public website banners, articles, FAQs, mentor profiles, and inspect incoming leads (SRS PUB-022, PUB-023).
          </p>
        </div>

        <a href="/" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" rightIcon={<ExternalLink className="h-4 w-4" />}>
            Preview Live Public Website
          </Button>
        </a>
      </div>

      {/* Mock Persistence Callout */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 leading-relaxed">
          <strong>CMS Storage Abstraction (PUB-023):</strong> Changes saved here update browser storage (<code>localStorage</code>) in real-time, immediately reflected on public routes without page reloads. In production, these services seamlessly bridge with <code>/api/v1/cms/*</code> Spring Boot endpoints.
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1.5 sm:gap-2 overflow-x-auto text-xs pb-1 scrollbar-thin">
        <button
          onClick={() => setActiveTab('homepage')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'homepage' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Homepage & Stats
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'about' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          About Us & Mission
        </button>
        <button
          onClick={() => setActiveTab('partners')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'partners' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Hiring Partners & Marquee
        </button>
        <button
          onClick={() => setActiveTab('partnerships')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'partnerships' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          College MoUs & Corporate
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'banners' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Top Banners ({banners.length})
        </button>
        <button
          onClick={() => setActiveTab('blogs')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'blogs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Blog & Articles ({blogs.length})
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'faqs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          FAQs ({faqs.length})
        </button>
        <button
          onClick={() => setActiveTab('trainers')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'trainers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Faculty Profiles ({trainers.length})
        </button>
        <button
          onClick={() => setActiveTab('testimonials')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'testimonials' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Testimonials ({testimonials.length})
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'achievements' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Milestones ({achievements.length})
        </button>
        <button
          onClick={() => setActiveTab('careers')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'careers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Job Postings ({careers.length})
        </button>
        <button
          onClick={() => setActiveTab('contact-header')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'contact-header' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Contact & Header/Footer
        </button>
        <button
          onClick={() => setActiveTab('seo-media')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'seo-media' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          SEO & Media Library
        </button>
        <button
          onClick={() => setActiveTab('enquiries')}
          className={`pb-2.5 px-3 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'enquiries' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Incoming Leads</span>
          <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
            {enquiries.length}
          </span>
        </button>
      </div>

      {/* --- NEW CMS MODULES --- */}
      {activeTab === 'homepage' && <CMSHomePageTab />}
      {activeTab === 'about' && <CMSAboutUsTab />}
      {activeTab === 'partners' && <CMSHiringPartnersTab />}
      {activeTab === 'partnerships' && <CMSPartnershipsTab />}
      {activeTab === 'contact-header' && <CMSContactHeaderFooterTab />}
      {activeTab === 'seo-media' && <CMSSEOAndMediaTab />}

      {/* --- TAB 1: Banners Management (PUB-022) --- */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Homepage Announcement Banners</h2>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingBanner({
                  id: `ban-${Date.now()}`,
                  text: 'New batch admission alert with scholarship discount',
                  badgeText: 'Batch Alert',
                  linkText: 'Register Now',
                  linkUrl: '/register',
                  isActive: false,
                  theme: 'indigo',
                });
                setBannerModalOpen(true);
              }}
            >
              Add New Banner
            </Button>
          </div>

          <div className="space-y-3">
            {banners.map((b) => (
              <Card key={b.id} className="p-5 flex items-center justify-between gap-4 bg-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {b.badgeText}
                    </span>
                    {b.isActive ? (
                      <Badge variant="success" size="sm">Currently Active</Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">Inactive</Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-900">{b.text}</p>
                  <p className="text-xs text-slate-400">
                    CTA Link: <strong>{b.linkText}</strong> → <span className="font-mono">{b.linkUrl}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant={b.isActive ? 'outline' : 'primary'}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleToggleBanner(b.id)}
                  >
                    {b.isActive ? 'Deactivate' : 'Set as Active'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingBanner(b);
                      setBannerModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteBanner(b.id)}
                    title="Delete Banner"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 2: Blog & Articles (PUB-013) --- */}
      {activeTab === 'blogs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Technical Articles & Career Publications</h2>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingBlog({
                  id: `blog-${Date.now()}`,
                  slug: `technical-guide-${Date.now()}`,
                  title: '',
                  category: 'Java & Cloud',
                  author: 'Dr. Vikram Seth',
                  authorRole: 'Chief Technical Instructor',
                  authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                  date: new Date().toISOString().split('T')[0],
                  readTime: '6 min read',
                  excerpt: '',
                  content: [''],
                  tags: ['Java', 'Architecture'],
                  featuredImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
                });
                setBlogModalOpen(true);
              }}
            >
              Write New Article
            </Button>
          </div>

          <div className="space-y-3">
            {blogs.map((art) => (
              <Card key={art.id} className="p-5 flex items-center justify-between gap-4 bg-white">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                      {art.category}
                    </span>
                    <span className="text-slate-400">{art.readTime} • {formatDate(art.date)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{art.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{art.excerpt}</p>
                  <p className="text-[11px] text-slate-400">Author: {art.author} ({art.authorRole})</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a href={`/blog/${art.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="text-xs">
                      View
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingBlog(art);
                      setBlogModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 text-slate-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:text-rose-700"
                    onClick={() => handleDeleteBlog(art.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: FAQs Knowledge Base (PUB-012) --- */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Knowledge Base & FAQs</h2>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditingFaq({
                  id: `faq-${Date.now()}`,
                  category: 'Admissions',
                  question: '',
                  answer: '',
                  order: faqs.length + 1,
                });
                setFaqModalOpen(true);
              }}
            >
              Add FAQ
            </Button>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <Card key={faq.id} className="p-5 flex items-start justify-between gap-4 bg-white">
                <div className="space-y-1 max-w-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {faq.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{faq.question}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingFaq(faq);
                      setFaqModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 text-slate-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:text-rose-700"
                    onClick={() => handleDeleteFaq(faq.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: Incoming Leads & Enquiries --- */}
      {activeTab === 'enquiries' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Prospective Student Leads & Callback Inquiries</h2>
              <p className="text-xs text-slate-500">Live submissions captured from public contact and course enquiry forms.</p>
            </div>
            <Badge variant="purple" size="md">{enquiries.length} Total Leads</Badge>
          </div>

          {enquiries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
              <p className="text-sm font-bold text-slate-800">No lead submissions yet</p>
              <p className="text-xs text-slate-500">Submissions from the public contact forms and course enquiry modals will show up here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enquiries.map((enq) => (
                <Card key={enq.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {enq.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(enq.submittedAt)}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          enq.status === 'new'
                            ? 'bg-amber-100 text-amber-800'
                            : enq.status === 'contacted'
                            ? 'bg-sky-100 text-sky-800'
                            : enq.status === 'enrolled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {enq.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{enq.name}</h3>
                    <div className="text-xs text-slate-600 flex flex-wrap gap-4">
                      {enq.phone && <span>Phone: <strong>{enq.phone}</strong></span>}
                      {enq.email && <span>Email: <strong>{enq.email}</strong></span>}
                      {enq.courseOfInterest && <span>Program: <strong>{enq.courseOfInterest}</strong></span>}
                      {enq.preferredTimeSlot && <span>Slot: <strong>{enq.preferredTimeSlot}</strong></span>}
                    </div>
                    {enq.message && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                        &quot;{enq.message}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={enq.status}
                      onChange={(e) => handleEnquiryStatusChange(enq.id, e.target.value as LeadEnquiry['status'])}
                      className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-700"
                    >
                      <option value="new">New Lead</option>
                      <option value="contacted">Contacted</option>
                      <option value="enrolled">Enrolled</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 5: Faculty Profiles (PUB-006) --- */}
      {activeTab === 'trainers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Faculty & Trainer Profiles (PUB-006)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage faculty profiles, technical architects, and industry mentors displayed on /trainers.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleOpenAddTrainer}
            >
              Add Trainer Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trainers.map((tr) => (
              <Card key={tr.id} className="p-5 flex flex-col justify-between space-y-4 bg-white border border-slate-200 shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={tr.avatarUrl}
                      alt={tr.name}
                      className="h-14 w-14 rounded-xl object-cover object-top border border-slate-200 shrink-0 shadow-xs"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{tr.name}</h3>
                      <p className="text-xs text-indigo-600 font-medium truncate">{tr.role}</p>
                      <div className="flex items-center gap-1 mt-1 text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-[11px] font-bold text-slate-700">{tr.rating.toFixed(1)}</span>
                        <span className="text-[11px] text-slate-400 ml-1">({tr.experienceYears}+ yrs exp)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Specialization</span>
                    <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-0.5">{tr.specialization}</p>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Former Companies:</span>{' '}
                    {tr.formerCompanies && tr.formerCompanies.length > 0 ? tr.formerCompanies.join(', ') : 'N/A'}
                  </div>

                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Courses:</span>{' '}
                    {tr.coursesTaught && tr.coursesTaught.length > 0 ? tr.coursesTaught.join(', ') : 'General Tracks'}
                  </div>

                  {tr.bio && (
                    <p className="text-xs text-slate-500 line-clamp-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {tr.bio}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditTrainer(tr)}
                    leftIcon={<Edit className="h-3 w-3" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteTrainer(tr.id, tr.name)}
                    leftIcon={<Trash2 className="h-3 w-3" />}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 6: Testimonials & Achievements --- */}
      {activeTab === 'testimonials' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Reviews & Placement Stories (PUB-009)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage alumni reviews, verified placement transformations, and public website testimonials.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddTestimonial}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Testimonial
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <Card key={t.id} className="p-5 flex flex-col justify-between space-y-4 bg-white border border-slate-200 shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={t.avatarUrl}
                        alt={t.studentName}
                        className="h-14 w-14 rounded-xl object-cover object-top border border-slate-200 shrink-0 shadow-xs"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{t.studentName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({t.year})</span>
                        </div>
                        <p className="text-xs text-indigo-600 font-semibold">{t.currentRole} at {t.companyName}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{t.courseName}</p>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">{t.packageCTC}</Badge>
                  </div>

                  <p className="text-xs text-slate-600 italic line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    &quot;{t.quote}&quot;
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                    <span className="text-[11px] text-slate-400 ml-1">({t.rating || 5}.0)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditTestimonial(t)}
                      leftIcon={<Edit className="h-3 w-3" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteTestimonial(t.id, t.studentName)}
                      leftIcon={<Trash2 className="h-3 w-3" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB: Student Achievements (PUB-010) --- */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Achievements & Hackathon Milestones (PUB-010)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Highlight national hackathon awards, open-source milestones, and fast-track promotions on /achievements.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleOpenAddAchievement}
            >
              Add Milestone
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((a) => (
              <Card key={a.id} className="p-5 flex flex-col justify-between space-y-4 bg-white border border-slate-200 shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {a.photoUrl && (
                        <img
                          src={a.photoUrl}
                          alt={a.studentName}
                          className="h-12 w-12 rounded-xl object-cover object-top border border-slate-200 shrink-0 shadow-xs"
                        />
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                        <p className="text-xs text-indigo-600 font-semibold">{a.studentName}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{formatDate(a.date)}</p>
                      </div>
                    </div>
                    <Badge variant="purple" size="sm">{a.category}</Badge>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                    <Trophy className="h-3.5 w-3.5 text-amber-600" />
                    <span>{a.badge}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {a.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditAchievement(a)}
                    leftIcon={<Edit className="h-3 w-3" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteAchievement(a.id, a.title)}
                    leftIcon={<Trash2 className="h-3 w-3" />}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 7: Careers & Job Vacancies (PUB-014) --- */}
      {activeTab === 'careers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Career Openings & Faculty Hiring (PUB-014)</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage open institute vacancies and instructor hiring drives live on /careers.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleOpenAddCareer}
            >
              Post New Opening
            </Button>
          </div>

          <div className="space-y-3">
            {careers.map((job) => (
              <Card key={job.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 shadow-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{job.title}</h3>
                    <Badge variant={job.isActive ? 'success' : 'neutral'} size="sm">
                      {job.isActive ? 'Active (Accepting Applications)' : 'Closed'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{job.department}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.type}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">Exp: {job.experience}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl">
                    {job.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <Button
                    variant={job.isActive ? 'outline' : 'primary'}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleToggleCareerActive(job.id)}
                  >
                    {job.isActive ? 'Close Opening' : 'Reactivate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditCareer(job)}
                  >
                    <Edit className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteCareer(job.id, job.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- Banner Edit Modal --- */}
      <Modal
        isOpen={bannerModalOpen}
        onClose={() => setBannerModalOpen(false)}
        title="Edit Website Announcement Banner"
        description="Configure banner text, badge label, and target destination URL (PUB-022)."
      >
        {editingBanner && (
          <form onSubmit={handleSaveBanner} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Banner Headline Text *</label>
              <input
                type="text"
                required
                value={editingBanner.text}
                onChange={(e) => setEditingBanner({ ...editingBanner, text: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Badge Text *</label>
                <input
                  type="text"
                  required
                  value={editingBanner.badgeText}
                  onChange={(e) => setEditingBanner({ ...editingBanner, badgeText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Theme</label>
                <select
                  value={editingBanner.theme}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, theme: e.target.value as WebsiteBanner['theme'] })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="indigo">Indigo / Blue</option>
                  <option value="emerald">Emerald / Green</option>
                  <option value="amber">Amber / Orange</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">CTA Link Text *</label>
                <input
                  type="text"
                  required
                  value={editingBanner.linkText}
                  onChange={(e) => setEditingBanner({ ...editingBanner, linkText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">CTA Destination URL *</label>
                <input
                  type="text"
                  required
                  value={editingBanner.linkUrl}
                  onChange={(e) => setEditingBanner({ ...editingBanner, linkUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setBannerModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Banner
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- FAQ Edit Modal --- */}
      <Modal
        isOpen={faqModalOpen}
        onClose={() => setFaqModalOpen(false)}
        title="Edit Knowledge Base FAQ"
        description="Provide clear, concise answers reflecting institute policies."
      >
        {editingFaq && (
          <form onSubmit={handleSaveFaq} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={editingFaq.category}
                onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value as FAQItem['category'] })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Admissions">Admissions</option>
                <option value="Fees & Payments">Fees & Payments</option>
                <option value="LMS & Attendance">LMS & Attendance</option>
                <option value="Certificates">Certificates</option>
                <option value="Placements">Placements</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Question *</label>
              <input
                type="text"
                required
                value={editingFaq.question}
                onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Answer *</label>
              <textarea
                rows={4}
                required
                value={editingFaq.answer}
                onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setFaqModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save FAQ
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- Blog Edit Modal --- */}
      <Modal
        isOpen={blogModalOpen}
        onClose={() => setBlogModalOpen(false)}
        title="Author / Edit Technical Article"
        description="Publish in-depth architectural guides and career roadmaps to the public engineering blog."
      >
        {editingBlog && (
          <form onSubmit={handleSaveBlog} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Article Title *</label>
              <input
                type="text"
                required
                value={editingBlog.title}
                onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
                placeholder="e.g. Scaling Virtual Threads in Spring Boot 3"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={editingBlog.category}
                  onChange={(e) => setEditingBlog({ ...editingBlog, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Java & Cloud">Java & Cloud</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Placement Prep">Placement Prep</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Data & AI">Data & AI</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Read Time Estimate *</label>
                <input
                  type="text"
                  required
                  value={editingBlog.readTime}
                  onChange={(e) => setEditingBlog({ ...editingBlog, readTime: e.target.value })}
                  placeholder="e.g. 5 min read"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Excerpt / Summary *</label>
              <textarea
                rows={2}
                required
                value={editingBlog.excerpt}
                onChange={(e) => setEditingBlog({ ...editingBlog, excerpt: e.target.value })}
                placeholder="Short teaser displayed on card previews..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Content Paragraphs (One per line) *</label>
              <textarea
                rows={5}
                required
                value={editingBlog.content.join('\n\n')}
                onChange={(e) =>
                  setEditingBlog({ ...editingBlog, content: e.target.value.split('\n\n').filter(Boolean) })
                }
                placeholder="Write your article paragraphs here separated by blank lines..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setBlogModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Publish Article
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- Testimonial Create / Edit Modal (PUB-009, PUB-010) --- */}
      <Modal
        isOpen={testimonialModalOpen}
        onClose={() => setTestimonialModalOpen(false)}
        title={
          editingTestimonial && testimonials.some((t) => t.id === editingTestimonial.id)
            ? 'Edit Student Testimonial'
            : 'Add New Student Testimonial'
        }
        description="Publish verified alumni career transformations, salary packages, and testimonials to the public website."
        size="md"
      >
        {editingTestimonial && (
          <form onSubmit={handleSaveTestimonial} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingTestimonial.studentName}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, studentName: e.target.value })
                  }
                  placeholder="e.g. Rohan Sharma"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Placement Year *</label>
                <input
                  type="text"
                  required
                  value={editingTestimonial.year}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, year: e.target.value })
                  }
                  placeholder="e.g. 2026"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Completed Course / Program *</label>
              <select
                value={editingTestimonial.courseName}
                onChange={(e) =>
                  setEditingTestimonial({ ...editingTestimonial, courseName: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Full Stack Java Cloud Architecture">Full Stack Java Cloud Architecture</option>
                <option value="MERN Stack Cloud Native Specialist">MERN Stack Cloud Native Specialist</option>
                <option value="DevOps & Cloud Architecture">DevOps & Cloud Architecture</option>
                <option value="Data Science & Generative AI Systems">Data Science & Generative AI Systems</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Placed Role / Designation *</label>
                <input
                  type="text"
                  required
                  value={editingTestimonial.currentRole}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, currentRole: e.target.value })
                  }
                  placeholder="e.g. Associate Software Engineer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hiring Enterprise / Company *</label>
                <input
                  type="text"
                  required
                  value={editingTestimonial.companyName}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, companyName: e.target.value })
                  }
                  placeholder="e.g. Infosys Ltd"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Annual Package (CTC) *</label>
                <input
                  type="text"
                  required
                  value={editingTestimonial.packageCTC}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, packageCTC: e.target.value })
                  }
                  placeholder="e.g. ₹ 8.5 LPA"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Previous Background / Degree</label>
                <input
                  type="text"
                  value={editingTestimonial.previousRole}
                  onChange={(e) =>
                    setEditingTestimonial({ ...editingTestimonial, previousRole: e.target.value })
                  }
                  placeholder="e.g. B.Tech Graduate (Tier-3 College)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Star Rating</label>
              <select
                value={editingTestimonial.rating || 5}
                onChange={(e) =>
                  setEditingTestimonial({ ...editingTestimonial, rating: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
              >
                <option value={5}>★★★★★ (5 Stars - Outstanding Transformation)</option>
                <option value={4}>★★★★☆ (4 Stars - Highly Recommended)</option>
                <option value={3}>★★★☆☆ (3 Stars - Satisfactory)</option>
              </select>
            </div>

            {/* Student Image Selection & Live Preview */}
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                Student Headshot Photo (PUB-009)
              </label>

              <div className="flex items-center gap-4">
                <img
                  src={editingTestimonial.avatarUrl || AVATAR_PRESETS[0].url}
                  alt="Student Preview"
                  className="h-16 w-16 rounded-2xl object-cover object-top border-2 border-indigo-200 shadow-sm shrink-0 bg-white"
                />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <input
                    type="url"
                    required
                    value={editingTestimonial.avatarUrl}
                    onChange={(e) =>
                      setEditingTestimonial({ ...editingTestimonial, avatarUrl: e.target.value })
                    }
                    placeholder="Enter student photo URL..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-medium">Quick Presets:</span>
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setEditingTestimonial({ ...editingTestimonial, avatarUrl: preset.url })
                        }
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          editingTestimonial.avatarUrl === preset.url
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Testimonial Content / Quote *</label>
              <textarea
                rows={4}
                required
                value={editingTestimonial.quote}
                onChange={(e) =>
                  setEditingTestimonial({ ...editingTestimonial, quote: e.target.value })
                }
                placeholder="Share the student's journey, practical lab experience, and how the program helped them crack enterprise placement drives..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setTestimonialModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save & Publish Testimonial
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- Faculty / Trainer Profile Create / Edit Modal (PUB-006) --- */}
      <Modal
        isOpen={trainerModalOpen}
        onClose={() => setTrainerModalOpen(false)}
        title={
          editingTrainer && trainers.some((t) => t.id === editingTrainer.id)
            ? 'Edit Faculty & Mentor Profile'
            : 'Add New Faculty & Mentor Profile'
        }
        description="Publish technical faculty credentials, certifications, and enterprise background to the public website."
        size="lg"
      >
        {editingTrainer && (
          <form onSubmit={handleSaveTrainer} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trainer Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingTrainer.name}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, name: e.target.value })}
                  placeholder="e.g. Dr. Vikram Seth"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designation / Role *</label>
                <input
                  type="text"
                  required
                  value={editingTrainer.role}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, role: e.target.value })}
                  placeholder="e.g. Chief Technical Instructor & Architect"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Technical Specialization *</label>
                <input
                  type="text"
                  required
                  value={editingTrainer.specialization}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, specialization: e.target.value })}
                  placeholder="e.g. Java Microservices, Spring Cloud, AWS Solutions"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Years of Experience *</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  required
                  value={editingTrainer.experienceYears}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, experienceYears: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Qualifications & Degrees</label>
                <input
                  type="text"
                  value={editingTrainer.qualifications}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, qualifications: e.target.value })}
                  placeholder="e.g. Ph.D. in Computer Science / AWS SA Pro"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Rating (out of 5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="3.0"
                  max="5.0"
                  value={editingTrainer.rating}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, rating: parseFloat(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Former Companies (Comma-separated)</label>
                <input
                  type="text"
                  value={editingTrainer.formerCompanies.join(', ')}
                  onChange={(e) =>
                    setEditingTrainer({
                      ...editingTrainer,
                      formerCompanies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g. Amazon, Oracle, Infosys"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Courses Taught (Comma-separated)</label>
                <input
                  type="text"
                  value={editingTrainer.coursesTaught.join(', ')}
                  onChange={(e) =>
                    setEditingTrainer({
                      ...editingTrainer,
                      coursesTaught: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g. Full Stack Java Cloud, DevOps Microservices"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Faculty Photo Selection */}
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                Faculty Headshot Photo URL
              </label>
              <div className="flex items-center gap-4">
                <img
                  src={editingTrainer.avatarUrl || TRAINER_AVATAR_PRESETS[0].url}
                  alt="Faculty Preview"
                  className="h-16 w-16 rounded-2xl object-cover object-top border-2 border-indigo-200 shadow-sm shrink-0 bg-white"
                />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <input
                    type="url"
                    required
                    value={editingTrainer.avatarUrl}
                    onChange={(e) => setEditingTrainer({ ...editingTrainer, avatarUrl: e.target.value })}
                    placeholder="Enter faculty photo URL..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-medium">Quick Presets:</span>
                    {TRAINER_AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingTrainer({ ...editingTrainer, avatarUrl: preset.url })}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          editingTrainer.avatarUrl === preset.url
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Faculty Bio & Industry Profile</label>
              <textarea
                rows={3}
                value={editingTrainer.bio}
                onChange={(e) => setEditingTrainer({ ...editingTrainer, bio: e.target.value })}
                placeholder="Overview of engineering achievements, industry leadership, and pedagogical methodology..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setTrainerModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save & Publish Faculty Profile
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- Career Opening Create / Edit Modal (PUB-014) --- */}
      <Modal
        isOpen={careerModalOpen}
        onClose={() => setCareerModalOpen(false)}
        title={
          editingCareer && careers.some((c) => c.id === editingCareer.id)
            ? 'Edit Career Vacancy'
            : 'Post New Career Opening'
        }
        description="Publish instructor, academic, and administrative hiring drives live on the public careers portal."
        size="lg"
      >
        {editingCareer && (
          <form onSubmit={handleSaveCareer} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={editingCareer.title}
                  onChange={(e) => setEditingCareer({ ...editingCareer, title: e.target.value })}
                  placeholder="e.g. Lead Instructor – Full Stack Java"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                <select
                  value={editingCareer.department}
                  onChange={(e) => setEditingCareer({ ...editingCareer, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Technical Training">Technical Training</option>
                  <option value="Curriculum & Architecture">Curriculum & Architecture</option>
                  <option value="Placement & Corporate Relations">Placement & Corporate Relations</option>
                  <option value="Student Success & Operations">Student Success & Operations</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={editingCareer.location}
                  onChange={(e) => setEditingCareer({ ...editingCareer, location: e.target.value })}
                  placeholder="e.g. Hyderabad (Hybrid)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employment Type *</label>
                <select
                  value={editingCareer.type}
                  onChange={(e) => setEditingCareer({ ...editingCareer, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract / Visiting">Contract / Visiting</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Experience Required *</label>
                <input
                  type="text"
                  required
                  value={editingCareer.experience}
                  onChange={(e) => setEditingCareer({ ...editingCareer, experience: e.target.value })}
                  placeholder="e.g. 3-6 Years"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Job Description & Role Summary *</label>
              <textarea
                rows={3}
                required
                value={editingCareer.description}
                onChange={(e) => setEditingCareer({ ...editingCareer, description: e.target.value })}
                placeholder="High-level summary of the opening and team objectives..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Key Responsibilities (One per line)</label>
              <textarea
                rows={3}
                value={editingCareer.responsibilities.join('\n')}
                onChange={(e) =>
                  setEditingCareer({
                    ...editingCareer,
                    responsibilities: e.target.value.split('\n').filter((s) => s.trim().length > 0),
                  })
                }
                placeholder="Deliver interactive hands-on workshops&#10;Mentor students through capstone implementations"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Requirements & Qualifications (One per line)</label>
              <textarea
                rows={3}
                value={editingCareer.requirements.join('\n')}
                onChange={(e) =>
                  setEditingCareer({
                    ...editingCareer,
                    requirements: e.target.value.split('\n').filter((s) => s.trim().length > 0),
                  })
                }
                placeholder="3+ years production microservices experience&#10;Strong communication skills"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="careerActiveCheck"
                checked={editingCareer.isActive}
                onChange={(e) => setEditingCareer({ ...editingCareer, isActive: e.target.checked })}
                className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="careerActiveCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Accept Applications (Live on Careers Page)
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setCareerModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save & Publish Opening
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- Student Achievement Create / Edit Modal (PUB-010) --- */}
      <Modal
        isOpen={achievementModalOpen}
        onClose={() => setAchievementModalOpen(false)}
        title={
          editingAchievement && achievements.some((a) => a.id === editingAchievement.id)
            ? 'Edit Student Achievement'
            : 'Add New Student Milestone'
        }
        description="Publish hackathon triumphs, certifications, and student honors to the public milestones showcase."
        size="md"
      >
        {editingAchievement && (
          <form onSubmit={handleSaveAchievement} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingAchievement.studentName}
                  onChange={(e) => setEditingAchievement({ ...editingAchievement, studentName: e.target.value })}
                  placeholder="e.g. Rohit Kulkarni"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Milestone Category *</label>
                <select
                  value={editingAchievement.category}
                  onChange={(e) =>
                    setEditingAchievement({
                      ...editingAchievement,
                      category: e.target.value as AchievementItem['category'],
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Hackathon">Hackathon</option>
                  <option value="Placement Milestone">Placement Milestone</option>
                  <option value="Open Source">Open Source</option>
                  <option value="Promotion">Promotion</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Achievement / Event Title *</label>
              <input
                type="text"
                required
                value={editingAchievement.title}
                onChange={(e) => setEditingAchievement({ ...editingAchievement, title: e.target.value })}
                placeholder="e.g. Smart India Hackathon Grand Finale Winner"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Award / Badge Label *</label>
                <input
                  type="text"
                  required
                  value={editingAchievement.badge}
                  onChange={(e) => setEditingAchievement({ ...editingAchievement, badge: e.target.value })}
                  placeholder="e.g. 1st Place National Winner"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date Achieved *</label>
                <input
                  type="date"
                  required
                  value={editingAchievement.date}
                  onChange={(e) => setEditingAchievement({ ...editingAchievement, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student Photo URL</label>
              <input
                type="url"
                value={editingAchievement.photoUrl || ''}
                onChange={(e) => setEditingAchievement({ ...editingAchievement, photoUrl: e.target.value })}
                placeholder="Enter photo URL..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Achievement Description *</label>
              <textarea
                rows={3}
                required
                value={editingAchievement.description}
                onChange={(e) => setEditingAchievement({ ...editingAchievement, description: e.target.value })}
                placeholder="Explain the project, technical stack used, and competition impact..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setAchievementModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Publish Milestone
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

