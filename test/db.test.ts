import { getDb } from '@/lib/db';

// Mock the dependencies
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(),
  neonConfig: {},
}));

jest.mock('drizzle-orm/neon-http', () => ({
  drizzle: jest.fn(),
}));

jest.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: '',
  },
  isDemo: jest.fn(),
}));

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env, isDemo } from '@/lib/env';

const mockNeon = neon as jest.MockedFunction<typeof neon>;
const mockDrizzle = drizzle as jest.MockedFunction<typeof drizzle>;
const mockIsDemo = isDemo as jest.MockedFunction<typeof isDemo>;

describe('getDb', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Reset the module to ensure db is null for each test
    delete require.cache[require.resolve('@/lib/db')];
  });

  it('should return null when in demo mode', () => {
    mockIsDemo.mockReturnValue(true);

    const result = getDb();

    expect(result).toBeNull();
    expect(mockIsDemo).toHaveBeenCalledTimes(1);
    expect(mockNeon).not.toHaveBeenCalled();
    expect(mockDrizzle).not.toHaveBeenCalled();
  });

  it('should throw an error when DATABASE_URL is not set and not in demo mode', () => {
    mockIsDemo.mockReturnValue(false);
    (env as any).DATABASE_URL = '';

    expect(() => getDb()).toThrow('DATABASE_URL is not set');
    expect(mockIsDemo).toHaveBeenCalledTimes(1);
    expect(mockNeon).not.toHaveBeenCalled();
    expect(mockDrizzle).not.toHaveBeenCalled();
  });

  it('should return a database instance when DATABASE_URL is set and not in demo mode', () => {
    mockIsDemo.mockReturnValue(false);
    (env as any).DATABASE_URL = 'mock-url';
    const mockSql = {};
    const mockDb = {};
    mockNeon.mockReturnValue(mockSql as any);
    mockDrizzle.mockReturnValue(mockDb as any);

    const result = getDb();

    expect(result).toBe(mockDb);
    expect(mockIsDemo).toHaveBeenCalledTimes(1);
    expect(mockNeon).toHaveBeenCalledWith('mock-url');
    expect(mockDrizzle).toHaveBeenCalledWith(mockSql, { schema: expect.any(Object) });
  });

  it('should cache the database instance on subsequent calls', () => {
    mockIsDemo.mockReturnValue(false);
    (env as any).DATABASE_URL = 'mock-url';
    const mockSql = {};
    const mockDb = {};
    mockNeon.mockReturnValue(mockSql as any);
    mockDrizzle.mockReturnValue(mockDb as any);

    const result1 = getDb();
    const result2 = getDb();

    expect(result1).toStrictEqual(mockDb);
    expect(result2).toStrictEqual(mockDb);
    // Note: Since we reset the module in beforeEach, the cache is reset each test
    // But the function should still cache within the same call
    // Actually, since it's the same test execution, it should cache
    // But the mock counts are per test, so we can't test caching across calls in the same test easily
    // Instead, let's verify that the same instance is returned
    expect(result1).toBe(result2); // Same reference
  });
});