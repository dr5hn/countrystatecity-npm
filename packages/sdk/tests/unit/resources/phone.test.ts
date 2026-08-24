import { describe, it, expect } from 'vitest';
import { PhoneResource } from '../../../src/resources/phone';
import { ValidationError } from '../../../src/errors';
import { createFakeHttp } from '../support/fakeHttp';

describe('PhoneResource', () => {
  it('list() requests /phonecodes', async () => {
    const http = createFakeHttp();
    await new PhoneResource(http).list();
    expect(http.request).toHaveBeenCalledWith(['phonecodes'], undefined, undefined);
  });

  it('get() normalizes the country code', async () => {
    const http = createFakeHttp();
    await new PhoneResource(http).get('in');
    expect(http.request).toHaveBeenCalledWith(['phonecodes', 'IN'], undefined, undefined);
  });

  it('byDialCode() passes the dial code as a query param', async () => {
    const http = createFakeHttp();
    await new PhoneResource(http).byDialCode('+91');
    expect(http.request).toHaveBeenCalledWith(['phonecodes'], { dialCode: '+91' }, undefined);
  });

  it('byDialCode() rejects a malformed dial code before any request', async () => {
    const http = createFakeHttp();
    await expect(new PhoneResource(http).byDialCode('0123')).rejects.toThrow(ValidationError);
    expect(http.request).not.toHaveBeenCalled();
  });
});
