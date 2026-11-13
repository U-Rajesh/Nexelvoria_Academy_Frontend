
export interface WebsiteBanner {
  id: string;
  text: string;
  badgeText: string;
  linkText: string;
  linkUrl: string;
  isActive: boolean;
  theme: 'indigo' | 'amber' | 'emerald';
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  authorRole: string;
  authorAvatar: string;
  date: string;
  readTime: string;
  excerpt: string;
  content: string[];
  tags: string[];
  featuredImage: string;
  isPublished?: boolean;
  order?: number;
}

export interface FAQItem {
  id: string;
  category: 'Admissions' | 'Fees & Payments' | 'LMS & Attendance' | 'Certificates' | 'Placements' | 'General';
  question: string;
  answer: string;
  order: number;
  isActive?: boolean;
}

export interface TestimonialItem {
  id: string;
  studentName: string;
  previousRole: string;
  currentRole: string;
  companyName: string;
  companyLogo?: string;
  packageCTC: string;
  courseName: string;
  rating: number;
  avatarUrl: string;
  quote: string;
  year: string;
  isPublished?: boolean;
  displayOrder?: number;
}

export interface AchievementItem {
  id: string;
  title: string;
  studentName: string;
  category: 'Hackathon' | 'Placement Milestone' | 'Open Source' | 'Promotion';
  description: string;
  date: string;
  badge: string;
  photoUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface TrainerProfile {
  id: string;
  name: string;
  role: string;
  specialization: string;
  experienceYears: number;
  bio: string;
  qualifications: string;
  rating: number;
  avatarUrl: string;
  formerCompanies: string[];
  linkedinUrl: string;
  coursesTaught: string[];
  type?: 'trainer' | 'mentor';
  isActive?: boolean;
  displayOrder?: number;
}

export interface CareerOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  isActive: boolean;
}

export interface LeadEnquiry {
  id: string;
  type: 'general' | 'course_admission' | 'callback' | 'college_mou' | 'corporate_training';
  name: string;
  email?: string;
  phone: string;
  courseOfInterest?: string;
  preferredTimeSlot?: string;
  organization?: string;
  collegeName?: string;
  companyName?: string;
  message?: string;
  submittedAt: string;
  status: 'new' | 'contacted' | 'enrolled' | 'closed';
}

// --- Extended CMS Interfaces (Phase 2 Modules) ---

export interface StatisticItem {
  id: string;
  value: string;
  label: string;
  valueClassName?: string;
  delay?: number;
  isVisible: boolean;
}

export interface HomePageConfig {
  hero: {
    badgeText: string;
    titlePrefix: string;
    titleHighlight: string;
    subtitle: string;
    ctaPrimaryText: string;
    ctaPrimaryLink: string;
    ctaSecondaryText: string;
    valueBadges: string[];
    backgroundImageUrl?: string;
  };
  statistics: StatisticItem[];
  sectionVisibility: {
    hero: boolean;
    statistics: boolean;
    intro: boolean;
    courses: boolean;
    advantage: boolean;
    methodology: boolean;
    trainersOrbit: boolean;
    hiringMarquee: boolean;
    achievements: boolean;
    partnerships: boolean;
    testimonials: boolean;
    blog: boolean;
    faqs: boolean;
    leadForm: boolean;
  };
  advantages: Array<{
    title: string;
    desc: string;
    iconName: string;
    color: string;
  }>;
  methodology: Array<{
    step: string;
    title: string;
    desc: string;
  }>;
}

export interface AboutUsConfig {
  header: {
    badgeText: string;
    title: string;
    description?: string;
    subtitle?: string;
  };
  vision: {
    title: string;
    description: string;
  };
  mission: {
    title: string;
    description: string;
  };
  objectives: Array<{
    title: string;
    desc: string;
  }>;
  pedagogy: Array<{
    step?: string;
    stage?: string;
    title: string;
    desc: string;
    icon?: string;
  }>;
  comparison: Array<{
    feature: string;
    traditional: string;
    aggregator: string;
    nexelvoria: string;
  }>;
  headquarters?: {
    badgeText?: string;
    title: string;
    description: string;
    address?: string;
  };
  campus: {
    badgeText?: string;
    title: string;
    description: string;
    location?: string;
    address?: string;
  };
  sectionVisibility: {
    header?: boolean;
    visionMission: boolean;
    objectives: boolean;
    pedagogy: boolean;
    comparison: boolean;
    headquarters?: boolean;
    campus?: boolean;
  };
}

export interface HiringPartnerCompany {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
  websiteUrl?: string;
  location: string;
  industry?: string;
  about?: string;
  activeOpeningsCount?: number;
  activeOpenings?: number;
  isVisible?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}

export interface MarqueeAnimationConfig {
  isEnabled: boolean;
  rowCount: 1 | 2;
  row1Direction?: 'left' | 'right';
  row2Direction?: 'left' | 'right';
  row1Speed?: 'slow' | 'normal' | 'fast';
  row2Speed?: 'slow' | 'normal' | 'fast';
  directionRow1?: 'left' | 'right';
  directionRow2?: 'left' | 'right';
  speed?: 'slow' | 'normal' | 'fast';
  pauseOnHover: boolean;
}

export interface CollegePartnershipConfig {
  header: {
    badgeText?: string;
    title: string;
    subtitle: string;
  };
  benefits: Array<{
    title: string;
    desc: string;
  }>;
  partners?: Array<{
    id: string;
    collegeName: string;
    logoUrl?: string;
    location: string;
    mouYear: string;
    activeStudentsCount: number;
    isVisible: boolean;
    displayOrder: number;
  }>;
  partnerColleges: Array<{
    id?: string;
    name: string;
    collegeName?: string;
    logoUrl?: string;
    location: string;
    mouYear: string;
    activeStudentsCount?: number;
  }>;
  sectionVisibility: {
    header: boolean;
    benefits: boolean;
    form: boolean;
    partnerList: boolean;
  };
}

export interface CorporateTrainingConfig {
  header: {
    badgeText?: string;
    title: string;
    subtitle: string;
  };
  offerings: Array<{
    id?: string;
    title: string;
    desc: string;
    icon?: string;
    iconName?: string;
    isVisible?: boolean;
  }>;
  clients: Array<{
    id?: string;
    name?: string;
    companyName?: string;
    logoUrl?: string;
    isVisible?: boolean;
  }>;
  sectionVisibility: {
    header: boolean;
    offerings: boolean;
    form: boolean;
    clients: boolean;
  };
}

export interface ContactInfoConfig {
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  campusAddress?: string;
  address?: string;
  nearestMetro?: string;
  operatingHours: string;
  timezone?: string;
  turnaroundTime?: string;
  socialLinks: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    youtube?: string;
    instagram?: string;
  };
}

export type SocialPlatformType =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'youtube'
  | 'twitter'
  | 'whatsapp'
  | 'telegram'
  | 'github'
  | string;

export interface SocialMediaLink {
  id: string;
  platform: SocialPlatformType;
  platformName?: string;
  url: string;
  isEnabled: boolean;
  showInHeader: boolean;
  showInFooter: boolean;
  showInContact: boolean;
  order?: number;
}

export interface HeaderFooterConfig {
  logoTitle: string;
  logoSubtitle: string;
  navLinks: Array<{
    label: string;
    path: string;
    isVisible?: boolean;
    order?: number;
  }>;
  footerDescription: string;
  copyrightText: string;
}

