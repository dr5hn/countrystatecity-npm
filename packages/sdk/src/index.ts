/**
 * @countrystatecity/sdk — official JS/TS client for the CountryStateCity REST API
 */

export { createCSCClient, CSCClient } from './client';

export {
  CSCError,
  AuthenticationError,
  ValidationError,
  FeatureRestrictedError,
  RateLimitError,
  NotFoundError,
  NetworkError,
  TimeoutError,
} from './errors';

export type {
  CSCClientOptions,
  RetryOptions,
  IRequestOptions,
} from './types/config';

export type {
  CSCResponse,
  CSCResponseMeta,
  CacheStatus,
  IRateLimitMeta,
  IPaginationMeta,
} from './types/response';

export type {
  ITranslations,
  ICountry,
  IState,
  ICity,
  IRegion,
  ISubregion,
  ICurrency,
  IPhonecode,
  ITimezone,
  IConvertedTime,
  SearchResultType,
  ISearchMatchMeta,
  ICountrySearchResult,
  IStateSearchResult,
  ICitySearchResult,
  ISearchResult,
  IUsageSnapshot,
  ChangeResourceType,
  ChangeOperation,
  IChangeEvent,
} from './types/entities';

export type {
  IListParams,
  IListCountriesParams,
  IListStatesParams,
  IListCitiesParams,
  ITimezoneConvertParams,
  ISearchParams,
  IChangesParams,
  IIsoLookupParams,
} from './types/params';

export {
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
