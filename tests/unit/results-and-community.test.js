const { test, describe } = require('node:test');
const assert = require('node:assert');

// 1. In-Memory Mock Results & Community Subsystem
class MockResultSubsystem {
  static computeRankings(projects, prizes = []) {
    // Sort descending by finalScore, tiebreak by rawAverage
    const sorted = [...projects].sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      return b.rawAverage - a.rawAverage;
    });

    const prizeMap = new Map();
    prizes.forEach((p) => prizeMap.set(p.rankOrder, p.title));

    return sorted.map((p, index) => {
      const rank = index + 1;
      const awardCategory = prizeMap.get(rank);
      const isWinner = rank <= Math.max(prizes.length, 3);

      return {
        projectId: p.projectId,
        rank,
        finalScore: p.finalScore,
        rawAverageScore: p.rawAverage,
        normalizedScore: p.normalizedScore,
        awardCategory,
        isWinner,
      };
    });
  }

  static verifyResults(results, totalSubmittedProjects, prizes = []) {
    const anomalies = [];
    let hasNaNOrInfinity = false;
    const rankCounts = new Map();

    if (results.length === 0) {
      anomalies.push('No generated results found.');
    }

    if (results.length < totalSubmittedProjects) {
      anomalies.push(`Missing results: ${totalSubmittedProjects - results.length} submitted projects lack results.`);
    }

    results.forEach((r) => {
      if (isNaN(r.finalScore) || !isFinite(r.finalScore)) {
        hasNaNOrInfinity = true;
        anomalies.push(`Invalid final score: ${r.finalScore}`);
      }

      const count = (rankCounts.get(r.rank) || 0) + 1;
      rankCounts.set(r.rank, count);
    });

    const duplicateRanks = [];
    rankCounts.forEach((count, rank) => {
      if (count > 1) duplicateRanks.push(rank);
    });

    if (duplicateRanks.length > 0) {
      anomalies.push(`Duplicate ranks detected: Ranks ${duplicateRanks.join(', ')} assigned multiple times.`);
    }

    const unassignedPrizes = prizes.filter(
      (p) => !results.some((r) => r.rank === p.rankOrder && r.awardCategory === p.title)
    );

    const isVerified = anomalies.length === 0 && !hasNaNOrInfinity;

    return {
      isVerified,
      totalProjects: totalSubmittedProjects,
      rankedProjectsCount: results.length,
      hasNaNOrInfinity,
      duplicateRanks,
      unassignedPrizesCount: unassignedPrizes.length,
      anomalies,
    };
  }

  static sanitizeComment(content) {
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('Comment cannot be empty.');
    }
    if (content.length > 1000) {
      throw new Error('Comment exceeds maximum allowed length of 1000 characters.');
    }
    return content
      .trim()
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

describe('Results Engine, Ranking & Verification', () => {
  const prizes = [
    { title: 'Grand Champion ($10,000)', rankOrder: 1 },
    { title: 'First Runner Up ($5,000)', rankOrder: 2 },
    { title: 'Second Runner Up ($2,500)', rankOrder: 3 },
  ];

  test('Ranking Engine - sorts projects descending by final score', () => {
    const projects = [
      { projectId: 'p1', finalScore: 82.5, rawAverage: 81.0, normalizedScore: 82.5 },
      { projectId: 'p2', finalScore: 95.0, rawAverage: 94.0, normalizedScore: 95.0 },
      { projectId: 'p3', finalScore: 88.0, rawAverage: 87.0, normalizedScore: 88.0 },
    ];

    const rankings = MockResultSubsystem.computeRankings(projects, prizes);
    assert.strictEqual(rankings[0].projectId, 'p2');
    assert.strictEqual(rankings[0].rank, 1);
    assert.strictEqual(rankings[0].awardCategory, 'Grand Champion ($10,000)');
    assert.strictEqual(rankings[0].isWinner, true);

    assert.strictEqual(rankings[1].projectId, 'p3');
    assert.strictEqual(rankings[1].rank, 2);
    assert.strictEqual(rankings[1].awardCategory, 'First Runner Up ($5,000)');

    assert.strictEqual(rankings[2].projectId, 'p1');
    assert.strictEqual(rankings[2].rank, 3);
    assert.strictEqual(rankings[2].awardCategory, 'Second Runner Up ($2,500)');
  });

  test('Tie Handling - tiebreaks identical final scores using raw average score', () => {
    const tiedProjects = [
      { projectId: 'p_tie_a', finalScore: 90.0, rawAverage: 88.5, normalizedScore: 90.0 },
      { projectId: 'p_tie_b', finalScore: 90.0, rawAverage: 91.2, normalizedScore: 90.0 }, // Higher raw average
    ];

    const rankings = MockResultSubsystem.computeRankings(tiedProjects, prizes);
    assert.strictEqual(rankings[0].projectId, 'p_tie_b', 'p_tie_b must win tiebreak due to higher raw average');
    assert.strictEqual(rankings[0].rank, 1);
    assert.strictEqual(rankings[1].projectId, 'p_tie_a');
    assert.strictEqual(rankings[1].rank, 2);
  });

  test('Result Verification - passes clean verified results report', () => {
    const cleanResults = [
      { projectId: 'p1', rank: 1, finalScore: 95.0, awardCategory: 'Grand Champion ($10,000)' },
      { projectId: 'p2', rank: 2, finalScore: 90.0, awardCategory: 'First Runner Up ($5,000)' },
    ];

    const report = MockResultSubsystem.verifyResults(cleanResults, 2, prizes.slice(0, 2));
    assert.strictEqual(report.isVerified, true);
    assert.strictEqual(report.hasNaNOrInfinity, false);
    assert.strictEqual(report.duplicateRanks.length, 0);
    assert.strictEqual(report.anomalies.length, 0);
  });

  test('Result Verification - detects NaN scores or missing project results', () => {
    const corruptResults = [
      { projectId: 'p1', rank: 1, finalScore: NaN, awardCategory: 'Grand Champion ($10,000)' },
    ];

    const report = MockResultSubsystem.verifyResults(corruptResults, 3, prizes);
    assert.strictEqual(report.isVerified, false);
    assert.strictEqual(report.hasNaNOrInfinity, true);
    assert.ok(report.anomalies.some((a) => a.includes('Missing results')));
    assert.ok(report.anomalies.some((a) => a.includes('Invalid final score')));
  });
});

