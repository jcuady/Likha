import { describe, expect, it } from 'vitest';
import { formatPHP } from '@/lib/currency';

describe('Philippine peso currency', () => {
  it('denominates monetary amounts in Philippine pesos, including financial visuals', () => {
    expect(formatPHP(4800)).toBe('₱4,800');
    expect(formatPHP(96437)).toBe('₱96,437');
    expect(formatPHP(1284500)).toBe('₱1,284,500');
    expect(formatPHP(242491)).toBe('₱242,491');
    expect(formatPHP(920000)).toBe('₱920,000');
  });
});