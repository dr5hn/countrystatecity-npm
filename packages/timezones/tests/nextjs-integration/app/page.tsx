import { getTimezones, getTimezonesByCountry, getTimezoneAbbreviations } from '@countrystatecity/timezones';

/** Render the Node-only package in a server component, keeping fs out of the browser. */
export default async function Page(): Promise<React.JSX.Element> {
  const timezones = (await getTimezones()).length;
  const usTimezones = (await getTimezonesByCountry('US')).length;
  const abbreviations = (await getTimezoneAbbreviations()).length;
  if (!timezones || !usTimezones || !abbreviations) {
    throw new Error('Timezone JSON loaders returned empty data');
  }
  const status = '✅ Success!';

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>NextJS Integration Test</h1>
      <p><strong>Status:</strong> {status}</p>
      
      {timezones > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>Test Results:</h2>
          <ul>
            <li>✓ Loaded {timezones} timezones</li>
            <li>✓ Loaded {usTimezones} US timezones</li>
            <li>✓ Loaded {abbreviations} timezone abbreviations</li>
          </ul>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: status.includes('Success') ? '#e8f5e9' : '#fff3cd', borderRadius: '4px' }}>
        <strong>Result:</strong> {status.includes('Success') 
          ? 'The timezone package loads correctly with Next.js!'
          : 'Testing in progress or error occurred'}
      </div>
    </div>
  );
}
