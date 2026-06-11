'use client';

import { useEffect, useState } from 'react';

export default function Page() {
  const [status, setStatus] = useState<string>('Testing...');
  const [countries, setCountries] = useState<number>(0);
  const [locales, setLocales] = useState<number>(0);
  const [sample, setSample] = useState<string>('');

  useEffect(() => {
    import('@countrystatecity/translations')
      .then(async (module) => {
        const all = await module.getTranslations();
        setCountries(all.length);

        const availableLocales = await module.getLocales();
        setLocales(availableLocales.length);

        const frName = await module.getTranslation('DE', 'fr');
        setSample(`DE in French: ${frName}`);

        setStatus('✅ Success!');
      })
      .catch((error) => {
        setStatus(`❌ Error: ${error.message}`);
      });
  }, []);

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
