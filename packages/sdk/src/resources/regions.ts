import { BaseResource } from './BaseResource';
import type { IRegion, ISubregion } from '../types/entities';
import type { ILocalizationParams } from '../types/params';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class RegionsResource extends BaseResource {
  async list(params?: ILocalizationParams, opts?: IRequestOptions): Promise<CSCResponse<IRegion[]>> {
    return this.http.request(
      ['regions'],
      { locale: params?.locale, include_translations: params?.includeTranslations },
      opts,
    );
  }

  async get(id: number | string, params?: ILocalizationParams, opts?: IRequestOptions): Promise<CSCResponse<IRegion>> {
    return this.http.request(
      ['regions', id],
      { locale: params?.locale, include_translations: params?.includeTranslations },
      opts,
    );
  }

  async subregions(id: number | string, params?: ILocalizationParams, opts?: IRequestOptions): Promise<CSCResponse<ISubregion[]>> {
    return this.http.request(
      ['regions', id, 'subregions'],
      { locale: params?.locale, include_translations: params?.includeTranslations },
      opts,
    );
  }
}
