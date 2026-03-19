# Data Schema (Supabase Snapshot)

**Version**: 1.1  
**Last Updated**: 2026-03-16  
**Source**: Supabase MCP (`get_project_url`, `list_tables`, `list_extensions`, `list_migrations`)  
**Scope**: Live schema snapshot for `public`, plus managed schema overview for `auth` and `storage`

---

## Overview

This document is a database schema snapshot generated from the currently linked Supabase project via MCP.

- Primary application tables are in `public`.
- Authentication and object storage infrastructure lives in managed `auth` and `storage` schemas.
- Row Level Security (RLS) is enabled on all application-facing `public` tables.
- Current linked project URL: `https://fzqepoqqagwyhmzowhyr.supabase.co`

---

## Public Schema

### `public.question_sets`

- Rows: 32
- RLS: enabled
- Primary key: `id`
- Foreign keys:
  - `user_id -> auth.users.id`
  - Referenced by:
    - `questions.question_set_id`
    - `map_questions.question_set_id`
    - `question_flags.question_set_id`
    - `prompt_metrics.question_set_id`

Key columns:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `code` | `varchar` | Unique, 6-char uppercase alphanumeric check |
| `name` | `text` | Set display name |
| `subject` | `varchar` | Subject label |
| `subject_type` | `text` | Subject grouping for prompts |
| `grade` | `int4` | Nullable, range check `1..13` |
| `mode` | `varchar` | `quiz` or `flashcard`, default `quiz` |
| `difficulty` | `varchar` | `helppo` / `normaali` / `vaikea` / `mahdoton` |
| `status` | `question_set_status` | Enum: `created`, `published`; default `created` |
| `question_count` | `int4` | Must be `> 0` |
| `exam_length` | `int4` | Default `15` |
| `exam_date` | `date` | Nullable |
| `topic`, `subtopic` | `text` | Nullable topic metadata |
| `prompt_metadata` | `jsonb` | Prompt/version metadata |
| `user_id` | `uuid` | Nullable owner |
| `created_at`, `updated_at` | `timestamptz` | Timestamps, default `now()` |

---

### `public.questions`

- Rows: 1168
- RLS: enabled
- Primary key: `id`
- Foreign keys:
  - `question_set_id -> public.question_sets.id`
  - Referenced by `question_flags.question_id`

Key columns:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `question_set_id` | `uuid` | Parent set |
| `question_text` | `text` | Question prompt |
| `question_type` | `varchar` | Checked against app-supported types (`multiple_choice`, `multiple_select`, `fill_blank`, `true_false`, `short_answer`, `matching`, `sequential`, `flashcard`, `map`) |
| `correct_answer` | `jsonb` | Required |
| `options` | `jsonb` | Nullable |
| `explanation` | `text` | Explanation text |
| `image_url` | `text` | Nullable visual asset URL |
| `order_index` | `int4` | Display/order index |
| `topic`, `subtopic`, `skill` | `text` | Nullable topic taxonomy fields |
| `created_at` | `timestamptz` | Default `now()` |

---

### `public.map_questions`

- Rows: 0
- RLS: enabled
- Primary key: `id`
- Foreign keys:
  - `question_set_id -> public.question_sets.id`

Key columns:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `question_set_id` | `uuid` | Parent set |
| `subject` | `text` | Default `Maantieto` |
| `question`, `explanation` | `text` | Required question content |
| `map_asset` | `text` | Map asset reference |
| `input_mode` | `text` | Input mode definition |
| `regions` | `jsonb` | Region metadata |
| `correct_answer` | `jsonb` | Required |
| `acceptable_answers` | `text[]` | Nullable alternatives |
| `topic`, `subtopic`, `skill` | `text` | Nullable taxonomy fields |
| `grade` | `int2` | Nullable |
| `difficulty` | `text` | Nullable |
| `metadata` | `jsonb` | Default `{}` |
| `created_at`, `updated_at` | `timestamptz` | Default `now()` |

---

### `public.question_flags`

- Rows: 0
- RLS: enabled
- Primary key: `id`
- Foreign keys:
  - `question_id -> public.questions.id`
  - `question_set_id -> public.question_sets.id`

Key columns:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `question_id` | `uuid` | Flagged question |
| `question_set_id` | `uuid` | Parent set |
| `reason` | `question_flag_reason` | Enum: `wrong_answer`, `ambiguous`, `typo`, `other` |
| `note` | `text` | Nullable free text |
| `client_id` | `text` | Client identifier |
| `created_at` | `timestamptz` | Default `now()` |

---

### `public.prompt_metrics`

- Rows: 23
- RLS: enabled
- Primary key: `id`
- Foreign keys:
  - `user_id -> auth.users.id`
  - `question_set_id -> public.question_sets.id`

Key columns:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `user_id` | `uuid` | Nullable actor |
| `question_set_id` | `uuid` | Nullable related set |
| `subject`, `difficulty`, `mode` | `text` | Mode checked to `quiz` / `flashcard` |
| `provider`, `model` | `text` | AI provider/model used |
| `prompt_version` | `jsonb` | Nullable version payload |
| `question_count_requested`, `question_count_generated`, `question_count_valid` | `int4` | Generation counts |
| `generation_latency_ms` | `int4` | Latency metric |
| `input_tokens`, `output_tokens` | `int4` | Nullable token metrics |
| `estimated_cost_usd` | `numeric` | Nullable cost estimate |
| `validation_pass_rate`, `skill_coverage`, `topic_coverage`, `type_variety_score` | `numeric` | Nullable quality metrics |
| `had_errors` | `bool` | Default `false` |
| `retry_count` | `int4` | Default `0` |
| `error_summary` | `text` | Nullable error summary |
| `created_at` | `timestamptz` | Default `now()` |

---

## Managed Schemas (Supabase)

These are platform-managed schemas used by Supabase services.

### `auth`

Observed tables include:

- `users`, `identities`, `sessions`, `refresh_tokens`
- `audit_log_entries`, `instances`, `schema_migrations`
- MFA tables (`mfa_factors`, `mfa_challenges`, `mfa_amr_claims`)
- SSO/OAuth tables (`sso_providers`, `sso_domains`, `saml_providers`, `oauth_clients`, etc.)

### `storage`

Observed tables include:

- `buckets`, `objects`
- multipart upload support tables
- storage migrations and vector/analytics tables

---

## Installed Extensions (Observed)

From the 2026-03-16 MCP snapshot, installed extensions include:

- `pg_graphql`
- `pg_stat_statements`
- `uuid-ossp`
- `pgcrypto`
- `supabase_vault`
- `plpgsql`

Note: Supabase MCP returns both installed and available extension metadata. The list above includes installed entries reported with `installed_version`.

---

## Latest Observed Tracked Migrations

From MCP `list_migrations` on 2026-03-16:

- `20251213111808` `add_insert_update_policies`
- `20260118232030` `add_subject_type_and_question_subtopic`
- `20260120172114` `add_map_questions_table`
- `20260128201002` `20260128_add_question_flags`
- `20260129141041` `20260129_question_flags_rls_policies`
- `20260212055849` `fix_questions_type_check_for_flashcard`
- `20260212055905` `fix_questions_type_check_for_flashcard_v2`
- `20260220113534` `enforce_rls_on_public_spatial_ref_sys`
- `20260223161207` `backfill_exam_date_from_created_at`

---

## Notes for Contributors

- For app-level schema evolution, prefer tracked SQL migrations under `supabase/migrations/`.
- Keep `DWF/DATA_MODEL.md` as the conceptual model and this file as the live schema snapshot reference.
- Re-run Supabase MCP schema extraction when adding/removing columns, constraints, or tables.
