export const pushMock = jest.fn();

export const useRouter = jest.fn(() => ({
  push: pushMock,
  replace: jest.fn(),
  back: jest.fn(),
}));
