# Metrics Optimization Implementation Guide

## Overview

This implementation adds comprehensive optimization for metrics collection, storage, and retrieval in the SMP Admin Panel. It includes database schema improvements, automated data retention and aggregation, admin configuration controls, and enhanced API endpoints for better scalability and performance.

## Key Features

### 1. Database Schema Enhancements

#### Settings Model
A new `Settings` model has been added to store system-wide configuration:
- **key**: Unique identifier for each setting
- **value**: JSON-encoded value
- **category**: Group settings by category (e.g., 'metrics', 'general', 'security')
- **description**: Human-readable description

#### ServerMetrics Optimization
Enhanced the `ServerMetrics` model with:
- **isAggregated**: Boolean flag to distinguish raw vs. aggregated data
- **aggregationPeriod**: Type of aggregation (null, 'hourly', 'daily')
- **New Indexes**: Improved query performance for timestamp-based queries and aggregation filtering

### 2. Metrics Settings Management

Configurable settings for metrics collection:
- **metricsEnabled**: Master switch for metrics collection
- **historyCollectionEnabled**: Toggle automatic history saving
- **collectionIntervalSeconds**: How often to collect metrics (10-3600 seconds)
- **dataRetentionDays**: How long to keep raw data (1-365 days)
- **aggregationEnabled**: Enable/disable automatic aggregation
- **aggregationThresholdDays**: Age threshold for aggregation (1-90 days)
- **aggregationIntervalHours**: Aggregation bucket size (1, 6, 12, or 24 hours)

Default values:
```typescript
{
  metricsEnabled: true,
  historyCollectionEnabled: true,
  collectionIntervalSeconds: 60,
  dataRetentionDays: 30,
  aggregationEnabled: true,
  aggregationThresholdDays: 7,
  aggregationIntervalHours: 1,
}
```

### 3. Data Retention and Aggregation

#### Automatic Cleanup
The system can automatically delete old metrics data based on the retention policy:
- Deletes raw (non-aggregated) metrics older than `dataRetentionDays`
- Preserves aggregated data for long-term analysis
- Prevents database bloat from accumulating historical data

#### Data Aggregation
Old metrics are automatically aggregated into time buckets:
- Groups raw data by hour (or configured interval)
- Calculates averages for numeric metrics (CPU, memory, disk, player count)
- Preserves server online/offline status based on majority
- Reduces storage requirements while maintaining trend visibility
- Raw data is deleted after successful aggregation

### 4. Enhanced API Endpoints

#### `/apanel44/api/monitoring/metrics` (GET)
**Improvements:**
- Checks if metrics are enabled via settings
- Better error handling with detailed error messages
- Database connectivity error detection
- Respects `historyCollectionEnabled` setting
- Query parameter `saveHistory` can override settings

**Response Examples:**
```json
// Success with history saved
{
  "metrics": { /* metrics object */ },
  "historySaved": true
}

// Success but DB unavailable
{
  "metrics": { /* metrics object */ },
  "warning": "Metrics collected but database is unavailable. History not saved.",
  "dbError": true
}

// Metrics disabled
{
  "error": "Service unavailable",
  "message": "Metrics collection is currently disabled"
}
```

#### `/apanel44/api/monitoring/history` (GET)
**Improvements:**
- Support for aggregated data via `includeAggregated` parameter
- Increased default limit to 1000 records
- Returns statistics about data composition
- Better error messages

**Query Parameters:**
- `timeRange`: '24h', '7d', '30d' (default: '24h')
- `limit`: Max records to return (default: 1000)
- `startDate`, `endDate`: Custom date range (ISO 8601 format)
- `includeAggregated`: Include aggregated data (default: 'true')

**Response Example:**
```json
{
  "metrics": [ /* array of metrics */ ],
  "count": 450,
  "stats": {
    "rawDataPoints": 100,
    "aggregatedDataPoints": 350,
    "totalDataPoints": 450
  }
}
```

#### `/apanel44/api/monitoring/settings` (GET/PUT)
**New Endpoint** for managing metrics settings:
- **GET**: Fetch current settings (Admin/Super Admin)
- **PUT**: Update settings with validation (Super Admin only)

