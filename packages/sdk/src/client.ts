import type { CSCClientOptions, ResolvedCSCConfig } from './types/config';
import type { CSCResponseMeta } from './types/response';
import { ValidationError } from './errors';
import { HttpClient } from './http/httpClient';
import { SDK_VERSION } from './version';
import {
  CountriesResource,
  StatesResource,
  CitiesResource,
  RegionsResource,
  CurrenciesResource,
  IsoResource,
  PhoneResource,
  TimezonesResource,
  SearchResource,
  UsageResource,
  ChangesResource,
} from './resources';

const DEFAULT_BASE_URL = 'https://api.countrystatecity.in/v1';
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY = { retries: 2, baseDelayMs: 200, maxDelayMs: 2000 };

function resolveConfig(options: CSCClientOptions): ResolvedCSCConfig {
  if (typeof options.apiKey !== 'string' || options.apiKey.trim().length === 0) {
    throw new ValidationError('apiKey is required and must be a non-empty string', {
      field: 'apiKey',
      reason: 'missing_api_key',
    });
  }
  if (typeof options.fetch !== 'function' && typeof fetch !== 'function') {
    throw new ValidationError(
      'No global fetch is available in this runtime — pass a `fetch` implementation via CSCClientOptions.fetch',
      { field: 'fetch', reason: 'missing_fetch_implementation' },
    );
  }

  const retry = options.retry === false ? false : { ...DEFAULT_RETRY, ...options.retry };

  return {
    apiKey: options.apiKey,
    baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
    timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
    fetchImpl: options.fetch ?? fetch,
    headers: options.headers ?? {},
    retry,
    userAgent: options.userAgent ?? `countrystatecity-sdk-js/${SDK_VERSION}`,
  };
}

export class CSCClient {
  private readonly http: HttpClient;

  readonly countries: CountriesResource;
  readonly states: StatesResource;
  readonly cities: CitiesResource;
  readonly regions: RegionsResource;
  readonly currencies: CurrenciesResource;
  readonly iso: IsoResource;
  readonly phone: PhoneResource;
  readonly timezones: TimezonesResource;
  readonly search: SearchResource;
  readonly usage: UsageResource;
  readonly changes: ChangesResource;

  constructor(options: CSCClientOptions) {
    const config = resolveConfig(options);
    this.http = new HttpClient(config);

    this.countries = new CountriesResource(this.http);
    this.states = new StatesResource(this.http);
    this.cities = new CitiesResource(this.http);
    this.regions = new RegionsResource(this.http);
    this.currencies = new CurrenciesResource(this.http);
    this.iso = new IsoResource(this.http);
    this.phone = new PhoneResource(this.http);
    this.timezones = new TimezonesResource(this.http);
    this.search = new SearchResource(this.http);
    this.usage = new UsageResource(this.http);
    this.changes = new ChangesResource(this.http);
  }

  /** Metadata (rate-limit usage, request id, data version, ...) from the most recent successful request on this client, if any. */
  getLastResponseMeta(): CSCResponseMeta | undefined {
    return this.http.getLastMeta();
  }
}

export function createCSCClient(options: CSCClientOptions): CSCClient {
  return new CSCClient(options);
}