export interface PageSEO {
  path?: string;
  route?: string;
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface SEOConfig {
  defaultTitleSuffix: string;
  defaultOgImage: string;
  pages: Record<string, PageSEO>;
}

export interface MediaAsset {
  id: string;
  name: string;
  category: 'logo' | 'avatar' | 'banner' | 'icon' | 'general' | 'course' | 'campus';
  url: string;
  dimensions?: string;
  uploadedAt?: string;
  createdAt?: string;
}

const STORAGE_KEYS = {
  BANNERS: 'nexelvoria_cms_banners',
  BLOGS: 'nexelvoria_cms_blogs',
  FAQS: 'nexelvoria_cms_faqs',
  TESTIMONIALS: 'nexelvoria_cms_testimonials',
  ACHIEVEMENTS: 'nexelvoria_cms_achievements',
  TRAINERS: 'nexelvoria_cms_trainers',
  CAREERS: 'nexelvoria_cms_careers',
  ENQUIRIES: 'nexelvoria_cms_enquiries',
  // New CMS Keys
  HOMEPAGE_CONFIG: 'nexelvoria_cms_homepage_config',
  ABOUT_CONFIG: 'nexelvoria_cms_about_config',
  HIRING_PARTNERS: 'nexelvoria_cms_hiring_partners',
  MARQUEE_CONFIG: 'nexelvoria_cms_marquee_config',
  COLLEGE_PARTNERSHIPS: 'nexelvoria_cms_college_partnerships',
  CORPORATE_TRAINING: 'nexelvoria_cms_corporate_training',
  CONTACT_CONFIG: 'nexelvoria_cms_contact_config',
  HEADER_FOOTER_CONFIG: 'nexelvoria_cms_header_footer_config',
  SEO_CONFIG: 'nexelvoria_cms_seo_config',
  MEDIA_LIBRARY: 'nexelvoria_cms_media_library',
  SOCIAL_LINKS: 'nexelvoria_cms_social_links',
};

// Seed Defaults
const INITIAL_BANNERS: WebsiteBanner[] = [
  {
    id: 'ban-1',
    text: 'Admissions Open for Winter 2026 Batch • Early Bird Fee Benefit ₹ 5,000 Off',
    badgeText: 'Winter 2026 Batch',
    linkText: 'Apply Online',
    linkUrl: '/register',
    isActive: true,
    theme: 'indigo',
  },
  {
    id: 'ban-2',
    text: 'Highest Placement CTC Milestone: ₹ 32.5 LPA Achieved by Java Cloud Graduate',
    badgeText: 'Placement Alert',
    linkText: 'View Placements',
    linkUrl: '/placements',
    isActive: false,
    theme: 'emerald',
  },
];

const INITIAL_BLOGS: BlogArticle[] = [
  {
    id: 'blog-1',
    slug: 'virtual-threads-java-21-high-throughput-microservices',
    title: 'Virtual Threads in Java 21: High-Throughput Microservices Demystified',
    category: 'Java & Cloud',
    author: 'Dr. Vikram Seth',
    authorRole: 'Chief Technical Instructor & Ex-Principal Architect',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    date: '2026-11-01',
    readTime: '6 min read',
    excerpt: 'How Project Loom eliminates the classic thread-per-request bottleneck and enables Spring Boot applications to scale to millions of concurrent virtual threads with minimal memory overhead.',
    content: [
      'For two decades, Java servers relied on the traditional thread-per-request concurrency model. Each incoming HTTP request consumed an operating system thread with an average stack memory allocation of 1MB.',
      'Project Loom in Java 21 introduces Virtual Threads—lightweight user-mode threads managed by the Java Virtual Machine rather than the host OS kernel.',
      'Key Architectural Advantage: Virtual threads allow millions of simultaneous blocking I/O calls without thread starvation or complex reactive callback spaghetti code.',
      'In our Nexelvoria Full Stack Java Cloud cohort, students build distributed e-commerce services benchmarking Spring Boot 3.3 with Virtual Threads against traditional thread pools, achieving a 7x increase in requests per second.',
      'Best Practice: Never pool virtual threads. Create them dynamically per task using Executors.newVirtualThreadPerTaskExecutor() and let the JVM carrier threads schedule them seamlessly.'
    ],
    tags: ['Java 21', 'Spring Boot', 'Virtual Threads', 'Microservices', 'Performance'],
    featuredImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'blog-2',
    slug: 'transitioning-monolith-to-event-driven-sagas-kafka',
    title: 'Transitioning from Monolith to Event-Driven Sagas with Apache Kafka',
    category: 'Architecture',
    author: 'Sneha Kulkarni',
    authorRole: 'Senior Cloud Solutions Architect & Mentor',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    date: '2026-10-24',
    readTime: '8 min read',
    excerpt: 'A practical architectural guide on maintaining distributed database consistency across payment and order services without distributed two-phase commit locks.',
    content: [
      'In distributed microservice architectures, dual-phase commit (2PC) is an anti-pattern that creates tight coupling and network bottlenecks.',
      'The Saga Pattern decomposes a distributed transaction into a series of local transactions coordinated through idempotent Kafka events.',
      'Orchestration vs Choreography: While Choreography is decentralized, Orchestration Sagas using a central coordinator state machine offer superior observability and deterministic compensating transactions when payments fail.',
      'Real-world implementation involves configuring idempotent producers, transactional consumer offsets, and dead-letter topics (DLQs) for resilient fault tolerance.'
    ],
    tags: ['Kafka', 'Microservices', 'Saga Pattern', 'Distributed Systems', 'Event-Driven'],
    featuredImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'blog-3',
    slug: 'cracking-system-design-interviews-freshers-checklist',
    title: 'Cracking System Design Interviews as a Fresher: Essential Checklist',
    category: 'Placement Prep',
    author: 'Aditya Verma',
    authorRole: 'DevOps & SRE Lead',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    date: '2026-10-15',
    readTime: '5 min read',
    excerpt: 'Key architectural fundamentals every graduate engineer must master: reverse proxies, caching layers, database sharding, and CAP theorem trade-offs in interview rounds.',
    content: [
      'System design rounds are no longer reserved exclusively for staff engineers. Top product organizations now expect fresh graduates to understand distributed scalability fundamentals.',
      'Start with Clarifying Scope: Always calculate back-of-the-envelope estimations (Daily Active Users, Write QPS, Read-to-Write ratio, Storage over 5 years).',
      'The Core Building Blocks: 1) Load balancers (Nginx/HAProxy), 2) In-memory caches (Redis/Memcached), 3) Database read-replicas, and 4) Message queues for asynchronous decoupling.',
      'At Nexelvoria Academy, our placement package includes weekly 1-on-1 whiteboarding sessions simulating real FAANG and top-tier tech interview rubrics.'
    ],
    tags: ['System Design', 'Interview Prep', 'Caching', 'Redis', 'Scalability'],
    featuredImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  },
];

const INITIAL_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Admissions',
    question: 'How does student admission and course enrollment work?',
    answer: 'Students first self-register with academic credentials and verify both email and mobile numbers via 6-digit OTP (SRS Business Rule BR-001). Per BR-002, our Academic Administration team evaluates candidate qualifications and approves the application. Once approved, the student selects a course and completes online payment to activate the course lessons.',
    order: 1,
  },
  {
    id: 'faq-2',
    category: 'Fees & Payments',
    question: 'Are installment payments or partial fees supported?',
    answer: 'No. As specified in SRS Business Rule BR-005, installment payments are strictly not supported. All course enrollments require a one-time lump-sum transaction via Razorpay (UPI, Net Banking, or Debit/Credit Cards) or authorized offline payment recording by an Admin.',
    order: 2,
  },
  {
    id: 'faq-3',
    category: 'Certificates',
    question: 'What are the criteria to earn a verifiable course completion certificate?',
    answer: 'Per SRS Business Rule BR-011, certificate eligibility strictly requires all three conditions: 1) 100% completion of all course lessons, 2) At least 75% recorded attendance across live sessions, and 3) Passing marks in the comprehensive online competency examination.',
    order: 3,
  },
  {
    id: 'faq-4',
    category: 'Certificates',
    question: 'How does public certificate verification work?',
    answer: 'Every issued certificate contains a unique cryptographic identifier (e.g. NEX-2026-JFS-0104) and a scannable QR code. Employers and background check agencies can navigate to our public /verify-certificate page to immediately view candidate authenticity, attendance history, and exam scores.',
    order: 4,
  },
  {
    id: 'faq-5',
    category: 'Placements',
    question: 'Who qualifies for access to the Placement Portal and Placement Guarantee?',
    answer: 'Per SRS Business Rule BR-013, placement portal access is strictly restricted to paid and enrolled students who meet attendance and assessment benchmarks. Our dedicated placement cell manages resume reviews, mock interviews, and direct interviews with 120+ hiring partners.',
    order: 5,
  },
  {
    id: 'faq-6',
    category: 'LMS & Attendance',
    question: 'Can unpaid registered students access learning materials?',
    answer: 'Per SRS Business Rules BR-003 and BR-004, unpaid students receive limited preview access only. Protected learning modules, full video lectures, and code downloads require verified payment.',
    order: 6,
  },
  {
    id: 'faq-7',
    category: 'LMS & Attendance',
    question: 'What happens if a student misses a live class?',
    answer: 'All live lectures are recorded and published into the student LMS within 4 hours. However, per BR-010, attendance must be formally tracked as Present, Absent, or Leave. Students must maintain at least 75% overall session attendance to qualify for graduation certificates.',
    order: 7,
  },
  {
    id: 'faq-8',
    category: 'Fees & Payments',
    question: 'What is the refund and cancellation policy?',
    answer: 'Per SRS Business Rule BR-006, refund approvals are restricted exclusively to Super Admin. Students may submit a formal withdrawal request during the initial trial orientation period before live project assignment unlock.',
    order: 8,
  },
];

