# Historical Data Visualization Guide

This guide explains the historical data visualization features available in the SMP Admin Panel, including how to set up automatic data collection and use the All Stats page.

## Table of Contents

1. [Overview](#overview)
2. [Database Migration](#database-migration)
3. [Automatic Metrics Collection](#automatic-metrics-collection)
4. [All Stats Page Features](#all-stats-page-features)
5. [Chart Types and Metrics](#chart-types-and-metrics)
6. [Using the Interface](#using-the-interface)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The SMP Admin Panel now includes comprehensive historical data visualization capabilities that allow administrators to:

- Track server performance over time (CPU, Memory, Disk usage)
- Monitor player count trends
- View server online/offline history
- Analyze metrics across different time ranges
- Set up automatic data refresh

All historical data is stored in the database and displayed through interactive charts on the **All Stats** page.

---

## Database Migration

Before using the historical data visualization features, you need to update your database schema to include the new `serverOnline` field in the `ServerMetrics` table.

### Option 1: Using Prisma Migrate (Recommended)

```bash
# Run the Prisma migration
npx prisma migrate deploy
```

This will apply the migration that adds the `serverOnline` field.

### Option 2: Manual SQL Migration

If you prefer to run the migration manually, execute this SQL on your database:

```sql
-- Add serverOnline field to ServerMetrics table
ALTER TABLE `ServerMetrics` 
ADD COLUMN `serverOnline` BOOLEAN NOT NULL DEFAULT false;
```

### Verify Migration

Check that the field was added successfully:

```sql
DESCRIBE ServerMetrics;
```

You should see the `serverOnline` field in the table structure.

---

## Automatic Metrics Collection

### Method 1: Using Cron Jobs (Recommended)

The easiest way to automatically collect metrics is to set up a cron job that calls the metrics collection endpoint.

#### Step 1: Generate a Collection Token

Generate a secure token for the automated collection:

```bash
openssl rand -base64 32
```

#### Step 2: Add Token to Environment Variables

Add the token to your `.env` file:

```bash
# Use the same token as DEBUG_TOKEN or create a new one
METRICS_COLLECTION_TOKEN="your-generated-token-here"
# Or reuse the DEBUG_TOKEN
DEBUG_TOKEN="your-generated-token-here"
```

#### Step 3: Set Up Cron Job

Add a cron job to collect metrics every 5 minutes:

```bash
# Edit your crontab
crontab -e

# Add this line (replace TOKEN with your actual token):
*/5 * * * * curl -X GET "http://localhost:3000/apanel44/api/monitoring/collect?token=YOUR_TOKEN" >> /var/log/metrics-collection.log 2>&1
```

**Collection Frequency Recommendations:**
- **Every 5 minutes**: Good balance between detail and database size
- **Every 10 minutes**: Less granular but reduces database load
- **Every 1 minute**: Very detailed but increases database size quickly

#### Step 4: Verify Collection

Check the log file to ensure metrics are being collected:

```bash
tail -f /var/log/metrics-collection.log
```

You should see JSON responses indicating successful collection:

```json
{
  "success": true,
  "message": "Metrics collected and saved successfully",
  "timestamp": "2024-01-28T12:00:00.000Z",
  "metrics": {
    "cpuUsage": 45.2,
    "memoryUsagePercent": 62.8,
    "playerCount": 5,
    "serverOnline": true
  }
}
```

### Method 2: Using systemd Timer (Linux)

For more advanced setups, you can use systemd timers:

#### Create Service File

Create `/etc/systemd/system/smp-metrics-collection.service`:

```ini
[Unit]
Description=SMP Admin Panel Metrics Collection
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -X GET "http://localhost:3000/apanel44/api/monitoring/collect?token=YOUR_TOKEN"
User=www-data
StandardOutput=journal
StandardError=journal
```

#### Create Timer File

Create `/etc/systemd/system/smp-metrics-collection.timer`:

```ini
[Unit]
Description=Run SMP Metrics Collection every 5 minutes
Requires=smp-metrics-collection.service

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min
Unit=smp-metrics-collection.service

[Install]
WantedBy=timers.target
```

#### Enable and Start Timer

```bash
sudo systemctl daemon-reload
sudo systemctl enable smp-metrics-collection.timer
sudo systemctl start smp-metrics-collection.timer

# Check status
sudo systemctl status smp-metrics-collection.timer
```

### Method 3: Manual Collection via API

You can also manually trigger metric collection with authentication:

```bash
curl -X GET "http://localhost:3000/apanel44/api/monitoring/metrics?saveHistory=true" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

---

## All Stats Page Features

Access the All Stats page at: `http://localhost:3000/apanel44/all-stats`

**Note**: Only users with Admin or Super Admin roles can access this page.

### Available Features:

1. **Time Range Selection**
   - Last 24 Hours
   - Last 7 Days
   - Last 30 Days
   - Custom Date Range

2. **Custom Date Range Picker**
   - Select specific start and end dates/times
   - Useful for analyzing specific time periods
   - Supports date-time precision

3. **Auto-Refresh**
   - Enable/disable automatic data refresh
   - Choose refresh interval: 10 or 30 seconds
   - Useful for monitoring in real-time

4. **Manual Refresh**
   - Click "🔄 Refresh Now" button to update data immediately

---

## Chart Types and Metrics

### 1. CPU Usage Trend (Line Chart)

**What it shows**: CPU usage percentage over time

**Key Information**:
- Y-axis: CPU usage (0-100%)
- X-axis: Timestamp
- Line color: Green (#4ade80)
- Shows system load and processing demands

**Interpretation**:
- **< 50%**: Normal operation
- **50-75%**: Moderate load
- **> 75%**: High load, may need investigation
- **Spikes**: Temporary high activity (backups, player joins, etc.)

### 2. Memory Usage Trend (Line Chart)

**What it shows**: RAM usage percentage over time

**Key Information**:
- Y-axis: Memory usage (0-100%)
- X-axis: Timestamp
- Line color: Blue (#3b82f6)
- Indicates memory consumption patterns

**Interpretation**:
- **< 60%**: Healthy memory usage
- **60-80%**: Moderate usage, monitor
- **> 80%**: High usage, consider adding RAM or optimizing
- **Steady increase**: Possible memory leak

### 3. Player Count Trend (Line Chart)

**What it shows**: Number of online players over time

**Key Information**:
- Y-axis: Number of players
- X-axis: Timestamp
- Line color: Orange (#f59e0b)
- Shows player activity patterns

**Interpretation**:
- Identify peak playing times
- Track player growth or decline
- Plan maintenance during low-traffic periods
- Correlate with resource usage

### 4. Disk Usage Trend (Area Chart)

**What it shows**: Disk space usage percentage over time

**Key Information**:
- Y-axis: Disk usage (0-100%)
- X-axis: Timestamp
- Fill color: Purple (#8b5cf6)
- Semi-transparent fill for better readability

**Interpretation**:
- **< 70%**: Healthy disk space
- **70-85%**: Monitor disk usage
- **> 85%**: Clean up or expand storage
- **Rapid increase**: Check for log files or world backups

### 5. Server Status History (Bar Chart)

**What it shows**: Minecraft server online/offline status over time

**Key Information**:
- Y-axis: Online (1) or Offline (0)
- X-axis: Timestamp
- Green bars: Server online
- Red bars: Server offline
- Shows server uptime/downtime patterns

**Interpretation**:
- Track server stability
- Identify crash patterns
- Verify restart schedules
- Monitor after maintenance

---

## Using the Interface

### Selecting a Time Range

1. **Preset Ranges**: Click one of the preset buttons:
   - **Last 24 Hours**: Most recent day
   - **Last 7 Days**: Past week
   - **Last 30 Days**: Past month

2. **Custom Range**: 
   - Click "Custom Range" button
   - Select start date and time
   - Select end date and time
   - Click "Apply" to load data

### Enabling Auto-Refresh

1. Check the "Auto-refresh" checkbox
2. Select refresh interval (10 or 30 seconds)
3. Charts will automatically update at the selected interval
4. Uncheck to disable auto-refresh

**Note**: Auto-refresh is useful for real-time monitoring but will increase server load. Use 30-second intervals for normal monitoring.

### Interpreting Charts

1. **Hover over data points** to see exact values and timestamps
2. **Use the legend** to identify what each line/bar represents
3. **Compare multiple metrics** to find correlations (e.g., high CPU during peak player times)
4. **Look for patterns** across different time ranges

### Export and Analysis

Currently, the charts display in the browser. For detailed analysis:

1. Take screenshots of charts for reports
2. Use browser developer tools to inspect raw data
3. Query the database directly for custom analysis:

```sql
SELECT 
  timestamp,
  cpuUsage,
  memoryUsagePercent,
  playerCount,
  diskUsage,
  serverOnline
FROM ServerMetrics
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY timestamp ASC;
```

---

## Troubleshooting

### No Historical Data Available

**Symptom**: "No Historical Data Yet" message appears on All Stats page

**Solutions**:

1. **Check if metrics collection is enabled**:
   ```bash
   # Check cron job
   crontab -l | grep metrics-collection
   
   # Check systemd timer (if using)
   systemctl status smp-metrics-collection.timer
   ```

2. **Manually trigger collection**:
   ```bash
   curl -X GET "http://localhost:3000/apanel44/api/monitoring/collect?token=YOUR_TOKEN"
   ```

3. **Check database**:
   ```sql
   SELECT COUNT(*) FROM ServerMetrics;
   SELECT * FROM ServerMetrics ORDER BY timestamp DESC LIMIT 5;
   ```

4. **Review logs**:
   ```bash
   tail -f /var/log/metrics-collection.log
   ```

### Metrics Collection Failing

**Symptom**: Cron job returns errors or no data is saved

**Solutions**:

1. **Verify token**:
   - Ensure `METRICS_COLLECTION_TOKEN` or `DEBUG_TOKEN` is set in `.env`
   - Check token matches between `.env` and cron job

2. **Check database connection**:
   ```bash
   # Test database connectivity
   mysql -u user -p -h localhost smp_admin_panel -e "SELECT 1;"
   ```

3. **Review API logs**:
   - Check Node.js console for error messages
   - Look for database connection errors

4. **Test endpoint manually**:
   ```bash
   curl -v -X GET "http://localhost:3000/apanel44/api/monitoring/collect?token=YOUR_TOKEN"
   ```

### Charts Not Displaying Properly

**Symptom**: Charts show errors or don't render

**Solutions**:

1. **Clear browser cache** and reload the page
2. **Check browser console** for JavaScript errors (F12 → Console)
3. **Verify data format**:
   - Ensure dates are valid
   - Check for null values in database
4. **Try different time range** - some ranges may have no data

### Server Status Shows Offline When Server is Running

**Symptom**: Server Status chart shows offline (red) but server is running

**Solutions**:

1. **Check tmux session name**:
   ```bash
   # List tmux sessions
   tmux ls
   
   # Verify MINECRAFT_SERVER_SESSION in .env matches actual session
   ```

2. **Test server status API**:
   ```bash
   curl http://localhost:3000/apanel44/api/monitoring/server-status \
     -H "Authorization: Bearer YOUR_SESSION_TOKEN"
   ```

3. **Review Minecraft server console**:
   - Ensure server is responsive to commands
   - Check if `list` command works in console

### High Database Size

**Symptom**: Database growing too large from historical data

**Solutions**:

1. **Reduce collection frequency**:
   - Change cron from every 5 minutes to every 10 or 15 minutes

2. **Implement data retention policy**:
   ```sql
   -- Delete metrics older than 90 days
   DELETE FROM ServerMetrics 
   WHERE timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);
   ```

3. **Create cleanup cron job**:
   ```bash
   # Run daily at 3 AM
   0 3 * * * mysql -u user -p'password' smp_admin_panel -e "DELETE FROM ServerMetrics WHERE timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);" >> /var/log/metrics-cleanup.log 2>&1
   ```

### Auto-Refresh Not Working

**Symptom**: Charts don't update when auto-refresh is enabled

**Solutions**:

1. **Check checkbox is selected**
2. **Verify interval is set** (10 or 30 seconds)
3. **Check browser console** for errors
4. **Disable ad-blockers** - they may interfere with refresh
5. **Try manual refresh** to verify endpoint is working

---

## Performance Considerations

### Database Optimization

1. **Indexes**: The schema includes an index on `timestamp` for fast queries
2. **Data Retention**: Consider keeping only 30-90 days of detailed metrics
3. **Archiving**: Archive older data to separate tables or export to CSV

### Query Optimization

1. **Limit results**: The history API limits to 100 records by default
2. **Time range**: Shorter time ranges query faster
3. **Pagination**: For very large datasets, consider implementing pagination

### Collection Frequency

- **Every 1 min**: Very detailed, ~1.5M records/year, ~150MB/year
- **Every 5 min**: Balanced, ~300K records/year, ~30MB/year  
- **Every 15 min**: Minimal, ~100K records/year, ~10MB/year

Choose based on your monitoring needs and available resources.

---

## API Reference

### Automated Collection Endpoint

**Endpoint**: `GET /apanel44/api/monitoring/collect`

**Authentication**: Token-based (via query parameter)

**Parameters**:
- `token` (required): Authentication token from `.env`

**Example**:
```bash
curl "http://localhost:3000/apanel44/api/monitoring/collect?token=YOUR_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "message": "Metrics collected and saved successfully",
  "timestamp": "2024-01-28T12:00:00.000Z",
  "metrics": {
    "cpuUsage": 45.2,
    "memoryUsagePercent": 62.8,
    "playerCount": 5,
    "serverOnline": true
  }
}
```

### Historical Metrics Endpoint

**Endpoint**: `GET /apanel44/api/monitoring/history`

**Authentication**: Session-based (Admin/Super Admin only)

**Parameters**:
- `timeRange`: `24h`, `7d`, or `30d` (default: `24h`)
- `startDate`: Custom start date (ISO 8601 format)
- `endDate`: Custom end date (ISO 8601 format)
- `limit`: Maximum records to return (default: `100`)

**Examples**:
```bash
# Last 24 hours
curl "http://localhost:3000/apanel44/api/monitoring/history?timeRange=24h" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"

# Custom date range
curl "http://localhost:3000/apanel44/api/monitoring/history?startDate=2024-01-20T00:00:00Z&endDate=2024-01-27T23:59:59Z" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

---

## Best Practices

1. **Regular Monitoring**: Check All Stats page weekly to identify trends
2. **Set Alerts**: Consider external monitoring tools for critical metrics
3. **Data Cleanup**: Schedule regular cleanup of old metrics
4. **Backup Data**: Include ServerMetrics table in database backups
5. **Document Changes**: Note significant events (updates, config changes) to correlate with metric changes
6. **Use Custom Ranges**: Investigate specific incidents with custom date ranges
7. **Correlate Metrics**: Look for relationships between player count, CPU, and memory usage

---

## Additional Resources

- [TESTING_DEPLOYMENT_GUIDE.md](./TESTING_DEPLOYMENT_GUIDE.md) - Server setup and deployment
- [README.md](./README.md) - General admin panel documentation
- [Recharts Documentation](https://recharts.org/) - Chart library used in the interface

---

## Support

If you encounter issues not covered in this guide:

1. Check the browser console (F12) for errors
2. Review server logs for API errors
3. Test API endpoints manually with curl
4. Verify database connectivity and permissions
5. Check environment variables are correctly set

For persistent issues, review the error reports page in the admin panel or check application logs.
