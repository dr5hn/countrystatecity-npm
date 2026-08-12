import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../../src/client';
import { ValidationError, NotFoundError } from '../../../src/errors';
import { installMockCscApi } from '../support/mockCscApi';
import { SAMPLE_CHANGE_EVENT } from '../support/fixtures';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('changes — integration (@beta)', () => {
  it('resolves a changes listing end-to-end when the endpoint is available', async () => {
    installMockCscApi({ '/v1/changes': { body: [SAMPLE_CHANGE_EVENT] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    const result = await csc.changes.list({ since: '2026-08-01', resource: 'cities' });
    expect(result.data).toEqual([SAMPLE_CHANGE_EVENT]);
  });

  it('surfaces NotFoundError, not a crash, when the endpoint is not yet available on an account', async () => {
    installMockCscApi({ '/v1/changes': { status: 404, body: { resource: 'changes' } } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.changes.list()).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects a malformed since date before any network call', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/changes': { body: [] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.changes.list({ since: 'not-a-date' })).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
