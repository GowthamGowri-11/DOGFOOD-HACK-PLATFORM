const { PrismaClient, RoleType, EventStatus, SubmissionStatus, AssignmentStatus, EvaluationStatus, RegistrationStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const TRACK_COLORS = [
  '#2563EB', '#059669', '#D97706', '#DC2626',
  '#7C3AED', '#0891B2', '#DB2777', '#EA580C',
];

async function seedDatabase(options = {}) {
  console.log('🚀 Starting Hackathon Platform Seeding...');

  // 1. Locate Fixture File
  let fixturesPath = path.join(__dirname, '../fixtures copy.json');
  if (!fs.existsSync(fixturesPath)) {
    fixturesPath = path.join(__dirname, '../fixtures.json');
  }
  console.log(`📂 Using fixture source: ${fixturesPath}`);
  const raw = fs.readFileSync(fixturesPath, 'utf-8');
  const data = JSON.parse(raw);

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 2. Clear Existing Hackathon Records Idempotently
  console.log('🧹 Clearing existing hackathon records...');
  await prisma.$transaction([
    prisma.evaluationScore.deleteMany(),
    prisma.evaluation.deleteMany(),
    prisma.judgeAssignment.deleteMany(),
    prisma.result.deleteMany(),
    prisma.roundResult.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.vote.deleteMany(),
    prisma.project.deleteMany(),
    prisma.teamMember.deleteMany(),
    prisma.teamInvite.deleteMany(),
    prisma.team.deleteMany(),
    prisma.registration.deleteMany(),
    prisma.judge.deleteMany(),
    prisma.rubricCriterion.deleteMany(),
    prisma.rubric.deleteMany(),
    prisma.problemStatement.deleteMany(),
    prisma.track.deleteMany(),
    prisma.prize.deleteMany(),
    prisma.round.deleteMany(),
    prisma.certificate.deleteMany(),
    prisma.hackathon.deleteMany(),
  ]);

  // 3. Ensure Core System Accounts
  console.log('👤 Seeding core platform accounts...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hackathon.dev' },
    update: { role: RoleType.ADMIN, isActive: true },
    create: {
      email: 'admin@hackathon.dev',
      passwordHash: defaultPasswordHash,
      fullName: 'Platform Administrator',
      role: RoleType.ADMIN,
      isActive: true,
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@hackathon.dev' },
    update: { role: RoleType.ORGANIZER, isActive: true },
    create: {
      email: 'organizer@hackathon.dev',
      passwordHash: defaultPasswordHash,
      fullName: 'Apex Event Lead',
      role: RoleType.ORGANIZER,
      isActive: true,
    },
  });

  // 4. Seed Judges as Users
  console.log(`👨‍⚖️ Seeding ${data.judges.length} judges...`);
  const userMap = new Map();
  userMap.set('admin@hackathon.dev', admin.id);
  userMap.set('organizer@hackathon.dev', organizer.id);

  for (const j of data.judges) {
    const user = await prisma.user.upsert({
      where: { email: j.email.toLowerCase().trim() },
      update: { fullName: j.name, role: RoleType.JUDGE, isActive: true },
      create: {
        email: j.email.toLowerCase().trim(),
        passwordHash: defaultPasswordHash,
        fullName: j.name,
        role: RoleType.JUDGE,
        isActive: true,
      },
    });
    userMap.set(j.email.toLowerCase().trim(), user.id);
  }

  // 5. Seed Team Member Users
  console.log('👥 Seeding participant user accounts...');
  for (const t of data.teams) {
    for (const memberEmail of t.members) {
      const email = memberEmail.toLowerCase().trim();
      if (!userMap.has(email)) {
        const username = email.split('@')[0];
        const formattedName = username
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

        const user = await prisma.user.upsert({
          where: { email },
          update: { role: RoleType.PARTICIPANT, isActive: true },
          create: {
            email,
            passwordHash: defaultPasswordHash,
            fullName: formattedName,
            role: RoleType.PARTICIPANT,
            isActive: true,
          },
        });
        userMap.set(email, user.id);
      }
    }
  }

  // 6. Seed Hackathon Event
  const hackathonId = data.event.id || 'evt_01';
  const subCloseDate = new Date(data.event.submissions_close || '2026-03-01T18:00:00Z');
  const now = new Date();

  console.log(`🏆 Seeding Hackathon: "${data.event.name}" (${hackathonId})...`);
  const hackathon = await prisma.hackathon.create({
    data: {
      id: hackathonId,
      slug: slugify(data.event.name || 'sample-hack-2026'),
      title: data.event.name || 'Sample Hack 2026',
      tagline: 'Global Premier Innovation Arena & Software Competition',
      description:
        'A comprehensive competitive hackathon spanning developer tools, security, climate, health, and open hardware.',
      organizationName: 'Global Hackathon Arena Foundation',
      organizerId: organizer.id,
      status: EventStatus.JUDGING,
      minTeamSize: 1,
      maxTeamSize: 4,
      regStartTime: new Date(subCloseDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      regEndTime: new Date(subCloseDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      eventStartTime: new Date(subCloseDate.getTime() - 14 * 24 * 60 * 60 * 1000),
      eventEndTime: new Date(subCloseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      subStartTime: new Date(subCloseDate.getTime() - 14 * 24 * 60 * 60 * 1000),
      subEndTime: subCloseDate,
      judgingStartTime: subCloseDate,
      judgingEndTime: new Date(subCloseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      isVotingEnabled: true,
      eligibilityRules: 'Open to all verified developers, engineers, and researchers worldwide.',
      rulesAndGuidelines: 'All submitted repositories must include working code and public documentation.',
    },
  });

  // 7. Seed Tracks and Problem Statements
  console.log(`🛤️ Seeding ${data.tracks.length} tracks and problem statements...`);
  const problemMap = new Map();

  for (let i = 0; i < data.tracks.length; i++) {
    const t = data.tracks[i];
    const colorHex = TRACK_COLORS[i % TRACK_COLORS.length];

    const track = await prisma.track.create({
      data: {
        id: t.id,
        hackathonId: hackathon.id,
        title: t.name,
        slug: slugify(t.name),
        description: `Explore and innovate within ${t.name}.`,
        colorHex,
        displayOrder: i + 1,
      },
    });

    const ps = await prisma.problemStatement.create({
      data: {
        id: `ps_${t.id}`,
        hackathonId: hackathon.id,
        trackId: track.id,
        code: `TRK-0${i + 1}`,
        title: `${t.name} Core Challenge`,
        description: `Build open, high-impact technological solutions advancing ${t.name}.`,
        displayOrder: 1,
      },
    });
    problemMap.set(t.id, ps.id);
  }

  // 8. Seed Rubric and Criteria
  console.log('📋 Seeding evaluation rubric and criteria...');
  const rubric = await prisma.rubric.create({
    data: {
      id: `rubric_${hackathon.id}`,
      hackathonId: hackathon.id,
      name: 'Comprehensive Hackathon Adjudication Rubric',
      version: 1,
      isCurrent: true,
    },
  });

  const criteriaConfigs = [
    { key: 'functionality', title: 'Functionality', weight: 33.33, desc: 'Execution, performance, and correctness.' },
    { key: 'quality', title: 'Code Quality', weight: 33.33, desc: 'Architecture, engineering standards, and test coverage.' },
    { key: 'innovation', title: 'Innovation', weight: 33.34, desc: 'Novelty, creativity, and real-world value.' },
  ];

  const criteriaMap = new Map();
  for (let i = 0; i < criteriaConfigs.length; i++) {
    const c = criteriaConfigs[i];
    const crit = await prisma.rubricCriterion.create({
      data: {
        id: `crit_${c.key}`,
        rubricId: rubric.id,
        title: c.title,
        description: c.desc,
        weightPercentage: c.weight,
        maxScore: 5,
        displayOrder: i + 1,
        requiredFeedback: true,
      },
    });
    criteriaMap.set(c.key, crit.id);
  }

  // 9. Seed Judges & Track Expertise
  console.log(`⚖️ Linking ${data.judges.length} judges to hackathon...`);
  const judgeEntityMap = new Map();

  for (const j of data.judges) {
    const userId = userMap.get(j.email.toLowerCase().trim());
    if (!userId) continue;

    const judge = await prisma.judge.create({
      data: {
        id: j.id,
        hackathonId: hackathon.id,
        userId,
        expertiseTracks: j.tracks,
        maxWorkload: 15,
        isActive: true,
      },
    });
    judgeEntityMap.set(j.id, judge.id);
  }

  // 10. Seed Teams and Registrations
  console.log(`🛡️ Seeding ${data.teams.length} teams and member rosters...`);
  const registeredUsers = new Set();
  const seenTeamNames = new Set();

  for (let i = 0; i < data.teams.length; i++) {
    const t = data.teams[i];
    const leaderEmail = t.members[0].toLowerCase().trim();
    const leaderId = userMap.get(leaderEmail);

    for (const m of t.members) {
      const uId = userMap.get(m.toLowerCase().trim());
      if (uId && !registeredUsers.has(uId)) {
        await prisma.registration.create({
          data: {
            hackathonId: hackathon.id,
            userId: uId,
            status: RegistrationStatus.APPROVED,
            checkedIn: true,
            checkedInAt: now,
          },
        });
        registeredUsers.add(uId);
      }
    }

    let teamName = t.name;
    if (seenTeamNames.has(teamName.toLowerCase())) {
      teamName = `${t.name} (${t.id.toUpperCase()})`;
    }
    seenTeamNames.add(teamName.toLowerCase());

    await prisma.team.create({
      data: {
        id: t.id,
        hackathonId: hackathon.id,
        name: teamName,
        inviteCode: `${t.name.toUpperCase().replace(/\W/g, '').slice(0, 4)}-${t.id.toUpperCase()}`,
        leaderId,
        highestRound: 1,
      },
    });

    for (let mIdx = 0; mIdx < t.members.length; mIdx++) {
      const uId = userMap.get(t.members[mIdx].toLowerCase().trim());
      if (uId) {
        await prisma.teamMember.create({
          data: {
            teamId: t.id,
            userId: uId,
            isLeader: mIdx === 0,
          },
        });
      }
    }
  }

  // Companion team for prj_41 (duplicate team tm_07 in fixture)
  await prisma.team.create({
    data: {
      id: 'tm_41',
      hackathonId: hackathon.id,
      name: 'Dry Harbour (Iteration 2)',
      inviteCode: 'DRY2-4141',
      leaderId: userMap.get(data.teams[6].members[0].toLowerCase().trim()),
      highestRound: 1,
    },
  });

  // 11. Seed Projects and Submissions
  console.log(`🚀 Seeding ${data.projects.length} verified projects & repositories...`);
  for (const p of data.projects) {
    const teamId = p.id === 'prj_41' ? 'tm_41' : p.team;
    const problemId = problemMap.get(p.track) || `ps_${data.tracks[0].id}`;

    const project = await prisma.project.create({
      data: {
        id: p.id,
        hackathonId: hackathon.id,
        teamId,
        trackId: p.track,
        problemId,
        title: p.title,
        slug: `${slugify(p.title)}-${p.id}`,
        tagline: p.summary,
        description: `${p.title} provides cutting-edge open-source software solutions. ${p.summary}`,
        repoUrl: p.repo_url,
        demoUrl: p.repo_url ? `${p.repo_url}/demo` : undefined,
        techStack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
        isPublished: true,
        createdAt: new Date(p.submitted_at),
      },
    });

    const leaderUser = await prisma.team.findUnique({ where: { id: teamId } });
    await prisma.submission.create({
      data: {
        projectId: project.id,
        versionNumber: 1,
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(p.submitted_at),
        createdById: leaderUser?.leaderId || admin.id,
        payloadSnapshot: {
          title: p.title,
          summary: p.summary,
          repoUrl: p.repo_url,
          track: p.track,
        },
      },
    });
  }

  // 12. Seed Scores, Assignments & Evaluations
  console.log(`📊 Seeding ${data.scores.length} judge evaluation scores...`);
  const projectScoreMap = new Map();

  for (let i = 0; i < data.scores.length; i++) {
    const s = data.scores[i];
    const judgeId = judgeEntityMap.get(s.judge);
    if (!judgeId) continue;

    const judgeRecord = await prisma.judge.findUnique({ where: { id: judgeId } });
    if (!judgeRecord) continue;

    let assignment = await prisma.judgeAssignment.findUnique({
      where: {
        judgeId_projectId: {
          judgeId: judgeRecord.id,
          projectId: s.project,
        },
      },
    });

    if (!assignment) {
      assignment = await prisma.judgeAssignment.create({
        data: {
          judgeId: judgeRecord.id,
          projectId: s.project,
          status: AssignmentStatus.COMPLETED,
          completedAt: now,
        },
      });
    }

    const fScore = s.criteria.functionality || 3;
    const qScore = s.criteria.quality || 3;
    const iScore = s.criteria.innovation || 3;
    const rawSum = fScore + qScore + iScore;
    const weightedAvg = (fScore * 33.33 + qScore * 33.33 + iScore * 33.34) / 100;

    const evalRecord = await prisma.evaluation.create({
      data: {
        id: `eval_${i + 1}`,
        assignmentId: assignment.id,
        judgeId: judgeRecord.id,
        judgeUserId: judgeRecord.userId,
        projectId: s.project,
        rubricId: rubric.id,
        status: EvaluationStatus.SUBMITTED,
        rawScoreSum: rawSum,
        weightedScore: weightedAvg,
        prosComment: s.comment,
        submittedAt: now,
      },
    });

    if (criteriaMap.has('functionality')) {
      await prisma.evaluationScore.create({
        data: {
          evaluationId: evalRecord.id,
          criterionId: criteriaMap.get('functionality'),
          rawScore: fScore,
          originalScore: fScore,
        },
      });
    }

    if (criteriaMap.has('quality')) {
      await prisma.evaluationScore.create({
        data: {
          evaluationId: evalRecord.id,
          criterionId: criteriaMap.get('quality'),
          rawScore: qScore,
          originalScore: qScore,
        },
      });
    }

    if (criteriaMap.has('innovation')) {
      await prisma.evaluationScore.create({
        data: {
          evaluationId: evalRecord.id,
          criterionId: criteriaMap.get('innovation'),
          rawScore: iScore,
          originalScore: iScore,
        },
      });
    }

    if (!projectScoreMap.has(s.project)) {
      projectScoreMap.set(s.project, []);
    }
    projectScoreMap.get(s.project).push(weightedAvg);
  }

  // 13. Calculate Ranks and Populate Results
  console.log('🏅 Computing final standings and leaderboards...');
  const projectAverages = [];

  for (const p of data.projects) {
    const scores = projectScoreMap.get(p.id) || [3.5];
    const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
    projectAverages.push({ projectId: p.id, avgScore: avg });
  }

  projectAverages.sort((a, b) => b.avgScore - a.avgScore);

  for (let rank = 1; rank <= projectAverages.length; rank++) {
    const item = projectAverages[rank - 1];
    await prisma.result.create({
      data: {
        hackathonId: hackathon.id,
        projectId: item.projectId,
        rawAverageScore: item.avgScore,
        normalizedScore: item.avgScore * 20,
        finalScore: Math.round(item.avgScore * 20 * 10) / 10,
        rank,
        isWinner: rank <= 3,
        awardCategory: rank === 1 ? 'Grand Prize Winner' : rank === 2 ? '1st Runner Up' : rank === 3 ? '2nd Runner Up' : undefined,
        isPublished: true,
        publishedAt: now,
      },
    });
  }

  console.log('✅ Seeding completed successfully!');
  console.log(`   • Hackathon: ${hackathon.title}`);
  console.log(`   • Tracks: ${data.tracks.length}`);
  console.log(`   • Judges: ${data.judges.length}`);
  console.log(`   • Teams: ${data.teams.length}`);
  console.log(`   • Projects: ${data.projects.length}`);
  console.log(`   • Evaluated Scores: ${data.scores.length}`);
}

async function main() {
  try {
    await seedDatabase();
  } catch (e) {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedDatabase };
