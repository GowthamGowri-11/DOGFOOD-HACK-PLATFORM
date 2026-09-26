const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// 1. ARTIFACT & URL VALIDATION
// ---------------------------------------------------------------------------

function validateGitHubUrl(url) {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return { isValid: false, message: 'GitHub repository URL is required.' };
  }
  const trimmed = url.trim();
  const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\/)?$/;
  return { isValid: githubRegex.test(trimmed) };
}

function validateSafeUrl(url, fieldName = 'URL') {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return { isValid: true };
  }
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, message: `${fieldName} must use http or https protocol.` };
    }
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local')) {
      return { isValid: false, message: `${fieldName} cannot be a local address.` };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, message: `Invalid ${fieldName} syntax.` };
  }
}

function validateVideoUrl(url) {
  if (!url || typeof url !== 'string' || url.trim().length === 0) return { isValid: true };
  const safeCheck = validateSafeUrl(url, 'Video URL');
  if (!safeCheck.isValid) return safeCheck;
  const trimmed = url.trim().toLowerCase();
  const isKnown =
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be') ||
    trimmed.includes('vimeo.com') ||
    trimmed.includes('loom.com') ||
    trimmed.includes('drive.google.com') ||
    trimmed.endsWith('.mp4');
  return { isValid: isKnown };
}

test('Artifacts - [1] Valid GitHub repository URLs pass validation', () => {
  assert.equal(validateGitHubUrl('https://github.com/dogfood/sentinel-shield').isValid, true);
  assert.equal(validateGitHubUrl('https://www.github.com/org-name/repo.js').isValid, true);
});

test('Artifacts - [2] Malformed or non-GitHub repository URLs are rejected', () => {
  assert.equal(validateGitHubUrl('not-a-url').isValid, false);
  assert.equal(validateGitHubUrl('https://gitlab.com/owner/repo').isValid, false);
  assert.equal(validateGitHubUrl('https://github.com/').isValid, false);
});

test('Artifacts - [3] Safe URLs accept public http/https and reject SSRF / localhost targets', () => {
  assert.equal(validateSafeUrl('https://sentinel-shield.vercel.app').isValid, true);
  assert.equal(validateSafeUrl('http://127.0.0.1:8080/exploit').isValid, false);
  assert.equal(validateSafeUrl('http://localhost/admin').isValid, false);
});

test('Artifacts - [4] Video URLs validate supported streaming providers', () => {
  assert.equal(validateVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ').isValid, true);
  assert.equal(validateVideoUrl('https://loom.com/share/abcdef123456').isValid, true);
  assert.equal(validateVideoUrl('https://random-sketchy-site.xyz/video.avi').isValid, false);
});

// ---------------------------------------------------------------------------
// 2. CANONICAL SNAPSHOT & DETERMINISTIC CONTENT HASH
// ---------------------------------------------------------------------------

function createCanonicalPayload(project, submitterId, version = 1) {
  return {
    project: {
      id: project.id,
      title: project.title,
      slug: project.slug,
      description: project.description,
    },
    team: {
      id: project.team.id,
      name: project.team.name,
      members: project.team.members.map((m) => ({ userId: m.userId, isLeader: m.isLeader })),
    },
    artifacts: {
      repoUrl: project.repoUrl,
      demoUrl: project.demoUrl || null,
    },
    version,
    submitterId,
  };
}

function canonicalStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((key) => JSON.stringify(key) + ':' + canonicalStringify(obj[key]));
  return '{' + pairs.join(',') + '}';
}

function calculateContentHash(payload) {
  const serialized = canonicalStringify(payload);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

test('Snapshot - [5] Generates deterministic SHA-256 content hash for identical payloads', () => {
  const project = {
    id: 'proj_1',
    title: 'Autonomous Sentinel',
    slug: 'autonomous-sentinel',
    description: 'An enterprise autonomous security platform with real-time consensus.',
    repoUrl: 'https://github.com/dogfood/sentinel',
    team: {
      id: 'team_1',
      name: 'Alpha Team',
      members: [{ userId: 'u1', isLeader: true }],
    },
  };

  const payload1 = createCanonicalPayload(project, 'u1', 1);
  const payload2 = createCanonicalPayload(project, 'u1', 1);

  const hash1 = calculateContentHash(payload1);
  const hash2 = calculateContentHash(payload2);

  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 64); // SHA-256 hex string length
});

test('Snapshot - [6] Changing any field in the payload alters the content hash', () => {
  const project = {
    id: 'proj_1',
    title: 'Autonomous Sentinel',
    slug: 'autonomous-sentinel',
    description: 'An enterprise autonomous security platform with real-time consensus.',
    repoUrl: 'https://github.com/dogfood/sentinel',
    team: {
      id: 'team_1',
      name: 'Alpha Team',
      members: [{ userId: 'u1', isLeader: true }],
    },
  };

  const payload1 = createCanonicalPayload(project, 'u1', 1);
  const modifiedProject = { ...project, title: 'Tampered Title' };
  const payload2 = createCanonicalPayload(modifiedProject, 'u1', 1);

  const hash1 = calculateContentHash(payload1);
  const hash2 = calculateContentHash(payload2);

  assert.notEqual(hash1, hash2);
});
