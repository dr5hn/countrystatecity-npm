/**
 * Query-string suffix appended to app.countrystatecity.in / export.countrystatecity.in
 * links the CLI opens or prints, so csc-app's parseRegistrationAttribution()
 * can attribute registrations back to CLI usage. `source` must match the
 * allowlist there exactly (see specs/06-conversion-analytics.md) — anything
 * else is silently dropped, never rejected.
 */
export const CLI_TRACKING_PARAMS = 'source=cli&campaign=sdk_api_migration';