const INITIAL_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 't-1',
    studentName: 'Rohan Sharma',
    previousRole: 'B.Tech Graduate (Tier-3 College)',
    currentRole: 'Associate Software Engineer',
    companyName: 'Infosys Ltd',
    packageCTC: '₹ 7.2 LPA',
    courseName: 'Full Stack Java Cloud Architecture',
    rating: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    quote: 'The sequential LMS structure and mandatory 75% attendance rule made all the difference. Before Nexelvoria, I only knew theoretical Java syntax. Here I architected full Spring Cloud microservices deployed with Docker on AWS.',
    year: '2026',
  },
  {
    id: 't-2',
    studentName: 'Pooja Sundaram',
    previousRole: 'Non-IT Career Transitioner',
    currentRole: 'Full Stack React Engineer',
    companyName: 'Cognizant Technology Solutions',
    packageCTC: '₹ 8.5 LPA',
    courseName: 'MERN Stack Cloud Native Specialist',
    rating: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    quote: 'Transitioning from civil engineering to web engineering felt daunting until I joined Nexelvoria. The daily coding assignments and weekly mock interviews helped me clear 3 rounds in my first company drive!',
    year: '2026',
  },
  {
    id: 't-3',
    studentName: 'Arjun Mehta',
    previousRole: 'Junior System Analyst',
    currentRole: 'Cloud DevOps & SRE Engineer',
    companyName: 'Accenture Solutions',
    packageCTC: '₹ 11.5 LPA',
    courseName: 'DevOps & Cloud Architecture',
    rating: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
    quote: 'The hands-on Kubernetes clusters and CI/CD pipelines mirror enterprise production environments. The verifiable QR certificate gave my resume instant credibility with hiring managers.',
    year: '2026',
  },
  {
    id: 't-4',
    studentName: 'Divya Nambiar',
    previousRole: 'MCA Student',
    currentRole: 'AI Application Developer',
    companyName: 'Wipro Technologies',
    packageCTC: '₹ 9.2 LPA',
    courseName: 'Data Science & Generative AI Systems',
    rating: 5,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    quote: 'Building RAG pipelines with LangChain and fine-tuning open source models in the academy labs gave me real practical confidence. The mentors are veteran engineers who review every line of code.',
    year: '2026',
  },
];

const INITIAL_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'ach-1',
    title: 'First Prize - National Smart FinTech Hackathon 2026',
    studentName: 'Nexelvoria Java Batch-01 Team',
    category: 'Hackathon',
    description: 'Built an event-driven fraud prevention microservice processing 50,000 TPS on AWS, competing against 300+ university and corporate teams.',
    date: 'February 2026',
    badge: 'National Champions',
  },
  {
    id: 'ach-2',
    title: 'Highest Placement CTC: ₹ 32.5 LPA International Offer',
    studentName: 'Karthik Subramanian',
    category: 'Placement Milestone',
    description: 'Cracked a Senior Full-Stack role at an international cloud product firm after completing the intensive 24-week Java Cloud architecture track.',
    date: 'January 2026',
    badge: 'Record CTC',
  },
  {
    id: 'ach-3',
    title: '100% Batch Placement Milestone for Autumn 2025 Cohort',
    studentName: 'Placement Cell & 48 Enrolled Graduates',
    category: 'Placement Milestone',
    description: 'All 48 graduating students with $\\ge$ 75% attendance secured verified offers with an average compensation of ₹ 8.5 LPA.',
    date: 'December 2025',
    badge: '100% Placed',
  },
  {
    id: 'ach-4',
    title: 'Core Open Source Contribution to Apache Foundation',
    studentName: 'Anil Kumar',
    category: 'Open Source',
    description: 'Contributed performance patches to Apache Kafka connector as part of the academy’s capstone distributed systems module.',
    date: 'November 2025',
    badge: 'Open Source',
  },
];

const INITIAL_TRAINERS: TrainerProfile[] = [
  {
    id: 'tch-01',
    name: 'Dr. Vikram Seth',
    role: 'Chief Technical Instructor',
    specialization: 'Distributed Java, Spring Cloud & Microservices',
    experienceYears: 14,
    bio: 'Former Principal Architect at tier-1 enterprise tech firms. Led distributed banking architectures handling 20M+ daily transactions. Passionate mentor who has trained over 3,000 successful engineers.',
    qualifications: 'Ph.D. in Distributed Computing, IIT Bombay',
    rating: 4.95,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    formerCompanies: ['Oracle', 'Morgan Stanley', 'Infosys'],
    linkedinUrl: 'https://linkedin.com/in/vikram-seth-nexelvoria',
    coursesTaught: ['Full Stack Java Cloud Architecture'],
  },
  {
    id: 'tch-02',
    name: 'Sneha Kulkarni',
    role: 'Lead AI & Data Architect',
    specialization: 'Generative AI, PyTorch & Large Language Models',
    experienceYears: 11,
    bio: 'Former AI Research Scientist at top tech enterprise. Specialized in fine-tuning open source models, multimodal inference systems, and RAG architectures.',
    qualifications: 'M.Tech in Artificial Intelligence, IIT Madras',
    rating: 4.92,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
    formerCompanies: ['Microsoft Research', 'Fractal Analytics'],
    linkedinUrl: 'https://linkedin.com/in/sneha-kulkarni-nexelvoria',
    coursesTaught: ['Data Science & Generative AI Systems'],
  },
  {
    id: 'tch-03',
    name: 'Aditya Verma',
    role: 'Principal Cloud & DevOps Architect',
    specialization: 'Cloud DevOps, Kubernetes SRE & GitOps',
    experienceYears: 12,
    bio: 'Certified Kubernetes Administrator (CKA) and Senior DevOps Consultant. Architected multi-region AWS cloud deployments handling 100k+ RPM with zero downtime.',
    qualifications: 'B.Tech Computer Science, NIT Warangal',
    rating: 4.88,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    formerCompanies: ['Amazon Web Services', 'Red Hat'],
    linkedinUrl: 'https://linkedin.com/in/aditya-verma-nexelvoria',
    coursesTaught: ['Cloud DevOps & Kubernetes Infrastructure'],
  },
];

const INITIAL_CAREERS: CareerOpening[] = [
  {
    id: 'job-1',
    title: 'Senior Technical Instructor - Java & Cloud Architecture',
    department: 'Academics & Faculty',
    location: 'Hyderabad (Hybrid)',
    type: 'Full-time',
    experience: '8+ Years',
    description: 'We are seeking an experienced software architect who loves teaching and mentoring to lead our flagship Java Cloud engineering cohorts.',
    responsibilities: [
      'Deliver daily interactive live coding lectures on Spring Boot, Kafka, and AWS',
      'Conduct 1:1 architectural code reviews on student capstone repositories',
      'Design comprehensive online timed examinations and assessment rubrics',
      'Maintain course syllabi in sync with modern enterprise industry demands',
    ],
    requirements: [
      '8+ years in enterprise backend Java engineering with Spring Boot & Microservices',
      'Hands-on experience with Docker, Kubernetes, CI/CD, and AWS services',
      'Excellent verbal communication and passion for student outcome transformation',
    ],
    isActive: true,
  },
  {
    id: 'job-2',
    title: 'Cloud DevOps & SRE Instructor / Mentor',
    department: 'Academics & Faculty',
    location: 'Remote / Hyderabad',
    type: 'Full-time',
    experience: '5+ Years',
    description: 'Lead practical laboratory sessions on Terraform, Ansible, Kubernetes cluster management, and monitoring stacks.',
    responsibilities: [
      'Mentor students on production infrastructure automation and debugging',
      'Evaluate student assignment pull requests and provide constructive feedback',
      'Facilitate mock technical interviews simulating senior DevOps hiring rounds',
    ],
    requirements: [
      '5+ years as a DevOps/SRE Engineer; CKA or AWS Solutions Architect certified preferred',
      'Strong scripting ability in Python/Bash and deep Linux networking knowledge',
    ],
    isActive: true,
  },
  {
    id: 'job-3',
    title: 'Senior Placement & Corporate Relations Manager',
    department: 'Placements & Corporate Alliances',
    location: 'Hyderabad HQ',
    type: 'Full-time',
    experience: '4+ Years',
    description: 'Drive strategic partnerships with tier-1 IT services, product startups, and MNCs to curate exclusive campus and off-campus recruitment drives for Nexelvoria graduates.',
    responsibilities: [
      'Liaise with HR leaders, engineering managers, and staffing heads',
      'Organize monthly hiring hackathons and corporate recruitment days',
      'Track student interview funnels and negotiate salary compensation packages',
    ],
    requirements: [
      'Proven track record in tech staffing, campus placements, or EdTech corporate alliances',
      'Strong network of hiring connections across Hyderabad, Bengaluru, and Pune',
    ],
    isActive: true,
  },
];

