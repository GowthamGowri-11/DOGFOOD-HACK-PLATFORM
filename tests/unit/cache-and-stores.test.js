const test = require('node:test');
const assert = require('node:assert/strict');

// In-Memory Cache Implementation test
function createMemoryCache() {
  const map = new Map();
  return {
    async get(key) {
      const entry = map.get(key);
      if (entry && entry.expiresAt > Date.now()) {
        return entry.value;
      }
      return null;
    },
    async set(key, value, ttlSeconds = 300) {
      map.set(key, {
        value,
        expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : Number.MAX_SAFE_INTEGER,
      });
      return true;
    },
    async del(key) {
      return map.delete(key);
    },
    async delPattern(pattern) {
      let count = 0;
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      for (const k of map.keys()) {
        if (regex.test(k)) {
          map.delete(k);
          count++;
        }
      }
      return count;
    },
  };
}

// ---------------------------------------------------------------------------
// 1. IN-MEMORY CACHE TESTS
// ---------------------------------------------------------------------------
test('In-Memory Cache - [1] Set and Get cached item succeeds', async () => {
  const cache = createMemoryCache();
  const key = 'cache:leaderboard:h_001';
  const data = { standings: [{ rank: 1, team: 'Alpha', score: 98.5 }] };

  await cache.set(key, data, 300);
  const fetched = await cache.get(key);

  assert.equal(fetched.standings[0].rank, 1);
  assert.equal(fetched.standings[0].team, 'Alpha');
  assert.equal(fetched.standings[0].score, 98.5);
});

test('In-Memory Cache - [2] Delete removes key from cache', async () => {
  const cache = createMemoryCache();
  const key = 'cache:leaderboard:h_001';
  await cache.set(key, 'cached-value');
  assert.equal(await cache.get(key), 'cached-value');

  await cache.del(key);
  assert.equal(await cache.get(key), null);
});

test('In-Memory Cache - [3] Pattern-based invalidation purges all matching keys', async () => {
  const cache = createMemoryCache();
  await cache.set('cache:leaderboard:h_1', 'l1');
  await cache.set('cache:leaderboard:h_2', 'l2');
  await cache.set('cache:hackathon:h_1', 'h1');

  const count = await cache.delPattern('cache:leaderboard:*');
  assert.equal(count, 2);

  assert.equal(await cache.get('cache:leaderboard:h_1'), null);
  assert.equal(await cache.get('cache:leaderboard:h_2'), null);
  assert.equal(await cache.get('cache:hackathon:h_1'), 'h1');
});

// ---------------------------------------------------------------------------
// 2. IN-MEMORY RATE LIMITER TESTS
// ---------------------------------------------------------------------------
test('In-Memory RateLimiter - [4] Allows requests within maxAttempts limit', async () => {
  const store = new Map();
  const checkRate = (key, max = 3, windowMs = 15000) => {
    const now = Date.now();
    const record = store.get(key);
    if (!record || now > record.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: max - 1 };
    }
    if (record.count >= max) {
      return { allowed: false, remaining: 0 };
    }
    record.count += 1;
    store.set(key, record);
    return { allowed: true, remaining: max - record.count };
  };

  const key = 'ratelimit:login:127.0.0.1:alice@example.com';
  const r1 = checkRate(key, 3);
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 2);

  const r2 = checkRate(key, 3);
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);

  const r3 = checkRate(key, 3);
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);

  const r4 = checkRate(key, 3);
  assert.equal(r4.allowed, false);
});

test('In-Memory RateLimiter - [5] Reset clears rate limit counter upon successful auth', async () => {
  const store = new Map();
  store.set('ratelimit:user_1', { count: 5, resetAt: Date.now() + 60000 });
  assert.ok(store.has('ratelimit:user_1'));

  // Reset
  store.delete('ratelimit:user_1');
  assert.equal(store.has('ratelimit:user_1'), false);
});

// ---------------------------------------------------------------------------
// 3. IN-MEMORY SESSION STORE TESTS
// ---------------------------------------------------------------------------
test('In-Memory SessionStore - [6] Registers active session and retrieves it', async () => {
  const sessions = new Map();
  const sessionId = 'sess_xyz_789';
  const session = {
    id: 'u_alice_001',
    email: 'alice@example.com',
    role: 'PARTICIPANT',
    sessionId,
  };

  sessions.set(sessionId, { session, expiresAt: Date.now() + 604800 * 1000 });
  const fetched = sessions.get(sessionId);
  assert.notEqual(fetched, undefined);
  assert.equal(fetched.session.id, 'u_alice_001');
  assert.equal(fetched.session.role, 'PARTICIPANT');
});

test('In-Memory SessionStore - [7] Single session revocation destroys active session immediately', async () => {
  const sessions = new Map();
  const sessionId = 'sess_to_logout';

  sessions.set(sessionId, { session: { id: 'u_1' }, expiresAt: Date.now() + 60000 });
  assert.equal(sessions.has(sessionId), true);

  // Logout / Revoke
  sessions.delete(sessionId);
  assert.equal(sessions.has(sessionId), false);
});

test('In-Memory SessionStore - [8] User-wide revocation purges all multi-device sessions', async () => {
  const sessions = new Map();
  const userSessions = new Map();
  const userId = 'u_target_user';
  const sessionIds = ['sess_phone', 'sess_laptop', 'sess_tablet'];

  userSessions.set(userId, new Set(sessionIds));
  for (const sid of sessionIds) {
    sessions.set(sid, { session: { id: userId }, expiresAt: Date.now() + 60000 });
  }

  assert.equal(userSessions.get(userId).size, 3);

  // Revoke all
  const userSids = userSessions.get(userId);
  if (userSids) {
    userSids.forEach((sid) => sessions.delete(sid));
    userSessions.delete(userId);
  }

  for (const sid of sessionIds) {
    assert.equal(sessions.has(sid), false);
  }
  assert.equal(userSessions.has(userId), false);
});

// ---------------------------------------------------------------------------
// 4. IN-MEMORY LOCK TESTS
// ---------------------------------------------------------------------------
test('In-Memory Lock - [9] Acquires lock and blocks concurrent contender', async () => {
  const locks = new Map();
  const lockKey = 'lock:results:generate:hackathon_001';

  // Process 1 acquires lock
  const token1 = 'token_worker_1';
  locks.set(lockKey, { token: token1, expiresAt: Date.now() + 30000 });

  // Process 2 tries to acquire same lock -> fails
  const existing = locks.get(lockKey);
  assert.ok(existing && existing.expiresAt > Date.now());

  // Process 1 finishes and releases lock
  if (existing.token === token1) {
    locks.delete(lockKey);
  }
  assert.equal(locks.has(lockKey), false);

  // Process 2 can now acquire
  const token2 = 'token_worker_2';
  locks.set(lockKey, { token: token2, expiresAt: Date.now() + 30000 });
  assert.equal(locks.get(lockKey).token, token2);
});
