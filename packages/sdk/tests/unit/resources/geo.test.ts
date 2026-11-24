import { describe, expect, it, vi } from 'vitest';
import { CSCClient, ValidationError } from '../../../src';

/** Exercise the actual SDK transport with a fetch stub; never contact a live API. */
function setup(body: unknown = []) {
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify(body), {
    headers: { 'x-csc-daily-used': '7', 'x-csc-data-version': 'test-export' },
  }));
  return { fetch, client: new CSCClient({ apiKey: 'test-only', baseUrl: 'https://example.invalid/v1', fetch, retry: false }) };
}

describe('county and postcode REST contracts', () => {
  it('retains all multi-state county memberships and nullable primary links', async () => {
    const county = { id: '14024', name: 'Taupō', country_id: '158', country_code: 'NZ',
      state_id: null, state_code: null, states: [{ id: '4060', name: 'Manawatu-Whanganui', code: 'MWT' },
        { id: '4061', name: 'Waikato', code: 'WKO' }] };
    const { client, fetch } = setup([county]);
    const result = await client.counties.list({ country: 'nz', state: 'wko', q: ' Taupō ',
      fields: ['id', 'name', 'states'], sort: ['name:asc'], locale: 'fr' });
    expect(result.data).toEqual([county]);
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/v1/countries/NZ/states/WKO/counties');
    expect(Object.fromEntries(url.searchParams)).toEqual({ q: 'Taupō', fields: 'id,name,states', sort: 'name:asc', locale: 'fr' });
    expect(result.meta.rateLimit?.dailyUsed).toBe(7);
    expect(result.meta.dataVersion).toBe('test-export');
  });

  it('routes detail and linked cities without inventing pagination or city relationships', async () => {
    const city = { id: '1', name: 'Example', kind: 'settlement', county_id: '14024', state_id: null,
      state_code: null, population: '24000', population_year: 2023 };
    const { client, fetch } = setup([city]);
    const signal = new AbortController().signal;
    await client.counties.get('NZ', 14024, { includeTranslations: true });
    const response = await client.counties.cities('NZ', '14024', { kind: 'settlement', type: 'town', q: 'Ex',
      fields: ['county_id', 'population_year'] }, { signal });
    expect(response.data).toEqual([city]);
    expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/v1/countries/NZ/counties/14024');
    expect(new URL(fetch.mock.calls[1][0]).pathname).toBe('/v1/countries/NZ/counties/14024/cities');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('preserves duplicate postcode matches and both levels of metadata', async () => {
    const matches = { data: [{ id: '670116', code: '11104', locality_name: 'Watinapaha', city_id: null },
      { id: '670117', code: '11104', locality_name: 'Wattala', city_id: null }],
    meta: { country_code: 'LK', query: '11104', match_count: 2 } };
    const { client, fetch } = setup(matches);
    const result = await client.postcodes.get('lk', '11104');
    expect(result.data).toEqual(matches);
    expect(result.meta.rateLimit?.dailyUsed).toBe(7);
    expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/v1/countries/LK/postcodes/11104');
  });

  it('round-trips opaque cursors and 64-bit city IDs without auto-fetching pages', async () => {
    const cursor = 'payload.signature-_';
    const page = { data: [], pagination: { limit: 2, next_cursor: cursor, has_more: true } };
    const { client, fetch } = setup(page);
    const first = await client.postcodes.list({ country: 'in', q: ' 11 ', stateCode: ' dl ',
      cityId: '9223372036854775807', type: ' FULL ', limit: 2, fields: ['id', 'code'] });
    expect(first.data).toEqual(page);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(Object.fromEntries(new URL(fetch.mock.calls[0][0]).searchParams)).toEqual({ q: '11', state_code: 'DL',
      city_id: '9223372036854775807', type: 'full', limit: '2', fields: 'id,code' });
    await client.postcodes.list({ country: 'IN', cursor: first.data.pagination.next_cursor! });
    expect(new URL(fetch.mock.calls[1][0]).searchParams.get('cursor')).toBe(cursor);
  });

  it('encodes a postcode with spaces as one path segment', async () => {
    const { client, fetch } = setup();
    await client.postcodes.get('gb', ' SW1A 1AA ');
    expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/v1/countries/GB/postcodes/SW1A%201AA');
  });

  it.each(['0', '-1', '1e3', '0x10', '1/2', '9007199254740992', 1.2, null])('rejects invalid county ID %s locally', async (id) => {
    const { client, fetch } = setup();
    await expect(client.counties.get('NZ', id as never)).rejects.toBeInstanceOf(ValidationError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['', '../x', 'a/b', 'a\\b', 'x\u0000y', 'x\u007fy', 'x'.repeat(21), null])('rejects invalid postcode %s locally', async (code) => {
    const { client, fetch } = setup();
    await expect(client.postcodes.get('IN', code as never)).rejects.toBeInstanceOf(ValidationError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([{ country: 'IND' }, { country: 'IN', limit: 0 }, { country: 'IN', limit: 101 },
    { country: 'IN', cityId: 123 }, { country: 'IN', cityId: '9223372036854775808' },
    { country: 'IN', cursor: '' }, { country: 'IN', cursor: 'x'.repeat(4097) },
    { country: 'IN', stateCode: 'D/L' }, { country: 'IN', q: 'x' }, { country: 'IN', type: 'a/b' },
    { country: 'IN', fields: 'id,code' }, null, []])('rejects invalid postcode params %s locally', async (params) => {
    const { client, fetch } = setup();
    await expect(client.postcodes.list(params as never)).rejects.toBeInstanceOf(ValidationError);
    expect(fetch).not.toHaveBeenCalled();
  });
});
