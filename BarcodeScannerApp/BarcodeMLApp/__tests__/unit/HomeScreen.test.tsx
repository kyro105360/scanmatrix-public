import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import  HomeScreen from '../../app/authenticated/index';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import { setupUnauthenticatedUser, createMockPermissions } from '../utils/testUtils';


jest.spyOn(Alert, "alert").mockImplementation((title, message) => {
  console.log("Alert:", title, message);
});

const mockTakePictureAsync = jest.fn();


// --- expo-camera ---
jest.mock('expo-camera', () => {
  const React = require('react');
  const MockCameraView = React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      takePictureAsync: mockTakePictureAsync,
    }));
    return null;
  });
  return {
    CameraView: MockCameraView,
    CameraType: { back: 'back', front: 'front' },
    useCameraPermissions: jest.fn(),
  };
});


// --- expo-linear-gradient ---
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  return {
    LinearGradient: (props) => React.createElement('View', props),
  };
});

// --- supabase ---
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn(), signOut: jest.fn() },
    storage: { from: jest.fn(() => ({ upload: jest.fn(), getPublicUrl: jest.fn() })) },
    from: jest.fn(() => ({ insert: jest.fn() })),
  },
}));

// --- file system ---
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  deleteAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

// --- router ---
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

jest.spyOn(Alert, 'alert');