const INITIAL_HOMEPAGE_CONFIG: HomePageConfig = {
  hero: {
    badgeText: 'Govt. Recognized & ISO 9001:2015 Certified Training Institute',
    titlePrefix: 'Launch Your Engineering Career with',
    titleHighlight: 'Nexelvoria Academy',
    subtitle: 'Enterprise full-stack, cloud architecture, and artificial intelligence programs taught by practicing industry leads. Structured sequential learning, production-grade projects, and dedicated placement support.',
    ctaPrimaryText: 'Explore All Courses',
    ctaPrimaryLink: '/courses',
    ctaSecondaryText: 'Request Free Counseling',
    valueBadges: [
      '100% Live Instructor Sessions',
      'Placement Guarantee Programs*',
      'Verifiable QR Certificates (BR-011)',
    ],
    backgroundImageUrl: '',
  },
  statistics: [
    { id: 'stat-1', value: '5,000+', label: 'Graduates Trained', valueClassName: 'text-3xl sm:text-4xl font-extrabold text-indigo-600', delay: 0, isVisible: true },
    { id: 'stat-2', value: '94.8%', label: 'Placement Rate', valueClassName: 'text-3xl sm:text-4xl font-extrabold text-slate-900', delay: 100, isVisible: true },
    { id: 'stat-3', value: '120+', label: 'Hiring Partners', valueClassName: 'text-3xl sm:text-4xl font-extrabold text-slate-900', delay: 200, isVisible: true },
    { id: 'stat-4', value: '₹ 8.5 LPA', label: 'Average CTC', valueClassName: 'text-3xl sm:text-4xl font-extrabold text-emerald-600', delay: 300, isVisible: true },
    { id: 'stat-5', value: '₹ 32.5 LPA', label: 'Highest CTC', valueClassName: 'text-3xl sm:text-4xl font-extrabold text-amber-500', delay: 400, isVisible: true },
  ],
  sectionVisibility: {
    hero: true,
    statistics: true,
    intro: true,
    courses: true,
    advantage: true,
    methodology: true,
    trainersOrbit: true,
    hiringMarquee: true,
    achievements: true,
    partnerships: true,
    testimonials: true,
    blog: true,
    faqs: true,
    leadForm: true,
  },
  advantages: [
    {
      title: 'Sequential LMS Architecture',
      desc: 'Structured module → chapter → lesson hierarchy. Students track real completion with video player, study materials, and inline doubts.',
      iconName: 'Play',
      color: 'text-indigo-400 bg-indigo-500/15',
    },
    {
      title: 'Practicing Industry Mentors',
      desc: 'Learn directly from architects and senior developers with 10+ years at Microsoft, Oracle, AWS, and tier-1 consulting firms.',
      iconName: 'Users',
      color: 'text-emerald-400 bg-emerald-500/15',
    },
    {
      title: 'Tamper-Proof QR Certificates',
      desc: 'Earned strictly through 100% course completion, ≥ 75% attendance, and passing marks. Instantly verifiable by employers worldwide.',
      iconName: 'ShieldCheck',
      color: 'text-sky-400 bg-sky-500/15',
    },
    {
      title: 'Dedicated Placement Cell',
      desc: 'Exclusive recruitment portal access for eligible students with 120+ active hiring partners, mock interviews, and offer letter tracking.',
      iconName: 'Briefcase',
      color: 'text-amber-400 bg-amber-500/15',
    },
    {
      title: 'Strict Attendance Governance',
      desc: 'Enforced by SRS Business Rule BR-010. Three-way attendance status (Present, Absent, Leave) with automated 75% threshold alerts.',
      iconName: 'Calendar',
      color: 'text-rose-400 bg-rose-500/15',
    },
    {
      title: 'Timed Online Test Engine',
      desc: 'Simulated hiring tests with countdown timers, question palettes, MCQs, MSQs, and coding evaluations with instructor feedback.',
      iconName: 'Sparkles',
      color: 'text-purple-400 bg-purple-500/15',
    },
  ],
  methodology: [
    {
      step: '01',
      title: 'Architectural Foundations',
      desc: 'Master deep computer science principles, object-oriented design, data structures, and multi-threaded JVM internals.',
    },
    {
      step: '02',
      title: 'Production Lab Drills',
      desc: 'Daily code commits, test-driven development (TDD), Dockerized containers, and peer code reviews.',
    },
    {
      step: '03',
      title: 'Capstone Distributed Projects',
      desc: 'Architect event-driven microservices with Kafka, deploy to AWS EKS Kubernetes clusters, and optimize cloud latency.',
    },
    {
      step: '04',
      title: '1:1 Mock Interviews & System Design',
      desc: 'Weekly timed technical coding exams, algorithmic whiteboarding, and individualized interview feedback rubrics.',
    },
    {
      step: '05',
      title: 'Corporate Placement Drives',
      desc: 'Exclusive recruitment drives across 120+ partnered enterprises with placement guarantee commitments.',
    },
  ],
};

const INITIAL_ABOUT_CONFIG: AboutUsConfig = {
  header: {
    badgeText: 'Our Mission & Pedagogy',
    title: 'Empowering the Next Generation of Global Software Architects',
    description: 'Founded in Hyderabad, India, Nexelvoria Academy was born out of a stark industry disparity: fresh engineering graduates lacked production experience, while modern tech enterprises faced an acute shortage of developers capable of operating on high-velocity distributed codebases.',
  },
  vision: {
    title: 'Our Vision',
    description: 'To establish an internationally benchmarked center of training excellence that equips engineering students with production-grade engineering competencies, ethical foundations, and high-impact career pathways across global technology ecosystems.',
  },
  mission: {
    title: 'Our Mission',
    description: 'Provide direct mentorship from practicing technology leads, structured learning management workflows, automated continuous assessments, and strong corporate hiring networks so that every motivated graduate can achieve enterprise-grade technical success.',
  },
  objectives: [
    {
      title: 'Industry-Grade Competency',
      desc: 'Ensure every graduating engineer writes modular, clean, test-covered code conforming to enterprise production standards.',
    },
    {
      title: 'Zero Rote Learning',
      desc: 'Replace memorization with algorithmic reasoning, system design whiteboarding, and continuous integration pipelines.',
    },
    {
      title: 'Verifiable Integrity',
      desc: 'Maintain strict 75% attendance hurdles (BR-010) and comprehensive proctored examinations before awarding credentials.',
    },
    {
      title: 'Equal Opportunity Placements',
      desc: 'Bridge tier-2 and tier-3 college engineering talent with tier-1 enterprise technology recruiters through structured training.',
    },
    {
      title: 'Mentorship by Practitioners',
      desc: 'Instructors are practicing engineering architects and senior technical leads, not theoretical academic lecturers.',
    },
    {
      title: 'Continuous Career Evolution',
      desc: 'Lifelong alumni network, masterclasses on emerging tech (GenAI, Cloud-Native, Rust), and ongoing career counseling.',
    },
  ],
  pedagogy: [
    { step: '1', title: 'Conceptual Rigor', desc: 'Live lectures breaking down why architectures exist—from thread pools and socket connections to Kafka offsets.' },
    { step: '2', title: 'Daily Code Drills', desc: 'Every lesson concludes with required coding assignments submitted via GitHub and graded with automated and mentor reviews.' },
    { step: '3', title: 'Distributed Capstones', desc: 'Students build resilient multi-service architectures deployed into real AWS ECS/EKS clusters with CI/CD and metrics telemetry.' },
    { step: '4', title: 'Assessment Hurdles', desc: 'Timed examinations and 1-on-1 interview evaluations ensure only authentic mastery unlocks certification and placements.' },
  ],
  comparison: [
    { feature: 'Curriculum Focus', traditional: 'Outdated university syllabus', aggregator: 'Pre-recorded generic videos', nexelvoria: 'Production distributed microservices & AI' },
    { feature: 'Instructor Quality', traditional: 'Academic lecturers without cloud experience', aggregator: 'Unverified content creators', nexelvoria: 'Practicing architects from Oracle, AWS, Microsoft' },
    { feature: 'Learning Structure', traditional: 'Passive classroom lectures', aggregator: 'Self-paced unmonitored videos', nexelvoria: 'Sequential LMS with unlocked checkpoints' },
    { feature: 'Attendance & Rigor', traditional: 'Pen-and-paper roll call', aggregator: 'Zero attendance tracking', nexelvoria: 'Strict 75% threshold enforced for certification' },
    { feature: 'Placement Assistance', traditional: 'Mass recruitment service desks', aggregator: 'Job board forwarding only', nexelvoria: '1:1 Mocks, placement guarantee, 120+ hiring partners' },
    { feature: 'Certificate Credibility', traditional: 'Generic printed paper', aggregator: 'Unverifiable PDF image', nexelvoria: 'Cryptographic ID & Scannable QR Verification' },
  ],
  headquarters: {
    badgeText: 'Campus Infrastructure',
    title: 'Technology Headquarters & Physical Infrastructure',
    description: 'While our courses are delivered online across India, our corporate hub is located at Nexelvoria Tech Tower, Cyber City, Hyderabad, Telangana 500081. Equipped with state-of-the-art virtual broadcasting studios, dedicated doubt-resolution cells, and high-throughput video encoding pipelines.',
    address: 'Nexelvoria Tech Tower, Cyber City, Hyderabad, Telangana 500081',
  },
  campus: {
    badgeText: 'Campus Infrastructure',
    title: 'Technology Headquarters & Physical Infrastructure',
    description: 'While our courses are delivered online across India, our corporate hub is located at Nexelvoria Tech Tower, Cyber City, Hyderabad, Telangana 500081. Equipped with state-of-the-art virtual broadcasting studios, dedicated doubt-resolution cells, and high-throughput video encoding pipelines.',
    location: 'Hyderabad, Telangana',
  },
  sectionVisibility: {
    header: true,
    visionMission: true,
    objectives: true,
    pedagogy: true,
    comparison: true,
    headquarters: true,
    campus: true,
  },
};

