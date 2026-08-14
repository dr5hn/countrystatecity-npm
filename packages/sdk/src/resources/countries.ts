import { BaseResource } from './BaseResource';
import { assertIso2, assertListParams } from '../validation/assertions';
import type { ICountry } from '../types/entities';
import type { IListCountriesParams, ILocalizationParams } from '../types/params';
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
        locale: params?.locale,
        include_translations: params?.includeTranslations,
      },
      opts,
    );
  }

  async get(iso2: string, params?: ILocalizationParams, opts?: IRequestOptions): Promise<CSCResponse<ICountry>> {
    const code = assertIso2(iso2);
    return this.http.request(
      ['countries', code],
      { locale: params?.locale, include_translations: params?.includeTranslations },
      opts,
    );
  }
}
