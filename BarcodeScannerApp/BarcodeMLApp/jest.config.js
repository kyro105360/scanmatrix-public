module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/app', '<rootDir>/__tests__'],
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
  '^expo-camera$': '<rootDir>/__mocks__/expo-camera.js',
  '^expo-file-system/legacy$': '<rootDir>/__mocks__/expo-file-system.js',
  '^expo-router$': '<rootDir>/__mocks__/expo-router.js',
  '^expo-linear-gradient$': '<rootDir>/__mocks__/expo-linear-gradient.js',
  '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',

},
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
};
