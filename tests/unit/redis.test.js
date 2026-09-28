const test = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// Mock in-memory Redis client matching @upstash/redis API
// ---------------------------------------------------------------------------
function createMockRedis() {
  const kv = new Map();
  const sets = new Map();
  const expiries = new Map();

  function isExpired(key) {
    const exp = expiries.get(key);
    if (exp && exp <= Date.now()) {
      kv.delete(key);
      sets.delete(key);
      expiries.delete(key);
      return true;
    }
    return false;
  }

  return {
    async ping() {
      return 'PONG';
    },
    async get(key) {
      if (isExpired(key)) return null;
      const val = kv.get(key);
      return val !== undefined ? val : null;
    },
    async set(key, val, options) {
      if (options?.nx && kv.has(key) && !isExpired(key)) {
        return null;
      }
      kv.set(key, val);
      if (options?.ex) {
        expiries.set(key, Date.now() + options.ex * 1000);
      }
      return 'OK';
    },
    async del(...keys) {
      let count = 0;
      for (const k of keys) {
        if (kv.delete(k) || sets.delete(k)) count++;
        expiries.delete(k);
      }
      return count;
    },
    async incr(key) {
      isExpired(key);
      const curr = (kv.get(key) || 0) + 1;
      kv.set(key, curr);
      return curr;
    },
    async expire(key, seconds) {
      expiries.set(key, Date.now() + seconds * 1000);
      return 1;
    },
    async exists(key) {
      if (isExpired(key)) return 0;
      return kv.has(key) || sets.has(key) ? 1 : 0;
    },
    async sadd(key, member) {
      isExpired(key);
      if (!sets.has(key)) sets.set(key, new Set());
      sets.get(key).add(member);
      return 1;
    },
    async smembers(key) {
      if (isExpired(key)) return [];
      const s = sets.get(key);
      return s ? Array.from(s) : [];
    },
    async keys(pattern) {
      const reg = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      const matched = [];
      for (const k of kv.keys()) {
        if (!isExpired(k) && reg.test(k)) matched.push(k);
      }
      return matched;
    },
  };
}

// ---------------------------------------------------------------------------
// 1. REDIS CACHE ENGINE TESTS
// ---------------------------------------------------------------------------
test('Redis Cache - [1] Set and Get cached item succeeds', async () => {
  const redis = createMockRedis();
  const key = 'cache:leaderboard:h_001';
  const data = { standings: [{ rank: 1, team: 'Alpha', score: 98.5 }] };

  await redis.set(key, JSON.stringify(data), { ex: 300 });
  const raw = await redis.get(key);
  const parsed = JSON.parse(raw);

  assert.equal(parsed.standings[0].rank, 1);
  assert.equal(parsed.standings[0].team, 'Alpha');
  assert.equal(parsed.standings[0].score, 98.5);
});

test('Redis Cache - [2] Delete removes key from cache', async () => {
  const redis = createMockRedis();
  const key = 'cache:leaderboard:h_001';
  await redis.set(key, 'cached-value');
  assert.equal(await redis.get(key), 'cached-value');

  await redis.del(key);
  assert.equal(await redis.get(key), null);
});

test('Redis Cache - [3] Pattern-based invalidation purges all matching keys', async () => {
  const redis = createMockRedis();
  await redis.set('cache:leaderboard:h_1', 'l1');
  await redis.set('cache:leaderboard:h_2', 'l2');
  await redis.set('cache:hackathon:h_1', 'h1');

  const matchingKeys = await redis.keys('cache:leaderboard:*');
  assert.equal(matchingKeys.length, 2);

  await redis.del(...matchingKeys);
  assert.equal(await redis.get('cache:leaderboard:h_1'), null);
  assert.equal(await redis.get('cache:leaderboard:h_2'), null);
  assert.equal(await redis.get('cache:hackathon:h_1'), 'h1');
});

// ---------------------------------------------------------------------------
// 2. REDIS RATE LIMITER TESTS
// ---------------------------------------------------------------------------
test('Redis RateLimiter - [4] Allows requests within maxAttempts limit', async () => {
  const redis = createMockRedis();
  const key = 'ratelimit:login:127.0.0.1:alice@example.com';
  const maxAttempts = 3;

  for (let i = 1; i <= maxAttempts; i++) {
    const count = await redis.incr(key);
    assert.equal(count <= maxAttempts, true);
  }

  // Next attempt exceeds limit
  const exceededCount = await redis.incr(key);
  assert.equal(exceededCount > maxAttempts, true);
});

