import type { ICountryTranslation } from './types.js';

/** Returns the translation for the given locale, falling back to a second locale, then to the English name. */
export function getTranslationOrFallback(
  entry: ICountryTranslation,
  locale: string,
  fallbackLocale?: string,
): string {
  return (
    entry.translations[locale] ??
    (fallbackLocale ? entry.translations[fallbackLocale] : undefined) ??
    entry.name
  );
}
