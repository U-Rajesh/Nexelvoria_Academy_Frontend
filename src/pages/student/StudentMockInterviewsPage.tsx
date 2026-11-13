import React, { useState } from 'react';
import {
  ExternalLink,
  BookOpen,
  Calendar,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Award,
} from 'lucide-react';
import { SEED_MOCK_INTERVIEWS, SEED_INTERVIEW_QUESTIONS } from '../../mocks/seedData';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import type { InterviewQuestion } from '../../types';

export const StudentMockInterviewsPage: React.FC = () => {
  const [interviews] = useState(SEED_MOCK_INTERVIEWS);
  const [activeTab, setActiveTab] = useState<'schedules' | 'question_bank'>('schedules');

  // Question bank search & filter state (PLC-011)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<string[]>(['iq-001']);

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

  const filteredQuestions = SEED_INTERVIEW_QUESTIONS.filter((q) => {
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
          <Calendar className="h-4 w-4" />
          Scheduled Sessions ({interviews.length})
        </button>
        <button
          onClick={() => setActiveTab('question_bank')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'question_bank'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Interview Question Bank (PLC-011)
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
            {SEED_INTERVIEW_QUESTIONS.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Scheduled Mock Sessions */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {interviews.map((m) => (
            <Card key={m.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <Badge variant="purple" size="sm">{m.interviewType} Interview</Badge>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    1-on-1 Technical Assessment Round
                  </h3>
                  <p className="text-xs text-slate-500">
                    Evaluator: <strong>{m.trainerName}</strong> • Scheduled on: {formatDate(m.scheduledAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="info" size="md" dot>Scheduled</Badge>
                  <a href={m.meetingLink} target="_blank" rel="noopener noreferrer">
                    <Button variant="primary" size="sm" rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                      Join Meeting
                    </Button>
                  </a>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed">
                <strong>Preparation Checklist:</strong> Be ready to live-code algorithmic problems on Java Streams, explain your microservice transaction saga architecture, and discuss Spring Boot unit testing strategies.
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab 2: Curated Interview Question Bank (CRD PLC-011) */}
      {activeTab === 'question_bank' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <Card className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions, keywords, or technology tags (e.g., Virtual Threads, System Design)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      Category: {c}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="p-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {difficulties.map((d) => (
                    <option key={d} value={d}>
                      Difficulty: {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span>
                Showing <strong>{filteredQuestions.length}</strong> of {SEED_INTERVIEW_QUESTIONS.length} curated questions
              </span>
              <span className="font-medium text-indigo-600">CRD PLC-011 Repository</span>
            </div>
          </Card>

          {/* Question List */}
          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const isExpanded = expandedQuestionIds.includes(q.id);
              return (
                <Card key={q.id} className="p-5 space-y-4 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {q.id.toUpperCase()}
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
                      <Badge variant="purple" size="sm">
                        {q.category}
                      </Badge>
                    </div>

                    <button
                      onClick={() => toggleExpand(q.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer self-start sm:self-center"
                    >
                      {isExpanded ? (
                        <>
                          Hide Model Answer & Rubric <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          View Model Answer & Rubric <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{q.title}</h3>
                    <p className="text-xs text-slate-700 mt-2 leading-relaxed bg-slate-50/80 p-3 rounded-lg border border-slate-100 font-medium">
                      {q.question}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {q.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"
                      >
                        <Tag className="h-2.5 w-2.5 text-slate-400" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Collapsible Model Answer & Rubric (PLC-011) */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      {/* Model Answer */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Model Answer & Expected Talking Points</span>
                        </div>
                        <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-slate-800 leading-relaxed font-sans">
                          {q.modelAnswer}
                        </div>
                      </div>

                      {/* Evaluation Rubric */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <Award className="h-3.5 w-3.5 text-amber-600" />
                          <span>Evaluation Rubric & Competency Weightage</span>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                              <tr>
                                <th className="p-2.5">Evaluation Criteria</th>
                                <th className="p-2.5 w-24">Weightage</th>
                                <th className="p-2.5">Strong Candidate Indicator</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {q.evaluationRubric.map((r, i) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-semibold text-slate-800">{r.criteria}</td>
                                  <td className="p-2.5 font-mono text-indigo-600 font-bold">{r.weightage}</td>
                                  <td className="p-2.5 text-slate-600 text-[11px]">{r.goodResponseIndicator}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


