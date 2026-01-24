# CORS/403 Investigation Report
**Date**: 2025-12-13
**Issue**: 403 errors on deletion and question set updates

## Summary
The 403/CORS errors are caused by **incomplete CORS handling** in the middleware. The middleware handles OPTIONS preflight requests correctly but doesn't add CORS headers to actual POST/DELETE responses.

## Root Causes

### 1. Middleware Only Adds CORS Headers to OPTIONS Requests
**File**: `src/middleware.ts` (lines 72-82)

**Problem**:
```typescript
// Middleware ONLY handles OPTIONS (preflight)
if (request.method === 'OPTIONS') {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      // ... other headers
    },
  });
}
// For actual requests, it just passes through WITHOUT adding headers
return NextResponse.next();
```

**Impact**:
- OPTIONS preflight succeeds ✅
- Actual POST/DELETE request fails because response has no CORS headers ❌

### 2. API Routes Don't Add CORS Headers to Responses
**Affected endpoints**:
1. `/api/delete-question-set` - No CORS headers at all
2. `/api/question-sets/submit` - No CORS headers at all
3. `/api/generate-questions` - No CORS headers at all
4. `/api/extend-question-set` - Has CORS headers (recently fixed)

### 3. Frontend Uses `credentials: 'same-origin'`
**File**: `src/app/create/page.tsx` (line 149)

```typescript
const response = await fetch('/api/delete-question-set', {
  method: 'DELETE',
  credentials: 'same-origin', // Sends cookies for authentication
  // ...
});
```

**Why this matters**:
Even for same-origin requests, when using `credentials`, browsers enforce strict CORS policies. The response MUST include:
- `Access-Control-Allow-Origin: <specific-origin>` (not `*`)
- `Access-Control-Allow-Credentials: true`

## Current State

### Middleware (src/middleware.ts)
✅ Checks allowed origins (https://koekertaaja.vercel.app, localhost)
✅ Handles OPTIONS preflight with CORS headers
❌ **Doesn't add CORS headers to actual responses**
❌ **Doesn't set Access-Control-Allow-Credentials header**

### API Endpoints Status

| Endpoint | Has CORS Headers | Has OPTIONS Handler | Uses Auth |
|----------|------------------|---------------------|-----------|
| `/api/generate-questions` | ❌ No | ❌ No | ✅ Yes |
| `/api/extend-question-set` | ✅ Yes | ✅ Yes | ✅ Yes |
| `/api/delete-question-set` | ❌ No | ❌ No | ✅ Yes |
| `/api/question-sets/submit` | ❌ No | ❌ No | ✅ Yes |

## Why extend-question-set Worked After Our Fix

We added CORS headers to the route handler itself:
```typescript
function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    // ...
  };
}
```

But this is **duplicating logic** - both middleware AND route handlers are trying to handle CORS.

## Recommended Fix Strategy

### Option A: Middleware-Only Approach (RECOMMENDED)
**Pros**: Centralized CORS handling, DRY principle
**Cons**: Middleware must add headers to all responses

**Implementation**:
1. Update middleware to add CORS headers to ALL API responses (not just OPTIONS)
2. Remove CORS handling from individual route handlers
3. Ensure `Access-Control-Allow-Credentials: true` is set

### Option B: Route-Handler Approach
**Pros**: More control per endpoint
**Cons**: Code duplication, easy to forget in new routes

**Implementation**:
1. Remove CORS handling from middleware
2. Add consistent CORS helpers to all route handlers
3. Ensure OPTIONS handlers in all routes

## Recommended Solution: Option A (Middleware-Only)

### Changes Needed:

**File**: `src/middleware.ts`

```typescript
export default function middleware(request: NextRequest) {
  // ... existing rate limit code ...

  // CORS configuration for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'https://koekertaaja.vercel.app',
      'http://localhost:3000',
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean);

    // Block disallowed origins
    if (origin && !allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { error: 'CORS: Origin not allowed' },
        { status: 403 }
      );
    }

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // ADD CORS HEADERS TO ALL API RESPONSES (NEW)
    const response = NextResponse.next();

    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  }

  return NextResponse.next();
}
```

**File**: `src/app/api/extend-question-set/route.ts`
- Remove `getCorsHeaders()` function
- Remove all `headers: getCorsHeaders(request)` from responses
- Remove OPTIONS handler

**File**: Other API routes
- No changes needed (they don't have CORS handling)

## Testing Plan

1. **Test deletion**:
   - Create a question set
   - Delete it
   - Verify no 403 error

2. **Test extension**:
   - Create a question set
   - Add more questions to it
   - Verify no 403 error

3. **Test generation**:
   - Generate new question sets
   - Verify no 403 error

4. **Test from different origins**:
   - Try from localhost → should work
   - Try from production → should work
   - Try from random domain → should get 403 (blocked)

## Migration Path

1. Update middleware to add CORS headers to all responses
2. Deploy and test
3. If successful, clean up duplicate CORS code from route handlers
4. Document CORS policy in README
