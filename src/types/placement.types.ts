export interface HiringCompany {
  id: string;
  name: string;
  logoUrl?: string;
  website: string;
  location: string;
  industry: string;
  about: string;
  activeOpeningsCount: number;
}

export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'technical_interview'
  | 'hr_interview'
  | 'offered'
  | 'rejected';

export interface JobOpening {
  id: string;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string;
  title: string;
  roleType: 'Full-time' | 'Internship' | 'Contract';
  location: string;
  workMode: 'Onsite' | 'Hybrid' | 'Remote';
  salaryPackageCTC: string; // e.g., "₹ 6.5 LPA - ₹ 9.0 LPA"
  experienceRequired: string;
  eligibilityCriteria: {
    minAttendancePercentage?: number;
    minExamScorePercentage?: number;
    eligibleCourseIds: string[];
    eligiblePassingYears: string[];
  };
  jobDescription: string;
  skillsRequired: string[];
  openingsCount: number;
  deadline: string;
  isActive: boolean;
  postedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  studentId: string;
  studentName: string;
  appliedAt: string;
  status: ApplicationStatus;
  currentRoundNotes?: string;
  offerLetterUrl?: string;
  offerSalaryCTC?: string;
}

export interface MockInterviewSchedule {
  id: string;
  studentId: string;
  studentName: string;
  trainerId: string;
  trainerName: string;
  scheduledAt: string;
  meetingLink: string;
  meetingUrl?: string;
  feedback?: string;
  interviewType: 'Technical' | 'HR' | 'System Design';
  status: 'scheduled' | 'completed' | 'cancelled';
  feedbackReport?: {
    technicalScoreOutOf10: number;
    communicationScoreOutOf10: number;
    problemSolvingScoreOutOf10: number;
    strengths: string;
    areasForImprovement: string;
    recommendation: 'Ready for Placements' | 'Needs More Practice' | 'Re-attempt Required';
  };
}

export interface InterviewQuestion {
  id: string;
  category: 'Java & Spring Boot' | 'React & Frontend' | 'System Design' | 'DSA & Algorithms' | 'Behavioral & HR';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  title: string;
  question: string;
  modelAnswer: string;
  evaluationRubric: {
    criteria: string;
    weightage: string;
    goodResponseIndicator: string;
  }[];
  tags: string[];
}


