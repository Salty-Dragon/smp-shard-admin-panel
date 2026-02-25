# Multi-Instance Database Prefix Implementation

## Overview

This implementation adds support for distinguishing data between multiple Minecraft server instances in a shared database using instance identifiers (prefixes like `s1_`, `s2_`, `dev`, `live`, etc.).

## Changes Made

### 1. Database Schema Updates (Prisma)

Added `instanceId` field to three tables:

#### ActivityLog
- **Field**: `instanceId String?` (nullable for backward compatibility)
- **Index**: Added `@@index([instanceId])`
- **Purpose**: Track which server instance an activity log entry belongs to

#### ServerMetrics
- **Field**: `instanceId String?` (nullable for backward compatibility)
- **Indexes**: 
  - `@@index([instanceId])`
  - `@@index([instanceId, timestamp])`
- **Purpose**: Track metrics for specific server instances

#### ScheduledTask
- **Field**: `instanceId String?` (nullable for backward compatibility)
- **Index**: Added `@@index([instanceId])`
- **Purpose**: Allow tasks to be instance-specific or apply to all instances (when null)

### 2. Activity Logging Updates

#### Updated Files
- **src/lib/activity.ts**:
  - Added `instanceId` parameter to `LogActivityParams` interface
  - Updated `logActivity()` function to save instanceId to database
  - Updated `getActivityLogs()` to support filtering by instanceId

#### API Endpoints Updated
- **src/pages/api/server/console.ts**: Now passes instanceId when logging server commands
- **src/pages/api/files/index.ts**: Now passes instanceId when logging file operations (list, upload)
- **src/pages/api/files/[filename].ts**: Now passes instanceId when logging file operations (read, edit, rename, delete)

### 3. Metrics Collection Updates

#### Updated Files
- **src/lib/metrics.ts**:
  - Updated `collectMetrics()` to include instanceId in returned data
  
- **src/pages/api/monitoring/collect.ts**:
  - Added support for `instanceId` query parameter
  - Passes instanceId to `collectMetrics()` function

- **src/pages/api/monitoring/metrics.ts**:
  - Already supported instanceId parameter (no changes needed)

- **src/pages/api/monitoring/history.ts**:
  - Added `instanceId` query parameter
  - Added filtering by instanceId in database queries
  - Included instanceId in response data

### 4. Migration Endpoint

Created **src/pages/api/admin/migrate-instance-data.ts** (Super Admin only):

#### GET /apanel44/api/admin/migrate-instance-data
- Check migration status
- Returns counts of records with and without instanceId

#### POST /apanel44/api/admin/migrate-instance-data
- Backfill instanceId for existing data
- Request body: `{ "instanceId": "s1" }` or `{ "instanceId": "default" }`
- Updates all ActivityLog, ServerMetrics, and ScheduledTask records where instanceId is null

## Migration Strategy

### For Existing Deployments

1. **Update the code** with these changes
2. **Run Prisma migration** to add the new fields:
   ```bash
   npx prisma db push
   # or for production
   npx prisma migrate deploy
   ```

3. **Check migration status**:
   ```bash
   curl -X GET "http://localhost:3000/apanel44/api/admin/migrate-instance-data" \
     -H "Cookie: your-session-cookie"
   ```

4. **Migrate existing data** to a default instance:
   ```bash
   curl -X POST "http://localhost:3000/apanel44/api/admin/migrate-instance-data" \
     -H "Content-Type: application/json" \
     -H "Cookie: your-session-cookie" \
     -d '{"instanceId": "s1"}'
   ```
   
   Or use whatever instanceId makes sense for your first/existing server (e.g., `"default"`, `"live"`, `"prod"`)

### For New Deployments

No migration needed! Just configure your `INSTANCES` environment variable with appropriate instance IDs.

## Usage

### Environment Variable Configuration

Set up your instances in `.env`:

