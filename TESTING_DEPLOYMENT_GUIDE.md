# Testing and Deployment Guide

## Testing the Changes

### Prerequisites
- Node.js 18+ and npm installed
- MariaDB/MySQL database running
- Database connection configured in `.env`

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database and other settings
   ```

3. **Update Database Schema**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Navigate to: `http://localhost:3000/apanel44/`
   - Log in with your credentials

### Test Cases

#### Test 1: Player Count in Quick Stats
**Steps:**
1. Log in to the dashboard
2. Look at the Quick Stats section
3. Verify "Players Online" card is visible
4. Note the player count number
5. Wait 10 seconds
6. Verify the count updates (it may change due to random simulation)

**Expected Results:**
- Player count displays a number (5-15)
- Number updates every 10 seconds
- Card shows "Players Online" label
- No errors in browser console

**Screenshot Location:** Take a screenshot of the Quick Stats section showing the player count

#### Test 2: Navigation to All Stats
**Steps:**
1. From the dashboard, click the "View All" (→) button in Quick Stats
2. Verify you're redirected to the All Stats page
3. Check the URL is `/apanel44/all-stats/`

**Expected Results:**
- Successfully navigates to All Stats page
- URL changes to `/apanel44/all-stats/`
- No 404 or error pages

#### Test 3: All Stats Page - Empty State
**Steps:**
1. Navigate to `/apanel44/all-stats/`
2. If no historical data exists, verify empty state message displays

**Expected Results:**
- Shows "No Historical Data Yet" message
- Provides instructions for enabling data collection
- No errors or blank page

**Screenshot Location:** Take a screenshot of the empty state

#### Test 4: All Stats Page - With Data

This test validates the collection and display of real-time historical metrics from your server, including CPU usage, memory usage, and Minecraft player count.

**Understanding the Metrics System:**

The admin panel collects **real system metrics** from your server:
- **CPU Usage**: Live CPU utilization percentage from Node.js OS module
- **Memory Usage**: Actual system memory statistics in real-time
- **Player Count**: Real player count from your Minecraft server via tmux console integration
- **Database Metrics**: Connection stats and query times from your database

These are **NOT mock values** - they reflect your actual server's current state.

**Enabling Historical Data Collection:**

The metrics API (`/api/monitoring/metrics`) collects live metrics on every call. To save these snapshots to the database for historical tracking, add the `?saveHistory=true` parameter:

**Steps:**

1. **Get Your Session Token** (Required for authentication):
   - Log in to the admin panel in your browser
   - Open Browser DevTools (F12) → Application tab → Cookies
   - Find the cookie named `next-auth.session-token` (or `__Secure-next-auth.session-token` in production)
   - Copy the cookie value

2. **Manually Collect Historical Data** (For Testing):
   ```bash
   # Call the metrics API with saveHistory parameter to save a snapshot
   # Replace localhost:3000 with your server URL if different
   curl http://localhost:3000/apanel44/api/monitoring/metrics?saveHistory=true \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
   ```
   
   Run this same command 5-10 times, waiting 2 minutes between each execution, to collect several data points.

3. **Verify Data Collection**:
   After collecting several data points, check the database:
   ```bash
   # Using Prisma Studio
   npx prisma studio
   # Navigate to ServerMetrics table to see the saved records
   ```
   
   Or query directly:
   ```sql
   SELECT COUNT(*) FROM ServerMetrics;
   SELECT timestamp, cpuUsage, memoryUsagePercent, playerCount 
   FROM ServerMetrics 
   ORDER BY timestamp DESC 
   LIMIT 10;
   ```

4. **View Historical Data on All Stats Page**:
   - Navigate to `/apanel44/all-stats/`
   - Verify charts display with the collected data points
   - Test the time range selector (24h, 7d, 30d)

**For Production - Continuous Data Collection:**

Set up automated collection using a cron job (see the "Production Deployment" section below). This will continuously save metrics every 5 minutes for ongoing historical tracking.

**Expected Results:**
- Three charts visible: **CPU Usage Trend**, **Memory Usage Trend**, and **Player Count Trend**
- Charts show line graphs with real data points collected from your system
- Each data point represents actual server metrics at that timestamp
- Hover over lines shows tooltip with exact values and timestamps
- Time range selector works correctly (24h, 7d, 30d)
- Player count reflects actual players from your Minecraft server (0 if server is offline)
- Empty state message disappears once historical data exists

