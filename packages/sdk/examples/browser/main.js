// main.js
//
// WARNING: any key used here is publicly visible in this file / the network
// tab. Only use a key restricted to specific allowed origins in your CSC
// dashboard — never an unrestricted or server key. See ../../README.md#-browser-usage.
import { createCSCClient } from '@countrystatecity/sdk';

const RESTRICTED_BROWSER_KEY = 'replace-with-an-origin-restricted-key';

const csc = createCSCClient({ apiKey: RESTRICTED_BROWSER_KEY });

const { data: countries } = await csc.countries.list({ limit: 10 });

const list = document.getElementById('countries');
for (const country of countries) {
  const li = document.createElement('li');
  li.textContent = `${country.emoji ?? ''} ${country.name}`.trim();
  list.appendChild(li);
}
