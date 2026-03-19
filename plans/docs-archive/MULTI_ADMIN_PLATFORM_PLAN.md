# Multi-Admin Platform Plan

## Goal

Transform Koekertaaja into a secure multi-admin platform where:
- each admin can create and manage only their own question sets,
- each admin signs in with Supabase Auth,
- each admin can configure their own provider API key,
- public student play remains unchanged,
- and follow-on capabilities such as school tenancy, billing, and extra admin seats are added only after the core owner-scoped model is stable.

## Review Outcome

Plan status after review: **approve only as a phased program, not as one bundled feature**.

The original plan mixed three very different products into one stream:
- secure owner-scoped admin accounts,
- commercial workspace billing and seat sales,
- school/tenant and student identity extensions.

That bundling would create materially higher maintenance, support, and compliance load than the current app. The core multi-admin capability is supportable. The combined platform plan is support-heavy unless most repetitive workflows are automated and release scope is narrowed.

## DWF Alignment Review

This plan was reviewed against the current DWF set on 2026-03-16. Result: **partially aligned, with planned product-expansion gaps**.

### Confirmed alignments

- `DWF/USER_JOURNEYS.md` assumes student play is fast and anonymous. This plan preserves anonymous student play and treats any auth on `/play` as a release blocker.
- `DWF/TESTING_STRATEGY.md` emphasizes critical-path coverage over broad coverage. This plan aligns by requiring focused auth, ownership, and public-play regression tests rather than broad new test mandates.
- `DWF/DATA_SCHEMA.md` shows the live app already uses `auth.users` references in `question_sets.user_id` and `prompt_metrics.user_id`. The plan should build on that existing ownership field instead of adding a parallel owner column unless a rename is justified.

### DWF contradictions and planned expansion gaps

- `DWF/CORE_ARCHITECTURE.md` still says the app "requires no authentication (public access via shareable codes)". That remains true for students, but not for a future multi-admin teacher platform. The architecture ADR will need to distinguish anonymous student play from authenticated admin creation/management when implementation is approved.
- `DWF/NFR.md` currently states the application must not store PII including names, emails, and schools. If multi-admin auth and school grouping are implemented, that requirement will need to evolve into a minimal-data privacy model for admin identities.
- `DWF/DATA_MODEL.md` is not a Koekertaaja document at all and cannot be used as an authoritative source for this feature. Use `DWF/DATA_SCHEMA.md` for current schema truth until `DWF/DATA_MODEL.md` is replaced or repaired.

### Planning implication

Before implementation starts, the workstream should include follow-up documentation updates for:
- architecture text that splits anonymous student access from authenticated admin access,
- privacy/NFR text that defines the minimum allowed admin identity data,
- conceptual data-model ownership, either by repairing `DWF/DATA_MODEL.md` or explicitly using `DWF/DATA_SCHEMA.md` for this workstream.

## Executive Recommendation

Ship in this order:
1. **Phase A: Core multi-admin security**
   - Supabase Auth for admins
   - owner-scoped `question_sets.user_id`
   - owner-scoped writes
   - public published-set reads preserved
   - per-admin API key storage
2. **Phase B: Ops automation**
   - support intake, issue triage, alert routing, and low-risk bugfix PR workflow
3. **Phase C: Optional school grouping**
   - soft tenancy only
4. **Phase D: Paid seats and billing**
   - only if there is proven commercial demand

Do **not** launch workspace billing, extra admin seats, school tenancy, and student identity persistence in the same implementation wave as owner-scoped admin auth.

## Maintenance And Support Estimate

Assumptions for these estimates:
- small production footprint,
- under 50 active admin workspaces,
- one main provider path,
- no dedicated support team,
- one engineer handling most platform maintenance.

### Estimated steady-state load

| Scope | Typical recurring work | Estimated steady-state load | Automation potential |
|------|-------------------------|-----------------------------|----------------------|
| Core multi-admin only | login issues, owner-access bugs, API key save/rotate errors, provider drift | ~2-4 engineering days/month | 50-65% |
| Core multi-admin + school grouping | data access questions, school filtering confusion, school membership changes | ~3-6 engineering days/month | 45-60% |
| Core multi-admin + billing/seats | invite failures, billing webhook failures, payment disputes, downgrade edge cases, seat reconciliation | ~6-10 engineering days/month | 60-75% |
| Full combined platform incl. student identity persistence | all above plus retention, export/delete handling, pseudonymous identity recovery, compliance work | ~8-15 engineering days/month | 35-55% |

