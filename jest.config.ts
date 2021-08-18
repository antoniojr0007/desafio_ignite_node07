export default {
  bail: true,
  clearMocks: true,
  coverageProvider: "v8",
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/modules/**/useCases/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'lcov'],
  preset: 'ts-jest',
  testEnvironment: "node",
  testMatch: ["**/*.spec.ts"],
};
