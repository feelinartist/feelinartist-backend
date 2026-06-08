import { PrismaClient } from '@prisma/client';
// import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const databaseUrl = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL || (process.env.NODE_ENV === 'test'
    ? 'mysql://test:test@127.0.0.1:3306/test'
    : undefined);

if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL environment variable for Prisma.');
}

const prisma = new PrismaClient();

export default prisma;
