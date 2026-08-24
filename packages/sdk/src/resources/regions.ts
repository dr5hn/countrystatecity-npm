import { BaseResource } from './BaseResource';
import { assertLocalizationParams } from '../validation/assertions';
import { splitLocalizationOptions } from './localizationOptions';
import type { ICountry, IRegion, ISubregion } from '../types/entities';
import type { ILocalizationParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class RegionsResource extends BaseResource {
  async list(
    paramsOrOpts?: ILocalizationParams | IRequestOptions,
    opts?: IRequestOptions,
  ): Promise<CSCResponse<IRegion[]>> {
    const { localization, requestOptions } = splitLocalizationOptions(paramsOrOpts, opts);
    return this.http.request(
      ['regions'],
      assertLocalizationParams(localization),
      requestOptions,
    );
  }

  async get(
    id: number | string,
    paramsOrOpts?: ILocalizationParams | IRequestOptions,
    opts?: IRequestOptions,
  ): Promise<CSCResponse<IRegion>> {
    const { localization, requestOptions } = splitLocalizationOptions(paramsOrOpts, opts);
    return this.http.request(
      ['regions', id],
      assertLocalizationParams(localization),
      requestOptions,
    );
  }

  async subregions(
    id: number | string,
    paramsOrOpts?: ILocalizationParams | IRequestOptions,
    opts?: IRequestOptions,
  ): Promise<CSCResponse<ISubregion[]>> {
    const { localization, requestOptions } = splitLocalizationOptions(paramsOrOpts, opts);
    return this.http.request(
      ['regions', id, 'subregions'],
      assertLocalizationParams(localization),
      requestOptions,
    );
  }

  /** Gets one subregion with optional localized output. */
  async getSubregion(
    id: number | string,
    params?: ILocalizationParams,
    opts?: IRequestOptions,
  ): Promise<CSCResponse<ISubregion>> {
    return this.http.request(
      ['subregions', id],
      assertLocalizationParams(params),
      opts,
    );
  }

  /** Lists countries in one subregion with optional localized output. */
  async countries(
    id: number | string,
    params?: ILocalizationParams,
    opts?: IRequestOptions,
  ): Promise<CSCResponse<ICountry[]>> {
    return this.http.request(
      ['subregions', id, 'countries'],
      assertLocalizationParams(params),
      opts,
    );
  }
}
