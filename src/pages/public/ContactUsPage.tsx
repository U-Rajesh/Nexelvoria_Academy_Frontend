import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, CheckCircle2, AlertCircle, PhoneCall } from 'lucide-react';
import { APP_CONFIG } from '../../constants/appConfig';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { SEO } from '../../components/common/SEO';
import { SEED_COURSES } from '../../mocks/seedData';
import { cmsService } from '../../services/cmsService';
import { useNotification } from '../../context/NotificationContext';
import { analytics } from '../../utils/analytics';

export const ContactUsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'admission' | 'callback'>('admission');

  // Forms states
  const [generalForm, setGeneralForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [admissionForm, setAdmissionForm] = useState({ name: '', email: '', phone: '', course: '', college: '', message: '' });
  const [callbackForm, setCallbackForm] = useState({ name: '', phone: '', course: '', timeSlot: 'Morning (9 AM - 12 PM)' });

  const { showToast } = useNotification();

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cmsService.submitEnquiry({
      type: 'general',
      name: generalForm.name,
      email: generalForm.email,
      phone: '',
      message: `[Subject: ${generalForm.subject}] ${generalForm.message}`,
    });
    analytics.trackEvent('submit_general_contact', 'Lead', generalForm.subject);

    showToast({
      type: 'success',
      title: 'Message Sent',
      message: 'Thank you for reaching out to Nexelvoria Academy. Our team will respond within 24 hours.',
    });
    setGeneralForm({ name: '', email: '', subject: '', message: '' });
  };

  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cmsService.submitEnquiry({
      type: 'course_admission',
      name: admissionForm.name,
      email: admissionForm.email,
      phone: admissionForm.phone,
      courseOfInterest: admissionForm.course,
      organization: admissionForm.college,
      message: admissionForm.message,
    });
    analytics.trackEvent('submit_admission_enquiry', 'Lead', admissionForm.course);

    showToast({
      type: 'success',
      title: 'Admission Enquiry Logged',
      message: `Thank you ${admissionForm.name}! An admissions advisor has been assigned and will call you with syllabus & fee details.`,
    });
    setAdmissionForm({ name: '', email: '', phone: '', course: '', college: '', message: '' });
  };

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cmsService.submitEnquiry({
      type: 'callback',
      name: callbackForm.name,
      phone: callbackForm.phone,
      courseOfInterest: callbackForm.course,
      preferredTimeSlot: callbackForm.timeSlot,
    });
    analytics.trackEvent('submit_callback_request', 'Lead', callbackForm.timeSlot);

    showToast({
      type: 'success',
      title: 'Callback Scheduled',
      message: `Your callback request has been prioritized. We will call you at ${callbackForm.phone} during ${callbackForm.timeSlot}.`,
    });
    setCallbackForm({ name: '', phone: '', course: '', timeSlot: 'Morning (9 AM - 12 PM)' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
      <SEO
        title="Contact Us – Admissions, Enquiries & Callback Requests"
        description="Connect with Nexelvoria Academy admissions counselors. Submit course inquiries, request a free callback, or visit our Hyderabad tech campus."
        keywords={['Contact Nexelvoria', 'Admissions Phone', 'Course Enquiry', 'Callback Request', 'Campus Address']}
      />

      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="purple" size="md">Admissions & Inquiries</Badge>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          We Are Here to Assist Your Career Journey
        </h1>
        <p className="text-slate-500 text-sm sm:text-base">
          Have questions regarding our training programs, syllabus, fees, or placement guarantee? Connect with our dedicated academic team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact Info Cards */}
        <div className="space-y-6">
          <Card className="p-6 space-y-3 bg-white">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Campus & Headquarters</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{APP_CONFIG.address}</p>
            <span className="text-[11px] text-indigo-600 font-semibold block">Nearest Metro: Cyber Towers Station</span>
          </Card>

          <Card className="p-6 space-y-3 bg-white">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Phone className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Admissions Helpline</h3>
            <p className="text-xs text-slate-800 font-semibold">{APP_CONFIG.supportPhone}</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Mon – Sat: 9:00 AM – 7:00 PM IST
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-white">
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Official Inquiries & Support</h3>
            <p className="text-xs text-slate-800 font-semibold">{APP_CONFIG.supportEmail}</p>
            <p className="text-[11px] text-slate-400">Response turnaround: within 4 business hours</p>
          </Card>

          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp Admissions Desk
            </h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Prefer instant messaging? Chat directly with an academic advisor on WhatsApp for instant syllabus delivery.
            </p>
            <a
              href={`https://wa.me/${APP_CONFIG.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hello%20Nexelvoria%20Admissions`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block pt-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
            >
              Start WhatsApp Chat →
            </a>
          </div>
        </div>

        {/* Tabbed Interactive Contact & Lead Forms */}
        <Card className="lg:col-span-2 p-6 sm:p-8 shadow-xs border border-slate-200/90 bg-white space-y-6 rounded-xl">
          {/* Tab Selector Buttons */}
          <div className="flex border-b border-slate-200 pb-2 gap-2 sm:gap-4 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('admission')}
              className={`pb-2 px-2 font-bold transition-colors cursor-pointer border-b-2 -mb-2.5 whitespace-nowrap ${
                activeTab === 'admission'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Course Admission Enquiry
            </button>
            <button
              onClick={() => setActiveTab('callback')}
              className={`pb-2 px-2 font-bold transition-colors cursor-pointer border-b-2 -mb-2.5 whitespace-nowrap ${
                activeTab === 'callback'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Request a Callback
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`pb-2 px-2 font-bold transition-colors cursor-pointer border-b-2 -mb-2.5 whitespace-nowrap ${
                activeTab === 'general'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              General Message
            </button>
          </div>

          {/* Form 1: Course Admission Enquiry */}
          {activeTab === 'admission' && (
            <form onSubmit={handleAdmissionSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Course Admission & Syllabus Enquiry</h3>
                <p className="text-slate-500 text-[11px]">Receive curriculum breakdowns, fee details, and upcoming batch timetable.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={admissionForm.name}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, name: e.target.value })}
                    placeholder="e.g. Ananya Patel"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={admissionForm.email}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, email: e.target.value })}
                    placeholder="ananya@example.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">10-Digit Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    pattern="[6-9][0-9]{9}"
                    value={admissionForm.phone}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Program of Interest *</label>
                  <select
                    required
                    value={admissionForm.course}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, course: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select a Program</option>
                    {SEED_COURSES.map((c) => (
                      <option key={c.id} value={c.title}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">College or Current Employer</label>
                <input
                  type="text"
                  value={admissionForm.college}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, college: e.target.value })}
                  placeholder="e.g. Osmania University (B.Tech 2026) or Cognizant"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specific Queries (Optional)</label>
                <textarea
                  rows={3}
                  value={admissionForm.message}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, message: e.target.value })}
                  placeholder="Ask about placement statistics, fee discounts, or live batch timings..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <Button type="submit" variant="primary" size="md" rightIcon={<Send className="h-4 w-4" />}>
                Submit Course Enquiry
              </Button>
            </form>
          )}

          {/* Form 2: Instant Callback Request */}
          {activeTab === 'callback' && (
            <form onSubmit={handleCallbackSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Request an Instant Academic Callback</h3>
                <p className="text-slate-500 text-[11px]">Tell us when you are free and our senior career counselor will call you.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={callbackForm.name}
                    onChange={(e) => setCallbackForm({ ...callbackForm, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preferred Time Window *</label>
                  <select
                    value={callbackForm.timeSlot}
                    onChange={(e) => setCallbackForm({ ...callbackForm, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Morning (9 AM - 12 PM)">Morning (9 AM – 12 PM IST)</option>
                    <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM – 4 PM IST)</option>
                    <option value="Evening (4 PM - 8 PM)">Evening (4 PM – 8 PM IST)</option>
                    <option value="Immediate (Next 30 mins)">Immediate (Within 30 minutes)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Program of Interest</label>
                  <select
                    value={callbackForm.course}
                    onChange={(e) => setCallbackForm({ ...callbackForm, course: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">General Academic Guidance</option>
                    {SEED_COURSES.map((c) => (
                      <option key={c.id} value={c.title}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button type="submit" variant="primary" size="md" rightIcon={<PhoneCall className="h-4 w-4" />}>
                Schedule My Callback
              </Button>
            </form>
          )}

          {/* Form 3: General Contact Message */}
          {activeTab === 'general' && (
            <form onSubmit={handleGeneralSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Send an Administrative or General Inquiry</h3>
                <p className="text-slate-500 text-[11px]">For media, institutional tie-ups, operations, or student support.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={generalForm.name}
                    onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
                    placeholder="e.g. Srikant Iyer"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={generalForm.email}
                    onChange={(e) => setGeneralForm({ ...generalForm, email: e.target.value })}
                    placeholder="srikant@example.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={generalForm.subject}
                  onChange={(e) => setGeneralForm({ ...generalForm, subject: e.target.value })}
                  placeholder="e.g. Question regarding verification or campus visit"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message Content *</label>
                <textarea
                  rows={4}
                  required
                  value={generalForm.message}
                  onChange={(e) => setGeneralForm({ ...generalForm, message: e.target.value })}
                  placeholder="Please specify your detailed message..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <Button type="submit" variant="primary" size="md" rightIcon={<Send className="h-4 w-4" />}>
                Send Message
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
