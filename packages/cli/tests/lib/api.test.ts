import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock config
vi.mock('../../src/lib/config.js', () => ({
  getApiKey: vi.fn(() => 'test-api-key'),
  getApiBase: vi.fn(() => 'https://api.countrystatecity.in/v1'),
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
  AxiosError: class AxiosError extends Error {
    response: { status: number } | undefined;
    constructor(message: string, _code?: string, _config?: unknown, _request?: unknown, response?: { status: number }) {
      super(message);
      this.response = response;
    }
  },
}));

// Mock chalk to pass through
vi.mock('chalk', () => ({
  default: {
    red: (s: string) => s,
    yellow: (s: string) => s,
    dim: (s: string) => s,
  },
}));

import axios, { AxiosError } from 'axios';
import { get, validateKey } from '../../src/lib/api.js';
import { getApiKey } from '../../src/lib/config.js';

describe('api client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('makes authenticated GET requests with correct headers', async () => {
    const mockResponse = {
      data: { name: 'India' },
      headers: {},
    };
    vi.mocked(axios.get).mockResolvedValue(mockResponse);

    const result = await get('/countries/IN');
    expect(result.data).toEqual({ name: 'India' });
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.countrystatecity.in/v1/countries/IN',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-CSCAPI-KEY': 'test-api-key',
        }),
      })
    );
  });

  it('extracts usage info from response headers', async () => {
    const mockResponse = {
      data: {},
      headers: {
        'x-csc-daily-used': '47',
        'x-csc-daily-limit': '1000',
        'x-csc-monthly-used': '1230',
        'x-csc-monthly-limit': '30000',
      },
    };
    vi.mocked(axios.get).mockResolvedValue(mockResponse);

    const result = await get('/countries/IN');
    expect(result.usage).toEqual({
      dailyUsed: 47,
      dailyLimit: 1000,
      monthlyUsed: 1230,
      monthlyLimit: 30000,
    });
  });

  it('returns null usage when headers are missing', async () => {
    const mockResponse = {
      data: {},
      headers: {},
    };
    vi.mocked(axios.get).mockResolvedValue(mockResponse);

    const result = await get('/countries/IN');
    expect(result.usage).toBeNull();
  });

  it('returns null usage when only some headers present', async () => {
    const mockResponse = {
      data: {},
      headers: {
        'x-csc-daily-used': '47',
        'x-csc-daily-limit': '1000',
      },
    };
    vi.mocked(axios.get).mockResolvedValue(mockResponse);

    const result = await get('/countries/IN');
    expect(result.usage).toBeNull();
  });

  it('exits on 401 error', async () => {
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const error = new AxiosError('Unauthorized', undefined, undefined, undefined, { status: 401 } as never);
    vi.mocked(axios.get).mockRejectedValue(error);

    await expect(get('/countries/IN')).rejects.toThrow('exit');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('exits on 429 error', async () => {
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const error = new AxiosError('Too Many Requests', undefined, undefined, undefined, { status: 429 } as never);
    vi.mocked(axios.get).mockRejectedValue(error);

    await expect(get('/countries/IN')).rejects.toThrow('exit');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('exits on 404 error', async () => {
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const error = new AxiosError('Not Found', undefined, undefined, undefined, { status: 404 } as never);
    vi.mocked(axios.get).mockRejectedValue(error);

    await expect(get('/countries/IN')).rejects.toThrow('exit');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('exits on network error', async () => {
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    vi.mocked(axios.get).mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(get('/countries/IN')).rejects.toThrow('exit');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('exits when no API key is configured', async () => {
    vi.mocked(getApiKey).mockReturnValueOnce(undefined);
    vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(get('/countries/IN')).rejects.toThrow('exit');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  describe('validateKey', () => {
    it('returns valid:true for successful validation', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: { name: 'India' },
        headers: {
          'x-csc-daily-used': '10',
          'x-csc-daily-limit': '1000',
          'x-csc-monthly-used': '100',
          'x-csc-monthly-limit': '30000',
        },
      });

      const result = await validateKey('valid-key');
      expect(result.valid).toBe(true);
      expect(result.usage).toBeDefined();
    });

    it('returns valid:false for failed validation', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('401'));

      const result = await validateKey('invalid-key');
      expect(result.valid).toBe(false);
      expect(result.usage).toBeNull();
    });
  });
});