// ==================== TEST SUITE ====================
describe('HomeScreen Component', () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTakePictureAsync.mockClear();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  // ==================== CAMERA PERMISSIONS TESTS ====================
  it('TC-001: displays permission screen when camera permission not granted', () => {
    setupUnauthenticatedUser(supabase);
    (useCameraPermissions as jest.Mock).mockReturnValue([createMockPermissions(false), jest.fn()]);
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Camera access is required to scan barcodes')).toBeTruthy();
    expect(getByText('Enable Camera')).toBeTruthy();
  });

  it('TC-002: requests permission when Enable Camera button pressed', async () => {
    setupUnauthenticatedUser(supabase);
    const mockRequest = jest.fn().mockResolvedValue({ granted: true });
    (useCameraPermissions as jest.Mock).mockReturnValue([createMockPermissions(false), mockRequest]);
    const { getByText } = render(<HomeScreen />);
    fireEvent.press(getByText('Enable Camera'));
    await waitFor(() => expect(mockRequest).toHaveBeenCalled());
  });

  it('TC-003: displays camera view when permission granted', () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([{ granted: true }, jest.fn()]);
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } } });
    const { getByText } = render(<HomeScreen />);
    expect(getByText('Ready to Scan')).toBeTruthy();
    expect(getByText('Position barcode within the frame')).toBeTruthy();
  });

  // ==================== USER AUTH TESTS ====================
  it('TC-004: fetches and displays user email on mount', async () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([{ granted: true }, jest.fn()]);
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1', email: 'testuser@example.com' } } });
    render(<HomeScreen />);
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());
  });

  it('TC-005: handles unauthenticated user gracefully', async () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([{ granted: true }, jest.fn()]);
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } });
    const { queryByText } = render(<HomeScreen />);
    await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());
    expect(queryByText('Ready to Scan')).toBeTruthy();
  });

  // ==================== CAMERA FUNCTIONALITY TESTS ====================
  it('TC-006: toggles camera facing', () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([{ granted: true }, jest.fn()]);
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } } });
    const { getByText } = render(<HomeScreen />);
    const flipBtn = getByText('Flip');
    fireEvent.press(flipBtn);
    expect(flipBtn).toBeTruthy();
  });

  it('TC-007 & TC-008: toggles torch on/off', () => {
    (useCameraPermissions as jest.Mock).mockReturnValue([{ granted: true }, jest.fn()]);
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } } });
    const { getByText } = render(<HomeScreen />);
    const flashBtn = getByText('Flash');
    fireEvent.press(flashBtn);
    fireEvent.press(flashBtn);
    expect(flashBtn).toBeTruthy();
  });

  it('TC-009: verifies Supabase config', () => {
    const bucketName = process.env.EXPO_PUBLIC_SUPABASE_BUCKET_NAME || 'photos';
    expect(bucketName).toBeTruthy();
    expect(supabase).toBeDefined();
    expect(supabase.storage).toBeDefined();
    expect(supabase.from).toBeDefined();
  });

  describe('Sidebar & Navigation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (useRouter as jest.Mock).mockReturnValue(mockRouter);
      (useCameraPermissions as jest.Mock).mockReturnValue([{ granted: true }, jest.fn()]);
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } } });
    });

    it('TC-010: opens and closes sidebar', async () => {
      const { getByTestId, getByText, queryByText } = render(<HomeScreen />);
      const menuButton = getByTestId('menu-button');
      fireEvent.press(menuButton);

      await waitFor(() => {
        expect(getByText(/Admin Portal/)).toBeTruthy();
        expect(getByText(/Logout/)).toBeTruthy();
      });

      fireEvent.press(menuButton);
      await waitFor(() => {
        expect(queryByText(/Admin Portal/)).toBeNull();
        expect(queryByText(/Logout/)).toBeNull();
      });
    });

    it('TC-011: navigates to Admin portal from sidebar', async () => {
      const { getByTestId, getByText } = render(<HomeScreen />);
      fireEvent.press(getByTestId('menu-button'));

      await waitFor(() => expect(getByText(/Admin Portal/)).toBeTruthy());
      fireEvent.press(getByText(/Admin Portal/));

      expect(mockRouter.push).toHaveBeenCalledWith('/admin');
    });

    it('TC-012: logs out via sidebar', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const { getByTestId, getByText } = render(<HomeScreen />);
      fireEvent.press(getByTestId('menu-button'));

      await waitFor(() => expect(getByText(/Logout/)).toBeTruthy());
      fireEvent.press(getByText(/Logout/));

      await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalled());
    });

    it('TC-013: displays user avatar in sidebar', async () => {
      const { getByTestId, getByText } = render(<HomeScreen />);
      fireEvent.press(getByTestId('menu-button'));

      await waitFor(() => {
        expect(getByText('T')).toBeTruthy(); // First letter of test@example.com
        expect(getByText('test@example.com')).toBeTruthy();
      });
    });
  });

  // ==================== SCAN WORKFLOW TESTS ====================
  describe('Scan Workflow', () => {
    let mockUpload: jest.Mock;
    let mockGetPublicUrl: jest.Mock;
    let mockInsert: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers();
      mockTakePictureAsync.mockClear();

      mockUpload = jest.fn().mockResolvedValue({ error: null });
      mockGetPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } });
      mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      (useCameraPermissions as jest.Mock).mockReturnValue([{ granted: true }, jest.fn()]);
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'u1', email: 'test@example.com' } } });
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ size: 1000 });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('base64string');
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      mockTakePictureAsync.mockResolvedValue({ uri: 'photo.jpg' });
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('TC-014: completes scan with stabilization', async () => {
      const { getByTestId } = render(<HomeScreen />);
      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      fireEvent.press(getByTestId('scan-button'));
      await act(async () => jest.advanceTimersByTime(3000));

      await waitFor(() => expect(mockTakePictureAsync).toHaveBeenCalled());
    });

    it('TC-015: shows success animation and completes workflow', async () => {
      const { getByTestId, getByText } = render(<HomeScreen />);
      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      fireEvent.press(getByTestId('scan-button'));
      await act(async () => jest.advanceTimersByTime(3500));

      await waitFor(() => {
        expect(mockTakePictureAsync).toHaveBeenCalled();
        expect(mockUpload).toHaveBeenCalled();
        expect(mockInsert).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(getByText(/📦/)).toBeTruthy();
        expect(getByText(/Barcode Scanned!/)).toBeTruthy();
      });
    });

    it('TC-016: selects largest photo and deletes others', async () => {
      mockTakePictureAsync
        .mockResolvedValueOnce({ uri: 'photo1.jpg' })
        .mockResolvedValueOnce({ uri: 'photo2.jpg' })
        .mockResolvedValueOnce({ uri: 'photo3.jpg' });

      (FileSystem.getInfoAsync as jest.Mock)
        .mockResolvedValueOnce({ size: 800 })
        .mockResolvedValueOnce({ size: 1200 })
        .mockResolvedValueOnce({ size: 1000 });

      const { getByTestId } = render(<HomeScreen />);
      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      fireEvent.press(getByTestId('scan-button'));
      await act(async () => jest.advanceTimersByTime(3500));

      await waitFor(() => {
        expect(mockTakePictureAsync).toHaveBeenCalledTimes(3);
        expect(FileSystem.deleteAsync).toHaveBeenCalled();
      });
    });

    it('TC-017: handles failed photo captures gracefully', async () => {
      mockTakePictureAsync
        .mockRejectedValueOnce(new Error('Camera error'))
        .mockRejectedValueOnce(new Error('Camera error'))
        .mockRejectedValueOnce(new Error('Camera error'));

      const { getByTestId } = render(<HomeScreen />);
      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      fireEvent.press(getByTestId('scan-button'));
      await act(async () => jest.advanceTimersByTime(3500));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to capture barcode image');
      });
    });

   it("TC-018: handles supabase upload error gracefully", async () => {
     // Mock camera and file system
     mockTakePictureAsync.mockResolvedValue({ uri: "file://mock.jpg" });
     (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ size: 1000 });
     (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue("base64string");

     // Mock Supabase upload to fail
     (supabase.storage.from as jest.Mock).mockReturnValue({
       upload: jest.fn().mockResolvedValue({ error: new Error("Upload failed") }),
       getPublicUrl: jest.fn(),
     });

     // Render component
     const { getByTestId } = render(<HomeScreen />);
     await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

     // Trigger scan
     await act(async () => {
       fireEvent.press(getByTestId("scan-button"));
       jest.advanceTimersByTime(3500); // Account for stabilization delay and photo capture
     });

     // Wait for the alert
     await waitFor(() => {
       expect(Alert.alert).toHaveBeenCalledWith("Upload Error", expect.any(String));
     });
   });


  it('TC-019: handles logout button press', async () => {
    const { getByTestId, findByText } = render(<HomeScreen />);
    fireEvent.press(getByTestId('menu-button'));

    const logout = await findByText(/Logout/i); //
    fireEvent.press(logout);

    await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalled());
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/(login)'));
  });

     it('TC-020: opens and closes sidebar correctly', async () => {
       const { getByTestId, findByText, queryByText } = render(<HomeScreen />);
       fireEvent.press(getByTestId('menu-button'));
       expect(await findByText(/Admin Portal/i)).toBeTruthy();

       fireEvent.press(getByTestId('menu-button'));
       await waitFor(() => expect(queryByText(/Admin Portal/i)).toBeNull());
     });

      it('TC-021: navigates to admin portal screen', async () => {
        const { getByTestId, findByText } = render(<HomeScreen />);
        fireEvent.press(getByTestId('menu-button'));

        const adminButton = await findByText(/Admin Portal/i);
        fireEvent.press(adminButton);
        expect(mockRouter.push).toHaveBeenCalledWith('/admin');
      });
  });
});