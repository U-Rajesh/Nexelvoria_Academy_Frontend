import React, { useState } from 'react';
import { Users, Calendar, Video, Clock, ExternalLink, Save, BookOpen } from 'lucide-react';
import { SEED_BATCHES } from '../../mocks/seedData';
import { teacherService } from '../../services/teacherService';
import { useNotification } from '../../context/NotificationContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import type { Batch } from '../../types';

export const TeacherBatchesPage: React.FC = () => {
  const [batches] = useState<Batch[]>(SEED_BATCHES);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned Batches & Cohorts</h1>
        <p className="text-xs text-slate-500 mt-1">
          Instructors access and instruct only assigned cohorts allocated by administration (SRS Rule BR-009).
        </p>
      </div>

      <div className="space-y-4">
        {batches.map((batch) => (
          <Card key={batch.id} className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold">
                  {batch.batchCode}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{batch.name}</h3>
                <p className="text-xs text-slate-500">{batch.courseName}</p>
              </div>
              <Badge variant="success" size="md" dot>Ongoing Class</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block font-medium">Session Timetable</span>
                <span className="font-semibold text-slate-900">{batch.scheduleTiming}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Enrolled Students</span>
                <span className="font-semibold text-slate-900">40 Active Students</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Term Period</span>
                <span className="font-semibold text-slate-900">{formatDate(batch.startDate)} - {formatDate(batch.endDate)}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <a href={batch.meetingUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700" leftIcon={<Video className="h-3.5 w-3.5" />}>
                  Launch Class Room
                </Button>
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const TeacherLiveClassesPage: React.FC = () => {
  const { showToast } = useNotification();
  const batch = SEED_BATCHES[0];
  const [meetingUrl, setMeetingUrl] = useState(batch.meetingUrl || 'https://meet.google.com/nex-java-batch');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await teacherService.updateMeetingUrl(batch.id, meetingUrl);
    setIsSaving(false);
    if (res.success) {
      showToast({
        type: 'success',
        title: 'Meeting URL Updated',
        message: 'Live class link updated. Enrolled students can now access this room. (SRS BR-015)',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manual Live Class Configuration</h1>
        <p className="text-xs text-slate-500 mt-1">
          In accordance with <strong>SRS Rule BR-015</strong>, live meeting links are manually configured (e.g. Google Meet or Zoom URLs).
        </p>
      </div>

      <Card className="p-8 space-y-6">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Batch</label>
            <input
              type="text"
              disabled
              value={`${batch.name} (${batch.batchCode})`}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Manual Meeting Room URL (Google Meet / Zoom / MS Teams) *
            </label>
            <input
              type="url"
              required
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 text-xs">
            Students in this batch will see this URL on their dashboard and can launch it directly before class starts.
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full bg-teal-600 hover:bg-teal-700"
            isLoading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Meeting Link (BR-015)
          </Button>
        </form>
      </Card>
    </div>
  );
};

