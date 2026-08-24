import { BaseResource } from './BaseResource';
import { assertIso2, assertListParams, assertLocalizationParams } from '../validation/assertions';
import { splitLocalizationOptions } from './localizationOptions';
import type { ICountry } from '../types/entities';
import type { IListCountriesParams, ILocalizationParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class CountriesResource extends BaseResource {
  async list(params?: IListCountriesParams, opts?: IRequestOptions): Promise<CSCResponse<ICountry[]>> {
    assertListParams(params);
    const localization = assertLocalizationParams(params);
    return this.http.request(
      ['countries'],
      {
        limit: params?.limit,
        offset: params?.offset,
        fields: params?.fields?.join(','),
        sort: params?.sort?.join(','),
        ...(localization ?? {}),
      },
      opts,
    );
  }

  async get(
    iso2: string,
    paramsOrOpts?: ILocalizationParams | IRequestOptions,
    opts?: IRequestOptions,
  ): Promise<CSCResponse<ICountry>> {
    const code = assertIso2(iso2);
    const { localization, requestOptions } = splitLocalizationOptions(paramsOrOpts, opts);
    return this.http.request(
      ['countries', code],
      assertLocalizationParams(localization),
      requestOptions,
    );
  }
}
