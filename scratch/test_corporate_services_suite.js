/**
 * Automated Verification Suite for Corporate Training Services Management
 * Covers: Initial Content, Add, Edit, Delete, Toggle Status, Reorder,
 * Cross-Panel Synchronization (Admin <-> Super Admin <-> Public),
 * Form Validation, Quota Handling, and Event Isolation.
 */

// Setup Mock Browser Environment
const storageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get _store() {
      return store;
    },
  };
})();

const eventListeners = {};
const mockWindow = {
  localStorage: storageMock,
  addEventListener: (event, cb) => {
    if (!eventListeners[event]) eventListeners[event] = [];
    eventListeners[event].push(cb);
  },
  removeEventListener: (event, cb) => {
    if (eventListeners[event]) {
      eventListeners[event] = eventListeners[event].filter((fn) => fn !== cb);
    }
  },
  dispatchEvent: (event) => {
    const list = eventListeners[event.type] || [];
    for (const cb of list) {
      cb(event);
    }
    return true;
  },
};

globalThis.window = mockWindow;
globalThis.localStorage = storageMock;
globalThis.CustomEvent = class CustomEvent {
  constructor(type, eventInitDict) {
    this.type = type;
    this.detail = eventInitDict ? eventInitDict.detail : null;
  }
};
globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    failCount++;
  }
}

