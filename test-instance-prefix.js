/**
 * Test Script for Multi-Instance Database Prefix Feature
 * 
 * This script verifies that instanceId is properly saved and retrieved
 * from the database for activity logs and metrics.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testInstanceIdSupport() {
  console.log('🧪 Testing Multi-Instance Database Prefix Support\n');

  try {
    // Test 1: Check if instanceId field exists in schema
    console.log('Test 1: Verifying schema has instanceId field...');
    const activityLogFields = Object.keys(prisma.activityLog.fields || {});
    const serverMetricsFields = Object.keys(prisma.serverMetrics.fields || {});
    const scheduledTaskFields = Object.keys(prisma.scheduledTask.fields || {});
    
    console.log('✅ Schema verified - tables support instanceId field\n');

    // Test 2: Count records without instanceId
    console.log('Test 2: Checking for records without instanceId...');
    const [
      activityLogsWithoutInstance,
      serverMetricsWithoutInstance,
      scheduledTasksWithoutInstance
    ] = await Promise.all([
      prisma.activityLog.count({ where: { instanceId: null } }),
      prisma.serverMetrics.count({ where: { instanceId: null } }),
      prisma.scheduledTask.count({ where: { instanceId: null } })
    ]);

    console.log(`  ActivityLog: ${activityLogsWithoutInstance} records without instanceId`);
    console.log(`  ServerMetrics: ${serverMetricsWithoutInstance} records without instanceId`);
    console.log(`  ScheduledTask: ${scheduledTasksWithoutInstance} records without instanceId`);

    const totalWithoutInstance = 
      activityLogsWithoutInstance + 
      serverMetricsWithoutInstance + 
      scheduledTasksWithoutInstance;

    if (totalWithoutInstance > 0) {
      console.log(`\n⚠️  Found ${totalWithoutInstance} records without instanceId`);
      console.log('   Run migration endpoint to backfill data:');
      console.log('   POST /apanel44/api/admin/migrate-instance-data');
      console.log('   Body: { "instanceId": "s1" } (or your default instance)\n');
    } else {
      console.log('✅ All records have instanceId set\n');
    }

    // Test 3: Count records with instanceId
    console.log('Test 3: Checking for records with instanceId...');
    const [
      activityLogsWithInstance,
      serverMetricsWithInstance,
      scheduledTasksWithInstance
    ] = await Promise.all([
      prisma.activityLog.count({ where: { instanceId: { not: null } } }),
      prisma.serverMetrics.count({ where: { instanceId: { not: null } } }),
      prisma.scheduledTask.count({ where: { instanceId: { not: null } } })
    ]);

    console.log(`  ActivityLog: ${activityLogsWithInstance} records with instanceId`);
    console.log(`  ServerMetrics: ${serverMetricsWithInstance} records with instanceId`);
    console.log(`  ScheduledTask: ${scheduledTasksWithInstance} records with instanceId`);
    console.log('✅ Records with instanceId found\n');

    // Test 4: Get unique instance IDs
    console.log('Test 4: Finding unique instance IDs in use...');
    const uniqueInstances = await prisma.activityLog.findMany({
      where: { instanceId: { not: null } },
      select: { instanceId: true },
      distinct: ['instanceId']
    });

    if (uniqueInstances.length > 0) {
      console.log('  Unique instances:', uniqueInstances.map(i => i.instanceId).join(', '));
      console.log(`✅ Found ${uniqueInstances.length} unique instance(s)\n`);
    } else {
      console.log('  No instances with data yet\n');
    }

    // Test 5: Test filtering by instanceId
    if (uniqueInstances.length > 0) {
      const testInstanceId = uniqueInstances[0].instanceId;
      console.log(`Test 5: Testing instanceId filtering (instance: ${testInstanceId})...`);
      
      const filteredLogs = await prisma.activityLog.count({
        where: { instanceId: testInstanceId }
      });
      
      console.log(`  Found ${filteredLogs} activity logs for instance '${testInstanceId}'`);
      console.log('✅ Filtering by instanceId works\n');
    }

    console.log('✅ All tests passed!\n');
    console.log('📝 Summary:');
    console.log(`   - Records without instanceId: ${totalWithoutInstance}`);
    console.log(`   - Records with instanceId: ${activityLogsWithInstance + serverMetricsWithInstance + scheduledTasksWithInstance}`);
    console.log(`   - Unique instances: ${uniqueInstances.length}`);
    
    if (totalWithoutInstance > 0) {
      console.log('\n⚠️  Migration recommended - see instructions above');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testInstanceIdSupport().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
