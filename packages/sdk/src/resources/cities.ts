import { BaseResource } from './BaseResource';
import { assertIso2, assertStateCode, assertListParams, assertRequiredWith } from '../validation/assertions';
import type { ICity } from '../types/entities';
import type { IListCitiesParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class CitiesResource extends BaseResource {
  async list(params?: IListCitiesParams, opts?: IRequestOptions): Promise<CSCResponse<ICity[]>> {
    assertListParams(params);
    assertRequiredWith(params?.state, 'state', params?.country, 'country');

    const country = params?.country !== undefined ? assertIso2(params.country) : undefined;
    const state = params?.state !== undefined ? assertStateCode(params.state) : undefined;
    const query = {
      kind: params?.kind,
      limit: params?.limit,
      offset: params?.offset,
      fields: params?.fields?.join(','),
      sort: params?.sort?.join(','),
      locale: params?.locale,
      include_translations: params?.includeTranslations,
    };

    if (country && state) {
      return this.http.request(['countries', country, 'states', state, 'cities'], query, opts);
    }
    if (country) {
      return this.http.request(['countries', country, 'cities'], query, opts);
    }
    return this.http.request(['cities'], query, opts);
  }

  /**
   * No `locale`/`includeTranslations` here (unlike `list()` above) — the
   * real API has no single-city-by-ID GET endpoint at all (pre-existing,
   * predates this method's own addition; out of scope to fix here).
   */
  async get(country: string, stateCode: string, cityId: number | string, opts?: IRequestOptions): Promise<CSCResponse<ICity>> {
    const countryCode = assertIso2(country);
    const code = assertStateCode(stateCode);
    return this.http.request(['countries', countryCode, 'states', code, 'cities', cityId], undefined, opts);
  }
}
