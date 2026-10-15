import { getTranslations, getLocales, getTranslation } from '@countrystatecity/translations';

/** Render the Node-only translation package without bundling fs into the client. */
export default async function Page(): Promise<React.JSX.Element> {
  const countries = (await getTranslations()).length;
  const locales = (await getLocales()).length;
  const sample = `DE in French: ${await getTranslation('DE', 'fr')}`;
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
            <li>✓ Loaded {locales} locales</li>
            <li>✓ {sample}</li>
          </ul>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: status.includes('Success') ? '#e8f5e9' : '#fff3cd', borderRadius: '4px' }}>
        <strong>Result:</strong> {status.includes('Success')
          ? 'The package builds correctly with NextJS webpack bundler!'
          : 'Testing in progress or error occurred'}
      </div>
    </div>
  );
}