### Practical reading of the estimate

- **Core multi-admin only** is reasonable for this product. Expect about **0.1-0.2 FTE** ongoing maintenance after stabilization.
- Adding **billing and seat management** roughly doubles or triples support burden because many incidents become account-state or webhook-state problems rather than code bugs.
- Adding **student persistence and broader compliance workflows** creates a different operational profile: fewer repetitive tickets can be fully automated, and more cases require judgment.

## What Actually Creates The Support Load

### Low-to-medium ongoing load

- admin sign-up/sign-in problems,
- ownership migration edge cases,
- per-admin API key save/rotate/deactivate flows,
- provider model changes or quota failures,
- occasional RLS or route-scoping regressions.

### High ongoing load if included

- invite acceptance failures,
- seat count mismatches,
- failed Stripe webhook reconciliation,
- account recovery for workspace owners,
- downgrade grace-period enforcement,
- school membership changes and mistaken access expectations,
- GDPR export/deletion workflows if identity scope expands.

## Recommended Scope Boundary

For the first release, keep the plan limited to:
- admin authentication,
- owner-scoped authorization,
- per-admin key management,
- audit logging,
- public student play continuity.

Explicitly defer:
- paid seat sales,
- workspace billing,
- strict school tenancy,
- persistent student profiles,
- delegated editing/collaboration roles.

## Privacy And GDPR Scope

Multi-admin changes are not only an auth feature. They create a new privacy model because the app would start storing teacher/admin identity data and potentially school affiliation data.

### Data protection principle

Keep the student experience anonymous by default and limit stored identity data to the smallest set needed for admin account operation.

### Data categories introduced by this plan

- **Admin identity data**
  - Supabase Auth user ID
  - email address
  - optional display name
- **Admin operational metadata**
  - last sign-in
  - API key audit metadata
  - generation usage and cost metrics
- **Optional organizational data**
  - school name or school identifier
  - workspace membership if billing/seats are ever added

### Data categories that should remain out of scope

- student accounts by default,
- student email addresses,
- student names tied to persistent accounts,
- unnecessary teacher profile fields such as phone number or home address,
- raw API keys in logs, analytics, exports, or support tools.

### GDPR topics that must be part of implementation planning

- lawful basis for storing admin identity and operational data,
- privacy notice updates for authenticated admin users,
- data minimization rules for admin profiles and school records,
- retention rules for auth-adjacent logs, API key audit data, and generation metrics,
- right-to-access workflow for admin account data,
- right-to-erasure workflow for admin account deletion,
- data export workflow for admin-owned question sets and account metadata,
- processor/subprocessor review for Supabase, AI providers, error monitoring, analytics, and billing tools,
- breach handling and secret-exposure response process,
- support-tool access limits so issue triage automation does not expose personal data unnecessarily.

### Recommended privacy delivery model

Treat privacy/GDPR as a first-class implementation track that runs in parallel with auth and ownership work:

1. Define allowed data fields and retention before schema tightening.
2. Implement admin auth and owner scoping.
3. Add audit metadata with redaction rules.
4. Add admin export/delete workflows before broad rollout.
5. Add school data only after the minimal admin-identity path is stable.

### Support impact of privacy requirements

Privacy/GDPR requirements reduce automation potential for some support classes:

- export/delete requests should be prepared by automation but approved by a human,
- access disputes should be triaged automatically but resolved by a human,
- incidents involving secrets or personal data should bypass agent-safe autonomous fix workflows.

## How Much Can Be Automated

### Realistic automation split

- **50-70%** of repetitive intake, triage, routing, labeling, reproduction gathering, and low-risk remediation can be automated.
- **20-35%** of real incidents can be fixed end-to-end without human judgment if they are narrow and well-tested.
- **0-15%** of compliance, billing disputes, migration mistakes, or ambiguous access-control issues should be fully automated.

### Best candidates for automation

