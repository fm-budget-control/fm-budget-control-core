import type { Config } from 'jest';
 
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1',
  },
  transform: {
    '^.+\.tsx?$': ['ts-jest', { useESM: true }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageReporters: ['lcov', 'text'],
  coverageDirectory: 'coverage',
};
 
export default config;
