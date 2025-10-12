import { act } from '@testing-library/react-native';

/**
 * Test Utilities for Barcode Scanner App
 */

// Mock user data
export const mockUsers = {
  validUser: {
    id: 'user-123',
    email: 'test@example.com',
  },
  adminUser: {
    id: 'admin-456',
    email: 'admin@example.com',
  },
  noEmail: {
    id: 'user-789',
    email: null,
  },
};

// Mock photo data
export const mockPhotos = {
  validPhoto: {
    uri: 'file:///path/to/photo1.jpg',
    width: 1920,
    height: 1080,
  },
  highQuality: {
    uri: 'file:///path/to/photo2.jpg',
    width: 4032,
    height: 3024,
  },
  lowQuality: {
    uri: 'file:///path/to/photo3.jpg',
    width: 640,
    height: 480,
  },
};

// Mock file info
export const mockFileInfo = {
  small: { size: 500000, exists: true },
  medium: { size: 1000000, exists: true },
  large: { size: 2000000, exists: true },
  notExists: { exists: false },
};

// Mock Supabase responses
export const mockSupabaseResponses = {
  successUpload: {
    data: { path: 'barcodes/test.jpg' },
    error: null,
  },
  failedUpload: {
    data: null,
    error: { message: 'Upload failed' },
  },
  successInsert: {
    data: [{ id: 1 }],
    error: null,
  },
  failedInsert: {
    data: null,
    error: { message: 'Insert failed' },
  },
  publicUrl: {
    data: { publicUrl: 'https://example.com/storage/barcodes/test.jpg' },
  },
};

// Helper to setup authenticated user mock
export const setupAuthenticatedUser = (supabaseMock: any, user = mockUsers.validUser) => {
  supabaseMock.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  });
};

// Helper to setup unauthenticated state
export const setupUnauthenticatedUser = (supabaseMock: any) => {
  supabaseMock.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
};

// Helper to setup successful upload flow
export const setupSuccessfulUploadMocks = (
  supabaseMock: any,
  FileSystemMock: any
) => {
  // Mock file operations
  FileSystemMock.getInfoAsync.mockResolvedValue(mockFileInfo.large);
  FileSystemMock.readAsStringAsync.mockResolvedValue('base64encodedstring');
  FileSystemMock.deleteAsync.mockResolvedValue(undefined);

  // Mock Supabase storage
  const mockStorageChain = {
    upload: jest.fn().mockResolvedValue(mockSupabaseResponses.successUpload),
    getPublicUrl: jest.fn().mockReturnValue(mockSupabaseResponses.publicUrl),
  };

  supabaseMock.storage.from.mockReturnValue(mockStorageChain);

  // Mock database insert
  const mockDbChain = {
    insert: jest.fn().mockResolvedValue(mockSupabaseResponses.successInsert),
  };

  supabaseMock.from.mockReturnValue(mockDbChain);

  return { mockStorageChain, mockDbChain };
};

// Helper to setup failed upload flow
export const setupFailedUploadMocks = (supabaseMock: any) => {
  const mockStorageChain = {
    upload: jest.fn().mockResolvedValue(mockSupabaseResponses.failedUpload),
    getPublicUrl: jest.fn().mockReturnValue(mockSupabaseResponses.publicUrl),
  };

  supabaseMock.storage.from.mockReturnValue(mockStorageChain);

  return mockStorageChain;
};

// Helper to advance timers and flush promises
export const advanceTimersAndFlush = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
  });
};

// Helper to simulate camera photo capture
export const mockCameraCapture = (
  cameraRef: any,
  photoData = mockPhotos.validPhoto
) => {
  if (cameraRef.current) {
    cameraRef.current.takePictureAsync = jest.fn().mockResolvedValue(photoData);
  }
};

// Helper to simulate multiple photo captures with different sizes
export const mockMultiplePhotoCaptures = (cameraRef: any) => {
  const photos = [
    mockPhotos.lowQuality,
    mockPhotos.highQuality,
    mockPhotos.validPhoto,
  ];

  if (cameraRef.current) {
    cameraRef.current.takePictureAsync = jest
      .fn()
      .mockResolvedValueOnce(photos[0])
      .mockResolvedValueOnce(photos[1])
      .mockResolvedValueOnce(photos[2]);
  }

  return photos;
};

// Helper to verify database insert was called with correct data
export const verifyDatabaseInsert = (
  mockInsert: jest.Mock,
  expectedData: Partial<{
    user_id: string;
    email: string;
    filename: string;
    storage_path: string;
    image_url: string;
  }>
) => {
  expect(mockInsert).toHaveBeenCalledWith(
    expect.objectContaining(expectedData)
  );
};

// Helper to wait for async operations
export const waitForAsync = () => act(async () => {
  await Promise.resolve();
});

// Helper to create mock camera permissions
export const createMockPermissions = (granted: boolean = true) => ({
  granted,
  status: granted ? 'granted' : 'denied',
  expires: 'never',
  canAskAgain: !granted,
});

// Helper to verify Alert was called
export const verifyAlertCalled = (
  AlertMock: any,
  title: string,
  message?: string
) => {
  expect(AlertMock.alert).toHaveBeenCalled();
  const calls = AlertMock.alert.mock.calls;
  const lastCall = calls[calls.length - 1];
  expect(lastCall[0]).toBe(title);
  if (message) {
    expect(lastCall[1]).toBe(message);
  }
};

// Helper to reset all mocks
export const resetAllMocks = (...mocks: any[]) => {
  mocks.forEach(mock => {
    if (mock.mockClear) {
      mock.mockClear();
    }
  });
  jest.clearAllMocks();
};