- classify incoming bugs and support requests,
- attach logs and known environment context,
- identify likely owner files and services,
- generate a minimal repro summary,
- open a scoped engineering task,
- implement low-risk fixes behind existing patterns,
- run checks and open a PR,
- monitor for regressions after deploy.

### Poor candidates for full automation

- schema migration decisions,
- RLS policy changes,
- billing state corrections,
- account ownership disputes,
- GDPR deletion/export approvals,
- cross-tenant access incidents.

## Recommended Automation Tooling

### Intake and tracking

- **GitHub Issue Forms**
  - separate forms for bug, access problem, billing problem, provider/API key problem, and security report.
- **GitHub Projects**
  - track support queue, engineering triage, and automation-eligible incidents separately.
- **Labels**
  - `bug`, `access`, `provider`, `billing`, `security`, `multi-admin`, `ops`, `agent-safe`, `needs-human`, `sev1`, `sev2`, `sev3`.

### Monitoring and alert sources

- **Sentry**
  - runtime errors, route failures, auth failures, client regressions.
- **Supabase logs / alerts**
  - failed queries, RLS denials, auth anomalies, webhook handler errors.
- **Stripe webhooks + alerting** if billing is later introduced
  - payment failures, webhook retries, subscription state drift.
- **PostHog or equivalent**
  - conversion and flow drop-offs on sign-in, API key save, create, publish, and play-test flows.

### Triage and execution agents

- **GitHub Actions**
  - assign labels, severity, stale state, and routing based on issue template fields.
- **Codex/Claude CLI agents in repo**
  - triage issue -> generate scoped `todo/` task -> produce fix branch -> run checks -> prepare PR.
- **Existing task runner workflow**
  - use `scripts/run-tasks-codex.sh` or `scripts/run-tasks-claude.sh` to keep fixes isolated and traceable.

### PR and merge safety

- **GitHub Actions CI**
  - `npm run typecheck`
  - `npm run lint`
  - relevant tests
  - targeted migration/RLS tests when owner-scoped auth changes are touched
- **Dependabot or Renovate**
  - dependency update automation, but keep auth, Supabase, and billing libraries on stricter review.

## Recommended Automation Workflow

### Issue -> triage -> fix -> PR

1. A bug or support issue is created through a GitHub Issue Form.
2. A GitHub Action normalizes labels, severity, affected area, and required metadata.
3. An agent triages the issue:
   - searches the repo,
   - checks recent changes,
   - summarizes likely root cause,
   - determines whether the issue is `agent-safe` or `needs-human`.
4. If `agent-safe`, the agent creates or updates a scoped task in `todo/`.
5. The task runner executes the fix in isolation.
6. The agent runs required checks and opens a PR with:
   - root cause,
   - change summary,
   - risk notes,
   - verification performed.
7. Human review is still required for:
   - auth changes,
   - RLS changes,
   - migration changes,
   - billing logic,
   - deletion/export flows.

### Good automation targets for this repo

- UI regressions in admin settings flows,
- incorrect owner scoping in route handlers,
- missing masking/redaction in API key responses,
- issue-specific test additions,
- docs and plan updates after implementation changes.

### Mandatory human review gates

- Supabase migration files,
- RLS policies,
- service-role usage changes,
- Stripe webhook behavior,
- data retention and deletion jobs,
- security-sensitive configuration.

## Proposed Architecture

### 1) Identity and authorization baseline

Use `auth.users` as the admin identity source.

Core rule:
- browser clients access data only through RLS-protected paths,
- service-role usage is minimized,
- owner-scoped writes must always derive ownership from the authenticated session, never from client payload.

### 2) Core data model

- `admin_profiles`
  - `user_id uuid primary key references auth.users(id)`
  - `display_name text`
  - `created_at timestamptz`

- `question_sets` (existing table update)
  - use existing `user_id uuid references auth.users(id)` as the owner field
  - backfill existing null `user_id` rows before enforcing stronger ownership guarantees
  - add or keep index on `(user_id, created_at desc)`

- `admin_api_keys`
  - `id uuid primary key`
  - `user_id uuid not null references auth.users(id)`
  - `provider text not null`
  - `encrypted_api_key text not null`
  - `key_last4 text not null`
  - `is_active boolean not null default true`
  - `last_used_at timestamptz null`
  - `last_used_provider_model text null`
  - `last_error text null`
  - `estimated_cost_usd numeric null`
  - `created_at timestamptz`
  - `updated_at timestamptz`
  - partial unique index on `(user_id, provider)` where `is_active = true`

