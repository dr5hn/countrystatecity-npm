import { describe, it, expect } from 'vitest';
import { CurrenciesResource } from '../../../src/resources/currencies';
import { ValidationError } from '../../../src/errors';
import { createFakeHttp } from '../support/fakeHttp';

describe('CurrenciesResource', () => {
  it('list() requests /currencies', async () => {
    const http = createFakeHttp();
    await new CurrenciesResource(http).list();
    expect(http.request).toHaveBeenCalledWith(['currencies'], undefined, undefined);
  });

  it('get() normalizes the currency code', async () => {
    const http = createFakeHttp();
    await new CurrenciesResource(http).get('usd');
    expect(http.request).toHaveBeenCalledWith(['currencies', 'USD'], undefined, undefined);
  });

  it('byCountry() requests /countries/{code}/currencies', async () => {
    const http = createFakeHttp();
    await new CurrenciesResource(http).byCountry('in');
    expect(http.request).toHaveBeenCalledWith(['countries', 'IN', 'currencies'], undefined, undefined);
  });

  it('get() rejects a malformed currency code before any request', async () => {
    const http = createFakeHttp();
    await expect(new CurrenciesResource(http).get('US')).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });
});
