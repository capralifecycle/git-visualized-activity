module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  moduleNameMapper: {
    // Avoid parsing these files, which is normally handled by our bundler.
    '\\.csv$': '<rootDir>/emptyExport.js',
  },
  preset: 'ts-jest',
  testEnvironment: 'node',
  testResultsProcessor: 'jest-sonar-reporter',
}
