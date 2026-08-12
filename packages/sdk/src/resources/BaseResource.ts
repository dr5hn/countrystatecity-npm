import type { HttpClient } from '../http/httpClient';

export abstract class BaseResource {
  constructor(protected readonly http: HttpClient) {}
}
