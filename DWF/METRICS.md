# Kyytirinki Metrics & Instrumentation Guide

**Version**: 1.0
**Last Updated**: 2025-12-25

---

## Metrics Philosophy

**Privacy-First Analytics**:
- ✅ Aggregate metrics only (no individual user tracking)
- ✅ No PII in events (no names, emails, addresses)
- ✅ Coarse geographic zones (postal code first 3 digits only)
- ✅ Opt-in for non-essential analytics
- ❌ No session replay or user profiling

**What We Measure**:
- Product health (engagement, retention, growth)
- Technical performance (latency, errors, uptime)
- Business metrics (revenue, costs, conversion)
- Privacy compliance (audit log coverage, data retention)

**What We DON'T Measure**:
- Individual user behavior patterns (profiling)
- Precise locations (only coarse zones)
- Child-specific data (no analytics on children)
- Message content or ride conversations

---

## Metrics Stack

### Core Tools

1. **Posthog** (Feature Flags + Aggregate Analytics)
   - Self-hosted on EU infrastructure
   - Feature flag management
   - Aggregate funnel analysis
   - A/B test results
   - Configuration: See ADR-001 (privacy-first settings)

2. **Vercel Analytics** (Performance Monitoring)
   - Web Vitals (LCP, FID, CLS, TTFB)
   - Page load times
   - API route performance
   - Edge function metrics

3. **Supabase Dashboard** (Database Metrics)
   - Query performance
   - RLS policy enforcement
   - Database size and growth
   - Connection pool usage

4. **Sentry** (Error Tracking) - Optional
   - Exception tracking
   - Error rate monitoring
   - Stack traces (with PII scrubbing)
   - Release tracking

---

## Product Metrics

### Activation Funnel

**Goal**: Minimize time from signup to first ride scheduled.

#### Events to Track

```typescript
// 1. User signs up
posthog.capture('user_signup_completed', {
  signup_method: 'email' | 'phone' | 'social',
  // NO: email, name, phone
});

// 2. User creates first pool
posthog.capture('pool_created', {
  pool_position: 1, // 1st, 2nd, 3rd pool
  activity_type: 'sports' | 'music' | 'other',
  member_count_initial: 1,
  has_recurrence_rule: boolean,
  // NO: pool name, destination address, user_id
});

// 3. User invites first member
posthog.capture('pool_invitation_sent', {
  pool_position: number,
  invitations_count: number,
  invitation_method: 'email' | 'sms' | 'link',
  // NO: recipient emails/phones
});

// 4. Invitation accepted
posthog.capture('pool_invitation_accepted', {
  time_since_invite_hours: number,
  pool_member_count: number,
  // NO: user identifiers
});

// 5. First ride scheduled
posthog.capture('first_ride_scheduled', {
  days_since_pool_creation: number,
  driver_assigned: boolean,
  pool_member_count: number,
});
```

#### Funnel Analysis

```sql
-- Activation Funnel Query (Posthog)
SELECT
  COUNT(DISTINCT CASE WHEN event = 'user_signup_completed' THEN session_id END) as signups,
  COUNT(DISTINCT CASE WHEN event = 'pool_created' THEN session_id END) as pools_created,
  COUNT(DISTINCT CASE WHEN event = 'pool_invitation_sent' THEN session_id END) as invitations_sent,
  COUNT(DISTINCT CASE WHEN event = 'first_ride_scheduled' THEN session_id END) as rides_scheduled
FROM events
WHERE timestamp >= NOW() - INTERVAL '30 days';
```

**Target Conversion Rates**:
- Signup → Pool Created: >80% (within 7 days)
- Pool Created → Invitation Sent: >90% (within 24 hours)
- Invitation Sent → Accepted: >70% (within 48 hours)
- Pool Created → First Ride: >85% (within 14 days)

---

### Engagement Metrics

**Goal**: Maximize active usage and pool health.

#### Events to Track

