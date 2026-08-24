/**
 * Joins the full city release asset (json-cities.json.gz) into the combined
 * source file's embedded city records, matched by `id`. Mutates `countries`
 * in place (avoids doubling memory for a ~150k-city dataset already fully
 * loaded) and returns join statistics for the manifest/report.
 *
 * Deliberately does NOT copy the full record's embedded `translations{}` —
 * the spec forbids putting all city translations inside the main npm city
 * files (too large).
 */

/**
 * @param {Array} countries - source.json's parsed array (nested countries→states→cities)
 * @param {Array} fullCityRecords - cities-full.json's parsed array
 * @returns {{totalCities: number, matched: number, unmatched: number}}
 */
function joinCityFields(countries, fullCityRecords) {
  const byId = new Map();
  for (const record of fullCityRecords) {
    byId.set(record.id, record);
  }

  let totalCities = 0;
  let matched = 0;

  for (const country of countries) {
    for (const state of country.states ?? []) {
      for (const city of state.cities ?? []) {
        totalCities++;
        const full = byId.get(city.id);
        if (full) {
          matched++;
          city.type = full.type ?? null;
          city.native = full.native ?? null;
          city.population = full.population ?? null;
          city.wikiDataId = full.wikiDataId ?? null;
        } else {
          city.type = null;
          city.native = null;
          city.population = null;
          city.wikiDataId = null;
        }
      }
    }
  }

  return { totalCities, matched, unmatched: totalCities - matched };
}

module.exports = { joinCityFields };
