import { getCountries, getStatesOfCountry, getCitiesOfState } from '@countrystatecity/countries';

/** Render the Node-only package in a server component, keeping fs out of the browser. */
export default async function Page(): Promise<React.JSX.Element> {
  const countries = (await getCountries()).length;
  const states = (await getStatesOfCountry('US')).length;
  const cities = (await getCitiesOfState('US', 'CA')).length;
  const status = '✅ Success!';

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>NextJS Integration Test</h1>
      <p><strong>Status:</strong> {status}</p>
      
      {countries > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>Test Results:</h2>
          <ul>
            <li>✓ Loaded {countries} countries</li>
            <li>✓ Loaded {states} US states</li>
            <li>✓ Loaded {cities} California cities</li>
          </ul>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: status.includes('Success') ? '#e8f5e9' : '#fff3cd', borderRadius: '4px' }}>
        <strong>Result:</strong> {status.includes('Success') 
          ? 'The package loads correctly with Next.js!'
          : 'Testing in progress or error occurred'}
      </div>
    </div>
  );
}
