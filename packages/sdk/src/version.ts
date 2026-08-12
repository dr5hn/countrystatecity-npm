// Injected by tsup's `define` at build time (see tsup.config.ts), mirroring
// @countrystatecity/geojson's __VERSION__ pattern. vitest.config.ts defines a
// '0.0.0-test' placeholder for the test environment.
declare const __VERSION__: string;

export const SDK_VERSION: string = __VERSION__;
