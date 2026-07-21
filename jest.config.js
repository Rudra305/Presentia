/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-crypto$': '<rootDir>/src/__mocks__/expo-crypto.js',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'babel-jest',
      {
        presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
        plugins: [['babel-plugin-inline-import', { extensions: ['.sql'] }]],
      },
    ],
  },
  // Only transform our own source; leave node_modules alone (fast + isolated).
  transformIgnorePatterns: ['node_modules'],
  collectCoverageFrom: ['src/core/storage/**/*.{ts,tsx}', '!src/**/__tests__/**', '!src/**/*.d.ts'],
};
