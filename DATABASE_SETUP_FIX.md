# Database Setup and Migration Fix

This document explains how to fix the Prisma database issues, specifically the "ErrorReport table does not exist" error.

## Issue

The application encountered the following errors:
1. `The table 'ErrorReport' does not exist in the current database` (Prisma error code: `P2021`)
2. This happens when attempting to fetch error reports from the database

## Root Cause

The database schema defined in `prisma/schema.prisma` has not been synchronized with the actual database. The `ErrorReport` model exists in the schema but the corresponding table hasn't been created in the database.

## Solution

You need to sync your Prisma schema with your database by running database migrations.

### Step 1: Ensure Database is Running

Make sure your MariaDB/MySQL database is running and accessible.

### Step 2: Configure Database Connection

1. Copy `.env.example` to `.env` if you haven't already:
   ```bash
   cp .env.example .env
   ```

2. Update the `DATABASE_URL` in your `.env` file with your actual database credentials:
   ```
   DATABASE_URL="mysql://user:password@localhost:3306/smp_admin_panel"
   ```

### Step 3: Sync Prisma Schema with Database

Run the following command to push your schema to the database:

```bash
npx prisma db push
```

This command will:
- Create all missing tables (including `ErrorReport`, if it doesn't exist)
- Add any missing columns to existing tables
- Update the Prisma Client

**Important**: This is the recommended approach for this project. Do NOT use `prisma migrate dev` unless you want to start managing migrations explicitly.

### Step 4: (Optional) Seed the Database

If this is a fresh database, you should seed it with initial data:

```bash
npx ts-node prisma/seed.ts
```

Or using npm/npx:
```bash
npx prisma db seed
```

This will create:
- Three roles: Super Admin, Admin, and Moderator
- Default Super Admin user with credentials:
  - Email: `admin@smp-panel.local`
  - Password: `admin123`

### Step 5: Generate Prisma Client

If you encounter any issues, regenerate the Prisma Client:

```bash
npx prisma generate
```

### Step 6: Restart Your Application

After running the database sync:

```bash
npm run dev
```

## Verification

To verify that the ErrorReport table was created successfully:

1. Connect to your database:
   ```bash
   mysql -u user -p smp_admin_panel
   ```

2. List tables:
   ```sql
   SHOW TABLES;
   ```

3. Check the ErrorReport table structure:
   ```sql
   DESCRIBE ErrorReport;
   ```

You should see the ErrorReport table with all the columns defined in the schema.

## Alternative: Using Migrations (Advanced)

If you prefer to use migrations instead of `db push`, you can initialize migrations:

```bash
# Initialize migrations from current database state
npx prisma migrate dev --name init

# Or create a new migration from schema changes
npx prisma migrate dev --name add_error_reports
```

**Note**: Once you start using migrations, you should continue using them instead of `db push`.

## Common Issues

### Issue: "Can't reach database server"
- Check that your database is running
- Verify the DATABASE_URL in your .env file
- Ensure the database user has proper permissions

### Issue: "Database does not exist"
- Create the database manually:
  ```sql
  CREATE DATABASE smp_admin_panel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

### Issue: "Table already exists"
- If some tables exist but ErrorReport doesn't, `prisma db push` will only create missing tables
- This is the expected behavior and is safe to run

## Production Deployment

When deploying to production:

1. Ensure the production DATABASE_URL is set
2. Run `npx prisma db push` on the production server
3. Run the seed script if it's a fresh database
4. Restart the application

## Summary

The fix for the ErrorReport table issue is simple:

```bash
# 1. Configure your .env file
# 2. Push the schema to database
npx prisma db push

# 3. (Optional) Seed initial data
npx ts-node prisma/seed.ts

# 4. Restart your app
npm run dev
```

This will create all missing database tables and resolve the Prisma errors.
