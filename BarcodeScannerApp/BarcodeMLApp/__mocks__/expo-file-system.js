export const EncodingType = { Base64: 'base64' };
export const readAsStringAsync = jest.fn().mockResolvedValue('base64');
export const getInfoAsync = jest.fn().mockResolvedValue({ size: 1000000 });
export const deleteAsync = jest.fn().mockResolvedValue(undefined);