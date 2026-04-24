import type { Config } from 'jest';
import { createJsWithTsPreset } from 'ts-jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  collectCoverageFrom: ['**/*.spec.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/setup-env.ts'],
  ...createJsWithTsPreset(),
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
