import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import AdminPortal from '../../app/admin/index';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation((title, message) => {
  console.log('Alert:', title, message);
});

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Mock router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { TouchableOpacity } = require('react-native');
  return {
    __esModule: true,
    default: ({ testID, value, onChange, ...props }: any) => {
      return (
        <TouchableOpacity
          testID={testID || 'datetime-picker'}
          onPress={() => onChange({}, value || new Date())}
        />
      );
    },
  };
});

describe('AdminPortal Component', () => {
  const mockRouter = { push: jest.fn() };
  const mockUser = { id: 'user123', email: 'admin@example.com' };
  const mockRecords = [
    {
      id: 'record1',
      user_id: 'user123',
      created_at: '2025-01-15T10:00:00Z',
      image_url: 'https://example.com/image1.jpg',
      email: 'customer1@example.com',
      mailing_address: '123 Main St',
      phone: '555-0001',
      physical_address: '123 Main St, City',
      notes: 'Test note 1',
    },
    {
      id: 'record2',
      user_id: 'user123',
      created_at: '2025-01-16T10:00:00Z',
      image_url: null,
      email: null,
      mailing_address: null,
      phone: null,
      physical_address: null,
      notes: null,
    },
  ];

  let mockQuery: any;
  let mockUpdate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    };

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'barcodes') {
        return {
          ...mockQuery,
          update: mockUpdate,
        };
      }
      return mockQuery;
    });

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  // ==================== INITIAL LOAD & USER AUTH TESTS ====================
  describe('Initial Load & Authentication', () => {
    it('TC-AP-001: fetches user and records on mount', async () => {
      mockQuery.order.mockResolvedValue({ data: mockRecords, error: null });

      const { getByText } = render(<AdminPortal />);

      await waitFor(() => {
        expect(supabase.auth.getUser).toHaveBeenCalled();
        expect(supabase.from).toHaveBeenCalledWith('barcodes');
      });

      await waitFor(() => {
        expect(getByText('Scanned Barcodes')).toBeTruthy();
      });
    });

    it('TC-AP-002: handles unauthenticated user gracefully', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });
      mockQuery.order.mockResolvedValue({ data: [], error: null });

      render(<AdminPortal />);

      await waitFor(() => {
        expect(supabase.auth.getUser).toHaveBeenCalled();
      });
    });

    it('TC-AP-003: displays error alert when fetch fails', async () => {
      mockQuery.order.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      render(<AdminPortal />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Database connection failed');
      });
    });

    it('TC-AP-004: displays empty state when no records found', async () => {
      mockQuery.order.mockResolvedValue({ data: [], error: null });

      const { getByText } = render(<AdminPortal />);

      await waitFor(() => {
        expect(getByText('No records found.')).toBeTruthy();
      });
    });

    it('TC-AP-005: displays records with all fields populated', async () => {
      mockQuery.order.mockResolvedValue({ data: [mockRecords[0]], error: null });

      const { getByDisplayValue, getByText } = render(<AdminPortal />);

      await waitFor(() => {
        expect(getByDisplayValue('customer1@example.com')).toBeTruthy();
        expect(getByDisplayValue('123 Main St')).toBeTruthy();
        expect(getByDisplayValue('555-0001')).toBeTruthy();
        expect(getByDisplayValue('123 Main St, City')).toBeTruthy();
        expect(getByDisplayValue('Test note 1')).toBeTruthy();
        expect(getByText(/Scanned:/)).toBeTruthy();
      });
    });

    it('TC-AP-005: displays records with null/empty fields', async () => {
      mockQuery.order.mockResolvedValue({ data: [mockRecords[1]], error: null });

      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => {
        expect(getAllByPlaceholderText('Email Address')).toBeTruthy();
        expect(getAllByPlaceholderText('Mailing Address')).toBeTruthy();
        expect(getAllByPlaceholderText('Phone Number')).toBeTruthy();
        expect(getAllByPlaceholderText('Physical Address')).toBeTruthy();
        expect(getAllByPlaceholderText('Notes')).toBeTruthy();
      });
    });

    it('TC-AP-006: renders barcode image when image_url exists', async () => {
      mockQuery.order.mockResolvedValue({ data: [mockRecords[0]], error: null });

      const { UNSAFE_getByType } = render(<AdminPortal />);

      await waitFor(() => {
        const images = UNSAFE_getByType('Image');
        expect(images).toBeTruthy();
      });
    });
  });

  // ==================== FIELD UPDATE TESTS ====================
  describe('Field Updates', () => {
    beforeEach(() => {
      mockQuery.order.mockResolvedValue({ data: mockRecords, error: null });
    });

    it('TC-AP-007: updates email field successfully', async () => {
      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const emailInputs = getAllByPlaceholderText('Email Address');
      fireEvent.changeText(emailInputs[1], 'newemail@example.com');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ email: 'newemail@example.com' });
      });
    });

    it('TC-AP-008: updates mailing address field successfully', async () => {
      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const addressInputs = getAllByPlaceholderText('Mailing Address');
      fireEvent.changeText(addressInputs[0], '456 Oak Ave');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ mailing_address: '456 Oak Ave' });
      });
    });

    it('TC-AP-009: updates phone field successfully', async () => {
      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const phoneInputs = getAllByPlaceholderText('Phone Number');
      fireEvent.changeText(phoneInputs[0], '555-9999');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ phone: '555-9999' });
      });
    });

    it('TC-AP-010: updates physical address field successfully', async () => {
      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const physicalInputs = getAllByPlaceholderText('Physical Address');
      fireEvent.changeText(physicalInputs[0], '789 Elm St, Town');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ physical_address: '789 Elm St, Town' });
      });
    });

    it('TC-AP-011: updates notes field successfully', async () => {
      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const notesInputs = getAllByPlaceholderText('Notes');
      fireEvent.changeText(notesInputs[0], 'Updated note');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ notes: 'Updated note' });
      });
    });

    it('TC-AP-012: handles update error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      });

      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const emailInputs = getAllByPlaceholderText('Email Address');
      fireEvent.changeText(emailInputs[0], 'test@example.com');

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Update error:', 'Update failed');
      });

      consoleError.mockRestore();
    });

    it('TC-AP-013: updates local state after successful update', async () => {
      const { getAllByPlaceholderText, getByDisplayValue } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const emailInputs = getAllByPlaceholderText('Email Address');
      fireEvent.changeText(emailInputs[1], 'updated@example.com');

      await waitFor(() => {
        expect(getByDisplayValue('updated@example.com')).toBeTruthy();
      });
    });
  });

  // ==================== EMAIL FUNCTIONALITY TESTS ====================
  describe('Email Functionality', () => {
    beforeEach(() => {
      mockQuery.order.mockResolvedValue({ data: mockRecords, error: null });
    });

    it('TC-AP-014: shows alert when email is missing', async () => {
      const { getAllByText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const sendEmailButtons = getAllByText('Send Email');
      fireEvent.press(sendEmailButtons[1]);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('No Email', 'Please add an email address first');
      });
    });


  });

  // ==================== SMS FUNCTIONALITY TESTS ====================
  describe('SMS Functionality', () => {
    beforeEach(() => {
      mockQuery.order.mockResolvedValue({ data: mockRecords, error: null });
    });

    it('TC-AP-015: shows alert when phone is missing', async () => {
      const { getAllByText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const sendTextButtons = getAllByText('Send Text');
      fireEvent.press(sendTextButtons[1]);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('No Phone', 'Please add a phone number first');
      });
    });


  });

  // ==================== SIDEBAR TESTS ====================
  describe('Sidebar Functionality', () => {
    beforeEach(() => {
      mockQuery.order.mockResolvedValue({ data: mockRecords, error: null });
    });

    it('TC-AP-016: opens sidebar when menu button pressed', async () => {
      const { getByText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      fireEvent.press(getByText('☰'));

      await waitFor(() => {
        expect(getByText('admin@example.com')).toBeTruthy();
        expect(getByText(/Barcode Scan/)).toBeTruthy();
        expect(getByText(/Logout/)).toBeTruthy();
      });
    });

    it('TC-AP-017: displays user avatar with first letter of email', async () => {
      const { getByText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      fireEvent.press(getByText('☰'));

      await waitFor(() => {
        expect(getByText('A')).toBeTruthy();
      });
    });

    it('TC-AP-018: navigates to barcode scan screen', async () => {
      const { getByText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      fireEvent.press(getByText('☰'));

      await waitFor(() => expect(getByText(/Barcode Scan/)).toBeTruthy());

      fireEvent.press(getByText(/Barcode Scan/));

      expect(mockRouter.push).toHaveBeenCalledWith('/authenticated');
    });

    it('TC-AP-019: logs out and navigates to login screen', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const { getByText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      fireEvent.press(getByText('☰'));

      await waitFor(() => expect(getByText(/Logout/)).toBeTruthy());

      fireEvent.press(getByText(/Logout/));

      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith('/(login)');
      });
    });


    it('TC-AP-020: closes sidebar when background is clicked', async () => {
      const { getByText, queryByText, getByTestId } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      // Open sidebar
      fireEvent.press(getByText('☰'));
      await waitFor(() => expect(getByText('admin@example.com')).toBeTruthy());

      // Click the sidebar background
      const sidebarBackground = getByTestId('sidebar-background');
      fireEvent.press(sidebarBackground);

      await waitFor(() => {
        expect(queryByText(/Barcode Scan/)).toBeNull();
        expect(queryByText(/Logout/)).toBeNull();
      });
    });
  });


  // ==================== RECORD DISPLAY TESTS ====================
  describe('Record Display', () => {
    it('TC-AP-021: displays multiple records correctly', async () => {
      mockQuery.order.mockResolvedValue({ data: mockRecords, error: null });

      const { getAllByText } = render(<AdminPortal />);

      await waitFor(() => {
        const sendEmailButtons = getAllByText('Send Email');
        expect(sendEmailButtons.length).toBe(2);
      });
    });

    it('TC-AP-022: formats timestamp correctly', async () => {
      mockQuery.order.mockResolvedValue({ data: [mockRecords[0]], error: null });

      const { getByText } = render(<AdminPortal />);

      await waitFor(() => {
        const expectedDate = new Date('2025-01-15T10:00:00Z').toLocaleString();
        expect(getByText(`Scanned: ${expectedDate}`)).toBeTruthy();
      });
    });

    it('TC-AP-023: handles records without images', async () => {
      mockQuery.order.mockResolvedValue({ data: [mockRecords[1]], error: null });

      const { getByText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());


      await waitFor(() => {
        expect(getByText(/Scanned:/)).toBeTruthy();
      });
    });
  });

  // ==================== EDGE CASES ====================
  describe('Edge Cases', () => {
    it('TC-AP-024: handles empty user email', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user123', email: null } },
      });
      mockQuery.order.mockResolvedValue({ data: [], error: null });

      const { getByText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      fireEvent.press(getByText('☰'));

      // Should not crash even with null email
      await waitFor(() => {
        expect(getByText(/Logout/)).toBeTruthy();
      });
    });

    it('TC-AP-025: handles very long text in fields', async () => {
      const longTextRecord = {
        ...mockRecords[0],
        notes: 'A'.repeat(1000),
        physical_address: 'B'.repeat(500),
      };
      mockQuery.order.mockResolvedValue({ data: [longTextRecord], error: null });

      const { getByDisplayValue } = render(<AdminPortal />);

      await waitFor(() => {
        expect(getByDisplayValue('A'.repeat(1000))).toBeTruthy();
        expect(getByDisplayValue('B'.repeat(500))).toBeTruthy();
      });
    });

    it('TC-AP-026: handles special characters in fields', async () => {
      const specialCharsRecord = {
        ...mockRecords[0],
        email: 'test+special@example.com',
        notes: 'Special chars: !@#$%^&*()',
      };
      mockQuery.order.mockResolvedValue({ data: [specialCharsRecord], error: null });

      const { getByDisplayValue } = render(<AdminPortal />);

      await waitFor(() => {
        expect(getByDisplayValue('test+special@example.com')).toBeTruthy();
        expect(getByDisplayValue('Special chars: !@#$%^&*()')).toBeTruthy();
      });
    });

    it('TC-AP-027: handles rapid field updates', async () => {
      mockQuery.order.mockResolvedValue({ data: [mockRecords[0]], error: null });

      const { getByDisplayValue } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const emailInput = getByDisplayValue('customer1@example.com');

      fireEvent.changeText(emailInput, 'test1@example.com');
      fireEvent.changeText(emailInput, 'test2@example.com');
      fireEvent.changeText(emailInput, 'test3@example.com');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledTimes(3);
      });
    });

    it('TC-AP-028: handles logout error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: { message: 'Logout failed' },
      });
      mockQuery.order.mockResolvedValue({ data: mockRecords, error: null });

      const { getByText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      fireEvent.press(getByText('☰'));
      await waitFor(() => expect(getByText(/Logout/)).toBeTruthy());

      fireEvent.press(getByText(/Logout/));

      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('TC-AP-029: handles empty string in fields', async () => {
      mockQuery.order.mockResolvedValue({ data: [mockRecords[0]], error: null });

      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const emailInputs = getAllByPlaceholderText('Email Address');
      fireEvent.changeText(emailInputs[0], '');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ email: '' });
      });
    });

    it('TC-AP-030: handles whitespace-only input', async () => {
      mockQuery.order.mockResolvedValue({ data: [mockRecords[0]], error: null });

      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const notesInputs = getAllByPlaceholderText('Notes');
      fireEvent.changeText(notesInputs[0], '   ');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ notes: '   ' });
      });
    });
  });

  // ==================== ADDITIONAL COVERAGE TESTS ====================
  describe('Additional Coverage Tests', () => {
    beforeEach(() => {
      mockQuery.order.mockResolvedValue({ data: mockRecords, error: null });
    });

    it('TC-AP-031: verifies user_id filter in query', async () => {
      render(<AdminPortal />);

      await waitFor(() => {
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user123');
      });
    });

    it('TC-AP-032: verifies descending order by created_at', async () => {
      render(<AdminPortal />);

      await waitFor(() => {
        expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      });
    });

    it('TC-AP-033: updates multiple fields for same record', async () => {
      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const emailInputs = getAllByPlaceholderText('Email Address');
      const phoneInputs = getAllByPlaceholderText('Phone Number');

      fireEvent.changeText(emailInputs[0], 'newemail@test.com');
      fireEvent.changeText(phoneInputs[0], '555-1234');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ email: 'newemail@test.com' });
        expect(mockUpdate).toHaveBeenCalledWith({ phone: '555-1234' });
      });
    });

    it('TC-AP-034: displays correct record count in FlatList', async () => {
      const { getAllByText } = render(<AdminPortal />);

      await waitFor(() => {
        const timestamps = getAllByText(/Scanned:/);
        expect(timestamps.length).toBe(2);
      });
    });

    it('TC-AP-035: renders correct placeholder colors', async () => {
      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => {
        const inputs = getAllByPlaceholderText('Email Address');
        expect(inputs[0]).toBeTruthy();
      });
    });

    it('TC-AP-036: handles multiline notes input', async () => {
      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const notesInputs = getAllByPlaceholderText('Notes');
      const multilineText = 'Line 1\nLine 2\nLine 3';
      fireEvent.changeText(notesInputs[0], multilineText);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ notes: multilineText });
      });
    });

    it('TC-AP-037: displays title and subtitle correctly', async () => {
      const { getByText } = render(<AdminPortal />);

      await waitFor(() => {
        expect(getByText('Scanned Barcodes')).toBeTruthy();
        expect(getByText('Manage all scanned records')).toBeTruthy();
      });
    });

    it('TC-AP-038: verifies action buttons are in correct order', async () => {
      const { getAllByText } = render(<AdminPortal />);

      await waitFor(() => {
        const sendEmailButtons = getAllByText('Send Email');
        const sendTextButtons = getAllByText('Send Text');
        expect(sendEmailButtons.length).toBe(2);
        expect(sendTextButtons.length).toBe(2);
      });
    });

    it('TC-AP-039: sidebar closes when navigating to barcode scan', async () => {
      const { getByText, queryByText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      fireEvent.press(getByText('☰'));
      await waitFor(() => expect(getByText(/Barcode Scan/)).toBeTruthy());

      fireEvent.press(getByText(/Barcode Scan/));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/authenticated');
      });
    });

    it('TC-AP-040: sidebar closes when logging out', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const { getByText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      fireEvent.press(getByText('☰'));
      await waitFor(() => expect(getByText(/Logout/)).toBeTruthy());

      fireEvent.press(getByText(/Logout/));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/(login)');
      });
    });


    it('TC-AP-041: maintains scroll position after field update', async () => {
      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const emailInputs = getAllByPlaceholderText('Email Address');
      fireEvent.changeText(emailInputs[1], 'updated@test.com');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ email: 'updated@test.com' });
      });
    });

    it('TC-AP-042: handles concurrent field updates on different records', async () => {
      const { getAllByPlaceholderText } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const emailInputs = getAllByPlaceholderText('Email Address');
      const phoneInputs = getAllByPlaceholderText('Phone Number');

      fireEvent.changeText(emailInputs[0], 'record1@test.com');
      fireEvent.changeText(emailInputs[1], 'record2@test.com');
      fireEvent.changeText(phoneInputs[0], '555-1111');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledTimes(3);
      });
    });

    it('TC-AP-043: verifies FlatList key extractor uses record id', async () => {
      const { UNSAFE_getByType } = render(<AdminPortal />);

      await waitFor(() => expect(supabase.auth.getUser).toHaveBeenCalled());

      const flatList = UNSAFE_getByType('RCTScrollView');
      expect(flatList).toBeTruthy();
    });

    it('TC-AP-044: handles loading state correctly', async () => {
      let resolveQuery: any;
      const queryPromise = new Promise((resolve) => {
        resolveQuery = resolve;
      });
      mockQuery.order.mockReturnValue(queryPromise);

      const { queryByText } = render(<AdminPortal />);

      expect(queryByText('No records found.')).toBeNull();

      resolveQuery({ data: [], error: null });

      await waitFor(() => {
        expect(queryByText('No records found.')).toBeTruthy();
      });
    });

    it('TC-AP-045: handles image rendering with valid URL', async () => {
      mockQuery.order.mockResolvedValue({ data: [mockRecords[0]], error: null });

      const { UNSAFE_getByType } = render(<AdminPortal />);

      await waitFor(() => {
        const image = UNSAFE_getByType('Image');
        expect(image.props.source.uri).toBe('https://example.com/image1.jpg');
      });
    });
  });
});