### 3) Optional later data model

Add only after core multi-admin is stable:

- `schools`
  - `id uuid primary key`
  - `name text unique`
  - `created_at timestamptz`

- `admin_profiles.school_id uuid null references schools(id)`

- `workspaces`
  - only if commercial seat billing is proven necessary

Do not add student identity tables in the first multi-admin release.

### 4) RLS policies

Enable RLS and enforce:

- `question_sets`
  - owner can read own sets
  - owner can update/delete own sets
  - insert requires `user_id = auth.uid()`
  - public read for `published` sets must remain explicitly preserved for student play

- `admin_profiles`
  - user can select/update own profile only

- `admin_api_keys`
  - user can select/insert/update/delete only where `user_id = auth.uid()`

### 5) Route and service-layer changes

All write endpoints must:
- resolve authenticated user first,
- write `user_id` from session,
- reject cross-owner access in the same query predicate,
- avoid trusting client-supplied owner identifiers.

Admin-only route protection:
- protect only admin pages and owner-scoped write APIs,
- explicitly exclude `/`, `/play/:path*`, published-set public reads, and static assets,
- add matcher tests so public student paths stay anonymous.

### 6) Per-admin API key management

Implementation requirements:

1. Add `/admin/settings/api-keys`.
2. Encrypt keys before DB write.
3. Never return full key material in responses.
4. Mask values as `••••1234`.
5. Log usage metadata without exposing secrets.
6. Redact secrets from logs and error payloads.

Encryption choice:
- prefer a managed secret solution if operationally available,
- otherwise use application-layer encryption with a dedicated master key and a documented rotation plan.

## Migration Plan

### Phase 0 — Preflight and risk reduction

- inventory existing question sets,
- choose legacy bootstrap owner for backfill,
- verify public published-set read behavior,
- confirm self-signup policy,
- close existing security gaps before adding auth:
  - rate limiting,
  - secure code generation,
  - RLS correctness,
  - CSP hardening.

Exit criteria:
- backfill owner decision documented,
- public read path documented and tested,
- security baseline tasks completed.

### Phase 1 — Auth and ownership

- standardize on `question_sets.user_id` as the owner field,
- deploy compatible code,
- backfill legacy null `user_id` rows,
- verify counts,
- decide whether `NOT NULL` is safe or whether legacy/public rows must remain nullable temporarily,
- add owner-scoped RLS and route predicates.

Exit criteria:
- all owner-scoped `question_sets.user_id` values populated for rows that should be admin-owned,
- anonymous student read path still works,
- cross-owner write attempts fail in tests.

### Phase 2 — API hardening

- patch all owner-scoped write routes,
- apply admin middleware allowlist,
- add negative tests for unauthenticated and cross-owner access,
- verify service-role paths do not bypass ownership.

Exit criteria:
- route inventory is complete,
- unauthenticated admin writes fail,
- public student routes remain accessible.

### Phase 3 — Per-admin API keys

- create `admin_api_keys`,
- ship API key settings UI,
- add encryption and masked reads,
- route generation through per-user key resolver,
- add usage metadata,
- add secret redaction and breach-response playbook inputs.

Exit criteria:
- secrets are never returned or logged,
- provider calls use the authenticated admin's active key,
- key rotation and deactivation are tested.

### Phase 4 — Support automation

- introduce issue forms and labels,
- add alert-to-issue routing,
- implement agent triage workflow,
- enable agent-safe fix -> PR automation for low-risk classes,
- classify privacy/security incidents as mandatory human-review items.

Exit criteria:
- triage metadata is added automatically,
- low-risk issues can produce draft PRs,
- human review gates are enforced for sensitive changes.

### Phase 5 — Optional school grouping

- add `schools`,
- add optional `school_id` on `admin_profiles`,
- keep ownership primary,
- use school grouping only for filtering and analytics first,
- re-check privacy notice, retention, and export scope before rollout.

Exit criteria:
- no change to owner-scoped authorization model,
- school grouping is feature-flagged,
- no regression in play or create flows.

