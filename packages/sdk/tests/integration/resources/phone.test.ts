import { describe, it, expect, afterEach, vi } from 'vitest';
import { createCSCClient } from '../../../src/client';
import { ValidationError } from '../../../src/errors';
import { installMockCscApi } from '../support/mockCscApi';
import { INDIA_PHONECODE } from '../support/fixtures';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('phone — integration', () => {
  it('resolves phone code lookups end-to-end', async () => {
    installMockCscApi({
      '/v1/phonecodes': { body: [INDIA_PHONECODE] },
      '/v1/phonecodes/IN': { body: INDIA_PHONECODE },
    });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    expect((await csc.phone.list()).data).toEqual([INDIA_PHONECODE]);
    expect((await csc.phone.get('in')).data).toEqual(INDIA_PHONECODE);
    expect((await csc.phone.byDialCode('+91')).data).toEqual([INDIA_PHONECODE]);
  });

  it('rejects a malformed dial code before any network call', async () => {
    const { fetchMock } = installMockCscApi({ '/v1/phonecodes': { body: [] } });
    const csc = createCSCClient({ apiKey: 'k', baseUrl: 'https://mock.test/v1' });

    await expect(csc.phone.byDialCode('0123')).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
