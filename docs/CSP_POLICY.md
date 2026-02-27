# Content Security Policy (CSP)

## Overview
Koekertaaja uses a nonce-based CSP generated in `src/proxy.ts` for every request.

- `next.config.js` does not set static CSP.
- `src/proxy.ts` generates a per-request nonce (`x-nonce`) and sets `Content-Security-Policy`.
- Inline scripts are not allowed via `unsafe-inline`.
- Script evaluation is not allowed via `unsafe-eval`.

## Current Directives

```text
default-src 'self';
script-src 'self' 'nonce-<request-nonce>' https://va.vercel-scripts.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' https://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com;
object-src 'none';
frame-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

## Rationale
- Nonce-based scripts harden against XSS by blocking unauthorized inline scripts.
- `unsafe-eval` is removed to reduce script injection impact.
- Third-party allowances are explicit and limited to known integrations:
  - Vercel Analytics script loader: `https://va.vercel-scripts.com`
  - Vercel Analytics ingest: `https://vitals.vercel-insights.com`
  - Supabase API: `https://*.supabase.co`

## Maintenance Rules
- Add new domains only when a concrete integration requires them.
- Keep script permissions as strict as possible.
- If a new inline script is required, prefer nonce usage over adding `unsafe-inline`.
- Validate CSP in browser devtools after security-header changes.
