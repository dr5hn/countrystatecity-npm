import { BaseResource } from './BaseResource';
import { assertIso2 } from '../validation/assertions';
import { assertGeo, assertGeoParams, geoQuery, geoSelection } from '../validation/geo';
import type { IPostcodeMatches, IPostcodePage } from '../types/entities';
import type { IListPostcodesParams, IPostcodeParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class PostcodesResource extends BaseResource {
  /** Look up an exact code, preserving all matching localities and match metadata. */
  async get(country: string, code: string, params?: IPostcodeParams, opts?: IRequestOptions): Promise<CSCResponse<IPostcodeMatches>> {
    assertGeoParams(params);
    assertGeo(typeof code === 'string' && code.trim().length >= 1 && code.trim().length <= 20 &&
      !/[\\/\x00-\x1f\x7f]/.test(code.trim()), 'code', code, 'must contain 1–20 characters without slashes or control characters');
    return this.http.request(['countries', assertIso2(country), 'postcodes', code.trim()],
      { fields: geoSelection(params?.fields, 'fields') }, opts);
  }

  /** Fetch one cursor page (Starter+); pass its next_cursor to list() to continue. */
  async list(params: IListPostcodesParams, opts?: IRequestOptions): Promise<CSCResponse<IPostcodePage>> {
    assertGeoParams(params);
    const country = assertIso2(params?.country);
    const { limit, cursor, cityId, stateCode, type } = params;
    assertGeo(limit === undefined || (Number.isInteger(limit) && limit >= 1 && limit <= 100), 'limit', limit, 'must be an integer from 1 to 100');
    assertGeo(cursor === undefined || (typeof cursor === 'string' && cursor.length >= 1 && cursor.length <= 4096), 'cursor', cursor, 'must contain 1–4096 characters');
    assertGeo(cityId === undefined || (typeof cityId === 'string' && /^[1-9]\d*$/.test(cityId.trim()) &&
      BigInt(cityId.trim()) <= 9223372036854775807n), 'cityId', cityId, 'must be a positive 64-bit integer string');
    assertGeo(stateCode === undefined || (typeof stateCode === 'string' && /^[A-Za-z0-9-]{1,255}$/.test(stateCode.trim())),
      'stateCode', stateCode, 'must contain 1–255 letters, numbers or hyphens');
    assertGeo(type === undefined || (typeof type === 'string' && /^[a-z0-9_-]{1,32}$/i.test(type.trim())),
      'type', type, 'must contain 1–32 letters, numbers, hyphens or underscores');
    return this.http.request(['countries', country, 'postcodes'],
      { q: geoQuery(params.q), state_code: stateCode?.trim().toUpperCase(), city_id: cityId?.trim(),
        type: type?.trim().toLowerCase(), limit, cursor, fields: geoSelection(params.fields, 'fields') }, opts);
  }
}
