module.exports = {
  verbose: false,
  testMatch: [
    '**/test/**/*test*.js',
    '!**/playground/**',
    '!**/stryker-tmp/**',
  ],
  collectCoverage: false,
  coverageReporters: ['text-summary', 'lcov'],
  collectCoverageFrom: ['**/*.js', '!**/node_modules/**', '!**/test/**'],
  forceExit: true,
  testEnvironment: 'node',
  notify: true,
  globalSetup: './test/setup/global-setup.js',
  globalTeardown: './test/setup/global-teardown.js',
  notifyMode: 'change',
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    [
      'jest-watch-suspend',
      {
        key: 's',
        prompt: 'suspend watch mode',
      },
    ],
    'jest-watch-master',
    [
      'jest-watch-toggle-config',
      {
        setting: 'verbose',
      },
    ],
    [
      'jest-watch-toggle-config',
      {
        setting: 'collectCoverage',
      },
    ],
  ],
};
