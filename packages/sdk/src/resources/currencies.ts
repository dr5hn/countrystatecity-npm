import { BaseResource } from './BaseResource';
import { assertCurrencyCode, assertIso2 } from '../validation/assertions';
import type { ICurrency } from '../types/entities';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class CurrenciesResource extends BaseResource {
  async list(opts?: IRequestOptions): Promise<CSCResponse<ICurrency[]>> {
    return this.http.request(['currencies'], undefined, opts);
  }

  async get(code: string, opts?: IRequestOptions): Promise<CSCResponse<ICurrency>> {
    const currencyCode = assertCurrencyCode(code);
    return this.http.request(['currencies', currencyCode], undefined, opts);
  }

  async byCountry(iso2: string, opts?: IRequestOptions): Promise<CSCResponse<ICurrency[]>> {
    const country = assertIso2(iso2);
    return this.http.request(['countries', country, 'currencies'], undefined, opts);
  }
}