```typescript
// Daily Active User (DAU)
posthog.capture('app_opened', {
  platform: 'web' | 'pwa' | 'mobile',
  // Automatically deduped by Posthog (1 per user per day)
});

// Pool activity
posthog.capture('pool_viewed', {
  pool_member_count: number,
  upcoming_rides_count: number,
});

posthog.capture('ride_driver_assigned', {
  pool_member_count: number,
  time_until_ride_hours: number,
  assignment_method: 'manual' | 'suggested' | 'rotation',
});

posthog.capture('ride_absence_marked', {
  time_until_ride_hours: number,
  absence_reason: 'sick' | 'schedule_conflict' | 'other' | null,
});

posthog.capture('ride_completed', {
  pool_member_count: number,
  participant_count: number, // How many actually rode
  was_on_time: boolean,
});
```

#### Calculated Metrics

```typescript
// Weekly Active Users (WAU)
// Users who opened app or performed action in last 7 days
SELECT COUNT(DISTINCT user_id)
FROM events
WHERE timestamp >= NOW() - INTERVAL '7 days';

// Stickiness (DAU/MAU ratio)
// Higher is better (daily habit formation)
const stickiness = DAU / MAU;
// Target: >0.4 (40% of monthly users active daily)

// Active Pool Rate
// Pools with ≥1 ride in last 30 days
SELECT
  COUNT(DISTINCT CASE WHEN ride_count > 0 THEN pool_id END) * 100.0 /
  COUNT(DISTINCT pool_id) as active_pool_rate
FROM (
  SELECT pool_id, COUNT(*) as ride_count
  FROM rides
  WHERE scheduled_date >= NOW() - INTERVAL '30 days'
  AND status IN ('scheduled', 'in_progress', 'completed')
  GROUP BY pool_id
);
// Target: >80%
```

---

### Retention Metrics

**Goal**: Keep users coming back week after week.

#### Cohort Retention

```typescript
// Track user signup cohort
posthog.capture('user_signup_completed', {
  signup_week: '2025-W01', // ISO week format
});

// Track return visit
posthog.capture('app_opened', {
  // Posthog automatically calculates retention
});
```

#### Retention Analysis (Posthog Query)

```sql
-- 30-day cohort retention
SELECT
  cohort_week,
  COUNT(DISTINCT user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN weeks_since_signup = 1 THEN user_id END) * 100.0 / cohort_size as week_1_retention,
  COUNT(DISTINCT CASE WHEN weeks_since_signup = 4 THEN user_id END) * 100.0 / cohort_size as week_4_retention,
  COUNT(DISTINCT CASE WHEN weeks_since_signup = 12 THEN user_id END) * 100.0 / cohort_size as week_12_retention
FROM user_activity_cohorts
GROUP BY cohort_week;
```

**Target Retention**:
- Week 1: >80% (users return within 7 days)
- Week 4: >60% (monthly retention)
- Week 12: >40% (quarterly retention)

#### Churn Indicators

```typescript
// Pool inactivity warning
// Trigger: No rides scheduled in next 14 days
posthog.capture('pool_inactivity_detected', {
  days_since_last_ride: number,
  pool_age_days: number,
  member_count: number,
});

// User hasn't opened app in 14 days
// (Background job tracks this, sends re-engagement email)
posthog.capture('user_dormant', {
  days_since_last_activity: number,
  pools_count: number,
  upcoming_rides_count: number,
});
```

---

### Growth Metrics

**Goal**: Viral growth through invitation referrals.

#### Viral Coefficient (K-factor)

```typescript
// Invitation sent
posthog.capture('pool_invitation_sent', {
  inviter_days_since_signup: number,
  invitations_count: number,
});

// Invitation accepted (new signup)
posthog.capture('user_signup_completed', {
  signup_method: 'invitation',
  invitation_source: 'email' | 'sms' | 'link',
});

// Calculate K-factor
// K = (Invitations per user) × (Conversion rate)
// K > 1 = viral growth
const K = (invitations_sent_per_user) * (invitation_acceptance_rate);
// Target: >0.8 (near-viral, supplement with paid acquisition)
```

#### Referral Funnel

```typescript
// Invitation delivered
posthog.capture('invitation_delivered', {
  delivery_method: 'email' | 'sms',
  // NO: recipient info
});

// Invitation clicked
posthog.capture('invitation_clicked', {
  hours_since_sent: number,
  device_type: 'mobile' | 'desktop',
});

// Invitation converted (signup)
posthog.capture('invitation_converted', {
  hours_since_sent: number,
  pool_member_count: number,
});
```

