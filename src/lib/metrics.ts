/**
 * Metrics Collection Utility
 * Shared functions for collecting server metrics
 */

import prisma from './prisma';
import os from 'os';
import { promises as fs } from 'fs';
import { getServerStatus } from './minecraft';

/**
 * Collect comprehensive server metrics
 * @param instanceId - Optional server instance ID
 * @returns Promise with metrics data
 */
export async function collectMetrics(instanceId?: string) {
  // CPU metrics
  const cpus = os.cpus();
  const cpuCount = cpus.length;
  
  // Calculate CPU usage (simple approximation)
  let totalIdle = 0;
  let totalTick = 0;
  
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  }
  
  const cpuUsage = 100 - (totalIdle / totalTick) * 100;

  // Memory metrics
  const totalMemory = os.totalmem() / (1024 * 1024 * 1024); // Convert to GB
  const freeMemory = os.freemem() / (1024 * 1024 * 1024);
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;

  // Database metrics (try to get from Prisma)
  let dbConnections = 0;
  let dbQueryTime = 0;
  let dbStatus = 'healthy';
  
  try {
    // Test database connection
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbQueryTime = Date.now() - startTime;
    
    // Try to get connection count (MySQL specific)
    try {
      const result: { Variable_name: string; Value: string }[] = await prisma.$queryRaw`SHOW STATUS WHERE Variable_name = 'Threads_connected'`;
      if (result && result.length > 0) {
        dbConnections = parseInt(result[0].Value);
      }
    } catch {
      // Connection count not available
    }
  } catch (error) {
    dbStatus = 'down';
    console.error('[Metrics] Database health check failed:', error);
  }

  // API metrics (placeholder - would need actual implementation)
  const apiLatency = 0;
  const apiErrorRate = 0;
  const apiRequestCount = 0;

  // System uptime
  const uptime = os.uptime();
  
  // Disk usage metrics using statfs system call
  let diskUsage = 0;
  try {
    const stats = await fs.statfs('/');
    const total = stats.blocks * stats.bsize;
    const free = stats.bfree * stats.bsize;
    diskUsage = ((total - free) / total) * 100;
  } catch (error) {
    console.log('[Metrics] Could not fetch disk usage:', error);
    // Disk usage will remain 0 if we can't fetch it
  }
  
  // Player count and server status from Minecraft server
  console.log(`[Metrics] Fetching Minecraft server status for instance: ${instanceId || 'default'}`);
  let playerCount = 0;
  let serverOnline = false;
  
  try {
    const status = await getServerStatus(instanceId);
    playerCount = status.playerCount;
    serverOnline = status.online;
    console.log(`[Metrics] Server status: ${serverOnline ? 'ONLINE' : 'OFFLINE'}, Players: ${playerCount}`);
  } catch (error) {
    console.error('[Metrics] Error fetching server status:', error);
    // playerCount and serverOnline will remain at defaults
  }

  return {
    cpuUsage: parseFloat(cpuUsage.toFixed(2)),
    cpuCount,
    memoryTotal: parseFloat(totalMemory.toFixed(2)),
    memoryUsed: parseFloat(usedMemory.toFixed(2)),
    memoryUsagePercent: parseFloat(memoryUsagePercent.toFixed(2)),
    dbConnections,
    dbQueryTime: parseFloat(dbQueryTime.toFixed(2)),
    dbStatus,
    apiLatency,
    apiErrorRate,
    apiRequestCount,
    uptime: parseFloat(uptime.toFixed(2)),
    diskUsage: parseFloat(diskUsage.toFixed(2)),
    playerCount,
    serverOnline,
  };
}
