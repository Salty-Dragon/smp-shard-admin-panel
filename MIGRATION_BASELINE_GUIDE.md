# Database Migration Baseline Guide

## Problem: P3005 Error - Database Schema Not Empty

If you encounter the following error when running `npx prisma migrate deploy`:

```
Error: P3005

The database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline
```

This means your database already has tables from previous work, but Prisma Migrate has not yet been initialized to track your migration history.

## Understanding the Issue

The `smp-shard-admin-panel` database was created and populated before migration tracking was enabled. The migration file in `prisma/migrations/20260129141003_add_metrics_optimization_and_settings/` was generated, but Prisma doesn't know if your database already has these changes applied or not.

## Solution: Baseline Your Database

Baselining tells Prisma Migrate that your database already has the schema changes from a specific migration, without actually running the migration SQL.

### Step 1: Check Migration Status

First, check the current status of your migrations:

```bash
npx prisma migrate status
```

This will show you which migrations Prisma thinks need to be applied.

### Step 2: Mark Migration as Already Applied

If your database already has the tables and columns from the migration `20260129141003_add_metrics_optimization_and_settings`, mark it as applied:

```bash
npx prisma migrate resolve --applied "20260129141003_add_metrics_optimization_and_settings"
```

This command:
- Records the migration in the `_prisma_migrations` table
- Does NOT run the actual SQL from the migration
- Tells Prisma that your database already has these changes

### Step 3: Verify the Status

Check the migration status again:

```bash
npx prisma migrate status
```

You should now see that all migrations are in sync.

### Step 4: Deploy Future Migrations

From now on, you can safely use `prisma migrate deploy` for new migrations:

```bash
npx prisma migrate deploy
```

## Alternative: If Database Doesn't Have the Changes

If your database does NOT have the changes from the migration yet (i.e., the `Settings` table doesn't exist, or `ServerMetrics` doesn't have `isAggregated` and `aggregationPeriod` columns), you have two options:

### Option 1: Use `db push` (Recommended for Development)

The simplest approach is to use `db push` which synchronizes your schema without using migrations:

```bash
npx prisma db push
```

This will:
- Apply all schema changes to your database
- NOT create migration history
- Be idempotent (safe to run multiple times)

**Note**: After using `db push`, if you want to start using migrations, you'll need to baseline as described above.

### Option 2: Drop and Recreate Migration History

**WARNING**: This approach requires manual verification of your database state.

1. Check what tables exist in your database:
   ```sql
   SHOW TABLES;
   ```

2. Check if `ServerMetrics` has the new columns:
   ```sql
   DESCRIBE ServerMetrics;
   ```

3. Check if `Settings` table exists:
   ```sql
   DESCRIBE Settings;
   ```

4. If the changes from the migration are missing:
   ```bash
   # This will run the migration SQL
   npx prisma migrate deploy
   ```

5. If you get the P3005 error but the changes ARE present:
   ```bash
   # Mark as applied without running SQL
   npx prisma migrate resolve --applied "20260129141003_add_metrics_optimization_and_settings"
   ```

## Verification Steps

After baselining or applying migrations, verify your database is in the correct state:

1. **Check the migrations table**:
   ```sql
   SELECT migration_name, finished_at, applied_steps_count 
   FROM _prisma_migrations 
   ORDER BY finished_at DESC;
   ```

2. **Verify schema matches**:
   ```bash
   npx prisma migrate status
   ```
   
   Should show: "Database schema is up to date!"

3. **Check that required tables exist**:
   ```sql
   SHOW TABLES;
   ```
   
   Should include: `User`, `Role`, `Permission`, `ActivityLog`, `ErrorReport`, `ScheduledTask`, `ServerMetrics`, `Settings`, `_prisma_migrations`

4. **Verify ServerMetrics columns**:
   ```sql
   DESCRIBE ServerMetrics;
   ```
   
   Should include columns: `isAggregated`, `aggregationPeriod`

## Best Practices for Future Development

### For Development Environments

Use `npx prisma db push` for quick schema changes during development:
```bash
npx prisma db push
```

### For Production/Staging Environments

Always use migrations for production:

1. **Create migration in development**:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```

2. **Commit migration files** to version control

3. **Deploy to production**:
   ```bash
   npx prisma migrate deploy
   ```

### Handling Existing Production Databases

When setting up Prisma Migrate on an existing production database:

1. **Create a baseline migration**:
   ```bash
   # Create migration without applying it
   npx prisma migrate dev --create-only --name baseline_existing_schema
   ```

2. **Empty the migration SQL file** (since schema already exists):
   ```bash
   # The migration.sql file should be empty or contain only comments
   echo "-- Baseline migration for existing database" > prisma/migrations/XXXXXX_baseline_existing_schema/migration.sql
   ```

3. **Mark as applied** on all databases:
   ```bash
   npx prisma migrate resolve --applied "XXXXXX_baseline_existing_schema"
   ```

4. **From now on**, create and deploy migrations normally

## Troubleshooting

### Error: "P1001: Can't reach database server"
- Check that your database is running
- Verify `DATABASE_URL` in your `.env` file
- Test database connection: `mysql -u user -p -h host database_name`

### Error: "Migration XXXXX failed to apply"
- Check the migration SQL for syntax errors
- Verify the database user has sufficient permissions
- Look at the error message for specific issues
- Consider rolling back: `npx prisma migrate resolve --rolled-back "XXXXX"`

### Migration marked as applied but database doesn't have changes
- You may have baselined incorrectly
- Check what's actually in your database with `SHOW TABLES` and `DESCRIBE table_name`
- If needed, manually apply the SQL from the migration file
- Or roll back and re-apply: 
  ```bash
  npx prisma migrate resolve --rolled-back "XXXXX"
  npx prisma migrate deploy
  ```

## Summary

For the current issue with `20260129141003_add_metrics_optimization_and_settings`:

```bash
# If your database already has the Settings table and ServerMetrics optimization columns:
npx prisma migrate resolve --applied "20260129141003_add_metrics_optimization_and_settings"

# If your database doesn't have these changes yet:
npx prisma migrate deploy

# Verify everything is in sync:
npx prisma migrate status
```

This resolves the P3005 error and allows you to use Prisma Migrate going forward.