**Target Metrics**:
- Invitation delivery rate: >95%
- Invitation click rate: >50%
- Invitation signup rate: >70%
- Overall invitation conversion: >35%

---

## Revenue Metrics (Phase 2)

### Ad Revenue

```typescript
// Ad impression (consent required)
posthog.capture('ad_impression', {
  ad_id: string,
  placement: 'pool_creation' | 'ride_confirmation' | 'email_digest',
  activity_type: 'sports' | 'music' | 'other',
  postal_zone: '012xx', // First 3 digits only
  // NO: user_id (aggregate only)
});

// Ad click
posthog.capture('ad_click', {
  ad_id: string,
  placement: string,
  time_to_click_seconds: number,
});

// Revenue metrics (aggregate)
SELECT
  DATE(timestamp) as date,
  COUNT(*) as impressions,
  COUNT(DISTINCT ad_id) as unique_ads,
  SUM(CASE WHEN event = 'ad_click' THEN 1 ELSE 0 END) as clicks,
  SUM(CASE WHEN event = 'ad_click' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as ctr
FROM events
WHERE event IN ('ad_impression', 'ad_click')
GROUP BY DATE(timestamp);
```

**Target Metrics**:
- Click-through rate (CTR): 2-5%
- Cost per impression (CPM): €2 per 1000 views
- Cost per click (CPC): €0.50
- Monthly ad revenue: €5,000+ by month 12

### Premium Subscriptions

```typescript
// Premium trial started
posthog.capture('premium_trial_started', {
  trial_source: 'onboarding' | 'ad_prompt' | 'settings',
  trial_duration_days: 14,
});

// Premium subscription created
posthog.capture('premium_subscription_created', {
  plan: 'monthly' | 'annual',
  price_eur: 4.99 | 49.99,
  payment_method: 'card' | 'paypal' | 'apple_pay',
});

// Premium churn
posthog.capture('premium_subscription_cancelled', {
  subscription_age_days: number,
  cancellation_reason: 'too_expensive' | 'not_using' | 'other',
});
```

**Target Metrics**:
- Premium conversion (from ad opt-out): 5-10%
- Premium trial-to-paid conversion: >40%
- Premium churn rate: <10% monthly
- Monthly recurring revenue (MRR): €1,000+ by month 12

---

## Technical Metrics

### Performance

#### Web Vitals (Vercel Analytics)

```typescript
// Largest Contentful Paint (LCP)
// Measures loading performance
// Target: <2.5 seconds (good), <4 seconds (acceptable)

// First Input Delay (FID)
// Measures interactivity
// Target: <100ms (good), <300ms (acceptable)

// Cumulative Layout Shift (CLS)
// Measures visual stability
// Target: <0.1 (good), <0.25 (acceptable)

// Time to First Byte (TTFB)
// Measures server response time
// Target: <600ms (good), <1500ms (acceptable)
```

#### Custom Performance Metrics

```typescript
// API route performance
// Automatically tracked by Vercel

// Database query performance
// Tracked via Supabase Dashboard + custom logging
export async function measureQueryPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - start;

    // Log slow queries (>100ms)
    if (duration > 100) {
      console.warn(`Slow query: ${queryName} took ${duration}ms`);
      posthog.capture('slow_query_detected', {
        query_name: queryName,
        duration_ms: Math.round(duration),
        threshold_ms: 100,
      });
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    posthog.capture('query_error', {
      query_name: queryName,
      duration_ms: Math.round(duration),
      error_type: error.constructor.name,
    });
    throw error;
  }
}
```

**Target Metrics**:
- Page load time (p50): <1 second
- Page load time (p95): <2 seconds
- API response time (p50): <200ms
- API response time (p95): <500ms
- Database query time (p95): <100ms

---

### Reliability

#### Error Tracking

