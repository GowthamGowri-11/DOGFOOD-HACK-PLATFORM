import prisma from '../src/lib/prisma';

async function seed() {
  const hackathon = await prisma.hackathon.findFirst();
  if (!hackathon) {
    console.log('No hackathon found');
    return;
  }

  const participant = await prisma.user.findFirst({
    where: { role: 'PARTICIPANT' },
  });
  if (!participant) {
    console.log('No participant found');
    return;
  }

  // 1. Seed Attendance Sessions
  const session1 = await prisma.attendanceSession.upsert({
    where: { sessionCode: 'APEX-DAY1' },
    update: {},
    create: {
      hackathonId: hackathon.id,
      title: 'Day 1 Opening Ceremony & Keynote Check-in',
      sessionCode: 'APEX-DAY1',
      startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      isActive: true,
    },
  });

  const session2 = await prisma.attendanceSession.upsert({
    where: { sessionCode: 'APEX-MIDWAY' },
    update: {},
    create: {
      hackathonId: hackathon.id,
      title: 'Midway Architecture Checkpoint & Mentorship Sync',
      sessionCode: 'APEX-MIDWAY',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 12),
      isActive: true,
    },
  });

  const session3 = await prisma.attendanceSession.upsert({
    where: { sessionCode: 'APEX-FINALE' },
    update: {},
    create: {
      hackathonId: hackathon.id,
      title: 'Demo Day & Final Pitch Session Check-in',
      sessionCode: 'APEX-FINALE',
      startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      isActive: true,
    },
  });

  // Record check-in for session 1
  await prisma.attendanceRecord.upsert({
    where: {
      sessionId_userId: {
        sessionId: session1.id,
        userId: participant.id,
      },
    },
    update: {},
    create: {
      sessionId: session1.id,
      userId: participant.id,
      method: 'QR_CODE',
      checkedInAt: new Date(Date.now() - 1000 * 60 * 60 * 18),
    },
  });

  // 2. Seed Certificate
  await prisma.certificate.upsert({
    where: {
      verificationCode: 'APEX-2026-8F29A1',
    },
    update: {},
    create: {
      hackathonId: hackathon.id,
      userId: participant.id,
      type: 'PARTICIPANT',
      verificationCode: 'APEX-2026-8F29A1',
      title: `Certificate of Global Finalist • ${hackathon.title}`,
      recipientName: participant.fullName,
      awardDetail: 'Autonomous AI Agents Track • Audited Submission SentinelShield',
      status: 'ISSUED',
      issuedAt: new Date(),
    },
  });

  console.log('✅ Attendance sessions and certificates seeded successfully.');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
