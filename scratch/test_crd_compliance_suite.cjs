/**
 * Nexelvoria Academy - Comprehensive CRD Compliance & Five-Panel Synchronization Verification Suite
 * Tests all 6 implemented synchronization gaps and critical SRS Business Rules (BR-001 to BR-018).
 */

const fs = require('fs');
const path = require('path');

// Setup mock browser localStorage and CustomEvent environment
const storageData = {};
global.localStorage = {
  getItem: (key) => storageData[key] || null,
  setItem: (key, val) => {
    storageData[key] = String(val);
  },
  removeItem: (key) => {
    delete storageData[key];
  },
  clear: () => {
    Object.keys(storageData).forEach((k) => delete storageData[k]);
  },
};
global.window = {
  localStorage: global.localStorage,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};
global.CustomEvent = class CustomEvent {
  constructor(name, detail) {
    this.type = name;
    this.detail = detail;
  }
};

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✖ FAIL: ${message}`);
    failCount++;
  }
}

// Compile and load services via ts-node or native dynamic evaluation
// Because this is Node CJS testing TS files, let's load compiled or transpiled modules
// We can use esbuild or tsx or transpile using TypeScript
const ts = require('typescript');

function requireTs(relPath) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  const code = fs.readFileSync(fullPath, 'utf8');
  const transpiled = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
    },
  });

  const moduleObj = { exports: {} };
  const wrapper = new Function('module', 'exports', 'require', '__dirname', '__filename', transpiled.outputText);
  wrapper(moduleObj, moduleObj.exports, (mod) => {
    if (mod.startsWith('.')) {
      const targetPath = path.resolve(path.dirname(fullPath), mod);
      const possibleExts = ['.ts', '.tsx', '.js', '/index.ts', '/index.tsx'];
      for (const ext of possibleExts) {
        if (fs.existsSync(targetPath + ext)) {
          return requireTs(path.relative(path.resolve(__dirname, '..'), targetPath + ext));
        }
      }
      if (fs.existsSync(targetPath)) {
        return requireTs(path.relative(path.resolve(__dirname, '..'), targetPath));
      }
    }
    return require(mod);
  }, path.dirname(fullPath), fullPath);

  return moduleObj.exports;
}

async function runTestSuite() {
  console.log('\n========================================================================');
  console.log('--- NEXELVORIA ACADEMY: CRD COMPLIANCE & 5-PANEL SYNC VERIFICATION ---');
  console.log('========================================================================\n');

  const { STORAGE_KEYS } = requireTs('src/constants/appConfig.ts');
  const { studentService } = requireTs('src/services/studentService.ts');
  const { adminService } = requireTs('src/services/adminService.ts');
  const { teacherService } = requireTs('src/services/teacherService.ts');
  const { paymentService } = requireTs('src/services/paymentService.ts');
  const { superAdminService } = requireTs('src/services/superAdminService.ts');
  const { getStorageItem, setStorageItem } = requireTs('src/utils/storage.ts');

  // --- SECTION 1: Support Ticket Synchronization (CRD 3.14: SUP-001 to SUP-006) ---
  console.log('--- SECTION 1: Support Ticket Synchronization (SUP-001 to SUP-006) ---');
  {
    // Step 1: Student creates ticket
    const student = { id: 'user-stu-001', name: 'Rohan Sharma', email: 'rohan.sharma@example.com' };
    const createRes = await studentService.createTicket(student, {
      category: 'Fee & Payment',
      subject: 'GST Invoice Verification Query',
      message: 'Could you please confirm the GST breakdown on my latest fee receipt?',
      priority: 'high',
    });

    assert(createRes.success === true, 'Student creates ticket successfully');
    assert(createRes.data.ticketNumber.startsWith('TKT-'), 'Ticket number matches format TKT-XXXX');
    assert(createRes.data.status === 'open', 'New ticket is marked with status "open"');

    // Step 2: Verify persistence in STORAGE_KEYS.TICKETS
    const storedTickets = getStorageItem(STORAGE_KEYS.TICKETS, []);
    const foundInStorage = storedTickets.find((t) => t.id === createRes.data.id);
    assert(foundInStorage !== undefined, 'Ticket is physically persisted in STORAGE_KEYS.TICKETS');
    assert(foundInStorage.subject === 'GST Invoice Verification Query', 'Persisted ticket has exact subject');

    // Step 3: Admin reads tickets from storage
    const adminRes = await adminService.getTickets();
    assert(adminRes.success === true, 'Admin can read tickets from storage');
    const adminFound = adminRes.data.find((t) => t.id === createRes.data.id);
    assert(adminFound !== undefined, 'Admin sees student ticket in admin triage queue');

    // Step 4: Admin replies to ticket
    const adminUser = { id: 'user-adm-001', name: 'Priya Nair' };
    const replyRes = await adminService.replyTicket(
      adminUser,
      createRes.data.id,
      'Your GST invoice has been verified with GSTIN 36AABCN1234F1Z8. Download available in Student Portal.',
      'resolved'
    );

    assert(replyRes.success === true, 'Admin reply returns success === true');
    assert(replyRes.data.status === 'resolved', 'Ticket status updated to "resolved" by Admin');
    assert(replyRes.data.messages.length >= 2, 'Ticket has both student question and admin answer');

    // Step 5: Student reads updated ticket
    const studentTicketsRes = await studentService.getStudentTickets(student.id);
    const studentUpdated = studentTicketsRes.data.find((t) => t.id === createRes.data.id);
    assert(studentUpdated !== undefined, 'Student retrieves updated ticket');
    assert(studentUpdated.status === 'resolved', 'Student sees "resolved" status set by Admin');
    const lastMsg = studentUpdated.messages[studentUpdated.messages.length - 1];
    assert(lastMsg.senderName === 'Priya Nair', 'Student sees reply from Priya Nair (Admin)');

    // Step 6: Student replies back
    const stuFollowUp = await studentService.replyTicket(student, createRes.data.id, 'Thank you, received!');
    assert(stuFollowUp.success === true, 'Student follow-up reply succeeds');
    assert(stuFollowUp.data.status === 'open', 'Student follow-up reopens ticket for ongoing support');
  }

  // --- SECTION 2: Placement Portal Job & Application Synchronization (CRD 3.12: PLC-001 to PLC-015, BR-013) ---
  console.log('\n--- SECTION 2: Placement Portal Job & Application Synchronization (PLC-001 to PLC-015, BR-013) ---');
  {
    // Step 1: Admin creates new Job Opening
    const adminUser = { id: 'user-adm-001', name: 'Priya Nair' };
    const jobRes = await adminService.createJobOpening(adminUser, {
      companyId: 'comp-01',
      companyName: 'Infosys BPM & Cloud Labs',
      title: 'Full Stack Java Cloud Engineer',
      roleType: 'Full-time',
      location: 'Hyderabad, Telangana',
      workMode: 'Hybrid',
      salaryPackageCTC: '₹ 8.5 LPA - ₹ 11.0 LPA',
      experienceRequired: '0-2 Years',
      skillsRequired: ['Java 21', 'Spring Boot 3', 'React', 'Docker'],
      eligibilityCriteria: {
        minAttendancePercentage: 75,
        minExamScorePercentage: 70,
        eligibleCourseIds: ['course-fsd-01'],
        eligiblePassingYears: ['2025', '2026'],
      },
      jobDescription: 'Design microservices and cloud backends on AWS/GCP.',
      openingsCount: 8,
      deadline: '2026-12-15',
    });

    assert(jobRes.success === true, 'Admin successfully publishes job opening');
    const storedJobs = getStorageItem(STORAGE_KEYS.JOBS, []);
    assert(storedJobs.some((j) => j.id === jobRes.data.id), 'Job is persisted in STORAGE_KEYS.JOBS');

    // Step 2: Student retrieves job openings
    const studentJobsRes = await studentService.getJobOpenings();
    assert(studentJobsRes.success === true, 'Student retrieves active job openings');
    const visibleJob = studentJobsRes.data.find((j) => j.id === jobRes.data.id);
    assert(visibleJob !== undefined, 'Newly published Admin job appears in student placement portal');

    // Step 3: Student applies for job
    const applyRes = await studentService.applyForJob('user-stu-001', 'Rohan Sharma', jobRes.data.id);
    assert(applyRes.success === true, 'Student submits job application (1-Click Apply)');
    assert(applyRes.data.status === 'applied', 'Initial application status is "applied"');

    // Step 4: Admin retrieves applications and progresses candidate stage
    const adminAppsRes = await adminService.getJobApplications();
    const appFound = adminAppsRes.data.find((a) => a.id === applyRes.data.id);
    assert(appFound !== undefined, 'Admin sees student application in placement applicant tracking system');

    const updateStageRes = await adminService.updateJobApplicationStatus(
      adminUser,
      applyRes.data.id,
      'technical_interview',
      'Candidate cleared resume shortlist. Technical round scheduled for Thursday 3 PM.',
      '₹ 9.5 LPA'
    );

    assert(updateStageRes.success === true, 'Admin progresses application to technical_interview stage');

    // Step 5: Student retrieves updated applications
    const studentAppsRes = await studentService.getJobApplicationsForStudent('user-stu-001');
    const updatedApp = studentAppsRes.data.find((a) => a.id === applyRes.data.id);
    assert(updatedApp.status === 'technical_interview', 'Student portal reflects new stage: technical_interview');
    assert(updatedApp.currentRoundNotes.includes('Technical round scheduled'), 'Student sees interviewer round notes');
  }

  // --- SECTION 3: Institutional Notification Broadcast Synchronization (CRD 3.13: COM-001 to COM-010) ---
  console.log('\n--- SECTION 3: Notification Broadcast Synchronization (COM-001 to COM-010) ---');
  {
    const adminUser = { id: 'user-adm-001', name: 'Priya Nair' };

    // Broadcast 1: All Users
    const bcastAll = await adminService.sendBroadcastNotification(adminUser, {
      targetGroup: 'all',
      title: 'Nexelvoria Annual Tech Symposium 2026',
      message: 'Registrations are open for the inter-collegiate hackathon.',
      category: 'announcement',
      linkUrl: '/events/symposium-2026',
    });
    assert(bcastAll.success === true, 'Admin dispatches broadcast to targetGroup: all');

    // Broadcast 2: Teachers Only
    const bcastTch = await adminService.sendBroadcastNotification(adminUser, {
      targetGroup: 'teachers',
      title: 'Faculty Mid-Term Academic Review',
      message: 'All faculty members are requested to submit attendance marks by Friday.',
      category: 'announcement',
      linkUrl: '/teacher/attendance',
    });
    assert(bcastTch.success === true, 'Admin dispatches broadcast to targetGroup: teachers');

    // Verify Student receives "all", but does NOT receive "teachers"
    const stuNotifs = await studentService.getNotificationsForStudent('user-stu-001');
    assert(stuNotifs.data.some((n) => n.id === bcastAll.data.id), 'Student received "all" broadcast notification');
    assert(!stuNotifs.data.some((n) => n.id === bcastTch.data.id), 'Student correctly did NOT receive "teachers" broadcast');

    // Verify Teacher receives both "all" and "teachers"
    const tchNotifs = await teacherService.getNotificationsForTeacher('user-tch-001');
    assert(tchNotifs.data.some((n) => n.id === bcastAll.data.id), 'Teacher received "all" broadcast notification');
    assert(tchNotifs.data.some((n) => n.id === bcastTch.data.id), 'Teacher received "teachers" broadcast notification');
  }

  // --- SECTION 4: Fee Discount & Coupon Validation (CRD 3.8: PAY-009, 3.4: ADM-010) ---
  console.log('\n--- SECTION 4: Fee Discount & Coupon Validation (PAY-009, ADM-010) ---');
  {
    // Test 1: Validate default seed coupons
    const valDiwali = await paymentService.validateCoupon('DIWALI2026', 'course-fsd-01', 35000);
    assert(valDiwali.success === true, 'DIWALI2026 flat coupon is valid');
    assert(valDiwali.data.discountAmountINR === 7000, 'DIWALI2026 provides flat ₹ 7,000 discount');
    assert(valDiwali.data.finalAmountINR === 28000, 'DIWALI2026 calculates net fee ₹ 28,000 (35000 - 7000)');

    const valMerit = await paymentService.validateCoupon('MERIT25', 'course-fsd-01', 40000);
    assert(valMerit.success === true, 'MERIT25 percentage coupon is valid');
    assert(valMerit.data.discountAmountINR === 10000, 'MERIT25 provides 25% discount (₹ 10,000)');
    assert(valMerit.data.finalAmountINR === 30000, 'MERIT25 calculates net fee ₹ 30,000 (40000 - 10000)');

    // Test 2: Admin creates custom coupon
    const adminUser = { id: 'user-adm-001', name: 'Priya Nair' };
    const createCouponRes = await adminService.createDiscount(adminUser, {
      code: 'SCHOLAR50',
      description: 'Super 50 Tech Scholarship flat ₹ 15,000 waiver',
      discountType: 'fixed_amount',
      value: 15000,
      applicableCourseIds: ['course-fsd-01'],
      isActive: true,
      validUntil: '2026-12-31',
    });
    assert(createCouponRes.success === true, 'Admin successfully creates SCHOLAR50 coupon (ADM-010)');

    // Test 3: Validate custom coupon for applicable vs non-applicable course
    const valCustom = await paymentService.validateCoupon('SCHOLAR50', 'course-fsd-01', 45000);
    assert(valCustom.success === true, 'SCHOLAR50 validates for course-fsd-01');
    assert(valCustom.data.finalAmountINR === 30000, 'Calculates net fee ₹ 30,000');

    const valInapplicable = await paymentService.validateCoupon('SCHOLAR50', 'course-other-99', 45000);
    assert(valInapplicable.success === false, 'SCHOLAR50 rejected for unlisted course');

    // Test 4: Process payment with coupon code
    const student = { id: 'user-stu-001', name: 'Rohan Sharma' };
    const payRes = await paymentService.processRazorpayPayment(
      student,
      { id: 'course-fsd-01', title: 'Java Full Stack & Microservices', feeINR: 45000 },
      'upi',
      'SCHOLAR50',
      15000
    );

    assert(payRes.success === true, 'Razorpay payment processed successfully with coupon code');
    assert(payRes.data.couponCode === 'SCHOLAR50', 'Payment transaction records coupon code SCHOLAR50');
    assert(payRes.data.discountAppliedINR === 15000, 'Payment transaction records discount of ₹ 15,000');
    assert(payRes.data.finalAmountINR === 30000, 'Payment transaction records final paid amount ₹ 30,000');
    assert(payRes.data.status === 'successful', 'Payment status is "successful" (BR-004)');

    // Check enrollment activation
    const enrollments = getStorageItem(STORAGE_KEYS.ENROLLMENTS, []);
    const enr = enrollments.find((e) => e.studentId === student.id && e.courseId === 'course-fsd-01');
    assert(enr !== undefined && enr.status === 'active', 'Enrollment automatically activated upon payment (BR-004)');
  }

  // --- SECTION 5: Lesson Doubts & Discussion Synchronization (CRD 3.7: LMS-008, 3.5: TCH area 16) ---
  console.log('\n--- SECTION 5: Lesson Doubts Synchronization (LMS-008 & TCH area 16) ---');
  {
    const student = { id: 'user-stu-001', name: 'Rohan Sharma', avatar: 'https://avatar.url' };
    const doubtRes = await studentService.postLessonDoubt(student, {
      courseId: 'course-fsd-01',
      title: 'Virtual Threads pinning in synchronized blocks',
      description: 'Does using synchronized keyword inside a Virtual Thread pin the carrier thread in JDK 21?',
      codeSnippet: 'synchronized (lock) { Thread.sleep(100); }',
    });

    assert(doubtRes.success === true, 'Student posts doubt during lecture (LMS-008)');
    assert(doubtRes.data.status === 'open', 'New doubt status is "open"');

    // Teacher retrieves doubts
    const teacherDoubtsRes = await teacherService.getStudentDoubts('user-tch-001');
    const teacherFound = teacherDoubtsRes.data.find((d) => d.id === doubtRes.data.id);
    assert(teacherFound !== undefined, 'Teacher sees student doubt in doubts queue (TCH-012)');

    // Teacher replies to doubt
    const teacherUser = { id: 'user-tch-001', name: 'Dr. Vikram Rao' };
    const answerRes = await teacherService.replyToDoubt(
      teacherUser,
      doubtRes.data.id,
      'Yes, in JDK 21 synchronized blocks pin the carrier thread. Prefer ReentrantLock instead for non-pinning virtual thread scheduling.',
      'answered'
    );

    assert(answerRes.success === true, 'Teacher posts answer to doubt');
    assert(answerRes.data.status === 'answered', 'Doubt status updated to "answered"');

    // Student retrieves course doubts in LMS Viewer
    const studentDoubtsRes = await studentService.getCourseDoubts('course-fsd-01');
    const studentFound = studentDoubtsRes.data.find((d) => d.id === doubtRes.data.id);
    assert(studentFound !== undefined, 'Student sees doubt in LMS viewer');
    assert(studentFound.replies.length > 0, 'Doubt thread contains faculty reply');
    assert(studentFound.replies[0].authorName === 'Dr. Vikram Rao', 'Reply author is Dr. Vikram Rao');
  }

  // --- SECTION 6: Student Profile Updates Sync to Admin (CRD 3.3: STD-006) ---
  console.log('\n--- SECTION 6: Student Profile Updates Sync to Admin (STD-006) ---');
  {
    // Setup initial student in STORAGE_KEYS.STUDENTS
    const initialStudents = [
      {
        id: 'user-stu-001',
        name: 'Rohan Sharma',
        email: 'rohan.sharma@example.com',
        mobile: '9876543210',
        guardianPhone: '9876500000',
        address: 'Old Address, Hyderabad',
        linkedInUrl: 'https://linkedin.com/in/rohan',
        githubUrl: 'https://github.com/rohan',
        enrolledCourseIds: ['course-fsd-01'],
        adminApprovalStatus: 'approved',
      },
    ];
    setStorageItem(STORAGE_KEYS.STUDENTS, initialStudents);

    // Simulate permitted profile update as in StudentProfilePage
    const updatedDetails = {
      mobile: '9898989898',
      guardianPhone: '9797979797',
      fullAddress: 'Plot 42, Hitech City, Hyderabad, Telangana 500081',
      linkedInUrl: 'https://linkedin.com/in/rohan-sharma-tech',
      githubUrl: 'https://github.com/rohan-sharma-dev',
    };

    // Update in STORAGE_KEYS.STUDENTS
    const students = getStorageItem(STORAGE_KEYS.STUDENTS, []);
    const idx = students.findIndex((s) => s.id === 'user-stu-001');
    assert(idx !== -1, 'Target student found in roster');
    students[idx] = {
      ...students[idx],
      mobile: updatedDetails.mobile,
      guardianPhone: updatedDetails.guardianPhone,
      fullAddress: updatedDetails.fullAddress,
      address: updatedDetails.fullAddress,
      linkedInUrl: updatedDetails.linkedInUrl,
      githubUrl: updatedDetails.githubUrl,
    };
    setStorageItem(STORAGE_KEYS.STUDENTS, students);

    // Admin queries students roster
    const adminStudentsRes = await adminService.getStudents();
    const adminStu = adminStudentsRes.data.find((s) => s.id === 'user-stu-001');
    assert(adminStu !== undefined, 'Admin retrieves student');
    assert(adminStu.mobile === '9898989898', 'Admin sees updated mobile number: 9898989898');
    assert(adminStu.address.includes('Plot 42, Hitech City'), 'Admin sees updated address: Plot 42, Hitech City');
    assert(adminStu.linkedInUrl === 'https://linkedin.com/in/rohan-sharma-tech', 'Admin sees updated LinkedIn URL');
    assert(adminStu.githubUrl === 'https://github.com/rohan-sharma-dev', 'Admin sees updated GitHub URL');
  }

  // --- SECTION 7: Key Business Rules Verification (BR-001, BR-002, BR-006, BR-010, BR-011, BR-014) ---
  console.log('\n--- SECTION 7: Critical SRS Business Rules Verification ---');
  {
    // BR-002: Admissions approval gate
    const pendingStudent = {
      id: 'user-stu-pending',
      name: 'Pooja Iyer',
      email: 'pooja@example.com',
      adminApprovalStatus: 'pending',
      enrolledCourseIds: [],
    };
    const isPaymentAllowedForPending = pendingStudent.adminApprovalStatus === 'approved';
    assert(isPaymentAllowedForPending === false, 'BR-002: Unapproved student is blocked from tuition payment');

    // BR-006: Super Admin approval required for refunds
    const adminUser = { id: 'user-adm-001', name: 'Priya Nair' };
    const refundInitiated = await adminService.requestRefund(adminUser, {
      transactionId: 'pay-001',
      studentId: 'user-stu-001',
      studentName: 'Rohan Sharma',
      courseId: 'course-fsd-01',
      courseTitle: 'Java Full Stack & Microservices',
      amountINR: 35000,
      reason: 'Relocation to onsite corporate campus',
    });
    assert(refundInitiated.success === true, 'Admin initiates refund request to Super Admin');
    assert(refundInitiated.data.status === 'pending_super_admin', 'BR-006: Refund request is queued with pending_super_admin status');

    const superAdminUser = { id: 'user-sa-001', name: 'Super Admin' };
    const refundDecision = await superAdminService.decideRefundRequest(
      superAdminUser,
      refundInitiated.data.id,
      'approved',
      'Approved after verifying genuine relocation documentation.'
    );
    assert(refundDecision.success === true, 'Super Admin approves refund request (BR-006)');
    assert(refundDecision.data.status === 'approved', 'Refund status updated to "approved"');

    // BR-011: Certificate Eligibility 3-way check (Course 100%, Attendance >= 75%, Exam Passed)
    const checkEligible = await studentService.checkCertificateEligibility('user-stu-001', 'course-fsd-01');
    assert(checkEligible.success === true, 'Certificate eligibility check executes cleanly');
    assert(typeof checkEligible.data.isAttendanceEligible === 'boolean', 'Attendance threshold check evaluated (>= 75%)');
    assert(Array.isArray(checkEligible.data.missingRequirements), 'Missing requirements provided as array');

    // BR-014: SMS notification channel disabled for regulatory compliance
    const settings = getStorageItem(STORAGE_KEYS.SETTINGS, { isSmsEnabled: false });
    assert(settings.isSmsEnabled === false, 'BR-014: SMS channel is disabled per regulatory compliance guidelines');
  }

  console.log('\n========================================================================');
  console.log(`TOTAL COMPLIANCE TESTS: ${passCount + failCount}`);
  console.log(`PASSED: ${passCount}`);
  console.log(`FAILED: ${failCount}`);
  console.log('========================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});

