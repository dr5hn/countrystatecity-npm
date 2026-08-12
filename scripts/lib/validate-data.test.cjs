const assert = require('node:assert/strict');
const test = require('node:test');

const { validateData, isFiniteCoordinate } = require('./validate-data.cjs');

function validDataset() {
  return [
    {
      id: 1,
      name: 'Afghanistan',
      iso2: 'AF',
      latitude: '33.0',
      longitude: '65.0',
      states: [
        {
          id: 10,
          name: 'Badakhshan',
          country_id: 1,
          latitude: '36.7',
          longitude: '70.8',
          cities: [
            { id: 100, name: 'Ashkasham', state_id: 10, country_id: 1, latitude: '36.68', longitude: '71.53' },
            { id: 101, name: 'Fayzabad', state_id: 10, country_id: 1, latitude: '', longitude: '' },
          ],
        },
      ],
    },
  ];
}

test('a well-formed dataset passes with no errors and correct counts', () => {
  const result = validateData(validDataset());
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.counts, { countries: 1, states: 1, cities: 2 });
});

test('isFiniteCoordinate rejects empty/null and non-numeric values, accepts numeric strings', () => {
  // checkCoordinates() treats "no value" (empty/null) as fine — it's the raw
  // predicate under test here, which is correctly false for both.
  assert.equal(isFiniteCoordinate(''), false);
  assert.equal(isFiniteCoordinate(null), false);
  assert.equal(isFiniteCoordinate('36.68'), true);
  assert.equal(isFiniteCoordinate('N/A'), false);
});

test('flags a country missing a name', () => {
  const dataset = validDataset();
  dataset[0].name = '';
  const result = validateData(dataset);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('country missing id or name')));
});

test('flags a state whose country_id references an unknown country', () => {
  const dataset = validDataset();
  dataset[0].states[0].country_id = 999;
  const result = validateData(dataset);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('unknown country_id 999')));
});

test('flags a city whose country_id references an unknown country', () => {
  const dataset = validDataset();
  dataset[0].states[0].cities[0].country_id = 999;
  const result = validateData(dataset);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('city id=100') && e.includes('unknown country_id 999')));
});

test('flags a city whose state_id does not match its containing state', () => {
  const dataset = validDataset();
  dataset[0].states[0].cities[0].state_id = 999;
  const result = validateData(dataset);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('does not match its containing state')));
});

test('flags a duplicate city id — the "add a duplicate city ID" simple test', () => {
  const dataset = validDataset();
  dataset[0].states[0].cities.push({ id: 100, name: 'Duplicate of Ashkasham', state_id: 10, country_id: 1 });
  const result = validateData(dataset);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e === 'duplicate city id: 100'));
});

test('flags a non-numeric ("garbage") latitude but allows an empty one', () => {
  const dataset = validDataset();
  dataset[0].states[0].cities[0].latitude = 'N/A';
  const result = validateData(dataset);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('invalid latitude')));

  // The second city has empty lat/long in the base fixture and must NOT be flagged.
  assert.ok(!result.errors.some((e) => e.includes('id=101')));
});

test('flags an out-of-range-looking but numeric longitude the same way (still just "not a finite number" today)', () => {
  const dataset = validDataset();
  dataset[0].states[0].cities[0].longitude = 'not-a-number';
  const result = validateData(dataset);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('invalid longitude')));
});

test('no previous manifest: skips the delta gate and only warns', () => {
  const result = validateData(validDataset());
  assert.equal(result.ok, true);
  assert.ok(result.warnings.some((w) => w.includes('no previous manifest')));
});

test('delta gate passes when the change is within 10%', () => {
  const result = validateData(validDataset(), { previousManifest: { counts: { countries: 1, states: 1, cities: 2 } } });
  assert.equal(result.ok, true);
});

test('delta gate fails on a >10% increase in any one entity', () => {
  const result = validateData(validDataset(), { previousManifest: { counts: { countries: 1, states: 1, cities: 1 } } });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('cities count changed by 100.0%')));
});

test('delta gate fails on a >10% decrease, not just an increase', () => {
  const result = validateData(validDataset(), { previousManifest: { counts: { countries: 1, states: 1, cities: 10 } } });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes('cities count changed by 80.0%')));
});
