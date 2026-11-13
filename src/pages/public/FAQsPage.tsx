import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Search, HelpCircle, ArrowRight, MessageCircle } from 'lucide-react';
import { PageLabel } from '../../components/common/PageLabel';
import { Button } from '../../components/common/Button';
import { SEO } from '../../components/common/SEO';
import { cmsService, type FAQItem } from '../../services/cmsService';

export const FAQsPage: React.FC = () => {
  const [faqs] = useState<FAQItem[]>(() => cmsService.getFAQs());
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  const categories = ['All', 'Admissions', 'Fees & Payments', 'LMS & Attendance', 'Certificates', 'Placements'];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCat = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleFAQ = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExpandAll = () => {
    const allOpen: Record<string, boolean> = {};
    filteredFaqs.forEach((f) => (allOpen[f.id] = true));
    setOpenIds(allOpen);
  };

  const handleCollapseAll = () => {
    setOpenIds({});
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
      <SEO
        title="Frequently Asked Questions (FAQs)"
        description="Find answers regarding Nexelvoria Academy admissions, dual OTP verification, fees, 75% attendance rule, and placement guarantee."
        keywords={['Nexelvoria FAQs', 'Admission Questions', 'Fee Policy', 'LMS Attendance', 'Placement Guarantee']}
      />

      {/* Header */}
      <div className="text-center space-y-3">
        <PageLabel>Knowledge Base</PageLabel>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Common queries regarding Nexelvoria Academy admissions, fee structure, academic rules, and placement services.
        </p>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs by question or keyword (e.g. refund, attendance, placement)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleExpandAll}
              className="text-indigo-600 hover:underline font-semibold cursor-pointer"
            >
              Expand All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={handleCollapseAll}
              className="text-slate-500 hover:underline cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* FAQs List */}
      {filteredFaqs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
          <p className="text-sm font-bold text-slate-800">No matching questions found</p>
          <p className="text-xs text-slate-500">Try searching with a different keyword or contact our admissions team.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = !!openIds[faq.id];
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-colors"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <div className="space-y-1 pr-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {faq.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{faq.question}</h3>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-2 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Still Have Questions Box */}
      <div className="p-8 rounded-3xl bg-indigo-50 border border-indigo-100 text-center space-y-3">
        <h3 className="text-lg font-bold text-slate-900">Still Have Questions?</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Our senior counseling and academic operations leads are available to assist you via call or email.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link to="/contact-us">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Contact Admissions
            </Button>
          </Link>
          <a
            href="https://wa.me/919876543210?text=Hello%20Nexelvoria%20Academy%20Admissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="bg-white">
              WhatsApp Support
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};
