import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Prisma database initializer', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalTestDatabaseUrl = process.env.TEST_DATABASE_URL;

  afterEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = originalNodeEnv;
    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.TEST_DATABASE_URL = originalTestDatabaseUrl;
  });

  it('uses DATABASE_URL when provided', async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'mysql://user:pass@127.0.0.1:3306/db';
    delete process.env.TEST_DATABASE_URL;

    const prismaModule = await import('./prisma');

    expect(prismaModule.default).toBeDefined();
  });

  it('falls back to TEST_DATABASE_URL when DATABASE_URL is missing', async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = '';
    process.env.TEST_DATABASE_URL = 'mysql://user:pass@127.0.0.1:3306/test';

    const prismaModule = await import('./prisma');

    expect(prismaModule.default).toBeDefined();
  });

  it('uses test environment fallback when no URL is configured', async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = '';
    process.env.TEST_DATABASE_URL = '';

    const prismaModule = await import('./prisma');

    expect(prismaModule.default).toBeDefined();
  });

  it('throws when no database URL is available outside test environment', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DATABASE_URL;
    delete process.env.TEST_DATABASE_URL;

    await expect(import('./prisma')).rejects.toThrow('Missing DATABASE_URL');
  });
});
