const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(rootDir, '..');
const stagingDir = path.join(parentDir, 'ATLYX-STAGING');
const zipFile = path.join(parentDir, 'ATLYX-DOGFOOD-FINAL.zip');

const excludeDirs = new Set([
  'node_modules',
  '.next',
  '.git',
  '.gemini',
  '.turbo',
  'dist',
  'build',
  '.idea',
  '.vscode',
  'coverage',
]);

const excludeFiles = new Set([
  '.env',
  '.env.local',
  '.env.development.local',
  '.env.test.local',
  '.env.production.local',
  'Dogfood.zip',
]);

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (excludeDirs.has(entry.name)) {
        continue;
      }
      copyDir(srcPath, destPath);
    } else {
      if (excludeFiles.has(entry.name) || entry.name.endsWith('.log') || entry.name.endsWith('.zip') || entry.name.endsWith('.tsbuildinfo')) {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('1. Cleaning old staging and archives...');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

console.log('2. Staging clean source files...');
copyDir(rootDir, stagingDir);

console.log('3. Verifying required files in staging...');
const requiredFiles = [
  'README.md',
  'ARCHITECTURE.md',
  'DATA-MODEL.md',
  'JUDGING.md',
  'ATLYX-COMPLETE-LIVE-HACKATHON-E2E-REPORT.md',
  'ATLYX-DEMO-VIDEO-SCRIPT.md',
  'acceptance-report.txt',
  '.dogfood.toml',
  'LICENSE',
  'Dockerfile',
  'docker-compose.yml',
  'package.json',
];

for (const req of requiredFiles) {
  const p = path.join(stagingDir, req);
  if (!fs.existsSync(p)) {
    console.error(`[ERROR] Missing required file in staging: ${req}`);
    process.exit(1);
  }
  console.log(`  ✓ ${req} present (${fs.statSync(p).size} bytes)`);
}

console.log('4. Compressing archive via PowerShell Compress-Archive...');
execSync(`powershell -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipFile}' -Force"`, {
  stdio: 'inherit',
});

console.log('5. Cleaning staging directory...');
fs.rmSync(stagingDir, { recursive: true, force: true });

const stats = fs.statSync(zipFile);
console.log(`\n========================================`);
console.log(`SUCCESS: Created ${zipFile}`);
console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
console.log(`========================================`);
