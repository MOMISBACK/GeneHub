module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
      ],
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/supabase/',
    // Skip integration tests by default (run with npm run test:integration)
    '/__tests__/integration/',
  ],
  collectCoverageFrom: [
    'src/lib/utils.ts', // Only track utils.ts for now (pure functions)
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    __DEV__: true,
  },
};
