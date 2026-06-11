/**
 * Represents a timezone with all its metadata
 */
export interface ITimezone {
  /** IANA timezone name (e.g., "America/New_York") */
  zoneName: string;
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string;
  /** Timezone abbreviation (e.g., "EST", "PST") */
  abbreviation: string;
  /** GMT offset in seconds */
  gmtOffset: number;
  /** GMT offset formatted (e.g., "UTC-05:00") */
  gmtOffsetName: string;
  /** Full timezone name */
  tzName: string;
}

/**
 * Detailed timezone information including current time
 */
export interface ITimezoneInfo {
  /** IANA timezone name */
  timezone: string;
  /** Current time in this timezone (ISO string) */
  currentTime: string;
  /** UTC offset formatted */
  utcOffset: string;
  /** Whether daylight saving time is currently active */
  isDST: boolean;
  /** GMT offset in seconds */
  gmtOffset: number;
}

/**
 * Timezone abbreviation mapping
 */
export interface ITimezoneAbbreviation {
  /** Abbreviation (e.g., "EST") */
  abbreviation: string;
  /** Full name (e.g., "Eastern Standard Time") */
  name: string;
  /** Associated IANA timezone names */
  timezones: string[];
}

/**
 * Time conversion result
 */
export interface IConvertedTime {
  /** Original time in source timezone */
  originalTime: string;
  /** Source timezone */
  fromTimezone: string;
  /** Converted time in target timezone */
  convertedTime: string;
  /** Target timezone */
  toTimezone: string;
  /** Time difference in hours */
  timeDifference: number;
}
