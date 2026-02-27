# Security Review Report - Exam Prepper

**Review Date:** 2025-11-05
**Reviewer:** Claude (Automated Security Analysis)
**Application:** Exam Prepper - Next.js 14 Question Generation Platform
**Version:** 0.1.0

---

## Status Update (2026-02-27)

The abuse-control hardening from SEC-006/SEC-007 has been implemented:

- `/api/question-flags` no longer trusts client-provided `clientId` for throttling.
- Abuse identity is now server-derived (`IP + cookie/user-agent fingerprint`, or authenticated `userId`).
- Added anti-spam controls for flags:
  - Max `3` flags per identity per 24 hours.
  - Max `1` flag for the same question per identity per 6-hour window.
- Rate limiting now supports a pluggable backend:
  - Default: in-memory backend.
  - Production shared-state path: Upstash REST backend with `RATE_LIMIT_BACKEND=upstash`.
  - Fallback behavior: if Upstash env vars are missing, service logs a warning and falls back to in-memory.

Operational environment variables:

```bash
RATE_LIMIT_BACKEND=upstash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Secret hygiene follow-up from SEC-001:

- `.env.example` was sanitized to placeholder-only values (no usable tokens).
- `.gitignore` was hardened to ignore local env variants (`.env.local`, `.env.production`, `.env.*`) while explicitly keeping `.env.example`.
- Required operational action: rotate any Supabase, Anthropic, OpenAI, and Upstash keys that were previously exposed in git history, screenshots, or logs.
- Developer workflow check: run `npm run secrets:scan` (or the equivalent `rg` command) before push/merge.

---

## Executive Summary

This security review identifies **16 security issues** across multiple severity levels in the exam-prepper application. The most critical findings include outdated Next.js framework with known vulnerabilities, missing rate limiting controls, insufficient input validation, and weak random number generation for access codes.

**Risk Level: HIGH**

### Issues by Severity
- **Critical:** 3 issues
- **High:** 5 issues
- **Medium:** 5 issues
- **Low:** 3 issues

---

## Critical Vulnerabilities

### 1. Outdated Next.js Framework with Multiple CVEs
**Severity:** Critical
**Location:** package.json:24
**CVSS Score:** 7.5 (High)

**Finding:**
The application uses Next.js 14.1.0, which has 6 known security vulnerabilities:
- **GHSA-fr5h-rqp8-mj6g** - Server-Side Request Forgery (SSRF) in Server Actions (CVSS 7.5)
- **GHSA-gp8f-8m3g-qvj9** - Cache Poisoning (CVSS 7.5)
- **GHSA-g77x-44xx-532m** - DoS in image optimization (CVSS 5.9)
- **GHSA-7m27-7ghc-44w9** - DoS with Server Actions (CVSS 5.3)
- **GHSA-3h52-269p-cp9r** - Information exposure in dev server
- **GHSA-g5qg-72qw-gw5v** - Cache key confusion

**Impact:**
- Potential SSRF attacks allowing server-side requests to internal resources
- Cache poisoning leading to serving incorrect content to users
- Denial of service attacks exhausting server resources
- Information disclosure

**Recommendation:**
```bash
npm install next@latest
# Currently latest stable: 14.2.30+
```

**Priority:** Immediate

---

### 2. No Rate Limiting on API Routes
**Severity:** Critical
**Location:** src/app/api/generate-questions/route.ts:7

**Finding:**
The `/api/generate-questions` endpoint has no rate limiting, throttling, or request quota controls. This endpoint:
- Makes expensive Anthropic API calls (up to 16,000 tokens per request)
- Processes file uploads (up to 10MB)
- Creates 4 question sets per request (4x AI calls)
- Is publicly accessible without authentication

**Attack Scenario:**
```bash
# Attacker can exhaust API quota and costs
for i in {1..1000}; do
  curl -X POST https://exam-prepper.vercel.app/api/generate-questions \
    -F "subject=test" \
    -F "questionCount=200" \
    -F "questionSetName=spam" \
    -F "materialText=spam"
