import { BaseResource } from './BaseResource';
import { assertIso2, assertStateCode, assertListParams, assertRequiredWith } from '../validation/assertions';
import { ValidationError } from '../errors';
import type { ICity } from '../types/entities';
import type { IListCitiesParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class CitiesResource extends BaseResource {
  /**
   * `country` is required (unlike `countries.list()`/`states.list()`) —
   * verified against the real API's routes: there is no bare `GET /cities`.
   * Failing fast here beats a network round-trip that would always 404.
   */
  async list(params: IListCitiesParams, opts?: IRequestOptions): Promise<CSCResponse<ICity[]>> {
    assertListParams(params);
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
      locale: params.locale,
      include_translations: params.includeTranslations,
    };

    if (state) {
      return this.http.request(['countries', country, 'states', state, 'cities'], query, opts);
    }
    return this.http.request(['countries', country, 'cities'], query, opts);
  }

  /**
   * Always throws — verified against the real API's routes: there is no
   * single-city-by-ID GET endpoint at all, under any path shape. Kept as a
   * method (rather than removed) so this fails with a clear, actionable
   * error instead of silently disappearing from the public API or 404ing
   * confusingly over the network. Fetch the containing list and find the
   * city client-side instead: `cities.list({ country, state })`.
   */
  async get(_country: string, _stateCode: string, _cityId: number | string, _opts?: IRequestOptions): Promise<CSCResponse<ICity>> {
    throw new ValidationError(
      'cities.get() is not supported by the API — there is no single-city-by-ID endpoint. Use cities.list({ country, state }) and find the city in the results instead.',
      { field: 'cityId', reason: 'unsupported_endpoint' },
    );
  }
}
