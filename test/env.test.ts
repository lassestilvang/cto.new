import { z } from 'zod';
describe('env', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('env object', () => {
    it('should return default values when environment variables are not set', () => {
      delete process.env.DATABASE_URL;
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.NEXTAUTH_URL;
      delete process.env.UPSTASH_REDIS_URL;
      delete process.env.UPSTASH_REDIS_TOKEN;
      delete process.env.USE_DEMO_DATA;

      const { env } = require('../lib/env');

      expect(env.DATABASE_URL).toBe('');
      expect(env.NEXTAUTH_SECRET).toBe('dev-secret');
      expect(env.NEXTAUTH_URL).toBe('http://localhost:3000');
      expect(env.UPSTASH_REDIS_URL).toBe('');
      expect(env.UPSTASH_REDIS_TOKEN).toBe('');
      expect(env.USE_DEMO_DATA).toBe(true);
    });

    it('should return environment variable values when set', () => {
      process.env.DATABASE_URL = 'test-db-url';
      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'https://example.com';
      process.env.UPSTASH_REDIS_URL = 'test-redis-url';
      process.env.UPSTASH_REDIS_TOKEN = 'test-redis-token';
      process.env.USE_DEMO_DATA = 'false';

      const { env } = require('../lib/env');

      expect(env.DATABASE_URL).toBe('test-db-url');
      expect(env.NEXTAUTH_SECRET).toBe('test-secret');
      expect(env.NEXTAUTH_URL).toBe('https://example.com');
      expect(env.UPSTASH_REDIS_URL).toBe('test-redis-url');
      expect(env.UPSTASH_REDIS_TOKEN).toBe('test-redis-token');
      expect(env.USE_DEMO_DATA).toBe(false);
    });

    it('should handle partial environment variables', () => {
      process.env.DATABASE_URL = 'partial-db-url';
      delete process.env.NEXTAUTH_SECRET;
      process.env.NEXTAUTH_URL = 'https://partial.com';
      delete process.env.UPSTASH_REDIS_URL;
      delete process.env.UPSTASH_REDIS_TOKEN;
      delete process.env.USE_DEMO_DATA;

      const { env } = require('../lib/env');

      expect(env.DATABASE_URL).toBe('partial-db-url');
      expect(env.NEXTAUTH_SECRET).toBe('dev-secret');
      expect(env.NEXTAUTH_URL).toBe('https://partial.com');
      expect(env.UPSTASH_REDIS_URL).toBe('');
      expect(env.UPSTASH_REDIS_TOKEN).toBe('');
      expect(env.USE_DEMO_DATA).toBe(true);
    });

    it('should use fallback values when NEXTAUTH_SECRET and NEXTAUTH_URL are set to empty strings', () => {
      delete process.env.DATABASE_URL;
      process.env.NEXTAUTH_SECRET = '';
      process.env.NEXTAUTH_URL = '';
      delete process.env.UPSTASH_REDIS_URL;
      delete process.env.UPSTASH_REDIS_TOKEN;
      delete process.env.USE_DEMO_DATA;

      const { env } = require('../lib/env');

      expect(env.DATABASE_URL).toBe('');
      expect(env.NEXTAUTH_SECRET).toBe('dev-secret');
      expect(env.NEXTAUTH_URL).toBe('http://localhost:3000');
      expect(env.UPSTASH_REDIS_URL).toBe('');
      expect(env.UPSTASH_REDIS_TOKEN).toBe('');
      expect(env.USE_DEMO_DATA).toBe(true);
    });
  });

  describe('isDemo', () => {
    it('should return true when USE_DEMO_DATA is not "false"', () => {
      process.env.USE_DEMO_DATA = 'true';
      process.env.DATABASE_URL = 'db-url';
      process.env.UPSTASH_REDIS_URL = 'redis-url';

      const { isDemo } = require('../lib/env');

      expect(isDemo()).toBe(true);
    });

    it('should return true when USE_DEMO_DATA is not set (defaults to "true")', () => {
      delete process.env.USE_DEMO_DATA;
      process.env.DATABASE_URL = 'db-url';
      process.env.UPSTASH_REDIS_URL = 'redis-url';

      const { isDemo } = require('../lib/env');

      expect(isDemo()).toBe(true);
    });

    it('should return true when critical env vars are missing (DATABASE_URL)', () => {
      process.env.USE_DEMO_DATA = 'false';
      delete process.env.DATABASE_URL;
      process.env.UPSTASH_REDIS_URL = 'redis-url';

      const { isDemo } = require('../lib/env');

      expect(isDemo()).toBe(true);
    });

    it('should return true when critical env vars are missing (UPSTASH_REDIS_URL)', () => {
      process.env.USE_DEMO_DATA = 'false';
      process.env.DATABASE_URL = 'db-url';
      delete process.env.UPSTASH_REDIS_URL;

      const { isDemo } = require('../lib/env');

      expect(isDemo()).toBe(true);
    });

    it('should return true when both critical env vars are missing', () => {
      process.env.USE_DEMO_DATA = 'false';
      delete process.env.DATABASE_URL;
      delete process.env.UPSTASH_REDIS_URL;

      const { isDemo } = require('../lib/env');

      expect(isDemo()).toBe(true);
    });

    it('should return false when USE_DEMO_DATA is "false" and env vars are present', () => {
      process.env.USE_DEMO_DATA = 'false';
      process.env.DATABASE_URL = 'db-url';
      process.env.UPSTASH_REDIS_URL = 'redis-url';

      const { isDemo } = require('../lib/env');

      expect(isDemo()).toBe(false);
    });

    it('should return true when USE_DEMO_DATA is "false" but DATABASE_URL is missing', () => {
      process.env.USE_DEMO_DATA = 'false';
      delete process.env.DATABASE_URL;
      process.env.UPSTASH_REDIS_URL = 'redis-url';

      const { isDemo } = require('../lib/env');

      expect(isDemo()).toBe(true);
    });

    it('should return true when USE_DEMO_DATA is "false" but UPSTASH_REDIS_URL is missing', () => {
      process.env.USE_DEMO_DATA = 'false';
      process.env.DATABASE_URL = 'db-url';
      delete process.env.UPSTASH_REDIS_URL;

      const { isDemo } = require('../lib/env');

      expect(isDemo()).toBe(true);
    });
  });

  describe('env schema', () => {
    it('should parse env schema successfully', () => {
      const schema = z.object({
        DATABASE_URL: z.string().optional().default(''),
        NEXTAUTH_SECRET: z.string().optional().default('dev-secret'),
        NEXTAUTH_URL: z.string().optional().default('http://localhost:3000'),
        UPSTASH_REDIS_URL: z.string().optional().default(''),
        UPSTASH_REDIS_TOKEN: z.string().optional().default(''),
        USE_DEMO_DATA: z.string().optional().default('true')
      }).transform((env) => ({
        DATABASE_URL: env.DATABASE_URL || '',
        NEXTAUTH_SECRET: env.NEXTAUTH_SECRET || 'dev-secret',
        NEXTAUTH_URL: env.NEXTAUTH_URL || 'http://localhost:3000',
        UPSTASH_REDIS_URL: env.UPSTASH_REDIS_URL || '',
        UPSTASH_REDIS_TOKEN: env.UPSTASH_REDIS_TOKEN || '',
        USE_DEMO_DATA: env.USE_DEMO_DATA === 'true'
      }));

      const result = schema.parse({});
      expect(result.DATABASE_URL).toBe('');
      expect(result.NEXTAUTH_SECRET).toBe('dev-secret');
      expect(result.NEXTAUTH_URL).toBe('http://localhost:3000');
      expect(result.UPSTASH_REDIS_URL).toBe('');
      expect(result.UPSTASH_REDIS_TOKEN).toBe('');
      expect(result.USE_DEMO_DATA).toBe(true);
    });
  });
});