```bash
INSTANCES='[
  {
    "id": "s1",
    "name": "s1",
    "displayName": "Server 1 (Main)",
    "serverPath": "/opt/minecraft/s1",
    "pluginsPath": "/opt/minecraft/s1/plugins",
    "tmuxSession": "minecraft-s1",
    "startScript": "./start.sh",
    "isDefault": true
  },
  {
    "id": "s2",
    "name": "s2",
    "displayName": "Server 2 (Creative)",
    "serverPath": "/opt/minecraft/s2",
    "pluginsPath": "/opt/minecraft/s2/plugins",
    "tmuxSession": "minecraft-s2",
    "startScript": "./start.sh"
  }
]'
```

### API Usage Examples

#### Execute command on specific instance
```bash
POST /apanel44/api/server/console
{
  "command": "say Hello World",
  "instanceId": "s1"
}
```

#### List files for specific instance
```bash
GET /apanel44/api/files?instanceId=s2
```

#### Collect metrics for specific instance
```bash
GET /apanel44/api/monitoring/collect?token=YOUR_TOKEN&instanceId=s1
```

#### View metrics history for specific instance
```bash
GET /apanel44/api/monitoring/history?instanceId=s2&timeRange=24h
```

#### View activity logs for specific instance
```javascript
// In your code
const logs = await getActivityLogs({
  instanceId: 's1',
  page: 1,
  limit: 50
});
```

## Backward Compatibility

All changes maintain backward compatibility:

1. **instanceId is nullable**: Existing code that doesn't pass instanceId will work fine
2. **Default behavior**: When instanceId is not provided, the default instance is used
3. **Migration endpoint**: Allows existing data to be tagged with an instance ID
4. **API queries**: Work with or without instanceId parameter

## Database Query Examples

### Filter activity logs by instance
```sql
SELECT * FROM ActivityLog WHERE instanceId = 's1' ORDER BY timestamp DESC;
```

### Filter metrics by instance and time range
```sql
SELECT * FROM ServerMetrics 
WHERE instanceId = 's2' 
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY timestamp ASC;
```

### Count activities per instance
```sql
SELECT instanceId, COUNT(*) as count 
FROM ActivityLog 
GROUP BY instanceId;
```

### Find untagged records
```sql
SELECT COUNT(*) FROM ActivityLog WHERE instanceId IS NULL;
SELECT COUNT(*) FROM ServerMetrics WHERE instanceId IS NULL;
SELECT COUNT(*) FROM ScheduledTask WHERE instanceId IS NULL;
```

## Monitoring Multiple Instances

You can set up separate cron jobs to collect metrics for each instance:

```bash
# Collect metrics for Server 1 every 5 minutes
*/5 * * * * curl -X GET "http://localhost:3000/apanel44/api/monitoring/collect?token=YOUR_TOKEN&instanceId=s1" >> /var/log/metrics-s1.log 2>&1

# Collect metrics for Server 2 every 5 minutes
*/5 * * * * curl -X GET "http://localhost:3000/apanel44/api/monitoring/collect?token=YOUR_TOKEN&instanceId=s2" >> /var/log/metrics-s2.log 2>&1
```

## Benefits

1. **Single Database**: All instances share one database, reducing infrastructure complexity
2. **Clear Separation**: Activity logs and metrics are clearly tagged by instance
3. **Flexible Querying**: Easy to query data for specific instances or across all instances
4. **Audit Trail**: Complete history of which actions were performed on which servers
5. **Resource Monitoring**: Track metrics independently for each server instance
6. **Cost Effective**: No need for separate database per instance

## Future Enhancements

Potential future improvements:
- Frontend UI to filter logs/metrics by instance
- Instance-specific dashboards
- Cross-instance comparison views
- Automatic instance detection based on server context
- Instance-specific scheduled tasks
- Instance health monitoring and alerting

## Troubleshooting

### Check if migration is needed
```bash
curl -X GET "http://localhost:3000/apanel44/api/admin/migrate-instance-data"
```

### Verify instanceId is being set for new records
```sql
-- Should show recent records with instanceId
SELECT id, actionType, instanceId, timestamp 
FROM ActivityLog 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Check instance configuration
```bash
# In Node.js console
const { getServerInstances } = require('./src/lib/serverInstances');
console.log(getServerInstances());
```

## Security Notes

- Migration endpoint requires Super Admin role
- Instance IDs are validated on API endpoints
- No SQL injection risk (using Prisma ORM)
- Activity logging includes instance information for audit trail
