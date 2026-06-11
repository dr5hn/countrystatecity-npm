import {
  getTranslation,
  getCountryTranslations,
  getLocales,
  searchByTranslatedName,
  getTranslationOrFallback,
} from '@countrystatecity/translations';

console.log('\n=== @countrystatecity/translations smoke test ===\n');

const fr = await getTranslation('DE', 'fr');
console.log('DE in French:   ', fr);

const ar = await getTranslation('US', 'ar');
console.log('US in Arabic:   ', ar);

const zh = await getTranslation('JP', 'zh-CN');
console.log('JP in Chinese:  ', zh);

const locales = await getLocales();
console.log('\nLocales (' + locales.length + '):', locales.join(', '));

const entry = await getCountryTranslations('IN');
console.log('\nIndia (hi):     ', entry?.translations['hi']);
console.log('India (ko):     ', entry?.translations['ko']);

const fallback = getTranslationOrFallback(entry, 'xx', 'fr');
console.log('Fallback (xx → fr):', fallback);

const noLocale = getTranslationOrFallback(entry, 'xx');
console.log('Fallback (xx → en):', noLocale);

const results = await searchByTranslatedName('Allemagne', 'fr');
console.log('\nsearchByTranslatedName("Allemagne", "fr"):', results.map(r => r.iso2));

console.log('\n✅ All good!\n');
