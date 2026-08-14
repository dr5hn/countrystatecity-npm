import { BaseResource } from './BaseResource';
import { assertIso2, assertStateCode, assertListParams } from '../validation/assertions';
import type { IState } from '../types/entities';
import type { IListStatesParams, ILocalizationParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class StatesResource extends BaseResource {
  async list(params?: IListStatesParams, opts?: IRequestOptions): Promise<CSCResponse<IState[]>> {
    assertListParams(params);
    const query = {
      limit: params?.limit,
      offset: params?.offset,
      fields: params?.fields?.join(','),
      sort: params?.sort?.join(','),
      locale: params?.locale,
      include_translations: params?.includeTranslations,
    };

    if (params?.country !== undefined) {
      const country = assertIso2(params.country);
      return this.http.request(['countries', country, 'states'], query, opts);
    }
    return this.http.request(['states'], query, opts);
  }

  async get(country: string, stateCode: string, params?: ILocalizationParams, opts?: IRequestOptions): Promise<CSCResponse<IState>> {
    const countryCode = assertIso2(country);
    const code = assertStateCode(stateCode);
    return this.http.request(
      ['countries', countryCode, 'states', code],
      { locale: params?.locale, include_translations: params?.includeTranslations },
      opts,
    );
  }
}