### Cross-cutting privacy deliverables

- define admin data inventory,
- define retention schedule,
- define export/delete workflows,
- document secret redaction rules,
- define who can access support tools containing admin metadata.

### Deferred Phase — Billing and seat automation

Do not start until:
- at least Phase 4 is stable,
- there is commercial validation for paid seats,
- webhook and support ownership are explicitly staffed.

If started later, it should include:
- `workspaces`,
- `workspace_members`,
- `workspace_invites`,
- `workspace_billing`,
- Stripe Checkout,
- Billing Portal,
- webhook reconciliation,
- downgrade and grace-period rules.

## Commercial Model And Marketability

The plan currently assumes per-admin API key support, but that is not the same as proving that mandatory bring-your-own-key (`BYOK`) is commercially viable.

### Why this matters

For a mainstream school product, mandatory BYOK changes the product from "pay once and use" into "pay us, also buy and manage a separate AI provider account, and understand model billing". That shift can materially reduce conversion, trust, and institutional adoption.

### Model options

#### Option 1: Platform-paid usage

The app pays for LLM usage and charges customers through subscription, credits, or usage bundles.

Strengths:
- simplest onboarding,
- predictable experience,
- one vendor relationship,
- easier support ownership,
- strongest fit for schools and non-technical teachers.

Weaknesses:
- platform carries AI cost risk,
- requires stronger abuse controls,
- pricing must absorb model volatility.

#### Option 2: Mandatory BYOK

Every admin must connect their own OpenAI/Anthropic key before generation works.

Strengths:
- lower platform cost exposure,
- easier per-user cost isolation,
- attractive to technical power users with existing API accounts.

Weaknesses:
- much higher onboarding friction,
- weaker trust and conversion,
- more support tickets caused by provider account state,
- worse fit for schools and public-sector procurement,
- unclear total cost from the buyer perspective.

#### Option 3: Hybrid model

The app includes default platform-paid usage, while advanced users can optionally switch to BYOK.

Strengths:
- preserves simple onboarding,
- keeps mass-market potential,
- gives advanced users cost control,
- reduces forced dependency on external provider setup.

Weaknesses:
- more product complexity,
- requires clear fallback and billing rules,
- two support paths instead of one.

### Market impact of mandatory BYOK

Mandatory BYOK likely narrows the addressable market to:
- technically confident teachers,
- tutors,
- pilot users,
- AI-native early adopters.

It likely weakens adoption among:
- ordinary teachers,
- parents,
- schools with centralized procurement,
- municipalities and institutional buyers.

### Main risks created by mandatory BYOK

- **Conversion risk**
  - users may drop at the API key setup step before experiencing core value.
- **Trust risk**
  - users may hesitate to enter secrets into an education product even if storage is secure.
- **Support risk**
  - many incidents become provider billing, quota, rate-limit, or account-state issues outside direct app control.
- **Pricing confusion**
  - customers pay both the app and the model vendor, making the app feel like a thin wrapper.
- **Procurement risk**
  - schools may prefer one contract and one invoice, not app billing plus separate AI-provider spend.
- **Retention risk**
  - if a provider key expires, is revoked, or runs out of credit, the product's core value disappears immediately.
- **Responsibility ambiguity**
  - generation failures, latency, and quality issues will still be blamed on the app even when the root cause is external provider configuration.
- **Compliance complexity**
  - data-controller and processor expectations become harder to explain when prompts flow through customer-owned provider accounts.

### Planning implication

Per-admin API key management should be treated as a technical capability, not automatically as the default commercial model.

Before rollout, the product needs an explicit decision on:
- default commercial model: platform-paid, BYOK, or hybrid,
- onboarding path for non-technical users,
- fallback behavior when no valid user key exists,
- pricing copy that explains total user cost,
- support ownership boundaries for provider-account failures.

### Current recommendation

If broad school adoption is the goal:
- do **not** make BYOK the only path,
- prefer either platform-paid usage or a hybrid model,
- keep BYOK as an advanced option for cost-conscious or technical users.

If the near-term goal is only a narrow technical pilot:
- BYOK can be acceptable,
- but it should be called out as a deliberate market-narrowing choice, not an implementation detail.

## Admin UX Wireframes

