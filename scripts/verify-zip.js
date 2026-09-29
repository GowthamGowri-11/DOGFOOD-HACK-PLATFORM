const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(rootDir, '..');
const testDir = path.join(parentDir, 'ATLYX-ZIP-VERIFY');
const zipFile = path.join(parentDir, 'ATLYX-DOGFOOD-FINAL.zip');

if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

console.log('Extracting archive for verification...');
execSync(`powershell -Command "Expand-Archive -Path '${zipFile}' -DestinationPath '${testDir}' -Force"`, {
  stdio: 'inherit',
});

const checks = [
  { name: 'README.md', pass: fs.existsSync(path.join(testDir, 'README.md')) },
  { name: 'ARCHITECTURE.md', pass: fs.existsSync(path.join(testDir, 'ARCHITECTURE.md')) },
  { name: 'DATA-MODEL.md', pass: fs.existsSync(path.join(testDir, 'DATA-MODEL.md')) },
  { name: 'JUDGING.md', pass: fs.existsSync(path.join(testDir, 'JUDGING.md')) },
  { name: '.dogfood.toml', pass: fs.existsSync(path.join(testDir, '.dogfood.toml')) },
  { name: 'LICENSE', pass: fs.existsSync(path.join(testDir, 'LICENSE')) },
  { name: 'Dockerfile', pass: fs.existsSync(path.join(testDir, 'Dockerfile')) },
  { name: 'docker-compose.yml', pass: fs.existsSync(path.join(testDir, 'docker-compose.yml')) },
  { name: 'acceptance-report.txt', pass: fs.existsSync(path.join(testDir, 'acceptance-report.txt')) },
  { name: 'ATLYX-COMPLETE-LIVE-HACKATHON-E2E-REPORT.md', pass: fs.existsSync(path.join(testDir, 'ATLYX-COMPLETE-LIVE-HACKATHON-E2E-REPORT.md')) },
  { name: 'ATLYX-DEMO-VIDEO-SCRIPT.md', pass: fs.existsSync(path.join(testDir, 'ATLYX-DEMO-VIDEO-SCRIPT.md')) },
  { name: '.env is EXCLUDED', pass: !fs.existsSync(path.join(testDir, '.env')) },
  { name: '.env.local is EXCLUDED', pass: !fs.existsSync(path.join(testDir, '.env.local')) },
  { name: 'node_modules is EXCLUDED', pass: !fs.existsSync(path.join(testDir, 'node_modules')) },
  { name: '.next is EXCLUDED', pass: !fs.existsSync(path.join(testDir, '.next')) },
  { name: '.git is EXCLUDED', pass: !fs.existsSync(path.join(testDir, '.git')) },
];

console.log('\n=== ZIP EXTRACTION & INTEGRITY AUDIT ===');
let allPassed = true;
for (const c of checks) {
  const symbol = c.pass ? '✓ [PASS]' : '✗ [FAIL]';
  console.log(`${symbol} ${c.name}`);
  if (!c.pass) allPassed = false;
}

try {
  fs.rmSync(testDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
} catch {
  // Ignored on Windows file lock transient
}

if (allPassed) {
  console.log('\n[SUCCESS] Final delivery ZIP verified with 100% integrity.');
} else {
  console.error('\n[ERROR] Delivery ZIP failed one or more integrity checks.');
  process.exit(1);
}
