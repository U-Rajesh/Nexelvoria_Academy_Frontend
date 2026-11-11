import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  FolderOpen,
  Eye,
  FileCode,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import type { Course, Enrollment, Batch } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/feedback/Modal';
import { useNotification } from '../../context/NotificationContext';

interface MaterialItem {
  id: string;
  title: string;
  type: 'pdf' | 'document' | 'code_repo' | 'cheatsheet';
  size: string;
  moduleName: string;
  courseId: string;
  courseTitle: string;
  description: string;
  downloadUrl: string;
  previewContent?: string;
}

export const StudentMaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<{ enrollment: Enrollment; course: Course; batch?: Batch }[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMaterial, setPreviewMaterial] = useState<MaterialItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useNotification();

  useEffect(() => {
    const loadEnrollments = async () => {
      if (!user) return;
      const res = await studentService.getStudentEnrollments(user.id);
      if (res.success) {
        setEnrollments(res.data);
      }
      setIsLoading(false);
    };

    loadEnrollments();
  }, [user]);

  // Seed study materials matching enrolled courses
  const materialsCatalog: MaterialItem[] = [
    {
      id: 'mat-1',
      title: 'Spring Cloud Microservices & Distributed Architecture Reference Guide',
      type: 'pdf',
      size: '4.8 MB',
      moduleName: 'Module 1: Advanced Java & Microservices',
      courseId: 'crs-01',
      courseTitle: 'Full Stack Java Cloud Architecture',
      description: 'Comprehensive architectural diagrams of Eureka, Spring Cloud Gateway, resilience circuit breakers, and OpenFeign inter-service communication.',
      downloadUrl: '#',
      previewContent: 'This reference manual covers distributed systems patterns: API Gateway routing filters, distributed rate limiting with Redis, Resilience4j circuit breakers, and Sleuth distributed tracing with Zipkin.',
    },
    {
      id: 'mat-2',
      title: 'Docker & Kubernetes Pod Orchestration Cheatsheet',
      type: 'cheatsheet',
      size: '1.2 MB',
      moduleName: 'Module 3: Cloud & Containerization',
      courseId: 'crs-01',
      courseTitle: 'Full Stack Java Cloud Architecture',
      description: 'Production kubectl command references, multi-stage Dockerfile templates, Helm chart structures, and deployment rollbacks.',
      downloadUrl: '#',
      previewContent: 'Production commands: kubectl rollout undo, configuring Horizontal Pod Autoscaler (HPA) metrics, Ingress controllers with TLS certificates, and Persistent Volume Claims (PVC).',
    },
    {
      id: 'mat-3',
      title: 'Apache Kafka Event-Driven Messaging & Idempotent Consumer Patterns',
      type: 'document',
      size: '2.5 MB',
      moduleName: 'Module 2: Event-Driven Architectures',
      courseId: 'crs-01',
      courseTitle: 'Full Stack Java Cloud Architecture',
      description: 'Step-by-step code patterns for exactly-once messaging semantics, Dead Letter Queues (DLQ), and Kafka Streams state stores.',
      downloadUrl: '#',
      previewContent: 'Covers: Partition rebalance listeners, transactional KafkaTemplate in Spring Boot, handling poisoned pill messages with ErrorHandlingDeserializer.',
    },
    {
      id: 'mat-4',
      title: 'System Design Interview Playbook for Fresh Graduates',
      type: 'pdf',
      size: '6.2 MB',
      moduleName: 'Placement & Assessment Preparation',
      courseId: 'crs-01',
      courseTitle: 'Full Stack Java Cloud Architecture',
      description: 'Detailed walk-throughs of URL shorteners, distributed rate limiters, payment ledgers, and notification dispatch microservices.',
      downloadUrl: '#',
      previewContent: 'Includes back-of-the-envelope calculations, CAP theorem trade-offs, database indexing with B-Trees, and Redis LRU cache eviction algorithms.',
    },
  ];

  // STD-003: Filter only materials belonging to courses the student is actively enrolled in!
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course.id));
  const authorizedMaterials = materialsCatalog.filter((m) => enrolledCourseIds.has(m.courseId));

  const filteredMaterials = authorizedMaterials.filter((m) => {
    const matchesCourse = selectedCourseId === 'all' || m.courseId === selectedCourseId;
    const matchesQuery =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.moduleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesQuery;
  });

  const handleDownload = (mat: MaterialItem) => {
    showToast({
      type: 'success',
      title: 'Download Started',
      message: `Downloading "${mat.title}" (${mat.size}).`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
        <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Learning Materials Locked</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Per SRS Rule STD-003, course materials are strictly restricted to students with authorized course enrollments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Learning Materials & Handouts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Download lecture notes, architectural reference PDFs, code templates, and interview cheat sheets (STD-003).
          </p>
        </div>

        <Badge variant="purple" size="md">
          {authorizedMaterials.length} Resources Available
        </Badge>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Course:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-800 focus:outline-none"
          >
            <option value="all">All Enrolled Courses</option>
            {enrollments.map(({ course }) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, Kafka, Docker..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Materials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMaterials.map((mat) => (
          <Card key={mat.id} className="p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow bg-white">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                  {mat.type.replace('_', ' ')}
                </span>
                <span className="text-slate-400 font-medium">{mat.size}</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{mat.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{mat.moduleName}</p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {mat.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                {mat.courseTitle}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setPreviewMaterial(mat)}
                  leftIcon={<Eye className="h-3.5 w-3.5" />}
                >
                  Preview
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleDownload(mat)}
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                >
                  Download
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        title={previewMaterial?.title || 'Material Preview'}
        description={`${previewMaterial?.moduleName} • ${previewMaterial?.size}`}
      >
        {previewMaterial && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed space-y-2">
              <h4 className="font-bold text-slate-900">Document Overview</h4>
              <p>{previewMaterial.description}</p>
              <h4 className="font-bold text-slate-900 pt-2">Topics & Chapter Outline</h4>
              <p>{previewMaterial.previewContent}</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewMaterial(null)}>
                Close Preview
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleDownload(previewMaterial);
                  setPreviewMaterial(null);
                }}
                leftIcon={<Download className="h-3.5 w-3.5" />}
              >
                Download Resource
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