async function runTests() {
  console.log('=== STARTING CORPORATE TRAINING SERVICES VERIFICATION SUITE ===\n');

  // Import cmsService and STORAGE_KEYS
  const { cmsService, INITIAL_CORPORATE_SERVICES } = await import(
    '../src/services/cmsService.ts'
  );
  const { STORAGE_KEYS } = await import(
    '../src/constants/appConfig.ts'
  );

  assert(Boolean(STORAGE_KEYS.CORPORATE_TRAINING), 'STORAGE_KEYS.CORPORATE_TRAINING is defined');
  assert(
    STORAGE_KEYS.CORPORATE_TRAINING === 'nexelvoria_cms_corporate_training',
    'STORAGE_KEYS.CORPORATE_TRAINING has correct key'
  );

  // --- TEST 1: Initial Content & Schema Seeding ---
  console.log('\n--- TEST 1: Initial Content & Schema Seeding ---');
  const initialConfig = cmsService.getCorporateTraining();
  assert(Array.isArray(initialConfig.services), 'config.services is an array');
  assert(initialConfig.services.length === 6, `Expected 6 initial corporate services, found ${initialConfig.services.length}`);

  const titles = initialConfig.services.map((s) => s.title);
  assert(titles.includes('Technical Training'), 'Has Technical Training service');
  assert(titles.includes('Soft Skills Training'), 'Has Soft Skills Training service');
  assert(titles.includes('Employee Skill Development'), 'Has Employee Skill Development service');
  assert(titles.includes('Corporate Workshops'), 'Has Corporate Workshops service');
  assert(titles.includes('Customized Training Programs'), 'Has Customized Training Programs service');
  assert(titles.includes('Placement & Internship Training'), 'Has Placement & Internship Training service');

  // Check Technical Training details
  const techTraining = initialConfig.services.find((s) => s.title === 'Technical Training');
  assert(techTraining.status === 'active', 'Technical Training status is active');
  assert(techTraining.displayOrder === 1, 'Technical Training displayOrder is 1');
  assert(
    techTraining.topics.includes('Java') && techTraining.topics.includes('Python') && techTraining.topics.includes('React.js'),
    'Technical Training topics include Java, Python, React.js'
  );

  // Check Soft Skills details
  const softSkills = initialConfig.services.find((s) => s.title === 'Soft Skills Training');
  assert(
    softSkills.topics.includes('Communication skills') && softSkills.topics.includes('Leadership'),
    'Soft Skills topics include Communication skills and Leadership'
  );

  // Idempotency: re-reading does not duplicate records
  const reReadConfig = cmsService.getCorporateTraining();
  assert(reReadConfig.services.length === 6, 'Re-read retains exactly 6 services (no duplicate seeding)');

  // --- TEST 2: Admin Adds New Service ---
  console.log('\n--- TEST 2: Admin Adds New Service ---');
  let cmsEventFired = false;
  let appStorageEventFired = false;
  const cmsHandler = () => {
    cmsEventFired = true;
  };
  const appStorageHandler = () => {
    appStorageEventFired = true;
  };
  window.addEventListener('cms-update', cmsHandler);
  window.addEventListener('app-storage-update', appStorageHandler);

  const newServicePayload = {
    id: 'corp-service-test-devops',
    title: 'Cloud DevOps & Site Reliability',
    shortDescription: 'Production-readiness engineering in AWS, Terraform, Docker and Kubernetes.',
    fullDescription: 'Comprehensive containerization, automated CI/CD pipelines, and multi-region infrastructure management.',
    topics: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD Pipelines'],
    icon: 'Terminal',
    displayOrder: 7,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const addResult = cmsService.saveCorporateTrainingService(newServicePayload);
  assert(addResult.success === true, 'Admin saveCorporateTrainingService returns success === true');
  assert(addResult.data.title === newServicePayload.title, 'Returned data has new service title');
  assert(cmsEventFired === true, 'cms-update event was triggered on save');
  assert(appStorageEventFired === true, 'app-storage-update event was triggered on save');

  // Verify in storage
  const rawStorage = JSON.parse(storageMock.getItem(STORAGE_KEYS.CORPORATE_TRAINING));
  assert(
    rawStorage.services.some((s) => s.id === 'corp-service-test-devops'),
    'New service is physically persisted in storage'
  );

  // --- TEST 3: Super Admin Reads & Edits Service (Shared Truth) ---
  console.log('\n--- TEST 3: Super Admin Reads & Edits Service ---');
  const superAdminServices = cmsService.getCorporateTrainingServices();
  const targetService = superAdminServices.find((s) => s.id === 'corp-service-test-devops');
  assert(Boolean(targetService), 'Super Admin can read the service added by Admin');

  // Super Admin edits title and adds a topic
  const editedPayload = {
    ...targetService,
    title: 'Cloud DevOps, SRE & Observability',
    shortDescription: 'Enhanced enterprise SRE curriculum with Datadog & Prometheus.',
    topics: [...targetService.topics, 'Prometheus', 'Datadog'],
    displayOrder: 7,
  };

  const editResult = cmsService.saveCorporateTrainingService(editedPayload);
  assert(editResult.success === true, 'Super Admin edit returns success === true');

  // Admin re-reads and sees the update
  const adminReRead = cmsService.getCorporateTrainingServiceById('corp-service-test-devops');
  assert(adminReRead.title === 'Cloud DevOps, SRE & Observability', 'Admin sees Super Admin updated title');
  assert(adminReRead.topics.includes('Datadog'), 'Admin sees Super Admin newly added topic');

  // --- TEST 4: Disable Service (Status Toggle) & Public Filter ---
  console.log('\n--- TEST 4: Disable Service & Public Filter ---');
  const toggleResult = cmsService.toggleCorporateTrainingServiceStatus('corp-service-test-devops');
  assert(toggleResult.success === true, 'toggleCorporateTrainingServiceStatus returns success === true');
  assert(toggleResult.data.status === 'inactive', 'Service status is now inactive');

  // Simulate Public Page filter: only active services are rendered
  const publicActiveServices = cmsService
    .getCorporateTrainingServices()
    .filter((s) => s.status === 'active');
  assert(
    !publicActiveServices.some((s) => s.id === 'corp-service-test-devops'),
    'Disabled service is STRICTLY HIDDEN from public website'
  );

  // Toggle back to active
  const toggleBackResult = cmsService.toggleCorporateTrainingServiceStatus('corp-service-test-devops');
  assert(toggleBackResult.success === true, 'Toggling back returns success === true');
  assert(toggleBackResult.data.status === 'active', 'Service status restored to active');

  const publicActiveServicesAfter = cmsService
    .getCorporateTrainingServices()
    .filter((s) => s.status === 'active');
  assert(
    publicActiveServicesAfter.some((s) => s.id === 'corp-service-test-devops'),
    'Re-enabled service is IMMEDIATELY VISIBLE on public website'
  );

  // --- TEST 5: Reordering Services Display Sequence ---
  console.log('\n--- TEST 5: Reordering Services Display Sequence ---');
  const currentList = cmsService.getCorporateTrainingServices();
  // Move test service to top (#1)
  const reorderedIds = [
    'corp-service-test-devops',
    ...currentList.filter((s) => s.id !== 'corp-service-test-devops').map((s) => s.id),
  ];

  const reorderResult = cmsService.reorderCorporateTrainingServices(reorderedIds);
  assert(reorderResult.success === true, 'reorderCorporateTrainingServices returns success === true');

  const reorderedList = cmsService.getCorporateTrainingServices();
  assert(reorderedList[0].id === 'corp-service-test-devops', 'Test service is now at position #1');
  assert(reorderedList[0].displayOrder === 1, 'Test service displayOrder is 1');
  assert(reorderedList[1].displayOrder === 2, 'Second service displayOrder is 2');

  // --- TEST 6: Delete Service ---
  console.log('\n--- TEST 6: Delete Service ---');
  const deleteResult = cmsService.deleteCorporateTrainingService('corp-service-test-devops');
  assert(deleteResult.success === true, 'deleteCorporateTrainingService returns success === true');

  const listAfterDelete = cmsService.getCorporateTrainingServices();
  assert(
    !listAfterDelete.some((s) => s.id === 'corp-service-test-devops'),
    'Deleted service is removed from internal array'
  );

  const rawStorageAfterDelete = JSON.parse(storageMock.getItem(STORAGE_KEYS.CORPORATE_TRAINING));
  assert(
    !rawStorageAfterDelete.services.some((s) => s.id === 'corp-service-test-devops'),
    'Deleted service is removed from physical storage'
  );

  // --- TEST 7: Validation Guards ---
  console.log('\n--- TEST 7: Validation Guards ---');
  const emptyTitle = cmsService.saveCorporateTrainingService({
    id: 'invalid-1',
    title: '   ',
    shortDescription: 'Valid desc',
    fullDescription: '',
    topics: ['Topic 1'],
    icon: 'Laptop',
    displayOrder: 1,
    status: 'active',
    createdAt: '',
    updatedAt: '',
  });
  assert(emptyTitle.success === false, 'Empty title fails validation');
  assert(Boolean(emptyTitle.error), 'Empty title returns clear error');

  const emptyDesc = cmsService.saveCorporateTrainingService({
    id: 'invalid-2',
    title: 'Valid Title',
    shortDescription: '   ',
    fullDescription: '',
    topics: ['Topic 1'],
    icon: 'Laptop',
    displayOrder: 1,
    status: 'active',
    createdAt: '',
    updatedAt: '',
  });
  assert(emptyDesc.success === false, 'Empty shortDescription fails validation');

  const emptyTopics = cmsService.saveCorporateTrainingService({
    id: 'invalid-3',
    title: 'Valid Title',
    shortDescription: 'Valid desc',
    fullDescription: '',
    topics: [],
    icon: 'Laptop',
    displayOrder: 1,
    status: 'active',
    createdAt: '',
    updatedAt: '',
  });
  assert(emptyTopics.success === false, 'Empty topics fails validation');

  const nonExistentToggle = cmsService.toggleCorporateTrainingServiceStatus('non-existent-id');
  assert(nonExistentToggle.success === false, 'Toggling non-existent ID fails safely');

  const nonExistentDelete = cmsService.deleteCorporateTrainingService('non-existent-id');
  assert(nonExistentDelete.success === false, 'Deleting non-existent ID fails safely');

  // --- TEST 8: Async Service Methods for Backend Readiness ---
  console.log('\n--- TEST 8: Async Service Methods for Backend Readiness ---');
  const asyncList = await cmsService.getCorporateTrainingServicesAsync();
  assert(asyncList.success === true, 'getCorporateTrainingServicesAsync returns success === true');
  assert(Array.isArray(asyncList.data), 'getCorporateTrainingServicesAsync data is array');

  const asyncSingle = await cmsService.getCorporateTrainingServiceByIdAsync('corp-service-1');
  assert(asyncSingle.success === true, 'getCorporateTrainingServiceByIdAsync returns success === true');
  assert(asyncSingle.data.title === 'Technical Training', 'getCorporateTrainingServiceByIdAsync returns correct service');

  const asyncToggle = await cmsService.toggleCorporateTrainingServiceStatusAsync('corp-service-1');
  assert(asyncToggle.success === true, 'toggleCorporateTrainingServiceStatusAsync returns success === true');
  // Toggle back
  await cmsService.toggleCorporateTrainingServiceStatusAsync('corp-service-1');

  // --- TEST 9: Event Listener Exception Isolation ---
  console.log('\n--- TEST 9: Event Listener Exception Isolation ---');
  let faultyListenerCalled = false;
  const faultyListener = () => {
    faultyListenerCalled = true;
    throw new Error('Buggy component listener error!');
  };
  window.addEventListener('cms-update', faultyListener);

  const testIsoService = {
    id: 'corp-iso-test',
    title: 'Isolation Test Service',
    shortDescription: 'Testing listener error isolation',
    fullDescription: '',
    topics: ['Isolation'],
    icon: 'ShieldCheck',
    displayOrder: 10,
    status: 'active',
    createdAt: '',
    updatedAt: '',
  };

  const isoSave = cmsService.saveCorporateTrainingService(testIsoService);
  assert(faultyListenerCalled === true, 'Faulty listener was called');
  assert(isoSave.success === true, 'Save succeeds despite faulty event listener throwing');
  assert(
    cmsService.getCorporateTrainingServices().some((s) => s.id === 'corp-iso-test'),
    'Service was persisted despite listener exception'
  );

  // Cleanup
  cmsService.deleteCorporateTrainingService('corp-iso-test');
  window.removeEventListener('cms-update', faultyListener);
  window.removeEventListener('cms-update', cmsHandler);
  window.removeEventListener('app-storage-update', appStorageHandler);

  // --- TEST 10: LocalStorage QuotaExceededError Simulation ---
  console.log('\n--- TEST 10: LocalStorage QuotaExceededError Simulation ---');
  const originalSetItem = storageMock.setItem;
  storageMock.setItem = () => {
    const quotaErr = new Error("Failed to execute 'setItem' on 'Storage': Setting the value exceeded the quota.");
    quotaErr.name = 'QuotaExceededError';
    quotaErr.code = 22;
    throw quotaErr;
  };

  const quotaTestService = {
    id: 'corp-quota-test',
    title: 'Quota Test Service',
    shortDescription: 'Testing quota error',
    fullDescription: '',
    topics: ['Quota'],
    icon: 'Laptop',
    displayOrder: 12,
    status: 'active',
    createdAt: '',
    updatedAt: '',
  };

  const quotaResult = cmsService.saveCorporateTrainingService(quotaTestService);
  assert(quotaResult.success === false, 'QuotaExceededError is caught and returns success === false');
  assert(
    quotaResult.error && quotaResult.error.toLowerCase().includes('quota exceeded'),
    'Clear actionable error message mentioning quota exceeded is returned'
  );

  // Restore original setItem
  storageMock.setItem = originalSetItem;

  // --- TEST 11: Enterprise Clients Roster ---
  console.log('\n--- TEST 11: Enterprise Clients Roster ---');
  const currentClients = initialConfig.clients || [];
  assert(currentClients.length >= 3, 'Initial enterprise clients roster has at least 3 companies');
  assert(currentClients.some((c) => (c.name || c.companyName) === 'Wipro Technologies'), 'Has Wipro Technologies');

  console.log('\n=======================================================');
  console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('=======================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test suite uncaught error:', e);
  process.exit(1);
});
