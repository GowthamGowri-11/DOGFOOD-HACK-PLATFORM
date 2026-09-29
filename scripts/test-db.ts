import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@ep-sample.region.aws.neon.tech/neondb?sslmode=require';

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