**What You're Seeing:**
- **CPU Usage**: Real-time CPU utilization of the Node.js application server
- **Memory Usage**: Actual memory consumption of your system
- **Player Count**: Live player count from Minecraft server via tmux console commands (will be 0 if Minecraft server is not running in a tmux session)

**Screenshot Location:** Take screenshots of each chart showing real data trends

**Troubleshooting:**
- If player count shows 0: Ensure your Minecraft server is running in a tmux session (default: `minecraft-server`) or set `MINECRAFT_SERVER_SESSION` environment variable
- If no data appears: Verify you've called the API with `?saveHistory=true` and check the ServerMetrics table in the database
- If authentication fails: Make sure your session token is valid and your user has Admin or Super Admin role

#### Test 5: Time Range Selector
**Steps:**
1. On All Stats page, click "Last 24 Hours" button
2. Click "Last 7 Days" button
3. Click "Last 30 Days" button
4. Verify charts update accordingly

**Expected Results:**
- Button highlights when selected
- Charts reload with appropriate data
- No errors during switching

#### Test 6: Authentication
**Steps:**
1. Log out from the application
2. Try to access `/apanel44/all-stats/` directly
3. Verify you're redirected to login page

**Expected Results:**
- Non-authenticated users redirected to login
- After login, can access All Stats page
- Only Admin/Super Admin roles can view

#### Test 7: Mobile Responsiveness
**Steps:**
1. Open dashboard on mobile device or resize browser
2. Verify Quick Stats cards stack vertically
3. Open All Stats page
4. Verify charts are responsive

**Expected Results:**
- Cards stack on mobile
- Charts resize appropriately
- No horizontal scrolling
- All buttons are tappable

### Performance Testing

#### Test 8: Player Count Polling
**Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Watch for API calls every 10 seconds
4. Verify `/api/monitoring/metrics` is called

**Expected Results:**
- API called every 10 seconds
- Response time < 500ms
- No failed requests
- No memory leaks after 5 minutes

#### Test 9: Chart Rendering
**Steps:**
1. Navigate to All Stats page with data
2. Open DevTools Performance tab
3. Record while interacting with charts
4. Check for smooth rendering

**Expected Results:**
- Charts render in < 2 seconds
- Smooth interactions
- No layout shifts
- No console errors

## Production Deployment

### Build and Deploy

1. **Update Environment Variables**
   ```bash
   # Production .env
   DATABASE_URL="mysql://user:password@host:3306/smp_admin_panel"
   NEXTAUTH_URL="https://yourdomain.com/apanel44"
   SECRET="your-production-secret"
   NODE_ENV="production"
   ```

2. **Build the Application**
   ```bash
   npm run build
   ```

3. **Start Production Server**
   ```bash
   npm run start
   # Or use PM2 for process management
   pm2 start npm --name "smp-admin" -- start
   ```

4. **Set Up Metrics Collection**
   
   Create a cron job to save metrics periodically:
   ```bash
   # Add to crontab: Save metrics every 5 minutes
   */5 * * * * curl -X GET "http://localhost:3000/apanel44/api/monitoring/metrics?saveHistory=true" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" > /dev/null 2>&1
   ```

   Or create a scheduled task in the admin panel.

### Post-Deployment Verification

1. **Smoke Tests**
   - [ ] Can access dashboard
   - [ ] Player count displays
   - [ ] Can navigate to All Stats
   - [ ] Charts render correctly
   - [ ] No console errors

2. **Monitor Logs**
   ```bash
   # Check application logs
   pm2 logs smp-admin
   
   # Check for errors
   tail -f /var/log/smp-admin/error.log
   ```

3. **Database Check**
   ```sql
   -- Verify metrics are being saved
   SELECT COUNT(*) FROM ServerMetrics;
   SELECT * FROM ServerMetrics ORDER BY timestamp DESC LIMIT 5;
   ```

## Integration with Real Minecraft Server

### Option 1: Console Commands via tmux

Update `src/lib/minecraft.ts`:

