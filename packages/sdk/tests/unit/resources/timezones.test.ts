import { describe, it, expect } from 'vitest';
import { TimezonesResource } from '../../../src/resources/timezones';
import { ValidationError } from '../../../src/errors';
import { createFakeHttp } from '../support/fakeHttp';

describe('TimezonesResource', () => {
  it('list() requests /timezones', async () => {
    const http = createFakeHttp();
    await new TimezonesResource(http).list();
    expect(http.request).toHaveBeenCalledWith(['timezones'], undefined, undefined);
  });

  it('byCountry() requests /countries/{code}/timezones', async () => {
    const http = createFakeHttp();
    await new TimezonesResource(http).byCountry('in');
    expect(http.request).toHaveBeenCalledWith(['countries', 'IN', 'timezones'], undefined, undefined);
  });

  it('convert() requests /timezones/convert with validated params', async () => {
    const http = createFakeHttp();
    await new TimezonesResource(http).convert({ time: '2026-08-12T10:00:00Z', from: 'UTC', to: 'Asia/Kolkata' });
    expect(http.request).toHaveBeenCalledWith(
      ['timezones', 'convert'],
      { time: '2026-08-12T10:00:00Z', from: 'UTC', to: 'Asia/Kolkata' },
      undefined,
    );
  });

  it('convert() rejects an invalid timezone name before any request', async () => {
    const http = createFakeHttp();
    await expect(
      new TimezonesResource(http).convert({ time: '2026-08-12T10:00:00Z', from: 'Not/Real', to: 'UTC' }),
    ).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });

  it('convert() rejects a malformed time string before any request', async () => {
    const http = createFakeHttp();
    await expect(
      new TimezonesResource(http).convert({ time: 'not-a-date', from: 'UTC', to: 'UTC' }),
    ).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });
});
