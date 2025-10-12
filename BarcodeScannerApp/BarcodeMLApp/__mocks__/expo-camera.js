export const CameraView = 'CameraView';
export const CameraType = 'CameraType';
export const useCameraPermissions = jest.fn(() => [
  { granted: true },
  jest.fn(),
]);