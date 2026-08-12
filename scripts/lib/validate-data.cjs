/**
 * Data-integrity checks run once on the joined-but-pre-split dataset, before
 * any per-package generator spawns. A failure here means nothing downstream
 * runs and the currently-live packages/*\/src/data stays untouched.
 */

const DELTA_THRESHOLD = 0.1;

// Number(), not parseFloat(): parseFloat('1.0N') silently truncates to 1, and
// Number('N/A') is NaN. This is the same coordinate-validity rule already
// used by packages/geojson/scripts/generate-data.cjs, intentionally
// duplicated here rather than imported — root scripts don't depend on a
// workspace package.
function isFiniteCoordinate(value) {
  return value != null && value !== '' && Number.isFinite(Number(value));
}

function checkCoordinates(record, label, errors) {
  for (const field of ['latitude', 'longitude']) {
    const value = record[field];
    const hasValue = value != null && value !== '';
    if (hasValue && !isFiniteCoordinate(value)) {
      errors.push(`${label} id=${record.id} (${record.name}): invalid ${field} ${JSON.stringify(value)}`);
    }
  }
}

/**
 * @param {Array} countries - the joined dataset (source.json shape, nested countries→states→cities)
 * @param {object} [options]
 * @param {{counts?: {countries:number,states:number,cities:number}}} [options.previousManifest] - a prior data-manifest.json, for the delta gate
 * @returns {{ok: boolean, errors: string[], warnings: string[], counts: {countries:number,states:number,cities:number}}}
 */
function validateData(countries, options = {}) {
  const errors = [];
  const warnings = [];

  const countryIds = new Set();
  const seenCityIds = new Set();
  const duplicateCityIds = new Set();

  let totalStates = 0;
  let totalCities = 0;

  for (const country of countries) {
    if (!country.id || !country.name) {
      errors.push(`country missing id or name: ${JSON.stringify({ id: country.id, name: country.name })}`);
    }
    countryIds.add(country.id);
    checkCoordinates(country, 'country', errors);

    for (const state of country.states ?? []) {
      totalStates++;
      if (!state.id || !state.name) {
        errors.push(
          `state missing id or name (country ${country.iso2 ?? country.id}): ${JSON.stringify({ id: state.id, name: state.name })}`,
        );
      }
      if (state.country_id !== undefined && !countryIds.has(state.country_id)) {
        errors.push(`state id=${state.id} (${state.name}) references unknown country_id ${state.country_id}`);
      }
      checkCoordinates(state, 'state', errors);

      for (const city of state.cities ?? []) {
        totalCities++;
        if (!city.id || !city.name) {
          errors.push(
            `city missing id or name (state ${state.iso2 ?? state.id}): ${JSON.stringify({ id: city.id, name: city.name })}`,
          );
        }
        if (city.state_id !== undefined && city.state_id !== state.id) {
          errors.push(
            `city id=${city.id} (${city.name}) state_id ${city.state_id} does not match its containing state ${state.id}`,
          );
        }
        if (city.country_id !== undefined && !countryIds.has(city.country_id)) {
          errors.push(`city id=${city.id} (${city.name}) references unknown country_id ${city.country_id}`);
        }
        if (seenCityIds.has(city.id)) {
          duplicateCityIds.add(city.id);
        }
        seenCityIds.add(city.id);
        checkCoordinates(city, 'city', errors);
      }
    }
  }

  for (const id of duplicateCityIds) {
    errors.push(`duplicate city id: ${id}`);
  }

  const counts = { countries: countries.length, states: totalStates, cities: totalCities };

  if (options.previousManifest?.counts) {
    for (const key of ['countries', 'states', 'cities']) {
      const previous = options.previousManifest.counts[key];
      const current = counts[key];
      if (typeof previous === 'number' && previous > 0) {
        const pct = Math.abs(current - previous) / previous;
        if (pct > DELTA_THRESHOLD) {
          errors.push(
            `${key} count changed by ${(pct * 100).toFixed(1)}% (previous ${previous} → current ${current}), ` +
              `exceeding the ${DELTA_THRESHOLD * 100}% threshold — human review required`,
          );
        }
      }
    }
  } else {
    warnings.push('no previous manifest found — skipping the count-delta gate and establishing a new baseline');
  }

  return { ok: errors.length === 0, errors, warnings, counts };
}

module.exports = { validateData, isFiniteCoordinate };
