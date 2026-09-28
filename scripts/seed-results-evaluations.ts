import prisma from '../src/lib/prisma';
import { ResultService } from '../src/server/services/result.service';

async function seedEvaluationsAndPrizes() {
  const hackathonId = 'hack_buildathon_2026';

  console.log('--- Seeding Rubric & Prizes for Apex Enterprise Hackathon 2026 ---');

  // 1. Ensure Prizes exist
  const prizesData = [
    {
      title: 'Grand Enterprise Champion',
      category: 'Overall 1st Place',
      amount: 20000,
      currency: 'USD',
      rankOrder: 1,
      description: 'Awarded to the most transformative, high-throughput enterprise intelligence solution.',
    },
    {
      title: 'Frontier Architecture Laureate',
      category: 'Overall 2nd Place',
      amount: 12000,
      currency: 'USD',
      rankOrder: 2,
      description: 'Excellence in distributed cloud infrastructure, fault-tolerant design, and agent coordination.',
    },
    {
      title: 'Operational Excellence Award',
      category: 'Overall 3rd Place',
      amount: 8000,
      currency: 'USD',
      rankOrder: 3,
      description: 'Outstanding zero-trust security compliance and mission-critical enterprise workflows.',
    },
  ];

  // Remove existing prizes if any and recreate
  await prisma.prize.deleteMany({ where: { hackathonId } });
  for (const p of prizesData) {
    await prisma.prize.create({
      data: {
        hackathonId,
        ...p,
      },
    });
  }
  console.log('Prizes created: 3 tiers');

  // 2. Ensure Rubric and Criteria exist
  let rubric = await prisma.rubric.findFirst({
    where: { hackathonId, isCurrent: true },
    include: { criteria: true },
  });

  if (!rubric) {
    rubric = await prisma.rubric.create({
      data: {
        hackathonId,
        name: 'Enterprise Evaluation Rubric 2026',
        version: 1,
        isCurrent: true,
      },
      include: { criteria: true },
    });
  }

  if (rubric.criteria.length === 0) {
    await prisma.rubricCriterion.createMany({
      data: [
        {
          rubricId: rubric.id,
          title: 'Technical Architecture & Scalability',
          description: 'High-throughput concurrency, microservice decoupling, and distributed resilience.',
          weightPercentage: 35,
          maxScore: 100,
          displayOrder: 1,
        },
        {
          rubricId: rubric.id,
          title: 'Frontier AI & Autonomous Intelligence',
          description: 'Reasoning depth, multi-agent coordination, and contextual adaptability.',
          weightPercentage: 35,
          maxScore: 100,
          displayOrder: 2,
        },
        {
          rubricId: rubric.id,
          title: 'Security, Compliance & Business Impact',
          description: 'Zero-trust integration, auditability, and measurable enterprise value.',
          weightPercentage: 30,
          maxScore: 100,
          displayOrder: 3,
        },
      ],
    });
  }

  // 3. Ensure all 6 projects have a locked SUBMITTED snapshot
  const projects = await prisma.project.findMany({
    where: { hackathonId },
    include: { team: true },
  });

  for (const p of projects) {
    const existingSub = await prisma.submission.findFirst({
      where: { projectId: p.id },
    });
    if (!existingSub) {
      await prisma.submission.create({
        data: {
          projectId: p.id,
          versionNumber: 1,
          status: 'SUBMITTED',
          submittedAt: new Date('2026-08-19T17:00:00Z'),
          lockedAt: new Date('2026-08-19T17:00:00Z'),
          createdById: p.team.leaderId,
          payloadSnapshot: {
            title: p.title,
            tagline: p.tagline,
            repoUrl: p.repoUrl || 'https://github.com/apex-enterprise/solution',
          },
        },
      });
    } else {
      await prisma.submission.update({
        where: { id: existingSub.id },
        data: {
          status: 'SUBMITTED',
          lockedAt: new Date('2026-08-19T17:00:00Z'),
        },
      });
    }
  }
  console.log(`Verified ${projects.length} project submissions as SUBMITTED`);

  // 4. Fetch judges
  const judges = await prisma.judge.findMany({
    where: { hackathonId, isActive: true },
    include: { user: true },
  });

  if (judges.length === 0) {
    console.log('No judges found! Please seed judges first.');
    return;
  }

  console.log(`Found ${judges.length} judges for evaluation seeding`);

  // 5. Ensure Judge Assignments and Completed Evaluations for every project
  // Let each project receive evaluations from 2 or more judges
  const scoreMatrix: Record<string, number[]> = {
    // Project index -> base scores per judge to create a clear, realistic podium
    0: [95, 96, 94], // AuraGraph (Gold)
    1: [91, 89, 93], // SynapseGuard (Silver)
    2: [88, 87, 89], // SentinelCloud (Bronze)
    3: [84, 85, 83], // FlowMesh (Rank 4)
    4: [80, 82, 79], // VanguardVault (Rank 5)
    5: [78, 77, 81], // PolarisVision (Rank 6)
  };

  for (let pIdx = 0; pIdx < projects.length; pIdx++) {
    const project = projects[pIdx];
    const scores = scoreMatrix[pIdx] || [80, 80, 80];

    // Assign at least 2 judges to this project
    for (let jIdx = 0; jIdx < Math.min(judges.length, 3); jIdx++) {
      const judge = judges[jIdx];
      const baseScore = scores[jIdx] || 82;

      // Ensure assignment
      let assignment = await prisma.judgeAssignment.findUnique({
        where: {
          judgeId_projectId: {
            judgeId: judge.id,
            projectId: project.id,
          },
        },
      });

      if (!assignment) {
        assignment = await prisma.judgeAssignment.create({
          data: {
            judgeId: judge.id,
            projectId: project.id,
            status: 'COMPLETED',
          },
        });
      } else {
        await prisma.judgeAssignment.update({
          where: { id: assignment.id },
          data: { status: 'COMPLETED' },
        });
      }

      // Upsert completed evaluation
      await prisma.evaluation.upsert({
        where: {
          judgeId_projectId: {
            judgeId: judge.id,
            projectId: project.id,
          },
        },
        update: {
          assignmentId: assignment.id,
          rubricId: rubric.id,
          judgeUserId: judge.userId,
          status: 'SUBMITTED',
          rawScoreSum: baseScore,
          weightedScore: baseScore,
          prosComment: 'Outstanding enterprise architectural execution, zero-trust patterns strictly adhered to.',
          consComment: 'Minor optimization potential in long-running batch agent reconciliation.',
          suggestions: 'Consider incorporating Redis cache warmers for latency mitigation.',
          submittedAt: new Date('2026-08-20T12:00:00Z'),
        },
        create: {
          assignmentId: assignment.id,
          judgeId: judge.id,
          judgeUserId: judge.userId,
          projectId: project.id,
          rubricId: rubric.id,
          status: 'SUBMITTED',
          rawScoreSum: baseScore,
          weightedScore: baseScore,
          prosComment: 'Outstanding enterprise architectural execution, zero-trust patterns strictly adhered to.',
          consComment: 'Minor optimization potential in long-running batch agent reconciliation.',
          suggestions: 'Consider incorporating Redis cache warmers for latency mitigation.',
          submittedAt: new Date('2026-08-20T12:00:00Z'),
        },
      });
    }
  }

  console.log('Evaluations successfully created for all submitted projects.');

  // 6. Test Result Generation using ResultService
  console.log('Running ResultService.generateResults...');
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const adminId = admin?.id || 'usr_admin_001';

  const genResult = await ResultService.generateResults(hackathonId, adminId, {
    method: 'Z_SCORE',
    forceRegenerate: true,
  });

  console.log('Results Generated Successfully:');
  console.log(`Normalization ID: ${genResult.normalizationId}, Version: ${genResult.version}`);
  console.log(`Ranked Count: ${genResult.results.length}`);
  genResult.results.forEach((r) => {
    console.log(`Rank #${r.rank} | Project ${r.projectId} | FinalScore: ${r.finalScore} | Award: ${r.awardCategory || 'None'}`);
  });

  // 7. Verify Results
  const report = await ResultService.verifyResults(hackathonId);
  console.log('Verification Report:', report);
}

seedEvaluationsAndPrizes()
  .then(() => {
    console.log('SUCCESS');
    process.exit(0);
  })
  .catch((e) => {
    console.error('ERROR:', e);
    process.exit(1);
  });
