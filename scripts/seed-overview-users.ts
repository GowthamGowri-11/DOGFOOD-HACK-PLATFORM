import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function seedOverviewUsers() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const sampleUsers = [
    {
      fullName: 'Kiruthik Kumar S',
      email: 'kiruthiksrini1312@gmail.com',
      role: 'PARTICIPANT' as const,
      avatarUrl: '😊',
      bio: 'Department of Computer Science',
      isActive: true,
    },
    {
      fullName: 'Priya Bharathi Koppisetti',
      email: 'priyabharathikoppisetti@gmail.com',
      role: 'PARTICIPANT' as const,
      avatarUrl: null,
      bio: 'Information Technology',
      isActive: true,
    },
    {
      fullName: 'Rithika Ravikumar',
      email: '24ucb141rithika@kgkite.ac.in',
      role: 'PARTICIPANT' as const,
      avatarUrl: null,
      bio: 'Computer Science and Business Systems',
      isActive: true,
    },
    {
      fullName: 'Amirtha Varshini M',
      email: 'amirthavarshini@gmail.com',
      role: 'PARTICIPANT' as const,
      avatarUrl: null,
      bio: 'Artificial Intelligence & Data Science',
      isActive: true,
    },
  ];

  for (const u of sampleUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        role: u.role,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        isActive: u.isActive,
      },
      create: {
        email: u.email,
        fullName: u.fullName,
        passwordHash,
        role: u.role,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        isActive: u.isActive,
        emailVerified: true,
      },
    });
  }

  console.log('✅ Seeded overview users into PostgreSQL!');
}

seedOverviewUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
