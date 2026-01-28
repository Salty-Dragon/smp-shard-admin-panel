# Activity Logging, Error Reporting, and Server Monitoring - Implementation Guide

This document describes the new features added to the SMP Admin Panel.

## 🆕 New Features

### 1. Enhanced Activity Logging

The activity logging system has been enhanced to track additional events:

**New Action Types:**
- `login_failed` - Failed login attempts
- `2fa_enabled` - When a user enables 2FA
- `2fa_disabled` - When a user disables 2FA
- `2fa_failed` - Failed 2FA verification attempts
- `2fa_method_changed` - When a user changes their 2FA method
- `server_config_update` - Server configuration changes
- `server_status_change` - Server status changes
- `create_error_report` - Error report submissions
- `update_error_report` - Error report status updates
- `create_scheduled_task` - Scheduled task creation
- `update_scheduled_task` - Scheduled task updates
- `delete_scheduled_task` - Scheduled task deletion

**Features:**
- All events are automatically logged with timestamp, user, IP address, and user agent
- Logs are stored in the `ActivityLog` table
- Accessible via the "Logs" page for Super Admins and Moderators
- Filterable by user, action type, and time range

### 2. Error Reporting System

A comprehensive error reporting system for admins to report issues and Super Admins to manage them.

**Features:**
- **Submit Error Reports:** Any authenticated user can submit error reports via the "🐛 Report Issue" button
- **Categorize by Severity:** low, medium, high, critical
- **Track Status:** open, in_progress, resolved, closed
- **Dashboard Widget:** Super Admins see recent open error reports on the dashboard
- **Management Page:** Super Admins have a dedicated page at `/error-reports` to view and manage all reports
- **Update Reports:** Super Admins can change status and add resolution notes

**API Endpoints:**
- `POST /api/error-reports` - Submit a new error report
- `GET /api/error-reports` - Fetch error reports (Super Admin only)
- `PATCH /api/error-reports/[id]` - Update error report status (Super Admin only)
- `DELETE /api/error-reports/[id]` - Delete error report (Super Admin only)

