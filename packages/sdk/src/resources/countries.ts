import { BaseResource } from './BaseResource';
import { assertIso2, assertListParams } from '../validation/assertions';
import type { ICountry } from '../types/entities';
import type { IListCountriesParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class CountriesResource extends BaseResource {
  async list(params?: IListCountriesParams, opts?: IRequestOptions): Promise<CSCResponse<ICountry[]>> {
    assertListParams(params);
    return this.http.request(
      ['countries'],
      {
        limit: params?.limit,
        offset: params?.offset,
        fields: params?.fields?.join(','),
        sort: params?.sort?.join(','),
      },
      opts,
    );
  }

  async get(iso2: string, opts?: IRequestOptions): Promise<CSCResponse<ICountry>> {
    const code = assertIso2(iso2);
    return this.http.request(['countries', code], undefined, opts);
  }
}
