const { test, describe } = require('node:test');
const assert = require('node:assert');

// In-Memory Simulated Security Domain for Phase 7
class MockPlatformSecurityContext {
  constructor() {
    this.users = new Map();
    this.hackathons = new Map();
    this.projects = new Map();
    this.results = new Map();
    this.votes = new Map();
    this.comments = new Map();
    this.auditLogs = [];
  }

  addUser(id, role, email) {
    this.users.set(id, { id, role, email });
  }

  addHackathon(id, organizerId, title, status = 'PUBLISHED') {
    this.hackathons.set(id, { id, organizerId, title, status, isVotingEnabled: true });
  }

  addProject(id, hackathonId, title, isPublished = true) {
    this.projects.set(id, { id, hackathonId, title, isPublished });
  }

  addResult(id, hackathonId, projectId, finalScore, rank, awardCategory, isPublished = false) {
    this.results.set(projectId, { id, hackathonId, projectId, finalScore, rank, awardCategory, isPublished });
  }

  // --- Results Access Security ---
  getLeaderboard(hackathonId, requestingUser = null) {
    const hackathon = this.hackathons.get(hackathonId);
    if (!hackathon) throw { status: 404, code: 'NOT_FOUND' };

    const isOrganizer = requestingUser && (requestingUser.role === 'ADMIN' || requestingUser.id === hackathon.organizerId);

    // PUBLIC PRIVACY GUARD: If unpublished and not organizer, forbid access
    if (hackathon.status !== 'RESULTS_PUBLISHED' && !isOrganizer) {
      throw { status: 403, code: 'LEADERBOARD_NOT_PUBLISHED', message: 'Results are unpublished.' };
    }

    const resList = [];
    this.results.forEach((r) => {
      if (r.hackathonId === hackathonId) resList.push(r);
    });
    return resList.sort((a, b) => a.rank - b.rank);
  }

  publishResults(hackathonId, requestingUserId) {
    const hackathon = this.hackathons.get(hackathonId);
    if (!hackathon) throw { status: 404, code: 'NOT_FOUND' };

    const user = this.users.get(requestingUserId);
    // ORGANIZER ISOLATION GUARD
    if (!user || (user.role !== 'ADMIN' && hackathon.organizerId !== requestingUserId)) {
      throw { status: 403, code: 'FORBIDDEN_ORGANIZER_ISOLATION', message: 'Unauthorized to publish results.' };
    }

    hackathon.status = 'RESULTS_PUBLISHED';
    this.results.forEach((r) => {
      if (r.hackathonId === hackathonId) r.isPublished = true;
    });

    this.auditLogs.push({ action: 'RESULTS_PUBLISHED', hackathonId, userId: requestingUserId });
    return true;
  }

  // --- Comments Security ---
  createComment(commentId, projectId, userId, content) {
    const project = this.projects.get(projectId);
    if (!project) throw { status: 404, code: 'PROJECT_NOT_FOUND' };

    const comment = { id: commentId, projectId, userId, content, isFlagged: false };
    this.comments.set(commentId, comment);
    return comment;
  }

  editComment(commentId, requestingUserId, newContent) {
    const comment = this.comments.get(commentId);
    if (!comment) throw { status: 404, code: 'COMMENT_NOT_FOUND' };

    // STRICT AUTHOR GUARD
    if (comment.userId !== requestingUserId) {
      throw { status: 403, code: 'FORBIDDEN_COMMENT_EDIT', message: 'You can only edit your own comment.' };
    }

    comment.content = newContent;
    return comment;
  }

  deleteComment(commentId, requestingUserId) {
    const comment = this.comments.get(commentId);
    if (!comment) throw { status: 404, code: 'COMMENT_NOT_FOUND' };

    const user = this.users.get(requestingUserId);
    const project = this.projects.get(comment.projectId);
    const hackathon = this.hackathons.get(project.hackathonId);

    const isAuthor = comment.userId === requestingUserId;
    const isOrganizer = hackathon.organizerId === requestingUserId;
    const isAdmin = user && user.role === 'ADMIN';

    if (!isAuthor && !isOrganizer && !isAdmin) {
      throw { status: 403, code: 'FORBIDDEN_COMMENT_DELETE', message: 'Unauthorized to delete comment.' };
    }

    this.comments.delete(commentId);
    return true;
  }

