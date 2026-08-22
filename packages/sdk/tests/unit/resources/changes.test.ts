import { describe, it, expect } from 'vitest';
import { ChangesResource } from '../../../src/resources/changes';
import { ValidationError } from '../../../src/errors';
import { createFakeHttp } from '../support/fakeHttp';

describe('ChangesResource.list', () => {
  it('requests /changes with validated params', async () => {
    const http = createFakeHttp();
    await new ChangesResource(http).list({ since: '2026-08-01', resource: 'cities', limit: 20 });
    expect(http.request).toHaveBeenCalledWith(
      ['changes'],
      { since: '2026-08-01', resource: 'cities', limit: 20, offset: undefined },
      undefined,
    );
  });

  it('requests /changes with no params', async () => {
    const http = createFakeHttp();
    await new ChangesResource(http).list();
    expect(http.request).toHaveBeenCalledWith(['changes'], { since: undefined, resource: undefined, limit: undefined, offset: undefined }, undefined);
  });

  it('rejects a malformed since date before any request', async () => {
    const http = createFakeHttp();
    await expect(new ChangesResource(http).list({ since: 'not-a-date' })).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });
});
