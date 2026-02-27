# CSRF Protection Model

## Overview

Koekertaaja protects cookie-authenticated mutating API routes with a shared CSRF strategy:

1. Only mutating methods are enforced: `POST`, `PUT`, `PATCH`, `DELETE`.
2. Request must be same-origin (`Origin` header, or `Referer` fallback).
3. Double-submit token must match:
`koekertaaja_csrf` cookie == `x-csrf-token` request header.

Failed validation returns:

```json
{ "error": "Forbidden: CSRF validation failed" }
```

with HTTP `403`.

## Server Usage

Use shared auth helpers with the `request` argument on mutating routes:

```ts
await requireAuth(request);
await requireAdmin(request);
```

This applies both auth and CSRF checks with a single pattern.

## Client Usage

Use `withCsrfHeaders(...)` for mutating same-origin `fetch` requests:

```ts
import { withCsrfHeaders } from '@/lib/security/csrf-client';

await fetch('/api/question-sets/publish', {
  method: 'PATCH',
  headers: withCsrfHeaders({ 'Content-Type': 'application/json' }),
  body: JSON.stringify(payload),
});
```

The helper ensures a CSRF cookie exists and sends matching `x-csrf-token`.

## Files

- `src/lib/security/csrf.ts` (shared validation rules)
- `src/lib/security/csrf-client.ts` (client fetch helper)
- `src/lib/supabase/server-auth.ts` (auth + CSRF enforcement for protected routes)
- `src/proxy.ts` (CORS headers include `X-CSRF-Token`)
