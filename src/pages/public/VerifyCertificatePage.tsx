import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { certificateService } from '../../services/certificateService';
import type { CertificateRecord } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card, CardContent } from '../../components/common/Card';
import { formatDate } from '../../utils/formatters';

export const VerifyCertificatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [certInput, setCertInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchedRecord, setSearchedRecord] = useState<CertificateRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialId = searchParams.get('id');

  const handleVerify = async (code: string) => {
    if (!code.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSearchedRecord(null);

    const res = await certificateService.verifyCertificate(code);
    setIsLoading(false);

    if (res.success && res.data) {
      setSearchedRecord(res.data);
    } else {
      setErrorMessage(res.error || 'No matching certificate found.');
    }
  };

  useEffect(() => {
    if (initialId) {
      setCertInput(initialId);
      handleVerify(initialId);
    }
  }, [initialId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(certInput);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-8">
      {/* Page Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="h-4 w-4" />
          <span>Official Public Credential Registry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Verify Nexelvoria Certificate
        </h1>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          Enter the unique Certificate ID printed on the candidate credential or scan the QR code to validate authenticity in real time.
        </p>
      </div>

      {/* Search Input Box */}
      <Card className="shadow-lg border-slate-200">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                placeholder="e.g. NEX-2026-JFS-0104"
                className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="sm:w-36 py-3"
            >
              Verify Now
            </Button>
          </form>

          {/* Quick Demo Hint */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Example ID for quick testing:</span>
            <button
              type="button"
              onClick={() => {
                setCertInput('NEX-2026-JFS-0104');
                handleVerify('NEX-2026-JFS-0104');
              }}
              className="font-mono text-indigo-600 hover:underline cursor-pointer font-semibold"
            >
              NEX-2026-JFS-0104
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-3">
          <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Verification Failed</p>
            <p className="text-xs text-rose-600 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Verification Result Card */}
      {searchedRecord && (
        <Card className="border-emerald-200 bg-white shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-bold text-sm tracking-wide">
                AUTHENTIC NEXELVORIA CREDENTIAL
              </span>
            </div>
            <Badge variant="neutral" size="sm" className="bg-white/20 text-white border-white/30 font-mono">
              {searchedRecord.certificateNumber}
            </Badge>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Awarded To</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{searchedRecord.studentName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Student ID: {searchedRecord.studentId}</p>
              </div>
              <div>
                {searchedRecord.status === 'valid' ? (
                  <Badge variant="success" size="md" dot>
                    Active & Valid
                  </Badge>
                ) : (
                  <Badge variant="danger" size="md" dot>
                    Revoked ({searchedRecord.revocationReason})
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-indigo-500" /> Program / Track
                </span>
                <p className="font-semibold text-slate-800">{searchedRecord.courseTitle}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-500" /> Issue Date
                </span>
                <p className="font-semibold text-slate-800">{formatDate(searchedRecord.issueDate)}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">Session Attendance Recorded</span>
                <p className="font-semibold text-slate-800">
                  {searchedRecord.attendancePercentage}% (Meets $\ge$ 75% threshold)
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">Examination Result</span>
                <p className="font-semibold text-slate-800">
                  {searchedRecord.examScorePercentage}% Score (Competency Passed)
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <p>Certified by the Board of Academic Examiners, Nexelvoria Academy.</p>
              <Link to="/courses">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Explore Curriculum
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