const INITIAL_HIRING_PARTNERS: HiringPartnerCompany[] = [
  { id: 'comp-01', name: 'Accio Technologies', website: 'https://acciotech.example.com', location: 'Hyderabad / Bangalore', industry: 'FinTech & High-Frequency Trading', about: 'Leading technology product powerhouse building distributed payment gateways across Southeast Asia.', activeOpeningsCount: 3, isVisible: true, displayOrder: 1 },
  { id: 'comp-02', name: 'Tata Consultancy Services', logoUrl: '/logos/tcs.svg', website: 'https://tcs.com', location: 'Hyderabad / Chennai / Pune', industry: 'Global IT Consulting & Solutions', about: 'Multinational digital transformer delivering cloud solutions to 1,000+ Fortune 500 customers.', activeOpeningsCount: 8, isVisible: true, displayOrder: 2 },
  { id: 'comp-03', name: 'Infosys Limited', logoUrl: '/logos/infosys.svg', website: 'https://infosys.com', location: 'Bangalore / Hyderabad', industry: 'Cloud & Next-Gen Services', about: 'Global leader in next-generation digital services and consulting for banking and insurance.', activeOpeningsCount: 12, isVisible: true, displayOrder: 3 },
  { id: 'comp-ext-1', name: 'Wipro Technologies', logoUrl: '/logos/wipro.svg', website: 'https://wipro.com', location: 'Pan India', industry: 'Enterprise IT Services', about: 'Global technology services and consulting.', activeOpeningsCount: 6, isVisible: true, displayOrder: 4 },
  { id: 'comp-ext-2', name: 'Capgemini Engineering', logoUrl: '/logos/capgemini.svg', website: 'https://capgemini.com', location: 'Hyderabad / Pune', industry: 'Cloud & Digital Engineering', about: 'Leader in digital transformation and innovation.', activeOpeningsCount: 4, isVisible: true, displayOrder: 5 },
  { id: 'comp-ext-3', name: 'Accenture India', logoUrl: '/logos/accenture.svg', website: 'https://accenture.com', location: 'Bengaluru / Hyderabad', industry: 'Consulting & Cloud Modernization', about: 'Delivering on the promise of technology and human ingenuity.', activeOpeningsCount: 8, isVisible: true, displayOrder: 6 },
  { id: 'comp-ext-4', name: 'Cognizant Digital', logoUrl: '/logos/cognizant.svg', website: 'https://cognizant.com', location: 'Chennai / Hyderabad', industry: 'Digital Systems & Cloud Native', about: 'Helping clients modernize technology and reimagine processes.', activeOpeningsCount: 5, isVisible: true, displayOrder: 7 },
  { id: 'comp-ext-5', name: 'Oracle Financial Services', logoUrl: '/logos/oracle.svg', website: 'https://oracle.com', location: 'Hyderabad / Bengaluru', industry: 'Enterprise Software & Cloud', about: 'Cloud infrastructure and autonomous enterprise databases.', activeOpeningsCount: 3, isVisible: true, displayOrder: 8 },
  { id: 'comp-ext-6', name: 'Deloitte Digital', logoUrl: '/logos/deloitte.svg', website: 'https://deloitte.com', location: 'Hyderabad', industry: 'Technology & Enterprise Architecture', about: 'Strategic digital advisory and enterprise architecture.', activeOpeningsCount: 4, isVisible: true, displayOrder: 9 },
  { id: 'comp-04', name: 'Persistent Systems', logoUrl: '/logos/persistent.svg', website: 'https://persistent.com', location: 'Pune / Hyderabad', industry: 'Digital Engineering & Enterprise Modernization', about: 'Trusted software partner creating resilient microservices and digital products.', activeOpeningsCount: 5, isVisible: true, displayOrder: 10 },
  { id: 'comp-05', name: 'HCLTech', logoUrl: '/logos/hcltech.svg', website: 'https://hcltech.com', location: 'Noida / Hyderabad', industry: 'Next-Generation Technology Solutions', about: 'Engineering modern software products and hybrid cloud environments.', activeOpeningsCount: 7, isVisible: true, displayOrder: 11 },
  { id: 'comp-06', name: 'Tech Mahindra', logoUrl: '/logos/tech-mahindra.svg', website: 'https://techmahindra.com', location: 'Hyderabad / Pune', industry: 'Telecommunications & Digital Transformation', about: 'Connecting solutions across 5G networks, cloud migration, and IoT.', activeOpeningsCount: 6, isVisible: true, displayOrder: 12 },
];

const INITIAL_MARQUEE_CONFIG: MarqueeAnimationConfig = {
  isEnabled: true,
  rowCount: 2,
  row1Direction: 'left',
  row2Direction: 'right',
  row1Speed: 'normal',
  row2Speed: 'normal',
  directionRow1: 'left',
  directionRow2: 'right',
  speed: 'normal',
  pauseOnHover: true,
};

const INITIAL_COLLEGE_PARTNERSHIPS: CollegePartnershipConfig = {
  header: {
    badgeText: 'Institutional Alliances',
    title: 'College & University MoUs',
    subtitle: 'Partnering with engineering institutions across India to bridge academia with industry-grade software training and campus recruitment drives.',
  },
  benefits: [
    { title: 'Custom Campus Bootcamps', desc: 'Semester-aligned bootcamps conducted on-campus or virtually with LMS portal access for every enrolled student.' },
    { title: 'Exclusive Campus Drives', desc: 'Top tier hiring partners invited specifically for partnered colleges, improving overall departmental placement records.' },
    { title: 'Faculty Development Programs (FDP)', desc: 'Equipping college professors with the latest trends in Cloud Microservices, GenAI, and DevOps architectures.' },
  ],
  partners: [
    { id: 'mou-01', collegeName: 'Osmania University College of Engineering', location: 'Hyderabad', mouYear: '2024', activeStudentsCount: 320, isVisible: true, displayOrder: 1 },
    { id: 'mou-02', collegeName: 'JNTU College of Engineering', location: 'Hyderabad', mouYear: '2024', activeStudentsCount: 450, isVisible: true, displayOrder: 2 },
    { id: 'mou-03', collegeName: 'Chaitanya Bharathi Institute of Technology (CBIT)', location: 'Hyderabad', mouYear: '2025', activeStudentsCount: 280, isVisible: true, displayOrder: 3 },
    { id: 'mou-04', collegeName: 'VNR Vignana Jyothi Institute of Engineering & Technology', location: 'Hyderabad', mouYear: '2025', activeStudentsCount: 210, isVisible: true, displayOrder: 4 },
  ],
  partnerColleges: [
    { id: 'mou-01', name: 'Osmania University College of Engineering', location: 'Hyderabad', mouYear: '2024', activeStudentsCount: 320 },
    { id: 'mou-02', name: 'JNTU College of Engineering', location: 'Hyderabad', mouYear: '2024', activeStudentsCount: 450 },
    { id: 'mou-03', name: 'Chaitanya Bharathi Institute of Technology (CBIT)', location: 'Hyderabad', mouYear: '2025', activeStudentsCount: 280 },
    { id: 'mou-04', name: 'VNR Vignana Jyothi Institute of Engineering & Technology', location: 'Hyderabad', mouYear: '2025', activeStudentsCount: 210 },
  ],
  sectionVisibility: {
    header: true,
    benefits: true,
    form: true,
    partnerList: true,
  },
};

const INITIAL_CORPORATE_TRAINING: CorporateTrainingConfig = {
  header: {
    badgeText: 'Enterprise Solutions',
    title: 'Upskill Engineering Teams with Custom Cohorts',
    subtitle: 'Accelerate your workforce into modern cloud architectures, microservices migration, Kubernetes, and enterprise GenAI systems.',
  },
  offerings: [
    { id: 'corp-1', title: 'Dedicated Sandboxes', desc: 'Every corporate cohort receives tailored AWS/GCP cloud environments pre-configured with project repositories and CI/CD pipelines.', iconName: 'Laptop', isVisible: true },
    { id: 'corp-2', title: 'Customized Tech Stack', desc: 'We adapt curriculum modules to mirror your company’s internal architectural patterns and proprietary internal APIs.', iconName: 'ShieldCheck', isVisible: true },
    { id: 'corp-3', title: 'Outcome-Driven Milestones', desc: 'Real-time analytics reports delivered to engineering VPs on engineer attendance, test pass rates, and codebase contributions.', iconName: 'Briefcase', isVisible: true },
  ],
  clients: [
    { id: 'client-1', name: 'Wipro Technologies', companyName: 'Wipro Technologies', isVisible: true },
    { id: 'client-2', name: 'Capgemini', companyName: 'Capgemini', isVisible: true },
    { id: 'client-3', name: 'Persistent Systems', companyName: 'Persistent Systems', isVisible: true },
  ],
  sectionVisibility: {
    header: true,
    offerings: true,
    form: true,
    clients: true,
  },
};

