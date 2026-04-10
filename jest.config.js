module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  coverageDirectory: 'tests/results/coverage',
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    'src/shared/constants/**/*.ts',
  ],
};
