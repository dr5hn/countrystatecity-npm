import { BaseResource } from './BaseResource';
import { assertIso2, assertDialCode } from '../validation/assertions';
import type { IPhonecode } from '../types/entities';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class PhoneResource extends BaseResource {
  async list(opts?: IRequestOptions): Promise<CSCResponse<IPhonecode[]>> {
    return this.http.request(['phonecodes'], undefined, opts);
  }

  async get(iso2: string, opts?: IRequestOptions): Promise<CSCResponse<IPhonecode>> {
    const country = assertIso2(iso2);
    return this.http.request(['phonecodes', country], undefined, opts);
  }

  async byDialCode(dialCode: string, opts?: IRequestOptions): Promise<CSCResponse<IPhonecode[]>> {
    const code = assertDialCode(dialCode);
    return this.http.request(['phonecodes'], { dialCode: code }, opts);
  }
}