const INITIAL_CONTACT_CONFIG: ContactInfoConfig = {
  supportEmail: 'admissions@nexelvoria.edu.in',
  supportPhone: '+91 98765 43210',
  whatsappNumber: '+91 98765 43210',
  campusAddress: 'Nexelvoria Tech Tower, Cyber City, Hyderabad, Telangana 500081',
  operatingHours: 'Monday - Saturday: 9:00 AM - 7:00 PM IST',
  timezone: 'Asia/Kolkata',
  socialLinks: {
    linkedin: 'https://linkedin.com/company/nexelvoria-academy',
    github: 'https://github.com/nexelvoria-academy',
    twitter: 'https://x.com/nexelvoria',
    youtube: 'https://youtube.com/@nexelvoria-academy',
  },
};

const INITIAL_HEADER_FOOTER_CONFIG: HeaderFooterConfig = {
  logoTitle: 'Nexelvoria',
  logoSubtitle: 'Academy',
  navLinks: [
    { label: 'Home', path: '/', isVisible: true, order: 1 },
    { label: 'Courses', path: '/courses', isVisible: true, order: 2 },
    { label: 'Placements', path: '/placements', isVisible: true, order: 3 },
    { label: 'Trainers', path: '/trainers', isVisible: true, order: 4 },
    { label: 'Partnerships', path: '/college-partnerships', isVisible: true, order: 5 },
    { label: 'Corporate', path: '/corporate-training', isVisible: true, order: 6 },
    { label: 'Success Stories', path: '/testimonials', isVisible: true, order: 7 },
    { label: 'Blog', path: '/blog', isVisible: true, order: 8 },
    { label: 'About Us', path: '/about-us', isVisible: true, order: 9 },
    { label: 'Contact', path: '/contact-us', isVisible: true, order: 10 },
  ],
  footerDescription: 'Industry-led training institute bridging academic education with production engineering excellence. Equipping developers and tech professionals with hands-on competencies and placement guarantees.',
  copyrightText: 'Nexelvoria Academy. All rights reserved. Timezone: Asia/Kolkata.',
};

export const INITIAL_SOCIAL_LINKS: SocialMediaLink[] = [
  {
    id: 'soc-linkedin',
    platform: 'linkedin',
    platformName: 'LinkedIn',
    url: 'https://linkedin.com/company/nexelvoria-academy',
    isEnabled: true,
    showInHeader: true,
    showInFooter: true,
    showInContact: true,
    order: 1,
  },
  {
    id: 'soc-github',
    platform: 'github',
    platformName: 'GitHub',
    url: 'https://github.com/nexelvoria-academy',
    isEnabled: true,
    showInHeader: true,
    showInFooter: true,
    showInContact: true,
    order: 2,
  },
  {
    id: 'soc-twitter',
    platform: 'twitter',
    platformName: 'X (Twitter)',
    url: 'https://x.com/nexelvoria',
    isEnabled: true,
    showInHeader: true,
    showInFooter: true,
    showInContact: true,
    order: 3,
  },
  {
    id: 'soc-youtube',
    platform: 'youtube',
    platformName: 'YouTube',
    url: 'https://youtube.com/@nexelvoria-academy',
    isEnabled: true,
    showInHeader: true,
    showInFooter: true,
    showInContact: true,
    order: 4,
  },
  {
    id: 'soc-instagram',
    platform: 'instagram',
    platformName: 'Instagram',
    url: 'https://instagram.com/nexelvoria',
    isEnabled: true,
    showInHeader: false,
    showInFooter: true,
    showInContact: true,
    order: 5,
  },
  {
    id: 'soc-facebook',
    platform: 'facebook',
    platformName: 'Facebook',
    url: 'https://facebook.com/nexelvoria',
    isEnabled: true,
    showInHeader: false,
    showInFooter: true,
    showInContact: true,
    order: 6,
  },
  {
    id: 'soc-whatsapp',
    platform: 'whatsapp',
    platformName: 'WhatsApp',
    url: 'https://wa.me/919876543210',
    isEnabled: true,
    showInHeader: false,
    showInFooter: true,
    showInContact: true,
    order: 7,
  },
  {
    id: 'soc-telegram',
    platform: 'telegram',
    platformName: 'Telegram',
    url: 'https://t.me/nexelvoria',
    isEnabled: true,
    showInHeader: false,
    showInFooter: true,
    showInContact: true,
    order: 8,
  },
];

const INITIAL_SEO_CONFIG: SEOConfig = {
  defaultTitleSuffix: 'Nexelvoria Academy',
  defaultOgImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  pages: {
    '/': { path: '/', title: 'Premier Online Training Institute & LMS', description: 'Launch your software engineering career with Nexelvoria Academy. Hands-on Java, MERN, Cloud DevOps, and GenAI training with placement guarantee.', keywords: ['Online Training Institute', 'LMS', 'Java Full Stack', 'Cloud DevOps', 'Placement Guarantee'] },
    '/about-us': { path: '/about-us', title: 'About Us – Mission, Pedagogy & Leadership', description: 'Learn about Nexelvoria Academy\'s mission to bridge academic education with enterprise production software engineering excellence.', keywords: ['About Nexelvoria', 'Software Engineering Pedagogy', 'Tech Institute Hyderabad'] },
    '/courses': { path: '/courses', title: 'Industry-Aligned Training Courses & Certification', description: 'Explore our comprehensive software engineering, cloud architecture, and AI programs. Hands-on labs, 75% attendance hurdles, and placement support.', keywords: ['Software Courses', 'Java Full Stack', 'Cloud DevOps', 'GenAI Courses'] },
    '/placements': { path: '/placements', title: 'Placement Cell – 94.8% Success Rate & Hiring Partners', description: 'Explore Nexelvoria Academy\'s placement services: 120+ hiring partners, ₹8.5 LPA average package, ₹32.5 LPA highest package, and placement guarantee programs.', keywords: ['Placement Guarantee', 'Tech Placements', 'Software Engineer Jobs', 'Hiring Partners'] },
    '/trainers': { path: '/trainers', title: 'Distinguished Industry Mentors & Faculty', description: 'Learn from top technology leads and former architects from Oracle, Microsoft, AWS, and tier-1 tech consulting enterprises.', keywords: ['Software Trainers', 'Tech Mentors', 'Java Instructors', 'DevOps Faculty'] },
    '/college-partnerships': { path: '/college-partnerships', title: 'College & University MoUs', description: 'Partnering with engineering institutions across India to bridge academia with industry-grade software training and campus recruitment drives.', keywords: ['College MoUs', 'Institutional Partnerships', 'Campus Bootcamps'] },
    '/corporate-training': { path: '/corporate-training', title: 'Corporate Upskilling & Finishing School', description: 'Accelerate your workforce into modern cloud architectures, microservices migration, Kubernetes, and enterprise GenAI systems.', keywords: ['Corporate Training', 'Enterprise Upskilling', 'Cloud Sandboxes'] },
    '/testimonials': { path: '/testimonials', title: 'Student Testimonials & Alumni Reviews', description: 'Read authentic reviews and career transition stories from Nexelvoria Academy graduates placed at top tech enterprises.', keywords: ['Student Reviews', 'Nexelvoria Testimonials', 'Alumni Placement Stories'] },
    '/achievements': { path: '/achievements', title: 'Student Achievements & Institutional Awards', description: 'Explore national hackathon championships, record placement packages, and institutional milestones achieved by Nexelvoria Academy students.', keywords: ['Student Achievements', 'Hackathon Winners', 'Tech Awards'] },
    '/contact-us': { path: '/contact-us', title: 'Contact Us – Admissions, Enquiries & Callback Requests', description: 'Connect with Nexelvoria Academy admissions counselors. Submit course inquiries, request a free callback, or visit our Hyderabad tech campus.', keywords: ['Contact Nexelvoria', 'Admissions Phone', 'Course Enquiry'] },
    '/faqs': { path: '/faqs', title: 'Frequently Asked Questions (FAQs)', description: 'Find answers regarding Nexelvoria Academy admissions, dual OTP verification, fees, 75% attendance rule, and placement guarantee.', keywords: ['Nexelvoria FAQs', 'Admission Questions', 'Fee Policy'] },
    '/blog': { path: '/blog', title: 'Technical Insights, System Design & Career Guides', description: 'Deep dives into enterprise Java, Project Loom virtual threads, Apache Kafka saga architectures, and tech interview preparation.', keywords: ['Software Engineering Blog', 'System Design Guides', 'Java 21 Virtual Threads'] },
    '/careers': { path: '/careers', title: 'Careers at Nexelvoria Academy – Faculty & Staff Openings', description: 'Join our faculty and operations team. Explore open roles for instructors, curriculum architects, and placement managers.', keywords: ['Careers at Academy', 'Instructor Jobs', 'Tech Teaching Openings'] },
  },
};

