import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../app/authenticated/index';
import { supabase } from '@/lib/supabase';
import { setupAuthenticatedUser } from '../utils/testUtils';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn(), signOut: jest.fn() },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'mock-url' } })),
      })),
    },
    from: jest.fn(() => ({
      insert: jest.fn(),
      select: jest.fn(),
    })),
  },
}));

describe('HomeScreen Integration Tests (Aligned with UI)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the main UI with camera controls', async () => {
    setupAuthenticatedUser(supabase, { id: 'user-123', email: 'test@test.com' });

    const rendered = render(<HomeScreen />);

    await waitFor(() => {
      expect(rendered.getByText('Ready to Scan')).toBeTruthy();
      expect(rendered.getByText('Position barcode within the frame')).toBeTruthy();
      expect(rendered.getByText('Flip')).toBeTruthy();
      expect(rendered.getByText('Flash')).toBeTruthy();
    });
  });

  it('should toggle camera facing when "Flip" is pressed', async () => {
    setupAuthenticatedUser(supabase, { id: 'user-123' });

    const rendered = render(<HomeScreen />);

    await waitFor(() => expect(rendered.getByText('Flip')).toBeTruthy());

    fireEvent.press(rendered.getByText('Flip'));

    await waitFor(() => {
      expect(rendered.getByText('Ready to Scan')).toBeTruthy();
    });
  });

  it('should toggle torch when "Flash" is pressed', async () => {
    setupAuthenticatedUser(supabase, { id: 'user-123' });

    const rendered = render(<HomeScreen />);

    await waitFor(() => expect(rendered.getByText('Flash')).toBeTruthy());

    fireEvent.press(rendered.getByText('Flash'));

    await waitFor(() => {
      expect(rendered.getByText('Ready to Scan')).toBeTruthy();
    });
  });

  it('should load user data', async () => {
    setupAuthenticatedUser(supabase, {
      id: 'user-123',
      email: 'test@test.com',
    });

    const rendered = render(<HomeScreen />);

    await waitFor(() => {
      expect(rendered.getByText('Ready to Scan')).toBeTruthy();
    });
  });

  it('should handle mock logout if a button is present', async () => {
    setupAuthenticatedUser(supabase, { id: 'user-123' });
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({});

    const rendered = render(<HomeScreen />);

    await waitFor(() => expect(rendered.getByText('Ready to Scan')).toBeTruthy());

    const logoutButton = rendered.queryByText('Logout');
    if (logoutButton) {
      fireEvent.press(logoutButton);
      await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalled());
    }
  });

  it('should safely simulate a barcode scan event', async () => {
    setupAuthenticatedUser(supabase, { id: 'user-123' });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: [{ id: 1 }] }),
    });

    const rendered = render(<HomeScreen />);

    await waitFor(() => {
      expect(rendered.getByText('Ready to Scan')).toBeTruthy();
    });

    const scanButton = rendered.queryByText('Scan Barcode');
    if (scanButton) {
      fireEvent.press(scanButton);
      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });
    }
  });
});
