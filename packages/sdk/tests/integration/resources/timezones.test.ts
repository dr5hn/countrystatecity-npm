import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../../src/client';
import { ValidationError } from '../../../src/errors';
import { installMockCscApi } from '../support/mockCscApi';
import { KOLKATA_TZ } from '../support/fixtures';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('timezones — integration', () => {
  it('resolves timezone lookups and conversion end-to-end', async () => {
    installMockCscApi({
      '/v1/timezones': { body: [KOLKATA_TZ] },
      '/v1/countries/IN/timezones': { body: [KOLKATA_TZ] },
      '/v1/timezones/convert': {
        body: { sourceTime: '2026-08-12T10:00:00Z', sourceTimezone: 'UTC', targetTime: '2026-08-12T15:30:00+05:30', targetTimezone: 'Asia/Kolkata' },
      },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    expect((await csc.timezones.list()).data).toEqual([KOLKATA_TZ]);
    expect((await csc.timezones.byCountry('in')).data).toEqual([KOLKATA_TZ]);

    const converted = await csc.timezones.convert({ time: '2026-08-12T10:00:00Z', from: 'UTC', to: 'Asia/Kolkata' });
    expect(converted.data.targetTimezone).toBe('Asia/Kolkata');
  });

  it('rejects an invalid IANA timezone name before any network call', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/timezones/convert': { body: {} } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.timezones.convert({ time: '2026-08-12T10:00:00Z', from: 'Not/Real', to: 'UTC' })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
