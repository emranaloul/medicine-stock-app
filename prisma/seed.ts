import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { INITIAL_MEDICINES } from '../src/lib/seed-data';
import path from 'node:path';

const localDatabaseUrl = `file:${path.resolve(__dirname, 'dev.db').replaceAll('\\', '/')}`;
const url = process.env.TURSO_DATABASE_URL || localDatabaseUrl;
const authToken = process.env.TURSO_AUTH_TOKEN;

const adapter = new PrismaLibSQL({ url, authToken });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding household medicine stock...');
  const count = await prisma.medicine.count();
  if (count > 0) {
    console.log(
      `Database already has ${count} items. Clearing before re-seed...`,
    );
    await prisma.medicine.deleteMany();
  }

  for (const item of INITIAL_MEDICINES) {
    await prisma.medicine.create({
      data: item,
    });
  }

  console.log(
    `Successfully seeded ${INITIAL_MEDICINES.length} medicine items!`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