**Database Schema:**
```prisma
model ErrorReport {
  id            String   @id @default(uuid())
  userId        String
  title         String
  description   String   @db.Text
  severity      String   // 'low', 'medium', 'high', 'critical'
  status        String   @default("open") // 'open', 'in_progress', 'resolved', 'closed'
  page          String?
  stackTrace    String?  @db.Text
  userAgent     String?  @db.Text
  ipAddress     String?
  resolvedById  String?
  resolvedAt    DateTime?
  resolution    String?  @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 3. Server Monitoring Dashboard

Real-time server monitoring with automatic refresh every 10 seconds.

**Metrics Tracked:**
- **CPU Usage:** Percentage and core count
- **Memory Usage:** Total, used, and percentage
- **Database Status:** Connection count, query time, health status
- **System Uptime:** Server uptime in a human-readable format

**Features:**
- Only visible to Admins and Super Admins
- Auto-refresh every 10 seconds with visual indicator
- Color-coded metrics (green = healthy, yellow = warning, red = critical)
- Progress bars for visual representation of usage

**API Endpoint:**
- `GET /api/monitoring/metrics` - Fetch current server metrics (Admin/Super Admin only)

**Database Schema (for historical tracking):**
```prisma
model ServerMetrics {
  id                String   @id @default(uuid())
  cpuUsage          Float
  cpuCount          Int?
  memoryTotal       Float
  memoryUsed        Float
  memoryUsagePercent Float
  dbConnections     Int?
  dbQueryTime       Float?
  dbStatus          String   @default("healthy")
  apiLatency        Float?
  apiErrorRate      Float?
  apiRequestCount   Int?
  uptime            Float?
  diskUsage         Float?
  timestamp         DateTime @default(now())
}
```

### 4. Scheduled Server Actions

System for scheduling automated server tasks with cron-like recurring schedules or one-time execution.

**Features:**
- **Task Types:** backup, cleanup, ban, unban, custom
- **Schedule Types:** 
  - **Once:** One-time execution at a specific date/time
  - **Recurring:** Cron expression-based recurring tasks
- **Task Management:** Create, edit, pause, and delete tasks
- **Status Tracking:** active, paused, completed, failed
- **Execution History:** Track last run, next run, and execution count

**API Endpoints:**
- `POST /api/scheduled-tasks` - Create a new scheduled task (Admin/Super Admin only)
- `GET /api/scheduled-tasks` - Fetch scheduled tasks (Admin/Super Admin only)
- `PATCH /api/scheduled-tasks/[id]` - Update scheduled task (Admin/Super Admin only)
- `DELETE /api/scheduled-tasks/[id]` - Delete scheduled task (Admin/Super Admin only)

**Database Schema:**
```prisma
model ScheduledTask {
  id            String   @id @default(uuid())
  userId        String
  name          String
  description   String?  @db.Text
  taskType      String   // 'backup', 'cleanup', 'ban', 'unban', 'custom'
  status        String   @default("active") // 'active', 'paused', 'completed', 'failed'
  scheduleType  String   // 'once', 'recurring'
  cronExpression String?
  scheduledFor  DateTime?
  lastRunAt     DateTime?
  nextRunAt     DateTime?
  config        String?  @db.Text
  executionCount Int     @default(0)
  lastResult    String?  @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 5. UI/UX Enhancements

**New Components:**
- **Toast Notifications:** Success/error/info/warning notifications that auto-dismiss
- **Loading Spinners:** Visual feedback during data loading
- **Modal Dialog:** Reusable modal for forms and content
- **Error Report Modal:** Specialized modal for submitting error reports

**Improvements:**
- Smooth animations for toast notifications and modals
- Loading spinners replace static "Loading..." text
- Visual feedback for all user actions
- Better error messages with actionable information
- Custom scrollbar styling for better aesthetics

## 🔐 Permissions

| Feature | Super Admin | Admin | Moderator | User |
|---------|-------------|-------|-----------|------|
| Submit Error Reports | ✅ | ✅ | ✅ | ❌ |
| View Error Reports | ✅ | ❌ | ❌ | ❌ |
| Manage Error Reports | ✅ | ❌ | ❌ | ❌ |
| View Server Monitoring | ✅ | ✅ | ❌ | ❌ |
| View Scheduled Tasks | ✅ | ✅ | ❌ | ❌ |
| Create/Edit/Delete Tasks | ✅ | ✅ | ❌ | ❌ |
| View Activity Logs | ✅ | ❌ | ✅ | ❌ |

## 📱 Navigation

New navigation links have been added to the dashboard:

- **🐛 Error Reports** (Super Admin only) - `/error-reports`
- **⏰ Tasks** (Admin/Super Admin) - `/scheduled-tasks`
- **🐛 Report Issue** button in header (All authenticated users)

## 🚀 Usage

### Submitting an Error Report

1. Click the "🐛 Report Issue" button in the dashboard header
2. Fill in the form:
   - **Title:** Brief description of the issue
   - **Description:** Detailed explanation of what happened
   - **Severity:** low, medium, high, or critical
   - **Page:** Optional, auto-filled with current page
3. Click "Submit Report"
4. Success notification will appear

### Managing Error Reports (Super Admin)

1. Navigate to `/error-reports` or click "🐛 Error Reports" in navigation
2. Use filters to find specific reports
3. Click "Update" on a report to change its status
4. Add resolution notes when marking as resolved
5. Click status buttons: "In Progress", "Resolve", or "Close"

### Viewing Server Monitoring

1. Server monitoring panel is automatically displayed on the dashboard
2. Metrics refresh every 10 seconds automatically
3. Color indicators show health status:
   - 🟢 Green: Healthy
   - 🟡 Yellow: Warning
   - 🔴 Red: Critical

### Creating Scheduled Tasks

1. Navigate to `/scheduled-tasks` or click "⏰ Tasks" in navigation
2. Click "Create Task" button
3. Fill in the form:
   - **Name:** Task name
   - **Description:** Optional description
   - **Task Type:** backup, cleanup, ban, unban, or custom
   - **Schedule Type:** once or recurring
   - **Schedule:** Date/time for "once" or cron expression for "recurring"
   - **Status:** active or paused
4. Click "Create Task"

### Editing/Deleting Scheduled Tasks

1. Navigate to `/scheduled-tasks`
2. Click "Edit" on a task to modify it
3. Click "Delete" on a task to remove it (with confirmation)

## 🔧 Technical Details

### Component Architecture

```
src/
├── components/
│   ├── ErrorReportModal.tsx    # Modal for submitting error reports
│   ├── Modal.tsx                # Generic reusable modal
│   ├── ServerMonitoringPanel.tsx # Real-time server monitoring widget
│   ├── Spinner.tsx              # Loading spinner
│   └── Toast.tsx                # Toast notifications
├── pages/
│   ├── dashboard.tsx            # Enhanced with new widgets
│   ├── error-reports/
│   │   └── index.tsx           # Error reports management
│   └── scheduled-tasks/
│       └── index.tsx           # Scheduled tasks management
└── pages/api/
    ├── error-reports/
    │   ├── index.ts            # CRUD for error reports
    │   └── [id].ts             # Update/delete specific report
    ├── monitoring/
    │   └── metrics.ts          # Server metrics endpoint
    └── scheduled-tasks/
        ├── index.ts            # CRUD for scheduled tasks
        └── [id].ts             # Update/delete specific task
```

### Database Migrations

After pulling these changes, run:

```bash
npx prisma generate
npx prisma db push
```

This will:
1. Generate the updated Prisma client with new models
2. Push the schema changes to the database

### Environment Variables

No new environment variables are required. All features use existing authentication and database configuration.

## 🧪 Testing

### Manual Testing Checklist

- [ ] Submit an error report as a regular user
- [ ] View and manage error reports as Super Admin
- [ ] Update error report status
- [ ] View server monitoring metrics on dashboard
- [ ] Verify metrics refresh every 10 seconds
- [ ] Create a one-time scheduled task
- [ ] Create a recurring scheduled task with cron expression
- [ ] Edit a scheduled task
- [ ] Delete a scheduled task
- [ ] Test all filters on error reports page
- [ ] Test all filters on scheduled tasks page
- [ ] Verify permissions for each role

### API Testing

Use tools like Postman or curl to test API endpoints:

```bash
# Submit error report
curl -X POST http://localhost:3000/apanel44/api/error-reports \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Error","description":"Test description","severity":"medium"}'

# Get server metrics
curl http://localhost:3000/apanel44/api/monitoring/metrics

# Create scheduled task
curl -X POST http://localhost:3000/apanel44/api/scheduled-tasks \
  -H "Content-Type: application/json" \
  -d '{"name":"Daily Backup","taskType":"backup","scheduleType":"recurring","cronExpression":"0 0 * * *"}'
```

## 📝 Notes

- Server monitoring uses Node.js built-in `os` module for system metrics
- Cron expressions follow standard cron format (minute hour day month weekday)
- Error reports are never automatically deleted - Super Admins must manage them
- Scheduled tasks are not automatically executed - this requires a separate task runner implementation
- All timestamps are stored in UTC in the database
- The dashboard shows a maximum of 5 recent error reports

## 🔒 Security Considerations

- All API endpoints are protected with authentication middleware
- Permission checks are performed server-side
- IP addresses and user agents are logged for audit purposes
- Super Admin permission is required for sensitive operations
- All user inputs are validated before database insertion
- Database queries use Prisma ORM to prevent SQL injection

## 🐛 Known Limitations

1. **Task Execution:** The scheduled tasks system does not include automatic task execution. A separate cron job or task runner would need to be implemented to actually execute the scheduled tasks.

2. **Historical Metrics:** Server metrics are collected on-demand. Historical tracking would require periodic saves to the `ServerMetrics` table.

3. **Disk Usage:** Disk usage metric is not yet implemented in the monitoring panel.

4. **API Metrics:** API latency, error rate, and request count are placeholder values and require actual implementation with middleware tracking.

## 🚀 Future Enhancements

1. Implement actual task execution engine
2. Add email notifications for critical errors
3. Add graphs/charts for server metrics over time
4. Add ability to attach screenshots to error reports
5. Implement real-time notifications using WebSockets
6. Add export functionality for logs and reports
7. Implement automated alerts for critical server metrics
8. Add dashboard widgets for scheduled task status
