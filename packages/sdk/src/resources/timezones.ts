import { BaseResource } from './BaseResource';
import { assertIso2, assertTimezoneName, assertIsoDateString } from '../validation/assertions';
import type { ITimezone, IConvertedTime } from '../types/entities';
import type { ITimezoneConvertParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class TimezonesResource extends BaseResource {
  async list(opts?: IRequestOptions): Promise<CSCResponse<ITimezone[]>> {
    return this.http.request(['timezones'], undefined, opts);
  }

  async byCountry(iso2: string, opts?: IRequestOptions): Promise<CSCResponse<ITimezone[]>> {
    const country = assertIso2(iso2);
    return this.http.request(['countries', country, 'timezones'], undefined, opts);
  }

  async convert(params: ITimezoneConvertParams, opts?: IRequestOptions): Promise<CSCResponse<IConvertedTime>> {
    const time = assertIsoDateString(params.time, 'time');
    const from = assertTimezoneName(params.from, 'from');
    const to = assertTimezoneName(params.to, 'to');
    return this.http.request(['timezones', 'convert'], { time, from, to }, opts);
  }
}
