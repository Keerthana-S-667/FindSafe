# FindSafe AI Database Schema & Storage Architecture

This document defines the planned PostgreSQL schema structure and Supabase Storage bucket organization for FindSafe AI.

## PostgreSQL Tables Schema

### 1. `missing_persons`
Maintains authorized missing-person case files.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique case UUID |
| `case_number` | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable case identifier |
| `full_name` | VARCHAR(255) | NOT NULL | Subject full name |
| `age` | INT | NULLABLE | Subject age |
| `gender` | VARCHAR(50) | NULLABLE | Gender attribute |
| `last_seen_date` | TIMESTAMPTZ | NOT NULL | Last seen timestamp |
| `last_seen_location` | TEXT | NOT NULL | Last known location text |
| `latitude` | DOUBLE PRECISION | NULLABLE | Geographic latitude |
| `longitude` | DOUBLE PRECISION | NULLABLE | Geographic longitude |
| `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | Case status (ACTIVE, RESOLVED, CLOSED) |
| `priority` | VARCHAR(50) | DEFAULT 'MEDIUM' | Priority level (CRITICAL, HIGH, MEDIUM, LOW) |
| `reference_photo_url` | TEXT | NULLABLE | Primary reference image URL |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Record update timestamp |

### 2. `found_person_records`
Holds records of found individuals reported by authorities, shelters, or public feeds.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Record UUID |
| `record_number` | VARCHAR(50) | UNIQUE, NOT NULL | Record reference number |
| `location` | TEXT | NOT NULL | Found location |
| `latitude` | DOUBLE PRECISION | NULLABLE | GIS latitude |
| `longitude` | DOUBLE PRECISION | NULLABLE | GIS longitude |
| `timestamp` | TIMESTAMPTZ | NOT NULL | Encounter timestamp |
| `photo_url` | TEXT | NULLABLE | Sighting photo URL |
| `notes` | TEXT | NULLABLE | Operator observations |

### 3. `search_sessions`
Tracks visual search executions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Session UUID |
| `session_type` | VARCHAR(50) | NOT NULL | CROWD, RECORDS, EVERYWHERE |
| `initiated_by` | UUID | REFERENCES auth.users(id) | Operator UUID |
| `status` | VARCHAR(50) | DEFAULT 'PENDING' | PENDING, RUNNING, COMPLETED |
| `started_at` | TIMESTAMPTZ | DEFAULT NOW() | Session start time |

### 4. `candidates`
Stores candidate matches produced by visual re-ID and evidence fusion.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Candidate UUID |
| `case_id` | UUID | REFERENCES missing_persons(id) | Linked missing case |
| `found_record_id` | UUID | REFERENCES found_person_records(id) | Linked found record (if applicable) |
| `match_score` | FLOAT | NOT NULL | Computed confidence score (0.00 - 1.00) |
| `status` | VARCHAR(50) | DEFAULT 'UNVERIFIED' | UNVERIFIED, CONFIRMED, REJECTED |
| `detected_at` | TIMESTAMPTZ | NOT NULL | Detection timestamp |
| `location` | TEXT | NOT NULL | Detection location |

### 5. `candidate_evidence`
Attaches bounding box crops and frame metadata to match candidates.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Evidence UUID |
| `candidate_id` | UUID | REFERENCES candidates(id) | Parent candidate |
| `frame_url` | TEXT | NOT NULL | Source frame image URL |
| `crop_url` | TEXT | NOT NULL | Bounding box crop URL |
| `feature_vector_id` | VARCHAR(255) | NULLABLE | OSNet embedding ID |

### 6. `camera_sources`
Registers authorized CCTV/public stream endpoints.

### 7. `verification_notes`
Audit logs of human investigator verification decisions.

### 8. `audit_logs`
Immutable law-enforcement compliance audit log recording user actions, queries, and data access.

---

## Supabase Storage Buckets

1. `missing-person-photos` (Public/Authorized read, restricted upload)
2. `cctv-videos` (Restricted ingest bucket)
3. `evidence-frames` (Candidate crops and frame snapshots)
4. `reports` (Exported PDF investigation files)
