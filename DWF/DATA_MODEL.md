# Data Model

**Version**: 1.0
**Last Updated**: 2026-01-17
**Purpose**: Document database schema, relationships, and data integrity constraints

---

## Overview

Kyytirinki uses **Supabase Postgres** as the primary database with **Row-Level Security (RLS)** for authorization. This document describes the entity-relationship model, field definitions, and data constraints.

---

## Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ pool_members : "joins"
    users ||--o{ guardians : "is_guardian_for"
    users ||--o{ ride_cars : "drives"
    users ||--o{ audit_logs : "performs_actions"

    children ||--o{ guardians : "has_guardians"
    children ||--o{ pool_children : "belongs_to_pools"
    children ||--o{ ride_participants : "participates_in"
    children ||--o{ child_pickup_addresses : "has_addresses"

    pools ||--o{ pool_members : "has_members"
    pools ||--o{ pool_children : "has_children"
    pools ||--o{ rides : "schedules"
    pools ||--o{ pool_ride_defaults : "has_defaults"

    rides ||--o{ ride_participants : "includes"
    rides ||--o{ ride_cars : "uses"
    rides ||--o{ ride_kpi_snapshots : "tracks_metrics"
    rides ||--o| rides : "return_ride"

    pool_members ||--o{ child_pickup_addresses : "has_addresses"

    users {
        uuid id PK
        text email UNIQUE
        text phone
        text full_name
        int car_seat_capacity
        text calendar_secret_token
        text calendar_privacy_mode
        boolean ad_consent_given
        timestamptz ad_consent_date
        text language_preference
        boolean is_deleted
        timestamptz created_at
        timestamptz updated_at
    }

    children {
        uuid id PK
        text first_name_encrypted
        text special_needs_encrypted
        boolean car_seat_required
        text pickup_address
        geography pickup_location
        text pickup_notes
        boolean is_deleted
        timestamptz created_at
        timestamptz updated_at
    }

    guardians {
        uuid id PK
        uuid user_id FK
        uuid child_id FK
        timestamptz created_at
    }

    pools {
        uuid id PK
        uuid creator_id FK
        text name
        text description
        text destination_name
        text destination_address
        geography destination_location
        jsonb recurrence_rule
        boolean return_enabled
        time return_time
        text invitation_code
        timestamptz invitation_expires_at
        boolean is_active
        boolean is_deleted
        timestamptz created_at
        timestamptz updated_at
    }

    pool_members {
        uuid id PK
        uuid pool_id FK
        uuid user_id FK
        text[] role
        text pickup_address
        geography pickup_location
        text pickup_notes
        text reveal_address_when
        boolean auto_hide_after_ride
        text driver_start_address
        geography driver_start_location
        boolean opt_out_driver_suggestions
        timestamptz joined_at
        timestamptz left_at
    }

    pool_children {
        uuid id PK
        uuid pool_id FK
        uuid child_id FK
        text pickup_address
        geography pickup_location
        text pickup_notes
        timestamptz created_at
    }

    rides {
        uuid id PK
        uuid pool_id FK
        date scheduled_date
        time outbound_time
        time return_time
        text status
        int version
        uuid outbound_driver_id FK
        uuid return_driver_id FK
        uuid return_ride_id FK
        jsonb route_geometry
        decimal route_distance_km
        int route_duration_min
        text cancellation_reason
        uuid cancelled_by FK
        timestamptz cancelled_at
        timestamptz started_at
        timestamptz completed_at
        timestamptz created_at
        timestamptz updated_at
    }

    ride_participants {
        uuid id PK
        uuid ride_id FK
        uuid child_id FK
        text direction
        boolean is_absent
        text absence_reason
        text pickup_address
        geography pickup_location
        timestamptz created_at
        timestamptz updated_at
    }

    ride_cars {
        uuid id PK
        uuid ride_id FK
        uuid driver_id FK
        text direction
        uuid[] assigned_child_ids
        int seat_capacity
        timestamptz created_at
        timestamptz updated_at
    }

    ride_kpi_snapshots {
        uuid id PK
        uuid ride_id FK
        int participant_count
        decimal distance_km_saved
        decimal co2_kg_saved
        timestamptz snapshot_at
    }
```

---

## Core Entities

### 1. Users

**Purpose**: Represents a registered user (parent/guardian)

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | Primary key |
| `created_at` | timestamptz | NOT NULL | now() | Account creation timestamp |
| `updated_at` | timestamptz | NOT NULL | now() | Last update timestamp |
| `email` | text | NULL | - | Email address (unique, used for login) |
| `phone` | text | NULL | - | Phone number (unique, alternative login) |
| `full_name` | text | NOT NULL | - | User's display name |
| `avatar_url` | text | NULL | - | Profile picture URL |
| `car_seat_capacity` | int | NOT NULL | 0 | Number of available car seats |
| `calendar_secret_token` | text | NOT NULL | gen_random_uuid() | Secret token for calendar feed URLs |
| `calendar_privacy_mode` | text | NOT NULL | 'full' | Privacy level: 'full', 'basic', 'minimal' |
| `ad_consent_given` | boolean | NOT NULL | false | User consented to ads |
| `ad_consent_date` | timestamptz | NULL | - | When consent was given |
| `ad_consent_withdrawn_date` | timestamptz | NULL | - | When consent was withdrawn |
| `language_preference` | text | NULL | - | Preferred UI language (fi/en/sv) |
| `gdpr_deletion_requested_at` | timestamptz | NULL | - | GDPR deletion request timestamp |
| `gdpr_data_exported_at` | timestamptz | NULL | - | GDPR data export timestamp |
| `is_deleted` | boolean | NOT NULL | false | Soft delete flag |
| `deleted_at` | timestamptz | NULL | - | Deletion timestamp |

**Indexes**:
- `users_email_idx` ON `email` (UNIQUE, WHERE NOT is_deleted)
- `users_phone_idx` ON `phone` (UNIQUE, WHERE NOT is_deleted)

**Constraints**:
- At least one of `email` or `phone` must be provided
- `car_seat_capacity` must be ≥0 and ≤10

**RLS Policies**:
- Users can SELECT their own record
- Users can UPDATE their own record (except `id`, `created_at`)
- No DELETE (soft delete only via GDPR process)

---

### 2. Children

**Purpose**: Represents a child in the system (encrypted for privacy)

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | Primary key |
| `created_at` | timestamptz | NOT NULL | now() | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | now() | Last update timestamp |
| `first_name_encrypted` | text | NOT NULL | - | **Encrypted** child's first name (AES-256-GCM) |
| `special_needs_encrypted` | text | NULL | - | **Encrypted** special needs/notes |
| `car_seat_required` | boolean | NOT NULL | false | Requires car seat |
| `pickup_address` | text | NULL | - | Default pickup address (fallback) |
| `pickup_location` | geography(Point, 4326) | NULL | - | Default pickup location (lat/lon) |
| `pickup_notes` | text | NULL | - | Default pickup instructions |
| `is_deleted` | boolean | NOT NULL | false | Soft delete flag |
| `deleted_at` | timestamptz | NULL | - | Deletion timestamp |

**Encryption**:
- `first_name_encrypted` and `special_needs_encrypted` are encrypted using AES-256-GCM
- Encryption key stored in environment variable `ENCRYPTION_KEY`
- Decryption happens in application layer (not database)

**RLS Policies**:
- Guardians can SELECT their children
- Guardians can INSERT/UPDATE/DELETE their children
- Pool members can SELECT children in their pool (via `pool_children`)

---

### 3. Guardians

**Purpose**: Junction table linking users to children

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | Primary key |
| `user_id` | uuid | NOT NULL | - | User (parent) FK → users(id) |
| `child_id` | uuid | NOT NULL | - | Child FK → children(id) |
| `created_at` | timestamptz | NOT NULL | now() | Relationship creation timestamp |

**Constraints**:
- UNIQUE(`user_id`, `child_id`) - One guardian relationship per user-child pair
- ON DELETE CASCADE for both `user_id` and `child_id`

**RLS Policies**:
- Users can SELECT their own guardian relationships
- Users can INSERT new guardian relationships (add child)
- Users can DELETE their guardian relationships (remove child)

---

### 4. Pools

**Purpose**: Represents a carpool group

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | Primary key |
| `created_at` | timestamptz | NOT NULL | now() | Pool creation timestamp |
| `updated_at` | timestamptz | NOT NULL | now() | Last update timestamp |
| `creator_id` | uuid | NOT NULL | - | User who created pool FK → users(id) |
| `name` | text | NOT NULL | - | Pool display name |
| `description` | text | NULL | - | Optional description |
| `destination_name` | text | NOT NULL | - | Destination name (e.g., "Helsinki Ice Hockey Arena") |
| `destination_address` | text | NOT NULL | - | Full destination address |
| `destination_location` | geography(Point, 4326) | NULL | - | Destination coordinates (lat/lon) |
| `recurrence_rule` | jsonb | NULL | - | RRule-based recurrence (iCal format) |
| `return_enabled` | boolean | NOT NULL | false | Pool has return rides |
| `return_time` | time | NULL | - | Default return ride time |
| `invitation_code` | text | NULL | - | Shareable invitation code (unique) |
| `invitation_expires_at` | timestamptz | NULL | - | Invitation code expiry |
| `is_active` | boolean | NOT NULL | true | Pool is active |
| `is_deleted` | boolean | NOT NULL | false | Soft delete flag |
| `deleted_at` | timestamptz | NULL | - | Deletion timestamp |

**Indexes**:
- `pools_invitation_code_idx` ON `invitation_code` (UNIQUE, WHERE NOT is_deleted)

**Recurrence Rule Format** (JSONB):
```json
{
  "freq": "WEEKLY",
  "interval": 1,
  "byday": ["MO", "WE", "FR"],
  "dtstart": "2026-01-20",
  "time": "15:00",
  "dayTimes": {
    "MO": "15:00",
    "WE": "16:30",
    "FR": "15:00"
  },
  "until": "2026-06-15"
}
```

**RLS Policies**:
- Pool members can SELECT pools they belong to
- Pool owners can UPDATE/DELETE their pools
- Anyone can INSERT a new pool (becomes owner)

---

### 5. Pool Members

**Purpose**: Junction table linking users to pools with roles

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | Primary key |
| `pool_id` | uuid | NOT NULL | - | Pool FK → pools(id) CASCADE |
| `user_id` | uuid | NOT NULL | - | User FK → users(id) CASCADE |
| `role` | text[] | NOT NULL | {passenger} | Roles: 'owner', 'admin', 'driver', 'passenger' |
| `pickup_address` | text | NULL | - | Member's pickup address for this pool |
| `pickup_location` | geography(Point, 4326) | NULL | - | Pickup coordinates |
| `pickup_notes` | text | NULL | - | Pickup instructions |
| `reveal_address_when` | text | NOT NULL | 'immediately' | Address visibility: 'immediately', 'driver_assigned', 'day_before_ride' |
| `auto_hide_after_ride` | boolean | NOT NULL | false | Hide address after ride completes |
| `driver_start_address` | text | NULL | - | Driver's starting point (when driving) |
| `driver_start_location` | geography(Point, 4326) | NULL | - | Driver start coordinates |
| `driver_start_notes` | text | NULL | - | Driver start instructions |
| `opt_out_driver_suggestions` | boolean | NOT NULL | false | Don't suggest this user as driver |
| `joined_at` | timestamptz | NOT NULL | now() | When user joined pool |
| `left_at` | timestamptz | NULL | - | When user left pool |

**Constraints**:
- UNIQUE(`pool_id`, `user_id`) - User can only join pool once
- `role` array must contain at least one valid role
- `reveal_address_when` CHECK IN ('immediately', 'driver_assigned', 'day_before_ride')

**RLS Policies**:
- Pool members can SELECT other members in their pool
- Pool owners/admins can UPDATE member roles
- Users can UPDATE their own pickup address
- Pool owners/admins can DELETE members (kick)

---

### 6. Rides

**Purpose**: Represents a scheduled ride instance

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | Primary key |
| `pool_id` | uuid | NOT NULL | - | Pool FK → pools(id) CASCADE |
| `scheduled_date` | date | NOT NULL | - | Date of ride |
| `outbound_time` | time | NOT NULL | - | Outbound departure time |
| `return_time` | time | NULL | - | Return departure time (if return enabled) |
| `status` | text | NOT NULL | 'scheduled' | Ride status (see State Machine) |
| `version` | int | NOT NULL | 1 | Optimistic locking version counter |
| `outbound_driver_id` | uuid | NULL | - | Outbound driver FK → users(id) |
| `return_driver_id` | uuid | NULL | - | Return driver FK → users(id) |
| `return_ride_id` | uuid | NULL | - | Linked return ride FK → rides(id) |
| `route_geometry` | jsonb | NULL | - | OSRM route geometry (LineString) |
| `route_distance_km` | decimal(10,2) | NULL | - | Total route distance in km |
| `route_duration_min` | int | NULL | - | Estimated route duration in minutes |
| `cancellation_reason` | text | NULL | - | Reason for cancellation (if cancelled) |
| `cancelled_by` | uuid | NULL | - | User who cancelled FK → users(id) |
| `cancelled_at` | timestamptz | NULL | - | Cancellation timestamp |
| `started_at` | timestamptz | NULL | - | Ride start timestamp (status → in_progress) |
| `completed_at` | timestamptz | NULL | - | Ride completion timestamp (status → completed) |
| `created_at` | timestamptz | NOT NULL | now() | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | now() | Last update timestamp |

**Indexes**:
- `rides_pool_id_idx` ON `pool_id`
- `rides_scheduled_date_idx` ON `scheduled_date`
- `rides_status_idx` ON `status`

**Status Values**:
- `'scheduled'` - Ride created, no driver assigned
- `'driver_assigned'` - Driver assigned, awaiting ride time
- `'in_progress'` - Ride currently happening
- `'completed'` - Ride finished successfully
- `'cancelled'` - Ride was cancelled

**Optimistic Locking**:
- `version` field increments on every UPDATE
- Clients must provide current version in UPDATE requests
- Returns 409 Conflict if version mismatch

**RLS Policies**:
- Pool members can SELECT rides in their pool
- Pool owners/admins can INSERT/UPDATE/DELETE rides
- Assigned drivers can UPDATE their assigned rides

---

### 7. Ride Participants

**Purpose**: Tracks which children are riding in each ride

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | Primary key |
| `ride_id` | uuid | NOT NULL | - | Ride FK → rides(id) CASCADE |
| `child_id` | uuid | NOT NULL | - | Child FK → children(id) CASCADE |
| `direction` | text | NOT NULL | 'outbound' | Direction: 'outbound' or 'return' |
| `is_absent` | boolean | NOT NULL | false | Child is absent for this ride |
| `absence_reason` | text | NULL | - | Reason for absence |
| `pickup_address` | text | NULL | - | Pickup address for this specific ride |
| `pickup_location` | geography(Point, 4326) | NULL | - | Pickup coordinates |
| `created_at` | timestamptz | NOT NULL | now() | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | now() | Last update timestamp |

**Constraints**:
- UNIQUE(`ride_id`, `child_id`, `direction`) - Child can only be added once per direction
- `direction` CHECK IN ('outbound', 'return')

**RLS Policies**:
- Pool members can SELECT participants in their pool's rides
- Guardians can UPDATE their child's absence status
- Pool owners/admins can INSERT/DELETE participants

---

### 8. Ride Cars

**Purpose**: Organizes multiple cars for large rides (future feature)

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | Primary key |
| `ride_id` | uuid | NOT NULL | - | Ride FK → rides(id) CASCADE |
| `driver_id` | uuid | NOT NULL | - | Driver FK → users(id) |
| `direction` | text | NOT NULL | 'outbound' | Direction: 'outbound' or 'return' |
| `assigned_child_ids` | uuid[] | NOT NULL | {} | Array of child IDs assigned to this car |
| `seat_capacity` | int | NOT NULL | - | Number of available seats |
| `created_at` | timestamptz | NOT NULL | now() | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | now() | Last update timestamp |

**Constraints**:
- `direction` CHECK IN ('outbound', 'return')
- `seat_capacity` must be ≥1 and ≤10
- Length of `assigned_child_ids` must be ≤ `seat_capacity`

**Use Case**: When more children than one car can fit, multiple drivers needed

---

### 9. Ride KPI Snapshots

**Purpose**: Stores metrics for completed rides (CO2 saved, km saved, etc.)

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | Primary key |
| `ride_id` | uuid | NOT NULL | - | Ride FK → rides(id) CASCADE |
| `participant_count` | int | NOT NULL | - | Number of participants who actually rode |
| `distance_km_saved` | decimal(10,2) | NOT NULL | - | Estimated km saved by carpooling |
| `co2_kg_saved` | decimal(10,2) | NOT NULL | - | Estimated CO2 (kg) saved |
| `snapshot_at` | timestamptz | NOT NULL | now() | When snapshot was taken |

**Calculation**:
- Created when ride status → `completed`
- `distance_km_saved` = route_distance_km × (participant_count - 1)
- `co2_kg_saved` = distance_km_saved × 0.12 (kg CO2 per km)

**RLS Policies**:
- Pool members can SELECT KPI snapshots for their pool's rides
- System (security definer function) can INSERT snapshots

---

## Supporting Tables

### 10. Pool Children

**Purpose**: Junction table linking children to pools

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | Primary key |
| `pool_id` | uuid | NOT NULL | - | Pool FK → pools(id) CASCADE |
| `child_id` | uuid | NOT NULL | - | Child FK → children(id) CASCADE |
| `pickup_address` | text | NULL | - | Pool-specific pickup address |
| `pickup_location` | geography(Point, 4326) | NULL | - | Pool-specific pickup coordinates |
| `pickup_notes` | text | NULL | - | Pool-specific pickup notes |
| `created_at` | timestamptz | NOT NULL | now() | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | now() | Last update timestamp |

**Constraints**:
- UNIQUE(`pool_id`, `child_id`) - Child can only be added to pool once

---

### 11. Child Pickup Addresses

**Purpose**: Multiple pickup addresses per child (e.g., school vs. home)

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | Primary key |
| `child_id` | uuid | NOT NULL | - | Child FK → children(id) CASCADE |
| `pool_member_id` | uuid | NULL | - | Pool member FK (if pool-specific) |
| `label` | text | NOT NULL | - | Address label (e.g., "School", "Home") |
| `address` | text | NOT NULL | - | Full address |
| `location` | geography(Point, 4326) | NULL | - | Coordinates |
| `notes` | text | NULL | - | Pickup instructions |
| `is_default` | boolean | NOT NULL | false | Default pickup address |
| `created_at` | timestamptz | NOT NULL | now() | Creation timestamp |
| `updated_at` | timestamptz | NOT NULL | now() | Last update timestamp |

---

### 12. Audit Logs

**Purpose**: GDPR compliance and security tracking

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | uuid | NOT NULL | gen_random_uuid() | Primary key |
| `created_at` | timestamptz | NOT NULL | now() | Log timestamp |
| `user_id` | uuid | NULL | - | User who performed action |
| `log_type` | text | NOT NULL | - | Type: 'child_data_access', 'pool_operation', etc. |
| `entity_type` | text | NULL | - | Entity: 'child', 'pool', 'ride', etc. |
| `entity_id` | uuid | NULL | - | Entity ID |
| `action` | text | NULL | - | Action: 'create', 'update', 'delete', 'view' |
| `old_value` | jsonb | NULL | - | Previous value (for updates) |
| `new_value` | jsonb | NULL | - | New value (for updates) |
| `metadata` | jsonb | NULL | - | Additional context |

**Retention**: Auto-delete after 90 days (GDPR compliance)

---

## Data Integrity Rules

### Foreign Key Constraints

All foreign key relationships use **ON DELETE CASCADE** unless specified:

| Parent | Child | On Delete |
|--------|-------|-----------|
| users → pool_members | CASCADE | Removes user from all pools |
| users → guardians | CASCADE | Orphans children (requires cleanup) |
| children → guardians | CASCADE | Removes parent relationship |
| children → ride_participants | CASCADE | Removes child from rides |
| pools → pool_members | CASCADE | Disbands pool |
| pools → rides | CASCADE | Deletes all pool rides |
| rides → ride_participants | CASCADE | Removes participants |

### Check Constraints

```sql
-- Rides: Valid status
ALTER TABLE rides ADD CONSTRAINT valid_status
  CHECK (status IN ('scheduled', 'driver_assigned', 'in_progress', 'completed', 'cancelled'));

-- Users: At least email or phone
ALTER TABLE users ADD CONSTRAINT email_or_phone
  CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- Pool members: Valid address reveal timing
ALTER TABLE pool_members ADD CONSTRAINT valid_reveal_timing
  CHECK (reveal_address_when IN ('immediately', 'driver_assigned', 'day_before_ride'));
```

---

## Indexes for Performance

### High-Traffic Queries

```sql
-- Find rides for a pool
CREATE INDEX rides_pool_id_idx ON rides(pool_id);

-- Find upcoming rides
CREATE INDEX rides_scheduled_date_idx ON rides(scheduled_date)
  WHERE status IN ('scheduled', 'driver_assigned');

-- Find user's children
CREATE INDEX guardians_user_id_idx ON guardians(user_id);

-- Find pool members
CREATE INDEX pool_members_pool_id_idx ON pool_members(pool_id);

-- Full-text search on pool names (future)
CREATE INDEX pools_name_trgm_idx ON pools USING gin(name gin_trgm_ops);
```

---

## Migration Strategy

### Schema Changes

1. **Never edit existing migrations** - Create new migration files
2. **Test migrations locally** - Run on local Supabase instance first
3. **Backup production** - Always backup before applying to production
4. **Rollback plan** - Document how to reverse the migration

### Example Migration Pattern

```sql
-- Migration: Add return_enabled to pools
-- Up
ALTER TABLE pools ADD COLUMN return_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE pools ADD COLUMN return_time TIME;

-- Down (Rollback)
ALTER TABLE pools DROP COLUMN return_enabled;
ALTER TABLE pools DROP COLUMN return_time;
```

---

## Related Documentation

- **RLS Policies**: `docs/setup/DATABASE_RLS.md`
- **Schema Migrations**: `supabase/migrations/`
- **Type Definitions**: `lib/types/database.ts`, `types/supabase.ts`
- **State Machines**: `docs/technical/STATE_MACHINES.md`

---

**Maintenance**: Update this document when adding new tables, fields, or relationships. Run schema diff before/after to document changes.
