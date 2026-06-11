import type { ITimezone, ITimezoneInfo, ITimezoneAbbreviation } from './types';

/**
 * Get all available timezones
 * Bundle impact: ~20KB
 * @returns Promise resolving to array of all timezones
 */
export async function getTimezones(): Promise<ITimezone[]> {
  const { default: timezones } = await import('./data/timezones.json');
  return timezones;
}

/**
 * Get timezones for a specific country
 * Bundle impact: ~2KB per country
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'US', 'IN')
 * @returns Promise resolving to array of timezones for the country
 */
export async function getTimezonesByCountry(countryCode: string): Promise<ITimezone[]> {
  try {
    const { default: timezones } = await import(`./data/by-country/${countryCode}.json`);
    return timezones;
  } catch (error) {
    console.error(`Timezones for country ${countryCode} not found`);
    return [];
  }
}

/**
 * Get timezone information including current time
 * @param timezoneName - IANA timezone name (e.g., 'America/New_York')
 * @returns Promise resolving to timezone info or null if not found
 */
export async function getTimezoneInfo(timezoneName: string): Promise<ITimezoneInfo | null> {
  const timezones = await getTimezones();
  const timezone = timezones.find(tz => tz.zoneName === timezoneName);

  if (!timezone) {
    return null;
  }

  const now = new Date();

  // Check if DST is currently active by comparing offsets
  const january = new Date(now.getFullYear(), 0, 1);
  const july = new Date(now.getFullYear(), 6, 1);

  const janStr = january.toLocaleString('en-US', { timeZone: timezoneName });
  const julStr = july.toLocaleString('en-US', { timeZone: timezoneName });
  const nowStr = now.toLocaleString('en-US', { timeZone: timezoneName });

  const janOffset = new Date(janStr).getTimezoneOffset();
  const julOffset = new Date(julStr).getTimezoneOffset();
  const nowOffset = new Date(nowStr).getTimezoneOffset();

  // Standard time is when offset is maximum (most positive)
  const standardOffset = Math.max(janOffset, julOffset);
  const isDST = nowOffset < standardOffset;

  return {
    timezone: timezone.zoneName,
    currentTime: now.toISOString(),
    utcOffset: timezone.gmtOffsetName,
    isDST,
    gmtOffset: timezone.gmtOffset
  };
}

/**
 * Get all timezone abbreviations
 * Bundle impact: ~5KB
 * @returns Promise resolving to array of timezone abbreviations
 */
export async function getTimezoneAbbreviations(): Promise<ITimezoneAbbreviation[]> {
  const { default: abbreviations } = await import('./data/abbreviations.json');
  return abbreviations;
}

/**
 * Find timezone by abbreviation (e.g., 'EST', 'PST')
 * @param abbreviation - Timezone abbreviation
 * @returns Promise resolving to array of matching timezones
 */
export async function getTimezonesByAbbreviation(abbreviation: string): Promise<ITimezone[]> {
  const abbrevs = await getTimezoneAbbreviations();
  const match = abbrevs.find(a => a.abbreviation.toLowerCase() === abbreviation.toLowerCase());
  
  if (!match) {
    return [];
  }

  const allTimezones = await getTimezones();
  return allTimezones.filter(tz => match.timezones.includes(tz.zoneName));
}
