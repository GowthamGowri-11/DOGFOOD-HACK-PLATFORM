import { PrismaClient, RoleType, EventStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface FixtureUser {
  id: string;
  email: string;
  fullName: string;
  role: RoleType;
}

interface FixtureProblemStatement {
  id: string;
  code: string;
  title: string;
  description: string;
}

interface FixtureTrack {
  id: string;
  title: string;
  slug: string;
  colorHex: string;
  problemStatements: FixtureProblemStatement[];
}

interface FixturePrize {
  title: string;
  amount: number;
  currency: string;
  rankOrder: number;
}

interface FixtureHackathon {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  organizationName: string;
  status: EventStatus;
  minTeamSize: number;
  maxTeamSize: number;
  tracks: FixtureTrack[];
  prizes: FixturePrize[];
}

interface FixtureProject {
  id: string;
  hackathonId: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  repoUrl: string;
  demoUrl?: string;
  techStack: string[];
  isPublished: boolean;
  trackId: string;
  problemId: string;
}

interface FixturesData {
  users: FixtureUser[];
  hackathons: FixtureHackathon[];
  projects: FixtureProject[];
}

async function main() {
  console.log('🌱 Starting database seeding with dogfood fixtures...');

  const fixturesPath = path.join(__dirname, '../fixtures.json');
  const rawData = fs.readFileSync(fixturesPath, 'utf-8');
  const fixtures: FixturesData = JSON.parse(rawData);

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Users
  const userMap = new Map<string, string>();
  for (const u of fixtures.users) {
    const user = await prisma.user.upsert({
      where: { email: u.email.toLowerCase().trim() },
      update: {
        fullName: u.fullName,
        role: u.role,
        isActive: true,
      },
      create: {
        id: u.id,
        email: u.email.toLowerCase().trim(),
        passwordHash: defaultPasswordHash,
        fullName: u.fullName,
        role: u.role,
        isActive: true,
      },
    });
    userMap.set(u.id, user.id);
    console.log(`  ✓ User: ${user.fullName} [${user.role}]`);
  }

  // 2. Seed Hackathons, Tracks, Problem Statements & Prizes
  const organizerId = userMap.get('usr_organizer_001')!;
  for (const h of fixtures.hackathons) {
    const now = new Date();
    const hackathon = await prisma.hackathon.upsert({
      where: { slug: h.slug },
      update: {
        title: h.title,
        tagline: h.tagline,
        description: h.description,
        status: h.status,
      },
      create: {
        id: h.id,
        slug: h.slug,
        title: h.title,
        tagline: h.tagline,
        description: h.description,
        organizationName: h.organizationName,
        organizerId,
        status: h.status,
        minTeamSize: h.minTeamSize,
        maxTeamSize: h.maxTeamSize,
        regStartTime: new Date(now.getTime() - 86400000 * 7),
        regEndTime: new Date(now.getTime() - 86400000 * 2),
        eventStartTime: new Date(now.getTime() - 86400000 * 2),
        eventEndTime: new Date(now.getTime() + 86400000 * 5),
        subStartTime: new Date(now.getTime() - 86400000 * 2),
        subEndTime: new Date(now.getTime() + 86400000 * 2),
        judgingStartTime: new Date(now.getTime() + 86400000 * 2),
        judgingEndTime: new Date(now.getTime() + 86400000 * 4),
      },
    });
    console.log(`  ✓ Hackathon: ${hackathon.title}`);

    // Create Default Rubric
    const rubric = await prisma.rubric.upsert({
      where: { id: `rubric_${hackathon.id}` },
      update: {},
      create: {
        id: `rubric_${hackathon.id}`,
        hackathonId: hackathon.id,
        name: 'Enterprise Evaluation Rubric',
        version: 1,
        isCurrent: true,
      },
    });

    const criteriaConfig = [
      { title: 'Technical Architecture & Execution', weightPercentage: 35, maxScore: 100 },
      { title: 'Innovation & Problem Solving', weightPercentage: 30, maxScore: 100 },
      { title: 'UI/UX & Accessibility', weightPercentage: 20, maxScore: 100 },
      { title: 'Documentation & Presentation', weightPercentage: 15, maxScore: 100 },
    ];

    for (let i = 0; i < criteriaConfig.length; i++) {
      const c = criteriaConfig[i];
      await prisma.rubricCriterion.upsert({
        where: { id: `crit_${hackathon.id}_${i + 1}` },
        update: {
          title: c.title,
          weightPercentage: c.weightPercentage,
          maxScore: c.maxScore,
        },
        create: {
          id: `crit_${hackathon.id}_${i + 1}`,
          rubricId: rubric.id,
          title: c.title,
          description: `Assessment of ${c.title}`,
          weightPercentage: c.weightPercentage,
          maxScore: c.maxScore,
          displayOrder: i + 1,
        },
      });
    }

    // Tracks & Problem Statements
    for (const t of h.tracks) {
      const track = await prisma.track.upsert({
        where: { hackathonId_slug: { hackathonId: hackathon.id, slug: t.slug } },
        update: { title: t.title, colorHex: t.colorHex },
        create: {
          id: t.id,
          hackathonId: hackathon.id,
          title: t.title,
          slug: t.slug,
          colorHex: t.colorHex,
        },
      });

      for (const ps of t.problemStatements) {
        await prisma.problemStatement.upsert({
          where: { hackathonId_code: { hackathonId: hackathon.id, code: ps.code } },
          update: { title: ps.title, description: ps.description },
          create: {
            id: ps.id,
            hackathonId: hackathon.id,
            trackId: track.id,
            code: ps.code,
            title: ps.title,
            description: ps.description,
          },
        });
      }
    }

    // Cleanly upsert prizes idempotently
    for (let i = 0; i < h.prizes.length; i++) {
      const p = h.prizes[i];
      const prizeId = `prize_${hackathon.id}_${p.rankOrder}`;
      await prisma.prize.upsert({
        where: { id: prizeId },
        update: {
          title: p.title,
          amount: p.amount,
          currency: p.currency,
          rankOrder: p.rankOrder,
        },
        create: {
          id: prizeId,
          hackathonId: hackathon.id,
          title: p.title,
          amount: p.amount,
          currency: p.currency,
          rankOrder: p.rankOrder,
        },
      });
    }
  }

  // 3. Seed Teams & Projects
  const participantId = userMap.get('usr_participant_001')!;
  for (const p of fixtures.projects) {
    const teamId = `team_${p.id}`;
    const team = await prisma.team.upsert({
      where: { id: teamId },
      update: { name: `Team ${p.title.split(':')[0]}` },
      create: {
        id: teamId,
        hackathonId: p.hackathonId,
        name: `Team ${p.title.split(':')[0]}`,
        inviteCode: `INV-${p.id.toUpperCase()}`,
        leaderId: participantId,
      },
    });

    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId: participantId } },
      update: {},
      create: {
        teamId: team.id,
        userId: participantId,
        isLeader: true,
      },
    });

    await prisma.project.upsert({
      where: { id: p.id },
      update: {
        title: p.title,
        tagline: p.tagline,
        description: p.description,
        repoUrl: p.repoUrl,
        demoUrl: p.demoUrl,
        techStack: p.techStack,
        isPublished: p.isPublished,
      },
      create: {
        id: p.id,
        hackathonId: p.hackathonId,
        teamId: team.id,
        trackId: p.trackId,
        problemId: p.problemId,
        title: p.title,
        slug: p.slug,
        tagline: p.tagline,
        description: p.description,
        repoUrl: p.repoUrl,
        demoUrl: p.demoUrl,
        techStack: p.techStack,
        isPublished: p.isPublished,
      },
    });
    console.log(`  ✓ Project: ${p.title}`);
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