done
```

**Impact:**
- Financial damage: Unlimited Anthropic API costs
- Service degradation: Database pollution with spam question sets
- Denial of service: API quota exhaustion

**Recommendation:**
Implement rate limiting middleware:
```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 requests per hour
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/generate-questions')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }
}
```

**Priority:** Immediate

---

### 3. Cryptographically Weak Random Code Generation
**Severity:** Critical
**Location:** src/lib/utils/codeGenerator.ts:6

**Finding:**
Access codes use `Math.random()` for generation, which is NOT cryptographically secure:

```typescript
export function generateCode(): string {
  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
}
```

**Vulnerability:**
- `Math.random()` is predictable and can be reverse-engineered
- With only 36^6 = ~2 billion combinations, brute force is feasible
- Attack can enumerate all question sets by trying predictable codes

**Impact:**
- Unauthorized access to private question sets
- Code prediction and enumeration attacks

**Recommendation:**
Use cryptographically secure random generation:
```typescript
import crypto from 'crypto';

export function generateCode(): string {
  const bytes = crypto.randomBytes(4);
  const code = bytes.toString('base64')
    .replace(/[^A-Z0-9]/gi, '')
    .substring(0, 6)
    .toUpperCase();

  // Ensure 6 characters, regenerate if needed
  return code.length === 6 ? code : generateCode();
}
```

**Priority:** Immediate

---

## High Severity Issues

### 4. Missing Server-Side File Type Validation
**Severity:** High
**Location:** src/app/api/generate-questions/route.ts:34-44

**Finding:**
File uploads only validate MIME types client-side. Server accepts any file content without validation:

```typescript
for (const [, value] of fileEntries) {
  if (value instanceof File) {
    const arrayBuffer = await value.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    files.push({
      type: value.type,  // ⚠️ Trusts client-provided MIME type
      name: value.name,
      data: base64,
    });
  }
}
```

**Attack Scenario:**
Attacker uploads malicious file with fake MIME type:
```javascript
// Client-side bypass
const maliciousFile = new File(
  [malwarePayload],
  "exploit.pdf",
  { type: "application/pdf" } // Fake MIME type
);
```

**Impact:**
- Malicious file content sent to Anthropic API
- Potential exploitation of PDF/image parsing vulnerabilities
- Storage of malicious content in database (if images stored)

**Recommendation:**
Add server-side MIME type validation using magic bytes:
```typescript
import { fileTypeFromBuffer } from 'file-type';

const buffer = Buffer.from(arrayBuffer);
const fileType = await fileTypeFromBuffer(buffer);

// Validate actual file type
const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
if (!fileType || !allowedTypes.includes(fileType.mime)) {
  return NextResponse.json(
    { error: 'Invalid file type' },
    { status: 400 }
  );
}
```

**Priority:** High

---

### 5. No Input Sanitization for User-Generated Content
**Severity:** High
**Location:**
- src/app/api/generate-questions/route.ts:14-18
- src/app/create/page.tsx:216-233

**Finding:**
User inputs are not sanitized before storage or display:
- `questionSetName` - Stored and displayed without sanitization
- `subject` - Stored and displayed without sanitization
- `materialText` - Sent to AI without limits or sanitization
- `topic`, `subtopic` - Optional fields, no validation

**XSS Risk:**
While React escapes HTML by default, issues remain:
1. AI-generated questions stored in database could contain malicious content
2. No length limits on text fields (DoS via huge inputs)
3. No sanitization of special characters

**Attack Scenario:**
```javascript
// Create question set with malicious name
questionSetName: "<script>alert('xss')</script>".repeat(10000)
```

**Impact:**
- Potential XSS if data used in unsafe contexts
- Database pollution with garbage data
- DoS via extremely large text inputs

**Recommendation:**
Add input validation:
```typescript
import { z } from 'zod';

const createQuestionSetSchema = z.object({
  questionSetName: z.string().min(1).max(200).trim(),
  subject: z.string().min(1).max(100).trim(),
  materialText: z.string().max(50000).optional(),
  topic: z.string().max(200).optional(),
  subtopic: z.string().max(200).optional(),
  grade: z.number().int().min(1).max(13).optional(),
  questionCount: z.number().int().min(50).max(200),
});

