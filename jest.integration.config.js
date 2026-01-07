module.exports = {
  displayName: 'integration-tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.integration.test.ts'],
  moduleNameMapper: {
    '^@food/(.*)$': '<rootDir>/packages/$1'
  },
  testTimeout: 30000
};
