# Database Schema

## Overview

This document specifies the database schema for user profile management. The schema is designed for PostgreSQL but can be adapted for other relational databases.

## Tables

### user_profiles

Stores user profile information including preferences and accessibility conditions.

```sql
CREATE TABLE user_profiles (
  id BIGSERIAL PRIMARY KEY,
  ci_value VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(20) NOT NULL,
  preferred_categories TEXT[] NOT NULL,
  accessibility_conditions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT nickname_length CHECK (LENGTH(nickname) >= 2 AND LENGTH(nickname) <= 20),
  CONSTRAINT valid_categories CHECK (
    preferred_categories <@ ARRAY['CAFE', 'LANDMARK', 'DINNER']::TEXT[]
    AND ARRAY_LENGTH(preferred_categories, 1) > 0
  ),
  CONSTRAINT valid_conditions CHECK (
    accessibility_conditions <@ ARRAY['WHEELCHAIR', 'WITH_CHILDREN', 'WITH_ELDERLY']::TEXT[]
  )
);

-- Indexes
CREATE INDEX idx_user_profiles_ci_value ON user_profiles(ci_value) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_profiles_deleted_at ON user_profiles(deleted_at);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);
```

## Column Descriptions

### user_profiles

| Column                   | Type                     | Nullable | Description                                                                 |
| ------------------------ | ------------------------ | -------- | --------------------------------------------------------------------------- |
| id                       | BIGSERIAL                | NO       | Primary key, auto-incrementing                                              |
| ci_value                 | VARCHAR(255)             | NO       | Cognito Identity value (unique identifier from AWS Cognito)                 |
| nickname                 | VARCHAR(20)              | NO       | User's display name (2-20 characters)                                       |
| preferred_categories     | TEXT[]                   | NO       | Array of preferred spot categories (CAFE, LANDMARK, DINNER)                 |
| accessibility_conditions | TEXT[]                   | YES      | Array of accessibility conditions (WHEELCHAIR, WITH_CHILDREN, WITH_ELDERLY) |
| created_at               | TIMESTAMP WITH TIME ZONE | NO       | Profile creation timestamp                                                  |
| updated_at               | TIMESTAMP WITH TIME ZONE | NO       | Last update timestamp                                                       |
| deleted_at               | TIMESTAMP WITH TIME ZONE | YES      | Soft delete timestamp (NULL if not deleted)                                 |

## Constraints

### nickname_length

Ensures nickname is between 2 and 20 characters:

```sql
CHECK (LENGTH(nickname) >= 2 AND LENGTH(nickname) <= 20)
```

### valid_categories

Ensures preferred_categories contains only valid values and is non-empty:

```sql
CHECK (
  preferred_categories <@ ARRAY['CAFE', 'LANDMARK', 'DINNER']::TEXT[]
  AND ARRAY_LENGTH(preferred_categories, 1) > 0
)
```

### valid_conditions

Ensures accessibility_conditions contains only valid values:

```sql
CHECK (
  accessibility_conditions <@ ARRAY['WHEELCHAIR', 'WITH_CHILDREN', 'WITH_ELDERLY']::TEXT[]
)
```

## Indexes

### idx_user_profiles_ci_value

Partial index on ci_value for active (non-deleted) profiles:

```sql
CREATE INDEX idx_user_profiles_ci_value ON user_profiles(ci_value) WHERE deleted_at IS NULL;
```

**Purpose:** Fast lookup of active user profiles by Cognito Identity value

### idx_user_profiles_deleted_at

Index on deleted_at for filtering soft-deleted records:

```sql
CREATE INDEX idx_user_profiles_deleted_at ON user_profiles(deleted_at);
```

**Purpose:** Efficient queries for active/deleted profiles

### idx_user_profiles_created_at

Index on created_at for time-based queries:

```sql
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);
```

**Purpose:** Analytics and reporting on user registration trends

## Triggers

### update_updated_at_trigger

Automatically updates the updated_at timestamp on row updates:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Sample Queries

### Insert New Profile

```sql
INSERT INTO user_profiles (
  ci_value,
  nickname,
  preferred_categories,
  accessibility_conditions
) VALUES (
  'cognito-user-id-123',
  '오르미',
  ARRAY['CAFE', 'LANDMARK'],
  ARRAY['WITH_CHILDREN']
);
```

### Get Profile by CI Value

```sql
SELECT
  ci_value,
  nickname,
  preferred_categories,
  accessibility_conditions,
  created_at,
  updated_at
FROM user_profiles
WHERE ci_value = 'cognito-user-id-123'
  AND deleted_at IS NULL;
```

### Update Profile

```sql
UPDATE user_profiles
SET
  nickname = '새로운닉네임',
  preferred_categories = ARRAY['CAFE', 'DINNER'],
  accessibility_conditions = ARRAY['WHEELCHAIR']
WHERE ci_value = 'cognito-user-id-123'
  AND deleted_at IS NULL;
```