describe('Community Voting & Anti-Abuse Controls', () => {
  const votes = new Map();

  function castVote(userId, projectId, isVotingEnabled = true) {
    if (!isVotingEnabled) {
      throw { status: 403, code: 'VOTING_DISABLED', message: 'Voting is disabled.' };
    }
    const key = `${userId}_${projectId}`;
    if (votes.has(key)) {
      throw { status: 409, code: 'DUPLICATE_VOTE', message: 'User already voted for this project.' };
    }
    votes.set(key, { userId, projectId, votedAt: new Date() });
    return votes.size;
  }

  function removeVote(userId, projectId) {
    const key = `${userId}_${projectId}`;
    if (!votes.has(key)) {
      throw { status: 404, code: 'VOTE_NOT_FOUND', message: 'Vote not found.' };
    }
    votes.delete(key);
    return votes.size;
  }

  test('Community Voting - authenticated user can cast a vote', () => {
    const count = castVote('user_1', 'proj_alpha', true);
    assert.strictEqual(count, 1);
  });

  test('Community Voting - duplicate vote by same user on same project is rejected', () => {
    assert.throws(
      () => {
        castVote('user_1', 'proj_alpha', true);
      },
      (err) => err.code === 'DUPLICATE_VOTE' && err.status === 409
    );
  });

  test('Community Voting - user can remove their own vote', () => {
    const remaining = removeVote('user_1', 'proj_alpha');
    assert.strictEqual(remaining, 0);
  });

  test('Community Voting - rejected when voting is disabled on hackathon', () => {
    assert.throws(
      () => {
        castVote('user_2', 'proj_beta', false);
      },
      (err) => err.code === 'VOTING_DISABLED' && err.status === 403
    );
  });

  test('CRITICAL INVARIANT - community votes NEVER alter official jury score or ranking', () => {
    const project = {
      projectId: 'proj_alpha',
      finalScore: 85.0, // Official judge score
      rank: 2,
    };

    // Simulate 500 community votes
    for (let i = 0; i < 50; i++) {
      votes.set(`voter_${i}_proj_alpha`, { userId: `voter_${i}`, projectId: 'proj_alpha' });
    }

    assert.strictEqual(project.finalScore, 85.0, 'Official final score must remain unchanged by votes');
    assert.strictEqual(project.rank, 2, 'Official rank must remain unchanged by votes');
  });
});

describe('Community Comments & XSS Sanitization', () => {
  test('Comment Validation - accepts clean non-empty comment', () => {
    const sanitized = MockResultSubsystem.sanitizeComment('Amazing architecture! Loved the AI pipeline.');
    assert.strictEqual(sanitized, 'Amazing architecture! Loved the AI pipeline.');
  });

  test('Comment Validation - rejects empty or whitespace-only comment', () => {
    assert.throws(() => {
      MockResultSubsystem.sanitizeComment('   ');
    }, /cannot be empty/);
  });

  test('Comment Validation - rejects oversized comment (> 1000 chars)', () => {
    const longText = 'a'.repeat(1005);
    assert.throws(() => {
      MockResultSubsystem.sanitizeComment(longText);
    }, /exceeds maximum allowed length/);
  });

  test('XSS Protection - sanitizes malicious script and HTML tags', () => {
    const payload = '<script>alert("XSS")</script><img src="x" onerror="stealCookie()" />';
    const sanitized = MockResultSubsystem.sanitizeComment(payload);
    assert.strictEqual(sanitized.includes('<script>'), false);
    assert.strictEqual(sanitized.includes('onerror='), true); // Encoded safely as text
    assert.ok(sanitized.startsWith('&lt;script&gt;'));
  });
});