const INITIAL_MEDIA_LIBRARY: MediaAsset[] = [
  { id: 'med-01', name: 'Nexelvoria Hero Collaboration', category: 'banner', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80', uploadedAt: '2026-11-01' },
  { id: 'med-02', name: 'Virtual Threads Blog Banner', category: 'banner', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80', uploadedAt: '2026-11-01' },
  { id: 'med-03', name: 'Kafka Saga Architecture Banner', category: 'banner', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', uploadedAt: '2026-10-24' },
  { id: 'med-04', name: 'System Design Interview Checklist', category: 'banner', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80', uploadedAt: '2026-10-15' },
  { id: 'med-05', name: 'Rohan Sharma Avatar', category: 'avatar', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80', uploadedAt: '2026-11-01' },
  { id: 'med-06', name: 'Pooja Sundaram Avatar', category: 'avatar', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', uploadedAt: '2026-11-01' },
  { id: 'med-07', name: 'Arjun Mehta Avatar', category: 'avatar', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80', uploadedAt: '2026-11-01' },
  { id: 'med-08', name: 'Divya Nambiar Avatar', category: 'avatar', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80', uploadedAt: '2026-11-01' },
  { id: 'med-09', name: 'Dr. Vikram Seth Avatar', category: 'avatar', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', uploadedAt: '2026-11-01' },
  { id: 'med-10', name: 'Sneha Kulkarni Avatar', category: 'avatar', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', uploadedAt: '2026-11-01' },
  { id: 'med-11', name: 'Aditya Verma Avatar', category: 'avatar', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', uploadedAt: '2026-11-01' },
];

class CMSService {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cms-update', { detail: { key } }));
      }
    } catch (e) {
      console.warn(`Failed to save to localStorage key "${key}":`, e);
    }
  }

  // --- Banners (PUB-022) ---
  getBanners(): WebsiteBanner[] {
    return this.getStorageItem<WebsiteBanner[]>(STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
  }

  getActiveBanner(): WebsiteBanner | null {
    const banners = this.getBanners();
    return banners.find((b) => b.isActive) || banners[0] || null;
  }

  updateBanners(banners: WebsiteBanner[]): void {
    this.setStorageItem(STORAGE_KEYS.BANNERS, banners);
  }

  deleteBanner(id: string): void {
    const banners = this.getBanners().filter((b) => b.id !== id);
    this.setStorageItem(STORAGE_KEYS.BANNERS, banners);
  }

  // --- Blogs & Articles (PUB-013) ---
  getArticles(): BlogArticle[] {
    return this.getStorageItem<BlogArticle[]>(STORAGE_KEYS.BLOGS, INITIAL_BLOGS);
  }

  getArticleBySlug(slug: string): BlogArticle | null {
    const articles = this.getArticles();
    return articles.find((a) => a.slug === slug || a.id === slug) || null;
  }

  saveArticle(article: BlogArticle): void {
    const articles = this.getArticles();
    const index = articles.findIndex((a) => a.id === article.id);
    if (index >= 0) {
      articles[index] = article;
    } else {
      articles.unshift(article);
    }
    this.setStorageItem(STORAGE_KEYS.BLOGS, articles);
  }

  deleteArticle(id: string): void {
    const articles = this.getArticles().filter((a) => a.id !== id);
    this.setStorageItem(STORAGE_KEYS.BLOGS, articles);
  }

  // --- FAQs (PUB-012) ---
  getFAQs(): FAQItem[] {
    return this.getStorageItem<FAQItem[]>(STORAGE_KEYS.FAQS, INITIAL_FAQS);
  }

  saveFAQ(faq: FAQItem): void {
    const faqs = this.getFAQs();
    const index = faqs.findIndex((f) => f.id === faq.id);
    if (index >= 0) {
      faqs[index] = faq;
    } else {
      faqs.push(faq);
    }
    this.setStorageItem(STORAGE_KEYS.FAQS, faqs);
  }

  deleteFAQ(id: string): void {
    const faqs = this.getFAQs().filter((f) => f.id !== id);
    this.setStorageItem(STORAGE_KEYS.FAQS, faqs);
  }

  // --- Testimonials & Achievements (PUB-009, PUB-010) ---
  getTestimonials(): TestimonialItem[] {
    return this.getStorageItem<TestimonialItem[]>(STORAGE_KEYS.TESTIMONIALS, INITIAL_TESTIMONIALS);
  }

  saveTestimonial(item: TestimonialItem): void {
    const items = this.getTestimonials();
    const idx = items.findIndex((t) => t.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    this.setStorageItem(STORAGE_KEYS.TESTIMONIALS, items);
  }

  deleteTestimonial(id: string): void {
    const items = this.getTestimonials().filter((t) => t.id !== id);
    this.setStorageItem(STORAGE_KEYS.TESTIMONIALS, items);
  }

  getAchievements(): AchievementItem[] {
    return this.getStorageItem<AchievementItem[]>(STORAGE_KEYS.ACHIEVEMENTS, INITIAL_ACHIEVEMENTS);
  }

  saveAchievement(item: AchievementItem): void {
    const items = this.getAchievements();
    const idx = items.findIndex((a) => a.id === item.id);
    if (idx >= 0) items[idx] = item;
    else items.unshift(item);
    this.setStorageItem(STORAGE_KEYS.ACHIEVEMENTS, items);
  }

  deleteAchievement(id: string): void {
    const items = this.getAchievements().filter((a) => a.id !== id);
    this.setStorageItem(STORAGE_KEYS.ACHIEVEMENTS, items);
  }

  // --- Trainers (PUB-006) ---
  getTrainers(): TrainerProfile[] {
    return this.getStorageItem<TrainerProfile[]>(STORAGE_KEYS.TRAINERS, INITIAL_TRAINERS);
  }

  saveTrainer(trainer: TrainerProfile): void {
    const trainers = this.getTrainers();
    const idx = trainers.findIndex((t) => t.id === trainer.id);
    if (idx >= 0) trainers[idx] = trainer;
    else trainers.push(trainer);
    this.setStorageItem(STORAGE_KEYS.TRAINERS, trainers);
  }

  deleteTrainer(id: string): void {
    const trainers = this.getTrainers().filter((t) => t.id !== id);
    this.setStorageItem(STORAGE_KEYS.TRAINERS, trainers);
  }

  // --- Careers (PUB-014) ---
  getCareers(): CareerOpening[] {
    return this.getStorageItem<CareerOpening[]>(STORAGE_KEYS.CAREERS, INITIAL_CAREERS);
  }

  saveCareer(career: CareerOpening): void {
    const careers = this.getCareers();
    const idx = careers.findIndex((c) => c.id === career.id);
    if (idx >= 0) careers[idx] = career;
    else careers.push(career);
    this.setStorageItem(STORAGE_KEYS.CAREERS, careers);
  }

  deleteCareer(id: string): void {
    const careers = this.getCareers().filter((c) => c.id !== id);
    this.setStorageItem(STORAGE_KEYS.CAREERS, careers);
  }

  // --- Enquiries & Lead Capture (PUB-011, PUB-018, PUB-019) ---
  getEnquiries(): LeadEnquiry[] {
    return this.getStorageItem<LeadEnquiry[]>(STORAGE_KEYS.ENQUIRIES, []);
  }

  submitEnquiry(enquiry: Omit<LeadEnquiry, 'id' | 'submittedAt' | 'status'>): LeadEnquiry {
    const enquiries = this.getEnquiries();
    const newEnquiry: LeadEnquiry = {
      ...enquiry,
      id: `enq-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'new',
    };
    enquiries.unshift(newEnquiry);
    this.setStorageItem(STORAGE_KEYS.ENQUIRIES, enquiries);
    return newEnquiry;
  }

  updateEnquiryStatus(id: string, status: LeadEnquiry['status']): void {
    const enquiries = this.getEnquiries();
    const target = enquiries.find((e) => e.id === id);
    if (target) {
      target.status = status;
      this.setStorageItem(STORAGE_KEYS.ENQUIRIES, enquiries);
    }
  }

  // --- 1. Home Page Configuration ---
  getHomePageConfig(): HomePageConfig {
    return this.getStorageItem<HomePageConfig>(STORAGE_KEYS.HOMEPAGE_CONFIG, INITIAL_HOMEPAGE_CONFIG);
  }

  saveHomePageConfig(config: HomePageConfig): void {
    this.setStorageItem(STORAGE_KEYS.HOMEPAGE_CONFIG, config);
  }

  // --- 2. About Us Configuration ---
  getAboutUsConfig(): AboutUsConfig {
    return this.getStorageItem<AboutUsConfig>(STORAGE_KEYS.ABOUT_CONFIG, INITIAL_ABOUT_CONFIG);
  }

  saveAboutUsConfig(config: AboutUsConfig): void {
    this.setStorageItem(STORAGE_KEYS.ABOUT_CONFIG, config);
  }

  // --- 6. Hiring Partners & Marquee Controls ---
  getHiringPartners(): HiringPartnerCompany[] {
    const partners = this.getStorageItem<HiringPartnerCompany[]>(STORAGE_KEYS.HIRING_PARTNERS, INITIAL_HIRING_PARTNERS);
    // Partners persisted before logos were seeded have no logoUrl; backfill from the seed by id.
    return partners.map((p) =>
      p.logoUrl ? p : { ...p, logoUrl: INITIAL_HIRING_PARTNERS.find((seed) => seed.id === p.id)?.logoUrl }
    );
  }

  saveHiringPartner(partner: HiringPartnerCompany): void {
    const partners = this.getHiringPartners();
    const idx = partners.findIndex((p) => p.id === partner.id);
    if (idx >= 0) {
      partners[idx] = partner;
    } else {
      partners.push(partner);
    }
    this.setStorageItem(STORAGE_KEYS.HIRING_PARTNERS, partners);
  }

  deleteHiringPartner(id: string): void {
    const partners = this.getHiringPartners().filter((p) => p.id !== id);
    this.setStorageItem(STORAGE_KEYS.HIRING_PARTNERS, partners);
  }

  getMarqueeConfig(): MarqueeAnimationConfig {
    return this.getStorageItem<MarqueeAnimationConfig>(STORAGE_KEYS.MARQUEE_CONFIG, INITIAL_MARQUEE_CONFIG);
  }

  saveMarqueeConfig(config: MarqueeAnimationConfig): void {
    this.setStorageItem(STORAGE_KEYS.MARQUEE_CONFIG, config);
  }

  // --- 10. College Partnerships ---
  getCollegePartnerships(): CollegePartnershipConfig {
    return this.getStorageItem<CollegePartnershipConfig>(STORAGE_KEYS.COLLEGE_PARTNERSHIPS, INITIAL_COLLEGE_PARTNERSHIPS);
  }

  saveCollegePartnerships(config: CollegePartnershipConfig): void {
    this.setStorageItem(STORAGE_KEYS.COLLEGE_PARTNERSHIPS, config);
  }

  // --- 11. Corporate Training ---
  getCorporateTraining(): CorporateTrainingConfig {
    return this.getStorageItem<CorporateTrainingConfig>(STORAGE_KEYS.CORPORATE_TRAINING, INITIAL_CORPORATE_TRAINING);
  }

  saveCorporateTraining(config: CorporateTrainingConfig): void {
    this.setStorageItem(STORAGE_KEYS.CORPORATE_TRAINING, config);
  }

  // --- 14. Contact Info Configuration ---
  getContactInfo(): ContactInfoConfig {
    return this.getStorageItem<ContactInfoConfig>(STORAGE_KEYS.CONTACT_CONFIG, INITIAL_CONTACT_CONFIG);
  }

  saveContactInfo(config: ContactInfoConfig): void {
    this.setStorageItem(STORAGE_KEYS.CONTACT_CONFIG, config);
  }

  // --- 14b. Social Media Channels Configuration ---
  getSocialMediaLinks(): SocialMediaLink[] {
    const stored = this.getStorageItem<SocialMediaLink[]>(STORAGE_KEYS.SOCIAL_LINKS, INITIAL_SOCIAL_LINKS);
    if (!Array.isArray(stored) || stored.length === 0) {
      return INITIAL_SOCIAL_LINKS;
    }
    return stored;
  }

  saveSocialMediaLinks(links: SocialMediaLink[]): void {
    this.setStorageItem(STORAGE_KEYS.SOCIAL_LINKS, links);
    // Backward compatibility: keep contactConfig.socialLinks updated
    try {
      const contact = this.getContactInfo();
      const updatedSocial: Record<string, string> = { ...contact.socialLinks };
      links.forEach((item) => {
        if (item.isEnabled && item.url) {
          if (item.platform === 'linkedin') updatedSocial.linkedin = item.url;
          if (item.platform === 'github') updatedSocial.github = item.url;
          if (item.platform === 'twitter' || item.platform === 'x') updatedSocial.twitter = item.url;
          if (item.platform === 'youtube') updatedSocial.youtube = item.url;
          if (item.platform === 'instagram') updatedSocial.instagram = item.url;
        }
      });
      contact.socialLinks = updatedSocial;
      this.setStorageItem(STORAGE_KEYS.CONTACT_CONFIG, contact);
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cms-social-update', { detail: links }));
    }
  }

  // --- 15. Header and Footer Configuration ---
  getHeaderFooterConfig(): HeaderFooterConfig {
    return this.getStorageItem<HeaderFooterConfig>(STORAGE_KEYS.HEADER_FOOTER_CONFIG, INITIAL_HEADER_FOOTER_CONFIG);
  }

  saveHeaderFooterConfig(config: HeaderFooterConfig): void {
    this.setStorageItem(STORAGE_KEYS.HEADER_FOOTER_CONFIG, config);
  }

  // --- 16. SEO Configuration ---
  getSEOConfig(): SEOConfig {
    return this.getStorageItem<SEOConfig>(STORAGE_KEYS.SEO_CONFIG, INITIAL_SEO_CONFIG);
  }

  saveSEOConfig(config: SEOConfig): void {
    this.setStorageItem(STORAGE_KEYS.SEO_CONFIG, config);
  }

  getPageSEO(path: string): PageSEO | null {
    const seo = this.getSEOConfig();
    return seo.pages[path] || null;
  }

  // --- 17. Media Library ---
  getMediaAssets(): MediaAsset[] {
    return this.getStorageItem<MediaAsset[]>(STORAGE_KEYS.MEDIA_LIBRARY, INITIAL_MEDIA_LIBRARY);
  }

  saveMediaAsset(asset: MediaAsset): void {
    const assets = this.getMediaAssets();
    const idx = assets.findIndex((a) => a.id === asset.id);
    if (idx >= 0) {
      assets[idx] = asset;
    } else {
      assets.unshift(asset);
    }
    this.setStorageItem(STORAGE_KEYS.MEDIA_LIBRARY, assets);
  }

  deleteMediaAsset(id: string): void {
    const assets = this.getMediaAssets().filter((a) => a.id !== id);
    this.setStorageItem(STORAGE_KEYS.MEDIA_LIBRARY, assets);
  }

  // --- Reset Methods for CMS Defaults ---
  resetHomePageConfig(): HomePageConfig {
    this.saveHomePageConfig(INITIAL_HOMEPAGE_CONFIG);
    return INITIAL_HOMEPAGE_CONFIG;
  }

  resetAboutUsConfig(): AboutUsConfig {
    this.saveAboutUsConfig(INITIAL_ABOUT_CONFIG);
    return INITIAL_ABOUT_CONFIG;
  }

  resetHiringPartners(): HiringPartnerCompany[] {
    this.setStorageItem(STORAGE_KEYS.HIRING_PARTNERS, INITIAL_HIRING_PARTNERS);
    return INITIAL_HIRING_PARTNERS;
  }

  resetMarqueeConfig(): MarqueeAnimationConfig {
    this.saveMarqueeConfig(INITIAL_MARQUEE_CONFIG);
    return INITIAL_MARQUEE_CONFIG;
  }

  resetCollegePartnerships(): CollegePartnershipConfig {
    this.saveCollegePartnerships(INITIAL_COLLEGE_PARTNERSHIPS);
    return INITIAL_COLLEGE_PARTNERSHIPS;
  }

  resetCorporateTraining(): CorporateTrainingConfig {
    this.saveCorporateTraining(INITIAL_CORPORATE_TRAINING);
    return INITIAL_CORPORATE_TRAINING;
  }

  resetSocialMediaLinks(): SocialMediaLink[] {
    this.saveSocialMediaLinks(INITIAL_SOCIAL_LINKS);
    return INITIAL_SOCIAL_LINKS;
  }

  resetContactInfo(): ContactInfoConfig {
    this.saveContactInfo(INITIAL_CONTACT_CONFIG);
    this.saveSocialMediaLinks(INITIAL_SOCIAL_LINKS);
    return INITIAL_CONTACT_CONFIG;
  }

  resetHeaderFooterConfig(): HeaderFooterConfig {
    this.saveHeaderFooterConfig(INITIAL_HEADER_FOOTER_CONFIG);
    return INITIAL_HEADER_FOOTER_CONFIG;
  }

  resetSEOConfig(): SEOConfig {
    this.saveSEOConfig(INITIAL_SEO_CONFIG);
    return INITIAL_SEO_CONFIG;
  }
}

export const cmsService = new CMSService();

