import { cn, hoursRange, timeToLabel, isoDate } from '../lib/utils';

// Mock dependencies
jest.mock('clsx', () => ({
  clsx: jest.fn(),
}));

jest.mock('tailwind-merge', () => ({
  twMerge: jest.fn(),
}));

const mockClsx = require('clsx').clsx;
const mockTwMerge = require('tailwind-merge').twMerge;

describe('cn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should merge classes using clsx and twMerge', () => {
    const inputs = ['class1', 'class2'];
    const clsxResult = 'clsx-result';
    const mergedResult = 'merged-result';

    mockClsx.mockReturnValue(clsxResult);
    mockTwMerge.mockReturnValue(mergedResult);

    const result = cn(...inputs);

    expect(mockClsx).toHaveBeenCalledWith(inputs);
    expect(mockTwMerge).toHaveBeenCalledWith(clsxResult);
    expect(result).toBe(mergedResult);
  });

  it('should handle empty inputs', () => {
    const clsxResult = '';
    const mergedResult = '';

    mockClsx.mockReturnValue(clsxResult);
    mockTwMerge.mockReturnValue(mergedResult);

    const result = cn();

    expect(mockClsx).toHaveBeenCalledWith([]);
    expect(mockTwMerge).toHaveBeenCalledWith(clsxResult);
    expect(result).toBe(mergedResult);
  });

  it('should handle single input', () => {
    const inputs = ['single-class'];
    const clsxResult = 'single-class';
    const mergedResult = 'single-class';

    mockClsx.mockReturnValue(clsxResult);
    mockTwMerge.mockReturnValue(mergedResult);

    const result = cn(...inputs);

    expect(mockClsx).toHaveBeenCalledWith(inputs);
    expect(mockTwMerge).toHaveBeenCalledWith(clsxResult);
    expect(result).toBe(mergedResult);
  });
});

describe('hoursRange', () => {
  it('should generate default range from 6 to 22', () => {
    const result = hoursRange();
    expect(result).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]);
  });

  it('should generate custom range', () => {
    const result = hoursRange(8, 12);
    expect(result).toEqual([8, 9, 10, 11, 12]);
  });

  it('should handle single hour range', () => {
    const result = hoursRange(10, 10);
    expect(result).toEqual([10]);
  });

  it('should handle edge case with start greater than end', () => {
    const result = hoursRange(15, 10);
    expect(result).toEqual([]);
  });
});

describe('timeToLabel', () => {
  it('should convert 0 to 12:00 AM', () => {
    expect(timeToLabel(0)).toBe('12:00 AM');
  });

  it('should convert 12 to 12:00 PM', () => {
    expect(timeToLabel(12)).toBe('12:00 PM');
  });

  it('should convert 6 to 6:00 AM', () => {
    expect(timeToLabel(6)).toBe('6:00 AM');
  });

  it('should convert 18 to 6:00 PM', () => {
    expect(timeToLabel(18)).toBe('6:00 PM');
  });

  it('should handle hours greater than 24', () => {
    expect(timeToLabel(25)).toBe('1:00 AM');
  });

  it('should handle negative hours', () => {
    expect(timeToLabel(-1)).toBe('11:00 PM');
  });

  it('should convert 23 to 11:00 PM', () => {
    expect(timeToLabel(23)).toBe('11:00 PM');
  });

  it('should convert 11 to 11:00 AM', () => {
    expect(timeToLabel(11)).toBe('11:00 AM');
  });
});

describe('isoDate', () => {
  it('should format date to ISO string with minutes, seconds, milliseconds set to 0', () => {
    const date = new Date('2023-10-21T14:30:45.123Z');
    const result = isoDate(date);
    expect(result).toBe('2023-10-21T14:00:00.000Z');
  });

  it('should handle date with different timezone', () => {
    const date = new Date('2023-10-21T14:30:45.123+02:00');
    const result = isoDate(date);
    // Note: toISOString() converts to UTC
    expect(result).toBe('2023-10-21T12:00:00.000Z');
  });

  it('should handle date at midnight', () => {
    const date = new Date('2023-10-21T00:00:00.000Z');
    const result = isoDate(date);
    expect(result).toBe('2023-10-21T00:00:00.000Z');
  });

  it('should not modify the original date object', () => {
    const originalDate = new Date('2023-10-21T14:30:45.123Z');
    const originalTime = originalDate.getTime();
    isoDate(originalDate);
    expect(originalDate.getTime()).toBe(originalTime);
  });
});