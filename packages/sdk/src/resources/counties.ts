import { BaseResource } from './BaseResource';
import { assertIso2, assertStateCode, assertLocalizationParams } from '../validation/assertions';
import { assertGeoParams, countyId, geoQuery, geoSelection } from '../validation/geo';
import type { ICounty, ICity } from '../types/entities';
import type { ICountyParams, IListCountiesParams, ICountyCitiesParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class CountiesResource extends BaseResource {
  /** List all counties in a country or state, retaining every state membership. */
  async list(params: IListCountiesParams, opts?: IRequestOptions): Promise<CSCResponse<ICounty[]>> {
    assertGeoParams(params);
    const country = assertIso2(params?.country);
    const state = params.state === undefined ? undefined : assertStateCode(params.state);
    return this.http.request(
      state ? ['countries', country, 'states', state, 'counties'] : ['countries', country, 'counties'],
      { q: geoQuery(params.q), fields: geoSelection(params.fields, 'fields'), sort: geoSelection(params.sort, 'sort'),
        ...assertLocalizationParams(params) }, opts,
    );
  }

  /** Get one county by its stable ID within the requested country. */
  async get(country: string, id: string | number, params?: ICountyParams, opts?: IRequestOptions): Promise<CSCResponse<ICounty>> {
    assertGeoParams(params);
    return this.http.request(['countries', assertIso2(country), 'counties', countyId(id)],
      { fields: geoSelection(params?.fields, 'fields'), ...assertLocalizationParams(params) }, opts);
  }

  /** List only cities explicitly linked to this county in the source data. */
  async cities(country: string, id: string | number, params?: ICountyCitiesParams, opts?: IRequestOptions): Promise<CSCResponse<ICity[]>> {
    assertGeoParams(params);
    return this.http.request(['countries', assertIso2(country), 'counties', countyId(id), 'cities'],
      { q: geoQuery(params?.q), kind: params?.kind, type: params?.type,
        fields: geoSelection(params?.fields, 'fields'), sort: geoSelection(params?.sort, 'sort'),
        ...assertLocalizationParams(params) }, opts);
  }
}
