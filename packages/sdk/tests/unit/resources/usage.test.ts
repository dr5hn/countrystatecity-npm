import { describe, it, expect, vi } from 'vitest';
import { UsageResource } from '../../../src/resources/usage';
import { createFakeHttp } from '../support/fakeHttp';

describe('UsageResource.get', () => {
  it('falls back to a network request when no cached rate-limit meta exists', async () => {
    const http = createFakeHttp({ data: { dailyUsed: 1, dailyLimit: 100, monthlyUsed: 1, monthlyLimit: 1000 }, meta: { retryCount: 0 } });
    await new UsageResource(http).get();
    expect(http.request).toHaveBeenCalledWith(['usage'], undefined, undefined);
  });

  it('returns the cached snapshot at zero network cost when a full rate-limit meta is available', async () => {
    const http = createFakeHttp();
    http.getLastMeta = vi.fn().mockReturnValue({
      requestId: 'req_1',
      rateLimit: { dailyUsed: 3, dailyLimit: 100, monthlyUsed: 30, monthlyLimit: 1000 },
      retryCount: 0,
    });

    const result = await new UsageResource(http).get();

    expect(http.request).not.toHaveBeenCalled();
    expect(result.data).toEqual({ dailyUsed: 3, dailyLimit: 100, monthlyUsed: 30, monthlyLimit: 1000 });
  });

  it('falls back to a network request when the cached meta is only partial', async () => {
    const http = createFakeHttp();
    http.getLastMeta = vi.fn().mockReturnValue({ rateLimit: { dailyUsed: 3 }, retryCount: 0 });

    await new UsageResource(http).get();
    expect(http.request).toHaveBeenCalledWith(['usage'], undefined, undefined);
  });
});
