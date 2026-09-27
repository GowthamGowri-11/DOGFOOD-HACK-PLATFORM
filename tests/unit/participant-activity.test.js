const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Mock Participant Activity Engine for Unit & Security Validation
class TestParticipantActivityEngine {
  static getTimeline(userId, dataStore, filters = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 20));
    const activities = [];

    // 1. Registrations
    const registrations = (dataStore.registrations || []).filter((r) => r.userId === userId);
    for (const reg of registrations) {
      activities.push({
        id: `reg-${reg.id}`,
        type: 'HACKATHON',
        title: 'Registered for Hackathon',
        description: `You registered for ${reg.hackathonTitle || 'Hackathon'}.`,
        entityType: 'REGISTRATION',
        entityId: reg.id,
        timestamp: reg.createdAt,
        status: reg.status,
        hackathonTitle: reg.hackathonTitle,
        href: `/hackathons/${reg.hackathonSlug || reg.hackathonId}`,
      });
    }

    // 2. Teams
    const teamMemberships = (dataStore.teamMembers || []).filter((tm) => tm.userId === userId);
    for (const tm of teamMemberships) {
      activities.push({
        id: `team-${tm.teamId}-${tm.userId}`,
        type: 'TEAM',
        title: tm.isLeader ? `Created Team "${tm.teamName}"` : `Joined Team "${tm.teamName}"`,
        description: tm.isLeader
          ? `You founded team "${tm.teamName}".`
          : `You joined team "${tm.teamName}".`,
        entityType: 'TEAM',
        entityId: tm.teamId,
        timestamp: tm.createdAt,
        href: `/participant/teams`,
      });
    }

    // 3. Projects
    const userTeamIds = new Set(teamMemberships.map((tm) => tm.teamId));
    const projects = (dataStore.projects || []).filter((p) => userTeamIds.has(p.teamId));
    for (const p of projects) {
      activities.push({
        id: `proj-${p.id}`,
        type: 'PROJECT',
        title: `Created Project "${p.title}"`,
        description: `Team project created for ${p.hackathonTitle || 'Event'}.`,
        entityType: 'PROJECT',
        entityId: p.id,
        timestamp: p.createdAt,
        href: `/projects/${p.id}`,
      });
    }

    // 4. Submissions
    const userProjectIds = new Set(projects.map((p) => p.id));
    const submissions = (dataStore.submissions || []).filter((s) => userProjectIds.has(s.projectId));
    for (const sub of submissions) {
      activities.push({
        id: `sub-${sub.id}`,
        type: 'SUBMISSION',
        title: sub.status === 'LOCKED' ? 'Submission Snapshot Locked' : 'Project Submitted',
        description: `Submission snapshot recorded for project.`,
        entityType: 'SUBMISSION',
        entityId: sub.id,
        timestamp: sub.submittedAt || sub.createdAt,
        status: sub.status,
        href: `/projects/${sub.projectId}`,
      });
    }

    // 5. Results (Only Published)
    const results = (dataStore.results || []).filter((r) => r.isPublished && userProjectIds.has(r.projectId));
    for (const res of results) {
      activities.push({
        id: `res-${res.id}`,
        type: 'RESULT',
        title: `Final Results Published: Rank #${res.rank}`,
        description: `Your project placed Rank #${res.rank}!`,
        entityType: 'RESULT',
        entityId: res.id,
        timestamp: res.publishedAt,
        status: 'PUBLISHED',
        href: `/leaderboard`,
      });
    }

    // 6. Certificates
    const certificates = (dataStore.certificates || []).filter((c) => c.userId === userId && c.status === 'ISSUED');
    for (const cert of certificates) {
      activities.push({
        id: `cert-${cert.id}`,
        type: 'CERTIFICATE',
        title: `Certificate Issued: ${cert.type}`,
        description: `Your verified certificate is ready.`,
        entityType: 'CERTIFICATE',
        entityId: cert.id,
        timestamp: cert.issuedAt,
        status: cert.status,
        href: `/participant/certificates`,
      });
    }

    // 7. Attendance
    const attendance = (dataStore.attendanceRecords || []).filter((a) => a.userId === userId);
    for (const att of attendance) {
      activities.push({
        id: `att-${att.id}`,
        type: 'ATTENDANCE',
        title: `Checked In: ${att.sessionTitle}`,
        description: `Verified attendance recorded.`,
        entityType: 'ATTENDANCE',
        entityId: att.id,
        timestamp: att.checkedInAt,
        href: `/participant/attendance`,
      });
    }

    // Sort descending by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by type
    let filtered = activities;
    if (filters.type && filters.type !== 'ALL') {
      filtered = filtered.filter((i) => i.type === filters.type);
    }

    // Filter by time
    if (filters.dateRange && filters.dateRange !== 'ALL') {
      const now = new Date().getTime();
      filtered = filtered.filter((item) => {
        const itemTime = new Date(item.timestamp).getTime();
        if (filters.dateRange === 'TODAY') {
          return now - itemTime <= 24 * 60 * 60 * 1000;
        }
        if (filters.dateRange === 'THIS_WEEK') {
          return now - itemTime <= 7 * 24 * 60 * 60 * 1000;
        }
        if (filters.dateRange === 'THIS_MONTH') {
          return now - itemTime <= 30 * 24 * 60 * 60 * 1000;
        }
        return true;
      });
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedItems = filtered.slice((page - 1) * limit, page * limit);

    return {
      items: paginatedItems,
      total,
      page,
      totalPages,
    };
  }
}