// Validate before processing
const validated = createQuestionSetSchema.parse({
  questionSetName,
  subject,
  // ... other fields
});
```

**Priority:** High

---

### 6. Missing CORS Configuration
**Severity:** High
**Location:** No middleware.ts or CORS headers

**Finding:**
No CORS policy is configured, allowing any origin to call the API routes.

**Impact:**
- Cross-origin requests can be made from any domain
- Potential for CSRF attacks (though mitigated by Next.js default protections)
- API can be called from malicious websites

**Recommendation:**
Add CORS middleware:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL];

  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (origin && !allowedOrigins.includes(origin)) {
      return new NextResponse(null, { status: 403 });
    }
  }
}
```

**Priority:** High

---

### 7. Insufficient Error Handling Exposes Stack Traces
**Severity:** High
**Location:** Multiple locations

**Finding:**
Error messages may expose sensitive information:

```typescript
// src/app/api/generate-questions/route.ts:134
return NextResponse.json(
  { error: error instanceof Error ? error.message : 'Internal server error' },
  { status: 500 }
);
```

While better than raw stack traces, error messages from Anthropic SDK or Supabase may leak sensitive details.

**Impact:**
- Information disclosure about system internals
- Database schema exposure via Supabase errors
- API key format exposure via Anthropic errors

**Recommendation:**
Sanitize all errors in production:
```typescript
const isProduction = process.env.NODE_ENV === 'production';

return NextResponse.json(
  {
    error: isProduction
      ? 'Failed to generate questions'
      : error instanceof Error ? error.message : 'Unknown error'
  },
  { status: 500 }
);
```

**Priority:** High

---

### 8. No Content Security Policy (CSP) Headers
**Severity:** High
**Location:** next.config.js (missing)

**Finding:**
No CSP headers are configured, allowing execution of inline scripts and loading resources from any origin.

**Impact:**
- Increased XSS attack surface
- Risk of malicious script injection
- No protection against clickjacking

**Recommendation:**
Add CSP headers in next.config.js:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

**Priority:** High

---

## Medium Severity Issues

### 9. No Maximum File Size Validation
**Severity:** Medium
**Location:** src/app/api/generate-questions/route.ts:36

**Finding:**
While `next.config.js` sets `bodySizeLimit: '10mb'`, there's no explicit file size validation or count limits:
- No limit on number of files uploaded
- No per-file size limits
- 10MB is generous for text/PDF materials

**Impact:**
- DoS via large file uploads
- Excessive memory usage converting to base64
- High Anthropic API costs for large files

**Recommendation:**
Add file validation:
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

if (fileEntries.length > MAX_FILES) {
  return NextResponse.json(
    { error: `Maximum ${MAX_FILES} files allowed` },
    { status: 400 }
  );
}

for (const [, value] of fileEntries) {
  if (value instanceof File) {
    if (value.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File ${value.name} exceeds 5MB limit` },
        { status: 400 }
      );
    }
    // ... process file
  }
}
```

**Priority:** Medium

---

### 10. Database Connection String Exposure Risk
**Severity:** Medium
**Location:** Environment variables

**Finding:**
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed to clients. While this is normal for Supabase, it creates risks:
- Anon key is visible in browser
- Direct database access from client (mitigated by RLS)
- Potential for API quota exhaustion

**Impact:**
- Attackers can query database directly
- No server-side control over read queries
- Potential for complex queries causing performance issues

**Recommendation:**
- Ensure RLS policies are comprehensive
- Consider moving read operations to API routes for sensitive data
- Monitor Supabase logs for suspicious query patterns
- Set up query performance monitoring

**Priority:** Medium

---

### 11. Weak Code Collision Handling
**Severity:** Medium
**Location:** src/app/api/generate-questions/route.ts:83-109

**Finding:**
Code collision retry logic has issues:
```typescript
let attempts = 0;
const maxAttempts = 10;

while (attempts < maxAttempts && !result) {
  result = await createQuestionSet(...);
  if (!result) {
    code = generateCode();
    attempts++;
  }
}
```

Issues:
- Only 10 attempts before failure
- No logging of collision frequency
- Database is queried for each retry (inefficient)
- No monitoring of code space exhaustion

**Impact:**
- Failed question set creation as database grows
- Poor user experience with cryptic errors
- No visibility into collision rates

**Recommendation:**
- Increase retry attempts to 50
- Add collision logging/monitoring
- Pre-check code availability before insert
- Alert when collision rate exceeds threshold

**Priority:** Medium

---

### 12. No Request Timeout Configuration
**Severity:** Medium
**Location:** src/lib/ai/anthropic.ts:28-42

**Finding:**
Anthropic API calls have no timeout configured. Requests can hang indefinitely:

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 16000,
  messages: [...]
  // ⚠️ No timeout parameter
});
```

**Impact:**
- Requests can hang for minutes/hours
- Poor user experience
- Resource exhaustion if many requests hang

**Recommendation:**
Add timeout and error handling:
```typescript
import { setTimeout } from 'timers/promises';

const timeoutMs = 120000; // 2 minutes

const responsePromise = anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 16000,
  timeout: timeoutMs,
  messages: [...],
});

