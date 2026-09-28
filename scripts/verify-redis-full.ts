import assert from 'assert';
import { checkRedisHealth, getRedisClient, isRedisConfigured } from '../src/lib/redis';
import { setCache, getCache, deleteCache, deleteCachePattern, getOrSetCache, CACHE_KEYS } from '../src/lib/cache';
import { SessionStore } from '../src/server/auth/session-store';
import { getSessionExpirySeconds } from '../src/server/auth/session';
import { RateLimiter } from '../src/server/auth/rate-limiter';
import { DistributedLock } from '../src/lib/redis-lock';

async function runFullVerification() {
  console.log('=== STARTING DEEP REDIS & LOGIC VERIFICATION ===\n');

  // 1. Redis Configuration & Health Check
  console.log('[1/7] Testing Redis Configuration & Health Probe...');
  assert.equal(isRedisConfigured(), true, 'Redis must be configured in environment');
  const health = await checkRedisHealth();
  console.log('  Health probe response:', health);
  assert.equal(health.status, 'CONNECTED', 'Redis health status must be CONNECTED');
  assert.ok(typeof health.latencyMs === 'number' && health.latencyMs >= 0, 'Latency must be a positive number');
  console.log('  ✔ Health probe passed.\n');

  // 2. Session Expiry Seconds Logic
  console.log('[2/7] Testing Session Expiry Parsing Logic...');
  const defaultSeconds = getSessionExpirySeconds();
  console.log('  Current SESSION_EXPIRY parsed seconds:', defaultSeconds);
  assert.equal(defaultSeconds, 7 * 24 * 60 * 60, '7d must parse to 604800 seconds');

  // Test dynamic formats
  const originalEnv = process.env.SESSION_EXPIRY;
  try {
    process.env.SESSION_EXPIRY = '24h';
    assert.equal(getSessionExpirySeconds(), 24 * 3600, '24h must parse to 86400s');
    process.env.SESSION_EXPIRY = '30m';
    assert.equal(getSessionExpirySeconds(), 30 * 60, '30m must parse to 1800s');
    process.env.SESSION_EXPIRY = '120s';
    assert.equal(getSessionExpirySeconds(), 120, '120s must parse to 120s');
    process.env.SESSION_EXPIRY = '3600';
    assert.equal(getSessionExpirySeconds(), 3600, '3600 must parse to 3600s');
    console.log('  ✔ Session expiry parsing works for d, h, m, s and raw seconds.');
  } finally {
    process.env.SESSION_EXPIRY = originalEnv;
  }
  console.log('  ✔ Expiry logic verified.\n');

  // 3. Cache Operations (Set, Get, Del, Expiry, Pattern, GetOrSet)
  console.log('[3/7] Testing Cache Operations & Invalidation...');
  const testKey = 'test:cache:item_01';
  const testData = { id: 'p_100', score: 99.4, tags: ['ai', 'security'] };

  // Set with TTL (30s)
  const setOk = await setCache(testKey, testData, 30);
  assert.equal(setOk, true, 'setCache should return true');

  // Get
  const fetched = await getCache<typeof testData>(testKey);
  assert.deepEqual(fetched, testData, 'getCache must return identical data structure');
  console.log('  ✔ Cache SET and GET match.');

  // GetOrSet - Cache hit scenario
  let fetcherCalled = false;
  const cachedResult = await getOrSetCache(testKey, async () => {
    fetcherCalled = true;
    return { id: 'fresh' };
  });
  assert.equal(fetcherCalled, false, 'fetcher must NOT be called on cache hit');
  assert.deepEqual(cachedResult, testData);

  // Delete
  await deleteCache(testKey);
  const afterDel = await getCache(testKey);
  assert.equal(afterDel, null, 'Deleted key must return null');
  console.log('  ✔ Cache DELETE verified.');

  // GetOrSet - Cache miss scenario
  fetcherCalled = false;
  const freshResult = await getOrSetCache('test:cache:miss_key', async () => {
    fetcherCalled = true;
    return { generatedAt: Date.now() };
  }, 10);
  assert.equal(fetcherCalled, true, 'fetcher must be called on cache miss');
  assert.ok(freshResult.generatedAt > 0);
  await deleteCache('test:cache:miss_key');
  console.log('  ✔ Cache getOrSetCache verified.');

  // Pattern deletion
  await setCache('test:pattern:k1', 'val1', 30);
  await setCache('test:pattern:k2', 'val2', 30);
  await setCache('test:other:k3', 'val3', 30);

  const deletedCount = await deleteCachePattern('test:pattern:*');
  console.log('  Pattern deleted count:', deletedCount);
  assert.ok(deletedCount >= 2, 'Must delete at least 2 pattern keys');
  assert.equal(await getCache('test:pattern:k1'), null);
  assert.equal(await getCache('test:pattern:k2'), null);
  assert.equal(await getCache('test:other:k3'), 'val3');
  await deleteCache('test:other:k3');
  console.log('  ✔ deleteCachePattern verified.\n');

  // 4. Session Store, Persistence, Lookup, and Multi-Session Revocation
  console.log('[4/7] Testing Session Store & Revocation Life Cycle...');
  const testUserId = `usr_test_${Date.now()}`;
  const session1 = {
    id: testUserId,
    email: 'testuser@hackathon.dev',
    fullName: 'Test Developer',
    role: 'PARTICIPANT' as const,
    status: 'ACTIVE' as const,
  };
  const session2 = { ...session1 };

  // Register session 1 (e.g. Chrome browser)
  const sid1 = await SessionStore.registerSession(session1, 60);
  assert.ok(sid1, 'Session ID 1 must be created');
  assert.equal(await SessionStore.isSessionValid(sid1), true, 'Session 1 must be valid');

  const stored1 = await SessionStore.getSession(sid1);
  assert.equal(stored1?.id, testUserId, 'Stored session userId must match');
  assert.equal(stored1?.role, 'PARTICIPANT');

  // Register session 2 (e.g. Mobile device)
  const sid2 = await SessionStore.registerSession(session2, 60);
  assert.ok(sid2, 'Session ID 2 must be created');
  assert.equal(await SessionStore.isSessionValid(sid2), true, 'Session 2 must be valid');

  // Single session logout (logout session 1 only)
  await SessionStore.revokeSession(sid1);
  assert.equal(await SessionStore.isSessionValid(sid1), false, 'Session 1 must be revoked');
  assert.equal(await SessionStore.isSessionValid(sid2), true, 'Session 2 must remain valid');
  console.log('  ✔ Single session logout successfully revokes token while preserving other device sessions.');

  // User-wide revocation (e.g. password change / account suspension)
  const sid3 = await SessionStore.registerSession(session1, 60);
  const sid4 = await SessionStore.registerSession(session1, 60);
  assert.equal(await SessionStore.isSessionValid(sid3), true);
  assert.equal(await SessionStore.isSessionValid(sid4), true);

  const revokedCount = await SessionStore.revokeAllUserSessions(testUserId);
  console.log(`  Revoked all sessions for user ${testUserId}, count:`, revokedCount);
  assert.ok(revokedCount >= 2, 'All user sessions must be revoked');
  assert.equal(await SessionStore.isSessionValid(sid3), false);
  assert.equal(await SessionStore.isSessionValid(sid4), false);
  console.log('  ✔ User-wide multi-device session revocation verified.\n');

  // 5. Distributed Rate Limiter
  console.log('[5/7] Testing Distributed Rate Limiter (Atomic INCR & PEXPIRE)...');
  const rateKey = `test:ip:10.0.0.1:auth`;
  await RateLimiter.reset(rateKey);

  // First 3 attempts (max = 3)
  const r1 = await RateLimiter.check(rateKey, 3, 30000);
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 2);

  const r2 = await RateLimiter.check(rateKey, 3, 30000);
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);

  const r3 = await RateLimiter.check(rateKey, 3, 30000);
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);

  // 4th attempt - must be blocked
  const r4 = await RateLimiter.check(rateKey, 3, 30000);
  assert.equal(r4.allowed, false, 'Exceeded attempts must be blocked');
  assert.equal(r4.remaining, 0);

  // Reset upon successful authentication
  await RateLimiter.reset(rateKey);
  const r5 = await RateLimiter.check(rateKey, 3, 30000);
  assert.equal(r5.allowed, true, 'Rate limit must be cleared after reset');
  await RateLimiter.reset(rateKey);
  console.log('  ✔ Distributed rate limiter enforced threshold and reset successfully.\n');

  // 6. Distributed Mutual Exclusion Lock
  console.log('[6/7] Testing Distributed Lock (Mutex & Automatic Release)...');
  const lockKey = `test:lock:results:h_apex_2026`;

  // Process A acquires lock
  const tokenA = await DistributedLock.acquire(lockKey, 10);
  assert.ok(tokenA, 'Process A should acquire lock');

  // Process B attempts to acquire same lock -> must fail
  const tokenB = await DistributedLock.acquire(lockKey, 10);
  assert.equal(tokenB, null, 'Process B must be blocked while lock is held');

  // Process A releases lock
  const released = await DistributedLock.release(lockKey, tokenA!);
  assert.equal(released, true, 'Process A must successfully release lock');

  // Process B can now acquire lock
  const tokenBRetry = await DistributedLock.acquire(lockKey, 10);
  assert.ok(tokenBRetry, 'Process B must acquire lock after release');
  await DistributedLock.release(lockKey, tokenBRetry!);

  // Test withLock wrapper
  let executedInLock = false;
  await DistributedLock.withLock(lockKey, async () => {
    executedInLock = true;
  }, 10);
  assert.equal(executedInLock, true, 'withLock action must execute');

  // Verify lock is auto-released after withLock
  const canAcquireAfterWithLock = await DistributedLock.acquire(lockKey, 10);
  assert.ok(canAcquireAfterWithLock, 'Lock must be freed after withLock completes');
  await DistributedLock.release(lockKey, canAcquireAfterWithLock!);
  console.log('  ✔ Distributed mutex lock correctly prevents race conditions and self-releases.\n');

  // 7. Cache Keys Namespace Consistency
  console.log('[7/7] Testing Cache Keys Builders...');
  assert.equal(CACHE_KEYS.LEADERBOARD('h1'), 'cache:leaderboard:h1');
  assert.equal(CACHE_KEYS.HACKATHON('h1'), 'cache:hackathon:h1');
  assert.equal(CACHE_KEYS.GALLERY('all'), 'cache:gallery:all');
  assert.equal(CACHE_KEYS.AI_EVAL('sha123'), 'cache:ai_jury:sha123');
  console.log('  ✔ Cache key constants verified.\n');

  console.log('====================================================');
  console.log('🎉 ALL REDIS, CACHE, SESSION, LIMITER & LOCK LOGICS');
  console.log('   ARE 100% OPERATIONAL AND FULLY VERIFIED!');
  console.log('====================================================');
}

runFullVerification().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
