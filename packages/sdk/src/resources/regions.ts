import { BaseResource } from './BaseResource';
import type { IRegion, ISubregion } from '../types/entities';
import type { IRequestOptions } from '../types/config';
import type { CSCResponse } from '../types/response';

export class RegionsResource extends BaseResource {
  async list(opts?: IRequestOptions): Promise<CSCResponse<IRegion[]>> {
    return this.http.request(['regions'], undefined, opts);
  }

  async get(id: number | string, opts?: IRequestOptions): Promise<CSCResponse<IRegion>> {
    return this.http.request(['regions', id], undefined, opts);
  }

  async subregions(id: number | string, opts?: IRequestOptions): Promise<CSCResponse<ISubregion[]>> {
    return this.http.request(['regions', id, 'subregions'], undefined, opts);
  }
}
