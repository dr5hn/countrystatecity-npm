import type { IRequestOptions } from '../types/config';
import type { ILocalizationParams } from '../types/params';

/**
 * Keeps the old request-options position working while allowing localization
 * options before the trailing request options.
 */
export function splitLocalizationOptions(
  value: ILocalizationParams | IRequestOptions | undefined,
  trailingRequestOptions: IRequestOptions | undefined,
): { localization: ILocalizationParams | undefined; requestOptions: IRequestOptions | undefined } {
  const isLocalization = trailingRequestOptions !== undefined
    || (typeof value === 'object' && value !== null && ('locale' in value || 'includeTranslations' in value));
  return isLocalization
    ? { localization: value as ILocalizationParams, requestOptions: trailingRequestOptions }
    : { localization: undefined, requestOptions: value as IRequestOptions | undefined };
}
