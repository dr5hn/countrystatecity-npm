// Run with: CSC_API_KEY=your-key node examples/node/error-handling.mjs
import {
  createCSCClient,
  ValidationError,
  AuthenticationError,
  FeatureRestrictedError,
  RateLimitError,
  NotFoundError,
  TimeoutError,
  NetworkError,
} from '@countrystatecity/sdk';

const csc = createCSCClient({ apiKey: process.env.CSC_API_KEY ?? 'invalid-key-to-demonstrate-401' });

async function run() {
  // Client-side validation — thrown (as a rejected promise) before any network call.
  try {
    await csc.countries.get('NOT-A-CODE');
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log(`[validation] field=${err.field} reason=${err.reason}: ${err.message}`);
    }
  }

  // A resource that doesn't exist.
  try {
    await csc.countries.get('ZZ');
  } catch (err) {
    if (err instanceof NotFoundError) {
      console.log(`[not found] ${err.resource ?? 'resource'} "${err.identifier ?? 'ZZ'}" — ${err.message}`);
    }
  }

  // A plan-gated feature.
  try {
    await csc.search.fuzzy({ query: 'Mumbai' });
  } catch (err) {
    if (err instanceof FeatureRestrictedError) {
      console.log(
        `[feature restricted] "${err.feature}" needs the ${err.requiredPlan} plan ` +
          `(currently on ${err.currentPlan}). Upgrade: ${err.upgradeUrl}`,
      );
    }
  }

  // Quota exceeded.
  try {
    await csc.countries.list();
  } catch (err) {
    if (err instanceof RateLimitError) {
      console.log(`[rate limited] scope=${err.scope} retryAfter=${err.retryAfter}s`);
    } else if (err instanceof AuthenticationError) {
      console.log(`[auth] ${err.message} — check your CSC_API_KEY`);
    } else if (err instanceof TimeoutError) {
      console.log(`[timeout] exceeded ${err.timeoutMs}ms`);
    } else if (err instanceof NetworkError) {
      console.log(`[network] ${err.message}`);
    }
  }
}

await run();