```typescript
// Frontend errors (Sentry integration)
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Scrub PII before sending
  beforeSend(event) {
    // Remove sensitive data
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
    }

    // Remove sensitive breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.filter(
        crumb => !crumb.message?.includes('password')
      );
    }

    return event;
  },

  // Sample rate (not all errors sent)
  sampleRate: 0.5, // 50% of errors
  tracesSampleRate: 0.1, // 10% of transactions
});

// Custom error tracking
posthog.capture('error_occurred', {
  error_type: 'network' | 'validation' | 'auth' | 'unknown',
  error_code: string,
  page_path: window.location.pathname,
  // NO: stack traces, user data
});
```

#### Uptime Monitoring

```typescript
// Health check endpoint
// GET /api/health
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    auth: await checkAuth(),
    storage: await checkStorage(),
  };

  const isHealthy = Object.values(checks).every(c => c.healthy);

  return Response.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: isHealthy ? 200 : 503 }
  );
}

// External monitoring (e.g., UptimeRobot, Checkly)
// Pings /api/health every 5 minutes
// Alerts if response time >2s or status ≠ 200
```

**Target Metrics**:
- Uptime: >99.5% (max 3.6 hours downtime per month)
- Error rate: <0.1% of requests
- Mean time to recovery (MTTR): <30 minutes
- Mean time between failures (MTBF): >30 days

---

### Security & Privacy

#### Audit Log Coverage

```sql
-- Audit log coverage (% of sensitive operations logged)
SELECT
  operation_type,
  COUNT(*) as total_operations,
  COUNT(CASE WHEN logged THEN 1 END) * 100.0 / COUNT(*) as coverage_percent
FROM (
  SELECT 'child_data_access' as operation_type, COUNT(*) as total, COUNT(*) as logged FROM audit_logs WHERE log_type = 'child_data_access'
  UNION ALL
  SELECT 'address_access', COUNT(*) as total FROM pool_members WHERE pickup_address IS NOT NULL, COUNT(*) FROM audit_logs WHERE log_type = 'address_access'
  -- etc.
);
```

**Target**: 100% coverage for all sensitive operations

#### Data Retention Compliance

```sql
-- Data retention compliance check
SELECT
  log_type,
  retention_days,
  COUNT(CASE WHEN age_days > retention_days THEN 1 END) as overdue_deletions,
  COUNT(CASE WHEN age_days > retention_days THEN 1 END) * 100.0 / COUNT(*) as non_compliance_rate
FROM (
  SELECT
    log_type,
    EXTRACT(DAY FROM NOW() - created_at) as age_days,
    CASE
      WHEN log_type = 'child_data_access' THEN 90
      WHEN log_type = 'pool_operation' THEN 365
      WHEN log_type = 'ride_operation' THEN 180
      WHEN log_type = 'security_event' THEN 730
    END as retention_days
  FROM audit_logs
);
```

**Target**: 0% non-compliance (all old data deleted on schedule)

#### Encryption Coverage

```sql
-- Encryption coverage (% of child records encrypted)
SELECT
  COUNT(CASE WHEN first_name_encrypted IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as name_encryption_coverage,
  COUNT(CASE WHEN special_needs_encrypted IS NOT NULL OR special_needs_encrypted IS NULL THEN 1 END) * 100.0 / COUNT(*) as needs_encryption_coverage
FROM children;
```

**Target**: 100% encryption for all child names and special needs

---

## Metrics Dashboard Configuration

### Posthog Dashboard (Product Metrics)

**Dashboard 1: Activation & Growth**
- Panels:
  1. Signup funnel (7-day conversion)
  2. Invitation acceptance rate (trend)
  3. K-factor calculation (weekly)
  4. New pools created (daily)

**Dashboard 2: Engagement & Retention**
- Panels:
  1. DAU/WAU/MAU (line chart)
  2. Stickiness (DAU/MAU ratio)
  3. Cohort retention heatmap
  4. Active pool rate (%)

**Dashboard 3: Revenue** (Phase 2)
- Panels:
  1. Ad impressions & clicks (daily)
  2. CTR trend
  3. Premium subscriptions (MRR)
  4. Revenue breakdown (ads vs premium)

### Vercel Dashboard (Performance)

**Web Vitals Overview**
- LCP, FID, CLS, TTFB (p50, p75, p95)
- Page load times by route
- API route latencies
- Edge function performance

### Supabase Dashboard (Database)