**Validation Rules:**
- Boolean fields must be boolean
- `collectionIntervalSeconds`: 10-3600
- `dataRetentionDays`: 1-365
- `aggregationThresholdDays`: 1-90
- `aggregationIntervalHours`: 1, 6, 12, or 24

**Example PUT Request:**
```json
{
  "metricsEnabled": true,
  "dataRetentionDays": 60,
  "aggregationThresholdDays": 14
}
```

#### `/apanel44/api/monitoring/maintenance` (POST)
**New Endpoint** for running maintenance tasks:
- Runs data aggregation and cleanup
- Super Admin only
- Returns statistics about work done

**Response Example:**
```json
{
  "message": "Maintenance task completed successfully",
  "result": {
    "aggregatedCount": 1440,
    "deletedCount": 320
  }
}
```

### 5. Admin Settings Page

New page at `/metrics-settings` (Super Admin only) provides a UI for:
- Viewing current metrics settings
- Modifying all configurable parameters
- Running maintenance tasks manually
- Viewing real-time feedback on changes

**Features:**
- Toggle switches for boolean settings
- Input validation with clear constraints
- One-click maintenance task execution
- Helpful descriptions for each setting
- Reset functionality to discard unsaved changes

## Database Migration

The schema changes are captured in:
```
prisma/migrations/20260129141003_add_metrics_optimization_and_settings/migration.sql
```

**Migration includes:**
1. Add `isAggregated` and `aggregationPeriod` columns to `ServerMetrics`
2. Create composite indexes for performance
3. Create `Settings` table with indexes

To apply the migration:

**For existing databases (prevents P3005 error):**
```bash
# Use the automated baseline script
bash scripts/baseline-migration.sh

# Or manually baseline if database already has the changes
npx prisma migrate resolve --applied "20260129141003_add_metrics_optimization_and_settings"
```

**For fresh databases:**
```bash
npx prisma migrate deploy
```

**For development:**
```bash
npx prisma migrate dev
```

**Troubleshooting**: If you encounter error P3005 ("The database schema is not empty"), see [MIGRATION_BASELINE_GUIDE.md](./MIGRATION_BASELINE_GUIDE.md) for detailed instructions.

## Setting Up Automated Maintenance

For production, set up a cron job or scheduled task to run maintenance periodically:

### Using Cron (Linux/Unix)
```bash
# Run maintenance daily at 2 AM
0 2 * * * curl -X POST https://your-domain.com/apanel44/api/monitoring/maintenance \
  -H "Cookie: your-auth-cookie"
```

### Using the API
The maintenance endpoint can be called by:
1. Authenticated Super Admin users via the web interface
2. Scheduled tasks using session cookies
3. External schedulers with proper authentication