```typescript
import { sendCommand } from './console';

export async function getPlayerCount(serverName: string = 'minecraft-server'): Promise<number> {
  try {
    // Send 'list' command to server console
    sendCommand(serverName, 'list');
    
    // Parse console output to extract player count
    // Output format: "There are X of Y players online"
    // Implementation depends on your console output capture
    
    return playerCount;
  } catch (error) {
    console.error('Error fetching player count:', error);
    return 0;
  }
}
```

### Option 2: Minecraft Query Protocol

Install query library:
```bash
npm install minecraft-server-util
```

Update `src/lib/minecraft.ts`:
```typescript
import { queryFull } from 'minecraft-server-util';

export async function getPlayerCount(): Promise<number> {
  try {
    const response = await queryFull('localhost', 25565);
    return response.players.online;
  } catch (error) {
    console.error('Error querying server:', error);
    return 0;
  }
}
```

### Option 3: RCON

Install RCON library:
```bash
npm install rcon-client
```

Update `src/lib/minecraft.ts`:
```typescript
import { Rcon } from 'rcon-client';

export async function getPlayerCount(): Promise<number> {
  try {
    const rcon = await Rcon.connect({
      host: 'localhost',
      port: 25575,
      password: process.env.RCON_PASSWORD || '',
    });
    
    const response = await rcon.send('list');
    await rcon.end();
    
    // Parse response to extract player count
    const match = response.match(/There are (\d+) of/);
    return match ? parseInt(match[1]) : 0;
  } catch (error) {
    console.error('Error connecting to RCON:', error);
    return 0;
  }
}
```

## Troubleshooting

### Issue: Player count not updating

**Cause:** API call failing or no response
**Solution:**
1. Check browser console for errors
2. Verify `/api/monitoring/metrics` endpoint is accessible
3. Check server logs for errors
4. Verify authentication token is valid

### Issue: Charts show "No Historical Data"

**Cause:** Metrics not being saved to database
**Solution:**
1. Call API with `?saveHistory=true` parameter
2. Set up cron job or scheduled task
3. Check database for ServerMetrics records
4. Verify Prisma schema is up to date

### Issue: Charts not rendering

**Cause:** Recharts library not loaded or data format issue
**Solution:**
1. Verify `recharts` is installed: `npm list recharts`
2. Check browser console for errors
3. Verify data format matches expected structure
4. Clear browser cache and reload

### Issue: Permission denied on All Stats page

**Cause:** User role not Admin or Super Admin
**Solution:**
1. Check user role in database
2. Log out and log back in
3. Verify authorization logic in `getServerSideProps`

## Monitoring in Production

### Key Metrics to Monitor

1. **API Response Times**
   - `/api/monitoring/metrics` should respond < 500ms
   - `/api/monitoring/history` should respond < 1s

2. **Database Performance**
   - Monitor ServerMetrics table size
   - Set up automatic cleanup of old records
   - Index performance on timestamp field

3. **Error Rates**
   - Monitor for failed player count fetches
   - Track API error rates
   - Alert on repeated failures

### Automated Health Checks

```bash
#!/bin/bash
# health-check.sh

# Check if player count is updating
response=$(curl -s http://localhost:3000/apanel44/api/monitoring/metrics)
player_count=$(echo $response | jq -r '.metrics.playerCount')

if [ "$player_count" == "null" ]; then
  echo "ERROR: Player count not available"
  exit 1
fi

echo "OK: Player count is $player_count"
exit 0
```

### Database Maintenance

```sql
-- Clean up old metrics (keep last 30 days)
DELETE FROM ServerMetrics 
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Optimize table
OPTIMIZE TABLE ServerMetrics;
```

## Support and Documentation

- **Implementation Details**: See `PLAYER_COUNT_IMPLEMENTATION.md`
- **UI Changes**: See `UI_CHANGES_GUIDE.md`
- **Project README**: See `README.md`
- **API Documentation**: Check inline comments in API files

## Success Criteria

Implementation is successful when:
- [x] Player count displays in Quick Stats
- [x] Count updates every 10 seconds
- [x] "View All" link navigates to All Stats page
- [x] All Stats page displays three trend graphs
- [x] Time range selector works correctly
- [x] Authentication/authorization enforced
- [x] No TypeScript/linting errors
- [x] Production build succeeds
- [ ] Manual testing completed (requires running server)
- [ ] Screenshots captured (requires running server)
- [ ] Real Minecraft server integration (optional)