### Soft Delete Profile

```sql
UPDATE user_profiles
SET deleted_at = CURRENT_TIMESTAMP
WHERE ci_value = 'cognito-user-id-123'
  AND deleted_at IS NULL;
```

### Hard Delete (Cleanup)

```sql
-- Delete profiles that were soft-deleted more than 90 days ago
DELETE FROM user_profiles
WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
```

## Data Migration

### From localStorage to Database

When migrating from the current localStorage implementation to the database:

1. **Export Data:** Create a script to export profile data from localStorage
2. **Transform Data:** Convert data to match database schema
3. **Import Data:** Bulk insert profiles into database
4. **Verify:** Compare counts and sample records
5. **Cutover:** Switch application to use database API

### Sample Migration Script

```sql
-- Bulk insert from JSON data
INSERT INTO user_profiles (
  ci_value,
  nickname,
  preferred_categories,
  accessibility_conditions,
  created_at,
  updated_at
)
SELECT
  data->>'ciValue',
  data->>'nickname',
  ARRAY(SELECT jsonb_array_elements_text(data->'preferredCategories')),
  ARRAY(SELECT jsonb_array_elements_text(data->'accessibilityConditions')),
  (data->>'createdAt')::TIMESTAMP WITH TIME ZONE,
  (data->>'updatedAt')::TIMESTAMP WITH TIME ZONE
FROM (
  -- JSON data from localStorage export
  SELECT jsonb_array_elements('[
    {
      "ciValue": "user-1",
      "nickname": "오르미",
      "preferredCategories": ["CAFE", "LANDMARK"],
      "accessibilityConditions": ["WITH_CHILDREN"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]'::jsonb) AS data
) AS source
ON CONFLICT (ci_value) DO NOTHING;
```

## Backup and Maintenance

### Backup Strategy

1. **Daily Backups:** Full database backup every 24 hours
2. **Point-in-Time Recovery:** Enable WAL archiving for PostgreSQL
3. **Retention:** Keep backups for 30 days

### Maintenance Tasks

1. **Vacuum:** Run VACUUM ANALYZE weekly
2. **Reindex:** Rebuild indexes monthly
3. **Cleanup:** Delete old soft-deleted records quarterly

```sql
-- Weekly maintenance
VACUUM ANALYZE user_profiles;

-- Monthly reindex
REINDEX TABLE user_profiles;

-- Quarterly cleanup (delete profiles soft-deleted > 90 days ago)
DELETE FROM user_profiles
WHERE deleted_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
```

## Performance Considerations

### Expected Load

- **Read Operations:** High (profile retrieval on every page load)
- **Write Operations:** Low (profile creation/update)
- **Data Size:** Small (< 1KB per profile)

### Optimization

1. **Connection Pooling:** Use connection pooling (e.g., PgBouncer)
2. **Caching:** Cache frequently accessed profiles (Redis)
3. **Read Replicas:** Use read replicas for high read load
4. **Partitioning:** Consider partitioning if > 10M profiles

### Monitoring

Monitor these metrics:

- Query execution time
- Index usage
- Table size growth
- Cache hit ratio
- Connection pool utilization

## Security

### Access Control

1. **Application User:** Limited permissions (SELECT, INSERT, UPDATE)
2. **Admin User:** Full permissions for maintenance
3. **Read-Only User:** SELECT only for analytics

```sql
-- Create application user with limited permissions
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE ON user_profiles TO app_user;
GRANT USAGE, SELECT ON SEQUENCE user_profiles_id_seq TO app_user;

-- Create read-only user for analytics
CREATE USER analytics_user WITH PASSWORD 'secure_password';
GRANT SELECT ON user_profiles TO analytics_user;
```

### Data Protection

1. **Encryption at Rest:** Enable database encryption
2. **Encryption in Transit:** Use SSL/TLS for connections
3. **PII Handling:** Treat nickname as PII, follow data protection regulations
4. **Audit Logging:** Log all data access and modifications

## Testing

### Test Data

```sql
-- Insert test profiles
INSERT INTO user_profiles (ci_value, nickname, preferred_categories, accessibility_conditions) VALUES
  ('test-user-1', '테스트1', ARRAY['CAFE'], ARRAY['WHEELCHAIR']),
  ('test-user-2', '테스트2', ARRAY['CAFE', 'LANDMARK'], ARRAY['WITH_CHILDREN']),
  ('test-user-3', '테스트3', ARRAY['LANDMARK', 'DINNER'], ARRAY['WITH_ELDERLY']),
  ('test-user-4', '테스트4', ARRAY['CAFE', 'LANDMARK', 'DINNER'], ARRAY[]::TEXT[]);
```

### Cleanup Test Data

```sql
-- Delete test profiles
DELETE FROM user_profiles WHERE ci_value LIKE 'test-user-%';
```
