const assert = require('node:assert/strict');
const test = require('node:test');

const { joinCityFields } = require('./join-city-fields.cjs');

function makeCountry(overrides = {}) {
  return {
    id: 1,
    name: 'Afghanistan',
    iso2: 'AF',
    states: [
      {
        id: 3901,
        name: 'Badakhshan',
        iso2: 'BDS',
        cities: [{ id: 52, name: 'Ashkāsham', latitude: '36.68', longitude: '71.53' }],
      },
    ],
    ...overrides,
  };
}

test('a matched city gains type/native/population/wikiDataId from the full record', () => {
  const countries = [makeCountry()];
  const fullCityRecords = [
    { id: 52, name: 'Ashkāsham', type: 'city', native: 'اشکاشم', population: 12120, wikiDataId: 'Q4805192', translations: { fr: 'Ashkasham' } },
  ];

  const stats = joinCityFields(countries, fullCityRecords);

  const city = countries[0].states[0].cities[0];
  assert.equal(city.type, 'city');
  assert.equal(city.native, 'اشکاشم');
  assert.equal(city.population, 12120);
  assert.equal(city.wikiDataId, 'Q4805192');
  assert.equal(stats.matched, 1);
});

test('does NOT copy the full record\'s embedded translations onto the city', () => {
  const countries = [makeCountry()];
  const fullCityRecords = [{ id: 52, name: 'Ashkāsham', type: 'city', native: null, population: 1, wikiDataId: 'Q1', translations: { fr: 'x' } }];

  joinCityFields(countries, fullCityRecords);

  assert.equal(countries[0].states[0].cities[0].translations, undefined);
});

test('an unmatched city gets all four new fields set to null, never fabricated', () => {
  const countries = [makeCountry()];
  const stats = joinCityFields(countries, [{ id: 999, name: 'someone else' }]);

  const city = countries[0].states[0].cities[0];
  assert.equal(city.type, null);
  assert.equal(city.native, null);
  assert.equal(city.population, null);
  assert.equal(city.wikiDataId, null);
  assert.equal(stats.matched, 0);
  assert.equal(stats.unmatched, 1);
});

test('reports accurate totals across multiple countries/states/cities', () => {
  const countries = [
    makeCountry(),
    makeCountry({
      id: 2,
      name: 'Albania',
      iso2: 'AL',
      states: [
        { id: 1, name: 'Berat', cities: [{ id: 100, name: 'Berat' }, { id: 101, name: 'Kucove' }] },
      ],
    }),
  ];
  const fullCityRecords = [{ id: 52, type: 'city' }, { id: 100, type: 'city' }];

  const stats = joinCityFields(countries, fullCityRecords);

  assert.equal(stats.totalCities, 3);
  assert.equal(stats.matched, 2);
  assert.equal(stats.unmatched, 1);
});

test('handles countries/states with no states or no cities without crashing', () => {
  const countries = [
    { id: 1, name: 'No states at all' },
    { id: 2, name: 'Has an empty state list', states: [] },
    { id: 3, name: 'Has a state with no cities', states: [{ id: 1, name: 'Empty state' }] },
  ];

  const stats = joinCityFields(countries, []);
  assert.equal(stats.totalCities, 0);
});
