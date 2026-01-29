# Quick Start: Resolving P3005 Migration Error

## Problem
When running `npx prisma migrate deploy`, you encounter:
```
Error: P3005
The database schema is not empty.
```

## Quick Solution

### Option 1: Automated Script (Recommended)
```bash
bash scripts/baseline-migration.sh
```
This interactive script will:
- Check your database connection
- Detect if migration changes already exist
- Recommend the appropriate action (baseline or deploy)
- Execute the chosen action with your confirmation

### Option 2: Manual Command

**If your database already has the changes** (Settings table and ServerMetrics optimization columns exist):
```bash
npx prisma migrate resolve --applied "20260129141003_add_metrics_optimization_and_settings"
```

**If your database doesn't have the changes yet**:
```bash
npx prisma migrate deploy
```

### Option 3: Use db push (Development Only)
For development environments, you can skip migrations entirely:
```bash
npx prisma db push
```

## Verify Success
```bash
npx prisma migrate status
```
Should show: "Database schema is up to date!"

## Full Documentation
For comprehensive information, troubleshooting, and best practices, see:
- [MIGRATION_BASELINE_GUIDE.md](./MIGRATION_BASELINE_GUIDE.md) - Complete guide
- [README.md](./README.md#database-management) - Database management section
- [METRICS_OPTIMIZATION_GUIDE.md](./METRICS_OPTIMIZATION_GUIDE.md) - Context for this migration

## What Changed
This PR adds:
1. `prisma/migrations/migration_lock.toml` - Required for migration tracking
2. `MIGRATION_BASELINE_GUIDE.md` - Comprehensive guide for P3005 error
3. `scripts/baseline-migration.sh` - Automated baseline helper script
4. Updated documentation in README.md, DATABASE_SETUP_FIX.md, and METRICS_OPTIMIZATION_GUIDE.md

## Future Migrations
Going forward, this project uses Prisma migrations. For:
- **Development**: `npx prisma db push` (quick iteration)
- **Production**: `npx prisma migrate deploy` (tracked changes)

When creating new migrations:
```bash
npx prisma migrate dev --name descriptive_name
```
