import { describe, it, expect } from 'vitest';
import { IsoResource } from '../../../src/resources/iso';
import { ValidationError } from '../../../src/errors';
import { createFakeHttp } from '../support/fakeHttp';

describe('IsoResource.lookup', () => {
  it('looks up by iso2', async () => {
    const http = createFakeHttp();
    await new IsoResource(http).lookup({ iso2: 'in' });
    expect(http.request).toHaveBeenCalledWith(['iso', 'iso2', 'IN'], undefined, undefined);
  });

  it('looks up by iso3', async () => {
    const http = createFakeHttp();
    await new IsoResource(http).lookup({ iso3: 'ind' });
    expect(http.request).toHaveBeenCalledWith(['iso', 'iso3', 'IND'], undefined, undefined);
  });

  it('looks up by numeric code', async () => {
    const http = createFakeHttp();
    await new IsoResource(http).lookup({ numeric: '356' });
    expect(http.request).toHaveBeenCalledWith(['iso', 'numeric', '356'], undefined, undefined);
  });

  it('rejects a lookup with no key before any request', async () => {
    const http = createFakeHttp();
    await expect(new IsoResource(http).lookup({})).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });

  it('prefers iso2 when multiple keys are provided', async () => {
    const http = createFakeHttp();
    await new IsoResource(http).lookup({ iso2: 'in', iso3: 'usa' });
    expect(http.request).toHaveBeenCalledWith(['iso', 'iso2', 'IN'], undefined, undefined);
  });
});
