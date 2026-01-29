/**
 * API endpoint for historical server monitoring metrics
 * GET: Fetch historical metrics data for charts and trends (Admin/Super Admin only)
 */

import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import prisma from '@/lib/prisma';

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

      const { 
        timeRange = '24h', 
        limit = '1000', // Increased from 100 to support longer time ranges with aggregated data
        startDate: customStart, 
        endDate: customEnd,
        includeAggregated = 'true'
      } = req.query;
      
      // Calculate the date range based on the timeRange parameter or custom dates
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;
      
      // If custom dates provided, use those instead
      if (customStart && customEnd) {
        startDate = new Date(customStart as string);
        endDate = new Date(customEnd as string);
        
        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({
            error: 'Invalid date format',
            message: 'Start date and end date must be valid ISO 8601 date strings'
          });
        }
        
        if (startDate > endDate) {
          return res.status(400).json({
            error: 'Invalid date range',
            message: 'Start date must be before end date'
          });
        }
      } else {
        switch (timeRange) {
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '24h':
          default:
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        }
      }

      // Determine if we should include aggregated data
      const shouldIncludeAggregated = includeAggregated !== 'false';
      
      // Build the where clause
      const whereClause: {
        timestamp: { gte: Date; lte: Date };
        isAggregated?: boolean;
      } = {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      };

      // If not including aggregated data, filter it out
      if (!shouldIncludeAggregated) {
        whereClause.isAggregated = false;
      }

      // Fetch historical metrics from database
      const metrics = await prisma.serverMetrics.findMany({
        where: whereClause,
        orderBy: {
          timestamp: 'asc',
        },
        take: parseInt(limit as string),
        select: {
          id: true,
          cpuUsage: true,
          memoryUsagePercent: true,
          diskUsage: true,
          playerCount: true,
          serverOnline: true,
          dbStatus: true,
          timestamp: true,
          isAggregated: true,
          aggregationPeriod: true,
        },
      });

      // If no historical data exists, return an empty array
      if (metrics.length === 0) {
        return res.status(200).json({ 
          metrics: [],
          count: 0,
          message: 'No historical data available for the selected time range.'
        });
      }

      // Calculate statistics
      const rawCount = metrics.filter(m => !m.isAggregated).length;
      const aggregatedCount = metrics.filter(m => m.isAggregated).length;

      return res.status(200).json({ 
        metrics,
        count: metrics.length,
        stats: {
          rawDataPoints: rawCount,
          aggregatedDataPoints: aggregatedCount,
          totalDataPoints: metrics.length,
        },
        message: metrics.length >= parseInt(limit as string) 
          ? `Showing first ${limit} records. For complete data, consider using a shorter time range.`
          : undefined
      });
    } catch (error) {
      console.error('[History API] Error fetching historical metrics:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Failed to fetch historical metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);
