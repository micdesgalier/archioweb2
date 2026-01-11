// jest.config.cjs
export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.mjs'],
  verbose: true,
  transform: {} // pas de transformation, Node gère les imports ESM
};