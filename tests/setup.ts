/**
 * Global test setup for ElizaGotchi OS
 *
 * This file runs before all tests and sets up:
 * - Environment variables from .env.testing
 * - Database connections
 * - Mock services
 * - Test utilities
 */

import { config } from 'dotenv';
import { beforeAll, afterAll, vi } from 'vitest';

// Load test environment variables
config({ path: '.env.testing' });

// Ensure required test env vars are present
const requiredTestEnvVars = [
  'DATABASE_URL',
  'AUTH_SECRET',
];

for (const envVar of requiredTestEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} not set in .env.testing`);
  }
}

// Global test setup
beforeAll(async () => {
  console.log('Starting test suite...');
});

// Global test teardown
afterAll(async () => {
  console.log('Test suite complete.');
});

// Mock console methods to reduce noise in tests
if (process.env.TEST_VERBOSE !== 'true') {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
}

// Export test utilities
export const testUtils = {
  /**
   * Generate a random UUID for test entities
   */
  randomUUID: () => crypto.randomUUID(),

  /**
   * Create a delay (useful for async tests)
   */
  delay: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Check if integration tests should run
   */
  shouldRunIntegrationTests: () => {
    return process.env.TEST_SKIP_SLOW !== 'true';
  },
};
