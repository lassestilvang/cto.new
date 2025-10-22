import '@testing-library/jest-dom';

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => Math.random().toString(36).substr(2, 9)),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;
