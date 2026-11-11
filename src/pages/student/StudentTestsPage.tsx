import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Clock, CheckCircle2, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { SEED_TESTS, SEED_TEST_ATTEMPTS } from '../../mocks/seedData';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import type { OnlineTest, TestAttempt } from '../../types';

export const StudentTestsPage: React.FC = () => {
  const { user } = useAuth();
  const [tests] = useState<OnlineTest[]>(SEED_TESTS);
  const [attempts] = useState<TestAttempt[]>(SEED_TEST_ATTEMPTS);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Competency Examinations</h1>
        <p className="text-xs text-slate-500 mt-1">
          Passing scores in module examinations are required for Graduation Certificate eligibility (SRS Rule BR-011).
        </p>
      </div>

      <div className="space-y-4">
        {tests.map((test) => {
          const attempt = attempts.find((a) => a.testId === test.id);
          const isPassed = attempt?.isPassed;
          const hasAttempted = !!attempt;

          return (
            <Card key={test.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="purple" size="sm">Timed Assessment</Badge>
                    {hasAttempted ? (
                      isPassed ? (
                        <Badge variant="success" size="sm" dot>Passed ({attempt.totalScore}/{test.totalMarks})</Badge>
                      ) : (
                        <Badge variant="danger" size="sm" dot>Failed ({attempt.totalScore}/{test.totalMarks})</Badge>
                      )
                    ) : (
                      <Badge variant="info" size="sm" dot>Ready to Take</Badge>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{test.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{test.description}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link to={`/student/tests/${test.id}/take`}>
                    <Button variant={hasAttempted ? 'outline' : 'primary'} size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                      {hasAttempted ? 'Review Attempt' : 'Start Exam'}
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-500">
                <div>
                  <span className="block text-slate-400 font-medium">Duration</span>
                  <span className="font-semibold text-slate-800">{test.durationMinutes} Minutes</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Total Questions</span>
                  <span className="font-semibold text-slate-800">{test.questions.length} Questions</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Total Marks</span>
                  <span className="font-semibold text-slate-800">{test.totalMarks} Marks</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Passing Threshold</span>
                  <span className="font-semibold text-slate-800">{test.passingPercentage}%</span>
                </div>
              </div>

              {attempt && (
                <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    Latest Submission on: <strong>{formatDate(attempt.submittedAt)}</strong>
                  </span>
                  <span className="font-bold text-indigo-700">
                    Score: {attempt.totalScore} / {test.totalMarks} ({Math.round((attempt.totalScore / test.totalMarks) * 100)}%)
                  </span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

