module.exports = {
  projects: [
    '<rootDir>/services/order/jest.config.js',
    '<rootDir>/services/auth/jest.config.js',
    '<rootDir>/services/notification/jest.config.js',
    '<rootDir>/services/payment/jest.config.js',
    '<rootDir>/services/delivery/jest.config.js',
    '<rootDir>/services/kitchen/jest.config.js'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/server.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000,
  verbose: true
};
