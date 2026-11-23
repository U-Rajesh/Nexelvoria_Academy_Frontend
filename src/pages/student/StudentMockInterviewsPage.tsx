import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  BookOpen,
  Calendar,
  Search,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Award,
} from 'lucide-react';
import { SEED_MOCK_INTERVIEWS, SEED_INTERVIEW_QUESTIONS } from '../../mocks/seedData';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import type { InterviewQuestion, MockInterviewSchedule } from '../../types';

export const StudentMockInterviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<MockInterviewSchedule[]>([]);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'schedules' | 'question_bank'>('schedules');

  // Question bank search & filter state (PLC-011)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<string[]>(['iq-001']);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      studentService.getMockInterviewsForStudent(user?.id ?? ''),
      studentService.getInterviewQuestions(),
    ]).then(([mockRes, qRes]) => {
      if (!mounted) return;
      if (mockRes.success && mockRes.data && mockRes.data.length > 0) {
        setInterviews(mockRes.data);
      } else {
        setInterviews(SEED_MOCK_INTERVIEWS);
      }

      if (qRes.success && qRes.data && qRes.data.length > 0) {
        setQuestions(qRes.data);
      } else {
        setQuestions(SEED_INTERVIEW_QUESTIONS);
      }
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const toggleExpand = (id: string) => {
    setExpandedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const categories = [
    'All',
    'Java & Spring Boot',
    'React & Frontend',
    'System Design',
    'DSA & Algorithms',
    'Behavioral & HR',
  ];

  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mock Interviews & Placement Prep</h1>
        <p className="text-xs text-slate-500 mt-1">
          1-on-1 technical and behavioral mock interview sessions and curated interview question bank with evaluation rubrics (CRD PLC-011).
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'schedules'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Scheduled Sessions
          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded-full font-bold">
            {interviews.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('question_bank')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'question_bank'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Curated Question Bank & Rubrics
          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-indigo-50 text-indigo-600 rounded-full font-bold">
            {questions.length} Qs
          </span>
        </button>
      </div>

      {loading && (
        <div className="text-center py-12 text-slate-500 text-sm">Loading interview schedules and question bank...</div>
      )}

      {/* Tab 1: Mock Interview Schedules */}
      {!loading && activeTab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Your Scheduled & Past Interviews</h2>
            <Badge variant="purple" size="sm">
              <Sparkles className="w-3 h-3 mr-1" />
              1 Free Attempt per Month Included
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviews.map((item) => (
              <Card key={item.id} className="p-5 border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                      {item.interviewType} Interview
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      1-on-1 with {item.trainerName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(item.scheduledAt)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      item.status === 'completed'
                        ? 'success'
                        : item.status === 'scheduled'
                        ? 'purple'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {item.status.toUpperCase()}
                  </Badge>
                </div>

                {(item.meetingUrl || item.meetingLink) && item.status === 'scheduled' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-600">Video Call Link:</span>
                    <a
                      href={item.meetingUrl || item.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
                    >
                      Join Meeting
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {item.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-emerald-600" /> Evaluation:
                      </span>
                      <span className="text-emerald-700 font-bold text-sm">
                        {item.feedbackReport?.recommendation || 'Completed'}
                      </span>
                    </div>
                    {item.feedback && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-100">
                        "{item.feedback}"
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))}
            {interviews.length === 0 && (
              <div className="col-span-2 text-center py-10 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-500">No mock interviews scheduled yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Curated Interview Question Bank (CRD PLC-011) */}
      {!loading && activeTab === 'question_bank' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions by keyword or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {difficulties.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Showing {filteredQuestions.length} curated interview questions</span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedDifficulty('All');
                }}
                className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Question List Accordion */}
          <div className="space-y-3">
            {filteredQuestions.map((q) => {
              const isExpanded = expandedQuestionIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
                >
                  <button
                    onClick={() => toggleExpand(q.id)}
                    className="w-full text-left p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                          {q.category}
                        </span>
                        <Badge
                          variant={
                            q.difficulty === 'Easy'
                              ? 'success'
                              : q.difficulty === 'Medium'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {q.difficulty}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{q.title}</h4>
                      <p className="text-xs text-slate-600 font-medium">{q.question}</p>
                    </div>
                    <div className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
                      {/* Evaluation Rubric */}
                      {q.evaluationRubric && q.evaluationRubric.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                            Key Evaluation Rubric:
                          </span>
                          <div className="space-y-1">
                            {q.evaluationRubric.map((r, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-[11px] bg-white p-2 rounded border border-slate-200"
                              >
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  {r.criteria} ({r.weightage}): {r.goodResponseIndicator}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Model Answer */}
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                          Ideal Model Answer & Explanation:
                        </span>
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                          {q.modelAnswer}
                        </div>
                      </div>

                      {/* Tags */}
                      {q.tags && q.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-2">
                          <Tag className="w-3 h-3 text-slate-400" />
                          <div className="flex gap-1">
                            {q.tags.map((tag, i) => (
                              <span key={i} className="text-[10px] text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredQuestions.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-900">No matching questions found</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your search keywords, category, or difficulty level filters.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