### Recommended Schedule
- **Aggregation**: Daily (to process previous day's data)
- **Cleanup**: Weekly (to remove very old data)

You can run both by calling the maintenance endpoint, which handles both tasks intelligently based on your settings.

## Performance Considerations

### Index Strategy
The implementation adds strategic indexes to improve query performance:
1. **`ServerMetrics_timestamp_idx`**: Existing index for time-based queries
2. **`ServerMetrics_timestamp_isAggregated_idx`**: Composite index for filtering by aggregation status
3. **`ServerMetrics_isAggregated_aggregationPeriod_idx`**: Supports aggregation-type queries

### Query Optimization
- History API uses `select` to return only necessary fields
- Limits are enforced to prevent large result sets
- Aggregated data reduces the number of records for long time ranges

### Storage Optimization
- Aggregation can reduce storage by 95%+ for old data
  - Example: 1440 data points per day → 24 hourly aggregations
- Retention policy prevents indefinite data accumulation
- Raw data is only kept for recent periods where high granularity is valuable

## Testing the Implementation

### 1. Test Metrics Collection
```bash
# Collect metrics without saving history
curl https://your-domain.com/apanel44/api/monitoring/metrics

# Collect and save to history
curl https://your-domain.com/apanel44/api/monitoring/metrics?saveHistory=true
```

### 2. Test Settings API
```bash
# Get current settings
curl https://your-domain.com/apanel44/api/monitoring/settings

# Update settings (requires Super Admin auth)
curl -X PUT https://your-domain.com/apanel44/api/monitoring/settings \
  -H "Content-Type: application/json" \
  -d '{"dataRetentionDays": 60}'
```

### 3. Test History Retrieval
```bash
# Get last 24 hours (including aggregated data)
curl https://your-domain.com/apanel44/api/monitoring/history?timeRange=24h

# Get only raw data
curl https://your-domain.com/apanel44/api/monitoring/history?includeAggregated=false

# Custom date range
curl "https://your-domain.com/apanel44/api/monitoring/history?startDate=2024-01-01T00:00:00Z&endDate=2024-01-02T00:00:00Z"
```

### 4. Test Maintenance Task
```bash
# Run aggregation and cleanup (requires Super Admin auth)
curl -X POST https://your-domain.com/apanel44/api/monitoring/maintenance
```

### 5. UI Testing
1. Navigate to `/apanel44/metrics-settings` as a Super Admin
2. Modify settings and save
3. Run maintenance manually and observe results
4. View historical data at `/apanel44/all-stats` to confirm aggregation

## Error Handling

The implementation includes comprehensive error handling:

### Metrics Collection Errors
- Database connection failures are caught and reported
- Metrics are still returned even if history save fails
- Clear error messages distinguish between different failure modes

### Settings Validation
- Type checking for all input values
- Range validation for numeric settings
- Descriptive error messages for invalid input

### Maintenance Errors
- Per-hour error handling during aggregation
- Failed aggregations don't prevent future attempts
- Detailed logging for troubleshooting

## Monitoring and Maintenance

### Logs to Monitor
Watch for these log messages:
- `[Settings] Initializing default metrics settings...`
- `[Metrics API] Metrics collected successfully`
- `[Cleanup] Deleted X old metric records`
- `[Aggregation] Aggregated X metric records into Y hourly summaries`
- `[Maintenance] Maintenance complete`

### Common Issues

**Issue**: Metrics not being saved to history
- **Check**: `historyCollectionEnabled` setting
- **Check**: Database connectivity
- **Check**: `saveHistory` query parameter

**Issue**: Too many data points in history API
- **Solution**: Increase aggregation or reduce retention
- **Solution**: Use shorter time ranges
- **Solution**: Reduce the `limit` parameter

**Issue**: Aggregation not running
- **Check**: `aggregationEnabled` setting
- **Check**: `aggregationThresholdDays` (data must be older than this)
- **Check**: Maintenance task is being executed

## Security Considerations

### Access Control
- Metrics viewing: Admin and Super Admin only
- Settings modification: Super Admin only
- Maintenance execution: Super Admin only

### Rate Limiting
Consider implementing rate limiting for:
- Metrics collection endpoint
- History queries with large time ranges
- Maintenance task execution

### Data Privacy
- Metrics contain system information only (no user data)
- Access logs track who views/modifies settings
- Settings changes are auditable via database timestamps

## Future Enhancements

Potential improvements for future versions:
1. **Real-time Aggregation**: Aggregate data immediately instead of batch processing
2. **Configurable Aggregation Functions**: Support min/max in addition to averages
3. **Multi-level Aggregation**: Hourly → Daily → Weekly aggregation tiers
4. **Export Functionality**: Download metrics data as CSV/JSON
5. **Alerting**: Notifications when metrics exceed thresholds
6. **API Rate Limiting**: Built-in protection against abuse
7. **Metrics Dashboard**: Enhanced visualization with filtering and drill-down

## Support and Troubleshooting

If you encounter issues:
1. Check application logs for error messages
2. Verify database connectivity
3. Ensure Prisma migrations are applied
4. Confirm settings are configured correctly
5. Test with curl commands to isolate UI vs. API issues

For more information, see:
- `src/lib/settings.ts` - Settings management implementation
- `src/lib/metricsCleanup.ts` - Cleanup and aggregation logic
- `prisma/schema.prisma` - Database schema
