// app/api/countries/route.ts
//
// The SDK stays entirely server-side: this Route Handler runs in a Node.js
// server context, so CSC_API_KEY is never bundled into client JavaScript.
// A browser component calls THIS route (same-origin, no key needed on the
// client) rather than importing @countrystatecity/sdk directly.
import { NextRequest, NextResponse } from 'next/server';
import { createCSCClient, CSCError } from '@countrystatecity/sdk';

// One client per server process is fine — CSCClient holds no per-request state.
const csc = createCSCClient({ apiKey: process.env.CSC_API_KEY! });

export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get('country') ?? undefined;

  try {
    const { data, meta } = await csc.states.list({ country });
    return NextResponse.json(data, {
      headers: meta.requestId ? { 'x-csc-request-id': meta.requestId } : undefined,
    });
  } catch (err) {
    if (err instanceof CSCError) {
      // err.message/statusCode are safe to forward — the SDK never puts the API key in them.
      return NextResponse.json({ error: err.message }, { status: err.statusCode ?? 500 });
    }
    throw err;
  }
}