This section defines the minimum admin-facing UI surfaces implied by the plan. These are planning wireframes only, not final design specs.

### 1) Admin question-set dashboard

**Route candidate**: `/admin` or authenticated `/create`

Purpose:
- list the current admin's own question sets,
- surface ownership-safe actions,
- provide entry points to create, publish, test, and manage keys.

```text
┌─────────────────────────────────────────────┐
│ Admin / Kysymyssarjat              [Profiili]│
│ Hallitse omia kysymyssarjoja turvallisesti  │
│                                             │
│ [Luo uusi] [API-avaimet] [Suodattimet]      │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Omat sarjat                            │ │
│ │ Haku...   [Luokka] [Aine] [Tila]       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Englanti / Helppo / Julkaistu          │ │
│ │ 120 kysymystä   Koodi ABC123           │ │
│ │ [Testaa] [Julkaise] [Muokkaa] [Poista] │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Biologia / Kortit / Luonnos            │ │
│ │ 80 kysymystä    Ei julkaistu           │ │
│ │ [Testaa] [Julkaise] [Muokkaa] [Poista] │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 2) API key settings

**Route**: `/admin/settings/api-keys`

Purpose:
- add, rotate, deactivate, and inspect masked provider credentials.

```text
┌─────────────────────────────────────────────┐
│ API-avaimet                         [Takaisin]│
│ Yhdista oma AI-palvelu tai hallitse avaimia │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ OpenAI                                  │ │
│ │ Avainta ei ole lisatty                  │ │
│ │ [Lisaa avain]                           │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Anthropic                               │ │
│ │ Aktiivinen: ••••1234                    │ │
│ │ Viimeksi kaytetty: 2 h sitten           │ │
│ │ [Vaihda] [Poista kaytosta]              │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Kaytto ja kustannukset                  │ │
│ │ Taman kuun arvio: $12.40                │ │
│ │ [Nayta historia]                        │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 3) Optional school/workspace settings

**Route candidate**: `/admin/settings/organization`

Purpose:
- only for later phases,
- manage school label, membership, and eventual billing/invite settings.

```text
┌─────────────────────────────────────────────┐
│ Koulu / Tyotila                    [Takaisin]│
│ Hallitse organisaation perustietoja         │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Koulu                                  │ │
│ │ [Espoon koulu]                         │ │
│ │ [Tallenna]                             │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Yllapitajat                             │ │
│ │ owner@koulu.fi   Omistaja               │ │
│ │ teacher@koulu.fi Admin                  │ │
│ │ [Kutsu uusi]                            │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 4) Access and privacy status surface

**Route candidate**: `/admin/settings/privacy`

Purpose:
- explain what admin data is stored,
- provide export/delete actions,
- reduce support load by making privacy behavior explicit.

```text
┌─────────────────────────────────────────────┐
│ Tietosuoja                         [Takaisin]│
│ Näin tiliäsi ja käyttödataa käsitellään     │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Tallennetut tiedot                      │ │
│ │ Sähköposti, näyttönimi, käyttömetriikat │ │
│ │ [Lataa tiedot]                          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Tilin poistaminen                       │ │
│ │ [Pyydä tilin poistoa]                   │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Proposed Admin Components

The existing DWF component library focuses on play/create flows. Multi-admin work will likely need a separate admin component layer.

### Core admin components

- `AdminShellHeader`
  - authenticated shell header with page title, account menu, and settings entry points.
- `AdminQuestionSetList`
  - owner-scoped list container for question sets.
- `AdminQuestionSetCard`
  - compact card showing subject, mode, status, code, counts, and safe actions.
- `AdminQuestionSetFilters`
  - search plus subject/grade/status filters.
- `AdminActionBar`
  - top-level action row for create, keys, and optional organization controls.

### API key and privacy components

- `ApiKeyProviderCard`
  - one provider per card with masked key state and actions.
- `ApiKeyFormDialog`
  - add/rotate provider key flow with validation and warning copy.
- `UsageCostSummaryCard`
  - displays per-admin usage/cost metadata if enabled.
- `PrivacyDataSummaryCard`
  - summarizes stored admin data categories.
- `ExportDeleteActionsCard`
  - wraps export/download and account deletion initiation actions.

