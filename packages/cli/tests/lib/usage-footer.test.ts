import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('chalk', () => ({
  default: {
    red: (s: string) => s,
    yellow: (s: string) => s,
    green: (s: string) => s,
    dim: (s: string) => s,
  },
}));

import { printUsageFooter, progressBar, getTierName, formatNumber } from '../../src/lib/usage-footer.js';

describe('usage-footer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTierName', () => {
    it('returns Community for 100 daily limit', () => {
      expect(getTierName(100)).toBe('Community');
    });

    it('returns Supporter for 1000 daily limit', () => {
      expect(getTierName(1000)).toBe('Supporter');
    });

    it('returns Professional for 3300 daily limit', () => {
      expect(getTierName(3300)).toBe('Professional');
    });

    it('returns Business for 25000 daily limit', () => {
      expect(getTierName(25000)).toBe('Business');
    });

    it('returns Starter for 300 daily limit', () => {
      expect(getTierName(300)).toBe('Starter');
    });

    it('returns Legacy for 50000 daily limit', () => {
      expect(getTierName(50000)).toBe('Legacy');
    });

    it('returns Custom for limits above 50000', () => {
      expect(getTierName(50001)).toBe('Custom');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1230)).toBe('1,230');
      expect(formatNumber(30000)).toBe('30,000');
    });
  });

  describe('progressBar', () => {
    it('generates correct bar at 0%', () => {
      const bar = progressBar(0, 1000);
      expect(bar).toContain('--------------------');
    });

    it('generates correct bar at 50%', () => {
      const bar = progressBar(500, 1000);
      expect(bar).toContain('==========');
      expect(bar).toContain('----------');
    });

    it('generates correct bar at 100%', () => {
      const bar = progressBar(1000, 1000);
      expect(bar).toContain('====================');
    });
  });

  describe('printUsageFooter', () => {
    it('shows nothing when usage is null', () => {
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      printUsageFooter(null);
      expect(process.stderr.write).not.toHaveBeenCalled();
    });

    it('shows dim grey text under 80%', () => {
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      printUsageFooter({ dailyUsed: 47, dailyLimit: 1000, monthlyUsed: 1230, monthlyLimit: 30000 });

      const allOutput = (process.stderr.write as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => String(c[0])).join('');
      expect(allOutput).toContain('47');
      expect(allOutput).toContain('1,000');
    });

    it('shows yellow warning at 80-99%', () => {
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      printUsageFooter({ dailyUsed: 850, dailyLimit: 1000, monthlyUsed: 5000, monthlyLimit: 30000 });

      const allOutput = (process.stderr.write as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => String(c[0])).join('');
      expect(allOutput).toContain('Warning');
      expect(allOutput).toContain('850');
    });

    it('shows red error at 100% for non-Community tier', () => {
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      printUsageFooter({ dailyUsed: 1000, dailyLimit: 1000, monthlyUsed: 10000, monthlyLimit: 30000 });

      const allOutput = (process.stderr.write as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => String(c[0])).join('');
      expect(allOutput).toContain('limit reached');
      expect(allOutput).toContain('a higher plan');
    });

    it('shows Supporter upgrade message at 100% for Community tier', () => {
      vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      printUsageFooter({ dailyUsed: 100, dailyLimit: 100, monthlyUsed: 3000, monthlyLimit: 3000 });

      const allOutput = (process.stderr.write as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => String(c[0])).join('');
      expect(allOutput).toContain('limit reached');
      expect(allOutput).toContain('Supporter ($9/mo)');
    });
  });
});
