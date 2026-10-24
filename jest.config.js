/**
 * Jest runs the pure domain and data-layer tests (`src/**\/*.test.ts`).
 * Screens are verified manually on an Android emulator.
 */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: ['<rootDir>/src/**/*.test.ts'],
};
