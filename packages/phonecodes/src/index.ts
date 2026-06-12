export type { IPhonecode } from './types.js';

export {
  getPhonecodes,
  getPhonecodeByCountry,
  getCountriesByDialCode,
  isValidDialCode,
  searchPhonecodes,
} from './loaders.js';

export {
  getDialCode,
  getPhonecode,
  formatWithDialCode,
} from './utils.js';

export { getPhonecodes as default } from './loaders.js';
