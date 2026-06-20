/**
 * @file jest.config.js
 * @description Jest configuration for the EcoPulse backend test suite.
 */

'use strict';

/** @type {import('jest').Config} */
module.exports = {
  // Run in Node environment (not browser)
  testEnvironment: 'node',

  // Show individual test names in output
  verbose: true,

  // Collect coverage from source files only (not tests or mocks)
  collectCoverageFrom: [
    'co2_calculator.js',
    'server.js',
    '!**/*.test.js',
  ],

  // Coverage thresholds — enforce quality floor
  coverageThreshold: {
    global: {
      branches:   75,
      functions:  85,
      lines:      90,
      statements: 90,
    },
  },

  // Timeout per test (ms)
  testTimeout: 10000,
};
