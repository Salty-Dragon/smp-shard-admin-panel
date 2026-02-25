# Quick Start: Migrating to Multi-Instance Database Support

This guide helps you quickly migrate your existing single-instance admin panel to support multiple server instances with database separation.

## What Changed?

Your database now supports an `instanceId` field on these tables:
- `ActivityLog` - Track which instance actions were performed on
- `ServerMetrics` - Store metrics per instance
- `ScheduledTask` - Assign tasks to specific instances

## Migration Steps

### Step 1: Update Your Code

Pull the latest changes from the repository:
```bash
cd /path/to/smp-shard-admin-panel
git pull origin main
npm install
npx prisma generate
```

### Step 2: Update Your Database Schema

Run the database migration to add the new `instanceId` fields:

```bash
# For development/testing
npx prisma db push

# For production (recommended)
npx prisma migrate dev --name add-instance-id-fields
npx prisma migrate deploy
```

### Step 3: Configure Your Instances

Update your `.env` file with your server instances:

```env
# Example: Two server instances
INSTANCES='[
  {
    "id": "s1",
    "name": "s1",
    "displayName": "Main Server",
    "serverPath": "/opt/minecraft/main",
    "pluginsPath": "/opt/minecraft/main/plugins",
    "tmuxSession": "minecraft-main",
    "startScript": "./start.sh",
    "isDefault": true
  },
  {
    "id": "s2",
    "name": "s2",
    "displayName": "Creative Server",
    "serverPath": "/opt/minecraft/creative",
    "pluginsPath": "/opt/minecraft/creative/plugins",
    "tmuxSession": "minecraft-creative",
    "startScript": "./start.sh"
  }
]'
```

### Step 4: Migrate Existing Data

**Option A: Using the Web Interface** (Recommended)

1. Log in as a Super Admin
2. Navigate to: `https://your-domain.com/apanel44/api/admin/migrate-instance-data`
3. Send a POST request with your default instance ID

**Option B: Using cURL**

```bash
# First, check what needs migration
curl -X GET "https://your-domain.com/apanel44/api/admin/migrate-instance-data" \
  -H "Cookie: your-session-cookie" | jq

# Then migrate (replace YOUR_SESSION_COOKIE and s1 as needed)
curl -X POST "https://your-domain.com/apanel44/api/admin/migrate-instance-data" \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{"instanceId": "s1"}' | jq
```

**Option C: Direct Database Update** (Advanced users)

```sql
-- Backup your database first!
mysqldump -u user -p database_name > backup.sql

-- Update existing records
UPDATE ActivityLog SET instanceId = 's1' WHERE instanceId IS NULL;
UPDATE ServerMetrics SET instanceId = 's1' WHERE instanceId IS NULL;
UPDATE ScheduledTask SET instanceId = 's1' WHERE instanceId IS NULL;

-- Verify the migration
SELECT 
  'ActivityLog' as table_name,
  COUNT(*) as with_instance,
  (SELECT COUNT(*) FROM ActivityLog WHERE instanceId IS NULL) as without_instance
FROM ActivityLog WHERE instanceId IS NOT NULL
UNION ALL
SELECT 
  'ServerMetrics',
  COUNT(*),
  (SELECT COUNT(*) FROM ServerMetrics WHERE instanceId IS NULL)
FROM ServerMetrics WHERE instanceId IS NOT NULL
UNION ALL
SELECT 
  'ScheduledTask',
  COUNT(*),
  (SELECT COUNT(*) FROM ScheduledTask WHERE instanceId IS NULL)
FROM ScheduledTask WHERE instanceId IS NOT NULL;
```

### Step 5: Test the Migration

Run the test script to verify everything works:

```bash
node test-instance-prefix.js
```

Expected output:
```
🧪 Testing Multi-Instance Database Prefix Support

Test 1: Verifying schema has instanceId field...
✅ Schema verified - tables support instanceId field

Test 2: Checking for records without instanceId...
  ActivityLog: 0 records without instanceId
  ServerMetrics: 0 records without instanceId
  ScheduledTask: 0 records without instanceId
✅ All records have instanceId set

Test 3: Checking for records with instanceId...
  ActivityLog: 150 records with instanceId
  ServerMetrics: 500 records with instanceId
  ScheduledTask: 5 records with instanceId
✅ Records with instanceId found

Test 4: Finding unique instance IDs in use...
  Unique instances: s1
✅ Found 1 unique instance(s)

Test 5: Testing instanceId filtering (instance: s1)...
  Found 150 activity logs for instance 's1'
✅ Filtering by instanceId works

✅ All tests passed!
```

### Step 6: Update Metrics Collection

If you have a cron job collecting metrics, update it to include instance ID:

```bash
# Old way (still works, uses default instance)
*/5 * * * * curl -X GET "http://localhost:3000/apanel44/api/monitoring/collect?token=YOUR_TOKEN"

# New way (recommended for multi-instance)
*/5 * * * * curl -X GET "http://localhost:3000/apanel44/api/monitoring/collect?token=YOUR_TOKEN&instanceId=s1"
*/5 * * * * curl -X GET "http://localhost:3000/apanel44/api/monitoring/collect?token=YOUR_TOKEN&instanceId=s2"
```

## Verification

After migration, verify your setup:

1. **Check Data Distribution**:
   ```sql
   SELECT instanceId, COUNT(*) as count 
   FROM ActivityLog 
   GROUP BY instanceId;
   ```

2. **Test Instance-Specific Queries**:
   ```bash
   # View logs for specific instance
   GET /apanel44/api/monitoring/history?instanceId=s1&timeRange=24h
   ```

3. **Verify API Operations**:
   ```bash
   # Execute command on specific instance
   POST /apanel44/api/server/console
   {
     "command": "list",
     "instanceId": "s1"
   }
   ```

## Troubleshooting

### "Field not found" error
- Make sure you ran `npx prisma generate` after updating the schema
- Restart your Next.js development server

### Migration shows 0 records migrated but you have data
- Check that you're using the correct database URL in `.env`
- Verify the Prisma client is connecting to the right database

### Instances not showing up
- Verify your `INSTANCES` environment variable is valid JSON
- Check the console for parsing errors
- Ensure the JSON is properly escaped in your `.env` file

### Getting session cookie for cURL
In your browser developer tools:
1. Log in as Super Admin
2. Open DevTools (F12) → Application → Cookies
3. Copy the `next-auth.session-token` cookie value
4. Use it in cURL: `-H "Cookie: next-auth.session-token=YOUR_VALUE"`

## Need Help?

- Full documentation: [MULTI_INSTANCE_DATABASE_PREFIX.md](MULTI_INSTANCE_DATABASE_PREFIX.md)
- Multi-instance setup: [MULTI_INSTANCE_GUIDE.md](MULTI_INSTANCE_GUIDE.md)
- Test script: Run `node test-instance-prefix.js`

## Rollback

If you need to rollback:

```bash
# Rollback database migration
npx prisma migrate resolve --rolled-back add-instance-id-fields

# Restore from backup
mysql -u user -p database_name < backup.sql
```