test('Redis RateLimiter - [5] Reset clears the rate limit counter upon successful auth', async () => {
  const redis = createMockRedis();
  const key = 'ratelimit:login:127.0.0.1:bob@example.com';

  await redis.incr(key);
  await redis.incr(key);
  assert.equal(await redis.get(key), 2);

  await redis.del(key);
  assert.equal(await redis.get(key), null);

  const fresh = await redis.incr(key);
  assert.equal(fresh, 1);
});

// ---------------------------------------------------------------------------
// 3. REDIS SESSION STORE & REVOCATION TESTS
// ---------------------------------------------------------------------------
test('Redis SessionStore - [6] Registers active session and retrieves it', async () => {
  const redis = createMockRedis();
  const sessionId = 'sess_xyz_789';
  const session = {
    id: 'u_alice_001',
    email: 'alice@example.com',
    role: 'PARTICIPANT',
    sessionId,
  };

  await redis.set(`session:active:${sessionId}`, JSON.stringify(session), { ex: 604800 });
  await redis.sadd(`user:sessions:${session.id}`, sessionId);

  const active = await redis.get(`session:active:${sessionId}`);
  assert.notEqual(active, null);
  const parsed = JSON.parse(active);
  assert.equal(parsed.id, 'u_alice_001');
  assert.equal(parsed.role, 'PARTICIPANT');
});

test('Redis SessionStore - [7] Single session revocation destroys active session immediately', async () => {
  const redis = createMockRedis();
  const sessionId = 'sess_to_logout';

  await redis.set(`session:active:${sessionId}`, JSON.stringify({ id: 'u_1' }));
  assert.equal(await redis.exists(`session:active:${sessionId}`), 1);

  // Logout / Revoke
  await redis.del(`session:active:${sessionId}`);
  assert.equal(await redis.exists(`session:active:${sessionId}`), 0);
});

test('Redis SessionStore - [8] User-wide revocation purges all multi-device sessions', async () => {
  const redis = createMockRedis();
  const userId = 'u_target_user';
  const sessionIds = ['sess_phone', 'sess_laptop', 'sess_tablet'];

  for (const sid of sessionIds) {
    await redis.set(`session:active:${sid}`, JSON.stringify({ id: userId }));
    await redis.sadd(`user:sessions:${userId}`, sid);
  }

  // Verify all 3 are active
  const userSessions = await redis.smembers(`user:sessions:${userId}`);
  assert.equal(userSessions.length, 3);

  // Admin suspends user or password changed -> Revoke all
  const keysToDelete = userSessions.map((sid) => `session:active:${sid}`);
  keysToDelete.push(`user:sessions:${userId}`);
  await redis.del(...keysToDelete);

  for (const sid of sessionIds) {
    assert.equal(await redis.exists(`session:active:${sid}`), 0);
  }
  assert.equal(await redis.exists(`user:sessions:${userId}`), 0);
});

// ---------------------------------------------------------------------------
// 4. DISTRIBUTED LOCK MUTEX TESTS
// ---------------------------------------------------------------------------
test('Redis Distributed Lock - [9] Acquires lock and blocks concurrent contender', async () => {
  const redis = createMockRedis();
  const lockKey = 'lock:results:generate:hackathon_001';

  // Process 1 acquires lock
  const token1 = 'token_worker_1';
  const acq1 = await redis.set(lockKey, token1, { nx: true, ex: 30 });
  assert.equal(acq1, 'OK');

  // Process 2 tries to acquire same lock -> fails
  const token2 = 'token_worker_2';
  const acq2 = await redis.set(lockKey, token2, { nx: true, ex: 30 });
  assert.equal(acq2, null);

  // Process 1 finishes and releases lock
  const current = await redis.get(lockKey);
  if (current === token1) {
    await redis.del(lockKey);
  }
  assert.equal(await redis.get(lockKey), null);

  // Process 2 can now acquire
  const acq2Retry = await redis.set(lockKey, token2, { nx: true, ex: 30 });
  assert.equal(acq2Retry, 'OK');
});

test('Redis Health Probe - [10] Responds with PONG when live', async () => {
  const redis = createMockRedis();
  const pong = await redis.ping();
  assert.equal(pong, 'PONG');
});
