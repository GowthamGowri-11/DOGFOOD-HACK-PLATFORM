import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function seedEnterpriseTeams() {
  const organizer = await prisma.user.findFirst({ where: { role: 'ORGANIZER' } });
  const orgId = organizer?.id || (await prisma.user.findFirst())?.id || 'usr_organizer_001';

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // Upsert/Update the Hackathon to "Apex Enterprise Hackathon 2026" (No "buildathon" wording!)
  const hackathon = await prisma.hackathon.upsert({
    where: { id: 'hack_buildathon_2026' },
    update: {
      title: 'Apex Enterprise Hackathon 2026',
      slug: 'apex-enterprise-hackathon-2026',
      tagline: 'Scale Frontier Intelligence & Autonomous Cloud Systems',
      description: 'The premier enterprise innovation competition where top engineering teams build cutting-edge intelligence systems.',
      status: 'EVENT_ACTIVE',
      minTeamSize: 2,
      maxTeamSize: 4,
    },
    create: {
      id: 'hack_buildathon_2026',
      title: 'Apex Enterprise Hackathon 2026',
      slug: 'apex-enterprise-hackathon-2026',
      tagline: 'Scale Frontier Intelligence & Autonomous Cloud Systems',
      description: 'The premier enterprise innovation competition where top engineering teams build cutting-edge intelligence systems.',
      organizationName: 'Apex Enterprise Arena',
      organizerId: orgId,
      status: 'EVENT_ACTIVE',
      minTeamSize: 2,
      maxTeamSize: 4,
      regStartTime: new Date('2026-08-01T00:00:00Z'),
      regEndTime: new Date('2026-08-16T06:00:00Z'),
      eventStartTime: new Date('2026-08-16T10:00:00Z'),
      eventEndTime: new Date('2026-08-20T18:00:00Z'),
      subStartTime: new Date('2026-08-16T10:00:00Z'),
      subEndTime: new Date('2026-08-19T18:00:00Z'),
      judgingStartTime: new Date('2026-08-19T18:00:00Z'),
      judgingEndTime: new Date('2026-08-20T18:00:00Z'),
    },
  });

  console.log('Hackathon updated to:', hackathon.title);

  // Ensure default track and problem statement
  const track = await prisma.track.upsert({
    where: { hackathonId_slug: { hackathonId: hackathon.id, slug: 'ai-enterprise' } },
    update: { title: 'Enterprise AI & Autonomous Systems' },
    create: {
      hackathonId: hackathon.id,
      title: 'Enterprise AI & Autonomous Systems',
      slug: 'ai-enterprise',
      colorHex: '#2563EB',
    },
  });

  const problem = await prisma.problemStatement.upsert({
    where: { hackathonId_code: { hackathonId: hackathon.id, code: 'ENT-01' } },
    update: { title: 'High-Throughput Autonomous AI Agent Architectures' },
    create: {
      hackathonId: hackathon.id,
      trackId: track.id,
      code: 'ENT-01',
      title: 'High-Throughput Autonomous AI Agent Architectures',
      description: 'Design and deploy scalable autonomous agent frameworks for mission-critical enterprise workflows.',
    },
  });

  // Helper to ensure user exists
  async function ensureUser(fullName: string, email: string) {
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      if (existing.fullName !== fullName) {
        return prisma.user.update({
          where: { id: existing.id },
          data: { fullName },
        });
      }
      return existing;
    }
    return prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash: defaultPasswordHash,
        role: 'PARTICIPANT',
        isActive: true,
      },
    });
  }

  // Clear previous teams for this hackathon so we replace them cleanly
  await prisma.teamMember.deleteMany({
    where: { team: { hackathonId: hackathon.id } },
  });
  await prisma.project.deleteMany({
    where: { hackathonId: hackathon.id },
  });
  await prisma.team.deleteMany({
    where: { hackathonId: hackathon.id },
  });
  console.log('Cleaned old teams for hackathon.');

  // Modern, high-caliber enterprise teams
  const newTeamsData = [
    {
      name: 'Aura Systems',
      leader: { name: 'Sarah Jenkins', email: 'sarah.jenkins@enterprise-ai.io' },
      members: [
        { name: 'David Park', email: 'david.park@enterprise-ai.io' },
        { name: 'Priya Patel', email: 'priya.patel@enterprise-ai.io' },
        { name: 'Marcus Chen', email: 'marcus.chen@enterprise-ai.io' },
      ],
      createdAt: new Date('2026-08-11T10:30:00Z'),
      code: 'INV-AURA-9021',
      projectTitle: 'AuraGraph: Enterprise High-Throughput RAG Architecture',
    },
    {
      name: 'Synapse Labs',
      leader: { name: 'Alex Rivera', email: 'alex.rivera@synapselabs.tech' },
      members: [
        { name: 'Elena Rostova', email: 'elena.rostova@synapselabs.tech' },
        { name: 'Kenji Sato', email: 'kenji.sato@synapselabs.tech' },
      ],
      createdAt: new Date('2026-08-12T14:15:00Z'),
      code: 'INV-SYNP-4421',
      projectTitle: 'SynapseGuard: Autonomous Zero-Trust Agent Swarm',
    },
    {
      name: 'Apex Sentinel',
      leader: { name: 'Liam Montgomery', email: 'liam.m@sentinel-defense.org' },
      members: [
        { name: 'Chloe Zhao', email: 'chloe.zhao@sentinel-defense.org' },
        { name: 'Jordan Taylor', email: 'jordan.t@sentinel-defense.org' },
        { name: 'Maya Lin', email: 'maya.lin@sentinel-defense.org' },
      ],
      createdAt: new Date('2026-08-13T09:20:00Z'),
      code: 'INV-SENT-8812',
      projectTitle: 'SentinelCloud: Kubernetes Security Anomaly Engine',
    },
    {
      name: 'Cognitive Flow',
      leader: { name: 'Nathan Wright', email: 'nathan.wright@cogflow.ai' },
      members: [
        { name: 'Sofia Rossi', email: 'sofia.rossi@cogflow.ai' },
        { name: 'Carlos Gomez', email: 'carlos.gomez@cogflow.ai' },
      ],
      createdAt: new Date('2026-08-13T16:45:00Z'),
      code: 'INV-COGN-3319',
      projectTitle: 'FlowMesh: Distributed Agent Task Coordination Framework',
    },
    {
      name: 'Vanguard Core',
      leader: { name: 'Benjamin Hayes', email: 'ben.hayes@vanguard-sec.io' },
      members: [
        { name: 'Amara Okafor', email: 'amara.okafor@vanguard-sec.io' },
      ],
      createdAt: new Date('2026-08-14T11:10:00Z'),
      code: 'INV-VANG-7740',
      projectTitle: 'VanguardVault: Real-time Cryptographic Audit Engine',
    },
    {
      name: 'Polaris Intelligence',
      leader: { name: 'Zoe Katsaros', email: 'zoe.k@polaris-ml.dev' },
      members: [
        { name: 'Noah Williams', email: 'noah.w@polaris-ml.dev' },
        { name: 'Lucas Silva', email: 'lucas.silva@polaris-ml.dev' },
      ],
      createdAt: new Date('2026-08-15T08:30:00Z'),
      code: 'INV-POLA-5591',
      projectTitle: 'PolarisVision: Multimodal Diagnostic Assistant',
    },
    {
      name: 'Nova Protocol',
      leader: { name: 'Daniel Kim', email: 'daniel.kim@novaprotocol.net' },
      members: [], // 1 member -> PENDING
      createdAt: new Date('2026-08-15T19:40:00Z'),
      code: 'INV-NOVA-1102',
    },
    {
      name: 'DeepMatrix',
      leader: { name: 'Rachel Green', email: 'rachel.green@deepmatrix.ai' },
      members: [], // 1 member -> PENDING
      createdAt: new Date('2026-08-16T04:15:00Z'),
      code: 'INV-DMAT-2294',
    },
  ];

  for (const t of newTeamsData) {
    const leaderUser = await ensureUser(t.leader.name, t.leader.email);

    const team = await prisma.team.create({
      data: {
        hackathonId: hackathon.id,
        name: t.name,
        inviteCode: t.code,
        leaderId: leaderUser.id,
        createdAt: t.createdAt,
        updatedAt: t.createdAt,
      },
    });

    // Add leader
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: leaderUser.id,
        isLeader: true,
        joinedAt: t.createdAt,
      },
    });

    // Add other members
    for (const m of t.members) {
      const memberUser = await ensureUser(m.name, m.email);
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: memberUser.id,
          isLeader: false,
          joinedAt: t.createdAt,
        },
      });
    }

    // Optionally create project if specified
    if ((t as any).projectTitle) {
      const slug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-project';
      await prisma.project.create({
        data: {
          hackathonId: hackathon.id,
          teamId: team.id,
          trackId: track.id,
          problemId: problem.id,
          title: (t as any).projectTitle,
          slug,
          tagline: `Enterprise solution built by ${t.name}`,
          description: `Enterprise-grade production architecture delivering high-throughput resilience and automated intelligence.`,
          repoUrl: `https://github.com/apex-arena/${slug}`,
          demoUrl: `https://${slug}.apex-arena.dev`,
          techStack: ['TypeScript', 'Next.js', 'PyTorch', 'Docker'],
          isPublished: true,
        },
      });
    }
  }

  console.log('✅ Successfully seeded new enterprise teams without buildathon reference!');
}

seedEnterpriseTeams()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
