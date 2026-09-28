import { PrismaClient } from '@prisma/client';

// Neon IPv4 IP from DNS lookup: 52.76.246.190 or 52.76.212.156 or 3.0.27.201
const connectionString = 'postgresql://neondb_owner:npg_fdvzlRBN2CD8@52.76.246.190:5432/neondb?sslmode=require';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});

async function main() {
  console.log('Testing direct IPv4 Prisma connection...');
  const count = await prisma.user.count();
  console.log('Prisma IPv4 success! User count:', count);
}

main()
  .catch((err) => {
    console.error('Prisma IPv4 test failed:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
