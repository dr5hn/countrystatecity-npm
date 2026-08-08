/**
 * @countrystatecity/postalcodes
 * Official postal/ZIP code database with locality search, existence-based
 * validation, and lazy loading.
 */

export type { IPostalCode, IPostalCodeManifestEntry } from './types';

export {
  getManifest,
  getPostalCodesOfState,
  getUnassignedPostalCodesOfCountry,
  getAllPostalCodesOfCountry,
} from './loaders';

export {
  validatePostalCode,
  lookupPostalCode,
  searchPostalCodesByLocality,
  searchPostalCodesByLocalityInCountry,
  getSupportedCountryCodes,
  isCountrySupported,
} from './utils';

export { getManifest as default } from './loaders';