describe('Participant "My Activity" Workflow & Security Test Suite', () => {
  const now = new Date();
  const mockStore = {
    registrations: [
      { id: 'reg-alice-1', userId: 'user-alice', hackathonId: 'hack-1', hackathonTitle: 'AI World Summit', hackathonSlug: 'ai-world-summit', status: 'APPROVED', createdAt: new Date(now.getTime() - 86400000 * 5).toISOString() },
      { id: 'reg-bob-1', userId: 'user-bob', hackathonId: 'hack-1', hackathonTitle: 'AI World Summit', hackathonSlug: 'ai-world-summit', status: 'APPROVED', createdAt: new Date(now.getTime() - 86400000 * 4).toISOString() },
    ],
    teamMembers: [
      { teamId: 'team-alpha', userId: 'user-alice', teamName: 'Alpha Creators', isLeader: true, createdAt: new Date(now.getTime() - 86400000 * 4).toISOString() },
      { teamId: 'team-beta', userId: 'user-bob', teamName: 'Beta Builders', isLeader: true, createdAt: new Date(now.getTime() - 86400000 * 3).toISOString() },
    ],
    projects: [
      { id: 'proj-alpha-1', teamId: 'team-alpha', title: 'Agentic Sentinel', hackathonTitle: 'AI World Summit', createdAt: new Date(now.getTime() - 86400000 * 3).toISOString() },
      { id: 'proj-beta-1', teamId: 'team-beta', title: 'Crypto Bridge', hackathonTitle: 'AI World Summit', createdAt: new Date(now.getTime() - 86400000 * 2).toISOString() },
    ],
    submissions: [
      { id: 'sub-alpha-1', projectId: 'proj-alpha-1', status: 'LOCKED', submittedAt: new Date(now.getTime() - 86400000 * 2).toISOString(), createdAt: new Date(now.getTime() - 86400000 * 2).toISOString() },
    ],
    results: [
      { id: 'res-alpha-1', projectId: 'proj-alpha-1', rank: 1, isPublished: true, publishedAt: new Date(now.getTime() - 86400000 * 1).toISOString() },
      { id: 'res-beta-draft', projectId: 'proj-beta-1', rank: 2, isPublished: false, publishedAt: new Date(now.getTime() - 86400000 * 1).toISOString() }, // Draft - MUST NOT be visible
    ],
    certificates: [
      { id: 'cert-alice-1', userId: 'user-alice', type: 'WINNER', status: 'ISSUED', issuedAt: new Date(now.getTime() - 3600000).toISOString() },
    ],
    attendanceRecords: [
      { id: 'att-alice-1', userId: 'user-alice', sessionTitle: 'Opening Keynote', checkedInAt: new Date(now.getTime() - 86400000 * 3.5).toISOString() },
    ],
  };

  test('[1] Participant Alice fetches own activity timeline', () => {
    const result = TestParticipantActivityEngine.getTimeline('user-alice', mockStore);
    assert.equal(result.total, 7);
    assert.equal(result.items.length, 7);

    // Verify chronological order (Newest first)
    const types = result.items.map((i) => i.type);
    assert.equal(types[0], 'CERTIFICATE'); // Most recent (1 hr ago)
    assert.equal(types[1], 'RESULT'); // Published result (1 day ago)
    assert.equal(types[2], 'SUBMISSION'); // Submission locked (2 days ago)
    assert.equal(types[3], 'PROJECT'); // Project created (3 days ago)
    assert.equal(types[4], 'ATTENDANCE'); // Attendance (3.5 days ago)
    assert.equal(types[5], 'TEAM'); // Team created (4 days ago)
    assert.equal(types[6], 'HACKATHON'); // Registration (5 days ago)
  });


  test('[2] STRICT USER ISOLATION - Alice cannot see Bob activity and Bob cannot see Alice activity', () => {
    const aliceTimeline = TestParticipantActivityEngine.getTimeline('user-alice', mockStore);
    const bobTimeline = TestParticipantActivityEngine.getTimeline('user-bob', mockStore);

    // Verify Alice sees only Alpha project/team
    const aliceTitles = aliceTimeline.items.map((i) => i.title);
    assert.ok(aliceTitles.some((t) => t.includes('Alpha Creators')));
    assert.ok(!aliceTitles.some((t) => t.includes('Beta Builders')));

    // Verify Bob sees only Beta project/team
    const bobTitles = bobTimeline.items.map((i) => i.title);
    assert.ok(bobTitles.some((t) => t.includes('Beta Builders')));
    assert.ok(!bobTitles.some((t) => t.includes('Alpha Creators')));
  });

  test('[3] Unpublished Draft Results are NEVER exposed in participant activity stream', () => {
    const bobTimeline = TestParticipantActivityEngine.getTimeline('user-bob', mockStore);
    const hasResult = bobTimeline.items.some((i) => i.type === 'RESULT');
    assert.equal(hasResult, false, 'Draft result must not appear in participant activity stream');
  });

  test('[4] Activity Filtering by Category works accurately', () => {
    const submissionOnly = TestParticipantActivityEngine.getTimeline('user-alice', mockStore, { type: 'SUBMISSION' });
    assert.equal(submissionOnly.total, 1);
    assert.equal(submissionOnly.items[0].type, 'SUBMISSION');

    const certOnly = TestParticipantActivityEngine.getTimeline('user-alice', mockStore, { type: 'CERTIFICATE' });
    assert.equal(certOnly.total, 1);
    assert.equal(certOnly.items[0].type, 'CERTIFICATE');
  });

  test('[5] Activity Timeframe Filter works accurately', () => {
    const todayOnly = TestParticipantActivityEngine.getTimeline('user-alice', mockStore, { dateRange: 'TODAY' });
    assert.equal(todayOnly.total, 1);
    assert.equal(todayOnly.items[0].type, 'CERTIFICATE');
  });

  test('[6] Pagination calculations return valid metadata', () => {
    const paged = TestParticipantActivityEngine.getTimeline('user-alice', mockStore, { page: 1, limit: 2 });
    assert.equal(paged.items.length, 2);
    assert.equal(paged.total, 7);
    assert.equal(paged.page, 1);
    assert.equal(paged.totalPages, 4);
  });


  test('[7] Empty State returns clean 0 items for new user', () => {
    const emptyResult = TestParticipantActivityEngine.getTimeline('user-charlie-new', mockStore);
    assert.equal(emptyResult.total, 0);
    assert.equal(emptyResult.items.length, 0);
    assert.equal(emptyResult.totalPages, 1);
  });

  test('[8] Related Entity links format to valid routes', () => {
    const result = TestParticipantActivityEngine.getTimeline('user-alice', mockStore);
    for (const item of result.items) {
      assert.ok(item.href, `Activity item ${item.id} must have a valid href`);
      assert.ok(item.href.startsWith('/'), `Href must be relative application route: ${item.href}`);
    }
  });
});