const response = await Promise.race([
  responsePromise,
  setTimeout(timeoutMs).then(() => {
    throw new Error('Request timeout');
  })
]);
```

**Priority:** Medium

---

### 13. AI Response Validation Insufficient
**Severity:** Medium
**Location:** src/lib/ai/questionGenerator.ts:77-85

**Finding:**
AI response parsing has minimal validation:

```typescript
try {
  parsedQuestions = JSON.parse(cleanContent);
} catch (error) {
  console.error('Failed to parse AI response:', cleanContent);
  throw new Error('AI returned invalid JSON format');
}
```

Missing validations:
- No schema validation of question structure
- No validation of required fields
- No sanitization of AI-generated content
- No length limits on AI responses

**Impact:**
- Malformed questions stored in database
- Potential XSS if AI returns malicious content
- Poor user experience with broken questions

**Recommendation:**
Add Zod schema validation:
```typescript
import { z } from 'zod';

const QuestionSchema = z.object({
  question: z.string().min(5).max(1000),
  type: z.enum(['multiple_choice', 'fill_blank', 'true_false', 'matching', 'short_answer']),
  options: z.array(z.string()).optional(),
  correct_answer: z.union([z.string(), z.boolean(), z.array(z.any())]),
  explanation: z.string().min(10).max(2000),
});

const parsedQuestions = QuestionSchema.array().parse(JSON.parse(cleanContent));
```

**Priority:** Medium

---

## Low Severity Issues

### 14. Missing Request Logging
**Severity:** Low
**Location:** All API routes

**Finding:**
No structured logging for:
- API requests and responses
- File uploads
- Error events
- Security events (failed validations, etc.)

**Impact:**
- Difficult to debug issues
- No audit trail
- Cannot detect attack patterns

**Recommendation:**
Add logging middleware with structured logger (e.g., Pino, Winston):
```typescript
import pino from 'pino';

