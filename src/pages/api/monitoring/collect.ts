/**
 * API endpoint for automated metrics collection
 * GET: Collect and save current metrics to database
 * This endpoint can be called by cron jobs or external schedulers
 * 
 * Usage: Add this to your crontab to collect metrics every 5 minutes:
 * (cron pattern: every 5 minutes) curl -X GET "http://localhost:3000/apanel44/api/monitoring/collect?token=YOUR_SECRET_TOKEN" >> /var/log/metrics-collection.log 2>&1
 */

import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import os from 'os';
import { promises as fs } from 'fs';
import { getServerStatus } from '@/lib/minecraft';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Simple token-based authentication for automated calls
      const { token } = req.query;
      const expectedToken = process.env.METRICS_COLLECTION_TOKEN || process.env.DEBUG_TOKEN;
      
      if (!expectedToken) {
        console.error('[Metrics Collection] METRICS_COLLECTION_TOKEN not configured');
        return res.status(500).json({ 
          error: 'Configuration error',
          message: 'Metrics collection token not configured'
        });
      }
      
      if (token !== expectedToken) {
        console.error('[Metrics Collection] Invalid token provided');
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Invalid or missing token'
        });
      }

      console.log('[Metrics Collection] Starting automated metrics collection...');

      // Collect system metrics
      const metrics = await collectMetrics();

      // Save to database
      try {
        await prisma.serverMetrics.create({
          data: metrics,
        });
        console.log('[Metrics Collection] Metrics saved successfully:', {
          cpuUsage: metrics.cpuUsage,
          memoryUsagePercent: metrics.memoryUsagePercent,
          playerCount: metrics.playerCount,
          serverOnline: metrics.serverOnline,
          dbStatus: metrics.dbStatus,
        });
      } catch (saveError) {
        console.error('[Metrics Collection] Error saving metrics to database:', saveError);
        return res.status(500).json({ 
          error: 'Database error',
          message: 'Failed to save metrics to database'
        });
      }

      return res.status(200).json({ 
        success: true,
        message: 'Metrics collected and saved successfully',
        timestamp: new Date().toISOString(),
        metrics: {
          cpuUsage: metrics.cpuUsage,
          memoryUsagePercent: metrics.memoryUsagePercent,
          playerCount: metrics.playerCount,
          serverOnline: metrics.serverOnline,
        }
      });
    } catch (error) {
      console.error('[Metrics Collection] Error during automated collection:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to collect metrics'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function collectMetrics() {
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
    console.error('[Metrics Collection] Database health check failed:', error);
  }

  // API metrics (placeholder - would need actual implementation)
  const apiLatency = 0;
  const apiErrorRate = 0;
  const apiRequestCount = 0;

  // System uptime
  const uptime = os.uptime();
  
  // Disk usage metrics
  let diskUsage = 0;
  try {
    // Try to get disk usage from /proc/diskstats on Linux
    const stats = await fs.statfs('/');
    const total = stats.blocks * stats.bsize;
    const free = stats.bfree * stats.bsize;
    diskUsage = ((total - free) / total) * 100;
  } catch {
    // Disk usage will remain 0 if we can't fetch it
  }
  
  // Player count and server status from Minecraft server
  let playerCount = 0;
  let serverOnline = false;
  
  try {
    const status = await getServerStatus();
    playerCount = status.playerCount;
    serverOnline = status.online;
  } catch {
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
