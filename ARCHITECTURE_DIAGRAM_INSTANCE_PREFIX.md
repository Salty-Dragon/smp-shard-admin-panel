# Multi-Instance Database Architecture Diagram

## Before: Single Instance (No Separation)

```
┌─────────────────────────────────────────────────────────┐
│                     MySQL Database                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ActivityLog                                       │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ id  | userId | actionType | timestamp | ...      │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 1   | user1  | server_cmd | 2024-02-25 10:00    │  │ ← Which server?
│  │ 2   | user2  | upload_file| 2024-02-25 10:01    │  │ ← Which server?
│  │ 3   | user1  | server_cmd | 2024-02-25 10:02    │  │ ← Which server?
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ServerMetrics                                     │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ id  | cpuUsage | memUsage | playerCount | ...    │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 1   | 45.2     | 62.8     | 12          | ...    │  │ ← Which server?
│  │ 2   | 52.1     | 68.4     | 8           | ...    │  │ ← Which server?
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘

❌ Problem: Cannot distinguish between Server 1 and Server 2 data
```

## After: Multi-Instance (With Prefixes)

```
┌─────────────────────────────────────────────────────────────────┐
│                        MySQL Database                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ ActivityLog                                                 ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ id | userId | actionType  | instanceId | timestamp | ...   ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ 1  | user1  | server_cmd  | s1         | 2024-02-25 10:00 ││ ← Server 1
│  │ 2  | user2  | upload_file | s2         | 2024-02-25 10:01 ││ ← Server 2
│  │ 3  | user1  | server_cmd  | s1         | 2024-02-25 10:02 ││ ← Server 1
│  │ 4  | user3  | edit_file   | s2         | 2024-02-25 10:03 ││ ← Server 2
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ ServerMetrics                                               ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ id | instanceId | cpuUsage | memUsage | playerCount | ...  ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ 1  | s1         | 45.2     | 62.8     | 12          | ...  ││ ← Server 1
│  │ 2  | s2         | 52.1     | 68.4     | 8           | ...  ││ ← Server 2
│  │ 3  | s1         | 46.8     | 64.2     | 13          | ...  ││ ← Server 1
│  │ 4  | s2         | 48.5     | 66.1     | 9           | ...  ││ ← Server 2
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ ScheduledTask                                               ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ id | name      | instanceId | scheduleType | ...           ││
│  ├────────────────────────────────────────────────────────────┤│
│  │ 1  | Backup    | s1         | recurring    | ...           ││ ← Server 1 only
│  │ 2  | Cleanup   | s2         | recurring    | ...           ││ ← Server 2 only
│  │ 3  | Restart   | NULL       | recurring    | ...           ││ ← All servers
│  └────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

✅ Solution: Clear separation with instanceId field
✅ Single database, multiple instances
✅ Easy filtering: WHERE instanceId = 's1'
```

## Data Flow with Instance Prefix

```
┌─────────────┐
│  Server 1   │
│  (s1)       │
│  Main       │
└──────┬──────┘
       │
       │ Execute Command
       │ "say Hello"
       ↓
┌─────────────────────────────┐
│  Admin Panel                │
│  /api/server/console        │
└──────┬──────────────────────┘
       │
       │ logActivity({
       │   userId: user.id,
       │   actionType: 'server_command',
       │   instanceId: 's1'  ← Instance prefix
       │ })
       ↓
┌─────────────────────────────┐
│  Database                   │
│  ActivityLog Table          │
│  ┌─────────────────────┐   │
│  │ instanceId: "s1"    │   │
│  │ actionType: "cmd"   │   │
│  │ timestamp: now()    │   │
│  └─────────────────────┘   │
└─────────────────────────────┘


┌─────────────┐
│  Server 2   │
│  (s2)       │
│  Creative   │
└──────┬──────┘
       │
       │ Upload Plugin
       │ "WorldEdit.jar"
       ↓
┌─────────────────────────────┐
│  Admin Panel                │
│  /api/files                 │
└──────┬──────────────────────┘
       │
       │ logActivity({
       │   userId: user.id,
       │   actionType: 'upload_file',
       │   instanceId: 's2'  ← Instance prefix
       │ })
       ↓
┌─────────────────────────────┐
│  Database                   │
│  ActivityLog Table          │
│  ┌─────────────────────┐   │
│  │ instanceId: "s2"    │   │
│  │ actionType: "upload"│   │
│  │ timestamp: now()    │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

## Querying with Instance Filter

### Example 1: Get logs for Server 1 only
```sql
SELECT * FROM ActivityLog 
WHERE instanceId = 's1' 
ORDER BY timestamp DESC 
LIMIT 50;
```

### Example 2: Get metrics for Server 2 in last 24h
```sql
SELECT * FROM ServerMetrics 
WHERE instanceId = 's2' 
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY timestamp ASC;
```

### Example 3: Compare player counts across instances
```sql
SELECT 
  instanceId,
  AVG(playerCount) as avg_players,
  MAX(playerCount) as peak_players
