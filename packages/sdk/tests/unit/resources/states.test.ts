import { describe, it, expect } from 'vitest';
import { StatesResource } from '../../../src/resources/states';
import { ValidationError } from '../../../src/errors';
import { createFakeHttp } from '../support/fakeHttp';

describe('StatesResource', () => {
  it('list() without a country requests /states', async () => {
    const http = createFakeHttp();
    await new StatesResource(http).list({ limit: 20 });
    expect(http.request).toHaveBeenCalledWith(['states'], { limit: 20, offset: undefined }, undefined);
  });

  it('list({ country }) requests /countries/{code}/states', async () => {
    const http = createFakeHttp();
    await new StatesResource(http).list({ country: 'us' });
    expect(http.request).toHaveBeenCalledWith(['countries', 'US', 'states'], { limit: undefined, offset: undefined }, undefined);
  });

  it('list() joins fields/sort arrays into comma-separated query params', async () => {
    const http = createFakeHttp();
    await new StatesResource(http).list({ country: 'us', fields: ['name', 'iso2'], sort: ['name:desc'] });
    expect(http.request).toHaveBeenCalledWith(
      ['countries', 'US', 'states'],
      { limit: undefined, offset: undefined, fields: 'name,iso2', sort: 'name:desc' },
      undefined,
    );
  });

  it('get() requests /countries/{code}/states/{stateCode}', async () => {
    const http = createFakeHttp();
    await new StatesResource(http).get('us', 'ca');
    expect(http.request).toHaveBeenCalledWith(['countries', 'US', 'states', 'CA'], undefined, undefined);
  });

  it('rejects a malformed country before any request', async () => {
    const http = createFakeHttp();
    await expect(new StatesResource(http).get('USA-X', 'CA')).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });
});
