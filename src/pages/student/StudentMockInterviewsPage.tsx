import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { SEED_MOCK_INTERVIEWS } from '../../mocks/seedData';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';

export const StudentMockInterviewsPage: React.FC = () => {
  const [interviews] = useState(SEED_MOCK_INTERVIEWS);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mock Interview Schedules</h1>
        <p className="text-xs text-slate-500 mt-1">
          1-on-1 technical and behavioral mock interview sessions evaluated with detailed competency rubrics.
        </p>
      </div>

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
    </div>
  );
};

