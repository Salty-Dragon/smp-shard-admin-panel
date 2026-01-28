# Testing Guide: Server Status and Player Count Fix

## Quick Start Testing

This guide helps you test the server status and player count fixes in your local or staging environment.

## Prerequisites

1. **Minecraft Server Running in tmux**:
   - Your Minecraft server must be running in a tmux session
   - Find your session name: `tmux ls`

2. **Configuration**:
   - Add `MINECRAFT_SERVER_SESSION="your-session-name"` to `.env`
   - Replace `"your-session-name"` with the actual tmux session name

3. **Admin Panel Running**:
   ```bash
   npm install
   npm run dev
   ```

## Test Scenarios

### Test 1: Server Online with Players

**Setup:**
1. Start Minecraft server in tmux
2. Have 1-3 players join the server

**Steps:**
1. Open dashboard: `http://localhost:3000/apanel44/dashboard`
2. Look at the "Quick Stats" section

**Expected Results:**
- ✅ Server Status: **"Online"** (green text)
- ✅ Player Count: Actual number (e.g., "3")
- ✅ Both update automatically every 10 seconds

**Console Logs:**
```
[Minecraft] Fetching player count for server: minecraft-server
[Minecraft] Server session exists, sending 'list' command...
[Minecraft] Raw output received (last 200 chars): ...
[Minecraft] Parsed player count: 3
```

### Test 2: Server Online with No Players

**Setup:**
1. Ensure Minecraft server is running
2. No players online

**Steps:**
1. Refresh dashboard
2. Check Quick Stats

**Expected Results:**
- ✅ Server Status: **"Online"** (green text)
- ✅ Player Count: **"0"**

### Test 3: Server Offline

**Setup:**
1. Stop your Minecraft server:
   ```bash
   # Option 1: In tmux console, type:
   /stop
   
   # Option 2: Kill tmux session:
   tmux kill-session -t minecraft-server
   ```

**Steps:**
1. Wait 5 seconds for server to fully stop
2. Refresh dashboard
3. Check Quick Stats

**Expected Results:**
- ✅ Server Status: **"Offline"** (red text)
- ✅ Player Count: **"0"**

**Console Logs:**
```
[Minecraft] Server session 'minecraft-server' not found. Server is likely offline.
[Minecraft] Parsed player count: 0
```

### Test 4: Server Restart (Dynamic Update)

**Setup:**
1. Have dashboard open
2. Server is running

**Steps:**
1. Stop the server (see Test 3)
2. Wait 10 seconds (for auto-refresh)
3. Observe dashboard changes to "Offline"
4. Restart the server
5. Wait 10 seconds

**Expected Results:**
- ✅ Initially: "Online" + player count
- ✅ After stop: Changes to "Offline" + 0 players within 10 seconds
- ✅ After restart: Changes back to "Online" + 0 players within 10 seconds
- ✅ No page refresh needed (auto-updates)

### Test 5: Wrong Configuration (Error State)

**Setup:**
1. In `.env`, set wrong session name:
   ```env
   MINECRAFT_SERVER_SESSION="wrong-session-name"
   ```
2. Restart admin panel

**Steps:**
1. Open dashboard
2. Check Quick Stats

**Expected Results:**
- ✅ Server Status: **"Offline"** (red text)
- ✅ Player Count: **"0"**

**Console Logs:**
```
[Minecraft] Server session 'wrong-session-name' not found. Server is likely offline.
```

**Fix:**
1. Run `tmux ls` to find correct session name
2. Update `.env` with correct name
3. Restart admin panel

### Test 6: API Failure (Network Error)

**Setup:**
1. Dashboard is open
2. Stop the Next.js server temporarily

**Steps:**
1. While dashboard is open, stop Next.js: `Ctrl+C`
2. Observe dashboard after 10 seconds

**Expected Results:**
- ✅ Server Status: **"Error"** (yellow text)
- ✅ Secondary label: **"Unable to check"**
- ✅ Previous values preserved (not reset to 0)

**Note:** This tests the monitoring panel's resilience to API failures.

## Verification Checklist

Use this checklist to verify all functionality:

- [ ] Server status shows "Online" when Minecraft is running
- [ ] Server status shows "Offline" when Minecraft is stopped
- [ ] Player count is accurate (matches `/list` command in console)
- [ ] Player count is 0 when no players are online
- [ ] Dashboard auto-updates every 10 seconds
- [ ] No errors in browser console
- [ ] Server logs show proper Minecraft integration logs
- [ ] Wrong session name shows "Offline" (not crash)
- [ ] API errors show "Error - Unable to check" (not crash)

## Manual Comparison Test

For accuracy verification:

1. **In Admin Dashboard:**
   - Note the player count shown

2. **In Minecraft Console:**
   ```bash
   # Attach to tmux session
   tmux attach -t minecraft-server
   
   # Type in console:
   list
   
   # Observe output, e.g.:
   # "There are 3 of a max of 20 players online: Player1, Player2, Player3"
   ```

3. **Compare:**
   - Admin panel player count should match console output
   - If different, check logs for parsing errors

## Debugging

### Dashboard shows "Offline" but server is running

**Check 1: Session name**
```bash
# List all tmux sessions
tmux ls

# Output example:
# minecraft-server: 1 windows (created Mon Jan 28 10:00:00 2026)

# Verify .env has correct name:
cat .env | grep MINECRAFT_SERVER_SESSION
```

**Check 2: Permissions**
```bash
# Test if you can check the session
tmux has-session -t minecraft-server
echo $?
# Should output: 0 (success)
```

**Check 3: Server logs**
```bash
# Check Next.js logs for errors
# Look for [Minecraft] log entries
```

### Player count always 0

**Check 1: Server responsiveness**
```bash
# Attach to Minecraft console
tmux attach -t minecraft-server

# Send list command manually
list

# Check if output appears
```

**Check 2: Output format**
- Check server logs for "Raw output received"
- Verify the format matches expected patterns
- Server might be using a non-standard format

**Check 3: Timeout**
- Server might be slow to respond
- Try increasing timeout in `src/lib/minecraft.ts`:
  ```typescript
  const output = await sendCommandAndCapture(serverName, 'list', 3000); // 3 seconds
  ```

### API shows "Error - Unable to check"

**Check 1: API endpoint**
```bash
# Test API directly
curl http://localhost:3000/apanel44/api/monitoring/server-status

# Should return JSON with status
```

**Check 2: Authentication**
- Ensure you're logged in
- Check browser console for auth errors
- Try refreshing the page

**Check 3: Server errors**
```bash
# Check Next.js server logs
# Look for API errors or crashes
```

## Performance Testing

### Response Time

**Expected response times:**
- API call: 1.5-2.5 seconds
- Dashboard update: < 3 seconds total
- Auto-refresh: Every 10 seconds

**Test:**
1. Open browser DevTools > Network tab
2. Filter for `/server-status`
3. Refresh page or wait for auto-update
4. Check request timing

**Acceptable:**
- < 3 seconds: Good
- 3-5 seconds: Acceptable (slow server)
- > 5 seconds: Investigate (timeout issue)

### Load Testing

**For production:**
1. Multiple users accessing dashboard
2. 10-second polling from each user
3. Monitor server CPU/memory

**Mitigation if needed:**
- Increase polling interval to 30 seconds
- Implement caching (5-10 second cache)
- Consider WebSocket for real-time updates

## Success Criteria

All tests pass when:

1. ✅ Server status accurately reflects Minecraft server state
2. ✅ Player count matches actual online players
3. ✅ Auto-refresh works without page reload
4. ✅ No browser console errors
5. ✅ No server crashes or errors
6. ✅ Error states handled gracefully
7. ✅ Configuration is documented and easy
8. ✅ Logs provide useful debugging information

## Regression Testing

Before marking as complete, verify:

- [ ] Existing dashboard features still work
- [ ] User authentication still works
- [ ] Other API endpoints unaffected
- [ ] Page load performance not degraded
- [ ] No new console warnings/errors
- [ ] Database queries still efficient

## Production Deployment Checklist

Before deploying to production:

- [ ] Test with actual production Minecraft server
- [ ] Verify `.env` has correct session name
- [ ] Test with multiple concurrent users
- [ ] Monitor server logs for errors
- [ ] Document session name for ops team
- [ ] Set up monitoring/alerts for API failures
- [ ] Test server restart scenarios
- [ ] Verify auto-refresh doesn't cause issues

## Support

If issues persist after following this guide:

1. Check server logs for detailed error messages
2. Review `SERVER_STATUS_IMPLEMENTATION.md` for architecture details
3. Verify all prerequisites are met
4. Test with a simple tmux session first
5. Check GitHub issues for similar problems

## Appendix: Test Data Reference

### Minecraft Output Formats

Your server might output in different formats:

**Format 1** (Vanilla):
```
There are 3 of a max of 20 players online: Player1, Player2, Player3
```

**Format 2** (Some mods):
```
There are 3/20 players online: Player1, Player2, Player3
```

**Format 3** (Bukkit/Spigot):
```
3 players online: Player1, Player2, Player3
```

**Format 4** (Paper):
```
players online: Player1, Player2, Player3
```

All formats are supported by the parser.
