import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('VERIFYING FAVICON & BROWSER TAB TITLE CONFIGURATION');
console.log('====================================================\n');

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

// 1. Verify index.html in source
const srcIndexPath = path.join(rootDir, 'index.html');
assert(fs.existsSync(srcIndexPath), 'Source index.html exists');
const srcIndexContent = fs.readFileSync(srcIndexPath, 'utf-8');

assert(srcIndexContent.includes('<title>Nexelvoria Academy</title>'), 'Source index.html title is exactly "Nexelvoria Academy"');
assert(srcIndexContent.includes('<link rel="icon" type="image/x-icon" href="/favicon.ico" />'), 'Source index.html has favicon.ico link');
assert(srcIndexContent.includes('<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />'), 'Source index.html has favicon-32x32.png link');
assert(srcIndexContent.includes('<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />'), 'Source index.html has favicon-16x16.png link');
assert(srcIndexContent.includes('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />'), 'Source index.html has apple-touch-icon.png link');
assert(!srcIndexContent.includes('/favicon.svg'), 'Source index.html does NOT reference old /favicon.svg');

// 2. Verify dist/index.html in production build
const distIndexPath = path.join(rootDir, 'dist', 'index.html');
assert(fs.existsSync(distIndexPath), 'Production dist/index.html exists');
const distIndexContent = fs.readFileSync(distIndexPath, 'utf-8');

assert(distIndexContent.includes('<title>Nexelvoria Academy</title>'), 'Production dist/index.html title is exactly "Nexelvoria Academy"');
assert(distIndexContent.includes('href="/favicon.ico"'), 'Production dist/index.html references /favicon.ico');
assert(distIndexContent.includes('href="/favicon-32x32.png"'), 'Production dist/index.html references /favicon-32x32.png');
assert(distIndexContent.includes('href="/favicon-16x16.png"'), 'Production dist/index.html references /favicon-16x16.png');
assert(distIndexContent.includes('href="/apple-touch-icon.png"'), 'Production dist/index.html references /apple-touch-icon.png');
assert(!distIndexContent.includes('/favicon.svg'), 'Production dist/index.html does NOT reference old /favicon.svg');

// 3. Verify physical files in public/
const publicDir = path.join(rootDir, 'public');
const expectedPublicFiles = [
  'favicon.ico',
  'favicon.png',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'logo.png',
  'site.webmanifest'
];

for (const file of expectedPublicFiles) {
  const filePath = path.join(publicDir, file);
  assert(fs.existsSync(filePath), `public/${file} exists`);
  if (fs.existsSync(filePath)) {
    const size = fs.statSync(filePath).size;
    assert(size > 0, `public/${file} has valid non-zero size (${size} bytes)`);
  }
}

// 4. Verify physical files in dist/
const distDir = path.join(rootDir, 'dist');
for (const file of expectedPublicFiles) {
  const filePath = path.join(distDir, file);
  assert(fs.existsSync(filePath), `dist/${file} exists`);
  if (fs.existsSync(filePath)) {
    const size = fs.statSync(filePath).size;
    assert(size > 0, `dist/${file} has valid non-zero size (${size} bytes)`);
  }
}

// 5. Verify SEO component ensures document.title is APP_CONFIG.name
const seoPath = path.join(rootDir, 'src', 'components', 'common', 'SEO.tsx');
assert(fs.existsSync(seoPath), 'SEO.tsx exists');
const seoContent = fs.readFileSync(seoPath, 'utf-8');
assert(seoContent.includes('document.title = APP_CONFIG.name;'), 'SEO.tsx explicitly sets document.title to APP_CONFIG.name ("Nexelvoria Academy")');

// 6. Verify APP_CONFIG.name
const appConfigPath = path.join(rootDir, 'src', 'constants', 'appConfig.ts');
const appConfigContent = fs.readFileSync(appConfigPath, 'utf-8');
assert(appConfigContent.includes("name: 'Nexelvoria Academy'"), "appConfig.ts defines name as 'Nexelvoria Academy'");

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${passCount + failCount}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
}