const logger = pino();

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  logger.info({
    requestId,
    method: 'POST',
    path: '/api/generate-questions',
    ip: request.ip,
  }, 'Request received');

  try {
    // ... existing code
    logger.info({ requestId }, 'Request completed');
  } catch (error) {
    logger.error({ requestId, error }, 'Request failed');
  }
}
```

**Priority:** Low

---

### 15. No Dependency Version Pinning
**Severity:** Low
**Location:** package.json

**Finding:**
Dependencies use caret (^) versioning, allowing automatic minor/patch updates:
```json
"@anthropic-ai/sdk": "^0.30.1",
"@supabase/supabase-js": "^2.39.3",
```

**Impact:**
- Unpredictable builds
- Potential breaking changes
- Security patches may introduce bugs

**Recommendation:**
Use exact versions or lockfile only:
```json
"@anthropic-ai/sdk": "0.30.1",
"@supabase/supabase-js": "2.39.3",
```

And ensure `package-lock.json` is committed.

**Priority:** Low

---

### 16. Sensitive Data in Console Logs
**Severity:** Low
**Location:** Multiple files

**Finding:**
Error logging may expose sensitive data:
```typescript
console.error('Failed to parse AI response:', cleanContent); // May contain user material
console.error('Error calling Anthropic API:', error); // May contain API key
```

**Impact:**
- Sensitive data in application logs
- Potential PII exposure
- Compliance issues (GDPR, etc.)

**Recommendation:**
Sanitize logs in production:
```typescript
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  console.error('Failed to parse AI response');
} else {
  console.error('Failed to parse AI response:', cleanContent);
}
```

**Priority:** Low

---

## Positive Security Findings

The following security controls are properly implemented:

✅ **Environment Variable Management**
- `.gitignore` excludes `.env`, `.env.local`, and `.env.*` (while allowing `.env.example`)
- Secrets stored server-side only (ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY)
- `.env.example` uses placeholder-only sample values

✅ **Database Security**
- Row Level Security (RLS) enabled on all tables
- Public read-only access properly configured
- No client-side write capabilities
- Foreign keys with CASCADE delete
- Proper indexing for performance

✅ **TypeScript Type Safety**
- Strict mode enabled
- Full type coverage
- Database types auto-generated from Supabase

✅ **React XSS Protection**
- React escapes output by default
- No use of `dangerouslySetInnerHTML`
- shadcn/ui components are security-audited

✅ **API Key Security**
- Anthropic API key only used server-side
- Service role key never exposed to client
- Admin client properly isolated

---

## Remediation Roadmap

### Phase 1: Immediate (Within 24-48 hours)
1. ✅ Update Next.js to latest version (14.2.30+)
2. ✅ Implement rate limiting on `/api/generate-questions`
3. ✅ Replace `Math.random()` with `crypto.randomBytes()`
4. ✅ Add server-side file type validation

### Phase 2: Short-term (Within 1 week)
5. ✅ Add input validation with Zod schemas
6. ✅ Implement CORS middleware
7. ✅ Add CSP and security headers
8. ✅ Sanitize error messages for production
9. ✅ Add file size and count limits

### Phase 3: Medium-term (Within 2 weeks)
10. ✅ Add request timeout configuration
11. ✅ Implement AI response validation
12. ✅ Improve code collision handling
13. ✅ Add structured logging
14. ✅ Monitor Supabase query patterns

### Phase 4: Long-term (Ongoing)
15. ✅ Set up dependency scanning automation
16. ✅ Implement security monitoring
17. ✅ Regular security audits
18. ✅ Penetration testing

---

## Testing Recommendations

1. **OWASP ZAP Scan**: Run automated vulnerability scan
2. **Manual Penetration Testing**: Test file upload, API abuse, XSS
3. **Load Testing**: Verify rate limiting effectiveness
4. **Dependency Scanning**: Set up Dependabot or Snyk
5. **SAST Tools**: Use SonarQube or similar

---

## Compliance Considerations

### GDPR / Privacy
- ❌ No privacy policy
- ❌ No cookie consent
- ❌ User material may contain PII - no data retention policy
- ⚠️ Consider adding data retention and deletion features

### Accessibility
- ✅ React components are accessible
- ⚠️ No ARIA labels audited
- ⚠️ No screen reader testing

---

## Security Contacts

For security issues, set up:
- `SECURITY.md` file with responsible disclosure policy
- Security email: security@yourdomain.com
- Bug bounty program (optional)

---

## Conclusion

The exam-prepper application has a **moderate security posture** with several critical issues requiring immediate attention. The most pressing concerns are:

1. Outdated Next.js framework with known CVEs
2. Missing rate limiting enabling DoS and cost attacks
3. Weak random number generation for access codes
4. Insufficient input validation and sanitization

However, the application demonstrates good practices in:
- Environment variable management
- Database security with RLS
- Type safety with TypeScript
- Server-side API key protection

**Recommendation:** Address Phase 1 issues immediately before production deployment. Implement Phases 2-3 within 2 weeks of launch.

---

**Review Status:** ✅ Complete
**Next Review:** Recommended after Phase 1 remediation
