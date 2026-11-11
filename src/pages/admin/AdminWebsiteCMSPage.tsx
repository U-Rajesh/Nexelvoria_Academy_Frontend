import React, { useState, useEffect } from 'react';
import {
  Globe,
  LayoutTemplate,
  FileText,
  HelpCircle,
  Users,
  Trophy,
  Briefcase,
  Mail,
  Phone,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Save,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
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
import { APP_CONFIG } from '../../constants/appConfig';
import { formatDate } from '../../utils/formatters';

export const AdminWebsiteCMSPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'banners' | 'blogs' | 'faqs' | 'trainers' | 'testimonials' | 'careers' | 'enquiries'
  >('banners');

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
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto text-xs pb-1">
        <button
          onClick={() => setActiveTab('banners')}
          className={`pb-2.5 px-2 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'banners' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Top Banners (PUB-022)
        </button>
        <button
          onClick={() => setActiveTab('blogs')}
          className={`pb-2.5 px-2 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'blogs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Blog & Articles ({blogs.length})
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`pb-2.5 px-2 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'faqs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          FAQs Knowledge Base ({faqs.length})
        </button>
        <button
          onClick={() => setActiveTab('enquiries')}
          className={`pb-2.5 px-2 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'enquiries' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Incoming Leads & Enquiries</span>
          <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
            {enquiries.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('trainers')}
          className={`pb-2.5 px-2 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'trainers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Faculty Profiles
        </button>
        <button
          onClick={() => setActiveTab('testimonials')}
          className={`pb-2.5 px-2 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'testimonials' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Testimonials & Records
        </button>
        <button
          onClick={() => setActiveTab('careers')}
          className={`pb-2.5 px-2 font-bold transition-colors cursor-pointer border-b-2 -mb-1.5 whitespace-nowrap ${
            activeTab === 'careers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Job Postings ({careers.length})
        </button>
      </div>

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

      {/* --- TAB 5: Faculty Profiles --- */}
      {activeTab === 'trainers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Faculty & Trainer Profiles</h2>
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Add Trainer Profile
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trainers.map((tr) => (
              <Card key={tr.id} className="p-5 space-y-3 bg-white">
                <div className="flex items-center gap-3">
                  <img src={tr.avatarUrl} alt={tr.name} className="h-12 w-12 rounded-xl object-cover" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{tr.name}</h3>
                    <p className="text-xs text-indigo-600 font-medium">{tr.role}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{tr.specialization}</p>
                <div className="text-[11px] text-slate-400">Former: {tr.formerCompanies.join(', ')}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 6: Testimonials & Achievements --- */}
      {activeTab === 'testimonials' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Student Reviews & Placement Stories</h2>
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Add Testimonial
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <Card key={t.id} className="p-5 space-y-2 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{t.studentName}</span>
                  <Badge variant="success" size="sm">{t.packageCTC}</Badge>
                </div>
                <p className="text-xs text-indigo-600 font-medium">{t.currentRole} at {t.companyName}</p>
                <p className="text-xs text-slate-600 italic">&quot;{t.quote}&quot;</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 7: Careers --- */}
      {activeTab === 'careers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Open Job Vacancies</h2>
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Post New Opening
            </Button>
          </div>

          <div className="space-y-3">
            {careers.map((job) => (
              <Card key={job.id} className="p-5 flex items-center justify-between gap-4 bg-white">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{job.title}</h3>
                  <p className="text-xs text-slate-500">{job.department} • {job.location} ({job.experience})</p>
                </div>
                <Badge variant={job.isActive ? 'success' : 'neutral'} size="sm">
                  {job.isActive ? 'Active' : 'Closed'}
                </Badge>
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
    </div>
  );
};

