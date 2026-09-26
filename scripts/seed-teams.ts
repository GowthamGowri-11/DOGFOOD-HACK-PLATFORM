import prisma from '../src/lib/prisma';

async function seedBuildathonTeams() {
  const organizer = await prisma.user.findFirst({ where: { role: 'ORGANIZER' } });
  const orgId = organizer?.id || (await prisma.user.findFirst())?.id || 'usr_organizer_001';

  const hackathon = await prisma.hackathon.upsert({
    where: { id: 'hack_buildathon_2026' },
    update: {
      title: 'BUILDATHON 2026',
      slug: 'buildathon-2026',
      tagline: 'Build the Future with AI',
      status: 'EVENT_ACTIVE',
      minTeamSize: 2,
      maxTeamSize: 4,
    },
    create: {
      id: 'hack_buildathon_2026',
      title: 'BUILDATHON 2026',
      slug: 'buildathon-2026',
      tagline: 'Build the Future with AI',
      description: 'The premier enterprise buildathon where innovative student engineering meets frontier intelligence.',
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
  console.log('Hackathon ready:', hackathon.title);

  async function ensureUser(fullName: string, email: string) {
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return existing;
    return prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash: 'dummy_hash_for_seed',
        role: 'PARTICIPANT',
        isActive: true,
      },
    });
  }

  const teamsData = [
    {
      name: 'INFINITE VOID',
      leader: { name: 'ELAYANITHISH D', email: 'elayanithish.d@hackathon.dev' },
      members: [
        { name: 'Sri CS', email: 'sri.cs@hackathon.dev' },
        { name: 'V Dharika', email: 'v.dharika@hackathon.dev' },
        { name: 'Divyadharshini D', email: 'divyadharshini.d@hackathon.dev' },
      ],
      createdAt: new Date('2026-08-11T15:32:00Z'),
      code: 'INV-VOID-9921',
    },
    {
      name: 'HOGWARTS',
      leader: { name: 'MANNAM GANESHBABU', email: 'mannam.ganeshbabu@hackathon.dev' },
      members: [
        { name: 'Vijesh', email: 'vijesh@hackathon.dev' },
        { name: 'M. DINESH MADHAVAN', email: 'dinesh.madhavan@hackathon.dev' },
      ],
      createdAt: new Date('2026-08-14T15:21:00Z'),
      code: 'INV-HOGW-4412',
    },
    {
      name: 'BINARY BRAINS',
      leader: { name: '59 - VASANTHA KUMARAN D', email: 'vasantha.kumaran@hackathon.dev' },
      members: [
        { name: '036-SAKTHIVEL', email: 'sakthivel@hackathon.dev' },
        { name: 'MUKESH R', email: 'mukesh.r@hackathon.dev' },
        { name: 'Mohamed Thoufeeq', email: 'mohamed.thoufeeq@hackathon.dev' },
      ],
      createdAt: new Date('2026-08-12T14:29:00Z'),
      code: 'INV-BINB-7718',
    },
    {
      name: 'RETROSPEC AI',
      leader: { name: 'ASWIN N', email: 'aswin.n@hackathon.dev' },
      members: [
        { name: 'Sanjay D', email: 'sanjay.d@hackathon.dev' },
        { name: 'MELVIN JESSAN', email: 'melvin.jessan@hackathon.dev' },
        { name: 'R.S HARIHARAN', email: 'rs.hariharan@hackathon.dev' },
      ],
      createdAt: new Date('2026-08-14T09:47:00Z'),
      code: 'INV-RETR-2201',
    },
    {
      name: 'TEAM EPSILON',
      leader: { name: 'NITHEESH V S', email: 'nitheesh.vs@hackathon.dev' },
      members: [
        { name: 'Saravana kumar', email: 'saravana.kumar@hackathon.dev' },
      ],
      createdAt: new Date('2026-08-15T22:27:00Z'),
      code: 'INV-EPSI-6643',
    },
    {
      name: 'CYBER NEXUS',
      leader: { name: 'KAVIN PRASATH S', email: 'kavin.prasath@hackathon.dev' },
      members: [
        { name: 'ROHIT K', email: 'rohit.k@hackathon.dev' },
        { name: 'SURENDHAR P', email: 'surendhar.p@hackathon.dev' },
      ],
      createdAt: new Date('2026-08-15T18:14:00Z'),
      code: 'INV-NEXU-8821',
    },
    {
      name: 'NEURAL CATALYSTS',
      leader: { name: 'DHARANI S', email: 'dharani.s@hackathon.dev' },
      members: [], // Only 1 member -> PENDING
      createdAt: new Date('2026-08-16T04:10:00Z'),
      code: 'INV-NEUR-1109',
    },
    {
      name: 'QUANTUM PULSE',
      leader: { name: 'AARAV SHARMA', email: 'aarav.sharma@hackathon.dev' },
      members: [], // Only 1 member -> PENDING
      createdAt: new Date('2026-08-16T05:45:00Z'),
      code: 'INV-QPUL-3390',
    },
  ];

  for (const t of teamsData) {
    const leaderUser = await ensureUser(t.leader.name, t.leader.email);
    let team = await prisma.team.findFirst({
      where: { hackathonId: hackathon.id, name: t.name },
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          hackathonId: hackathon.id,
          name: t.name,
          inviteCode: t.code,
          leaderId: leaderUser.id,
          createdAt: t.createdAt,
          updatedAt: t.createdAt,
        },
      });
    }

    const existingLeaderMem = await prisma.teamMember.findFirst({
      where: { teamId: team.id, userId: leaderUser.id },
    });
    if (!existingLeaderMem) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: leaderUser.id,
          isLeader: true,
          joinedAt: t.createdAt,
        },
      });
    }

    for (const m of t.members) {
      const memberUser = await ensureUser(m.name, m.email);
      const existingMem = await prisma.teamMember.findFirst({
        where: { teamId: team.id, userId: memberUser.id },
      });
      if (!existingMem) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: memberUser.id,
            isLeader: false,
            joinedAt: t.createdAt,
          },
        });
      }
    }
  }

  console.log('Seeded teams successfully!');
}

seedBuildathonTeams()
  .catch(console.error)
  .finally(() => process.exit(0));
