// jest.setup.js
// Mock Expo public env vars
process.env.EXPO_PUBLIC_SUPABASE_BUCKET_NAME = 'barcodes';
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://fake.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'fake-key';

// Silence all console messages during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Catch unhandled promise rejections to prevent ReferenceError noise
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});
