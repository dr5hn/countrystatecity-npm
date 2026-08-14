import { describe, it, expect } from 'vitest';
import { ChangesResource } from '../../../src/resources/changes';
import { ValidationError } from '../../../src/errors';
import { createFakeHttp } from '../support/fakeHttp';

describe('ChangesResource.list', () => {
  it('requests /changes with validated params, mapped to their wire names', async () => {
    const http = createFakeHttp();
    await new ChangesResource(http).list({
      startDate: '2026-08-01T00:00:00Z',
      placeType: 'city',
      countryCode: 'in',
      changeType: 'renamed',
      limit: 20,
      nextPageToken: 'tok_abc',
    });
    expect(http.request).toHaveBeenCalledWith(
      ['changes'],
      {
        start_date: '2026-08-01T00:00:00Z',
        place_type: 'city',
        country_code: 'IN',
        change_type: 'renamed',
        limit: 20,
        next_page_token: 'tok_abc',
      },
      undefined,
    );
  });

  it('requests /changes with no params', async () => {
    const http = createFakeHttp();
    await new ChangesResource(http).list();
    expect(http.request).toHaveBeenCalledWith(
      ['changes'],
      {
        start_date: undefined,
        place_type: undefined,
        country_code: undefined,
        change_type: undefined,
        limit: undefined,
        next_page_token: undefined,
      },
      undefined,
    );
  });

  it('rejects a malformed startDate before any request', async () => {
    const http = createFakeHttp();
    await expect(new ChangesResource(http).list({ startDate: 'not-a-date' })).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });

  it('rejects a malformed countryCode before any request', async () => {
    const http = createFakeHttp();
    await expect(new ChangesResource(http).list({ countryCode: 'IND' })).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range limit before any request', async () => {
    const http = createFakeHttp();
    await expect(new ChangesResource(http).list({ limit: 150 })).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });
});