**Database Health**
- Connection pool usage
- Query performance (slowest queries)
- RLS policy enforcement (success rate)
- Database size & growth rate

---

## Alerting & Monitoring

### Critical Alerts (Immediate Response)

| Alert | Condition | Channel | Response |
|-------|-----------|---------|----------|
| Service Down | Uptime <99% in 5 min | Slack + SMS | Investigate immediately |
| Database Error Rate | >1% errors in 5 min | Slack | Check DB logs, RLS policies |
| Signup Broken | 0 signups in 1 hour (weekday) | Slack | Test signup flow, check auth |
| Calendar Feed Failing | >10% errors in 15 min | Slack | Check Edge Function logs |
| Payment Failed | Any Stripe webhook failure | Email + Slack | Review payment logs |

### Warning Alerts (Within 24 Hours)

| Alert | Condition | Channel | Response |
|-------|-----------|---------|----------|
| Slow Queries | >5% queries >1s in 1 hour | Email | Optimize slow queries |
| High Error Rate | >0.5% errors in 1 hour | Email | Review error logs, Sentry |
| Low Conversion | Signup conversion <50% in 1 day | Email | A/B test signup flow |
| Retention Drop | 7-day retention <70% | Email | User research, re-engagement |

### Informational Alerts (Weekly Review)

| Metric | Threshold | Channel | Action |
|--------|-----------|---------|--------|
| WAU Growth | <10% month-over-month | Email | Review growth strategy |
| Churn Rate | >15% monthly | Email | User surveys, exit interviews |
| Ad CTR | <1.5% | Email | Review ad placements, relevance |

---

## Privacy-Safe Event Examples

### ✅ GOOD: Privacy-Preserving Events

```typescript
// Aggregate metrics, no PII
posthog.capture('pool_created', {
  activity_type: 'sports',
  member_count: 3,
  has_recurrence: true,
  postal_zone: '012xx', // Only first 3 digits
});

posthog.capture('ride_completed', {
  participant_count: 4,
  was_on_time: true,
  duration_minutes: 25,
});

posthog.capture('calendar_feed_generated', {
  event_count: 12,
  privacy_mode: 'full' | 'generic',
  // NO: user_id, IP address
});
```

### ❌ BAD: Privacy-Violating Events

```typescript
// DO NOT DO THIS - Creates user profiles
posthog.identify(user.id); // ❌ Identifies users
posthog.capture('pool_viewed', {
  user_id: user.id, // ❌ Tracks individuals
  user_email: user.email, // ❌ PII
  pool_name: 'Emma's Soccer', // ❌ May contain child names
  destination_address: 'Mannerheimintie 107', // ❌ Precise location
  child_name: 'Emma', // ❌ Child data
});
```

---

## Implementation Checklist

### Phase 1: MVP (Core Metrics)

- [ ] Set up self-hosted Posthog (EU infrastructure)
- [ ] Configure privacy-first settings (ADR-001)
- [ ] Implement activation funnel events
- [ ] Implement engagement events (DAU/WAU/MAU)
- [ ] Create Posthog dashboards (Activation, Engagement)
- [ ] Set up Vercel Analytics (Web Vitals)
- [ ] Configure Supabase monitoring (query performance)
- [ ] Create health check endpoint (/api/health)
- [ ] Set up uptime monitoring (UptimeRobot/Checkly)
- [ ] Configure critical alerts (Slack integration)

### Phase 2: Revenue Metrics

- [ ] Implement ad impression/click events
- [ ] Create revenue dashboard (Posthog)
- [ ] Integrate Stripe webhooks (subscription events)
- [ ] Track premium conversion funnel
- [ ] Monitor MRR growth

### Phase 3: Advanced Analytics

- [ ] Implement cohort retention analysis
- [ ] Set up A/B testing framework (Posthog feature flags)
- [ ] Create custom funnel analyses
- [ ] Build business intelligence dashboard (Metabase/Superset)

---

**Next Steps**:
1. Set up self-hosted Posthog instance
2. Implement first 10 core events (activation funnel)
3. Create Activation & Engagement dashboards
4. Configure critical alerts
5. Review metrics weekly in team standup
