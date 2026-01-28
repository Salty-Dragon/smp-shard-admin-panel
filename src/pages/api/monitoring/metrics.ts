/**
 * API endpoint for server monitoring metrics
 * GET: Fetch current server metrics (Admin/Super Admin only)
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import os from 'os';
import { getPlayerCount } from '@/lib/minecraft';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Only Super Admins and Admins can view server metrics
      if (req.user.role !== 'Super Admin' && req.user.role !== 'Admin') {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only Admins can view server metrics'
        });
      }

      // Log the metrics fetch attempt
      console.log('[Metrics API] Fetching server metrics...');

      // Collect system metrics
      const metrics = await collectMetrics();

      console.log('[Metrics API] Metrics collected successfully:', {
        cpuUsage: metrics.cpuUsage,
        memoryUsagePercent: metrics.memoryUsagePercent,
        playerCount: metrics.playerCount,
        dbStatus: metrics.dbStatus,
      });

      // Optionally save to database for historical tracking
      const { saveHistory } = req.query;
      if (saveHistory === 'true') {
        await prisma.serverMetrics.create({
          data: metrics,
        });
        console.log('[Metrics API] Metrics saved to database for historical tracking');
      }

      return res.status(200).json({ metrics });
    } catch (error) {
      console.error('[Metrics API] Error fetching server metrics:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch server metrics'
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
      const result: any = await prisma.$queryRaw`SHOW STATUS WHERE Variable_name = 'Threads_connected'`;
      if (result && result.length > 0) {
        dbConnections = parseInt(result[0].Value);
      }
    } catch (e) {
      // Connection count not available
    }
  } catch (error) {
    dbStatus = 'down';
    console.error('Database health check failed:', error);
  }

  // API metrics (placeholder - would need actual implementation)
  const apiLatency = 0; // Would track actual API response times
  const apiErrorRate = 0; // Would track error rate
  const apiRequestCount = 0; // Would track request count

  // System uptime
  const uptime = os.uptime();
  
  // Player count from Minecraft server
  // This will return 0 if server is offline or unreachable
  console.log('[Metrics] Fetching Minecraft player count...');
  const playerCount = await getPlayerCount();
  console.log(`[Metrics] Player count retrieved: ${playerCount}`);

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
    playerCount,
  };
}

export default withAuth(handler);
