module.exports = {
  displayName: 'order',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@food/(.*)$': '<rootDir>/../../packages/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/server.ts',
    '!src/swagger.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 85,
      statements: 85
    }
  }
};
