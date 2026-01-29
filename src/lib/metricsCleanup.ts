/**
 * Metrics Cleanup and Aggregation Utility
 * Handles data retention and aggregation for historical metrics
 */

import prisma from './prisma';
import { getMetricsSettings } from './settings';

/**
 * Delete old metrics data based on retention policy
 */
export async function cleanupOldMetrics(): Promise<{ deletedCount: number }> {
  try {
    const settings = await getMetricsSettings();
    
    if (!settings.dataRetentionDays || settings.dataRetentionDays <= 0) {
      console.log('[Cleanup] Data retention is disabled or invalid');
      return { deletedCount: 0 };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - settings.dataRetentionDays);

    console.log(`[Cleanup] Deleting metrics older than ${cutoffDate.toISOString()}`);

    // Delete old raw (non-aggregated) metrics
    const result = await prisma.serverMetrics.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
        isAggregated: false,
      },
    });

    console.log(`[Cleanup] Deleted ${result.count} old metric records`);

    return { deletedCount: result.count };
  } catch (error) {
    console.error('[Cleanup] Error cleaning up old metrics:', error);
    throw error;
  }
}

/**
 * Aggregate old metrics data into hourly/daily summaries
 */
export async function aggregateOldMetrics(): Promise<{ aggregatedCount: number }> {
  try {
    const settings = await getMetricsSettings();
    
    if (!settings.aggregationEnabled) {
      console.log('[Aggregation] Aggregation is disabled');
      return { aggregatedCount: 0 };
    }

    const aggregationDate = new Date();
    aggregationDate.setDate(aggregationDate.getDate() - settings.aggregationThresholdDays);

    console.log(`[Aggregation] Aggregating metrics older than ${aggregationDate.toISOString()}`);

    // Get hourly buckets of data that need aggregation
    const oldMetrics = await prisma.serverMetrics.findMany({
      where: {
        timestamp: {
          lt: aggregationDate,
        },
        isAggregated: false,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (oldMetrics.length === 0) {
      console.log('[Aggregation] No metrics to aggregate');
      return { aggregatedCount: 0 };
    }

    // Group metrics by hour
    const hourlyBuckets = new Map<string, typeof oldMetrics>();
    
    for (const metric of oldMetrics) {
      const hourKey = new Date(metric.timestamp);
      hourKey.setMinutes(0, 0, 0);
      const key = hourKey.toISOString();
      
      if (!hourlyBuckets.has(key)) {
        hourlyBuckets.set(key, []);
      }
      hourlyBuckets.get(key)!.push(metric);
    }

    let aggregatedCount = 0;

    // Create aggregated records for each hour
    for (const [hourKey, metrics] of hourlyBuckets) {
      // Calculate averages
      const avgCpuUsage = metrics.reduce((sum, m) => sum + m.cpuUsage, 0) / metrics.length;
      const avgMemoryUsagePercent = metrics.reduce((sum, m) => sum + m.memoryUsagePercent, 0) / metrics.length;
      const avgDiskUsage = metrics.reduce((sum, m) => sum + (m.diskUsage || 0), 0) / metrics.length;
      const avgPlayerCount = metrics.reduce((sum, m) => sum + (m.playerCount || 0), 0) / metrics.length;
      
      // Use the first metric's static values (these don't change much)
      const firstMetric = metrics[0];
      
      // Count how many times server was online in this hour
      const onlineCount = metrics.filter(m => m.serverOnline).length;
      const serverOnlinePct = onlineCount / metrics.length;

      try {
        // Create aggregated record
        await prisma.serverMetrics.create({
          data: {
            cpuUsage: parseFloat(avgCpuUsage.toFixed(2)),
            cpuCount: firstMetric.cpuCount,
            memoryTotal: firstMetric.memoryTotal,
            memoryUsed: parseFloat((firstMetric.memoryTotal * avgMemoryUsagePercent / 100).toFixed(2)),
            memoryUsagePercent: parseFloat(avgMemoryUsagePercent.toFixed(2)),
            dbConnections: firstMetric.dbConnections,
            dbQueryTime: firstMetric.dbQueryTime,
            dbStatus: firstMetric.dbStatus,
            apiLatency: firstMetric.apiLatency,
            apiErrorRate: firstMetric.apiErrorRate,
            apiRequestCount: firstMetric.apiRequestCount,
            uptime: firstMetric.uptime,
            diskUsage: parseFloat(avgDiskUsage.toFixed(2)),
            playerCount: Math.round(avgPlayerCount),
            serverOnline: serverOnlinePct > 0.5, // Server was online more than 50% of the time
            timestamp: new Date(hourKey),
            isAggregated: true,
            aggregationPeriod: 'hourly',
          },
        });

        // Delete the raw metrics that were aggregated
        const metricIds = metrics.map(m => m.id);
        await prisma.serverMetrics.deleteMany({
          where: {
            id: {
              in: metricIds,
            },
          },
        });

        aggregatedCount += metrics.length;
      } catch (error) {
        console.error(`[Aggregation] Error aggregating metrics for hour ${hourKey}:`, error);
      }
    }

    console.log(`[Aggregation] Aggregated ${aggregatedCount} metric records into ${hourlyBuckets.size} hourly summaries`);

    return { aggregatedCount };
  } catch (error) {
    console.error('[Aggregation] Error aggregating metrics:', error);
    throw error;
  }
}

/**
 * Run full cleanup and aggregation process
 */
export async function runMetricsMaintenanceTask(): Promise<{ 
  aggregatedCount: number; 
  deletedCount: number; 
}> {
  console.log('[Maintenance] Starting metrics maintenance task...');
  
  try {
    // First aggregate old data
    const { aggregatedCount } = await aggregateOldMetrics();
    
    // Then cleanup very old data
    const { deletedCount } = await cleanupOldMetrics();
    
    console.log(`[Maintenance] Maintenance complete. Aggregated: ${aggregatedCount}, Deleted: ${deletedCount}`);
    
    return { aggregatedCount, deletedCount };
  } catch (error) {
    console.error('[Maintenance] Error during maintenance task:', error);
    throw error;
  }
}