  moderateComment(commentId, requestingUserId, isFlagged) {
    const comment = this.comments.get(commentId);
    if (!comment) throw { status: 404, code: 'COMMENT_NOT_FOUND' };

    const user = this.users.get(requestingUserId);
    const project = this.projects.get(comment.projectId);
    const hackathon = this.hackathons.get(project.hackathonId);

    // MODERATOR ISOLATION: Must be organizer of this hackathon or admin
    if (!user || (user.role !== 'ADMIN' && hackathon.organizerId !== requestingUserId)) {
      throw { status: 403, code: 'FORBIDDEN_MODERATION', message: 'Unauthorized to moderate comment.' };
    }

    comment.isFlagged = isFlagged;
    return comment;
  }
}

describe('Results & Community Security Tests', () => {
  let ctx;

  test('Setup mock multi-tenant hackathon security domain', () => {
    ctx = new MockPlatformSecurityContext();

    // Users
    ctx.addUser('user_org_a', 'ORGANIZER', 'orgA@test.com');
    ctx.addUser('user_org_b', 'ORGANIZER', 'orgB@test.com');
    ctx.addUser('user_part_1', 'PARTICIPANT', 'part1@test.com');
    ctx.addUser('user_part_2', 'PARTICIPANT', 'part2@test.com');

    // Hackathons
    ctx.addHackathon('hack_a', 'user_org_a', 'Alpha Hackathon', 'JUDGING');
    ctx.addHackathon('hack_b', 'user_org_b', 'Beta Hackathon', 'PUBLISHED');

    // Projects & Results
    ctx.addProject('proj_1', 'hack_a', 'Project One');
    ctx.addProject('proj_2', 'hack_a', 'Project Two');
    ctx.addResult('res_1', 'hack_a', 'proj_1', 95.0, 1, 'Grand Champion', false);
    ctx.addResult('res_2', 'hack_a', 'proj_2', 88.0, 2, 'Runner Up', false);
  });

  test('[1] Public user CANNOT view unpublished leaderboard (403 Forbidden)', () => {
    assert.throws(
      () => {
        ctx.getLeaderboard('hack_a', null); // Anonymous / Public user
      },
      (err) => err.code === 'LEADERBOARD_NOT_PUBLISHED' && err.status === 403,
      'Public user must be blocked from inspecting unpublished leaderboard'
    );
  });

  test('[2] Organizer A can view unpublished results for their own hackathon', () => {
    const orgUser = { id: 'user_org_a', role: 'ORGANIZER' };
    const standings = ctx.getLeaderboard('hack_a', orgUser);
    assert.strictEqual(standings.length, 2);
    assert.strictEqual(standings[0].rank, 1);
  });

  test('[3] Organizer B CANNOT publish or modify Organizer A hackathon results', () => {
    assert.throws(
      () => {
        ctx.publishResults('hack_a', 'user_org_b');
      },
      (err) => err.code === 'FORBIDDEN_ORGANIZER_ISOLATION' && err.status === 403,
      'Organizer B must be rejected from publishing Organizer A results'
    );
  });

  test('[4] Organizer A publishes results -> Leaderboard becomes publicly visible', () => {
    const published = ctx.publishResults('hack_a', 'user_org_a');
    assert.strictEqual(published, true);

    const publicStandings = ctx.getLeaderboard('hack_a', null);
    assert.strictEqual(publicStandings.length, 2);
    assert.strictEqual(publicStandings[0].rank, 1);
    assert.strictEqual(publicStandings[0].awardCategory, 'Grand Champion');
  });

  test('[5] Comment Security - User can edit ONLY their own comment', () => {
    ctx.createComment('comm_1', 'proj_1', 'user_part_1', 'Great solution!');

    // User 2 attempts to edit User 1 comment -> 403
    assert.throws(
      () => {
        ctx.editComment('comm_1', 'user_part_2', 'Tampered text');
      },
      (err) => err.code === 'FORBIDDEN_COMMENT_EDIT' && err.status === 403
    );

    // User 1 edits own comment -> success
    const updated = ctx.editComment('comm_1', 'user_part_1', 'Updated: Great solution with clean code!');
    assert.strictEqual(updated.content, 'Updated: Great solution with clean code!');
  });

  test('[6] Comment Moderation - Organizer A can hide comment; Organizer B CANNOT moderate Organizer A comments', () => {
    // Organizer B attempts to moderate comment under Hackathon A -> 403
    assert.throws(
      () => {
        ctx.moderateComment('comm_1', 'user_org_b', true);
      },
      (err) => err.code === 'FORBIDDEN_MODERATION' && err.status === 403
    );

    // Organizer A moderates comment -> success
    const moderated = ctx.moderateComment('comm_1', 'user_org_a', true);
    assert.strictEqual(moderated.isFlagged, true);
  });
});
