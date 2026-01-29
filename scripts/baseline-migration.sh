#!/bin/bash

# Database Migration Baseline Script
# This script helps baseline an existing database for Prisma Migrate

set -e

echo "================================================"
echo "Prisma Migration Baseline Helper"
echo "================================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.example to .env and configure your database connection."
    exit 1
fi

echo "✓ Found .env file"
echo ""

# Check if database connection works
echo "Checking database connection..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database!"
    echo "Please check your DATABASE_URL in .env file."
    exit 1
fi

echo "✓ Database connection successful"
echo ""

# Check migration status
echo "Checking current migration status..."
echo "================================================"
npx prisma migrate status || true
echo "================================================"
echo ""

# Get the migration name
MIGRATION_NAME="20260129141003_add_metrics_optimization_and_settings"

echo "This script will help you baseline the migration: $MIGRATION_NAME"
echo ""
echo "What does this migration add?"
echo "  1. ServerMetrics.isAggregated column"
echo "  2. ServerMetrics.aggregationPeriod column"
echo "  3. Indexes for ServerMetrics optimization"
echo "  4. Settings table"
echo ""

# Check if tables exist
echo "Checking if migration changes already exist in database..."
echo ""

# Check for Settings table
if npx prisma db execute --stdin <<< "SHOW TABLES LIKE 'Settings';" 2>/dev/null | grep -q "Settings"; then
    echo "✓ Settings table exists"
    SETTINGS_EXISTS=true
else
    echo "✗ Settings table does NOT exist"
    SETTINGS_EXISTS=false
fi

# Check for ServerMetrics columns
if npx prisma db execute --stdin <<< "SHOW COLUMNS FROM ServerMetrics LIKE 'isAggregated';" 2>/dev/null | grep -q "isAggregated"; then
    echo "✓ ServerMetrics.isAggregated column exists"
    COLUMNS_EXIST=true
else
    echo "✗ ServerMetrics.isAggregated column does NOT exist"
    COLUMNS_EXIST=false
fi

echo ""

# Determine what action to take
if [ "$SETTINGS_EXISTS" = true ] && [ "$COLUMNS_EXIST" = true ]; then
    echo "================================================"
    echo "RECOMMENDATION: Baseline the migration"
    echo "================================================"
    echo ""
    echo "Your database already has the changes from this migration."
    echo "You should mark it as applied WITHOUT running the SQL."
    echo ""
    echo "Command to run:"
    echo "  npx prisma migrate resolve --applied \"$MIGRATION_NAME\""
    echo ""
    read -p "Do you want to baseline this migration now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx prisma migrate resolve --applied "$MIGRATION_NAME"
        echo ""
        echo "✓ Migration baselined successfully!"
        echo ""
        echo "Checking updated status..."
        npx prisma migrate status
    else
        echo "Skipped. You can run the command manually later."
    fi
else
    echo "================================================"
    echo "RECOMMENDATION: Deploy the migration"
    echo "================================================"
    echo ""
    echo "Your database is missing some or all changes from this migration."
    echo "You should run the migration to apply the changes."
    echo ""
    echo "Command to run:"
    echo "  npx prisma migrate deploy"
    echo ""
    read -p "Do you want to deploy this migration now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx prisma migrate deploy
        echo ""
        echo "✓ Migration deployed successfully!"
        echo ""
        echo "Checking updated status..."
        npx prisma migrate status
    else
        echo "Skipped. You can run the command manually later."
    fi
fi

echo ""
echo "================================================"
echo "Next Steps"
echo "================================================"
echo ""
echo "1. Verify migration status: npx prisma migrate status"
echo "2. Check database tables: mysql -u user -p database_name -e 'SHOW TABLES;'"
echo "3. Review MIGRATION_BASELINE_GUIDE.md for detailed information"
echo ""
echo "For future schema changes:"
echo "  - Development: npx prisma db push"
echo "  - Production: npx prisma migrate deploy"
echo ""
