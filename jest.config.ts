// /** @type {import('ts-jest').JestConfigWithTsJest} */
// module.exports = {
//   // Use ts-jest preset to enable TypeScript support
//   preset: 'ts-jest',

//   // Specify the environment (Node.js is appropriate for backend code)
//   testEnvironment: 'node',
  
//   // Pattern for test files (looks for files ending in .test.ts or .spec.ts)
//   testMatch: ["**/*.test.ts"],

//   // Configuration passed directly to ts-jest
//   globals: {
//     'ts-jest': {
//       // Use the tsconfig file in your root
//       tsconfig: 'tsconfig.json',
//     },
//   },

//   // Directory where Jest should output its coverage files
//   coverageDirectory: 'coverage',

//   // Which files/directories to ignore during testing
//   testPathIgnorePatterns: ["/node_modules/", "/dist/"],
// };

// jest.config.ts
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Use ts-jest preset to enable TypeScript support
  preset: 'ts-jest',

  // Specify the environment (Node.js is appropriate for backend code)
  testEnvironment: 'node',
  
  // Pattern for test files (looks for files ending in .test.ts or .spec.ts)
  testMatch: ["**/*.test.ts"],

  // Setup file for global test configurations (e.g., in-memory MongoDB)
  setupFilesAfterEnv: ['<rootDir>/src/Infrastructure/repositories/jest.setup.ts'], // Assuming your setup file is here

  // Increase the default test timeout to 30 seconds
  testTimeout: 30000, 

  // Configuration for ts-jest under transform
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },

  // Directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Which files/directories to ignore during testing
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};