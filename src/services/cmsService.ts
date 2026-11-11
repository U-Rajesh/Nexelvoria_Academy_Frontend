
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
}

export interface FAQItem {
  id: string;
  category: 'Admissions' | 'Fees & Payments' | 'LMS & Attendance' | 'Certificates' | 'Placements' | 'General';
  question: string;
  answer: string;
  order: number;
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
  message?: string;
  submittedAt: string;
  status: 'new' | 'contacted' | 'enrolled' | 'closed';
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
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
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
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
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
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
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
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
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
}

export const cmsService = new CMSService();

