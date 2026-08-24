import { BaseResource } from './BaseResource';
import { assertIso2, assertStateCode, assertListParams, assertRequiredWith, assertLocalizationParams } from '../validation/assertions';
import { ValidationError } from '../errors';
import type { ICity } from '../types/entities';
import type { IListCitiesParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class CitiesResource extends BaseResource {
  /** Lists cities within a country because the API has no global city route. */
  async list(params: IListCitiesParams, opts?: IRequestOptions): Promise<CSCResponse<ICity[]>> {
    assertListParams(params);
    const localization = assertLocalizationParams(params);
    if (params.country === undefined) {
      throw new ValidationError('country is required — the API has no endpoint for listing cities globally', {
        field: 'country',
        value: params.country,
        reason: 'required',
      });
    }
    assertRequiredWith(params.state, 'state', params.country, 'country');

    const country = assertIso2(params.country);
    const state = params.state !== undefined ? assertStateCode(params.state) : undefined;
    const query = {
      kind: params.kind,
      limit: params.limit,
      offset: params.offset,
      fields: params.fields?.join(','),
      sort: params.sort?.join(','),
      ...(localization ?? {}),
    };

    if (state) {
      return this.http.request(['countries', country, 'states', state, 'cities'], query, opts);
    }
    return this.http.request(['countries', country, 'cities'], query, opts);
  }

  /**
   * @deprecated The API has no single-city endpoint. Use `list()` and find
   * the required city by its stable ID.
   * Always throws with guidance instead of making a request that will 404.
   */
  async get(_country: string, _stateCode: string, _cityId: number | string, _opts?: IRequestOptions): Promise<CSCResponse<ICity>> {
    throw new ValidationError(
      'cities.get() is not supported by the API — there is no single-city-by-ID endpoint. Use cities.list({ country, state }) and find the city in the results instead.',
      { field: 'cityId', reason: 'unsupported_endpoint' },
    );
  }
}