FROM ServerMetrics 
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY instanceId;
```

### Example 4: Get all scheduled tasks for a specific instance
```sql
SELECT * FROM ScheduledTask 
WHERE instanceId = 's1' OR instanceId IS NULL
ORDER BY nextRunAt ASC;
```
*(NULL means task applies to all instances)*

## API Request Examples

### Execute command on Server 1
```bash
POST /apanel44/api/server/console
Content-Type: application/json

{
  "command": "list",
  "instanceId": "s1"
}
```

### Get metrics history for Server 2
```bash
GET /apanel44/api/monitoring/history?instanceId=s2&timeRange=24h
```

### List files for Server 1
```bash
GET /apanel44/api/files?instanceId=s1
```

### Upload plugin to Server 2
```bash
POST /apanel44/api/files?instanceId=s2
Content-Type: multipart/form-data

file: plugin.jar
instanceId: s2
```

## Environment Configuration

```env
INSTANCES='[
  {
    "id": "s1",                          ← Instance prefix
    "name": "s1",
    "displayName": "Main Server",
    "serverPath": "/opt/minecraft/main",
    "pluginsPath": "/opt/minecraft/main/plugins",
    "tmuxSession": "minecraft-main",
    "startScript": "./start.sh",
    "isDefault": true
  },
  {
    "id": "s2",                          ← Instance prefix
    "name": "s2",
    "displayName": "Creative Server",
    "serverPath": "/opt/minecraft/creative",
    "pluginsPath": "/opt/minecraft/creative/plugins",
    "tmuxSession": "minecraft-creative",
    "startScript": "./start.sh"
  }
]'
```

## Migration Process

```
Step 1: Update Schema
┌───────────────────┐
│ Prisma Schema     │
│ + instanceId      │
└────────┬──────────┘
         │
         ↓
  npx prisma db push
         │
         ↓
┌───────────────────┐
│ Database Updated  │
│ (new columns)     │
└───────────────────┘


Step 2: Backfill Existing Data
┌───────────────────┐
│ Existing Data     │
│ instanceId: NULL  │
└────────┬──────────┘
         │
         ↓ POST /api/admin/migrate-instance-data
         │ Body: {"instanceId": "s1"}
         │
         ↓
┌───────────────────┐
│ Updated Data      │
│ instanceId: "s1"  │
└───────────────────┘


Step 3: New Data Automatically Tagged
┌───────────────────┐
│ New API Call      │
│ instanceId: "s2"  │
└────────┬──────────┘
         │
         ↓
┌───────────────────┐
│ Saved to DB       │
│ instanceId: "s2"  │
└───────────────────┘
```

## Benefits Summary

```
┌─────────────────────────────────────────────────────────┐
│                   BENEFITS                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ Single Database                                     │
│     All instances share one database                    │
│     No additional infrastructure needed                 │
│                                                          │
│  ✅ Clear Data Separation                               │
│     Each record tagged with source instance             │
│     Easy to filter and query per instance               │
│                                                          │
│  ✅ Complete Audit Trail                                │
│     Know exactly which server each action affected      │
│     Track history per instance                          │
│                                                          │
│  ✅ Independent Monitoring                              │
│     Monitor performance of each instance separately     │
│     Compare metrics across instances                    │
│                                                          │
│  ✅ Backward Compatible                                 │
│     Existing code works without changes                 │
│     Optional instanceId parameter                       │
│                                                          │
│  ✅ Easy Migration                                      │
│     Simple API endpoint to backfill data                │
│     No data loss during migration                       │
│                                                          │
│  ✅ Cost Effective                                      │
│     No need for separate databases per instance         │
│     Reduced infrastructure costs                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```
