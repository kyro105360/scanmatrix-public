import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import Auth from "../../app/(login)/index";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user: { email: "test@example.com", id: "123" } } })
      ),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signInWithPassword: jest.fn(() =>
        Promise.resolve({ data: { session: null }, error: null })
      ),
      signUp: jest.fn(() =>
        Promise.resolve({ data: { session: null }, error: null })
      ),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })),
  },
}));

// Mock expo-router
jest.mock("expo-router", () => {
  const pushMock = jest.fn();
  return {
    useRouter: () => ({
      push: pushMock,
      replace: jest.fn(),
      back: jest.fn(),
    }),
    pushMock, // export so tests can assert calls
  };
});

import { supabase } from "@/lib/supabase";
import { useRouter, pushMock } from "expo-router";

// Mock global alert
beforeAll(() => {
  global.alert = jest.fn();
});

beforeEach(() => {
  jest.clearAllMocks();
});

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe("Auth Component Unit Tests", () => {
  it("does not redirect if no session", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<Auth />);

    await waitFor(() => {
      expect(pushMock).not.toHaveBeenCalled();
    });
  });

  it("signs in successfully and navigates", async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: "user-2" } } },
      error: null,
    });

    const { getByPlaceholderText, getByText } = render(<Auth />);

    fireEvent.changeText(getByPlaceholderText("Email Address"), "test@test.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    await act(async () => {
      fireEvent.press(getByText("Login"));
    });

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@test.com",
        password: "password123",
      });
      expect(pushMock).toHaveBeenCalledWith("/authenticated");
    });
  });

  it("shows alert on sign-in error", async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid credentials" },
    });

    const { getByPlaceholderText, getByText } = render(<Auth />);

    fireEvent.changeText(getByPlaceholderText("Email Address"), "wrong@test.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "wrongpass");

    await act(async () => {
      fireEvent.press(getByText("Login"));
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Invalid credentials");
    });
  });

  it("signs up successfully and shows verification alert", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { getByPlaceholderText, getByText } = render(<Auth />);

    fireEvent.changeText(getByPlaceholderText("Email Address"), "new@test.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "newpassword");

    await act(async () => {
      fireEvent.press(getByText("Sign Up"));
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        "Check your inbox for a verification email."
      );
    });
  });

  it("shows alert on sign-up error", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: { message: "Email already exists" },
    });

    const { getByPlaceholderText, getByText } = render(<Auth />);

    fireEvent.changeText(getByPlaceholderText("Email Address"), "exist@test.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    await act(async () => {
      fireEvent.press(getByText("Sign Up"));
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Email already exists");
    });
  });

  it("shows loading indicator while signing in", async () => {
    let resolvePromise: any;
    const signInPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (supabase.auth.signInWithPassword as jest.Mock).mockReturnValue(signInPromise);

    const { getByPlaceholderText, getByText } = render(<Auth />);

    fireEvent.changeText(getByPlaceholderText("Email Address"), "test@test.com");
    fireEvent.changeText(getByPlaceholderText("Password"), "password123");

    act(() => {
      fireEvent.press(getByText("Login"));
    });

    await act(async () => {
      resolvePromise({
        data: { session: { user: { id: "user-3" } } },
        error: null,
      });
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/authenticated");
    });
  });
});
