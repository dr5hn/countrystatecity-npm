/**
 * @countrystatecity/countries - Official countries, states, and cities database
 * iOS/Safari compatible with minimal bundle size and lazy loading
 */

// Export all types
export type {
  ICountry,
  ICountryMeta,
  IState,
  ICity,
  IRegion,
  ISubregion,
  ITimezone,
  ITranslations,
  IDataVersion,
} from './types';

// Export all loaders
export {
  getCountries,
  getCountryByCode,
  getStatesOfCountry,
  getStateByCode,
  getCitiesOfState,
  getAllCitiesOfCountry,
  getAllCitiesInWorld,
  getCityById,
  getRegions,
  getSubregions,
  getDataVersion,
} from './loaders';

// Export utilities
export {
  isValidCountryCode,
  isValidStateCode,
  searchCitiesByName,
  getCountryNameByCode,
  getStateNameByCode,
  getTimezoneForCity,
  getCountryTimezones,
  getSubregionsOfRegion,
  getCountriesByRegion,
  getCountriesBySubregion,
} from './utils';

// Default export for convenience
export { getCountries as default } from './loaders';
