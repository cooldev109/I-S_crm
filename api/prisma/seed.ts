/**
 * Seed script — creates a first admin user so you can log in after a fresh setup.
 * Run with: npm run db:seed --workspace api
 */
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@studio.local';
  const password = 'admin1234'; // change immediately after first login
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: 'Studio Admin', role: UserRole.ADMIN },
  });

  console.log(`Seeded admin user: ${user.email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