### Optional later-phase organization components

- `SchoolSettingsCard`
  - school identifier/name display and edit form.
- `WorkspaceMemberList`
  - owner/admin member list for later seat-based phases.
- `InviteAdminDialog`
  - invite flow if team features are ever introduced.
- `BillingStatusCard`
  - subscription and seat summary for later billing phases only.

### Component boundary notes

- Admin components should stay separate from student play components.
- Public play routes must not depend on admin shell state.
- Billing and invite components should not be built in the first multi-admin phase unless the commercial model is approved.

## Open Questions To Resolve Before Implementation

1. What is the self-signup policy: open signup, domain allowlist, or invite-only?
2. Which account receives legacy question sets during backfill?
3. Does the current public `published` read policy stay exactly as-is?
4. Which encryption approach is used for admin API keys?
5. Should `question_sets.user_id` remain the canonical owner field, or is there a strong reason to rename it?
6. Is school grouping needed now, or can it be deferred?
7. Is there proven demand for paid extra admin seats, or is this still hypothetical?
8. Who handles owner account recovery?
9. What audit retention period is required for API key usage and generation logs?
10. Is per-admin cost tracking required before open signup is allowed?
11. Which incidents are approved for agent-safe autonomous fix -> PR?
12. What are the exact GDPR export and deletion obligations for admin account data in this product model?
13. Is school affiliation considered required business data or optional metadata?
14. What is the default commercial model: platform-paid usage, mandatory BYOK, or hybrid?
15. If BYOK exists, is it optional for advanced users or mandatory for all admins?
16. What is the fallback behavior when a user's provider key is missing, invalid, rate-limited, or out of credit?
17. Which DWF documents will need updating once implementation is approved: at minimum `CORE_ARCHITECTURE`, `NFR`, and a repaired `DATA_MODEL` or a documented exception using `DATA_SCHEMA`?

## Risks

| Risk | Severity | Why it matters | Mitigation |
|------|----------|----------------|------------|
| Public play accidentally blocked by auth | Critical | breaks the student product | strict matcher allowlist + route tests |
| Incomplete legacy owner backfill | High | blocks stronger ownership enforcement and creates orphaned rows | staged migration + verification query |
| Cross-owner write path missed | Critical | authorization bypass | exhaustive route inventory + negative tests |
| API key leakage in logs or responses | Critical | secret exposure | masking, redaction, tests, log review |
| Open signup causes AI spend abuse | High | direct cost escalation | rate limits + usage tracking + signup policy |
| Billing automation introduced too early | High | support burden exceeds team capacity | defer until core admin platform is stable |
| Privacy scope expands without clear retention/export/delete rules | Critical | GDPR and operational risk | define privacy track before rollout |
| Support automation exposes admin personal data too broadly | High | privacy incident via tooling | least-privilege support tooling + human review for sensitive cases |
| Mandatory BYOK shrinks market adoption | High | onboarding and procurement friction reduce conversion | prefer platform-paid or hybrid default |
| Provider-account failures dominate support load | High | core product breaks for reasons outside direct app control | define fallback, ownership boundaries, and clear user messaging |
| DWF remains outdated after approval and implementation | Medium | docs stop being authoritative and implementation drift accelerates | schedule DWF updates as part of rollout readiness |

## Validation And Testing Strategy

- Unit tests
  - ownership derivation,
  - owner-scoped predicates,
  - API key masking and resolver behavior.
- Integration tests
  - RLS allow/deny cases,
  - unauthenticated admin route rejection,
  - cross-owner mutation rejection.
- Security tests
  - secrets never logged,
  - public play remains accessible anonymously,
  - service-role paths cannot mutate across owners.
- Migration tests
  - owner backfill correctness,
  - rollback rehearsal for ownership migration.
- Ops automation tests
  - issue label workflow,
  - agent triage metadata generation,
  - PR checks required for `agent-safe` flows.

## Recommended Delivery Sequence

1. Security baseline fixes.
2. Auth plus owner-scoped `question_sets`.
3. Route hardening and tests.
4. Per-admin API keys.
5. Support automation.
6. Optional school grouping.
7. Only later: billing and seat automation.

This sequence minimizes maintenance burden while still delivering the actual high-value part of the admin platform.
