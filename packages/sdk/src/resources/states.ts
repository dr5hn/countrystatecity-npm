import { BaseResource } from './BaseResource';
import { assertIso2, assertStateCode, assertListParams, assertLocalizationParams } from '../validation/assertions';
import { splitLocalizationOptions } from './localizationOptions';
import type { IState } from '../types/entities';
import type { IListStatesParams, ILocalizationParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class StatesResource extends BaseResource {
  async list(params?: IListStatesParams, opts?: IRequestOptions): Promise<CSCResponse<IState[]>> {
    assertListParams(params);
    const localization = assertLocalizationParams(params);
    const query = {
      limit: params?.limit,
      offset: params?.offset,
      fields: params?.fields?.join(','),
      sort: params?.sort?.join(','),
      ...(localization ?? {}),
    };

    if (params?.country !== undefined) {
      const country = assertIso2(params.country);
      return this.http.request(['countries', country, 'states'], query, opts);
    }
    return this.http.request(['states'], query, opts);
  }

  async get(
    country: string,
    stateCode: string,
    paramsOrOpts?: ILocalizationParams | IRequestOptions,
    opts?: IRequestOptions,
  ): Promise<CSCResponse<IState>> {
    const countryCode = assertIso2(country);
    const code = assertStateCode(stateCode);
    const { localization, requestOptions } = splitLocalizationOptions(paramsOrOpts, opts);
    return this.http.request(
      ['countries', countryCode, 'states', code],
      assertLocalizationParams(localization),
      requestOptions,
    );
  }
}
