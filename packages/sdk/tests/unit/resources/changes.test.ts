import { describe, expect, it } from 'vitest';
import { ChangesResource } from '../../../src/resources/changes';
import { ValidationError } from '../../../src/errors';
import { createFakeHttp } from '../support/fakeHttp';

describe('ChangesResource.list', () => {
  it('maps SDK parameter names to the API wire contract', async () => {
    const http = createFakeHttp();
    await new ChangesResource(http).list({
      startDate: '2026-08-01T00:00:00Z',
      placeType: 'city',
      countryCode: 'in',
      changeType: 'renamed',
      limit: 20,
      nextPageToken: 'token_abc-123',
    });

    expect(http.request).toHaveBeenCalledWith(
      ['changes'],
      {
        start_date: '2026-08-01T00:00:00.000Z',
        place_type: 'city',
        country_code: 'IN',
        change_type: 'renamed',
        limit: 20,
        next_page_token: 'token_abc-123',
      },
      undefined,
    );
  });

  it('supports an unfiltered first page', async () => {
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

  it.each([
    [{ startDate: 'not-a-date' }, 'startDate'],
    [{ startDate: '2026-08-01' }, 'startDate'],
    [{ countryCode: 'IND' }, 'countryCode'],
    [{ placeType: 'continent' }, 'placeType'],
    [{ changeType: 'updated' }, 'changeType'],
    [{ limit: 101 }, 'limit'],
    [{ nextPageToken: 'not a token' }, 'nextPageToken'],
  ])('rejects invalid %s before making a request', async (params, field) => {
    const http = createFakeHttp();
    await expect(new ChangesResource(http).list(params as never)).rejects.toMatchObject<Partial<ValidationError>>({ field });
    expect(http.request).not.toHaveBeenCalled();
  });
});
