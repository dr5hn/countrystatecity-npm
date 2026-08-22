/**
 * Data-integrity checks run once on the joined-but-pre-split dataset, before
 * any per-package generator spawns. A failure here means nothing downstream
 * runs and the currently-live packages/*\/src/data stays untouched.
 */

const DELTA_THRESHOLD = 0.1;
const COORDINATE_RANGES = {
  latitude: [-90, 90],
  longitude: [-180, 180],
};

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
    if (!hasValue) continue;
    if (!isFiniteCoordinate(value)) {
      errors.push(`${label} id=${record.id} (${record.name}): invalid ${field} ${JSON.stringify(value)}`);
      continue;
    }

    const [minimum, maximum] = COORDINATE_RANGES[field];
    if (Number(value) < minimum || Number(value) > maximum) {
      errors.push(
        `${label} id=${record.id} (${record.name}): ${field} ${JSON.stringify(value)} is outside ${minimum}..${maximum}`,
      );
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

  if (!Array.isArray(countries)) {
    return {
      ok: false,
      errors: ['source data must be an array of countries'],
      warnings,
      counts: { countries: 0, states: 0, cities: 0 },
    };
  }

  const countryIds = new Set();
  const stateIds = new Set();
  const seenCityIds = new Set();
  const duplicateCountryIds = new Set();
  const duplicateStateIds = new Set();
  const duplicateCityIds = new Set();

  let totalStates = 0;
  let totalCities = 0;

  for (const country of countries) {
    if (!country.id || !country.name) {
      errors.push(`country missing id or name: ${JSON.stringify({ id: country.id, name: country.name })}`);
    }
    if (countryIds.has(country.id)) duplicateCountryIds.add(country.id);
    countryIds.add(country.id);
    checkCoordinates(country, 'country', errors);

    const states = country.states ?? [];
    if (!Array.isArray(states)) {
      errors.push(`country id=${country.id} (${country.name}): states must be an array`);
      continue;
    }

    for (const state of states) {
      totalStates++;
      if (!state.id || !state.name) {
        errors.push(
          `state missing id or name (country ${country.iso2 ?? country.id}): ${JSON.stringify({ id: state.id, name: state.name })}`,
        );
      }
      if (stateIds.has(state.id)) duplicateStateIds.add(state.id);
      stateIds.add(state.id);
      if (state.country_id !== undefined && state.country_id !== country.id) {
        errors.push(
          `state id=${state.id} (${state.name}) country_id ${state.country_id} does not match its containing country ${country.id}`,
        );
      }
      checkCoordinates(state, 'state', errors);

      const cities = state.cities ?? [];
      if (!Array.isArray(cities)) {
        errors.push(`state id=${state.id} (${state.name}): cities must be an array`);
        continue;
      }

      for (const city of cities) {
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
        if (city.country_id !== undefined && city.country_id !== country.id) {
          errors.push(
            `city id=${city.id} (${city.name}) country_id ${city.country_id} does not match its containing country ${country.id}`,
          );
        }
        if (seenCityIds.has(city.id)) {
          duplicateCityIds.add(city.id);
        }
        seenCityIds.add(city.id);
        checkCoordinates(city, 'city', errors);
      }
    }
  }

  for (const id of duplicateCountryIds) {
    errors.push(`duplicate country id: ${id}`);
  }
  for (const id of duplicateStateIds) {
    errors.push(`duplicate state id: ${id}`);
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
