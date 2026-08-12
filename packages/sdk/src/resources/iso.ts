import { BaseResource } from './BaseResource';
import { assertIso2, assertIso3, assertNumericCode } from '../validation/assertions';
import { ValidationError } from '../errors';
import type { ICountry } from '../types/entities';
import type { IIsoLookupParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

/**
 * Cross-reference lookup of a country by ISO 3166-1 alpha-2, alpha-3, or
 * numeric code — distinct from `countries.get()`, which only accepts alpha-2.
 */
export class IsoResource extends BaseResource {
  async lookup(params: IIsoLookupParams, opts?: IRequestOptions): Promise<CSCResponse<ICountry>> {
    if (params.iso2 !== undefined) {
      return this.http.request(['iso', 'iso2', assertIso2(params.iso2)], undefined, opts);
    }
    if (params.iso3 !== undefined) {
      return this.http.request(['iso', 'iso3', assertIso3(params.iso3)], undefined, opts);
    }
    if (params.numeric !== undefined) {
      return this.http.request(['iso', 'numeric', assertNumericCode(params.numeric)], undefined, opts);
    }
    throw new ValidationError('iso.lookup requires one of iso2, iso3, or numeric', {
      field: 'iso2',
      reason: 'missing_lookup_key',
    });
  }
}
